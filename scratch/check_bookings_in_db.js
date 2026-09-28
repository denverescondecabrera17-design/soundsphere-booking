require('dotenv').config();
const { connectDB, getPool } = require('../server/config/db');

async function checkBookings() {
    try {
        await connectDB();
        const pool = getPool();
        const res = await pool.request().query(`
            SELECT 
                BookingID,
                BookingReference,
                ProviderID,
                PackageName,
                EventDate,
                ServiceStartDate,
                ServiceEndDate,
                StartTime,
                EndTime,
                BookingStatus,
                CreatedAt
            FROM dbo.Bookings
            ORDER BY BookingID DESC;
        `);
        console.log('--- ALL BOOKINGS IN DATABASE ---');
        console.log(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBookings();
