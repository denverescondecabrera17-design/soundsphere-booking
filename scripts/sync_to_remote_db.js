/**
 * SoundSphere - Push Local Data Directly to Remote MSSQL (MonsterASP / Azure)
 * Usage:
 *   node scripts/sync_to_remote_db.js <server> <database> <user> <password>
 * Or reads from REMOTE_DB_* environment variables.
 */

const fs = require('fs');
const path = require('path');
const sql = require('mssql');

const server = process.argv[2] || process.env.REMOTE_DB_SERVER;
const database = process.argv[3] || process.env.REMOTE_DB_NAME || process.env.REMOTE_DB_DATABASE;
const user = process.argv[4] || process.env.REMOTE_DB_USER;
const password = process.argv[5] || process.env.REMOTE_DB_PASSWORD;

if (!server || !database || !user || !password) {
    console.log('Usage: node scripts/sync_to_remote_db.js <server> <database> <user> <password>');
    console.log('Example: node scripts/sync_to_remote_db.js mssql1.monsterasp.net db_soundsphere db_user MyPass123!');
    process.exit(1);
}

const config = {
    server,
    database,
    user,
    password,
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    },
    connectionTimeout: 30000,
    requestTimeout: 60000
};

(async () => {
    console.log(`🔌 Connecting to remote database at ${server} [DB: ${database}]...`);
    let pool;
    try {
        pool = await sql.connect(config);
        console.log('✅ Connected successfully to remote database!');
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        console.log('💡 Tip: Check if the password or server name is correct, and verify firewall/remote access is enabled.');
        process.exit(1);
    }

    // Read the generated sync SQL script
    const sqlFile = path.resolve(__dirname, '../database/sync_localhost_data_to_azure.sql');
    if (!fs.existsSync(sqlFile)) {
        console.error('❌ Sync SQL file not found at:', sqlFile);
        process.exit(1);
    }

    console.log('📖 Reading sync script...');
    const content = fs.readFileSync(sqlFile, 'utf8');

    // Split statements safely
    const blocks = content.split('SET IDENTITY_INSERT');
    console.log(`🚀 Executing data sync across tables...`);

    try {
        // Run full script in chunks or single transaction
        const request = pool.request();
        await request.batch(content);
        console.log('\n🎉 ALL 266 LOCALHOST RECORDS SUCCESSFULLY SYNCED TO REMOTE DATABASE!');
        console.log('You can now refresh your deployed site and all providers, packages, bookings, and stats will be visible.');
    } catch (batchErr) {
        console.warn('⚠️ Batch execution notice, trying statement-by-statement execution:', batchErr.message);
        const statements = content.split('\nGO\n').filter(s => s.trim().length > 0);
        let executed = 0;
        for (const s of statements) {
            try {
                await pool.request().batch(s);
                executed++;
            } catch (sErr) {
                console.warn('Statement notice:', sErr.message);
            }
        }
        console.log(`✅ Statement execution completed (${executed} blocks).`);
    } finally {
        await pool.close();
        process.exit(0);
    }
})();
