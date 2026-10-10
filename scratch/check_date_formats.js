const { connectDB } = require('../server/config/db');

async function checkDateFormats() {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT DISTINCT EventDate, ServiceStartDate, ServiceEndDate 
        FROM dbo.Bookings
    `);
    console.table(res.recordset);
    process.exit(0);
}

checkDateFormats();
