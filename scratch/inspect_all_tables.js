const { connectDB } = require('../server/config/db');

async function inspectAllTables() {
    console.log('=== SOUNDSPHEREDB COMPLETE TABLE INSPECTION ===\n');
    let pool = await connectDB();
    if (!pool) {
        console.error('Failed to connect to DB');
        return;
    }

    const tablesRes = await pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME;
    `);

    const tables = tablesRes.recordset.map(t => t.TABLE_NAME);
    console.log(`Found ${tables.length} tables in SoundSphereDB:\n`);

    const summary = [];
    for (const table of tables) {
        try {
            const countRes = await pool.request().query(`SELECT COUNT(*) AS NumRows FROM dbo.[${table}]`);
            const rowCount = countRes.recordset[0].NumRows;
            summary.push({ TableName: `dbo.${table}`, RowsCount: rowCount });
        } catch (err) {
            summary.push({ TableName: `dbo.${table}`, RowsCount: 'Error: ' + err.message });
        }
    }

    console.table(summary);
    process.exit(0);
}

inspectAllTables();
