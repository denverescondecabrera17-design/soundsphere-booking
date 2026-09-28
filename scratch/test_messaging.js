const fetch = require('node-fetch');

async function testMessagingAPI() {
    try {
        console.log('--- Testing Messaging API Endpoints ---');

        // 1. Fetch conversations for user ID 1
        const convRes = await fetch('http://localhost:5000/api/messages/conversations?userId=1');
        const convData = await convRes.json();
        console.log('User 1 Conversations count:', convData.conversations ? convData.conversations.length : 0);

        // 2. Start/Find conversation between Client (userId: 1) and Provider (providerId: 2)
        const startRes = await fetch('http://localhost:5000/api/messages/conversations?userId=1', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 1, providerId: 2 })
        });
        const startData = await startRes.json();
        console.log('Start Conversation Result:', startData);

        if (startData.success && startData.conversation) {
            const convId = startData.conversation.ConversationID || startData.conversation.conversationId;
            
            // 3. Send message from Client (userId 1) to Provider
            const sendRes = await fetch('http://localhost:5000/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: convId,
                    userId: 1,
                    messageText: 'Hello Provider! Can we confirm availability for August 15?'
                })
            });
            const sendData = await sendRes.json();
            console.log('Client Sent Message Result:', sendData);

            // 4. Fetch messages in thread
            const threadRes = await fetch(`http://localhost:5000/api/messages/conversations/${convId}?userId=1`);
            const threadData = await threadRes.json();
            console.log('Thread Messages count:', threadData.messages ? threadData.messages.length : 0);
            if (threadData.messages && threadData.messages.length > 0) {
                console.log('Latest message in thread:', threadData.messages[threadData.messages.length - 1]);
            }
        }

    } catch (err) {
        console.error('Error during test:', err);
    }
}

testMessagingAPI();
