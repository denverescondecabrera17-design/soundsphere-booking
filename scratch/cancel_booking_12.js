require('dotenv').config();
const { connectDB, getPool } = require('../server/config/db');

async function cancel12() {
    await connectDB();
    const pool = getPool();
    await pool.request().query(`UPDATE dbo.Bookings SET BookingStatus = 'Cancelled' WHERE BookingID = 12;`);
    console.log('--- Booking 12 Cancelled for testing ---');
    process.exit(0);
}

cancel12();
