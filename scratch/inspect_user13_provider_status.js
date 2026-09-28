const { getPool, connectDB } = require('../server/config/db');

async function inspectUser13() {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }

    const res = await pool.request().query(`
        SELECT u.UserID, u.Email, u.RoleID, r.RoleName, u.AccountStatus, sp.BusinessName, sp.VerificationStatus
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        WHERE u.UserID = 13 OR u.Email = 'denvercabrera.apo@gmail.com';
    `);

    console.log("User 13 Query Result:", res.recordset);

    // Also check all users and roles
    const allUsers = await pool.request().query(`
        SELECT u.UserID, u.Email, u.RoleID, r.RoleName, u.AccountStatus
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID;
    `);
    console.log("All Users:", allUsers.recordset);

    process.exit(0);
}

inspectUser13();
