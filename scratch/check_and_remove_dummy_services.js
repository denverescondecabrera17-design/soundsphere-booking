const { connectDB } = require('../server/config/db');

async function checkAndRemoveDummyServices() {
    console.log("=== Checking dbo.Services & dbo.Packages for Dummy Data ===");
    let pool = await connectDB();

    try {
        const srvs = await pool.request().query("SELECT * FROM dbo.Services");
        console.log(`All rows in dbo.Services (Count: ${srvs.recordset.length}):`);
        console.log(JSON.stringify(srvs.recordset, null, 2));

        const pkgs = await pool.request().query("SELECT * FROM dbo.Packages");
        console.log(`All rows in dbo.Packages (Count: ${pkgs.recordset.length}):`);
        console.log(JSON.stringify(pkgs.recordset, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error checking DB:", err.message);
        process.exit(1);
    }
}

checkAndRemoveDummyServices();
