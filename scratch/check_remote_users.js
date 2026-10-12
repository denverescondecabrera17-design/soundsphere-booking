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

        const users = await pool.request().query("SELECT UserID, Email, RoleID FROM dbo.Users");
        console.log('Users on MonsterASP:', users.recordset);

        const bookingsGroup = await pool.request().query("SELECT ClientUserID, ClientEmail, COUNT(*) as cnt FROM dbo.Bookings GROUP BY ClientUserID, ClientEmail");
        console.log('Bookings grouped on MonsterASP:', bookingsGroup.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
