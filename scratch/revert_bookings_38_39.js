const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();

    // 1. Delete errant auto-settle payment rows for 38 and 39
    await pool.request().query("DELETE FROM dbo.Payments WHERE PaymentID IN (36, 38);");

    // 2. Revert Booking 38 and Booking 39 to downpayment status
    await pool.request().query("UPDATE dbo.Bookings SET AmountPaid = 2750, RemainingBalance = 2750, PaymentType = 'downpayment', PaymentStatus = 'Partial' WHERE BookingID IN (38, 39);");

    // 3. Inspect updated bookings
    const res = await pool.request().query("SELECT BookingID, BookingReference, TotalAmount, AmountPaid, RemainingBalance, PaymentType, PaymentStatus, BookingStatus FROM dbo.Bookings WHERE BookingID IN (38, 39);");
    console.log('CORRECTED BOOKINGS:', JSON.stringify(res.recordset, null, 2));

    // 4. Inspect payments
    const payRes = await pool.request().query("SELECT PaymentID, BookingID, Amount, PaymentMethod, PaymentStatus, TransactionReference FROM dbo.Payments WHERE BookingID IN (38, 39);");
    console.log('CORRECTED PAYMENTS:', JSON.stringify(payRes.recordset, null, 2));

    process.exit(0);
})();
