const { connectDB, getPool } = require('../server/config/db');

(async () => {
    await connectDB();
    const pool = getPool();

    await pool.request().query(`DELETE FROM dbo.Payments WHERE BookingID IN (14, 15);`);
    await pool.request().query(`DELETE FROM dbo.Notifications WHERE RelatedID IN (14, 15) AND RelatedType = 'Booking';`);
    await pool.request().query(`DELETE FROM dbo.Bookings WHERE BookingID IN (14, 15);`);

    console.log('Test bookings 14 and 15 cleared from database.');

    const remaining = await pool.request().query(`SELECT BookingID, BookingReference, PackageName, EventDate, BookingStatus FROM dbo.Bookings;`);
    console.log('Current Active Bookings in DB:', remaining.recordset);
    process.exit(0);
})();
