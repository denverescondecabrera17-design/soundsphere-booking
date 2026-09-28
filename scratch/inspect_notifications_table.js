const { connectDB } = require('../server/config/db');

async function inspectNotificationsTable() {
    let pool = await connectDB();
    try {
        const res = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = 'Notifications';
        `);
        console.log('=== dbo.Notifications Columns ===');
        console.log(res.recordset);
    } catch (e) {
        console.error('Error inspecting Notifications table:', e.message);
    }
}
inspectNotificationsTable();
