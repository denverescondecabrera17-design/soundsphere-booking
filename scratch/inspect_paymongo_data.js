const { connectDB } = require('../server/config/db');

async function inspect() {
    const pool = await connectDB();
    const withdrawals = await pool.request().query("SELECT TOP 5 * FROM dbo.Withdrawals");
    const payments = await pool.request().query("SELECT TOP 5 * FROM dbo.Payments");
    const bookings = await pool.request().query("SELECT TOP 5 BookingID, BookingReference, ProviderID, ClientUserID, TotalAmount, AmountPaid, PaymentStatus, BookingStatus FROM dbo.Bookings");
    
    console.log('=== Withdrawals ===');
    console.table(withdrawals.recordset);
    console.log('=== Payments ===');
    console.table(payments.recordset);
    console.log('=== Bookings ===');
    console.table(bookings.recordset);
    process.exit(0);
}

inspect().catch(console.error);
