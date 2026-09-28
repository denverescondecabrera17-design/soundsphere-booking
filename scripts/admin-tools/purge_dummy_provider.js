const { connectDB, getPool } = require('../server/config/db');

async function cleanDummyProvider() {
    console.log("=== Purging Dummy Provider 'Batangas Sound & Lights Pro' from DB ===");
    let pool = await connectDB();

    try {
        // 1. Delete from dbo.Packages & dbo.Services
        await pool.request().query(`
            DELETE FROM dbo.Packages WHERE UserID IN (
                SELECT UserID FROM dbo.Users WHERE Email = 'provider@soundsphere.com'
            ) OR PackageName LIKE '%Batangas%';
        `);

        await pool.request().query(`
            DELETE FROM dbo.Services WHERE UserID IN (
                SELECT UserID FROM dbo.Users WHERE Email = 'provider@soundsphere.com'
            ) OR ServiceName LIKE '%Batangas%';
        `);

        // 2. Delete from dbo.ServiceProviders
        await pool.request().query(`
            DELETE FROM dbo.ServiceProviders WHERE BusinessName LIKE '%Batangas Sound%' OR UserID IN (
                SELECT UserID FROM dbo.Users WHERE Email = 'provider@soundsphere.com'
            );
        `);

        // 3. Delete from dbo.ProviderApplications
        await pool.request().query(`
            DELETE FROM dbo.ProviderApplications WHERE BusinessName LIKE '%Batangas Sound%' OR UserID IN (
                SELECT UserID FROM dbo.Users WHERE Email = 'provider@soundsphere.com'
            );
        `);

        // 4. Delete from dbo.Users
        await pool.request().query(`
            DELETE FROM dbo.Users WHERE Email = 'provider@soundsphere.com';
        `);

        console.log("✅ Successfully purged 'Batangas Sound & Lights Pro' and 'provider@soundsphere.com' from SoundSphereDB!");
        
        // 5. Query remaining approved providers
        const approved = await pool.request().query(`
            SELECT u.UserID, u.Email, sp.BusinessName, sp.OwnerName, sp.VerificationStatus
            FROM dbo.Users u
            JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            WHERE sp.VerificationStatus = 'Approved';
        `);
        console.log("\nRemaining Approved Service Providers in Database:");
        console.log(JSON.stringify(approved.recordset, null, 2));

    } catch (err) {
        console.error("❌ Error purging dummy provider:", err.message);
    }
}

cleanDummyProvider();
