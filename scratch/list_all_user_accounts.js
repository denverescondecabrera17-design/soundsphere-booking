const { connectDB } = require('../server/config/db');

async function listAllAccounts() {
    console.log('================================================================');
    console.log('👥 SOUNDSPHEREDB - ALL CREATED USER ACCOUNTS');
    console.log('================================================================\n');

    const pool = await connectDB();
    if (!pool) {
        console.error('Failed to connect to database.');
        return;
    }

    const res = await pool.request().query(`
        SELECT 
            u.UserID,
            u.Email,
            r.RoleName,
            c.FullName AS ClientName,
            sp.BusinessName AS ProviderBusiness,
            u.EmailVerified,
            u.AccountStatus,
            u.CreatedAt
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        ORDER BY u.UserID ASC;
    `);

    console.table(res.recordset);
    process.exit(0);
}

listAllAccounts();
