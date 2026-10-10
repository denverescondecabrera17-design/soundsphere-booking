const { connectDB } = require('../server/config/db');

async function checkCols() {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Withdrawals'
        ORDER BY ORDINAL_POSITION
    `);
    console.table(res.recordset);

    const clientCols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'Clients'
        ORDER BY ORDINAL_POSITION
    `);
    console.table(clientCols.recordset);
    process.exit(0);
}
checkCols();
