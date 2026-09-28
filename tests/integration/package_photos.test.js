const http = require('http');
const fs = require('fs');
const path = require('path');

// Ensure a sample image exists
const sampleImgPath = path.join(__dirname, 'sample_setup_photo.png');
if (!fs.existsSync(sampleImgPath)) {
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
    fs.writeFileSync(sampleImgPath, pngBuffer);
}

function makeJsonPost(url, data, token) {
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

function uploadPackageWithPhotos(url, fields, photoPaths, token) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
        const chunks = [];

        Object.keys(fields).forEach(key => {
            chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${fields[key]}\r\n`));
        });

        photoPaths.forEach(imgPath => {
            const filename = path.basename(imgPath);
            const fileData = fs.readFileSync(imgPath);
            chunks.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="packagePhotos"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`));
            chunks.push(fileData);
            chunks.push(Buffer.from('\r\n'));
        });

        chunks.push(Buffer.from(`--${boundary}--\r\n`));
        const bodyBuffer = Buffer.concat(chunks);

        const headers = {
            'Content-Type': `multipart/form-data; boundary=${boundary}`,
            'Content-Length': bodyBuffer.length,
            'Authorization': `Bearer ${token}`
        };

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
        req.write(bodyBuffer);
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

async function testPackagePhotosLifecycle() {
    console.log("=== SoundSphere Service Package Setup Photos Lifecycle Test ===");

    // Step 1: Login
    const login = await makeJsonPost('http://localhost:5000/api/auth/login', {
        email: 'denvercabrera.apo@gmail.com',
        password: 'Password123!'
    });
    const token = login.data.token;
    console.log("1. Provider User 13 logged in successfully.");

    // Step 2: Create Package Offer with Setup Photo
    console.log("\n2. Creating Package Offer with Setup Photo Attachment...");
    const createRes = await uploadPackageWithPhotos('http://localhost:5000/api/providers/packages/create', {
        packageName: 'Pro Concert Sound Rig & 3D Moving Lights Setup',
        category: 'Concert Audio & Stage Lights',
        price: '35000',
        description: '4x Line Array Speakers, 2x Subwoofers, 12x Stage Par Cans',
        inclusions: '4x Line Array Speakers, 2x Subwoofers, 12x Stage Par Cans, DJ Setup',
        isActive: 'true'
    }, [sampleImgPath], token);

    console.log(`   Create Status: ${createRes.status}`, createRes.data);
    const createdPkg = createRes.data.data;
    console.log(`   Created Package ID: #${createdPkg.PackageID}`);
    console.log(`   Attached Photos Count: ${createdPkg.images ? createdPkg.images.length : 0}`);

    if (!createdPkg.images || createdPkg.images.length === 0) {
        throw new Error("FAIL: Expected package to have attached setup photo!");
    }
    const uploadedImageObj = createdPkg.images[0];
    console.log(`   Attached Photo Path: ${uploadedImageObj.url}`);

    // Step 3: Verify Public Provider Detail / Marketplace API
    console.log("\n3. Fetching Public Provider Detail Marketplace API...");
    const mktRes = await makeGetRequest('http://localhost:5000/api/providers/13');
    const pOffers = mktRes.data.data.packages || [];
    const foundPkg = pOffers.find(p => p.id === createdPkg.PackageID);

    console.log(`   Marketplace Package Found: "${foundPkg.name}"`);
    console.log(`   Marketplace Package Photos Count: ${foundPkg.images ? foundPkg.images.length : 0}`);

    if (!foundPkg.images || foundPkg.images.length === 0) {
        throw new Error("FAIL: Setup photo missing from public marketplace API!");
    }

    // Step 4: Delete Setup Photo specifically
    console.log(`\n4. Deleting Setup Photo #${uploadedImageObj.id}...`);
    const delPhotoRes = await makeDeleteRequest(`http://localhost:5000/api/providers/packages/photos/${uploadedImageObj.id}`, token);
    console.log(`   Delete Photo Status: ${delPhotoRes.status}`);

    // Step 5: Verify Photo Removed
    const reFetchList = await makeGetRequest('http://localhost:5000/api/providers/packages/list', token);
    const reFetchPkg = reFetchList.data.data.find(p => p.PackageID === createdPkg.PackageID);
    console.log(`   Remaining Photos Count: ${reFetchPkg.images ? reFetchPkg.images.length : 0}`);

    if (reFetchPkg.images && reFetchPkg.images.length > 0) {
        throw new Error("FAIL: Photo was not removed from package!");
    }

    // Step 6: Delete Test Package
    console.log(`\n6. Deleting Test Package #${createdPkg.PackageID}...`);
    const delPkgRes = await makeDeleteRequest(`http://localhost:5000/api/providers/packages/${createdPkg.PackageID}`, token);
    console.log(`   Delete Package Status: ${delPkgRes.status}`);

    console.log("\n==================================================");
    console.log("🏆 SETUP / INCLUSION PHOTOS FEATURE TEST PASSED 100%!");
    console.log("==================================================");
    process.exit(0);
}

testPackagePhotosLifecycle();
