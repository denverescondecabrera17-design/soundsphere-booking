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

async function testMarketplaceAllOffers() {
    console.log("=== SoundSphere Client Marketplace All Offers Test ===");
    const res = await getProvidersAPI();
    console.log(`HTTP Status: ${res.status}`);
    console.log(`Approved Providers Count: ${res.data.count}`);

    let totalOffers = 0;
    const providers = res.data.data || [];

    providers.forEach(p => {
        const pkgs = p.packages || [];
        totalOffers += pkgs.length;
        console.log(`\nProvider #${p.id}: "${p.name}" (${p.coverageArea})`);
        console.log(`  Profile Picture: ${p.profilePicture || 'Default Avatar'}`);
        console.log(`  Active Service Package Offers Count: ${pkgs.length}`);
        pkgs.forEach(pkg => {
            console.log(`    - Package #${pkg.PackageID}: "${pkg.name}" (₱${pkg.price})`);
            console.log(`      Category: ${pkg.category}`);
            console.log(`      Inclusions: ${pkg.inclusions.join(', ')}`);
            console.log(`      Setup Photos Count: ${pkg.images ? pkg.images.length : 0}`);
        });
    });

    console.log(`\nTOTAL MARKETPLACE SERVICE CARDS TO RENDER: ${totalOffers}`);
    if (totalOffers > 0) {
        console.log("==================================================");
        console.log("🏆 SHOPEE-STYLE SERVICE OFFER MARKETPLACE TEST PASSED 100%!");
        console.log("==================================================");
    } else {
        console.error("❌ No active service offers found in database.");
    }
}

testMarketplaceAllOffers();
