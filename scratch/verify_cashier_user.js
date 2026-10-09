const { connectDB, sql } = require('../server/config/db');
const bcrypt = require('bcrypt');

async function verifyAndSeedCashier() {
    console.log('--- STEP 1: Verifying / Seeding Cashier in MSSQL Database ---');
    const pool = await connectDB();

    // 1. Ensure Cashier Role exists
    let roleRes = await pool.request().query("SELECT RoleID, RoleName FROM dbo.Roles WHERE RoleName = 'Cashier'");
    let cashierRoleId = 4;
    if (roleRes.recordset.length === 0) {
        const insertRole = await pool.request().query("INSERT INTO dbo.Roles (RoleName, Description) OUTPUT INSERTED.RoleID VALUES ('Cashier', 'Finance and Cashier Staff')");
        cashierRoleId = insertRole.recordset[0].RoleID;
        console.log('Created Cashier Role with RoleID:', cashierRoleId);
    } else {
        cashierRoleId = roleRes.recordset[0].RoleID;
        console.log('Existing Cashier Role found with RoleID:', cashierRoleId);
    }

    // 2. Email & Password
    const cashierEmail = 'cashier@soundsphere.com';
    const cashierPasswordPlain = 'Cashier@123';
    const passwordHash = await bcrypt.hash(cashierPasswordPlain, 10);

    const userCheck = await pool.request()
        .input('Email', sql.NVarChar(255), cashierEmail)
        .query("SELECT UserID, RoleID, Email, PasswordHash, EmailVerified, IsActive, AccountStatus FROM dbo.Users WHERE Email = @Email");

    let cashierUserId = null;
    if (userCheck.recordset.length === 0) {
        const insertUser = await pool.request()
            .input('RoleID', sql.Int, cashierRoleId)
            .input('Email', sql.NVarChar(255), cashierEmail)
            .input('PasswordHash', sql.NVarChar(255), passwordHash)
            .input('Phone', sql.NVarChar(20), '09191234567')
            .input('EmailVerified', sql.Bit, 1)
            .input('IsActive', sql.Bit, 1)
            .input('AccountStatus', sql.NVarChar(20), 'Active')
            .query(`
                INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, EmailVerified, IsActive, AccountStatus)
                OUTPUT INSERTED.UserID
                VALUES (@RoleID, @Email, @PasswordHash, @Phone, @EmailVerified, @IsActive, @AccountStatus)
            `);
        cashierUserId = insertUser.recordset[0].UserID;
        console.log('Created Cashier User in dbo.Users with UserID:', cashierUserId);

        await pool.request()
            .input('UserID', sql.Int, cashierUserId)
            .input('FirstName', sql.NVarChar(100), 'Official')
            .input('LastName', sql.NVarChar(100), 'Cashier')
            .query(`
                IF OBJECT_ID('dbo.Clients', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.Clients (UserID, FirstName, LastName)
                    VALUES (@UserID, @FirstName, @LastName);
                END
            `);
    } else {
        cashierUserId = userCheck.recordset[0].UserID;
        await pool.request()
            .input('UserID', sql.Int, cashierUserId)
            .input('RoleID', sql.Int, cashierRoleId)
            .input('PasswordHash', sql.NVarChar(255), passwordHash)
            .query("UPDATE dbo.Users SET RoleID = @RoleID, PasswordHash = @PasswordHash, EmailVerified = 1, IsActive = 1, AccountStatus = 'Active' WHERE UserID = @UserID");
        console.log('Updated & verified Cashier User in dbo.Users with UserID:', cashierUserId);
    }

    // 3. Query DB Record
    const dbRecord = await pool.request()
        .input('UserID', sql.Int, cashierUserId)
        .query(`
            SELECT u.UserID, u.Email, u.Phone, u.EmailVerified, u.IsActive, u.AccountStatus, r.RoleName, r.RoleID
            FROM dbo.Users u
            JOIN dbo.Roles r ON u.RoleID = r.RoleID
            WHERE u.UserID = @UserID;
        `);
    console.log('\n--- STEP 2: Current DB Record for Cashier ---');
    console.log(JSON.stringify(dbRecord.recordset[0], null, 2));

    // 4. Test API Login
    console.log('\n--- STEP 3: Testing Login API with Cashier Credentials ---');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: cashierEmail,
            password: cashierPasswordPlain
        })
    });
    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Result:', JSON.stringify(loginData, null, 2));

    process.exit(0);
}

verifyAndSeedCashier().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
