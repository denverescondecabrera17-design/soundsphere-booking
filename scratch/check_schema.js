const { connectDB } = require('../server/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const pCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ServiceProviders'");
        console.log('ServiceProviders columns:', pCols.recordset.map(c => c.COLUMN_NAME));

        const uCols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users'");
        console.log('Users columns:', uCols.recordset.map(c => c.COLUMN_NAME));

        const providers = await pool.request().query("SELECT * FROM dbo.ServiceProviders");
        console.log('Providers:', providers.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
