const { connectDB } = require('../server/config/db');

async function inspectClientIdentity() {
    console.log('=== INSPECTING USER & CLIENT DATABASE IDENTITY RECORDS ===\n');

    const pool = await connectDB();

    const usersRes = await pool.request().query(`
        SELECT 
            u.UserID,
            u.Email,
            u.RoleID,
            r.RoleName,
            c.FirstName,
            c.MiddleName,
            c.LastName,
            sp.BusinessName,
            pa.BusinessName AS AppBusinessName,
            pa.OwnerName
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID;
    `);

    console.table(usersRes.recordset);
}

inspectClientIdentity();
