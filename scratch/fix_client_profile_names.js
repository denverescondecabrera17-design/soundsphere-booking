const { connectDB, getPool } = require('../server/config/db');

async function fixClientProfileNames() {
    await connectDB();
    const pool = getPool();

    console.log("=== Updating Placeholder Client Names in Database ===");

    // Update Client record names based on email address or real user names
    await pool.request().query(`
        UPDATE dbo.Clients
        SET FirstName = 'Denver',
            LastName = 'Cabrera',
            FullName = 'Denver Cabrera'
        WHERE UserID = 1 OR UserID = 2 OR UserID = 8 OR UserID = 14;

        UPDATE dbo.Clients
        SET FirstName = 'Princess',
            LastName = 'Balayan',
            FullName = 'Princess Balayan'
        WHERE UserID = 9;
    `);

    const updated = await pool.request().query(`
        SELECT u.UserID, u.Email, r.RoleName, c.FirstName, c.LastName, c.FullName
        FROM dbo.Users u
        JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
    `);

    console.log("Updated Client Profiles:");
    console.table(updated.recordset);
    process.exit(0);
}

fixClientProfileNames();
