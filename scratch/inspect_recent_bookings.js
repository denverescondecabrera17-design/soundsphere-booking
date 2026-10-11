const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT TOP 5 BookingID, BookingReference, PackageName, TotalAmount, AmountPaid, RemainingBalance, PaymentType, PaymentStatus, BookingStatus, CreatedAt FROM dbo.Bookings ORDER BY BookingID DESC;");
    console.log('BOOKINGS:', JSON.stringify(res.recordset, null, 2));

    const payRes = await pool.request().query("SELECT TOP 5 PaymentID, BookingID, Amount, PaymentMethod, PaymentType, Status, CreatedAt FROM dbo.Payments ORDER BY PaymentID DESC;");
    console.log('PAYMENTS:', JSON.stringify(payRes.recordset, null, 2));

    process.exit(0);
})();
