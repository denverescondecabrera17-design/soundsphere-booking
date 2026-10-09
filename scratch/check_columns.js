const { connectDB } = require('../server/config/db');

async function checkCols() {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT TABLE_NAME, COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME IN ('Clients', 'Users', 'Bookings', 'Withdrawals')
        ORDER BY TABLE_NAME, ORDINAL_POSITION;
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}

checkCols();
