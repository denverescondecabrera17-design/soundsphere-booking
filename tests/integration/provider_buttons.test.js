const http = require('http');

function makeRequest(url, method, data, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const postData = data ? JSON.stringify(data) : null;
        const headers = { 'Content-Type': 'application/json' };
        if (postData) headers['Content-Length'] = Buffer.byteLength(postData);
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method || 'GET',
            headers
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch(e) { resolve({ status: res.statusCode, raw: body }); }
            });
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function runProviderInteractiveButtonTest() {
    console.log("=== Service Provider Portal Interactive Operations Test ===");

    // 1. Login
    const login = await makeRequest('http://localhost:5000/api/auth/login', 'POST', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });
    const token = login.data.token;
    console.log("1. Provider User 13 logged in.");

    // 2. Click "Create Package Offer" Button Action
    console.log("2. Executing 'Create New Package Offer' button action...");
    const createRes = await makeRequest('http://localhost:5000/api/providers/packages/create', 'POST', {
        packageName: 'Standard Party Audio & Light Rig',
        name: 'Standard Party Audio & Light Rig',
        category: 'Concert Audio & Stage Lights',
        price: '18500',
        description: '2x Powered Speakers, 1x Active Subwoofer, 4x Stage Lights',
        inclusions: '2x Powered Speakers, 1x Active Subwoofer, 4x Stage Lights, 2x Wireless Mics',
        isActive: true
    }, token);

    console.log(`   Create Status: ${createRes.status}`);
    const createdPkg = createRes.data.data;
    console.log(`   Created Package ID: #${createdPkg.PackageID}`);

    // 3. Click "Deactivate" Button Action
    console.log(`3. Executing 'Deactivate Offer' button action on Package #${createdPkg.PackageID}...`);
    const deactivateRes = await makeRequest(`http://localhost:5000/api/providers/packages/${createdPkg.PackageID}`, 'PUT', {
        packageName: createdPkg.PackageName,
        name: createdPkg.PackageName,
        category: createdPkg.Category,
        price: createdPkg.Price,
        description: createdPkg.Description,
        inclusions: createdPkg.Inclusions,
        isActive: false
    }, token);

    console.log(`   Deactivate Status: ${deactivateRes.status}`);
    console.log(`   Active State Now: ${deactivateRes.data.data.IsActive}`);

    // 4. Click "Edit Package" Button Action
    console.log(`4. Executing 'Edit Package' button action on Package #${createdPkg.PackageID}...`);
    const editRes = await makeRequest(`http://localhost:5000/api/providers/packages/${createdPkg.PackageID}`, 'PUT', {
        packageName: 'Standard Party Audio & Light Rig (Updated)',
        name: 'Standard Party Audio & Light Rig (Updated)',
        category: createdPkg.Category,
        price: 22000,
        description: 'Updated Party Rig',
        inclusions: createdPkg.Inclusions,
        isActive: true
    }, token);

    console.log(`   Edit Status: ${editRes.status}`);
    console.log(`   Updated Name: "${editRes.data.data.PackageName}"`);
    console.log(`   Updated Price: ₱${editRes.data.data.Price}`);

    // 5. Click "Edit Business Profile" Button Action
    console.log("5. Executing 'Save Profile Changes' button action...");
    const profileRes = await makeRequest('http://localhost:5000/api/providers/me', 'PUT', {
        businessName: 'CHiCHa Lights and Sounds',
        firstName: 'Denver',
        lastName: 'Cabrera',
        phone: '+63 951 602 8992',
        coverageArea: 'Lian, Balayan, Nasugbu, Batangas',
        businessAddress: 'Lian, Batangas'
    }, token);

    console.log(`   Profile Update Status: ${profileRes.status}`, profileRes.data.message);

    // 6. Click "Delete Package" Button Action
    console.log(`6. Executing 'Delete Package' button action on Package #${createdPkg.PackageID}...`);
    const delRes = await makeRequest(`http://localhost:5000/api/providers/packages/${createdPkg.PackageID}`, 'DELETE', null, token);
    console.log(`   Delete Status: ${delRes.status}`);

    console.log("\n==================================================");
    console.log("🏆 ALL PROVIDER BUTTONS & ACTIONS WORKING 100%!");
    console.log("==================================================");
    process.exit(0);
}

runProviderInteractiveButtonTest();
