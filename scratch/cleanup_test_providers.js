const { getPool, connectDB } = require('../server/config/db');

async function cleanupTestProviders() {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }

    console.log("=== Cleaning up Seeded Test Users & Packages ===");

    // Delete test users 31 and 32 if they exist
    const testEmails = ['apex.lights@soundsphere.com', 'stellar.events@soundsphere.com'];
    for (const email of testEmails) {
        const userRes = await pool.request().query(`SELECT UserID FROM dbo.Users WHERE Email = '${email}'`);
        if (userRes.recordset.length > 0) {
            const uid = userRes.recordset[0].UserID;
            console.log(`Deleting test provider User #${uid} (${email})...`);
            await pool.request().query(`DELETE FROM dbo.PackageImages WHERE PackageID IN (SELECT PackageID FROM dbo.Packages WHERE UserID = ${uid});`);
            await pool.request().query(`DELETE FROM dbo.Packages WHERE UserID = ${uid};`);
            await pool.request().query(`DELETE FROM dbo.ServiceProviders WHERE UserID = ${uid};`);
            await pool.request().query(`DELETE FROM dbo.ProviderApplications WHERE UserID = ${uid};`);
            await pool.request().query(`DELETE FROM dbo.Users WHERE UserID = ${uid};`);
            console.log(`Deleted User #${uid}.`);
        }
    }

    // Inspect remaining real providers & packages
    const realProviders = await pool.request().query(`
        SELECT u.UserID, u.Email, sp.BusinessName, sp.VerificationStatus
        FROM dbo.Users u
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        WHERE u.RoleID = 3 OR sp.VerificationStatus = 'Approved';
    `);

    console.log("\n=== REAL SERVICE PROVIDERS IN DB ===");
    console.table(realProviders.recordset);

    const realPackages = await pool.request().query(`
        SELECT p.PackageID, p.UserID, p.PackageName, p.Category, p.Price, p.IsActive, COUNT(pi.ImageID) AS PhotosCount
        FROM dbo.Packages p
        LEFT JOIN dbo.PackageImages pi ON p.PackageID = pi.PackageID
        GROUP BY p.PackageID, p.UserID, p.PackageName, p.Category, p.Price, p.IsActive;
    `);

    console.log("\n=== REAL SERVICE PACKAGES IN DB ===");
    console.table(realPackages.recordset);

    process.exit(0);
}

cleanupTestProviders();
