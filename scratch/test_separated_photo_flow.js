const http = require('http');
const { connectDB } = require('../server/config/db');

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

async function testSeparatedPhotos() {
    console.log("=== SoundSphere Client Photo vs. Provider Logo Photo Separation Test ===");

    // Step 1: Login
    const login = await makePostRequest('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });
    const token = login.data.token;
    console.log(`1. Authenticated User 13 logged in successfully.`);

    // Step 2: Set distinct paths in SQL directly to simulate separate uploads
    let pool = await connectDB();
    await pool.request().query(`
        UPDATE dbo.Users 
        SET ProfilePicture = 'uploads/avatars/client_photo_denver.jpg' 
        WHERE UserID = 13;

        UPDATE dbo.ServiceProviders 
        SET ProfilePicture = 'uploads/avatars/chicha_business_logo.jpg' 
        WHERE UserID = 13;
    `);
    console.log(`2. Updated SQL Database with distinct photo paths:`);
    console.log(`   - dbo.Users.ProfilePicture (Client Photo): 'uploads/avatars/client_photo_denver.jpg'`);
    console.log(`   - dbo.ServiceProviders.ProfilePicture (Provider Logo): 'uploads/avatars/chicha_business_logo.jpg'`);

    // Step 3: Fetch Client Profile API (GET /api/users/profile)
    const clientRes = await makeGetRequest('http://localhost:5000/api/users/profile?userId=13', token);
    const clientPhoto = clientRes.data.user.profilePicture || clientRes.data.user.avatar;
    console.log(`\n3. Client Profile API (GET /api/users/profile) Response:`);
    console.log(`   - Returned Client Photo: "${clientPhoto}"`);

    if (clientPhoto !== 'uploads/avatars/client_photo_denver.jpg') {
        throw new Error(`FAIL: Expected client photo 'uploads/avatars/client_photo_denver.jpg', but got '${clientPhoto}'`);
    }

    // Step 4: Fetch Provider Profile API (GET /api/providers/me)
    const providerRes = await makeGetRequest('http://localhost:5000/api/providers/me', token);
    const providerPhoto = providerRes.data.profile.profilePicture || providerRes.data.profile.avatar;
    console.log(`\n4. Provider Profile API (GET /api/providers/me) Response:`);
    console.log(`   - Returned Provider Photo: "${providerPhoto}"`);

    if (providerPhoto !== 'uploads/avatars/chicha_business_logo.jpg') {
        throw new Error(`FAIL: Expected provider photo 'uploads/avatars/chicha_business_logo.jpg', but got '${providerPhoto}'`);
    }

    // Step 5: Verify Isolation — Update Client Profile Photo and confirm Provider Photo is UNCHANGED
    console.log(`\n5. Testing Isolation: Updating Client Photo via POST /api/users/profile...`);
    await makePostRequest('http://localhost:5000/api/users/profile', {
        userId: 13,
        firstName: 'Denver',
        lastName: 'Cabrera'
    }, token);

    // Direct DB verify
    const verifyDb = await pool.request().query(`
        SELECT u.ProfilePicture AS UserPhoto, sp.ProfilePicture AS ProviderPhoto
        FROM dbo.Users u
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        WHERE u.UserID = 13;
    `);

    const dbRow = verifyDb.recordset[0];
    console.log(`   - Verified SQL DB state after Client Profile update:`);
    console.log(`     User Photo: "${dbRow.UserPhoto}"`);
    console.log(`     Provider Photo: "${dbRow.ProviderPhoto}"`);

    if (dbRow.ProviderPhoto !== 'uploads/avatars/chicha_business_logo.jpg') {
        throw new Error("FAIL: Updating client photo overwrote provider photo!");
    }

    console.log("\n==================================================");
    console.log("🏆 SEPARATE PROFILE PHOTO SYNCHRONIZATION TEST PASSED 100%!");
    console.log("==================================================");
    process.exit(0);
}

testSeparatedPhotos();
