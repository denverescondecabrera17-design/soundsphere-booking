const sql = require('mssql');

const remoteConfig = {
    server: 'db72897.public.databaseasp.net',
    database: 'db72897',
    user: 'db72897',
    password: 'o#7C?9Bb3Ei_',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

async function fixUserBookingsLink() {
    const pool = await sql.connect(remoteConfig);
    console.log('Connected to MonsterASP.');

    // 1. Link dbo.Bookings.ClientUserID based on ClientEmail matching dbo.Users.Email
    console.log('1. Re-linking dbo.Bookings.ClientUserID using ClientEmail matching dbo.Users.Email...');
    const linkRes = await pool.request().query(`
        UPDATE b
        SET b.ClientUserID = u.UserID
        FROM dbo.Bookings b
        JOIN dbo.Users u ON LOWER(LTRIM(RTRIM(b.ClientEmail))) = LOWER(LTRIM(RTRIM(u.Email)))
        WHERE b.ClientUserID <> u.UserID OR b.ClientUserID IS NULL;
    `);
    console.log(`   ✓ Updated ${linkRes.rowsAffected[0]} booking(s) to point to their exact UserID!`);

    // 2. Remap UserID 8 to UserID 4 (dendenescondecabrera17@gmail.com)
    console.log('2. Remapping orphaned UserID 8 records to UserID 4 (dendenescondecabrera17)...');
    try {
        await pool.request().query("UPDATE dbo.Reviews SET UserID = 4 WHERE UserID = 8");
        await pool.request().query("UPDATE dbo.Notifications SET UserID = 4 WHERE UserID = 8");
        await pool.request().query("UPDATE dbo.WalletTransactions SET UserID = 4 WHERE UserID = 8");
        await pool.request().query("UPDATE dbo.RefundRequests SET UserID = 4 WHERE UserID = 8");
        console.log('   ✓ Remapped reviews, notifications, wallet transactions to UserID 4.');
    } catch (e) {
        console.warn('   Notice:', e.message);
    }

    // 3. Remap UserID 1 orphaned client records (belonging to Denver Esconde Cabrera) to UserID 36
    console.log('3. Remapping any orphaned client reviews or notifications for denverescondecabrera17...');
    try {
        await pool.request().query("UPDATE dbo.Reviews SET UserID = 36 WHERE UserID = 1");
        await pool.request().query("UPDATE dbo.RefundRequests SET UserID = 36 WHERE UserID = 1");
    } catch (e) {}

    // 4. Verify bookings by ClientUserID
    const auditRes = await pool.request().query(`
        SELECT u.UserID, u.Email, u.RoleID, r.RoleName, COUNT(b.BookingID) as BookingCount
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Bookings b ON u.UserID = b.ClientUserID
        WHERE u.Email LIKE '%cabrera%'
        GROUP BY u.UserID, u.Email, u.RoleID, r.RoleName
    `);
    console.log('\nAudit of Cabrera accounts and booking counts:');
    console.table(auditRes.recordset);

    await pool.close();
}

fixUserBookingsLink().catch(err => console.error(err));
