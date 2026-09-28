const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SoundSphereDB',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function testEmailUpdateLogic() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server DB.');

        // Fetch User ID 8 details
        const u8 = await pool.request()
            .input('UserID', sql.Int, 8)
            .query("SELECT UserID, Email, EmailVerified FROM dbo.Users WHERE UserID = @UserID");

        console.log('User 8 current state:', u8.recordset[0]);

        // Duplicate email check test
        const dupCheck = await pool.request()
            .input('Email', sql.NVarChar(255), 'soundsphere@gmail.com')
            .input('UserID', sql.Int, 8)
            .query("SELECT UserID FROM dbo.Users WHERE Email = @Email AND UserID != @UserID");

        console.log('Duplicate check for soundsphere@gmail.com on User 8 -> Matches:', dupCheck.recordset.length);

        await pool.close();
    } catch (err) {
        console.error('Test error:', err.message);
    }
}

testEmailUpdateLogic();
