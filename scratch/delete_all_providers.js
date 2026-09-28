const { connectDB } = require('../server/config/db');

async function deleteAllServiceProviders() {
    console.log('=== DELETING ALL SERVICE PROVIDER DATA FROM SQL SERVER ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Failed to connect to database:', e.message);
        return;
    }

    try {
        // 1. Delete dependent records first (Foreign Key constraints)
        console.log('1. Deleting Reviews...');
        const revRes = await pool.request().query(`DELETE FROM dbo.Reviews;`);
        console.log(`   ✓ Deleted ${revRes.rowsAffected[0] || 0} reviews.`);

        console.log('2. Deleting Bookings...');
        const bkRes = await pool.request().query(`DELETE FROM dbo.Bookings;`);
        console.log(`   ✓ Deleted ${bkRes.rowsAffected[0] || 0} bookings.`);

        console.log('3. Deleting Packages...');
        const pkgRes = await pool.request().query(`DELETE FROM dbo.Packages;`);
        console.log(`   ✓ Deleted ${pkgRes.rowsAffected[0] || 0} packages.`);

        console.log('4. Deleting Services (if table exists)...');
        try {
            const srvRes = await pool.request().query(`DELETE FROM dbo.Services;`);
            console.log(`   ✓ Deleted ${srvRes.rowsAffected[0] || 0} services.`);
        } catch (e) {
            console.log('   ℹ Services table clean notice:', e.message);
        }

        console.log('5. Deleting Withdrawals (if table exists)...');
        try {
            const wRes = await pool.request().query(`DELETE FROM dbo.Withdrawals;`);
            console.log(`   ✓ Deleted ${wRes.rowsAffected[0] || 0} withdrawals.`);
        } catch (e) {
            console.log('   ℹ Withdrawals table clean notice:', e.message);
        }

        console.log('6. Deleting Notifications...');
        try {
            const nRes = await pool.request().query(`DELETE FROM dbo.Notifications;`);
            console.log(`   ✓ Deleted ${nRes.rowsAffected[0] || 0} notifications.`);
        } catch (e) {
            console.log('   ℹ Notifications table clean notice:', e.message);
        }

        console.log('7. Deleting Service Providers...');
        const spRes = await pool.request().query(`DELETE FROM dbo.ServiceProviders;`);
        console.log(`   ✓ Deleted ${spRes.rowsAffected[0] || 0} service provider profiles.`);

        console.log('8. Deleting Provider Applications...');
        const paRes = await pool.request().query(`DELETE FROM dbo.ProviderApplications;`);
        console.log(`   ✓ Deleted ${paRes.rowsAffected[0] || 0} provider applications.`);

        console.log('\n=== ALL SERVICE PROVIDER RECORDS DELETED SUCCESSFULLY ===');
    } catch (err) {
        console.error('Error during deletion:', err.message);
    }
}

deleteAllServiceProviders();
