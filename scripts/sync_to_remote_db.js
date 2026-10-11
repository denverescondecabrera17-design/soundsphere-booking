/**
 * SoundSphere - Complete High-Fidelity Localhost to MonsterASP Sync
 */

const sql = require('mssql');
const { getOrConnectPool } = require('../server/config/db');

const remoteServer = process.argv[2] || 'db72897.public.databaseasp.net';
const remoteDatabase = process.argv[3] || 'db72897';
const remoteUser = process.argv[4] || 'db72897';
const remotePassword = process.argv[5] || 'o#7C?9Bb3Ei_';

const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (val instanceof Date) return `'${val.toISOString()}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
};

const tablesInOrder = [
    { name: 'Roles', pkey: 'RoleID', hasIdentity: true },
    { name: 'Users', pkey: 'UserID', hasIdentity: true },
    { name: 'Clients', pkey: 'ClientID', hasIdentity: true },
    { name: 'ServiceProviders', pkey: 'ProviderID', hasIdentity: true },
    { name: 'Packages', pkey: 'PackageID', hasIdentity: true },
    { name: 'PackageImages', pkey: 'ImageID', hasIdentity: true },
    { name: 'ProviderDateCapacity', pkey: 'CapacityID', hasIdentity: true },
    { name: 'Bookings', pkey: 'BookingID', hasIdentity: true },
    { name: 'Payments', pkey: 'PaymentID', hasIdentity: true },
    { name: 'ClientWallets', pkey: 'WalletID', hasIdentity: true },
    { name: 'WalletTransactions', pkey: 'TransactionID', hasIdentity: true },
    { name: 'Withdrawals', pkey: 'WithdrawalID', hasIdentity: true },
    { name: 'RefundRequests', pkey: 'RefundRequestID', hasIdentity: true },
    { name: 'Reviews', pkey: 'ReviewID', hasIdentity: true },
    { name: 'ProviderSubscriptions', pkey: 'SubscriptionID', hasIdentity: true },
    { name: 'SubscriptionPayments', pkey: 'PaymentID', hasIdentity: true },
    { name: 'TransportationFees', pkey: 'FeeID', hasIdentity: true },
    { name: 'Conversations', pkey: 'ConversationID', hasIdentity: true },
    { name: 'ConversationParticipants', pkey: 'ParticipantID', hasIdentity: true },
    { name: 'Messages', pkey: 'MessageID', hasIdentity: true },
    { name: 'Notifications', pkey: 'NotificationID', hasIdentity: true }
];

(async () => {
    console.log('🔄 Connecting to Localhost DB...');
    const localPool = await getOrConnectPool();
    console.log('✅ Localhost connected.');

    console.log(`🌐 Connecting to MonsterASP DB (${remoteServer})...`);
    const remotePool = await sql.connect({
        server: remoteServer,
        database: remoteDatabase,
        user: remoteUser,
        password: remotePassword,
        port: 1433,
        options: {
            encrypt: false,
            trustServerCertificate: true,
            enableArithAbort: true
        },
        connectionTimeout: 30000,
        requestTimeout: 120000
    });
    console.log('✅ MonsterASP connected.');

    // 1. Disable all Foreign Keys
    console.log('🔓 Disabling remote Foreign Key constraints...');
    const fksRes = await remotePool.request().query(`
        SELECT name, OBJECT_NAME(parent_object_id) AS TableName FROM sys.foreign_keys;
    `);
    for (const fk of fksRes.recordset) {
        try {
            await remotePool.request().query(`ALTER TABLE dbo.[${fk.TableName}] NOCHECK CONSTRAINT [${fk.name}];`);
        } catch (e) {}
    }

    // 2. Clear old dummy records from tables in reverse order
    console.log('🧹 Clearing initial dummy records from MonsterASP...');
    for (let i = tablesInOrder.length - 1; i >= 0; i--) {
        const t = tablesInOrder[i];
        try {
            await remotePool.request().query(`
                IF OBJECT_ID('dbo.[${t.name}]', 'U') IS NOT NULL
                BEGIN
                    DELETE FROM dbo.[${t.name}];
                END;
            `);
        } catch (delErr) {
            console.warn(`Notice deleting ${t.name}:`, delErr.message);
        }
    }

    // 3. Migrate each table from Localhost to MonsterASP
    console.log('🚀 Migrating localhost records into MonsterASP...');
    let totalMigrated = 0;

    for (const t of tablesInOrder) {
        try {
            // Check local table
            const lRowsRes = await localPool.request().query(`
                IF OBJECT_ID('dbo.[${t.name}]', 'U') IS NOT NULL
                    SELECT * FROM dbo.[${t.name}] ORDER BY [${t.pkey}] ASC;
                ELSE
                    SELECT 1 WHERE 1=0;
            `);
            const localRows = lRowsRes.recordset || [];
            if (localRows.length === 0) {
                console.log(`- dbo.[${t.name}]: 0 records to migrate.`);
                continue;
            }

            // Get remote schema columns
            const rColsRes = await remotePool.request().query(`
                SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t.name}';
            `);
            if (rColsRes.recordset.length === 0) {
                console.warn(`⚠️ Table dbo.[${t.name}] not found in MonsterASP.`);
                continue;
            }
            const remoteCols = new Set(rColsRes.recordset.map(c => c.COLUMN_NAME));
            const validCols = Object.keys(localRows[0]).filter(c => remoteCols.has(c));
            const colListStr = validCols.map(c => `[${c}]`).join(', ');

            // Build single batch query
            const statements = [];
            if (t.hasIdentity) {
                statements.push(`SET IDENTITY_INSERT dbo.[${t.name}] ON;`);
            }

            for (const row of localRows) {
                const valListStr = validCols.map(c => escapeSql(row[c])).join(', ');
                statements.push(`INSERT INTO dbo.[${t.name}] (${colListStr}) VALUES (${valListStr});`);
            }

            if (t.hasIdentity) {
                statements.push(`SET IDENTITY_INSERT dbo.[${t.name}] OFF;`);
            }

            const batchSql = statements.join('\n');
            await remotePool.request().batch(batchSql);

            totalMigrated += localRows.length;
            console.log(`✅ Migrated dbo.[${t.name}]: ${localRows.length} record(s).`);
        } catch (tableErr) {
            console.error(`❌ Error migrating ${t.name}:`, tableErr.message);
        }
    }

    // 4. Re-enable Foreign Key constraints
    console.log('🔒 Re-enabling remote Foreign Key constraints...');
    for (const fk of fksRes.recordset) {
        try {
            await remotePool.request().query(`ALTER TABLE dbo.[${fk.TableName}] WITH CHECK CHECK CONSTRAINT [${fk.name}];`);
        } catch (e) {}
    }

    console.log(`\n🎉 SYNC COMPLETE! Successfully migrated ${totalMigrated} records to MonsterASP!`);

    // Verify row counts
    console.log('\n📊 MonsterASP Verified Row Counts:');
    const finalCounts = await remotePool.request().query(`
        SELECT t.NAME AS TableName, p.rows AS RecordCount 
        FROM sys.tables t 
        INNER JOIN sys.partitions p ON t.OBJECT_ID = p.OBJECT_ID 
        WHERE p.index_id < 2 AND t.is_ms_shipped = 0 
        ORDER BY p.rows DESC;
    `);
    console.table(finalCounts.recordset.filter(r => r.RecordCount > 0));

    await remotePool.close();
    process.exit(0);
})();
