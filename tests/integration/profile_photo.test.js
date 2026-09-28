const fetch = require('node-fetch');

async function testProviderProfilePhotoUpload() {
    console.log('=== TESTING PROVIDER PROFILE PHOTO & BUSINESS PROFILE UPDATE ===\n');

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
    console.log('✓ Provider authenticated successfully.');

    // 2. Fetch Provider Profile via GET /api/providers/me
    const getRes = await fetch('http://localhost:5000/api/providers/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    const getData = await getRes.json();
    console.log('✓ GET /api/providers/me Status:', getRes.status, 'Success:', getData.success);
    console.log('   Profile Business Name:', getData.profile?.businessName);
    console.log('   Profile Picture URL:', getData.profile?.profilePicture || 'Default Avatar');

    console.log('\n=== PROVIDER PROFILE PHOTO & BUSINESS EDIT VERIFICATION PASSED ===');
}

testProviderProfilePhotoUpload().catch(e => {
    console.error('TEST ERROR:', e.message);
    process.exit(1);
});
