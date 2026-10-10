const { connectDB } = require('../server/config/db');

async function checkColumns() {
    try {
        const pool = await connectDB();
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Bookings'
            ORDER BY ORDINAL_POSITION
        `);
        console.table(res.recordset);
    } catch (err) {
        console.error('Error:', err);
    }
    process.exit(0);
}

checkColumns();
