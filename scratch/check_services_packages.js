const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT * FROM dbo.Services;");
    console.log("SERVICES IN DB:", JSON.stringify(res.recordset, null, 2));

    const pkgRes = await pool.request().query("SELECT * FROM dbo.Packages;");
    console.log("PACKAGES IN DB:", JSON.stringify(pkgRes.recordset, null, 2));

    process.exit(0);
})();
