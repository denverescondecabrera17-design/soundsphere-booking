const { getPool, connectDB } = require('../server/config/db');

async function inspectAllApprovedProviders() {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }

    const res = await pool.request().query(`
        SELECT 
            u.UserID,
            u.Email,
            u.RoleID,
            r.RoleName,
            u.AccountStatus,
            sp.BusinessName AS SP_BusinessName,
            sp.VerificationStatus AS SP_Status,
            pa.BusinessName AS PA_BusinessName,
            pa.Status AS PA_Status
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID;
    `);

    console.log("=== ALL USERS & PROVIDER STATUS ===");
    console.table(res.recordset);

    const packagesRes = await pool.request().query(`
        SELECT p.PackageID, p.UserID, p.PackageName, p.Category, p.Price, p.IsActive, COUNT(pi.ImageID) AS PhotosCount
        FROM dbo.Packages p
        LEFT JOIN dbo.PackageImages pi ON p.PackageID = pi.PackageID
        GROUP BY p.PackageID, p.UserID, p.PackageName, p.Category, p.Price, p.IsActive;
    `);

    console.log("\n=== ALL PACKAGES & OFFERS IN DB ===");
    console.table(packagesRes.recordset);

    process.exit(0);
}

inspectAllApprovedProviders();
