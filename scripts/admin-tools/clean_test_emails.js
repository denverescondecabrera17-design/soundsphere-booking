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

async function removeTempUser() {
    try {
        const pool = await sql.connect(config);
        await pool.request().query(`DELETE FROM dbo.PasswordResetTokens WHERE UserId = 25`);
        await pool.request().query(`DELETE FROM dbo.Clients WHERE UserID = 25`);
        await pool.request().query(`DELETE FROM dbo.Users WHERE UserID = 25`);
        console.log('✓ Temp user 25 cleaned!');

        const remaining = await pool.request().query(`
            SELECT u.UserID, u.Email, r.RoleName, c.FirstName, c.LastName
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            ORDER BY u.UserID ASC
        `);
        console.table(remaining.recordset);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.close();
    }
}

removeTempUser();
