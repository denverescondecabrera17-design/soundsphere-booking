const { connectDB, getPool } = require('../server/config/db');

(async () => {
    await connectDB();
    const pool = getPool();
    const uid = 13;

    const res = await pool.request().input('UID', uid).query(`
        SELECT 
            b.*,
            ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), ISNULL(u.Email, 'Client Account')) AS ClientName,
            u.Phone AS ClientPhone,
            u.Email AS ClientEmail,
            u.ProfilePicture AS ClientAvatar
        FROM dbo.Bookings b
        LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
        LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        WHERE b.ProviderID = @UID OR sp.UserID = @UID
        ORDER BY b.CreatedAt DESC;
    `);

    console.log('Found bookings:', res.recordset.length);
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
})();
