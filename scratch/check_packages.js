const { connectDB, getPool } = require('../server/config/db');

async function checkPackages() {
    await connectDB();
    const pool = getPool();
    const res = await pool.request().query('SELECT PackageID, PackageName, UserID, Price, IsActive FROM dbo.Packages');
    console.log("Packages in DB:", res.recordset);
    process.exit(0);
}

checkPackages();
