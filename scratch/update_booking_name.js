const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    await pool.request().query(`
        UPDATE dbo.Bookings
        SET ClientName = 'Andrei Dela Cruz'
        WHERE BookingReference = 'SS-2026-00019' OR BookingID = 33;
    `);
    console.log('Booking SS-2026-00019 ClientName updated to Andrei Dela Cruz');
    process.exit(0);
})();
