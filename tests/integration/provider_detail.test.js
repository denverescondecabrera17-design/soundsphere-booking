const fetch = require('node-fetch');

async function testProviderDetailPage() {
    console.log('=== TESTING PROVIDER DETAIL PAGE API FOR CHICHA LIGHTS AND SOUNDS ===\n');

    const res = await fetch('http://localhost:5000/api/providers/13');
    const data = await res.json();

    console.log('✓ GET /api/providers/13 Status:', res.status, 'Success:', data.success);

    if (!data.success || !data.data) {
        throw new Error('FAIL: GET /api/providers/13 failed to return provider data!');
    }

    const provider = data.data;
    console.log('✓ Provider Business Name:', provider.name);
    console.log('✓ Coverage Area:', provider.coverageArea);
    console.log('✓ Profile Picture URL:', provider.profilePicture || provider.avatar || 'Default');
    console.log('✓ Packages Count:', provider.packages ? provider.packages.length : 0);

    if (provider.packages && provider.packages.length > 0) {
        provider.packages.forEach((pkg, index) => {
            console.log(`   └─ Package ${index + 1}: "${pkg.name}" | Price: ₱${pkg.price} | Category: ${pkg.category}`);
        });
    }

    console.log('\n=== PROVIDER DETAIL PAGE VERIFICATION PASSED SUCCESSFULLY ===');
}

testProviderDetailPage().catch(e => {
    console.error('VERIFICATION ERROR:', e.message);
    process.exit(1);
});
