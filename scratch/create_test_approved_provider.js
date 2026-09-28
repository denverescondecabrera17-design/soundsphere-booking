const bcrypt = require('bcrypt');
const { connectDB } = require('../server/config/db');

async function createTestApprovedProvider() {
    console.log('=== CREATING VERIFIED APPROVED SERVICE PROVIDER ACCOUNT ===\n');

    let pool = await connectDB();

    const providerEmail = 'provider@soundsphere.com';
    const passwordHash = await bcrypt.hash('Provider123!', 10);

    // 1. Ensure RoleID 3 exists
    const roleCheck = await pool.request().query(`SELECT RoleID FROM dbo.Roles WHERE RoleName = 'ServiceProvider';`);
    let roleId = roleCheck.recordset.length > 0 ? roleCheck.recordset[0].RoleID : 3;

    // 2. Check if user already exists
    const userCheck = await pool.request()
        .input('Email', providerEmail)
        .query(`SELECT UserID FROM dbo.Users WHERE Email = @Email;`);

    let userId;
    if (userCheck.recordset.length > 0) {
        userId = userCheck.recordset[0].UserID;
        await pool.request()
            .input('UID', userId)
            .input('RoleID', roleId)
            .input('Hash', passwordHash)
            .query(`UPDATE dbo.Users SET RoleID = @RoleID, PasswordHash = @Hash, AccountStatus = 'Active' WHERE UserID = @UID;`);
        console.log(`   ✓ Updated existing UserID ${userId} to Approved Service Provider.`);
    } else {
        const insertUser = await pool.request()
            .input('RoleID', roleId)
            .input('Email', providerEmail)
            .input('PasswordHash', passwordHash)
            .input('Phone', '09171112222')
            .query(`
                INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, AccountStatus)
                OUTPUT INSERTED.UserID
                VALUES (@RoleID, @Email, @PasswordHash, @Phone, 'Active');
            `);
        userId = insertUser.recordset[0].UserID;
        console.log(`   ✓ Created new UserID ${userId} for ${providerEmail}.`);
    }

    // 3. Upsert into dbo.ServiceProviders
    const spCheck = await pool.request().input('UID', userId).query(`SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID;`);
    if (spCheck.recordset.length === 0) {
        await pool.request()
            .input('UID', userId)
            .input('BusinessName', 'Batangas Sound & Lights Pro')
            .input('FirstName', 'Acoustix')
            .input('LastName', 'Pro')
            .input('Address', 'Balayan, Batangas')
            .input('Coverage', 'Batangas & Calabarzon')
            .query(`
                INSERT INTO dbo.ServiceProviders (UserID, BusinessName, OwnerFirstName, OwnerLastName, BusinessAddress, CoverageArea, VerificationStatus)
                VALUES (@UID, @BusinessName, @FirstName, @LastName, @Address, @Coverage, 'Approved');
            `);
        console.log('   ✓ Inserted approved record into dbo.ServiceProviders.');
    } else {
        await pool.request()
            .input('UID', userId)
            .query(`UPDATE dbo.ServiceProviders SET VerificationStatus = 'Approved' WHERE UserID = @UID;`);
        console.log('   ✓ Updated dbo.ServiceProviders record to Approved.');
    }

    // 4. Upsert into dbo.ProviderApplications
    const paCheck = await pool.request().input('UID', userId).query(`SELECT ApplicationID FROM dbo.ProviderApplications WHERE UserID = @UID;`);
    if (paCheck.recordset.length === 0) {
        await pool.request()
            .input('UID', userId)
            .input('BusinessName', 'Batangas Sound & Lights Pro')
            .input('OwnerName', 'Acoustix Pro Owner')
            .input('Address', 'Balayan, Batangas')
            .input('Coverage', 'Batangas & Calabarzon')
            .input('Contact', '09171112222')
            .query(`
                INSERT INTO dbo.ProviderApplications (UserID, BusinessName, OwnerName, BusinessAddress, CoverageArea, ContactNumber, Status)
                VALUES (@UID, @BusinessName, @OwnerName, @Address, @Coverage, @Contact, 'Approved');
            `);
        console.log('   ✓ Inserted approved record into dbo.ProviderApplications.');
    } else {
        await pool.request()
            .input('UID', userId)
            .query(`UPDATE dbo.ProviderApplications SET Status = 'Approved' WHERE UserID = @UID;`);
        console.log('   ✓ Updated dbo.ProviderApplications record to Approved.');
    }

    console.log('\n=== APPROVED SERVICE PROVIDER ACCOUNT CREATED SUCCESSFULLY ===');
    console.log(`Credentials: ${providerEmail} / Provider123!`);
}

createTestApprovedProvider();
