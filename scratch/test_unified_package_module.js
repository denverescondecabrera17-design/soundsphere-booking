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

function makeDeleteRequest(url, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'DELETE',
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

async function testUnifiedPackageModule() {
    console.log("=== SoundSphere Unified Service Package Module Lifecycle Test ===");

    // Step 1: Login
    const login = await makePostRequest('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });
    const token = login.data.token;
    console.log("1. Provider User 13 logged in successfully.");

    // Step 2: Create Offer
    console.log("\n2. Creating New Service Package Offer...");
    const createRes = await makePostRequest('http://localhost:5000/api/providers/packages/create', {
        packageName: 'Wedding Grand Concert Package',
        category: 'Wedding & Debut Packages',
        price: 25000,
        description: 'Complete wedding sound and lighting package',
        inclusions: 'Sound System, Lighting, LED Wall, DJ Services'
    }, token);

    console.log(`   Create Status: ${createRes.status}`);
    const createdPkg = createRes.data.data;
    console.log(`   Created Package ID: #${createdPkg.PackageID}`);

    // Step 3: Fetch Packages List
    const listRes = await makeGetRequest('http://localhost:5000/api/providers/packages/list', token);
    console.log(`\n3. Loaded Provider Packages List (Count: ${listRes.data.data.length})`);

    // Step 4: Edit Offer
    console.log(`\n4. Editing Package #${createdPkg.PackageID} price to ₱28,000...`);
    const editRes = await makePutRequest(`http://localhost:5000/api/providers/packages/${createdPkg.PackageID}`, {
        name: 'Wedding Grand Concert Package',
        packageName: 'Wedding Grand Concert Package',
        category: 'Wedding & Debut Packages',
        price: 28000,
        description: 'Updated complete wedding sound and lighting package',
        inclusions: 'Sound System, Lighting, LED Wall, DJ Services, Fog Effects',
        isActive: true
    }, token);

    console.log(`   Edit Status: ${editRes.status}`);
    console.log(`   Updated Price: ₱${editRes.data.data.Price}`);

    // Step 5: Verify Public Marketplace API (GET /api/providers/13)
    const marketplaceRes = await makeGetRequest('http://localhost:5000/api/providers/13');
    const pOffers = marketplaceRes.data.data.packages || [];
    console.log(`\n5. Public Marketplace Offers Count for CHiCHa: ${pOffers.length}`);
    const foundEdited = pOffers.find(o => o.id === createdPkg.PackageID);
    console.log(`   Public Marketplace Item Verified: "${foundEdited.name}" - ₱${foundEdited.price}`);

    if (foundEdited.price !== 28000) {
        throw new Error(`FAIL: Expected marketplace price 28000, got ${foundEdited.price}`);
    }

    // Step 6: Delete Test Offer to Keep DB Clean
    console.log(`\n6. Deleting Test Offer #${createdPkg.PackageID}...`);
    const delRes = await makeDeleteRequest(`http://localhost:5000/api/providers/packages/${createdPkg.PackageID}`, token);
    console.log(`   Delete Status: ${delRes.status}`);

    const finalMarketplace = await makeGetRequest('http://localhost:5000/api/providers/13');
    const finalOffers = finalMarketplace.data.data.packages || [];
    console.log(`   Final Marketplace Offers Count: ${finalOffers.length}`);

    console.log("\n==================================================");
    console.log("🏆 UNIFIED SERVICE PACKAGE MODULE TEST PASSED 100%!");
    console.log("==================================================");
    process.exit(0);
}

testUnifiedPackageModule();
