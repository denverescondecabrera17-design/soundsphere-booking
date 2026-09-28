const paymongoService = require('../server/services/paymongoService');

async function testPayMongo() {
    console.log('Testing PayMongo Checkout Session creation...');
    const result = await paymongoService.createCheckoutSession({
        amount: 14750,
        packageName: 'Sound & Light Deluxe Package',
        bookingReference: 'SS-2026-TEST01',
        paymentType: 'downpayment',
        paymentMethod: 'card',
        clientEmail: 'client@example.com',
        clientName: 'Test Client',
        originHost: 'http://localhost:5000'
    });

    console.log('PayMongo Session Result:', result);
}

testPayMongo();
