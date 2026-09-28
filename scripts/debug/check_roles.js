const { getPool, connectDB } = require('../server/config/db');

async function checkRoles() {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }

    const roles = await pool.request().query("SELECT * FROM dbo.Roles;");
    console.log("Roles table:", roles.recordset);

    const testQuery = await pool.request().query(`
        SELECT u.UserID, u.Email, u.RoleID, r.RoleName, sp.VerificationStatus, pa.Status
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID
        WHERE u.UserID = 13;
    `);
    console.log("Test Query Result for User 13:", testQuery.recordset);

    process.exit(0);
}

checkRoles();
