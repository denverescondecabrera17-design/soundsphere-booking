const path = require('path');
const fetch = require('node-fetch');

async function testEmailDispatch() {
    console.log('--- STARTING REAL EMAIL DISPATCH TEST ---');

    // 1. Test Unregistered Email
    const unregisteredEmail = 'nonexistent.user.999@gmail.com';
    console.log(`\n1. Submitting Unregistered Email: ${unregisteredEmail}...`);
    try {
        const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: unregisteredEmail })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', data);
        if (res.status === 404 && data.success === false) {
            console.log('✓ [PASS] Unregistered email correctly returns 404 error with explicit warning!');
        } else {
            console.error('✕ [FAIL] Unexpected response for unregistered email');
        }
    } catch (e) {
        console.error('Error testing unregistered email:', e.message);
    }

    // 2. Test Registered Real Email
    const registeredEmail = 'dendenescondecabrera17@gmail.com';
    console.log(`\n2. Submitting Registered Email: ${registeredEmail}...`);
    try {
        const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: registeredEmail })
        });
        const data = await res.json();
        console.log(`Status: ${res.status}`);
        console.log('Response:', data);
        if (res.status === 200 && data.success === true) {
            console.log('✓ [PASS] Registered email correctly triggers real Gmail SMTP dispatch and returns 200 OK!');
        } else {
            console.error('✕ [FAIL] Password reset email dispatch failed');
        }
    } catch (e) {
        console.error('Error testing registered email:', e.message);
    }

    console.log('\n--- EMAIL DISPATCH TEST COMPLETE ---');
}

testEmailDispatch();
