const fetch = require('node-fetch');

async function testMarketplaceProvidersDisplay() {
    console.log('=== TESTING MARKETPLACE PROVIDERS DISPLAY & SEARCH FILTERING ===\n');

    const res = await fetch('http://localhost:5000/api/providers');
    const data = await res.json();

    console.log('✓ GET /api/providers Status:', res.status, 'Success:', data.success);
    console.log('✓ Total Approved Providers Returned:', data.count);

    if (!data.success || data.count === 0) {
        throw new Error('FAIL: GET /api/providers returned 0 approved providers!');
    }

    const providers = data.data;
    providers.forEach(p => {
        console.log(`   - ID: ${p.id} | Name: "${p.name}" | Coverage: "${p.coverageArea}" | Starting Price: ₱${p.startingPrice}`);
    });

    // Test Space-Insensitive Search Matching for "CHi CHa" vs "CHiCHa Lights and Sounds"
    const searchQueries = ['CHi CHa', 'chicha', 'CHiCHa', 'Batangas'];

    searchQueries.forEach(query => {
        const cleanKey = query.toLowerCase().replace(/[\s\-_]/g, '');
        const matched = providers.filter(p => {
            const cleanName = (p.name || '').toLowerCase().replace(/[\s\-_]/g, '');
            const cleanLoc = (p.coverageArea || '').toLowerCase().replace(/[\s\-_]/g, '');
            return cleanName.includes(cleanKey) || cleanLoc.includes(cleanKey);
        });

        console.log(`\n✓ Search query '${query}' (Cleaned: '${cleanKey}') -> Matched ${matched.length} provider(s):`);
        matched.forEach(m => console.log(`   └─ ${m.name}`));

        if (matched.length === 0) {
            throw new Error(`FAIL: Search query '${query}' should match approved providers!`);
        }
    });

    console.log('\n=== MARKETPLACE PROVIDERS DISPLAY VERIFICATION PASSED SUCCESSFULLY ===');
}

testMarketplaceProvidersDisplay().catch(e => {
    console.error('VERIFICATION ERROR:', e.message);
    process.exit(1);
});
