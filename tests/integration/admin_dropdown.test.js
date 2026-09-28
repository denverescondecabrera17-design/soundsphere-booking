const fetch = require('node-fetch');

async function testAdminProfileDropdownEndToEnd() {
    console.log('=== ADMIN PROFILE DROPDOWN & PERSISTENCE VERIFICATION ===\n');

    // 1. Login as Admin
    console.log('1. Logging in as Admin (soundsphere@gmail.com)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'soundsphere@gmail.com', password: 'soundsphere@041704' })
    });
    const loginData = await loginRes.json();

    if (!loginData.success || !loginData.token) {
        console.error('❌ Login failed:', loginData.message);
        return;
    }
    const token = loginData.token;
    console.log('   ✓ Admin logged in successfully!');

    // 2. Fetch Profile from SQL Server
    console.log('\n2. Fetching Admin profile via GET /api/admin/profile...');
    const profRes1 = await fetch('http://localhost:5000/api/admin/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const profData1 = await profRes1.json();
    console.log('   ✓ Initial Profile Data:', profData1.profile);

    // 3. Update Profile in SQL Server
    console.log('\n3. Updating Admin profile details via PUT /api/admin/profile...');
    const updateRes = await fetch('http://localhost:5000/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            fullName: 'SoundSphere Operations Superadmin',
            phone: '09179876543'
        })
    });
    const updateData = await updateRes.json();
    console.log('   ✓ Profile Update Result:', updateData.message);

    // 4. Verify Persistence in SQL Server
    console.log('\n4. Re-fetching Admin profile to verify database persistence...');
    const profRes2 = await fetch('http://localhost:5000/api/admin/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const profData2 = await profRes2.json();
    console.log('   ✓ Updated Profile Data in SQL Server:', profData2.profile);

    if (profData2.profile.fullName === 'SoundSphere Operations Superadmin' && profData2.profile.phone === '09179876543') {
        console.log('   ✓ SUCCESS! Profile details successfully saved and persisted in SQL Server.');
    }

    // 5. Test Logout API
    console.log('\n5. Testing Admin Logout API...');
    const logoutRes = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const logoutData = await logoutRes.json();
    console.log('   ✓ Logout API Result:', logoutData.message);

    console.log('\n=== VERIFICATION COMPLETE ===');
}

testAdminProfileDropdownEndToEnd();
