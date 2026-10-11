const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT * FROM dbo.Payments WHERE TransactionReference LIKE 'BAL-%';");
    console.log('ALL BAL PAYMENTS:', JSON.stringify(res.recordset, null, 2));
    process.exit(0);
})();
