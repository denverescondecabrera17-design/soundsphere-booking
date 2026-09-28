const fetch = require('node-fetch');

async function testPaymongoCheckoutRoute() {
    try {
        const res = await fetch('http://localhost:5000/api/payments/paymongo/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: 505,
                packageName: 'bundle a for wedding',
                paymentType: 'downpayment',
                paymentMethod: 'GCash Direct',
                clientEmail: 'cabrera@gmail.com',
                clientName: 'Denver Cabrera'
            })
        });
        const data = await res.json();
        console.log('PayMongo Route Response:', res.status, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}

testPaymongoCheckoutRoute();
