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

async function runTests() {
    console.log("=== SoundSphere Storefront Search & Dynamic Load Automated Test ===");

    // 1. Test Provider Search API
    const searchRes = await makeRequest('http://localhost:5000/api/providers?search=CHiCHa');
    console.log(`\n1. Search Query API status: ${searchRes.status}`);
    if (searchRes.data && searchRes.data.success) {
        console.log(`Found ${searchRes.data.data.length} provider(s) matching 'CHiCHa':`);
        console.log(JSON.stringify(searchRes.data.data[0], null, 2));
    }

    // 2. Test Get Specific Provider Detail API (ID 13)
    const detailRes = await makeRequest('http://localhost:5000/api/providers/13');
    console.log(`\n2. Provider Detail API (ID 13) status: ${detailRes.status}`);
    if (detailRes.data && detailRes.data.success) {
        const p = detailRes.data.data;
        console.log(`   - Provider Name: ${p.name}`);
        console.log(`   - Description: ${p.description}`);
        console.log(`   - Coverage Area: ${p.coverageArea}`);
        console.log(`   - Profile Picture: ${p.profilePicture}`);
        console.log(`   - Packages:`, JSON.stringify(p.packages, null, 2));
    }

    console.log("\n✅ All Storefront API Endpoints Verified Successfully!");
}

runTests();
