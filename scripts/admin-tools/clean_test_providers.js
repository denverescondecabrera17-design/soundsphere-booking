const { connectDB } = require('../server/config/db');

async function cleanAllTestProviderData() {
    console.log('=== CLEANING TEST PROVIDER DATA, ACTIVITY LOGS, & NOTIFICATIONS FROM SQL SERVER ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Database connection failed:', e.message);
        return;
    }

    try {
        // 1. Wipe ServiceProviders table
        console.log('1. Wiping dbo.ServiceProviders...');
        const spRes = await pool.request().query(`DELETE FROM dbo.ServiceProviders;`);
        console.log(`   ✓ Deleted ${spRes.rowsAffected[0] || 0} service provider records.`);

        // 2. Wipe ProviderApplications table
        console.log('2. Wiping dbo.ProviderApplications...');
        const paRes = await pool.request().query(`DELETE FROM dbo.ProviderApplications;`);
        console.log(`   ✓ Deleted ${paRes.rowsAffected[0] || 0} provider application records.`);

        // 3. Wipe ActivityLogs table
        console.log('3. Wiping dbo.ActivityLogs...');
        try {
            const actRes = await pool.request().query(`DELETE FROM dbo.ActivityLogs;`);
            console.log(`   ✓ Deleted ${actRes.rowsAffected[0] || 0} activity log records.`);
        } catch (e) {
            console.log('   ℹ ActivityLogs notice:', e.message);
        }

        // 4. Wipe Notifications table
        console.log('4. Wiping dbo.Notifications...');
        const notifRes = await pool.request().query(`DELETE FROM dbo.Notifications;`);
        console.log(`   ✓ Deleted ${notifRes.rowsAffected[0] || 0} notification records.`);

        // 5. Ensure all non-admin users have RoleID = 2 (Client)
        console.log('5. Ensuring denverescondecabrera17@gmail.com and all non-admin users have RoleID = 2 (Client)...');
        const roleRes = await pool.request().query(`
            UPDATE dbo.Users 
            SET RoleID = 2 
            WHERE RoleID NOT IN (1, 4) AND RoleID <> 2;
        `);
        console.log(`   ✓ Reassigned ${roleRes.rowsAffected[0] || 0} users to Client role.`);

        // 6. Audit database state
        console.log('\n=== CURRENT DATABASE USER AUDIT ===');
        const userRes = await pool.request().query(`
            SELECT u.UserID, u.Email, u.RoleID, r.RoleName 
            FROM dbo.Users u
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID;
        `);
        (userRes.recordset || []).forEach(u => {
            console.log(`   - UserID ${u.UserID}: ${u.Email} | RoleID ${u.RoleID} (${u.RoleName || 'Client'})`);
        });

        console.log('\n=== CLEANUP COMPLETED SUCCESSFULLY ===');
        console.log('Zero provider records, zero pending applications, zero test activity logs, and zero test notifications remain.');
    } catch (err) {
        console.error('Error cleaning test provider data:', err.message);
    }
}

cleanAllTestProviderData();
