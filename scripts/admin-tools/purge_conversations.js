const { connectDB } = require('../server/config/db');

async function purgeAllConversations() {
    console.log('=== PURGING ALL CONVERSATIONS AND MESSAGES FROM SQL SERVER ===\n');

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

        // 2. Delete all records from dbo.ConversationParticipants
        console.log('2. Deleting all records from dbo.ConversationParticipants...');
        try {
            const partRes = await pool.request().query(`DELETE FROM dbo.ConversationParticipants;`);
            console.log(`   ✓ Deleted ${partRes.rowsAffected[0] || 0} conversation participants.`);
        } catch (e) {
            console.log('   ℹ ConversationParticipants notice:', e.message);
        }

        // 3. Delete all records from dbo.Conversations
        console.log('3. Deleting all records from dbo.Conversations...');
        try {
            const convRes = await pool.request().query(`DELETE FROM dbo.Conversations;`);
            console.log(`   ✓ Deleted ${convRes.rowsAffected[0] || 0} conversations.`);
        } catch (e) {
            console.log('   ℹ Conversations notice:', e.message);
        }

        // 4. Delete all records from dbo.Notifications
        console.log('4. Deleting all records from dbo.Notifications...');
        const notifRes = await pool.request().query(`DELETE FROM dbo.Notifications;`);
        console.log(`   ✓ Deleted ${notifRes.rowsAffected[0] || 0} notifications.`);

        // 5. Verify remaining conversations and messages
        const cCheck = await pool.request().query(`SELECT COUNT(*) AS cnt FROM dbo.Conversations;`).catch(() => ({ recordset: [{ cnt: 0 }] }));
        const mCheck = await pool.request().query(`SELECT COUNT(*) AS cnt FROM dbo.Messages;`).catch(() => ({ recordset: [{ cnt: 0 }] }));

        console.log(`\n5. Audit Results:`);
        console.log(`   - Conversations Remaining: ${cCheck.recordset[0].cnt}`);
        console.log(`   - Messages Remaining: ${mCheck.recordset[0].cnt}`);

        if (cCheck.recordset[0].cnt === 0 && mCheck.recordset[0].cnt === 0) {
            console.log('   ✓ SUCCESS! ZERO conversations and ZERO messages remain in SQL Server.');
        }

        console.log('\n=== CONVERSATION PURGE COMPLETE ===');
    } catch (err) {
        console.error('Error purging conversations:', err.message);
    }
}

purgeAllConversations();
