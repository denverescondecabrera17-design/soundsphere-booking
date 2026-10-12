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
        const res = await pool.request().query("SELECT BookingID, BookingReference, BookingStatus, PaymentStatus, PackageName, TotalAmount, AmountPaid FROM dbo.Bookings WHERE ClientUserID = 36 ORDER BY BookingID DESC");
        console.log('Bookings for User 36 (denverescondecabrera17@gmail.com) on MonsterASP:');
        console.table(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
