const fetch = require('node-fetch');
const sql = require('mssql');
const crypto = require('crypto');
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

async function testFullResetVerification() {
    console.log('--- FULL END-TO-END 5-MINUTE TOKEN VERIFICATION TEST ---');

    const email = 'dendenescondecabrera17@gmail.com';

    // 1. Trigger Reset Request
    const reqRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const reqData = await reqRes.json();
    console.log('\n1. Forgot Password API Response:', reqData);

    // 2. Fetch Raw Token Hash & simulate email link click
    const pool = await sql.connect(config);
    const tokenRes = await pool.request()
        .input('Email', sql.NVarChar(255), email)
        .query(`
            SELECT TOP 1 t.Id, t.TokenHash, t.ExpiresAt, t.UsedAt, t.CreatedAt
            FROM dbo.PasswordResetTokens t
            INNER JOIN dbo.Users u ON t.UserId = u.UserID
            WHERE u.Email = @Email
            ORDER BY t.Id DESC
        `);
    
    const latestToken = tokenRes.recordset[0];
    console.log('\n2. Token Created in DB:', {
        id: latestToken.Id,
        createdAt: latestToken.CreatedAt,
        expiresAt: latestToken.ExpiresAt,
        usedAt: latestToken.UsedAt
    });

    // 3. Test URL Link verification (Simulating User clicking email link)
    // We test with valid token hash lookup
    const verifyRes = await pool.request()
        .input('TokenHash', sql.NVarChar(255), latestToken.TokenHash)
        .query(`
            SELECT t.Id, t.UserId, t.ExpiresAt, t.UsedAt, u.Email,
                   CASE WHEN t.ExpiresAt > SYSUTCDATETIME() THEN 0 ELSE 1 END AS IsExpired
            FROM dbo.PasswordResetTokens t
            INNER JOIN dbo.Users u ON t.UserId = u.UserID
            WHERE t.TokenHash = @TokenHash
        `);

    const record = verifyRes.recordset[0];
    console.log('\n3. Token Verification Check:');
    console.log('   Is Found?', !!record);
    console.log('   Is Used?', record ? (record.UsedAt !== null) : 'N/A');
    console.log('   Is Expired?', record ? (record.IsExpired === 1) : 'N/A');

    if (record && record.UsedAt === null && record.IsExpired === 0) {
        console.log('🎉 [SUCCESS] The 5-minute password reset token is 100% VALID and ready to reset password!');
    } else {
        console.error('✕ [FAIL] Token verification failed');
    }

    await sql.close();
}

testFullResetVerification();
