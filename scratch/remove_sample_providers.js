const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();

    console.log("Removing sample providers: Apex Audio & Stellar Visuals...");

    // 1. Find UserIDs for apex and stellar
    const usersRes = await pool.request().query(`
        SELECT UserID, Email FROM dbo.Users 
        WHERE Email IN ('apex.lights@soundsphere.com', 'stellar.events@soundsphere.com');
    `);
    const userIds = (usersRes.recordset || []).map(u => u.UserID);
    console.log("Found sample UserIDs:", userIds);

    if (userIds.length > 0) {
        const idListStr = userIds.join(',');

        // Delete package images if any
        await pool.request().query(`
            DELETE FROM dbo.PackageImages 
            WHERE PackageID IN (SELECT PackageID FROM dbo.Packages WHERE UserID IN (${idListStr}));
        `);

        // Delete packages
        const delPkg = await pool.request().query(`
            DELETE FROM dbo.Packages WHERE UserID IN (${idListStr});
        `);
        console.log(`Deleted packages: ${delPkg.rowsAffected[0]}`);

        // Delete services if any
        await pool.request().query(`
            DELETE FROM dbo.Services WHERE UserID IN (${idListStr});
        `);

        // Delete service providers
        const delSP = await pool.request().query(`
            DELETE FROM dbo.ServiceProviders WHERE UserID IN (${idListStr});
        `);
        console.log(`Deleted service providers: ${delSP.rowsAffected[0]}`);

        // Delete users
        const delUsers = await pool.request().query(`
            DELETE FROM dbo.Users WHERE UserID IN (${idListStr});
        `);
        console.log(`Deleted users: ${delUsers.rowsAffected[0]}`);
    }

    // Verify remaining providers and packages
    const remainingProv = await pool.request().query("SELECT ProviderID, UserID, BusinessName FROM dbo.ServiceProviders;");
    console.log("REMAINING PROVIDERS:", JSON.stringify(remainingProv.recordset, null, 2));

    const remainingPkg = await pool.request().query("SELECT PackageID, UserID, PackageName, Price FROM dbo.Packages;");
    console.log("REMAINING PACKAGES:", JSON.stringify(remainingPkg.recordset, null, 2));

    process.exit(0);
})();
