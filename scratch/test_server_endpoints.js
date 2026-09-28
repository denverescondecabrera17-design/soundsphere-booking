async function testServer() {
    try {
        const res1 = await fetch('http://localhost:5000/api/bookings/check-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                providerId: 13,
                serviceStartDate: '2026-09-10',
                serviceEndDate: '2026-09-10',
                startTime: '06:00 PM',
                endTime: '10:00 PM'
            })
        });
        console.log('Check availability status:', res1.status, await res1.json());

        const res2 = await fetch('http://localhost:5000/api/payments/paymongo/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: 14750,
                packageName: 'Sound Package',
                paymentType: 'downpayment',
                paymentMethod: 'card'
            })
        });
        console.log('PayMongo checkout endpoint status:', res2.status, await res2.json());
    } catch (err) {
        console.error('Server test error:', err.message);
    }
}
testServer();
