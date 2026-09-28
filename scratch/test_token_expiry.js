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

async function testTokenExpiry() {
    const pool = await sql.connect(config);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes in future
    const tokenHash = 'test_hash_' + Date.now();

    console.log('--- TOKEN TIMEZONE TEST ---');
    console.log('1. Current Date.now():', new Date(Date.now()).toISOString());
    console.log('2. Target expiresAt:', expiresAt.toISOString());

    // Insert
    await pool.request()
        .input('UserId', sql.Int, 1)
        .input('TokenHash', sql.NVarChar(255), tokenHash)
        .input('ExpiresAt', sql.DateTime2, expiresAt)
        .query(`
            INSERT INTO dbo.PasswordResetTokens (UserId, TokenHash, ExpiresAt, CreatedAt)
            VALUES (@UserId, @TokenHash, @ExpiresAt, GETDATE())
        `);

    // Fetch back
    const res = await pool.request()
        .input('TokenHash', sql.NVarChar(255), tokenHash)
        .query(`SELECT Id, ExpiresAt, GETDATE() as SqlNow, SYSUTCDATETIME() as SqlUtcNow FROM dbo.PasswordResetTokens WHERE TokenHash = @TokenHash`);

    const row = res.recordset[0];
    console.log('3. Raw DB record fetched from SQL Server:');
    console.log('   row.ExpiresAt:', row.ExpiresAt);
    console.log('   row.SqlNow:', row.SqlNow);
    console.log('   row.SqlUtcNow:', row.SqlUtcNow);
    console.log('4. JS Date parsing of row.ExpiresAt:');
    const parsedExp = new Date(row.ExpiresAt).getTime();
    console.log('   parsedExp:', new Date(parsedExp).toISOString());
    console.log('   Date.now():', new Date(Date.now()).toISOString());
    console.log('   Difference (parsedExp - Date.now()):', Math.round((parsedExp - Date.now()) / 1000 / 60), 'minutes');
    console.log('   Is Expired? (parsedExp < Date.now()):', parsedExp < Date.now());

    await sql.close();
}

testTokenExpiry();
