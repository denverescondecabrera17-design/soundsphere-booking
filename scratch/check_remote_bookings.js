const sql = require('mssql');

const remoteConfig = {
    server: 'db72897.public.databaseasp.net',
    database: 'db72897',
    user: 'db72897',
    password: 'o#7C?9Bb3Ei_',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

(async () => {
    try {
        const pool = await sql.connect(remoteConfig);
        console.log('Connected to MonsterASP db72897!');

        // Check columns in Bookings
        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bookings'");
        console.log('Columns in Bookings:', cols.recordset.map(c => c.COLUMN_NAME));

        // Check User 1 bookings count on remote DB
        const userBookings = await pool.request().query("SELECT BookingID, BookingReference, BookingStatus, PaymentStatus, TotalAmount, AmountPaid FROM dbo.Bookings WHERE ClientUserID = 1 ORDER BY BookingID DESC");
        console.log('User 1 Bookings count on MonsterASP:', userBookings.recordset.length);
        console.log('Top 3 Bookings:', userBookings.recordset.slice(0, 3));

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
