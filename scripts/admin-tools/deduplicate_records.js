const { connectDB } = require('../server/config/db');

async function deduplicateDb() {
    console.log("=== SoundSphere Database Deduplication Script ===");
    let pool = await connectDB();

    try {
        // 1. Deduplicate dbo.Services (Keep lowest ServiceID for each UserID + ServiceName + Price)
        const srvDedupResult = await pool.request().query(`
            WITH CTE AS (
                SELECT ServiceID, UserID, ServiceName, Price,
                       ROW_NUMBER() OVER (PARTITION BY UserID, LOWER(RTRIM(LTRIM(ServiceName))), Price ORDER BY ServiceID ASC) AS RowNum
                FROM dbo.Services
            )
            DELETE FROM CTE WHERE RowNum > 1;
        `);
        console.log(`✓ Deduplicated dbo.Services. Removed duplicate service rows.`);

        // 2. Deduplicate dbo.Packages (Keep lowest PackageID for each UserID + PackageName + Price)
        const pkgDedupResult = await pool.request().query(`
            WITH CTE AS (
                SELECT PackageID, UserID, PackageName, Price,
                       ROW_NUMBER() OVER (PARTITION BY UserID, LOWER(RTRIM(LTRIM(PackageName))), Price ORDER BY PackageID ASC) AS RowNum
                FROM dbo.Packages
            )
            DELETE FROM CTE WHERE RowNum > 1;
        `);
        console.log(`✓ Deduplicated dbo.Packages. Removed duplicate package rows.`);

        // 3. Inspect final packages and services for UserID 13
        const finalPkgs = await pool.request().query("SELECT * FROM dbo.Packages WHERE UserID = 13");
        console.log(`\nFinal dbo.Packages for UserID 13 (Count: ${finalPkgs.recordset.length}):`);
        finalPkgs.recordset.forEach(p => console.log(`   - Package #${p.PackageID}: "${p.PackageName}" (₱${p.Price})`));

        const finalSrvs = await pool.request().query("SELECT * FROM dbo.Services WHERE UserID = 13");
        console.log(`\nFinal dbo.Services for UserID 13 (Count: ${finalSrvs.recordset.length}):`);
        finalSrvs.recordset.forEach(s => console.log(`   - Service #${s.ServiceID}: "${s.ServiceName}" (₱${s.Price})`));

        console.log("\n==================================================");
        console.log("🏆 DB DEDUPLICATION COMPLETED SUCCESSFULLY!");
        console.log("==================================================");
        process.exit(0);
    } catch (err) {
        console.error("Error during DB deduplication:", err.message);
        process.exit(1);
    }
}

deduplicateDb();
