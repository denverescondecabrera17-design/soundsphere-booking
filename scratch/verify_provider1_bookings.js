require('dotenv').config();
const { connectDB, getPool } = require('../server/config/db');

async function check() {
    await connectDB();
    const pool = getPool();
    const res = await pool.request().query(`
        SELECT BookingID, BookingReference, ProviderID, ServiceStartDate, ServiceEndDate, BookingStatus 
        FROM dbo.Bookings 
        WHERE ProviderID = 1;
    `);
    console.log('Bookings for ProviderID 1:');
    console.log(res.recordset);
    process.exit(0);
}

check();
