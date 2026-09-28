const http = require('http');

function makeGetRequest(url) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const req = http.request({
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: 'GET'
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function testPackageDeduplication() {
    console.log("=== SoundSphere Service Provider Packages Deduplication & Isolation Test ===");

    // Step 1: Fetch CHiCHa Lights and Sounds (User ID 13)
    const providerRes = await makeGetRequest('http://localhost:5000/api/providers/13');
    console.log(`1. GET /api/providers/13 Status: ${providerRes.status}`);

    const p = providerRes.data.data;
    console.log(`   Provider Business Name: "${p.businessName}"`);
    console.log(`   Packages Count: ${p.packages ? p.packages.length : 0}`);
    console.log(`   Services Count: ${p.services ? p.services.length : 0}`);

    if (p.packages) {
        console.log("   Packages:", p.packages.map(pkg => `#${pkg.id}: ${pkg.name} (₱${pkg.price})`));
    }
    if (p.services) {
        console.log("   Services:", p.services.map(srv => `#${srv.id}: ${srv.name} (₱${srv.price})`));
    }

    // Combine offers
    const allOffers = [...(p.packages || []), ...(p.services || [])];
    const offerNames = allOffers.map(o => o.name || o.serviceName || o.title);
    const uniqueOfferNames = [...new Set(offerNames)];

    console.log(`\n2. Deduplication Verification:`);
    console.log(`   - Total Offers Count: ${allOffers.length}`);
    console.log(`   - Unique Offer Names Count: ${uniqueOfferNames.length}`);

    if (allOffers.length !== uniqueOfferNames.length) {
        throw new Error(`FAIL: Duplicate package/service names returned in API payload: ${JSON.stringify(offerNames)}`);
    }

    // Step 2: Test Provider Isolation (GET /api/providers)
    const allProvidersRes = await makeGetRequest('http://localhost:5000/api/providers');
    const providersList = allProvidersRes.data.data;
    console.log(`\n3. Provider Isolation Verification across ${providersList.length} approved providers:`);

    providersList.forEach(prov => {
        const pkgs = prov.packages || [];
        const srvs = prov.services || [];
        console.log(`   - Provider "${prov.businessName}" (ID ${prov.userId}): ${pkgs.length} packages, ${srvs.length} services`);
        
        // Verify all package UserIDs match current provider UserID
        pkgs.forEach(pkg => {
            if (pkg.userId && pkg.userId !== prov.userId) {
                throw new Error(`FAIL: Package #${pkg.id} belonging to User ${pkg.userId} leaked into Provider ${prov.userId}!`);
            }
        });
    });

    console.log("\n==================================================");
    console.log("🏆 PROVIDER PACKAGES DEDUPLICATION & ISOLATION TEST PASSED 100%!");
    console.log("==================================================");
    process.exit(0);
}

testPackageDeduplication();
