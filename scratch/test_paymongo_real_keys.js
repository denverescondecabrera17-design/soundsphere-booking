require('dotenv').config();
const { createCheckoutSession } = require('../server/services/paymongoService');

async function testPayMongo() {
    console.log('Testing PayMongo with secret key:', process.env.PAYMONGO_SECRET_KEY);
    
    try {
        const result = await createCheckoutSession({
            amount: 5000, // PHP 5,000.00
            packageName: 'SoundSphere Pro Live Sound & Stage Setup',
            bookingReference: `TEST-PAY-${Date.now()}`,
            paymentType: 'downpayment',
            paymentMethod: 'all',
            clientEmail: 'test.client@example.com',
            clientName: 'Test Client',
            originHost: 'http://localhost:5000'
        });

        console.log('--- PayMongo Integration Result ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Test Error:', err);
    }
}

testPayMongo();
