const { connectDB } = require('../server/config/db');

async function inspectBookings() {
    let pool = await connectDB();
    if (!pool) {
        console.error('Failed to connect to DB');
        return;
    }

    const res = await pool.request().query(`
        SELECT TOP 20 *
        FROM dbo.Bookings
        ORDER BY BookingID DESC;
    `);

    console.log('--- ALL BOOKINGS IN DATABASE ---');
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}

inspectBookings();
