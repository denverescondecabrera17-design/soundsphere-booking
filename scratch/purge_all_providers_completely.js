const { connectDB } = require('../server/config/db');

async function purgeAllProvidersCompletely() {
    console.log('=== PURGING ALL SERVICE PROVIDERS FROM SQL SERVER ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Database connection failed:', e.message);
        return;
    }

    try {
        // 1. Delete dependent tables
        console.log('1. Wiping Reviews...');
        const rRes = await pool.request().query(`DELETE FROM dbo.Reviews;`);
        console.log(`   ✓ Deleted ${rRes.rowsAffected[0] || 0} reviews.`);

        console.log('2. Wiping Bookings...');
        const bRes = await pool.request().query(`DELETE FROM dbo.Bookings;`);
        console.log(`   ✓ Deleted ${bRes.rowsAffected[0] || 0} bookings.`);

        console.log('3. Wiping Packages...');
        const pRes = await pool.request().query(`DELETE FROM dbo.Packages;`);
        console.log(`   ✓ Deleted ${pRes.rowsAffected[0] || 0} packages.`);

        console.log('4. Wiping Services...');
        try {
            const sRes = await pool.request().query(`DELETE FROM dbo.Services;`);
            console.log(`   ✓ Deleted ${sRes.rowsAffected[0] || 0} services.`);
        } catch (e) {
            console.log('   ℹ Services notice:', e.message);
        }

        console.log('5. Wiping ServiceProviders...');
        const spRes = await pool.request().query(`DELETE FROM dbo.ServiceProviders;`);
        console.log(`   ✓ Deleted ${spRes.rowsAffected[0] || 0} service provider profiles.`);

        console.log('6. Wiping ProviderApplications...');
        const paRes = await pool.request().query(`DELETE FROM dbo.ProviderApplications;`);
        console.log(`   ✓ Deleted ${paRes.rowsAffected[0] || 0} provider applications.`);

        console.log('7. Wiping Withdrawals...');
        try {
            const wRes = await pool.request().query(`DELETE FROM dbo.Withdrawals;`);
            console.log(`   ✓ Deleted ${wRes.rowsAffected[0] || 0} withdrawals.`);
        } catch (e) {
            console.log('   ℹ Withdrawals notice:', e.message);
        }

        // 8. Delete all ServiceProvider User Accounts (RoleID = 3 or RoleName = ServiceProvider)
        console.log('8. Deleting all Service Provider User accounts from dbo.Users...');
        const uRes = await pool.request().query(`
            DELETE FROM dbo.Users 
            WHERE RoleID = 3 
               OR RoleID IN (SELECT RoleID FROM dbo.Roles WHERE RoleName = 'ServiceProvider') 
               OR Email = 'provider@soundsphere.com';
        `);
        console.log(`   ✓ Deleted ${uRes.rowsAffected[0] || 0} Service Provider user accounts.`);

        // 9. Update any remaining users to ensure only Client (RoleID 2) or Admin (RoleID 1) exist
        console.log('9. Ensuring all remaining users are strictly Client or Admin...');
        const fixRes = await pool.request().query(`
            UPDATE dbo.Users 
            SET RoleID = 2 
            WHERE RoleID NOT IN (SELECT RoleID FROM dbo.Roles WHERE RoleName IN ('Admin', 'Administrator', 'Client'));
        `);
        console.log(`   ✓ Reassigned ${fixRes.rowsAffected[0] || 0} non-standard users to Client role.`);

        // 10. Audit remaining users in database
        console.log('\n=== CURRENT DATABASE USER AUDIT ===');
        const auditRes = await pool.request().query(`
            SELECT u.UserID, u.Email, u.RoleID, r.RoleName 
            FROM dbo.Users u
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID;
        `);
        console.log('Remaining User Accounts in dbo.Users:');
        (auditRes.recordset || []).forEach(u => {
            console.log(`   - UserID ${u.UserID}: ${u.Email} | RoleID ${u.RoleID} (${u.RoleName || 'N/A'})`);
        });

        console.log('\n=== PURGE COMPLETED SUCCESSFULLY ===');
        console.log('The database now contains ONLY Client and Admin users.');
    } catch (err) {
        console.error('Error purging service providers:', err.message);
    }
}

purgeAllProvidersCompletely();
