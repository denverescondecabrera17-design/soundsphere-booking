require('dotenv').config();
const { connectDB, getPool } = require('../server/config/db');

async function check12() {
    await connectDB();
    const pool = getPool();
    const b = await pool.request().query(`SELECT * FROM dbo.Bookings WHERE BookingID = 12;`);
    const p = await pool.request().query(`SELECT * FROM dbo.Payments WHERE BookingID = 12;`);
    console.log('--- BOOKING 12 DETAILS ---');
    console.log(b.recordset[0]);
    console.log('--- PAYMENT DETAILS ---');
    console.log(p.recordset);
    process.exit(0);
}

check12();
