const fetch = require('node-fetch');

async function testSaveProviderProfile() {
    console.log('=== TESTING PROVIDER PROFILE SAVE API ===\n');

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

    // 2. Submit Profile Update via JSON
    const updateRes = await fetch('http://localhost:5000/api/users/profile', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            userId: loginData.user.userId,
            businessName: 'CHiCHa Lights and Sounds',
            firstName: 'Denver',
            lastName: 'Cabrera',
            phone: '+63 9516028992',
            coverageArea: 'Lian, Balayan, Nasugbu',
            businessAddress: 'Lian, Balayan, Nasugbu'
        })
    });

    const updateData = await updateRes.json();
    console.log('✓ POST /api/users/profile Status:', updateRes.status, 'Success:', updateData.success);
    if (!updateData.success) {
        throw new Error('Profile save failed: ' + updateData.message);
    }

    console.log('✓ Updated User Output:', {
        userId: updateData.user?.userId,
        name: updateData.user?.name,
        businessName: updateData.user?.businessName,
        coverageArea: updateData.user?.coverageArea,
        phone: updateData.user?.phone
    });

    console.log('\n=== PROVIDER PROFILE SAVE VERIFICATION PASSED SUCCESSFULLY ===');
}

testSaveProviderProfile().catch(e => {
    console.error('TEST ERROR:', e.message);
    process.exit(1);
});
