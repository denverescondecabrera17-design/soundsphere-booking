const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function setCabreraAsProvider() {
    try {
        await connectDB();
        const pool = getPool();
        const hash = await bcrypt.hash('password123', 10);

        // Update UserID 2 (cabrera@gmail.com) to RoleID = 3 (ServiceProvider)
        await pool.request()
            .input('Hash', hash)
            .input('Email', 'cabrera@gmail.com')
            .query(`UPDATE Users SET RoleID = 3, PasswordHash = @Hash, EmailVerified = 1, IsActive = 1 WHERE Email = @Email`);

        // Check if UserID 2 already has an entry in ServiceProviders
        const checkSp = await pool.request()
            .input('UserID', 2)
            .query(`SELECT * FROM ServiceProviders WHERE UserID = @UserID`);

        if (checkSp.recordset.length === 0) {
            await pool.request().query(`
                INSERT INTO ServiceProviders (UserID, BusinessName, OwnerName, OwnerFirstName, OwnerLastName, BusinessAddress, CoverageArea, Description, VerificationStatus, ContactNumber)
                VALUES (2, 'CHiCHa Lights and Sounds', 'Denver Cabrera', 'Denver', 'Cabrera', 'Lian, Balayan, Nasugbu', 'Lian, Balayan, Nasugbu', 'Professional Lights & Sounds Service Provider.', 'Approved', '09516028992')
            `);
        } else {
            await pool.request()
                .input('UserID', 2)
                .query(`UPDATE ServiceProviders SET VerificationStatus = 'Approved', BusinessName = 'CHiCHa Lights and Sounds' WHERE UserID = @UserID`);
        }

        console.log('Successfully set cabrera@gmail.com (UserID 2) as an Approved Service Provider!');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

setCabreraAsProvider();
