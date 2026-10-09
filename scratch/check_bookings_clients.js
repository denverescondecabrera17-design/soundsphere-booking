const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT TOP 5 BookingID, BookingReference, ClientName, ClientUserID FROM dbo.Bookings ORDER BY BookingID DESC;");
    console.log(res.recordset);

    const clientRes = await pool.request().query("SELECT * FROM dbo.Clients;");
    console.log('Clients table:', clientRes.recordset);
    process.exit(0);
})();
