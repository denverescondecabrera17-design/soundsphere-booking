const fetch = require('node-fetch');

async function testDifferentEmail() {
    console.log('--- TESTING REGISTRATION WITH A DIFFERENT EMAIL ---');

    const testEmail = `newclient.${Date.now()}@gmail.com`;
    console.log(`\n1. Registering with brand new email: ${testEmail}...`);

    try {
        const res = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Test',
                lastName: 'User',
                email: testEmail,
                phone: '09123456789',
                password: 'Password123!',
                role: 'Client'
            })
        });

        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', data);

        if (res.status === 201 && data.success) {
            console.log('✓ [PASS] Brand new email registered and email sent successfully!');
        } else {
            console.error('✕ [FAIL] Failed to process registration for different email');
        }

        // Test Forgot Password for this new email
        console.log(`\n2. Requesting Forgot Password for ${testEmail}...`);
        const forgotRes = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail })
        });
        const forgotData = await forgotRes.json();
        console.log(`Status: ${forgotRes.status}`);
        console.log('Response:', forgotData);

        if (forgotRes.status === 200 && forgotData.success) {
            console.log('✓ [PASS] Forgot password email dispatched to different email!');
        } else {
            console.error('✕ [FAIL] Forgot password failed for different email');
        }

    } catch (err) {
        console.error('Error testing different email:', err.message);
    }
}

testDifferentEmail();
