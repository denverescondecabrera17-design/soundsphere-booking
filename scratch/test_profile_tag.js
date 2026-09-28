const fetch = require('node-fetch');

async function testProfileVerificationTag() {
    console.log('--- TESTING USER PROFILE API RESPONSE ---');
    try {
        const res = await fetch('http://localhost:5000/api/users/profile?userId=1');
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('User Profile Data:', data.user);
        if (data.user && (data.user.emailVerified === true || data.user.EmailVerified === 1)) {
            console.log('✓ [PASS] emailVerified is true! Red Unverified badge will NOT be displayed!');
        } else {
            console.error('✕ [FAIL] emailVerified field is missing or false');
        }
    } catch (e) {
        console.error('Error fetching profile:', e.message);
    }
}

testProfileVerificationTag();
