const { connectDB, sql } = require('../server/config/db');

async function purgeDemoData() {
    try {
        console.log('Connecting to SQL Server...');
        const pool = await connectDB();

        // 1. Purge demo rows from dbo.Bookings
        await pool.request().query("DELETE FROM dbo.Bookings");
        console.log('✅ Cleared demo records from dbo.Bookings');

        // 2. Purge demo rows from dbo.Reviews
        await pool.request().query("DELETE FROM dbo.Reviews");
        console.log('✅ Cleared demo records from dbo.Reviews');

        // 3. Purge demo rows from dbo.Notifications
        await pool.request().query("DELETE FROM dbo.Notifications");
        console.log('✅ Cleared demo records from dbo.Notifications');

        // 4. Reset provider applications
        await pool.request().query("DELETE FROM dbo.ProviderApplications");
        console.log('✅ Cleared demo records from dbo.ProviderApplications');

        // 5. Reset all non-admin user roles to Client (RoleID = 2) for clean baseline testing
        await pool.request().query("UPDATE dbo.Users SET RoleID = 2 WHERE RoleID != 1 AND Email != 'soundsphere@gmail.com'");
        console.log('✅ Reset test user roles to Client (RoleID = 2)');

        console.log('🎉 Demo data purge completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Purge Error:', err);
        process.exit(1);
    }
}

purgeDemoData();
