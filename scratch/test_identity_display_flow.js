const http = require('http');

function makePostRequest(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = JSON.stringify(data);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
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

async function testIdentityDisplay() {
    console.log("=== SoundSphere Client Services Identity Display Flow Test ===");

    // 1. Login as User 13 (denvercabrera.apo@gmail.com)
    const loginRes = await makePostRequest('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });

    console.log(`\n1. Login Status: ${loginRes.status}`);
    if (loginRes.data && loginRes.data.success) {
        const u = loginRes.data.user;
        console.log("   Logged in User Object:");
        console.log(`   - Personal Name (name): "${u.name || u.personalName}"`);
        console.log(`   - First Name: "${u.firstName}"`);
        console.log(`   - Middle Name: "${u.middleName}"`);
        console.log(`   - Last Name: "${u.lastName}"`);
        console.log(`   - Business Name: "${u.businessName}"`);
        console.log(`   - Is Approved Provider: ${u.isApprovedProvider}`);

        if (!u.name.includes('Denver') || u.businessName !== 'CHiCHa Lights and Sounds') {
            throw new Error(`FAIL: Expected personal name containing 'Denver' and businessName 'CHiCHa Lights and Sounds', but got name: '${u.name}' and businessName: '${u.businessName}'`);
        }
    } else {
        console.error("Login failed:", loginRes.data);
        return;
    }

    // 2. Fetch /api/users/profile
    const token = loginRes.data.token;
    const profRes = await makeGetRequest('http://localhost:5000/api/users/profile?userId=13', token);
    console.log(`\n2. Profile API Status: ${profRes.status}`);
    if (profRes.data && profRes.data.success) {
        const u = profRes.data.user;
        console.log("   Profile User Payload:");
        console.log(`   - Personal Name: "${u.personalName}"`);
        console.log(`   - First Name: "${u.firstName}"`);
        console.log(`   - Middle Name: "${u.middleName}"`);
        console.log(`   - Last Name: "${u.lastName}"`);
        console.log(`   - Business Name: "${u.businessName}"`);

        if (!u.personalName.includes('Denver') || u.businessName !== 'CHiCHa Lights and Sounds') {
            throw new Error(`FAIL: Expected personal name containing 'Denver' in profile response!`);
        }
    }

    console.log("\n✅ PASS: Personal Client Name ('Denver Cabrera') and Approved Business Name ('CHiCHa Lights and Sounds') coexist seamlessly without overwriting!");
}

testIdentityDisplay();
