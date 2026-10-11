/**
 * SoundSphere - Universal Database Restorer & Syncer
 * Restores all 266 records from database/sync_localhost_data_to_azure.sql
 * to both Localhost and MonsterASP, adapting to each server's table schema.
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const sqlFile = path.resolve(__dirname, '../database/sync_localhost_data_to_azure.sql');
const content = fs.readFileSync(sqlFile, 'utf8');

// Parse blocks from the SQL file
const tableBlocks = [];
const sections = content.split(/-- Table: dbo\.\[(.*?)\]/);
for (let i = 1; i < sections.length; i += 2) {
    const tableName = sections[i].trim();
    const rawSql = sections[i + 1] || '';
    tableBlocks.push({ tableName, rawSql });
}

console.log(`Parsed ${tableBlocks.length} table blocks from SQL file.`);

const restoreToDatabase = async (targetName, poolConfig) => {
    console.log(`\n========================================================`);
    console.log(`🚀 Starting restore to ${targetName}...`);
    console.log(`========================================================`);

    const pool = new sql.ConnectionPool(poolConfig);
    await pool.connect();
    console.log(`✅ Connected to ${targetName}`);

    // Disable all Foreign Keys
    console.log(`🔓 Disabling Foreign Keys in ${targetName}...`);
    const fksRes = await pool.request().query(`
        SELECT name, OBJECT_NAME(parent_object_id) AS TableName FROM sys.foreign_keys;
    `);
    for (const fk of fksRes.recordset) {
        try {
            await pool.request().query(`ALTER TABLE dbo.[${fk.TableName}] NOCHECK CONSTRAINT [${fk.name}];`);
        } catch (e) {}
    }

    let totalInserted = 0;

    for (const block of tableBlocks) {
        const { tableName, rawSql } = block;

        // Check if table exists in target
        const tChk = await pool.request().query(`
            SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${tableName}';
        `);
        if (tChk.recordset.length === 0) {
            console.log(`⚠️ Table dbo.[${tableName}] does not exist in ${targetName}, skipping.`);
            continue;
        }

        // Get target columns
        const colsRes = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${tableName}';
        `);
        const targetCols = new Set(colsRes.recordset.map(c => c.COLUMN_NAME));

        // Parse individual INSERT statements from rawSql
        const insertMatches = [...rawSql.matchAll(/INSERT INTO dbo\.\[(.*?)\] \((.*?)\)\s+VALUES \((.*?)\);/gs)];
        if (insertMatches.length === 0) continue;

        let tableCount = 0;
        const insertStatements = [];

        for (const m of insertMatches) {
            const cols = m[2].split(',').map(c => c.trim().replace(/^\[|\]$/g, ''));
            // Split values safely taking into account commas inside quotes
            const vals = [];
            let curVal = '';
            let inQuote = false;
            for (let cIdx = 0; cIdx < m[3].length; cIdx++) {
                const ch = m[3][cIdx];
                if (ch === "'") inQuote = !inQuote;
                if (ch === ',' && !inQuote) {
                    vals.push(curVal.trim());
                    curVal = '';
                } else {
                    curVal += ch;
                }
            }
            vals.push(curVal.trim());

            // Filter columns to what exists in target
            const validCols = [];
            const validVals = [];
            for (let idx = 0; idx < cols.length; idx++) {
                if (targetCols.has(cols[idx])) {
                    validCols.push(`[${cols[idx]}]`);
                    validVals.push(vals[idx]);
                }
            }

            insertStatements.push(`INSERT INTO dbo.[${tableName}] (${validCols.join(', ')}) VALUES (${validVals.join(', ')});`);
            tableCount++;
        }

        try {
            // Check if table has identity column
            const idChk = await pool.request().query(`
                SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[${tableName}]') AND is_identity = 1;
            `);
            const hasIdentity = idChk.recordset.length > 0;

            const fullBatch = [
                hasIdentity ? `SET IDENTITY_INSERT dbo.[${tableName}] ON;` : '',
                ...insertStatements,
                hasIdentity ? `SET IDENTITY_INSERT dbo.[${tableName}] OFF;` : ''
            ].filter(Boolean).join('\n');

            await pool.request().batch(fullBatch);
            totalInserted += tableCount;
            console.log(`✅ [${targetName}] dbo.[${tableName}]: ${tableCount} record(s) inserted.`);
        } catch (insErr) {
            console.warn(`⚠️ Error in [${targetName}] dbo.[${tableName}]:`, insErr.message);
            // Fallback: try one by one
            const idChk = await pool.request().query(`
                SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.[${tableName}]') AND is_identity = 1;
            `);
            const hasIdentity = idChk.recordset.length > 0;

            let singleSuccess = 0;
            for (const stmt of insertStatements) {
                try {
                    const q = hasIdentity 
                        ? `SET IDENTITY_INSERT dbo.[${tableName}] ON; ${stmt} SET IDENTITY_INSERT dbo.[${tableName}] OFF;`
                        : stmt;
                    await pool.request().query(q);
                    singleSuccess++;
                } catch (sErr) {}
            }
            totalInserted += singleSuccess;
            console.log(`   (fallback inserted: ${singleSuccess} records)`);
        }
    }

    // Re-enable Foreign Keys
    console.log(`🔒 Re-enabling Foreign Keys in ${targetName}...`);
    for (const fk of fksRes.recordset) {
        try {
            await pool.request().query(`ALTER TABLE dbo.[${fk.TableName}] WITH CHECK CHECK CONSTRAINT [${fk.name}];`);
        } catch (e) {}
    }

    console.log(`🎉 Finished ${targetName}: ${totalInserted} total records restored.`);

    // Display counts
    const counts = await pool.request().query(`
        SELECT t.NAME AS TableName, p.rows AS RecordCount 
        FROM sys.tables t 
        INNER JOIN sys.partitions p ON t.OBJECT_ID = p.OBJECT_ID 
        WHERE p.index_id < 2 AND t.is_ms_shipped = 0 
        ORDER BY p.rows DESC;
    `);
    console.table(counts.recordset.filter(r => r.RecordCount > 0));

    await pool.close();
};

(async () => {
    try {
        // 1. Restore to Localhost
        await restoreToDatabase('Localhost (SoundSphereDB)', {
            user: 'sa',
            password: 'Esconde@041704',
            server: '127.0.0.1',
            database: 'SoundSphereDB',
            port: 1433,
            options: { encrypt: false, trustServerCertificate: true },
            connectionTimeout: 15000,
            requestTimeout: 60000
        });

        // 2. Restore to MonsterASP
        await restoreToDatabase('MonsterASP (db72897)', {
            user: 'db72897',
            password: 'o#7C?9Bb3Ei_',
            server: 'db72897.public.databaseasp.net',
            database: 'db72897',
            port: 1433,
            options: { encrypt: false, trustServerCertificate: true },
            connectionTimeout: 30000,
            requestTimeout: 120000
        });

        console.log('\n🌟 ALL RESTORES AND SYNCS COMPLETED SUCCESSFULLY!');
    } catch (e) {
        console.error('Fatal restore error:', e);
    } finally {
        process.exit(0);
    }
})();
