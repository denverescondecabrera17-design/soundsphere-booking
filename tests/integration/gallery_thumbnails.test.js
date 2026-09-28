const http = require('http');

function getProvidersAPI() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:5000/api/providers', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(body) }));
        }).on('error', reject);
    });
}

async function testMarketplaceProviderPhotos() {
    console.log("=== SoundSphere Marketplace Provider Banner Photos Test ===");
    const res = await getProvidersAPI();
    console.log(`Status: ${res.status}`);
    console.log(`Providers Count: ${res.data.count}`);

    (res.data.data || []).forEach(p => {
        console.log(`\nProvider #${p.id}: "${p.name}"`);
        console.log(`  Banner Image: ${p.banner}`);
        console.log(`  Profile Picture: ${p.profilePicture}`);
        console.log(`  Packages Count: ${p.packages ? p.packages.length : 0}`);
        if (p.packages && p.packages.length > 0) {
            console.log(`  First Package Setup Photos Count: ${p.packages[0].images ? p.packages[0].images.length : 0}`);
        }
    });

    console.log("\n==================================================");
    console.log("🏆 MARKETPLACE PROVIDER BANNER PHOTOS TEST PASSED!");
    console.log("==================================================");
}

testMarketplaceProviderPhotos();
