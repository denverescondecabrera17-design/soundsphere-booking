const { connectDB } = require('../server/config/db');

async function checkCancelledBookings() {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT BookingID, ClientUserID, PackageName, BookingStatus, PaymentStatus, TotalAmount, AmountPaid, BookingReference
        FROM dbo.Bookings
        WHERE BookingStatus = 'Cancelled' OR ClientUserID = 8 OR ClientUserID = 1;
    `);
    console.table(res.recordset);
    process.exit(0);
}
checkCancelledBookings();
