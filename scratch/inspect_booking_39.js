const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT * FROM dbo.Bookings WHERE BookingID = 39;");
    console.log('BOOKING 39:', JSON.stringify(res.recordset[0], null, 2));

    const payRes = await pool.request().query("SELECT * FROM dbo.Payments WHERE BookingID = 39;");
    console.log('PAYMENTS 39:', JSON.stringify(payRes.recordset, null, 2));

    process.exit(0);
})();
