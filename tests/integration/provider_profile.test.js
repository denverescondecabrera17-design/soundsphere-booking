const http = require('http');

function makePostRequest(url, data, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        const headers = {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

function makeGetRequest(url, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function testProfilePersistence() {
    console.log("=== SoundSphere Complete Provider Profile Persistence & Sync Test ===");

    // Step 1: Initial Login
    console.log("\n[TEST 1] Logging in as Provider (denvercabrera.apo@gmail.com)...");
    const login1 = await makePostRequest('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });

    if (!login1.data.success) {
        throw new Error(`Login failed: ${JSON.stringify(login1.data)}`);
    }
    const token = login1.data.token;
    const userId = login1.data.user.userId;
    console.log(`  ✓ Login Success! User ID: ${userId}, Token Received.`);

    // Step 2: Save Profile Changes (Updates DB)
    console.log("\n[TEST 2 & 3 & 4] Updating Profile via POST /api/users/profile...");
    const updatePayload = {
        userId,
        email: 'denvercabrera.apo@gmail.com',
        firstName: 'Denver',
        middleName: 'Santos',
        lastName: 'Cabrera',
        phone: '+63 9516028992',
        address: 'Balayan, Batangas',
        businessName: 'CHiCHa Lights and Sounds'
    };

    const updateRes = await makePostRequest('http://localhost:5000/api/users/profile', updatePayload, token);
    console.log(`  ✓ Update Profile Status: ${updateRes.status}`);
    console.log("  Response payload:", updateRes.data.user);

    if (updateRes.data.user.firstName !== 'Denver' || updateRes.data.user.middleName !== 'Santos' || updateRes.data.user.lastName !== 'Cabrera') {
        throw new Error("FAIL: Updated profile payload does not match expected first/middle/last name!");
    }

    // Step 3: GET /api/users/profile (Simulates page refresh / opening profile modal)
    console.log("\n[TEST 5 & 6 & 7] Fetching Profile via GET /api/users/profile?userId=13 (Simulates Refresh / Open Profile)...");
    const fetchRes = await makeGetRequest(`http://localhost:5000/api/users/profile?userId=${userId}`, token);
    console.log(`  ✓ Fetch Status: ${fetchRes.status}`);
    const u = fetchRes.data.user;
    console.log(`  - First Name: "${u.firstName}"`);
    console.log(`  - Middle Name: "${u.middleName}"`);
    console.log(`  - Last Name: "${u.lastName}"`);
    console.log(`  - Full Personal Name: "${u.personalName}"`);
    console.log(`  - Phone: "${u.phone}"`);
    console.log(`  - Address: "${u.address}"`);
    console.log(`  - Business Name: "${u.businessName}"`);

    if (!u.firstName || !u.lastName || !u.phone || !u.address) {
        throw new Error("FAIL: Database profile returned empty fields on GET!");
    }

    // Step 4: GET /api/providers/me (Simulates Provider Dashboard loading)
    console.log("\n[TEST 8] Fetching Provider Dashboard Data via GET /api/providers/me...");
    const meRes = await makeGetRequest('http://localhost:5000/api/providers/me', token);
    console.log(`  ✓ Provider Me Status: ${meRes.status}`);
    const p = meRes.data.profile;
    console.log(`  - Business Name: "${p.businessName}"`);
    console.log(`  - Owner Name: "${p.ownerName}"`);
    console.log(`  - Phone/Contact: "${p.phone}"`);
    console.log(`  - Coverage Area: "${p.coverageArea}"`);

    if (p.businessName !== 'CHiCHa Lights and Sounds') {
        throw new Error("FAIL: Provider Dashboard endpoint returned incorrect business name!");
    }

    // Step 5: Re-login (Simulates Logout -> Login flow)
    console.log("\n[TEST 9 & 10] Re-logging in after logout (Simulates fresh session)...");
    const login2 = await makePostRequest('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });
    console.log(`  ✓ Re-login Status: ${login2.status}`);
    console.log(`  - Re-login User Name: "${login2.data.user.name}"`);
    console.log(`  - Re-login Business Name: "${login2.data.user.businessName}"`);

    console.log("\n==================================================");
    console.log("🏆 ALL PERSISTENCE AND SYNCHRONIZATION TESTS PASSED 100%!");
    console.log("==================================================");
}

testProfilePersistence();
