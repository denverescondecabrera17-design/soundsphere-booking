const { connectDB } = require('../../server/config/db');

async function checkColumns() {
    const pool = await connectDB();
    const spCols = await pool.request().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ServiceProviders'");
    console.log('ServiceProviders columns:', spCols.recordset.map(c => c.column_name));

    const paCols = await pool.request().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ProviderApplications'");
    console.log('ProviderApplications columns:', paCols.recordset.map(c => c.column_name));
    process.exit(0);
}

checkColumns();
