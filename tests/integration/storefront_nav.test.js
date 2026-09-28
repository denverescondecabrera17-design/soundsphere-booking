const fetch = require('node-fetch');

async function testStorefrontFlow() {
    console.log('=== E2E TESTING SERVICE PROVIDER STOREFRONT FLOW ===\n');

    // 1. Search Providers API (GET /api/providers?search=CHiCHa)
    const searchRes = await fetch('http://localhost:5000/api/providers?search=CHiCHa');
    const searchData = await searchRes.json();

    console.log('✓ 1. Search Query "CHiCHa" API Status:', searchRes.status, 'Success:', searchData.success);
    if (!searchData.success || !Array.isArray(searchData.data) || searchData.data.length === 0) {
        throw new Error('FAIL: Search for "CHiCHa" returned 0 results!');
    }

    const provider = searchData.data[0];
    console.log('   └─ Found Provider ID:', provider.id, '| Business Name:', provider.name, '| Coverage:', provider.coverageArea);

    // 2. Fetch Provider Profile Storefront API (GET /api/providers/:id)
    const profileRes = await fetch(`http://localhost:5000/api/providers/${provider.id}`);
    const profileData = await profileRes.json();

    console.log('\n✓ 2. Provider Storefront Profile API Status:', profileRes.status, 'Success:', profileData.success);
    if (!profileData.success || !profileData.data) {
        throw new Error('FAIL: Fetching provider profile storefront failed!');
    }

    const pDetail = profileData.data;
    console.log('   └─ Storefront Header Business Name:', pDetail.name);
    console.log('   └─ Storefront Coverage Area:', pDetail.coverageArea);
    console.log('   └─ Storefront Profile Picture:', pDetail.profilePicture || pDetail.avatar || 'Default Avatar');
    console.log('   └─ Storefront Active Packages Count:', pDetail.packages ? pDetail.packages.length : 0);

    if (pDetail.packages && pDetail.packages.length > 0) {
        pDetail.packages.forEach((pkg, index) => {
            console.log(`       └─ Package ${index + 1}: "${pkg.name}" | Price: ₱${pkg.price} | Category: ${pkg.category}`);
        });
    }

    console.log('\n=== SERVICE PROVIDER STOREFRONT FLOW VERIFICATION PASSED SUCCESSFULLY ===');
}

testStorefrontFlow().catch(e => {
    console.error('VERIFICATION ERROR:', e.message);
    process.exit(1);
});
