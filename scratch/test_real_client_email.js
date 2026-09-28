const fetch = require('node-fetch');

async function testRealClientEmailDispatch() {
    console.log('--- TESTING REAL EMAIL DISPATCH FOR REGISTERED CLIENT ---');

    const clientEmail = 'dendenescondecabrera17@gmail.com';
    console.log(`Sending password reset email to client: ${clientEmail}...`);

    try {
        const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: clientEmail })
        });

        const data = await res.json();
        console.log('API Response:', data);

        if (res.ok && data.success) {
            console.log('✓ [PASS] Real email sent directly to client email address!');
        } else {
            console.error('✕ [FAIL] Email dispatch failed:', data.message);
        }
    } catch (err) {
        console.error('Error during client email test:', err.message);
    }
}

testRealClientEmailDispatch();
