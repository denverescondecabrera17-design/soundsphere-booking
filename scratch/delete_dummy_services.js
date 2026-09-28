const { connectDB } = require('../server/config/db');

async function deleteDummyServices() {
    console.log("=== Deleting Dummy Seed Services from dbo.Services ===");
    let pool = await connectDB();

    try {
        const delRes = await pool.request().query("DELETE FROM dbo.Services WHERE ServiceName LIKE '%Pro Concert Sound Rig%'");
        console.log(`✓ Deleted ${delRes.rowsAffected[0] || 0} dummy service records.`);

        const remainingSrvs = await pool.request().query("SELECT * FROM dbo.Services");
        console.log(`\nRemaining rows in dbo.Services (Count: ${remainingSrvs.recordset.length}):`);
        console.log(JSON.stringify(remainingSrvs.recordset, null, 2));

        const remainingPkgs = await pool.request().query("SELECT * FROM dbo.Packages WHERE UserID = 13");
        console.log(`\nPackages for User 13 in dbo.Packages (Count: ${remainingPkgs.recordset.length}):`);
        remainingPkgs.recordset.forEach(p => console.log(`   - Package #${p.PackageID}: "${p.PackageName}" (₱${p.Price})`));

        console.log("\n==================================================");
        console.log("🏆 DUMMY SEED SERVICES PURGED SUCCESSFULLY!");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("Error deleting dummy services:", err.message);
        process.exit(1);
    }
}

deleteDummyServices();
