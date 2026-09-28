const { connectDB, getPool } = require('../server/config/db');

async function checkUserNames() {
    await connectDB();
    const pool = getPool();

    const users = await pool.request().query(`
        SELECT 
            u.UserID, 
            u.Email, 
            r.RoleName, 
            c.FirstName AS ClientFirstName, 
            c.LastName AS ClientLastName,
            c.FullName AS ClientFullName,
            sp.BusinessName,
            sp.OwnerName,
            a.FullName AS AdminFullName
        FROM dbo.Users u
        JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
    `);

    console.log("=== Database User Accounts & Profile Names ===");
    console.table(users.recordset);
    process.exit(0);
}

checkUserNames();
