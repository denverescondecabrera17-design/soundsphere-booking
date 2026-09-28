/**
 * Scratch Test Script: Verify Real SQL Server Database Messaging
 */

const { getPool, connectDB } = require('../server/config/db');
const messageModel = require('../server/models/messageModel');

const runTest = async () => {
    await connectDB();
    const pool = getPool();

    console.log('--- Testing Messaging System ---');

    // 1. Get client user and provider user
    const usersRes = await pool.request().query(`
        SELECT TOP 2 UserID, Email FROM dbo.Users WHERE AccountStatus = 'Active' ORDER BY UserID ASC
    `);

    if (usersRes.recordset.length < 2) {
        console.log('Not enough users for testing.');
        process.exit(0);
    }

    const u1 = usersRes.recordset[0].UserID;
    const u2 = usersRes.recordset[1].UserID;

    console.log(`Testing 1-to-1 conversation between User #${u1} and User #${u2}...`);

    // 2. Find or create conversation
    const conv = await messageModel.findOrCreateConversation({ user1Id: u1, user2Id: u2 });
    console.log('Conversation Record:', conv);

    // 3. Send message from u1 to u2
    const msg = await messageModel.sendMessage({
        conversationId: conv.ConversationID || conv.conversationId,
        senderUserId: u1,
        messageText: 'Hello! This is a real database test message for SoundSphere.'
    });

    console.log('Sent Message Record:', msg);

    // 4. Retrieve conversation messages
    const thread = await messageModel.getConversationMessages({
        conversationId: conv.ConversationID || conv.conversationId,
        userId: u2
    });

    console.log(`Retrieved Thread (${thread.length} messages):`, thread);

    console.log('--- Test Completed Successfully ---');
    process.exit(0);
};

runTest().catch(err => {
    console.error('Test Failed:', err);
    process.exit(1);
});