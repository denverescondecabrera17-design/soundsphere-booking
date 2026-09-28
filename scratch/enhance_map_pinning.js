const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const jsFiles = [
    path.join(rootDir, 'client', 'js', 'booking.js'),
    path.join(rootDir, 'client', 'pages', 'js', 'booking.js'),
    path.join(rootDir, 'public', 'js', 'booking.js')
];

for (const f of jsFiles) {
    if (!fs.existsSync(f)) continue;
    let js = fs.readFileSync(f, 'utf-8');

    // Define MUNICIPALITY_COORDS and normalizePhAddress right above initGoogleMap
    const searchAnchor = "const initGoogleMap = async () => {";

    const enhancedSearchAndPinLogic = `
    const MUNICIPALITY_COORDS = {
        'Balayan': { lat: 13.9388, lng: 120.7308, name: 'Balayan, Batangas' },
        'Nasugbu': { lat: 14.0714, lng: 120.6347, name: 'Nasugbu, Batangas' },
        'Lian': { lat: 14.0322, lng: 120.6514, name: 'Lian, Batangas' },
        'Calatagan': { lat: 13.8322, lng: 120.6322, name: 'Calatagan, Batangas' },
        'Tuy': { lat: 14.0225, lng: 120.7308, name: 'Tuy, Batangas' },
        'Calaca': { lat: 13.9317, lng: 120.8128, name: 'Calaca, Batangas' },
        'Lemery': { lat: 13.9189, lng: 120.8911, name: 'Lemery, Batangas' },
        'Taal': { lat: 13.8833, lng: 120.9333, name: 'Taal, Batangas' }
    };

    const normalizePhAddress = (query, place) => {
        if (!query) return '';
        let q = String(query).trim();
        // Convert abbreviations: BRY, BRGY, BGY, BGRY -> Barangay
        q = q.replace(/\\b(?:brgy|bry|bgy|bgry)\\.?\\s*(\\d+|[a-zA-Z]+)?\\b/gi, (match, p1) => {
            return p1 ? \`Barangay \${p1}\` : 'Barangay';
        });
        q = q.replace(/\\bpob\\.?\\b/gi, 'Poblacion');
        q = q.replace(/\\bst\\.?\\b/gi, 'Street');
        q = q.replace(/\\bave\\.?\\b/gi, 'Avenue');
        q = q.replace(/\\s+/g, ' ').trim();
        return q;
    };

    const initGoogleMap = async () => {`;

    if (!js.includes('const MUNICIPALITY_COORDS =')) {
        js = js.replace(searchAnchor, enhancedSearchAndPinLogic);
    }

    // Now replace searchLocation inside initGoogleMap
    const oldSearchLocRegex = /const searchLocation = async \(query\) => \{[\s\S]*?return \[\];\s*\};/;
    const newSearchLoc = `const searchLocation = async (query) => {
                const place = placeSelect ? placeSelect.value : 'Balayan';
                const cleanQ = normalizePhAddress(query, place);

                // Extract barangay if present (e.g. "Barangay 8" or "Barangay Bucana")
                const brgyMatch = cleanQ.match(/\\bBarangay\\s+([A-Za-z0-9\\s]+?)(?:,|$|\\s+(?:Balayan|Nasugbu|Lian|Batangas))/i);
                const brgyName = brgyMatch ? \`Barangay \${brgyMatch[1].trim()}\` : '';

                // Strip generic venue words to get cleaner location
                const strippedQ = cleanQ.replace(/\\b(?:covered court|court|gym|gymnasium|multipurpose hall|hall|plaza|resort|hotel|near|beside|in front of|tapat ng|tabi ng|compound|subdivision|phase \\d+|blk \\d+|lot \\d+)\\b/gi, '').trim();

                const queriesToTry = [
                    \`\${cleanQ}, \${place}, Batangas, Philippines\`,
                    \`\${cleanQ}, Batangas, Philippines\`,
                    brgyName ? \`\${brgyName}, \${place}, Batangas, Philippines\` : null,
                    brgyName ? \`\${brgyName}, Batangas, Philippines\` : null,
                    strippedQ && strippedQ !== cleanQ ? \`\${strippedQ}, \${place}, Batangas, Philippines\` : null,
                    \`\${place}, Batangas, Philippines\`
                ].filter(Boolean);

                for (const q of queriesToTry) {
                    try {
                        const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=jsonv2&q=\${encodeURIComponent(q)}&countrycodes=ph&limit=5\`);
                        if (res.ok) {
                            const results = await res.json();
                            if (results && results.length > 0) {
                                return results;
                            }
                        }
                    } catch (e) {}
                }

                // Resilient fallback: return municipality coordinates so pinning NEVER fails
                const mCoords = MUNICIPALITY_COORDS[place] || MUNICIPALITY_COORDS['Balayan'];
                return [{
                    lat: String(mCoords.lat),
                    lon: String(mCoords.lng),
                    display_name: \`\${cleanQ ? cleanQ + ', ' : ''}\${place}, Batangas, Philippines\`
                }];
            };`;

    js = js.replace(oldSearchLocRegex, newSearchLoc);

    // Replace autoPinFromInputs
    const oldAutoPinRegex = /const autoPinFromInputs = \(\) => \{[\s\S]*?const debouncedAutoPin = \(\) => \{/;
    const newAutoPin = `const autoPinFromInputs = async () => {
                    if (isPinLocked) return;
                    const venue = venueNameInput ? venueNameInput.value.trim() : '';
                    const addr = completeAddressInput ? completeAddressInput.value.trim() : '';
                    const place = placeSelect ? placeSelect.value : 'Balayan';

                    if (!venue && !addr) {
                        const mCoords = MUNICIPALITY_COORDS[place] || MUNICIPALITY_COORDS['Balayan'];
                        selectPlaceOnMap(mCoords.lat, mCoords.lng);
                        return;
                    }

                    const cleanAddr = normalizePhAddress(addr, place);
                    const cleanVenue = normalizePhAddress(venue, place);

                    // Extract barangay if present
                    const combined = \`\${cleanAddr} \${cleanVenue}\`;
                    const brgyMatch = combined.match(/\\bBarangay\\s+([A-Za-z0-9\\s]+?)(?:,|$|\\s+(?:Balayan|Nasugbu|Lian|Batangas))/i);
                    const brgyName = brgyMatch ? \`Barangay \${brgyMatch[1].trim()}\` : '';

                    const candidates = [
                        cleanAddr ? \`\${cleanAddr}, \${place}, Batangas, Philippines\` : null,
                        cleanAddr ? \`\${cleanAddr}, Batangas, Philippines\` : null,
                        brgyName ? \`\${brgyName}, \${place}, Batangas, Philippines\` : null,
                        cleanVenue ? \`\${cleanVenue}, \${place}, Batangas, Philippines\` : null,
                        \`\${place}, Batangas, Philippines\`
                    ].filter(Boolean);

                    for (const cand of candidates) {
                        try {
                            const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=jsonv2&q=\${encodeURIComponent(cand)}&countrycodes=ph&limit=1\`);
                            if (res.ok) {
                                const data = await res.json();
                                if (data && data.length > 0) {
                                    selectPlaceOnMap(parseFloat(data[0].lat), parseFloat(data[0].lon));
                                    return;
                                }
                            }
                        } catch (e) {}
                    }

                    // Fallback to municipality coords so pin ALWAYS jumps to the town
                    const mCoords = MUNICIPALITY_COORDS[place] || MUNICIPALITY_COORDS['Balayan'];
                    selectPlaceOnMap(mCoords.lat, mCoords.lng);
                };

                const debouncedAutoPin = () => {`;

    js = js.replace(oldAutoPinRegex, newAutoPin);

    fs.writeFileSync(f, js, 'utf-8');
    console.log('Updated JS: ' + f);
}

console.log('Flexible pinning enhancement complete!');
