const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || '127.0.0.1',
    database: process.env.DB_DATABASE || 'SoundSphereDB',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function checkUsers() {
    try {
        const pool = await sql.connect(config);
        const res = await pool.request().query('SELECT UserID, Email, EmailVerified, RoleID FROM dbo.Users');
        console.log('All Users in DB:', res.recordset);
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await sql.close();
    }
}

checkUsers();
