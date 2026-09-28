const { connectDB } = require('../server/config/db');

async function wipeMessagesTable() {
    console.log('=== WIPING MESSAGES AND NOTIFICATIONS FROM SQL SERVER ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Database connection failed:', e.message);
        return;
    }

    try {
        // 1. Delete all records from dbo.Messages
        console.log('1. Deleting all records from dbo.Messages...');
        const msgRes = await pool.request().query(`DELETE FROM dbo.Messages;`);
        console.log(`   ✓ Deleted ${msgRes.rowsAffected[0] || 0} messages.`);

        // 2. Delete all records from dbo.Notifications
        console.log('2. Deleting all records from dbo.Notifications...');
        const notifRes = await pool.request().query(`DELETE FROM dbo.Notifications;`);
        console.log(`   ✓ Deleted ${notifRes.rowsAffected[0] || 0} notifications.`);

        // 3. Verify dbo.Messages count
        const checkRes = await pool.request().query(`SELECT COUNT(*) AS cnt FROM dbo.Messages;`);
        const remainingCount = checkRes.recordset[0].cnt;
        console.log(`\n3. Verifying remaining messages: ${remainingCount}`);

        if (remainingCount === 0) {
            console.log('   ✓ SUCCESS! ZERO messages remain in SQL Server.');
        }

        console.log('\n=== WIPE COMPLETE ===');
    } catch (err) {
        console.error('Error wiping messages:', err.message);
    }
}

wipeMessagesTable();
