const { connectDB } = require('../server/config/db');

async function inspectProviderData() {
    console.log("=== Inspecting dbo.Packages & dbo.Services for User 13 (CHiCHa Lights and Sounds) ===");
    let pool = await connectDB();

    try {
        const pkgs = await pool.request().query("SELECT * FROM dbo.Packages WHERE UserID = 13");
        console.log(`\nPackages in dbo.Packages for UserID 13 (Count: ${pkgs.recordset.length}):`);
        console.log(JSON.stringify(pkgs.recordset, null, 2));

        const srvs = await pool.request().query("SELECT * FROM dbo.Services WHERE UserID = 13");
        console.log(`\nServices in dbo.Services for UserID 13 (Count: ${srvs.recordset.length}):`);
        console.log(JSON.stringify(srvs.recordset, null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error inspecting database:", err.message);
        process.exit(1);
    }
}

inspectProviderData();
