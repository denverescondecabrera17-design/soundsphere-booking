const { connectDB } = require('../server/config/db');

async function inspectBookings() {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT TOP 10 
            BookingID, BookingReference, ClientUserID, ClientName, ClientEmail, 
            PackageName, EventDate, ServiceStartDate, ServiceEndDate, 
            TotalAmount, AmountPaid, RemainingBalance, PaymentType, BookingStatus, PaymentStatus, CreatedAt
        FROM dbo.Bookings
        ORDER BY BookingID DESC
    `);
    console.table(res.recordset);
    process.exit(0);
}

inspectBookings();
