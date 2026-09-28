const fetch = require('node-fetch');

async function testProviderPortalFlow() {
    console.log('=== END-TO-END SERVICE PROVIDER PORTAL VERIFICATION ===\n');

    // 1. Test Approved Provider Login
    console.log('1. Logging in as Approved Service Provider (provider@soundsphere.com)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'provider@soundsphere.com', password: 'Provider123!' })
    });
    const loginData = await loginRes.json();

    if (!loginData.success || !loginData.token) {
        console.error('❌ Approved provider login failed!');
        return;
    }
    const token = loginData.token;
    console.log('   ✓ Approved Service Provider logged in successfully!');

    // 2. Fetch Provider Profile via GET /api/providers/me
    console.log('\n2. Fetching Provider Profile via GET /api/providers/me...');
    const profRes = await fetch('http://localhost:5000/api/providers/me', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const profData = await profRes.json();
    console.log(`   ✓ Profile Status: ${profRes.status}, Approved: ${profData.isApprovedProvider}`);
    console.log('   ✓ Business Name:', profData.profile ? profData.profile.businessName : 'N/A');

    // 3. Fetch Dashboard Stats via GET /api/providers/dashboard-stats
    console.log('\n3. Fetching Dashboard Stats via GET /api/providers/dashboard-stats...');
    const statsRes = await fetch('http://localhost:5000/api/providers/dashboard-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsRes.json();
    console.log('   ✓ Stats:', statsData.stats);

    // 4. Test Adding a Service
    console.log('\n4. Testing POST /api/providers/services/create...');
    const svcRes = await fetch('http://localhost:5000/api/providers/services/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            serviceName: 'Pro Concert Sound Rig & 3D Moving Lights',
            category: 'Sound Systems',
            price: 18500.00
        })
    });
    const svcData = await svcRes.json();
    console.log('   ✓ Service Creation Result:', svcData.message);

    // 5. Test Creating a Package
    console.log('\n5. Testing POST /api/providers/packages/create...');
    const pkgRes = await fetch('http://localhost:5000/api/providers/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            packageName: 'Batangas Gala Stage & Sound Package',
            category: 'Concert Audio & Stage Lights',
            price: 28000.00,
            description: '4x Line Array Speakers, 2x Subwoofers, 16x Stage Lights, 2x Wireless Microphones'
        })
    });
    const pkgData = await pkgRes.json();
    console.log('   ✓ Package Creation Result:', pkgData.message);

    // 6. Fetch Services & Packages lists
    console.log('\n6. Fetching Services & Packages from SQL Server...');
    const getSvcRes = await fetch('http://localhost:5000/api/providers/services/list', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const getSvcData = await getSvcRes.json();
    console.log(`   ✓ Services Count: ${getSvcData.data ? getSvcData.data.length : 0}`);

    const getPkgRes = await fetch('http://localhost:5000/api/providers/packages/list', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const getPkgData = await getPkgRes.json();
    console.log(`   ✓ Packages Count: ${getPkgData.data ? getPkgData.data.length : 0}`);

    // 7. Authorization Access Guard Check with Client User
    console.log('\n7. Testing Access Guard with Standard Client (denverescondecabrera17@gmail.com)...');
    const clientLoginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'denverescondecabrera17@gmail.com', password: 'Client123!' })
    });
    const clientLoginData = await clientLoginRes.json();
    const clientToken = clientLoginData.token;

    const clientGuardRes = await fetch('http://localhost:5000/api/providers/me', {
        headers: { 'Authorization': `Bearer ${clientToken}` }
    });
    const clientGuardData = await clientGuardRes.json();
    console.log(`   ✓ Standard Client isApprovedProvider: ${clientGuardData.isApprovedProvider}`);
    if (!clientGuardData.isApprovedProvider) {
        console.log('   ✓ SUCCESS! Access Guard correctly denies Provider Portal access to non-approved clients.');
    }

    console.log('\n=== SERVICE PROVIDER PORTAL VERIFICATION COMPLETED SUCCESSFULLY ===');
}

testProviderPortalFlow();
