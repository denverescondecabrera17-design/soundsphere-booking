const { connectDB, getPool } = require('../server/config/db');

(async () => {
    await connectDB();
    const pool = getPool();

    const dummyIds = [10, 11, 12, 13];
    for (const id of dummyIds) {
        await pool.request().input('BID', id).query(`DELETE FROM dbo.Payments WHERE BookingID = @BID;`);
        await pool.request().input('BID', id).query(`DELETE FROM dbo.Notifications WHERE RelatedID = @BID AND RelatedType = 'Booking';`);
        await pool.request().input('BID', id).query(`DELETE FROM dbo.Bookings WHERE BookingID = @BID;`);
    }

    console.log('Dummy test bookings 10, 11, 12, 13 deleted successfully.');

    const remaining = await pool.request().query(`SELECT BookingID, BookingReference, PackageName, EventDate, TotalAmount, BookingStatus FROM dbo.Bookings;`);
    console.log('Remaining Bookings in DB:', remaining.recordset);
    process.exit(0);
})();
