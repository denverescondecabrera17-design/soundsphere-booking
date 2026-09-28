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

function makePutRequest(url, data, token) {
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
            method: 'PUT',
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

async function testSave() {
    console.log("=== SoundSphere Service Provider Save Profile Changes Test ===");

    const login = await makePostRequest('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });
    const token = login.data.token;

    console.log("1. Submitting Provider Profile Save (PUT /api/providers/me)...");
    const saveRes = await makePutRequest('http://localhost:5000/api/providers/me', {
        businessName: 'CHiCHa Lights and Sounds',
        ownerName: 'Denver Cabrera',
        firstName: 'Denver',
        lastName: 'Cabrera',
        contactNumber: '09516028992',
        coverageArea: 'Lian, Balayan, Nasugbu',
        businessAddress: 'Balayan, Batangas'
    }, token);

    console.log(`2. Save Status: ${saveRes.status}`);
    console.log("   Response payload:", saveRes.data);

    if (!saveRes.data.success) {
        throw new Error(`FAIL: Provider profile save failed: ${JSON.stringify(saveRes.data)}`);
    }

    console.log("\n==================================================");
    console.log("🏆 PROVIDER PROFILE SAVE TEST PASSED 100% WITHOUT ERRORS!");
    console.log("==================================================");
    process.exit(0);
}

testSave();
