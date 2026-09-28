const fetch = require('node-fetch');

async function testProviderReply() {
    try {
        console.log('--- Testing Provider Side Messaging & Reply ---');

        // 1. Provider (User 2) fetches their conversations
        const convRes = await fetch('http://localhost:5000/api/messages/conversations?userId=2');
        const convData = await convRes.json();
        console.log('Provider (User 2) Conversations count:', convData.conversations ? convData.conversations.length : 0);
        
        if (convData.conversations && convData.conversations.length > 0) {
            const clientConv = convData.conversations[0];
            console.log('Provider active partner name:', clientConv.partner.name);
            console.log('Provider active partner role:', clientConv.partner.role);

            // 2. Provider replies to Client in ConversationID 3
            const replyRes = await fetch('http://localhost:5000/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId: clientConv.conversationId,
                    userId: 2, // Provider UserID
                    messageText: 'Hello Denver! Yes, our line array system is fully available for August 15. We would be happy to cater your event!'
                })
            });
            const replyData = await replyRes.json();
            console.log('Provider Sent Reply Result:', replyData);

            // 3. Client (User 1) re-fetches the thread to verify receiving the Provider reply
            const clientThreadRes = await fetch(`http://localhost:5000/api/messages/conversations/${clientConv.conversationId}?userId=1`);
            const clientThreadData = await clientThreadRes.json();
            console.log('Client view of thread total messages:', clientThreadData.messages ? clientThreadData.messages.length : 0);
            
            clientThreadData.messages.forEach((msg, idx) => {
                console.log(`Msg ${idx + 1} [From Sender ${msg.senderId}]: ${msg.text}`);
            });
        }

    } catch (err) {
        console.error('Error during provider reply test:', err);
    }
}

testProviderReply();
