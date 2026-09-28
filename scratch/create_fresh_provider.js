const bcrypt = require('bcrypt');
const { connectDB } = require('../server/config/db');

async function createFreshProvider() {
    console.log('=== CREATING FRESH SINGLE SERVICE PROVIDER ACCOUNT ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Database connection failed:', e.message);
        return;
    }

    try {
        const email = 'provider@soundsphere.com';
        const rawPassword = 'Provider123!';
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // 1. Remove any existing account with email provider@soundsphere.com
        await pool.request().input('Email', email).query(`
            DELETE FROM dbo.Packages WHERE UserID IN (SELECT UserID FROM dbo.Users WHERE Email = @Email);
            DELETE FROM dbo.ServiceProviders WHERE UserID IN (SELECT UserID FROM dbo.Users WHERE Email = @Email);
            DELETE FROM dbo.ProviderApplications WHERE UserID IN (SELECT UserID FROM dbo.Users WHERE Email = @Email);
            DELETE FROM dbo.Users WHERE Email = @Email;
        `);

        // 2. Insert into dbo.Users
        const userIns = await pool.request()
            .input('RoleID', 3) // ServiceProvider Role
            .input('Email', email)
            .input('PasswordHash', hashedPassword)
            .input('Phone', '09171234567')
            .input('AccountStatus', 'Active')
            .query(`
                INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, AccountStatus, CreatedAt)
                OUTPUT INSERTED.UserID
                VALUES (@RoleID, @Email, @PasswordHash, @Phone, @AccountStatus, GETDATE());
            `);

        const providerUserId = userIns.recordset[0].UserID;
        console.log(`✓ Created User Account (UserID: ${providerUserId}, Email: ${email})`);

        // 3. Insert Client Profile details
        try {
            await pool.request()
                .input('UserID', providerUserId)
                .input('FirstName', 'Denver')
                .input('LastName', 'Cabrera')
                .input('FullName', 'Denver Cabrera')
                .input('Address', 'Batangas City')
                .query(`
                    INSERT INTO dbo.Clients (UserID, FirstName, LastName, FullName, Address, CreatedAt)
                    VALUES (@UserID, @FirstName, @LastName, @FullName, @Address, GETDATE());
                `);
        } catch (e) { console.warn('Notice inserting Client record:', e.message); }

        // 4. Insert into dbo.ServiceProviders
        const spIns = await pool.request()
            .input('UserID', providerUserId)
            .input('BusinessName', 'SoundSphere Audio & Lights')
            .input('BusinessAddress', 'Batangas City')
            .input('CoverageArea', 'Batangas City & Nearby Areas')
            .query(`
                INSERT INTO dbo.ServiceProviders (UserID, BusinessName, BusinessAddress, CoverageArea, VerificationStatus, CreatedAt)
                OUTPUT INSERTED.ProviderID
                VALUES (@UserID, @BusinessName, @BusinessAddress, @CoverageArea, 'Approved', GETDATE());
            `);
        const providerId = spIns.recordset[0].ProviderID;
        console.log(`✓ Created Service Provider Profile (ProviderID: ${providerId}, BusinessName: SoundSphere Audio & Lights)`);

        // 5. Insert into dbo.ProviderApplications
        try {
            await pool.request()
                .input('UserID', providerUserId)
                .input('BusinessName', 'SoundSphere Audio & Lights')
                .input('CoverageArea', 'Batangas City & Nearby Areas')
                .query(`
                    INSERT INTO dbo.ProviderApplications (UserID, BusinessName, CoverageArea, Status, AppliedAt)
                    VALUES (@UserID, @BusinessName, @CoverageArea, 'Approved', GETDATE());
                `);
        } catch (e) { console.warn('Notice inserting ProviderApplications:', e.message); }

        // 6. Insert Starter Service Package
        await pool.request()
            .input('UserID', providerUserId)
            .input('PackageName', 'Complete Concert Sound & Stage Lights')
            .input('Category', 'Concert Audio')
            .input('Price', 20000.00)
            .input('Description', 'High performance line array speakers with intelligent beam moving heads.')
            .input('Inclusions', '4x Powered Active Speakers, 2x Dual Subwoofers, 8x Beam Moving Heads, DMX Controller')
            .query(`
                INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions, IsActive, CreatedAt)
                VALUES (@UserID, @PackageName, @Category, @Price, @Description, @Inclusions, 1, GETDATE());
            `);
        console.log('✓ Created Starter Package: "Complete Concert Sound & Stage Lights" (₱20,000.00)');

        console.log('\n=== CREATION COMPLETE ===');
        console.log(`Email: ${email}`);
        console.log(`Password: ${rawPassword}`);
        console.log(`Role: ServiceProvider (RoleID: 3)`);
    } catch (err) {
        console.error('Error creating provider account:', err.message);
    }
}

createFreshProvider();
