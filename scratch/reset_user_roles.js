const { connectDB } = require('../server/config/db');
const providerModel = require('../server/models/providerModel');

async function resetAllProviderRoles() {
    console.log('=== RESETTING ALL SERVICE PROVIDER ROLES IN USERS TABLE ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Failed to connect to database:', e.message);
        return;
    }

    try {
        // Find role IDs for Client and ServiceProvider
        const rolesRes = await pool.request().query(`SELECT * FROM dbo.Roles;`);
        console.log('Current dbo.Roles in database:');
        (rolesRes.recordset || []).forEach(r => console.log(`   - RoleID ${r.RoleID}: ${r.RoleName}`));

        // 1. Update all users with RoleID 3 (ServiceProvider) to RoleID 2 (Client)
        console.log('\n1. Updating users with RoleID = 3 or RoleName = ServiceProvider to Client role...');
        const updateUsersRes = await pool.request().query(`
            UPDATE dbo.Users 
            SET RoleID = (SELECT TOP 1 RoleID FROM dbo.Roles WHERE RoleName = 'Client')
            WHERE RoleID = 3 OR RoleID IN (SELECT RoleID FROM dbo.Roles WHERE RoleName = 'ServiceProvider');
        `);
        console.log(`   ✓ Updated ${updateUsersRes.rowsAffected[0] || 0} user accounts back to Client role.`);

        // 2. Wipe ServiceProviders and ProviderApplications tables completely
        console.log('2. Wiping dbo.ServiceProviders and dbo.ProviderApplications...');
        await pool.request().query(`DELETE FROM dbo.ServiceProviders;`);
        await pool.request().query(`DELETE FROM dbo.ProviderApplications;`);
        await pool.request().query(`DELETE FROM dbo.Packages;`);
        await pool.request().query(`DELETE FROM dbo.Services WHERE 1=1;`).catch(() => {});
        console.log('   ✓ Wiped provider tables.');

        // 3. Verify getAllApprovedProviders returns 0 providers
        console.log('\n3. Verifying getAllApprovedProviders query result...');
        const remainingProviders = await providerModel.getAllApprovedProviders();
        console.log(`   ✓ Remaining Providers Count: ${remainingProviders.length}`);
        if (remainingProviders.length === 0) {
            console.log('   ✓ SUCCESS! ZERO service providers remain in the system.');
        } else {
            console.log('   ⚠️ Remaining providers:', remainingProviders);
        }

        console.log('\n=== RESET COMPLETE ===');
    } catch (err) {
        console.error('Error during role reset:', err.message);
    }
}

resetAllProviderRoles();
