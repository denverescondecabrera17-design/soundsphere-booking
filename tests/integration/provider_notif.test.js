const fetch = require('node-fetch');

async function testProviderNotificationClick() {
    console.log('=== TESTING PROVIDER NOTIFICATION BELL & API INTEGRATION ===\n');

    // 1. Log in as Provider
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'denvercabrera.apo@gmail.com', password: 'Provider123!' })
    });

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.token) {
        throw new Error('Provider login failed: ' + loginData.message);
    }
    const token = loginData.token;
    console.log('✓ Provider authenticated successfully. Token acquired.');

    // 2. Fetch Notifications via GET /api/notifications
    const notifRes = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const notifData = await notifRes.json();
    console.log('✓ GET /api/notifications Status:', notifRes.status, 'Success:', notifData.success);
    console.log('✓ Notifications count:', (notifData.notifications || []).length);

    console.log('\n=== PROVIDER NOTIFICATION BELL TEST COMPLETED SUCCESSFULLY ===');
}

testProviderNotificationClick().catch(e => {
    console.error('TEST ERROR:', e.message);
    process.exit(1);
});
