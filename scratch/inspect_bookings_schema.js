const { connectDB } = require('../server/config/db');

async function inspectBookings() {
    const pool = await connectDB();
    const cols = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bookings'");
    console.log('Bookings Columns:');
    console.log(cols.recordset.map(c => `${c.COLUMN_NAME} (${c.DATA_TYPE})`).join(', '));

    const sample = await pool.request().query("SELECT TOP 3 * FROM dbo.Bookings ORDER BY BookingID DESC");
    console.log('\nLatest Bookings:');
    console.log(sample.recordset);
    process.exit(0);
}

inspectBookings().catch(console.error);
