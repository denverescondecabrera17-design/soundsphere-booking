const sampleOffers = [
    {
        PackageID: 17,
        PackageName: 'bundle a for wedding',
        Category: 'Concert Audio & Stage Lights',
        Price: 10,
        coverageArea: 'Lian, Balayan, Nasugbu',
        Description: 'bundle a for wedding',
        Inclusions: '2 microphone 2 speakers 1 base'
    },
    {
        PackageID: 25,
        PackageName: 'Standard Party Audio & Light Rig (Updated)',
        Category: 'Concert Audio & Stage Lights',
        Price: 22000,
        coverageArea: 'Lian, Balayan, Nasugbu',
        Description: 'Updated Party Rig',
        Inclusions: '2x Powered Speakers, 1x Active Subwoofer, 4x Stage Lights, 2x Wireless Mics'
    }
];

function testFilter(keyword = '', category = 'all', place = 'all', priceRange = 'all') {
    const cleanKey = keyword.toLowerCase().replace(/[\s\-_]/g, '');

    return sampleOffers.filter(offer => {
        const title = (offer.PackageName || '').toLowerCase();
        const cat = (offer.Category || '').toLowerCase();
        const desc = (offer.Description || '').toLowerCase();
        const inclusions = (offer.Inclusions || '').toLowerCase();
        const loc = (offer.coverageArea || '').toLowerCase();
        const offerPrice = parseFloat(offer.Price || 0);

        const cleanTitle = title.replace(/[\s\-_]/g, '');
        const cleanCat = cat.replace(/[\s\-_]/g, '');
        const cleanDesc = desc.replace(/[\s\-_]/g, '');
        const cleanInc = inclusions.replace(/[\s\-_]/g, '');
        const cleanLoc = loc.replace(/[\s\-_]/g, '');

        const matchKeyword = !keyword || 
            title.includes(keyword.toLowerCase()) || 
            cat.includes(keyword.toLowerCase()) || 
            desc.includes(keyword.toLowerCase()) || 
            inclusions.includes(keyword.toLowerCase()) ||
            cleanTitle.includes(cleanKey) ||
            cleanCat.includes(cleanKey) ||
            cleanDesc.includes(cleanKey) ||
            cleanInc.includes(cleanKey);

        let matchCategory = true;
        if (category && category.toLowerCase() !== 'all') {
            const targetCat = category.toLowerCase().trim();
            const offerCat = cat.toLowerCase().trim();

            if (targetCat === 'sound systems' || targetCat.includes('sound')) {
                matchCategory = offerCat.includes('sound') || offerCat.includes('audio') || offerCat.includes('line array');
            } else if (targetCat === 'lighting' || targetCat.includes('light')) {
                matchCategory = offerCat.includes('light') || offerCat.includes('par') || offerCat.includes('spot');
            } else if (targetCat === 'karaoke' || targetCat.includes('karaoke') || targetCat.includes('videoke')) {
                matchCategory = offerCat.includes('karaoke') || offerCat.includes('videoke') || desc.includes('karaoke');
            } else if (targetCat.includes('led') || targetCat.includes('wall')) {
                matchCategory = offerCat.includes('led') || offerCat.includes('display');
            } else if (targetCat.includes('stage')) {
                matchCategory = offerCat.includes('stage') || offerCat.includes('truss');
            } else if (targetCat.includes('dj')) {
                matchCategory = offerCat.includes('dj');
            } else {
                const cleanTarget = targetCat.replace(/[\s\-_]/g, '');
                matchCategory = offerCat.includes(targetCat) || targetCat.includes(offerCat) || cleanCat.includes(cleanTarget);
            }
        }

        const matchPlace = place === 'all' || !place || loc.includes(place.toLowerCase()) || cleanLoc.includes(place.toLowerCase().replace(/[\s\-_]/g, ''));

        let matchPrice = true;
        if (priceRange && priceRange !== 'all') {
            const val = parseFloat(priceRange);
            if (val === 15000) {
                matchPrice = offerPrice <= 15000;
            } else if (val === 30000) {
                matchPrice = offerPrice >= 15000 && offerPrice <= 30000;
            } else if (val === 30001) {
                matchPrice = offerPrice > 30000;
            }
        }

        return matchKeyword && matchCategory && matchPlace && matchPrice;
    });
}

console.log("=== TEST 1: User's Screenshot Filters (Category: Karaoke, Place: Balayan, Price: Under 15k) ===");
const res1 = testFilter('', 'Karaoke', 'Balayan', '15000');
console.log("Results count:", res1.length);
console.log("Matches:", res1.map(o => o.PackageName));

console.log("\n=== TEST 2: Price Filter Only (Under 15k) ===");
const res2 = testFilter('', 'all', 'all', '15000');
console.log("Results count:", res2.length);
console.log("Matches:", res2.map(o => o.PackageName));

console.log("\n=== TEST 3: All Filters Reset (All Categories, All Places, Any Price) ===");
const res3 = testFilter('', 'all', 'all', 'all');
console.log("Results count:", res3.length);
console.log("Matches:", res3.map(o => o.PackageName));
