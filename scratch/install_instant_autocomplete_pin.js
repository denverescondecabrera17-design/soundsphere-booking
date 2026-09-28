const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE HTML FILES (Add suggestions container to venue name too so both fields suggest & pin)
const htmlFiles = [
    path.join(rootDir, 'client', 'booking.html'),
    path.join(rootDir, 'client', 'pages', 'booking.html'),
    path.join(rootDir, 'public', 'booking.html')
];

for (const f of htmlFiles) {
    if (!fs.existsSync(f)) continue;
    let html = fs.readFileSync(f, 'utf-8');

    // Add venue-suggestions-list under booking-venue-name if not present
    if (!html.includes('id="venue-suggestions-list"')) {
        html = html.replace(
            '<input type="text" id="booking-venue-name" class="form-control" placeholder="e.g. ABC Events Hall / Club Balai" required>',
            `<div style="position:relative; width:100%;">
                <input type="text" id="booking-venue-name" class="form-control" placeholder="e.g. Covered Court / Club Balai / Barangay Hall" autocomplete="off" required>
                <ul id="venue-suggestions-list" class="address-suggestions-dropdown hidden"></ul>
            </div>`
        );
        fs.writeFileSync(f, html, 'utf-8');
        console.log('Updated HTML: ' + f);
    }
}

// 2. UPDATE JS FILES WITH INSTANT PLACES DATABASE & AUTO-PIN WHILE TYPING
const jsFiles = [
    path.join(rootDir, 'client', 'js', 'booking.js'),
    path.join(rootDir, 'client', 'pages', 'js', 'booking.js'),
    path.join(rootDir, 'public', 'js', 'booking.js')
];

const databaseAndAutocompleteModule = `
    // Comprehensive Instant Offline Database for Batangas Places, Barangays & Venues
    const BATANGAS_PLACES_DB = [
        // BALAYAN BARANGAYS & VENUES
        { name: 'Barangay 1 (Poblacion)', place: 'Balayan', lat: 13.9372, lng: 120.7335, aliases: ['brgy 1', 'bry 1', 'bgy 1', 'pob 1', 'barangay 1'] },
        { name: 'Barangay 2 (Poblacion)', place: 'Balayan', lat: 13.9380, lng: 120.7320, aliases: ['brgy 2', 'bry 2', 'bgy 2', 'pob 2', 'barangay 2'] },
        { name: 'Barangay 3 (Poblacion)', place: 'Balayan', lat: 13.9395, lng: 120.7310, aliases: ['brgy 3', 'bry 3', 'bgy 3', 'pob 3', 'barangay 3'] },
        { name: 'Barangay 4 (Poblacion)', place: 'Balayan', lat: 13.9410, lng: 120.7300, aliases: ['brgy 4', 'bry 4', 'bgy 4', 'pob 4', 'barangay 4'] },
        { name: 'Barangay 5 (Poblacion)', place: 'Balayan', lat: 13.9425, lng: 120.7315, aliases: ['brgy 5', 'bry 5', 'bgy 5', 'pob 5', 'barangay 5'] },
        { name: 'Barangay 6 (Poblacion)', place: 'Balayan', lat: 13.9438, lng: 120.7330, aliases: ['brgy 6', 'bry 6', 'bgy 6', 'pob 6', 'barangay 6'] },
        { name: 'Barangay 7 (Poblacion)', place: 'Balayan', lat: 13.9420, lng: 120.7355, aliases: ['brgy 7', 'bry 7', 'bgy 7', 'pob 7', 'barangay 7'] },
        { name: 'Barangay 8 (Poblacion)', place: 'Balayan', lat: 13.9405, lng: 120.7368, aliases: ['brgy 8', 'bry 8', 'bgy 8', 'pob 8', 'barangay 8', 'bry 8 balayan'] },
        { name: 'Barangay 9 (Poblacion)', place: 'Balayan', lat: 13.9390, lng: 120.7375, aliases: ['brgy 9', 'bry 9', 'bgy 9', 'pob 9', 'barangay 9'] },
        { name: 'Barangay 10 (Poblacion)', place: 'Balayan', lat: 13.9375, lng: 120.7360, aliases: ['brgy 10', 'bry 10', 'bgy 10', 'pob 10', 'barangay 10'] },
        { name: 'Barangay 11 (Poblacion)', place: 'Balayan', lat: 13.9360, lng: 120.7345, aliases: ['brgy 11', 'bry 11', 'bgy 11', 'pob 11', 'barangay 11'] },
        { name: 'Barangay 12 (Poblacion)', place: 'Balayan', lat: 13.9350, lng: 120.7330, aliases: ['brgy 12', 'bry 12', 'bgy 12', 'pob 12', 'barangay 12'] },
        { name: 'Barangay Caloocan', place: 'Balayan', lat: 13.9460, lng: 120.7320, aliases: ['caloocan', 'brgy caloocan', 'bry caloocan'] },
        { name: 'Barangay Canda', place: 'Balayan', lat: 13.9550, lng: 120.7180, aliases: ['canda', 'brgy canda'] },
        { name: 'Barangay Carenahan', place: 'Balayan', lat: 13.9620, lng: 120.7250, aliases: ['carenahan', 'brgy carenahan'] },
        { name: 'Barangay Cayponce', place: 'Balayan', lat: 13.9500, lng: 120.7420, aliases: ['cayponce', 'brgy cayponce'] },
        { name: 'Barangay Dalig', place: 'Balayan', lat: 13.9680, lng: 120.7100, aliases: ['dalig', 'brgy dalig'] },
        { name: 'Barangay Dao', place: 'Balayan', lat: 13.9720, lng: 120.7380, aliases: ['dao', 'brgy dao'] },
        { name: 'Barangay Dilao', place: 'Balayan', lat: 13.9480, lng: 120.7050, aliases: ['dilao', 'brgy dilao'] },
        { name: 'Barangay Duhatan', place: 'Balayan', lat: 13.9580, lng: 120.7010, aliases: ['duhatan', 'brgy duhatan'] },
        { name: 'Barangay Gumamela', place: 'Balayan', lat: 13.9360, lng: 120.7410, aliases: ['gumamela', 'brgy gumamela'] },
        { name: 'Barangay Lanatan', place: 'Balayan', lat: 13.9520, lng: 120.7550, aliases: ['lanatan', 'brgy lanatan'] },
        { name: 'Barangay Lucban Pook', place: 'Balayan', lat: 13.9750, lng: 120.7220, aliases: ['lucban', 'brgy lucban', 'lucban pook'] },
        { name: 'Barangay Magabe', place: 'Balayan', lat: 13.9820, lng: 120.7150, aliases: ['magabe', 'brgy magabe'] },
        { name: 'Barangay Malalay', place: 'Balayan', lat: 13.9450, lng: 120.7620, aliases: ['malalay', 'brgy malalay'] },
        { name: 'Barangay Navotas', place: 'Balayan', lat: 13.9310, lng: 120.7220, aliases: ['navotas', 'brgy navotas'] },
        { name: 'Barangay Palikpikan', place: 'Balayan', lat: 13.9440, lng: 120.7480, aliases: ['palikpikan', 'brgy palikpikan'] },
        { name: 'Barangay Pooc', place: 'Balayan', lat: 13.9600, lng: 120.7450, aliases: ['pooc', 'brgy pooc'] },
        { name: 'Barangay Putol', place: 'Balayan', lat: 13.9650, lng: 120.7300, aliases: ['putol', 'brgy putol'] },
        { name: 'Barangay Sampaga', place: 'Balayan', lat: 13.9470, lng: 120.7150, aliases: ['sampaga', 'brgy sampaga'] },
        { name: 'Barangay San Piro', place: 'Balayan', lat: 13.9280, lng: 120.7120, aliases: ['san piro', 'brgy san piro'] },
        { name: 'Barangay Sukol', place: 'Balayan', lat: 13.9850, lng: 120.7350, aliases: ['sukol', 'brgy sukol'] },
        { name: 'Barangay Talisay', place: 'Balayan', lat: 13.9350, lng: 120.7500, aliases: ['talisay', 'brgy talisay'] },
        { name: 'Balayan Covered Court / Gymnasium', place: 'Balayan', lat: 13.9405, lng: 120.7368, aliases: ['covered court', 'balayan court', 'court', 'gym', 'gymnasium'] },
        { name: 'Balayan Municipal Hall & Plaza', place: 'Balayan', lat: 13.9412, lng: 120.7318, aliases: ['municipal hall', 'munisipyo', 'plaza', 'balayan plaza'] },
        { name: 'Balayan Baywalk', place: 'Balayan', lat: 13.9320, lng: 120.7325, aliases: ['baywalk', 'balayan baywalk'] },

        // NASUGBU BARANGAYS & VENUES
        { name: 'Barangay 1 (Poblacion)', place: 'Nasugbu', lat: 14.0725, lng: 120.6320, aliases: ['brgy 1 nasugbu', 'bry 1 nasugbu', 'pob 1 nasugbu'] },
        { name: 'Barangay 2 (Poblacion)', place: 'Nasugbu', lat: 14.0715, lng: 120.6335, aliases: ['brgy 2 nasugbu', 'bry 2 nasugbu'] },
        { name: 'Barangay 3 (Poblacion)', place: 'Nasugbu', lat: 14.0700, lng: 120.6345, aliases: ['brgy 3 nasugbu', 'bry 3 nasugbu'] },
        { name: 'Barangay 4 (Poblacion)', place: 'Nasugbu', lat: 14.0685, lng: 120.6350, aliases: ['brgy 4 nasugbu', 'bry 4 nasugbu'] },
        { name: 'Barangay 5 (Poblacion)', place: 'Nasugbu', lat: 14.0670, lng: 120.6340, aliases: ['brgy 5 nasugbu', 'bry 5 nasugbu'] },
        { name: 'Barangay 6 (Poblacion)', place: 'Nasugbu', lat: 14.0680, lng: 120.6325, aliases: ['brgy 6 nasugbu', 'bry 6 nasugbu'] },
        { name: 'Barangay 7 (Poblacion)', place: 'Nasugbu', lat: 14.0695, lng: 120.6310, aliases: ['brgy 7 nasugbu', 'bry 7 nasugbu'] },
        { name: 'Barangay 8 (Poblacion)', place: 'Nasugbu', lat: 14.0710, lng: 120.6295, aliases: ['brgy 8 nasugbu', 'bry 8 nasugbu', 'bgy 8 nasugbu'] },
        { name: 'Barangay 9 (Poblacion)', place: 'Nasugbu', lat: 14.0730, lng: 120.6305, aliases: ['brgy 9 nasugbu', 'bry 9 nasugbu'] },
        { name: 'Barangay 10 (Poblacion)', place: 'Nasugbu', lat: 14.0745, lng: 120.6320, aliases: ['brgy 10 nasugbu', 'bry 10 nasugbu'] },
        { name: 'Barangay 11 (Poblacion)', place: 'Nasugbu', lat: 14.0755, lng: 120.6340, aliases: ['brgy 11 nasugbu', 'bry 11 nasugbu'] },
        { name: 'Barangay 12 (Poblacion)', place: 'Nasugbu', lat: 14.0740, lng: 120.6355, aliases: ['brgy 12 nasugbu', 'bry 12 nasugbu'] },
        { name: 'Barangay Aga', place: 'Nasugbu', lat: 14.1350, lng: 120.8050, aliases: ['aga', 'brgy aga'] },
        { name: 'Barangay Balitoc', place: 'Nasugbu', lat: 14.1120, lng: 120.6120, aliases: ['balitoc', 'brgy balitoc'] },
        { name: 'Barangay Banilad', place: 'Nasugbu', lat: 14.0880, lng: 120.6650, aliases: ['banilad', 'brgy banilad'] },
        { name: 'Barangay Bilaran', place: 'Nasugbu', lat: 14.0550, lng: 120.6480, aliases: ['bilaran', 'brgy bilaran'] },
        { name: 'Barangay Bucana', place: 'Nasugbu', lat: 14.0780, lng: 120.6250, aliases: ['bucana', 'brgy bucana', 'bry bucana'] },
        { name: 'Barangay Bulihan', place: 'Nasugbu', lat: 14.0950, lng: 120.6520, aliases: ['bulihan', 'brgy bulihan'] },
        { name: 'Barangay Calayo', place: 'Nasugbu', lat: 14.2150, lng: 120.6180, aliases: ['calayo', 'brgy calayo', 'calayo beach'] },
        { name: 'Barangay Catandaan', place: 'Nasugbu', lat: 14.0850, lng: 120.6920, aliases: ['catandaan', 'brgy catandaan'] },
        { name: 'Barangay Dayap', place: 'Nasugbu', lat: 14.1200, lng: 120.7100, aliases: ['dayap', 'brgy dayap'] },
        { name: 'Barangay Kaylaway', place: 'Nasugbu', lat: 14.1080, lng: 120.7650, aliases: ['kaylaway', 'brgy kaylaway'] },
        { name: 'Barangay Looc', place: 'Nasugbu', lat: 14.2400, lng: 120.6050, aliases: ['looc', 'brgy looc', 'pico de loro', 'hamilo coast'] },
        { name: 'Barangay Lumbangan', place: 'Nasugbu', lat: 14.0620, lng: 120.6800, aliases: ['lumbangan', 'brgy lumbangan'] },
        { name: 'Barangay Natipuan', place: 'Nasugbu', lat: 14.1850, lng: 120.6020, aliases: ['natipuan', 'brgy natipuan', 'canyon cove'] },
        { name: 'Barangay Pantalan', place: 'Nasugbu', lat: 14.0760, lng: 120.6310, aliases: ['pantalan', 'brgy pantalan'] },
        { name: 'Barangay Papaya', place: 'Nasugbu', lat: 14.2520, lng: 120.5980, aliases: ['papaya', 'brgy papaya'] },
        { name: 'Barangay Putat', place: 'Nasugbu', lat: 14.0480, lng: 120.6650, aliases: ['putat', 'brgy putat'] },
        { name: 'Barangay Talangan', place: 'Nasugbu', lat: 14.0820, lng: 120.6450, aliases: ['talangan', 'brgy talangan'] },
        { name: 'Barangay Wawa', place: 'Nasugbu', lat: 14.0750, lng: 120.6270, aliases: ['wawa', 'brgy wawa'] },
        { name: 'Nasugbu Municipal Gymnasium & Covered Court', place: 'Nasugbu', lat: 14.0718, lng: 120.6342, aliases: ['nasugbu covered court', 'gym', 'gymnasium'] },
        { name: 'Club Balai Isabel / Events Pavilion', place: 'Nasugbu', lat: 14.0780, lng: 120.6400, aliases: ['club balai', 'balai', 'events hall'] },

        // LIAN BARANGAYS & VENUES
        { name: 'Barangay Bagong Pook', place: 'Lian', lat: 14.0380, lng: 120.6550, aliases: ['bagong pook', 'brgy bagong pook'] },
        { name: 'Barangay Balibago', place: 'Lian', lat: 13.9850, lng: 120.6280, aliases: ['balibago', 'brgy balibago'] },
        { name: 'Barangay Binubusan', place: 'Lian', lat: 14.0150, lng: 120.6620, aliases: ['binubusan', 'brgy binubusan'] },
        { name: 'Barangay Bungahan', place: 'Lian', lat: 14.0450, lng: 120.6680, aliases: ['bungahan', 'brgy bungahan'] },
        { name: 'Barangay Cumba', place: 'Lian', lat: 14.0280, lng: 120.6850, aliases: ['cumba', 'brgy cumba'] },
        { name: 'Barangay Humayingan', place: 'Lian', lat: 14.0520, lng: 120.6720, aliases: ['humayingan', 'brgy humayingan'] },
        { name: 'Barangay Kapito', place: 'Lian', lat: 14.0180, lng: 120.6420, aliases: ['kapito', 'brgy kapito'] },
        { name: 'Barangay Lumaniag', place: 'Lian', lat: 14.0410, lng: 120.6350, aliases: ['lumaniag', 'brgy lumaniag'] },
        { name: 'Barangay Luyahan', place: 'Lian', lat: 14.0620, lng: 120.6580, aliases: ['luyahan', 'brgy luyahan'] },
        { name: 'Barangay Malaruhatan', place: 'Lian', lat: 14.0250, lng: 120.6310, aliases: ['malaruhatan', 'brgy malaruhatan'] },
        { name: 'Barangay Matabungkay', place: 'Lian', lat: 13.9680, lng: 120.6320, aliases: ['matabungkay', 'brgy matabungkay', 'matabungkay beach'] },
        { name: 'Barangay Poblacion 1-5', place: 'Lian', lat: 14.0322, lng: 120.6514, aliases: ['poblacion', 'lian poblacion', 'pob lian'] },
        { name: 'Barangay Prenza', place: 'Lian', lat: 14.0480, lng: 120.6450, aliases: ['prenza', 'brgy prenza'] },
        { name: 'Barangay Puting-Kahoy', place: 'Lian', lat: 14.0050, lng: 120.6750, aliases: ['puting kahoy', 'brgy puting-kahoy'] },
        { name: 'Barangay San Diego', place: 'Lian', lat: 13.9890, lng: 120.6450, aliases: ['san diego', 'brgy san diego'] },
        { name: 'Lian Covered Court / Plaza', place: 'Lian', lat: 14.0325, lng: 120.6510, aliases: ['lian covered court', 'lian court', 'lian plaza'] }
    ];

    // Instant local place search matching algorithm
    const matchLocalBatangasPlaces = (query, selectedPlace = '') => {
        if (!query) return [];
        const normQ = String(query).toLowerCase().replace(/[^a-z0-9\\s]/g, ' ').trim();
        const tokens = normQ.split(/\\s+/).filter(t => t.length > 0);
        if (tokens.length === 0) return [];

        return BATANGAS_PLACES_DB.map(p => {
            let score = 0;
            const pName = p.name.toLowerCase();
            const pPlace = p.place.toLowerCase();
            const allSearchText = [pName, pPlace, ...(p.aliases || [])].join(' ').toLowerCase();

            // Match priority if place matches current selected municipality
            if (selectedPlace && pPlace === selectedPlace.toLowerCase()) {
                score += 10;
            }

            tokens.forEach(tok => {
                // Ignore general filler words
                if (['philippines', 'batangas', 'calabarzon', 'street', 'st'].includes(tok)) return;

                if (p.aliases && p.aliases.some(a => a === tok || a.includes(tok))) {
                    score += 25;
                } else if (pName.includes(tok)) {
                    score += 15;
                } else if (allSearchText.includes(tok)) {
                    score += 8;
                }
            });

            return { place: p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.place);
    };
`;

for (const f of jsFiles) {
    if (!fs.existsSync(f)) continue;
    let js = fs.readFileSync(f, 'utf-8');

    // Replace the top of search logic with the dataset and instant matcher
    if (!js.includes('BATANGAS_PLACES_DB')) {
        js = js.replace('const MUNICIPALITY_COORDS =', databaseAndAutocompleteModule + '\n    const MUNICIPALITY_COORDS =');
    }

    // Now rewrite bindAddressAutocomplete with instant keystroke dropdown and auto-pinning
    const oldBindRegex = /const bindAddressAutocomplete = \(inputEl, suggestionsEl, onSelectPlace\) => \{[\s\S]*?document\.addEventListener\('click', \(e\) => \{[\s\S]*?\}\);\s*\};/;

    const newBind = `const bindAddressAutocomplete = (inputEl, suggestionsEl, onSelectPlace) => {
            if (!inputEl || !suggestionsEl) return;
            let timer = null;

            const hide = () => {
                suggestionsEl.classList.add('hidden');
                suggestionsEl.innerHTML = '';
            };

            const renderSuggestions = (items) => {
                if (!items || items.length === 0) {
                    hide();
                    return;
                }

                suggestionsEl.innerHTML = '';
                items.slice(0, 6).forEach((item) => {
                    const li = document.createElement('li');
                    li.className = 'address-suggestion-item';
                    const title = item.name || item.display_name;
                    const subtitle = item.place ? \`\${item.place}, Batangas, Philippines\` : (item.display_name || '');

                    li.innerHTML = \`
                        <i class="fa-solid fa-location-dot" style="color:#2563eb; font-size:1.1rem; margin-top:2px;"></i>
                        <div style="flex:1; overflow:hidden;">
                            <strong style="color:#0f172a; display:block; font-size:0.96rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${title}</strong>
                            <span style="color:#64748b; font-size:0.82rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">\${subtitle}</span>
                        </div>
                    \`;

                    li.addEventListener('click', () => {
                        const fullAddr = \`\${title}, \${item.place || (placeSelect ? placeSelect.value : 'Batangas')}, Batangas\`;
                        inputEl.value = fullAddr;
                        hide();
                        if (typeof onSelectPlace === 'function') {
                            onSelectPlace(parseFloat(item.lat), parseFloat(item.lng || item.lon), fullAddr);
                        }
                    });

                    suggestionsEl.appendChild(li);
                });

                suggestionsEl.classList.remove('hidden');
            };

            // INSTANT SUGGESTIONS & AUTO-PIN WHILE TYPING
            inputEl.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(timer);

                if (query.length < 2) {
                    hide();
                    return;
                }

                const currPlace = placeSelect ? placeSelect.value : '';

                // 1. Instant 0ms Local Matching
                const localMatches = matchLocalBatangasPlaces(query, currPlace);
                if (localMatches.length > 0) {
                    renderSuggestions(localMatches);

                    // AUTOMATICALLY PIN IMMEDIATELY TO TOP MATCH WHILE TYPING!
                    if (!isPinLocked && typeof onSelectPlace === 'function') {
                        const top = localMatches[0];
                        onSelectPlace(parseFloat(top.lat), parseFloat(top.lng), null, false);
                    }
                    return;
                }

                // 2. Debounced Remote Fallback for places outside local dataset
                timer = setTimeout(async () => {
                    try {
                        const results = await searchLocation(query);
                        if (results && results.length > 0) {
                            renderSuggestions(results);
                            if (!isPinLocked && typeof onSelectPlace === 'function') {
                                onSelectPlace(parseFloat(results[0].lat), parseFloat(results[0].lon), null, false);
                            }
                        } else {
                            hide();
                        }
                    } catch (err) {
                        hide();
                    }
                }, 250);
            });

            inputEl.addEventListener('focus', () => {
                const query = inputEl.value.trim();
                if (query.length >= 2) {
                    const currPlace = placeSelect ? placeSelect.value : '';
                    const localMatches = matchLocalBatangasPlaces(query, currPlace);
                    if (localMatches.length > 0) renderSuggestions(localMatches);
                }
            });

            inputEl.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = inputEl.value.trim();
                    if (!query) return;

                    hide();
                    const currPlace = placeSelect ? placeSelect.value : '';
                    const localMatches = matchLocalBatangasPlaces(query, currPlace);
                    if (localMatches.length > 0) {
                        const top = localMatches[0];
                        const fullAddr = \`\${top.name}, \${top.place}, Batangas\`;
                        inputEl.value = fullAddr;
                        if (typeof onSelectPlace === 'function') {
                            onSelectPlace(parseFloat(top.lat), parseFloat(top.lng), fullAddr);
                        }
                    } else {
                        const results = await searchLocation(query);
                        if (results && results.length > 0) {
                            const item = results[0];
                            inputEl.value = item.display_name;
                            if (typeof onSelectPlace === 'function') {
                                onSelectPlace(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
                            }
                        }
                    }
                }
            });

            document.addEventListener('click', (e) => {
                if (!inputEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
                    hide();
                }
            });
        };`;

    js = js.replace(oldBindRegex, newBind);

    // Also bind venue-suggestions-list in Leaflet init:
    if (!js.includes("document.getElementById('venue-suggestions-list')")) {
        js = js.replace(
            "bindAddressAutocomplete(completeAddressInput, addressSuggestionsList, selectPlaceOnMap);",
            `bindAddressAutocomplete(completeAddressInput, addressSuggestionsList, selectPlaceOnMap);
                const venueSuggestionsList = document.getElementById('venue-suggestions-list');
                if (venueNameInput && venueSuggestionsList) {
                    bindAddressAutocomplete(venueNameInput, venueSuggestionsList, selectPlaceOnMap);
                }`
        );
    }

    fs.writeFileSync(f, js, 'utf-8');
    console.log('Updated JS: ' + f);
}

console.log('Instant Autocomplete & Auto-Pinning installed successfully!');
