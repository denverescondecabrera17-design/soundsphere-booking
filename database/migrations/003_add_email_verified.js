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

async function fixEmailVerified() {
    try {
        const pool = await sql.connect(config);
        console.log('Updating EmailVerified = 1 for all active users in SQL Server...');
        const result = await pool.request().query(`
            UPDATE dbo.Users
            SET EmailVerified = 1
            WHERE EmailVerified = 0 OR EmailVerified IS NULL
        `);
        console.log(`✓ Updated ${result.rowsAffected[0]} user accounts to EmailVerified = 1!`);

        const res = await pool.request().query(`
            SELECT UserID, Email, EmailVerified FROM dbo.Users
        `);
        console.table(res.recordset);

    } catch (err) {
        console.error('Error updating EmailVerified:', err);
    } finally {
        await sql.close();
    }
}

fixEmailVerified();
