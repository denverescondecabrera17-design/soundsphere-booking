/**
 * SoundSphere - Database Backup & Restore Controller
 * Provides secure, lightweight JSON export and atomic transactional restore for Administrators.
 */

const { connectDB, sql } = require('../config/db');

// Tables ordered for safe extraction and restore
const BACKUP_TABLES = [
    'Roles',
    'Users',
    'Clients',
    'ServiceProviders',
    'Admins',
    'ProviderApplications',
    'Packages',
    'PackageImages',
    'Services',
    'Bookings',
    'Payments',
    'Reviews',
    'TransportationFees',
    'ClientWallets',
    'WalletTransactions',
    'Withdrawals',
    'ProviderReports',
    'ProviderSubscriptions',
    'SubscriptionPayments',
    'Notifications',
    'ActivityLogs'
];

/**
 * Helper: Check if a table exists in dbo schema
 */
async function tableExists(pool, tableName) {
    const res = await pool.request()
        .input('tableName', sql.NVarChar(128), tableName)
        .query(`
            SELECT 1 AS existsFlag 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @tableName
        `);
    return res.recordset.length > 0;
}

/**
 * Helper: Check if a table has an IDENTITY column
 */
async function hasIdentityColumn(pool, tableName) {
    const res = await pool.request()
        .input('tableName', sql.NVarChar(128), tableName)
        .query(`
            SELECT 1 AS hasId
            FROM sys.columns 
            WHERE object_id = OBJECT_ID('dbo.' + @tableName) AND is_identity = 1
        `);
    return res.recordset.length > 0;
}

/**
 * GET /api/admin/backup/status
 * Returns current table row counts and database health
 */
exports.getBackupStatus = async (req, res) => {
    try {
        const pool = await connectDB();
        const counts = {};
        let totalRecords = 0;

        for (const tableName of BACKUP_TABLES) {
            try {
                if (await tableExists(pool, tableName)) {
                    const countRes = await pool.request().query(`SELECT COUNT(*) AS rowCount FROM dbo.[${tableName}]`);
                    const count = countRes.recordset[0]?.rowCount || 0;
                    counts[tableName] = count;
                    totalRecords += count;
                } else {
                    counts[tableName] = 0;
                }
            } catch (err) {
                counts[tableName] = 0;
            }
        }

        return res.json({
            success: true,
            database: process.env.DB_NAME || 'SoundSphereDB',
            status: 'Connected',
            totalRecords,
            tableCounts: counts,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching backup status:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve database status: ' + error.message
        });
    }
};

/**
 * GET /api/admin/backup/export
 * Exports complete database tables to a downloadable JSON file
 */
exports.exportBackup = async (req, res) => {
    try {
        const pool = await connectDB();
        const exportData = {};
        const tableCounts = {};

        for (const tableName of BACKUP_TABLES) {
            try {
                if (await tableExists(pool, tableName)) {
                    const result = await pool.request().query(`SELECT * FROM dbo.[${tableName}]`);
                    exportData[tableName] = result.recordset || [];
                    tableCounts[tableName] = result.recordset.length;
                }
            } catch (err) {
                console.warn(`Could not export table dbo.[${tableName}]:`, err.message);
                exportData[tableName] = [];
                tableCounts[tableName] = 0;
            }
        }

        const backupPayload = {
            system: 'SoundSphere',
            backupType: 'Full JSON Snapshot',
            schemaVersion: '1.0',
            exportedAt: new Date().toISOString(),
            exportedBy: {
                userId: req.user?.userId || null,
                email: req.user?.email || 'admin@soundsphere.com'
            },
            summary: {
                totalTables: Object.keys(exportData).length,
                totalRecords: Object.values(tableCounts).reduce((a, b) => a + b, 0),
                tableCounts
            },
            data: exportData
        };

        // Log the activity
        try {
            await pool.request()
                .input('UserID', sql.Int, req.user?.userId || null)
                .input('Action', sql.NVarChar(100), 'DATABASE_BACKUP_EXPORT')
                .input('Description', sql.NVarChar(500), `Admin exported database backup (${backupPayload.summary.totalRecords} records)`)
                .query(`
                    IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.ActivityLogs (UserID, Action, Description)
                        VALUES (@UserID, @Action, @Description);
                    END
                `);
        } catch (logErr) {
            console.warn('Backup export activity log notice:', logErr.message);
        }

        const timestampStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `soundsphere_backup_${timestampStr}.json`;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(JSON.stringify(backupPayload, null, 2));

    } catch (error) {
        console.error('Error exporting database backup:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate backup: ' + error.message
        });
    }
};

/**
 * POST /api/admin/backup/restore
 * Restores database state from uploaded JSON payload with automatic rollback on error.
 */
exports.restoreBackup = async (req, res) => {
    let transaction = null;
    let pool = null;

    try {
        const backupPayload = req.body;

        // 1. Validate payload structure
        if (!backupPayload || !backupPayload.data || typeof backupPayload.data !== 'object') {
            return res.status(400).json({
                success: false,
                message: 'Invalid backup file format. Must be a valid SoundSphere JSON backup.'
            });
        }

        if (backupPayload.system !== 'SoundSphere') {
            return res.status(400).json({
                success: false,
                message: 'Incompatible backup file. System identifier must be "SoundSphere".'
            });
        }

        pool = await connectDB();
        const data = backupPayload.data;
        const restoredCounts = {};

        // 2. Begin SQL Transaction for atomic safety
        transaction = new sql.Transaction(pool);
        await transaction.begin();

        // 3. Temporarily disable foreign key constraints
        const fkQuery = await pool.request().query(`
            SELECT name, OBJECT_NAME(parent_object_id) AS TableName 
            FROM sys.foreign_keys;
        `);
        const foreignKeys = fkQuery.recordset || [];

        for (const fk of foreignKeys) {
            try {
                const reqDisable = new sql.Request(transaction);
                await reqDisable.query(`ALTER TABLE dbo.[${fk.TableName}] NOCHECK CONSTRAINT [${fk.name}];`);
            } catch (fkErr) {
                console.warn(`Could not disable constraint ${fk.name}:`, fkErr.message);
            }
        }

        // 4. Reverse order for cleaning tables safely
        const tablesToClear = [...BACKUP_TABLES].reverse();
        for (const tableName of tablesToClear) {
            if (data[tableName] && (await tableExists(pool, tableName))) {
                const reqDelete = new sql.Request(transaction);
                await reqDelete.query(`DELETE FROM dbo.[${tableName}];`);
            }
        }

        // 5. Restore tables in forward dependency order
        for (const tableName of BACKUP_TABLES) {
            const rows = data[tableName];
            if (!rows || !Array.isArray(rows) || rows.length === 0) {
                restoredCounts[tableName] = 0;
                continue;
            }

            if (!(await tableExists(pool, tableName))) {
                console.warn(`Table dbo.[${tableName}] does not exist on database, skipping restore.`);
                restoredCounts[tableName] = 0;
                continue;
            }

            const hasIdentity = await hasIdentityColumn(pool, tableName);

            // Enable IDENTITY_INSERT if table has identity column
            if (hasIdentity) {
                const reqIdOn = new sql.Request(transaction);
                await reqIdOn.query(`SET IDENTITY_INSERT dbo.[${tableName}] ON;`);
            }

            let insertedCount = 0;

            for (const row of rows) {
                const keys = Object.keys(row).filter(k => row[k] !== undefined);
                if (keys.length === 0) continue;

                const colsStr = keys.map(k => `[${k}]`).join(', ');
                const paramPlaceholders = keys.map((k, idx) => `@p${idx}`).join(', ');

                const reqInsert = new sql.Request(transaction);

                keys.forEach((key, idx) => {
                    let val = row[key];
                    // Format Date objects or ISO strings if necessary
                    if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
                        val = JSON.stringify(val);
                    }
                    reqInsert.input(`p${idx}`, val);
                });

                await reqInsert.query(`
                    INSERT INTO dbo.[${tableName}] (${colsStr})
                    VALUES (${paramPlaceholders});
                `);
                insertedCount++;
            }

            // Disable IDENTITY_INSERT
            if (hasIdentity) {
                const reqIdOff = new sql.Request(transaction);
                await reqIdOff.query(`SET IDENTITY_INSERT dbo.[${tableName}] OFF;`);
            }

            restoredCounts[tableName] = insertedCount;
        }

        // 6. Re-enable foreign key constraints
        for (const fk of foreignKeys) {
            try {
                const reqEnable = new sql.Request(transaction);
                await reqEnable.query(`ALTER TABLE dbo.[${fk.TableName}] WITH CHECK CHECK CONSTRAINT [${fk.name}];`);
            } catch (fkErr) {
                console.warn(`Could not re-enable constraint ${fk.name}:`, fkErr.message);
            }
        }

        // 7. Commit Transaction
        await transaction.commit();

        // 8. Log the restore activity
        try {
            await pool.request()
                .input('UserID', sql.Int, req.user?.userId || null)
                .input('Action', sql.NVarChar(100), 'DATABASE_RESTORE')
                .input('Description', sql.NVarChar(500), `Admin restored database from backup dated ${backupPayload.exportedAt || 'unknown'}`)
                .query(`
                    IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.ActivityLogs (UserID, Action, Description)
                        VALUES (@UserID, @Action, @Description);
                    END
                `);
        } catch (logErr) {
            console.warn('Backup restore activity log notice:', logErr.message);
        }

        const totalRestored = Object.values(restoredCounts).reduce((a, b) => a + b, 0);

        return res.json({
            success: true,
            message: `Database restored successfully! ${totalRestored} records across ${Object.keys(restoredCounts).length} tables restored.`,
            totalRestored,
            restoredCounts,
            restoredAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('Critical Error during database restore:', error);

        // Roll back transaction to preserve existing data safely
        if (transaction) {
            try {
                await transaction.rollback();
                console.log('Transaction safely rolled back - database intact.');
            } catch (rbErr) {
                console.error('Error during transaction rollback:', rbErr.message);
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Database restore failed and changes were safely rolled back: ' + error.message
        });
    }
};
