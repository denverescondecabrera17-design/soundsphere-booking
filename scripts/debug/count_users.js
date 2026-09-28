const { connectDB } = require('../server/config/db');

async function countUsers() {
    let pool = await connectDB();
    try {
        const result = await pool.request().query(`
            SELECT 
                u.UserID,
                u.Email,
                u.Phone,
                r.RoleName,
                u.AccountStatus,
                COALESCE(c.FullName, c.FirstName + ' ' + c.LastName, sp.BusinessName, a.FullName, 'System User') AS Name,
                sp.BusinessName,
                sp.VerificationStatus
            FROM dbo.Users u
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
            ORDER BY u.UserID ASC;
        `);

        console.log("=== SoundSphereDB User Count & Details ===");
        console.log(`Total Users in System: ${result.recordset.length}\n`);

        const rolesCount = {};
        result.recordset.forEach(user => {
            const role = user.RoleName || 'Unknown';
            rolesCount[role] = (rolesCount[role] || 0) + 1;
            console.log(`[ID: ${user.UserID}] Email: ${user.Email} | Role: ${user.RoleName} | Name/Business: "${user.Name}" | Status: ${user.AccountStatus}`);
        });

        console.log("\nSummary by Role:");
        Object.keys(rolesCount).forEach(role => {
            console.log(` - ${role}s: ${rolesCount[role]}`);
        });

        process.exit(0);
    } catch (err) {
        console.error("Error querying users:", err.message);
        process.exit(1);
    }
}

countUsers();
