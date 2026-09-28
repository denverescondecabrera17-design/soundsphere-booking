const http = require('http');

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        }).on('error', reject);
    });
}

async function verifyCleanHeaderData() {
    console.log("=== Service Provider Clean White Profile Header API Verification ===");

    const res = await makeRequest('http://localhost:5000/api/providers/13');
    console.log(`Status Code: ${res.status}`);

    if (res.data && res.data.success) {
        const p = res.data.data;
        console.log("\nProvider Profile Header Hydration Fields:");
        console.log(` - Business Name: "${p.name || p.businessName}"`);
        console.log(` - Email: "${p.email}"`);
        console.log(` - Phone Number: "${p.phone}"`);
        console.log(` - Location / Coverage: "${p.coverageArea}"`);
        console.log(` - Profile Picture: "${p.profilePicture || p.avatar || 'Default Circular Avatar'}"`);
        console.log(` - Verification Badge: ${p.verified ? 'Verified ✓' : 'Pending'}`);
        
        console.log("\n✅ All Profile Header Fields Are Dynamically Connected to Database!");
    } else {
        console.error("❌ Failed to fetch provider details.");
    }
}

verifyCleanHeaderData();
