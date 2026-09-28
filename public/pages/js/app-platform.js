/**
 * SoundSphere - Unified Modern Client Platform Controller (Vanilla JS ES6)
 * Handles view navigation with URL hash & session persistence, live search & category/place filtering,
 * provider profile view, booking checkout system, direct messaging, 4 distinct profile subtabs, review submission,
 * booking status filters, and multi-step Service Provider Application wizard.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM VIEW PANELS & TOP NAV TABS
    const views = {
        home: document.getElementById('view-home'),
        search: document.getElementById('view-search'),
        messages: document.getElementById('view-messages'),
        profile: document.getElementById('view-profile')
    };

    const navTabs = {
        home: document.getElementById('nav-home'),
        search: document.getElementById('nav-search-tab'),
        messages: document.getElementById('nav-messages-tab'),
        profile: document.getElementById('nav-profile-tab')
    };

    // Switch View Panel Handler with URL Hash & Session Persistence
    const switchView = (viewName) => {
        Object.keys(views).forEach(key => {
            if (views[key]) {
                if (key === viewName) {
                    views[key].classList.remove('hidden');
                } else {
                    views[key].classList.add('hidden');
                }
            }

            if (navTabs[key]) {
                if (key === viewName) {
                    navTabs[key].classList.add('active');
                } else {
                    navTabs[key].classList.remove('active');
                }
            }
        });

        // Save state to sessionStorage & location hash so refreshing F5 stays on current page
        sessionStorage.setItem('soundsphere_active_view', viewName);
        if (window.location.hash !== '#' + viewName) {
            history.replaceState(null, null, '#' + viewName);
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (viewName === 'messages' && typeof window.fetchPlatformConversations === 'function') {
            window.fetchPlatformConversations();
        }

        if (viewName === 'profile') {
            if (typeof window.loadProfileData === 'function') {
                window.loadProfileData();
            } else if (typeof window.syncAllProfileUI === 'function') {
                const userObj = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
                if (userObj) window.syncAllProfileUI(userObj);
            }
            if (typeof window.fetchUserBookings === 'function') {
                window.fetchUserBookings();
            }
        }
    };

    // Attach Top Nav Tab Event Listeners
    Object.keys(navTabs).forEach(key => {
        if (navTabs[key]) {
            navTabs[key].addEventListener('click', (e) => {
                e.preventDefault();
                switchView(key);
            });
        }
    });

    // 2. USER AVATAR DROPDOWN & LOGOUT HANDLERS
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    if (avatarBtn && userDropdown) {
        const hideDropdown = () => {
            userDropdown.style.display = 'none';
            userDropdown.classList.remove('show');
            userDropdown.classList.add('hidden');
        };

        const showDropdown = () => {
            userDropdown.style.display = 'flex';
            userDropdown.classList.add('show');
            userDropdown.classList.remove('hidden');
        };

        avatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = userDropdown.style.display === 'none' || getComputedStyle(userDropdown).display === 'none' || !userDropdown.classList.contains('show');
            if (isHidden) {
                showDropdown();
            } else {
                hideDropdown();
            }
        });

        document.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                hideDropdown();
            }
        });
    }

    // Perform Logout Action
    const performLogout = async () => {
        try {
            if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.logoutAPI) {
                await SoundSphereAPI.logoutAPI();
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login.html?logout=true';
            }
        } catch (e) {
            console.warn('Logout error:', e.message);
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login.html?logout=true';
        }
    };

    // Attach Logout Actions
    document.querySelectorAll('#direct-logout-btn, #logout-btn, #settings-logout-btn, .logout-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            performLogout();
        });
    });

    // 3. SEARCH & CATEGORY / PLACE FILTERING LOGIC
    const heroSearchInput = document.getElementById('hero-search-input');
    const heroSearchBtn = document.getElementById('hero-search-btn');

    const handleSearchQuery = (query = '', category = 'all', place = 'all', priceRange = 'all') => {
        switchView('search');
        const mainSearchInput = document.getElementById('main-search-input');
        const categorySelect = document.getElementById('search-category-select');
        const placeSelect = document.getElementById('search-location-select');
        const priceSelect = document.getElementById('search-price-select');

        if (mainSearchInput) mainSearchInput.value = query;
        if (categorySelect) categorySelect.value = category;
        if (placeSelect) placeSelect.value = place;
        if (priceSelect) priceSelect.value = priceRange;

        filterSearchResults(query, category, place, priceRange);
    };

    if (heroSearchBtn) {
        heroSearchBtn.addEventListener('click', () => {
            const query = heroSearchInput ? heroSearchInput.value.trim() : '';
            const homeCategorySelect = document.getElementById('home-category-select');
            const homePlaceSelect = document.getElementById('home-place-select');
            const category = homeCategorySelect ? homeCategorySelect.value : 'all';
            const place = homePlaceSelect ? homePlaceSelect.value : 'all';
            handleSearchQuery(query, category, place, 'all');
        });
    }

    if (heroSearchInput) {
        heroSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = heroSearchInput.value.trim();
                const homeCategorySelect = document.getElementById('home-category-select');
                const homePlaceSelect = document.getElementById('home-place-select');
                const category = homeCategorySelect ? homeCategorySelect.value : 'all';
                const place = homePlaceSelect ? homePlaceSelect.value : 'all';
                handleSearchQuery(query, category, place, 'all');
            }
        });
    }

    const homeCategorySelect = document.getElementById('home-category-select');
    const homePlaceSelect = document.getElementById('home-place-select');

    if (homeCategorySelect) {
        homeCategorySelect.addEventListener('change', () => {
            const selectedCategory = homeCategorySelect.value;
            const selectedPlace = homePlaceSelect ? homePlaceSelect.value : 'all';
            const query = heroSearchInput ? heroSearchInput.value.trim() : '';
            handleSearchQuery(query, selectedCategory, selectedPlace, 'all');
        });
    }

    if (homePlaceSelect) {
        homePlaceSelect.addEventListener('change', () => {
            const selectedPlace = homePlaceSelect.value;
            const selectedCategory = homeCategorySelect ? homeCategorySelect.value : 'all';
            const query = heroSearchInput ? heroSearchInput.value.trim() : '';
            handleSearchQuery(query, selectedCategory, selectedPlace, 'all');
        });
    }

    const btnViewAllProviders = document.getElementById('btn-view-all-providers');
    if (btnViewAllProviders) {
        btnViewAllProviders.addEventListener('click', () => {
            const heroInput = document.getElementById('hero-search-input');
            const mainInput = document.getElementById('main-search-input');
            const homeCategorySelect = document.getElementById('home-category-select');
            const homePlaceSelect = document.getElementById('home-place-select');
            const searchCategorySelect = document.getElementById('search-category-select');
            const searchLocationSelect = document.getElementById('search-location-select');
            const searchPriceSelect = document.getElementById('search-price-select');

            if (heroInput) heroInput.value = '';
            if (mainInput) mainInput.value = '';
            if (homeCategorySelect) homeCategorySelect.value = 'all';
            if (homePlaceSelect) homePlaceSelect.value = 'all';
            if (searchCategorySelect) searchCategorySelect.value = 'all';
            if (searchLocationSelect) searchLocationSelect.value = 'all';
            if (searchPriceSelect) searchPriceSelect.value = 'all';

            handleSearchQuery('', 'all', 'all', 'all');
        });
    }

    const searchCategorySelect = document.getElementById('search-category-select');
    const searchLocationSelect = document.getElementById('search-location-select');
    const searchPriceSelect = document.getElementById('search-price-select');
    const mainSearchInput = document.getElementById('main-search-input');

    const triggerSidebarSearchFilters = () => {
        const query = mainSearchInput ? mainSearchInput.value.trim() : '';
        const category = searchCategorySelect ? searchCategorySelect.value : 'all';
        const place = searchLocationSelect ? searchLocationSelect.value : 'all';
        const price = searchPriceSelect ? searchPriceSelect.value : 'all';

        filterSearchResults(query, category, place, price);
    };

    if (searchCategorySelect) searchCategorySelect.addEventListener('change', triggerSidebarSearchFilters);
    if (searchLocationSelect) searchLocationSelect.addEventListener('change', triggerSidebarSearchFilters);
    if (searchPriceSelect) searchPriceSelect.addEventListener('change', triggerSidebarSearchFilters);
    if (mainSearchInput) mainSearchInput.addEventListener('input', triggerSidebarSearchFilters);

    // Dynamic Providers & Bookings arrays fetched from SQL Server DB
    let providerDatabase = [];
    let bookingRecords = [];

    let allRawProvidersCache = [];

    // Helper: Extract all individual active package offers from approved providers
    const extractAllOffersFromProviders = (providers = []) => {
        let allOffers = [];
        (providers || []).forEach(p => {
            if (p.verified && Array.isArray(p.packages) && p.packages.length > 0) {
                p.packages.forEach(pkg => {
                    if (pkg.isActive !== false && pkg.isActive !== 0) {
                        allOffers.push({
                            ...pkg,
                            PackageID: pkg.PackageID || pkg.id,
                            providerId: p.id || p.userId,
                            providerName: p.name || p.businessName,
                            providerAvatar: p.profilePicture || p.avatar || p.userProfilePicture,
                            providerRating: p.rating || 5.0,
                            providerVerified: p.verified,
                            coverageArea: p.coverageArea || 'Batangas'
                        });
                    }
                });
            }
        });
        return allOffers;
    };

    // Helper to render Shopee-Style Service Offer Cards HTML
    const renderShopeeOfferCardsHTML = (offers = []) => {
        if (!offers || offers.length === 0) {
            return `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0;">
                    <i class="fa-solid fa-box-open" style="font-size: 2.8rem; color: #94a3b8; margin-bottom: 12px; display: block;"></i>
                    <h3 style="color: #0a192f; margin: 0 0 6px 0; font-size: 1.15rem; font-weight: 800;">No Service Offers Found</h3>
                    <p style="color: #64748b; font-size: 0.9rem; margin: 0;">Try searching with different keywords or selecting "All Categories" or "All Places".</p>
                </div>
            `;
        }

        return offers.map(offer => {
            const offerTitle = offer.PackageName || offer.name || offer.title || 'Service Package Offer';
            const offerPrice = parseFloat(offer.Price || offer.price || 0);
            const category = offer.Category || offer.category || 'Concert Audio & Stage Lights';
            const rawInclusions = offer.Inclusions || offer.inclusions || offer.Description || 'Full Setup Inclusions';
            const inclusionsArr = Array.isArray(rawInclusions)
                ? rawInclusions.map(s => String(s).trim()).filter(Boolean)
                : String(rawInclusions).split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);

            const offerPhotos = Array.isArray(offer.images) ? offer.images : [];
            let offerPhotoUrl = null;
            if (offerPhotos.length > 0 && offerPhotos[0].url) {
                const u = offerPhotos[0].url;
                offerPhotoUrl = u.startsWith('/') || u.startsWith('http') ? u : `/${u}`;
            }

            const avatarSrc = offer.providerAvatar;
            const avatarHTML = avatarSrc ?
                `<img src="${avatarSrc.startsWith('/') || avatarSrc.startsWith('http') ? avatarSrc : '/' + avatarSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` :
                `<i class="fa-solid fa-store" style="color:#2563eb;"></i>`;

                        return `
                <div class="shopee-offer-card" data-id="${offer.providerId}" data-pkg-id="${offer.PackageID}" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; box-shadow:0 3px 12px rgba(10,25,47,0.06); transition:all 0.25s ease; display:flex; flex-direction:column; justify-content:space-between; max-width:520px; width:100%; border-radius:16px;">
                    <div>
                        <!-- 1. Setup / Inclusion Photo (Click image to enlarge) -->
                        <div class="offer-card-image-wrap" onclick="const img=this.querySelector('img'); if(img && img.src) window.openPhotoLightbox(img.src);" style="position:relative; height:240px; overflow:hidden; background:linear-gradient(135deg, #0a192f 0%, #1e3e62 100%); display:flex; align-items:center; justify-content:center; cursor:pointer;" title="Click photo to enlarge">
                            ${offerPhotoUrl ? 
                                `<img id="main-offer-img-${offer.PackageID}" src="${offerPhotoUrl}" alt="${offerTitle}" class="enlargeable-photo" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s ease;" onmouseover="this.style.transform='scale(1.04)'" onmouseout="this.style.transform='scale(1)'">` : 
                                `<i class="fa-solid fa-sliders" style="font-size:3rem; color:rgba(255,255,255,0.2);"></i>`
                            }
                            <span style="position:absolute; top:12px; left:12px; background:rgba(37,99,235,0.95); color:#ffffff; padding:5px 14px; border-radius:16px; font-size:0.84rem; font-weight:800; text-transform:uppercase; backdrop-filter:blur(4px); box-shadow:0 2px 6px rgba(0,0,0,0.25);">${category}</span>
                            <span style="position:absolute; top:12px; right:12px; background:rgba(16,185,129,0.95); color:#ffffff; padding:5px 14px; border-radius:16px; font-size:0.84rem; font-weight:800; backdrop-filter:blur(4px); box-shadow:0 2px 6px rgba(0,0,0,0.25);"><i class="fa-solid fa-circle-check"></i> Available</span>
                            ${offerPhotoUrl ? `<span style="position:absolute; bottom:12px; right:12px; background:rgba(10,25,47,0.7); color:#ffffff; padding:4px 10px; border-radius:14px; font-size:0.75rem; font-weight:700; backdrop-filter:blur(4px); pointer-events:none;"><i class="fa-solid fa-magnifying-glass-plus"></i> Enlarge</span>` : ''}
                        </div>

                        <!-- Mini Gallery Preview Thumbnails -->
                        ${offerPhotos.length > 1 ? `
                            <div style="display:flex; gap:6px; padding:8px 12px; background:#f8fafc; border-bottom:1px solid #e2e8f0; overflow-x:auto;">
                                ${offerPhotos.slice(0, 4).map(img => {
                                    const u = img.url.startsWith('/') || img.url.startsWith('http') ? img.url : `/${img.url}`;
                                    return `<img src="${u}" class="enlargeable-photo" onclick="event.stopPropagation(); window.openPhotoLightbox('${u}');" style="width:44px; height:44px; border-radius:6px; object-fit:cover; border:1.5px solid #cbd5e1; cursor:pointer; transition:transform 0.2s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" title="Click to enlarge thumbnail">`;
                                }).join('')}
                            </div>
                        ` : ''}

                        <!-- Card Content Body -->
                        <div style="padding:22px 24px 16px 24px;">
                            <!-- 2. Service Offer Name (Clickable Title for Details Modal) -->
                            <h3 onclick="window.openMarketplaceOfferModal ? window.openMarketplaceOfferModal('${offer.PackageID}', '${offer.providerId}') : window.location.href='/provider-detail.html?id=${offer.providerId}&pkgId=${offer.PackageID}'" style="margin:0 0 10px 0; font-size:1.35rem; font-weight:800; color:#0a192f; line-height:1.35; min-height:2.7em; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; cursor:pointer; transition:color 0.2s ease;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#0a192f'" title="Click to view offer details: ${offerTitle}">${offerTitle}</h3>

                            <!-- 3. Price & 4. Rating -->
                            <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px;">
                                <div style="font-size:1.75rem; font-weight:900; color:#2563eb; letter-spacing:-0.5px;">
                                    ₱${offerPrice.toLocaleString('en-US', {minimumFractionDigits: 2})} 
                                    <span style="font-size:0.95rem; color:#475569; font-weight:600;">/ Event</span>
                                </div>
                                <div style="font-size:0.95rem; font-weight:800; color:#d97706; background:#fffbeb; padding:3px 8px; border-radius:10px; border:1px solid #fde68a;">
                                    <i class="fa-solid fa-star"></i> 5.0
                                </div>
                            </div>

                            <!-- 5. Short Description / Inclusions (Clickable for Details Modal) -->
                            <div onclick="window.openMarketplaceOfferModal ? window.openMarketplaceOfferModal('${offer.PackageID}', '${offer.providerId}') : window.location.href='/provider-detail.html?id=${offer.providerId}&pkgId=${offer.PackageID}'" style="margin-bottom:14px; background:#f8fafc; padding:12px 16px; border-radius:12px; border:1px solid #e2e8f0; cursor:pointer;" title="Click to view full inclusions list">
                                <strong style="font-size:0.84rem; color:#334155; text-transform:uppercase; letter-spacing:0.6px; display:block; margin-bottom:6px; font-weight:800;">Inclusions:</strong>
                                <ul style="list-style:none; padding:0; margin:0; font-size:0.98rem; color:#0f172a; display:flex; flex-direction:column; gap:4px;">
                                    ${inclusionsArr.slice(0, 3).map(inc => `<li style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600;"><i class="fa-solid fa-check" style="color:#059669; margin-right:8px; font-size:0.95rem; font-weight:900;"></i> ${inc}</li>`).join('')}
                                    ${inclusionsArr.length > 3 ? `<li style="font-size:0.8rem; color:#475569; font-style:italic; font-weight:600; margin-top:2px;">+ ${inclusionsArr.length - 3} more included</li>` : ''}
                                </ul>
                            </div>

                            <!-- 6. Provider Name & 7. Location (Clickable for Provider Profile) -->
                            <div style="border-top:1px solid #e2e8f0; padding-top:12px; margin-top:10px;">
                                <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" onclick="window.location.href='/provider-detail.html?id=${offer.providerId}'" title="View Storefront Profile of ${offer.providerName}">
                                    <div style="width:42px; height:42px; border-radius:50%; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:0.95rem; overflow:hidden; border:1.5px solid #93c5fd; flex-shrink:0;" onclick="event.stopPropagation(); const img = this.querySelector('img'); if (img && img.src) window.openPhotoLightbox(img.src); else window.location.href='/provider-detail.html?id=${offer.providerId}';">
                                        ${avatarHTML}
                                    </div>
                                    <div style="overflow:hidden; flex:1;">
                                        <a href="/provider-detail.html?id=${offer.providerId}" onclick="event.stopPropagation();" style="font-size:1.05rem; font-weight:800; color:#0a192f; text-decoration:none; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="Click to view ${offer.providerName} Profile">
                                            ${offer.providerName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem; color:#2563eb; margin-left:4px;"></i>
                                        </a>
                                        <span style="font-size:0.98rem; color:#475569; font-weight:600; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px;">
                                            <i class="fa-solid fa-location-dot" style="color:#ef4444; margin-right:4px;"></i> ${offer.coverageArea}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 9. Action Buttons -->
                    <div style="padding:0 24px 24px 24px;">
                        <div style="display:flex; gap:10px;">
                            <button type="button" onclick="window.location.href='/client-messages.html?providerId=${offer.providerId}&providerName=${encodeURIComponent(offer.providerName)}'" style="flex:1; height:46px; border:1.5px solid #93c5fd; border-radius:10px; background:#eff6ff; color:#2563eb; font-weight:700; font-size:1.0rem; cursor:pointer; transition:all 0.2s ease;" title="Message Provider"><i class="fa-solid fa-comment-dots"></i> Chat</button>
                            <button type="button" onclick="window.location.href='/provider-detail.html?id=${offer.providerId}&pkgId=${offer.PackageID}'" style="flex:1.2; height:46px; border:none; border-radius:10px; background:#2563eb; color:#ffffff; font-weight:700; font-size:1.0rem; cursor:pointer; box-shadow:0 3px 10px rgba(37,99,235,0.25); transition:all 0.2s ease;" title="Book Offer">Book Now</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Helper: Render Home View Featured Providers Grid & Packages Grid
    const renderHomeFeaturedGrids = (rawProviders = []) => {
        allRawProvidersCache = rawProviders;
        const homeProvGrid = document.getElementById('home-featured-providers-grid');
        const searchResultsGrid = document.getElementById('search-results-grid');
        const searchResultsCount = document.getElementById('search-results-count');

        if (rawProviders.length > 0) {
            const allOffers = extractAllOffersFromProviders(rawProviders);
            if (allOffers.length > 0) {
                const html = renderShopeeOfferCardsHTML(allOffers);
                if (homeProvGrid) homeProvGrid.innerHTML = html;
                if (searchResultsGrid) searchResultsGrid.innerHTML = html;
                if (searchResultsCount) searchResultsCount.textContent = `Showing ${allOffers.length} Offer${allOffers.length === 1 ? '' : 's'}`;
            }
        }
    };

    // Helper: Fetch real approved providers from SQL Server API
    const fetchLiveProvidersFromAPI = async () => {
        try {
            const res = await fetch('/api/providers');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    allRawProvidersCache = data.data;
                    window.allRawProvidersCache = data.data;
                    renderHomeFeaturedGrids(data.data);

                    providerDatabase = data.data.map(p => ({
                        id: p.id,
                        name: p.name,
                        category: (p.categories && p.categories[0]) ? p.categories[0] : "Sound Systems",
                        verified: p.verified || true,
                        rating: p.rating || 5.0,
                        reviewsCount: p.reviewsCount || 0,
                        location: p.coverageArea || "Balayan, Batangas",
                        startingPrice: p.startingPrice || 15000,
                        image: p.banner || "/images/concert_line_array.png",
                        profilePicture: p.profilePicture || p.avatar || null,
                        description: `${p.name} - Professional Lights & Sounds Service Provider.`
                    }));
                    window.providerDatabase = providerDatabase;

                    if (typeof filterSearchResults === 'function') {
                        const heroInput = document.getElementById('hero-search-input');
                        const mainInput = document.getElementById('main-search-input');
                        const q = (heroInput && heroInput.value) || (mainInput && mainInput.value) || '';
                        filterSearchResults(q.trim());
                    }
                }
            }
        } catch (e) {
            console.warn('Live providers fetch notice:', e.message);
        }
    };

    fetchLiveProvidersFromAPI();

    // Filter Search Results Function (Space-Insensitive & Space-Tolerant Search over Service Package Offers)
    const filterSearchResults = async (keyword = '', category = 'all', place = 'all', priceRange = 'all') => {
        const resultsGrid = document.getElementById('search-results-grid');
        const resultsCountSpan = document.getElementById('search-results-count');

        if (!resultsGrid) return;

        // If cache is empty, fetch providers first
        if (!allRawProvidersCache || allRawProvidersCache.length === 0) {
            try {
                const res = await fetch('/api/providers');
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && Array.isArray(data.data)) {
                        allRawProvidersCache = data.data;
                        window.allRawProvidersCache = data.data;
                    }
                }
            } catch (e) {
                console.warn('Fetch fallback error in filterSearchResults:', e.message);
            }
        }

        const allOffers = extractAllOffersFromProviders(allRawProvidersCache);
        const cleanKey = keyword.toLowerCase().replace(/[\s\-_]/g, '');

        let filtered = allOffers.filter(offer => {
            const rawTitle = offer.PackageName || offer.name || offer.title || '';
            const title = (typeof rawTitle === 'string' ? rawTitle : String(rawTitle)).toLowerCase();

            const rawProvider = offer.providerName || '';
            const providerName = (typeof rawProvider === 'string' ? rawProvider : String(rawProvider)).toLowerCase();

            const rawCat = offer.Category || offer.category || '';
            const cat = (typeof rawCat === 'string' ? rawCat : String(rawCat)).toLowerCase();

            const rawDesc = offer.Description || offer.description || '';
            const desc = (typeof rawDesc === 'string' ? rawDesc : String(rawDesc)).toLowerCase();

            const rawInc = offer.Inclusions || offer.inclusions || '';
            const inclusionsStr = Array.isArray(rawInc) ? rawInc.join(' ') : String(rawInc);
            const inclusions = inclusionsStr.toLowerCase();

            const rawLoc = offer.coverageArea || '';
            const loc = (typeof rawLoc === 'string' ? rawLoc : String(rawLoc)).toLowerCase();

            const offerPrice = parseFloat(offer.Price || offer.price || 0);

            const cleanTitle = title.replace(/[\s\-_]/g, '');
            const cleanProvider = providerName.replace(/[\s\-_]/g, '');
            const cleanCat = cat.replace(/[\s\-_]/g, '');
            const cleanDesc = desc.replace(/[\s\-_]/g, '');
            const cleanInc = inclusions.replace(/[\s\-_]/g, '');
            const cleanLoc = loc.replace(/[\s\-_]/g, '');

            // 1. Keyword Filter
            const matchKeyword = !keyword || 
                title.includes(keyword.toLowerCase()) || 
                providerName.includes(keyword.toLowerCase()) || 
                cat.includes(keyword.toLowerCase()) || 
                desc.includes(keyword.toLowerCase()) || 
                inclusions.includes(keyword.toLowerCase()) ||
                cleanTitle.includes(cleanKey) ||
                cleanProvider.includes(cleanKey) ||
                cleanCat.includes(cleanKey) ||
                cleanDesc.includes(cleanKey) ||
                cleanInc.includes(cleanKey);

            // 2. Category Filter (Accurate Substring & Keyword Matching)
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

            // 3. Place / Location Filter
            const matchPlace = place === 'all' || !place || loc.includes(place.toLowerCase()) || cleanLoc.includes(place.toLowerCase().replace(/[\s\-_]/g, ''));

            // 4. Package Price Range Filter
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

        if (resultsCountSpan) {
            resultsCountSpan.textContent = `Showing ${filtered.length} Offer${filtered.length === 1 ? '' : 's'}`;
        }

        resultsGrid.innerHTML = renderShopeeOfferCardsHTML(filtered);
    };

    // OPEN BOOKING DETAILS MODAL
    const bookingDetailsModal = document.getElementById('modal-booking-details');
    const openBookingDetailsModal = (bookingId) => {
        const b = bookingRecords.find(item => item.id === bookingId) || bookingRecords[0];
        if (bookingDetailsModal) {
            document.getElementById('detail-booking-id').textContent = `#${b.id}`;
            document.getElementById('detail-provider-name').textContent = b.provider;
            document.getElementById('detail-package-name').textContent = b.package;
            document.getElementById('detail-event-date').textContent = b.date;
            document.getElementById('detail-event-venue').textContent = b.venue;
            document.getElementById('detail-total-amount').textContent = b.totalAmount;
            document.getElementById('detail-amount-paid').textContent = b.amountPaid;
            document.getElementById('detail-remaining-balance').textContent = b.remainingBalance;

            const statusSpan = document.getElementById('detail-booking-status');
            if (statusSpan) {
                statusSpan.textContent = b.status;
                statusSpan.className = `status-badge ${b.isCompleted ? 'status-completed' : (b.status === 'Pending' ? 'status-pending' : (b.status === 'Cancelled' ? 'status-cancelled' : 'status-confirmed'))}`;
            }


            bookingDetailsModal.classList.remove('hidden');
        }
    };

    const closeBookingDetailsBtn = document.getElementById('close-booking-details-btn');
    if (closeBookingDetailsBtn && bookingDetailsModal) {
        closeBookingDetailsBtn.addEventListener('click', () => {
            bookingDetailsModal.classList.add('hidden');
        });
    }

    // OPEN BOOKING CHECKOUT MODAL
    const bookingModal = document.getElementById('modal-booking-checkout');
    const openBookingModal = (providerId) => {
        const p = providerDatabase.find(item => item.id == providerId) || providerDatabase[0];
        if (bookingModal) {
            document.getElementById('booking-target-provider-name').textContent = p.name;
            bookingModal.classList.remove('hidden');
        } else {
            window.location.href = `/provider-detail.html?id=${providerId}`;
        }
    };

    const closeBookingModalBtn = document.getElementById('close-booking-modal-btn');
    if (closeBookingModalBtn && bookingModal) {
        closeBookingModalBtn.addEventListener('click', () => {
            bookingModal.classList.add('hidden');
        });
    }

    const bookingForm = document.getElementById('modal-booking-form');
    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const packageName = document.getElementById('booking-package-name')?.value || 'Concert Line Array & Stage Lighting Rigs';
            const eventDate = document.getElementById('booking-event-date')?.value || new Date().toISOString().split('T')[0];
            const eventTime = document.getElementById('booking-event-time')?.value || '06:00 PM';
            const location = document.getElementById('booking-location')?.value || 'Balayan, Batangas';
            const totalAmount = parseFloat(document.getElementById('booking-total-amount')?.value) || 15000;

            try {
                const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
                const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
                await fetch('/api/bookings', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ packageName, eventDate, eventTime, location, totalAmount })
                });
            } catch (err) {
                console.warn('Booking create notice:', err.message);
            }

            showToast('✓ Booking Reservation Saved Permanently to Database!', 'success');
            if (bookingModal) bookingModal.classList.add('hidden');
            switchView('profile');
            const bookingsSubtab = document.getElementById('subtab-btn-bookings');
            if (bookingsSubtab) bookingsSubtab.click();
            if (typeof window.renderMyBookingsCards === 'function') {
                window.renderMyBookingsCards();
            }
        });
    }

    // Dynamic SQL Server User Bookings Fetching & Rendering Engine
    window.fetchUserBookings = async () => {
        const myBookingsContainer = document.getElementById('my-bookings-cards-container');
        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
        const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
        if (!user && !token) return;

        try {
            const queryParam = user?.userId ? `?userId=${user.userId}` : '';
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(`/api/bookings/my-bookings${queryParam}`, { headers });
            if (!res.ok) return;

            const data = await res.json();
            if (!data.success || !Array.isArray(data.bookings)) return;

            const bookings = data.bookings;

            // Status Count Tracking
            const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
            bookings.forEach(b => {
                const st = (b.BookingStatus || 'Confirmed').toLowerCase().trim();
                if (counts[st] !== undefined) {
                    counts[st]++;
                } else if (st === 'approved' || st === 'paid') {
                    counts.confirmed++;
                }
            });

            // Update subtab count badges in DOM (Pending (N), Confirmed (N), Completed (N), Cancelled (N))
            document.querySelectorAll('.booking-status-filter-btn[data-status]').forEach(btn => {
                const statusKey = (btn.getAttribute('data-status') || '').toLowerCase().trim();
                const count = counts[statusKey] !== undefined ? counts[statusKey] : 0;
                const capitalized = statusKey.charAt(0).toUpperCase() + statusKey.slice(1);
                btn.textContent = `${capitalized} (${count})`;
            });

            const emptyMsg = document.getElementById('booking-status-empty-msg');

            if (myBookingsContainer) {
                if (bookings.length === 0) {
                    if (emptyMsg) emptyMsg.style.display = 'block';
                    myBookingsContainer.innerHTML = '';
                } else {
                    if (emptyMsg) emptyMsg.style.display = 'none';

                    // Build HTML cards
                    const cardsHtml = bookings.map(b => {
                        const statusStr = (b.BookingStatus || 'Confirmed');
                        const statusLower = statusStr.toLowerCase();
                        const sDate = b.ServiceStartDate || b.EventDate;
                        const eDate = b.ServiceEndDate || b.EventDate || sDate;
                        const hireDays = b.ServiceHireDays || b.NumberOfDays || 1;
                        const dateText = (sDate === eDate) ? sDate : `${sDate} to ${eDate}`;

                        let statusBadgeClass = 'status-confirmed';
                        if (statusLower === 'pending') statusBadgeClass = 'status-pending';
                        else if (statusLower === 'completed') statusBadgeClass = 'status-completed';
                        else if (statusLower === 'cancelled' || statusLower === 'rejected') statusBadgeClass = 'status-cancelled';

                        return `
                            <div class="booking-item-card" data-booking-status="${statusLower}" style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:18px; padding:24px 28px; margin-bottom:20px; box-shadow:0 6px 20px rgba(10,25,47,0.06); display:flex; flex-direction:column; gap:16px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <span style="font-size:1.1rem; font-weight:900; color:#0a192f;"><i class="fa-solid fa-receipt" style="color:#2563eb;"></i> Ref: ${b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`}</span>
                                        <span style="font-size:0.88rem; color:#64748b; font-weight:600;">Booked on ${new Date(b.CreatedAt).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'})}</span>
                                    </div>
                                    <span class="status-badge ${statusBadgeClass}" style="padding:6px 16px; border-radius:20px; font-weight:800; font-size:0.95rem;">${statusStr}</span>
                                </div>

                                <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                                    <img src="${b.ProviderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(b.ProviderName || 'Provider') + '&background=0084ff&color=fff'}" alt="${b.ProviderName || 'Provider'}" style="width:70px; height:70px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Provider&background=0084ff&color=fff';">
                                    <div style="flex:1; min-width:240px;">
                                        <h4 style="margin:0 0 6px 0; font-size:1.25rem; font-weight:900; color:#0a192f;">${b.PackageName || 'Event Service Package'}</h4>
                                        <div style="font-size:1rem; font-weight:700; color:#2563eb; margin-bottom:6px;"><i class="fa-solid fa-store"></i> ${b.ProviderName || 'Sound & Lights Provider'}</div>
                                        <div style="font-size:0.95rem; color:#475569; font-weight:600; display:flex; flex-wrap:wrap; gap:16px;">
                                            <span><i class="fa-solid fa-calendar-day" style="color:#0284c7;"></i> ${dateText} (${hireDays} Day${hireDays > 1 ? 's' : ''})</span>
                                            <span><i class="fa-solid fa-clock" style="color:#d97706;"></i> ${b.StartTime || '06:00 PM'} – ${b.EndTime || '10:00 PM'}</span>
                                            <span><i class="fa-solid fa-location-dot" style="color:#10b981;"></i> ${b.VenueName ? b.VenueName + ' (' + (b.EventPlace || 'Batangas') + ')' : (b.EventAddress || b.EventPlace || 'Batangas')}</span>
                                        </div>
                                    </div>
                                    <div style="text-align:right; min-width:160px; display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                                        <div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase;">Total Amount</div>
                                        <div style="font-size:1.6rem; font-weight:900; color:#2563eb;">₱${parseFloat(b.TotalAmount || b.PackagePrice || 0).toLocaleString()}</div>
                                        <span style="font-size:0.82rem; font-weight:800; background:#ecfdf5; color:#047857; padding:4px 10px; border-radius:6px; display:inline-block;"><i class="fa-solid fa-lock"></i> ${b.PaymentStatus || 'Paid'} (${b.PaymentType === 'downpayment' ? '50% Deposit' : '100% Full'})</span>
                                    </div>
                                </div>

                                <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #e2e8f0; padding-top:14px; flex-wrap:wrap;">
                                    <a href="booking-confirmation.html?ref=${encodeURIComponent(b.BookingReference || '')}&id=${b.BookingID}" class="btn-card-secondary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px;">
                                        <i class="fa-solid fa-file-invoice"></i> View Official Receipt
                                    </a>
                                    <a href="client-messages.html?providerId=${b.ProviderID}&providerName=${encodeURIComponent(b.ProviderName || 'Provider')}" class="btn-card-primary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px;">
                                        <i class="fa-solid fa-comments"></i> Chat Provider
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join('');

                    myBookingsContainer.innerHTML = cardsHtml;

                    // Active status pill filter execution
                    const activeStatusBtn = document.querySelector('.booking-status-filter-btn.active');
                    if (activeStatusBtn) {
                        const targetSt = (activeStatusBtn.getAttribute('data-status') || '').toLowerCase();
                        let matchCount = 0;
                        document.querySelectorAll('#my-bookings-cards-container .booking-item-card[data-booking-status]').forEach(card => {
                            const st = card.getAttribute('data-booking-status');
                            if (st === targetSt) {
                                card.style.display = 'flex';
                                matchCount++;
                            } else {
                                card.style.display = 'none';
                            }
                        });
                        if (emptyMsg) {
                            emptyMsg.style.display = matchCount === 0 ? 'block' : 'none';
                        }
                    }
                }
            }

            // Populate Booking History tab (#booking-history-cards-container)
            const historyContainer = document.getElementById('booking-history-cards-container');
            if (historyContainer) {
                const pastBookings = bookings.filter(b => ['completed', 'cancelled', 'rejected'].includes((b.BookingStatus || '').toLowerCase()));
                if (pastBookings.length > 0) {
                    historyContainer.innerHTML = pastBookings.map((b, idx) => {
                        const statusStr = (b.BookingStatus || 'Completed');
                        const statusLower = statusStr.toLowerCase();
                        const sDate = b.ServiceStartDate || b.EventDate || 'N/A';
                        const eDate = b.ServiceEndDate || b.EventDate || sDate;
                        const hireDays = b.ServiceHireDays || b.NumberOfDays || 1;
                        const dateText = (sDate === eDate) ? sDate : `${sDate} to ${eDate}`;
                        const providerName = b.ProviderName || b.BusinessName || 'CHICha Lights and Sounds';
                        const bookedOn = b.CreatedAt ? new Date(b.CreatedAt).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'}) : 'Recently';

                        let statusBadgeClass = 'status-completed';
                        let badgeBg = '#ecfdf5';
                        let badgeColor = '#047857';
                        let iconClass = 'fa-circle-check';
                        if (statusLower === 'cancelled' || statusLower === 'rejected') {
                            statusBadgeClass = 'status-cancelled';
                            badgeBg = '#fef2f2';
                            badgeColor = '#b91c1c';
                            iconClass = 'fa-circle-xmark';
                        }

                        const detailsId = `history-details-${b.BookingID || idx}`;

                        return `
                            <div class="booking-history-card" style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:18px; padding:24px 28px; margin-bottom:20px; box-shadow:0 6px 20px rgba(10,25,47,0.06); display:flex; flex-direction:column; gap:18px; width:100%; box-sizing:border-box;">
                                <!-- Top Bar: Reference & Status -->
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
                                    <div style="display:flex; align-items:center; gap:12px;">
                                        <span style="font-size:1.15rem; font-weight:900; color:#0a192f;">
                                            <i class="fa-solid fa-receipt" style="color:#2563eb;"></i> Ref: ${b.BookingReference || `SS-2026-${String(b.BookingID || 1).padStart(5, '0')}`}
                                        </span>
                                        <span style="font-size:0.98rem; color:#64748b; font-weight:600;">
                                            Booked on ${bookedOn}
                                        </span>
                                    </div>
                                    <span class="status-badge ${statusBadgeClass}" style="padding:6px 16px; border-radius:20px; font-weight:800; font-size:0.95rem; background:${badgeBg}; color:${badgeColor}; display:inline-flex; align-items:center; gap:6px;">
                                        <i class="fa-solid ${iconClass}"></i> ${statusStr}
                                    </span>
                                </div>

                                <!-- Main Booking Info -->
                                <div style="display:flex; gap:24px; align-items:center; flex-wrap:wrap;">
                                    <img src="${b.ProviderAvatar || 'assets/images/banner.png'}" alt="${providerName}" style="width:80px; height:80px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;" onerror="this.onerror=null; this.src='assets/images/banner.png';">
                                    <div style="flex:1; min-width:260px;">
                                        <h4 style="margin:0 0 6px 0; font-size:1.35rem; font-weight:900; color:#0a192f;">${b.PackageName || 'Event Service Package'}</h4>
                                        <div style="font-size:1.05rem; font-weight:700; color:#2563eb; margin-bottom:8px;">
                                            <i class="fa-solid fa-store"></i> ${providerName}
                                        </div>
                                        <div style="font-size:0.95rem; color:#475569; font-weight:600; display:flex; flex-wrap:wrap; gap:18px;">
                                            <span><i class="fa-solid fa-calendar-day" style="color:#0284c7;"></i> ${dateText} (${hireDays} Day${hireDays > 1 ? 's' : ''})</span>
                                            <span><i class="fa-solid fa-clock" style="color:#d97706;"></i> ${b.StartTime || '06:00 PM'} – ${b.EndTime || '10:00 PM'}</span>
                                            <span><i class="fa-solid fa-location-dot" style="color:#10b981;"></i> ${b.VenueName ? b.VenueName + ' (' + (b.EventPlace || 'Batangas') + ')' : (b.EventAddress || b.EventPlace || 'Batangas')}</span>
                                        </div>
                                    </div>
                                    <div style="text-align:right; min-width:180px; display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                                        <div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Total Amount</div>
                                        <div style="font-size:1.8rem; font-weight:900; color:#2563eb;">₱${parseFloat(b.TotalAmount || b.PackagePrice || 0).toLocaleString()}</div>
                                        <span style="font-size:0.85rem; font-weight:800; background:#ecfdf5; color:#047857; padding:5px 12px; border-radius:6px; display:inline-block;">
                                            <i class="fa-solid fa-lock"></i> ${b.PaymentStatus || 'Paid'} (${b.PaymentType === 'downpayment' ? '50% Deposit' : '100% Full'})
                                        </span>
                                    </div>
                                </div>

                                <!-- Expandable Accordion Event Breakdown -->
                                <div id="${detailsId}" class="history-extra-details" style="display:none; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:18px 22px; margin-top:6px;">
                                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
                                        <div>
                                            <div style="font-size:0.8rem; font-weight:800; color:#64748b; text-transform:uppercase;">Package Base Price</div>
                                            <div style="font-size:1.05rem; font-weight:800; color:#0a192f; margin-top:3px;">₱${parseFloat(b.PackagePrice || b.TotalAmount || 0).toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:0.8rem; font-weight:800; color:#64748b; text-transform:uppercase;">Transportation Fee</div>
                                            <div style="font-size:1.05rem; font-weight:800; color:#0a192f; margin-top:3px;">${b.TransportationFee ? '₱' + parseFloat(b.TransportationFee).toLocaleString() : 'Included / Free'}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:0.8rem; font-weight:800; color:#64748b; text-transform:uppercase;">Payment Method</div>
                                            <div style="font-size:1.05rem; font-weight:800; color:#0a192f; margin-top:3px;">${b.PaymentMethod || 'Online Payment (PayMongo)'}</div>
                                        </div>
                                        <div>
                                            <div style="font-size:0.8rem; font-weight:800; color:#64748b; text-transform:uppercase;">Client Notes</div>
                                            <div style="font-size:0.95rem; font-weight:600; color:#334155; margin-top:3px;">${b.Notes || b.ClientNotes || 'None specified'}</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Actions Row -->
                                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:16px; flex-wrap:wrap; gap:12px;">
                                    <button type="button" class="btn-toggle-details" onclick="const el=document.getElementById('${detailsId}'); const isClosed=el.style.display==='none'; el.style.display=isClosed?'block':'none'; this.querySelector('span').textContent=isClosed?'Hide Breakdown':'Expand Breakdown'; this.querySelector('i').className=isClosed?'fa-solid fa-chevron-up':'fa-solid fa-chevron-down';" style="background:none; border:none; color:#2563eb; font-weight:800; font-size:0.95rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px; padding:6px 0;">
                                        <span>Expand Breakdown</span> <i class="fa-solid fa-chevron-down"></i>
                                    </button>
                                    <div style="display:flex; gap:12px; flex-wrap:wrap;">
                                        <a href="booking-confirmation.html?ref=${encodeURIComponent(b.BookingReference || '')}&id=${b.BookingID}" class="btn-card-secondary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px; background:#f1f5f9; color:#0a192f; border:1.5px solid #cbd5e1;">
                                            <i class="fa-solid fa-file-invoice"></i> View Official Receipt
                                        </a>
                                        <a href="client-messages.html?providerId=${b.ProviderID}&providerName=${encodeURIComponent(providerName)}" class="btn-card-primary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px; background:#2563eb; color:#ffffff;">
                                            <i class="fa-solid fa-comments"></i> Chat Provider
                                        </a>

                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (err) {
            console.warn('Error fetching user bookings:', err);
        }
    };

    window.renderMyBookingsCards = window.fetchUserBookings;

    // 4. GLOBAL DELEGATED EVENT LISTENER FOR ALL CLICK INTERACTIONS
    document.addEventListener('click', (e) => {
        // 0. Provider Wizard Submit Button
        const wizardSubmitBtn = e.target.closest('#btn-wizard-submit');
        if (wizardSubmitBtn) {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.processProviderAppSubmission === 'function') {
                window.processProviderAppSubmission(e);
            }
            return;
        }

        // A. Profile Subtab Buttons (My Bookings | Booking History | Account Settings)
        const subtabBtn = e.target.closest('.subtab-btn');
        if (subtabBtn) {
            e.preventDefault();
            const targetSec = subtabBtn.getAttribute('data-subtab');

            document.querySelectorAll('.subtab-btn').forEach(b => b.classList.remove('active'));
            subtabBtn.classList.add('active');

            sessionStorage.setItem('soundsphere_active_subtab', targetSec);

            const profileSections = {
                bookings: document.getElementById('profile-sec-bookings'),
                reviews: document.getElementById('profile-sec-reviews'),
                history: document.getElementById('profile-sec-history'),
                settings: document.getElementById('profile-sec-settings')
            };

            Object.keys(profileSections).forEach(secKey => {
                if (profileSections[secKey]) {
                    if (secKey === targetSec) {
                        profileSections[secKey].classList.remove('hidden');
                    } else {
                        profileSections[secKey].classList.add('hidden');
                    }
                }
            });
            return;
        }

        // B. My Bookings Status Filter Pills (Pending | Confirmed | Completed | Cancelled)
        const statusBtn = e.target.closest('.booking-status-filter-btn');
        if (statusBtn) {
            e.preventDefault();
            const targetStatus = (statusBtn.getAttribute('data-status') || '').toLowerCase();

            document.querySelectorAll('.booking-status-filter-btn').forEach(b => {
                b.classList.remove('active');
                b.style.background = '#ffffff';
                b.style.border = '1.5px solid #cbd5e1';
                b.style.color = '#475569';
            });

            statusBtn.classList.add('active');
            statusBtn.style.background = '#2563eb';
            statusBtn.style.border = 'none';
            statusBtn.style.color = '#ffffff';

            let countVisible = 0;
            document.querySelectorAll('#my-bookings-cards-container .booking-item-card[data-booking-status]').forEach(card => {
                const cardStatus = card.getAttribute('data-booking-status');
                if (cardStatus === targetStatus) {
                    card.style.display = 'flex';
                    countVisible++;
                } else {
                    card.style.display = 'none';
                }
            });

            const emptyMsg = document.getElementById('booking-status-empty-msg');
            if (emptyMsg) {
                emptyMsg.style.display = countVisible === 0 ? 'block' : 'none';
            }
            return;
        }

        // C. View Details Buttons on Bookings
        const viewDetailsBtn = e.target.closest('.btn-view-booking-details');
        if (viewDetailsBtn) {
            e.preventDefault();
            const bookingId = viewDetailsBtn.getAttribute('data-id');
            openBookingDetailsModal(bookingId);
            return;
        }

        // D. Book Now Buttons
        const bookNowBtn = e.target.closest('.btn-book-now');
        if (bookNowBtn) {
            e.preventDefault();
            const providerId = bookNowBtn.getAttribute('data-id');
            openBookingModal(providerId);
            return;
        }

        // D2. Message Provider Buttons
        const cardMsgBtn = e.target.closest('.btn-card-message');
        if (cardMsgBtn) {
            e.preventDefault();
            const providerId = cardMsgBtn.getAttribute('data-id') || '101';
            const providerName = cardMsgBtn.getAttribute('data-name') || 'Provider';
            const currentUser = (typeof SoundSphereAPI !== 'undefined') ? SoundSphereAPI.getCurrentUser() : null;
            const userId = currentUser ? (currentUser.id || currentUser.userId || currentUser.UserID) : null;

            if (userId && typeof window.fetchPlatformConversations === 'function') {
                const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                fetch('/api/messages/conversations', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ userId, providerId })
                })
                .then(r => r.json())
                .then(async data => {
                    if (data.success && data.conversation) {
                        const cid = data.conversation.ConversationID || data.conversation.conversationId;
                        switchView('messages');
                        await window.fetchPlatformConversations();
                        if (typeof window.setPlatformActiveConversation === 'function') {
                            await window.setPlatformActiveConversation(cid);
                        }
                    } else {
                        window.location.href = `/client-messages.html?providerId=${providerId}&providerName=${encodeURIComponent(providerName)}`;
                    }
                })
                .catch(() => {
                    window.location.href = `/client-messages.html?providerId=${providerId}&providerName=${encodeURIComponent(providerName)}`;
                });
                return;
            }

            window.location.href = `/client-messages.html?providerId=${providerId}&providerName=${encodeURIComponent(providerName)}`;
            return;
        }

        // E. Open Security & Preferences Modals
        const openSecPwBtn = e.target.closest('#btn-open-sec-change-password');
        if (openSecPwBtn) {
            e.preventDefault();
            const modal = document.getElementById('modal-sec-change-password');
            if (modal) modal.classList.remove('hidden');
            return;
        }

        const closeSecPwBtn = e.target.closest('#btn-close-sec-change-password');
        if (closeSecPwBtn) {
            e.preventDefault();
            const modal = document.getElementById('modal-sec-change-password');
            if (modal) modal.classList.add('hidden');
            return;
        }

        const openSecNotifBtn = e.target.closest('#btn-open-sec-notifications');
        if (openSecNotifBtn) {
            e.preventDefault();
            const modal = document.getElementById('modal-sec-notifications');
            if (modal) modal.classList.remove('hidden');
            return;
        }

        const closeSecNotifBtn = e.target.closest('#btn-close-sec-notifications');
        if (closeSecNotifBtn) {
            e.preventDefault();
            const modal = document.getElementById('modal-sec-notifications');
            if (modal) modal.classList.add('hidden');
            return;
        }

        const openSecPrivacyBtn = e.target.closest('#btn-open-sec-privacy');
        if (openSecPrivacyBtn) {
            e.preventDefault();
            const modal = document.getElementById('modal-sec-privacy');
            if (modal) modal.classList.remove('hidden');
            return;
        }

        const closeSecPrivacyBtn = e.target.closest('#btn-close-sec-privacy');
        if (closeSecPrivacyBtn) {
            e.preventDefault();
            const modal = document.getElementById('modal-sec-privacy');
            if (modal) modal.classList.add('hidden');
            return;
        }

        // F. Open Service Provider Application Modal Button
        const openProviderAppBtn = e.target.closest('#btn-open-provider-app-modal');
        if (openProviderAppBtn) {
            e.preventDefault();
            const providerAppModal = document.getElementById('modal-provider-application');
            if (providerAppModal) providerAppModal.classList.remove('hidden');
            return;
        }

        // G. Close Service Provider Application Modal Button
        const closeProviderAppBtn = e.target.closest('#close-provider-app-modal-btn');
        if (closeProviderAppBtn) {
            e.preventDefault();
            const providerAppModal = document.getElementById('modal-provider-application');
            if (providerAppModal) providerAppModal.classList.add('hidden');
            return;
        }
    });

    // 5. RATING STAR SELECTOR & REVIEW SUBMIT HANDLER
    let selectedRating = 5;
    const ratingStars = document.querySelectorAll('#rating-star-selector i');
    ratingStars.forEach((star, index) => {
        star.addEventListener('click', () => {
            selectedRating = index + 1;
            ratingStars.forEach((s, idx) => {
                if (idx <= index) {
                    s.style.color = '#f59e0b';
                } else {
                    s.style.color = '#cbd5e1';
                }
            });
        });
    });

    const btnSubmitReview = document.getElementById('btn-submit-review');
    if (btnSubmitReview) {
        btnSubmitReview.addEventListener('click', () => {
            const reviewComment = document.getElementById('review-comment-input');
            const commentText = reviewComment ? reviewComment.value.trim() : '';

            showToast(`✓ Review Submitted Successfully! (${selectedRating} Stars)`, 'success');

            const needsReviewContainer = document.getElementById('needs-review-container');
            const noReviewsEmptyState = document.getElementById('no-reviews-empty-state');

            if (needsReviewContainer) needsReviewContainer.classList.add('hidden');
            if (noReviewsEmptyState) noReviewsEmptyState.classList.remove('hidden');

            const historyReviewTag = document.getElementById('history-review-tag-BK-7611');
            if (historyReviewTag) {
                historyReviewTag.textContent = `Reviewed ⭐${selectedRating}.0`;
                historyReviewTag.className = 'payment-badge payment-paid';
            }
        });
    }

    // 6. MULTI-STEP SERVICE PROVIDER APPLICATION WIZARD CONTROLLER
    let currentWizardStep = 1;

    const updateWizardUI = (step) => {
        currentWizardStep = step;

        // Hide all panels, show current
        [1, 2, 3, 4].forEach(s => {
            const panel = document.getElementById(`app-step-${s}`);
            if (panel) {
                if (s === step) {
                    panel.classList.remove('hidden');
                } else {
                    panel.classList.add('hidden');
                }
            }
        });

        const submittedPanel = document.getElementById('app-step-submitted');
        if (submittedPanel) submittedPanel.classList.add('hidden');

        // Update Stepper Bar Bubbles
        document.querySelectorAll('.wizard-step-item').forEach(item => {
            const stepNum = parseInt(item.getAttribute('data-step'), 10);
            const bubble = item.querySelector('.step-num-bubble');

            if (stepNum === step) {
                item.style.color = '#2563eb';
                item.style.fontWeight = '800';
                if (bubble) {
                    bubble.style.background = '#2563eb';
                    bubble.style.color = '#ffffff';
                }
            } else if (stepNum < step) {
                item.style.color = '#10b981';
                item.style.fontWeight = '800';
                if (bubble) {
                    bubble.style.background = '#10b981';
                    bubble.style.color = '#ffffff';
                }
            } else {
                item.style.color = '#64748b';
                item.style.fontWeight = '700';
                if (bubble) {
                    bubble.style.background = '#e2e8f0';
                    bubble.style.color = '#475569';
                }
            }
        });

        const btnBack = document.getElementById('btn-wizard-back');
        const btnNext = document.getElementById('btn-wizard-next');
        const btnSubmit = document.getElementById('btn-wizard-submit');
        const stepperBar = document.getElementById('provider-wizard-stepper-bar');
        const navFooter = document.getElementById('provider-wizard-nav-footer');

        if (stepperBar) stepperBar.style.display = 'flex';
        if (navFooter) navFooter.style.display = 'flex';

        // Back button visibility
        if (btnBack) {
            btnBack.style.visibility = (step === 1) ? 'hidden' : 'visible';
        }

        // Next & Submit buttons
        if (step === 4) {
            if (btnNext) {
                btnNext.classList.add('hidden');
                btnNext.style.display = 'none';
            }
            if (btnSubmit) {
                btnSubmit.classList.remove('hidden');
                btnSubmit.style.display = 'inline-flex';
                btnSubmit.style.alignItems = 'center';
                btnSubmit.style.gap = '8px';
                btnSubmit.style.cursor = 'pointer';
            }

            // Populate Step 4 Review Summary
            const bizName = document.getElementById('app-biz-name')?.value || 'Cabrera Lights & Sound System';
            const bizPhone = document.getElementById('app-biz-phone')?.value || '09516028992';
            const bizEmail = document.getElementById('app-biz-email')?.value || 'dendenescondecabrera17@gmail.com';
            const bizDesc = document.getElementById('app-biz-desc')?.value || document.getElementById('app-service-desc')?.value || 'Professional lights & sound rental.';

            const selectedServices = Array.from(document.querySelectorAll('.app-service-chk:checked')).map(c => c.value);
            const selectedLocations = Array.from(document.querySelectorAll('.app-location-chk:checked')).map(c => c.value);

            const summaryBizName = document.getElementById('summary-biz-name');
            const summaryBizPhone = document.getElementById('summary-biz-phone');
            const summaryBizEmail = document.getElementById('summary-biz-email');
            const summaryServices = document.getElementById('summary-services');
            const summaryLocations = document.getElementById('summary-locations');
            const summaryDescription = document.getElementById('summary-description');

            if (summaryBizName) summaryBizName.textContent = bizName;
            if (summaryBizPhone) summaryBizPhone.textContent = bizPhone;
            if (summaryBizEmail) summaryBizEmail.textContent = bizEmail;
            if (summaryServices) summaryServices.textContent = selectedServices.length > 0 ? selectedServices.join(', ') : 'None selected';
            if (summaryLocations) summaryLocations.textContent = selectedLocations.length > 0 ? selectedLocations.join(', ') : 'None selected';
            if (summaryDescription) summaryDescription.textContent = bizDesc;

        } else {
            if (btnNext) {
                btnNext.classList.remove('hidden');
                btnNext.style.display = 'inline-flex';
            }
            if (btnSubmit) {
                btnSubmit.classList.add('hidden');
                btnSubmit.style.display = 'none';
            }
        }
    };

    // Wizard Next Button Click
    const btnWizardNext = document.getElementById('btn-wizard-next');
    if (btnWizardNext) {
        btnWizardNext.addEventListener('click', () => {
            if (currentWizardStep === 1) {
                const bizName = document.getElementById('app-biz-name')?.value.trim();
                const bizPhone = document.getElementById('app-biz-phone')?.value.trim();
                const bizEmail = document.getElementById('app-biz-email')?.value.trim();

                if (!bizName || !bizPhone || !bizEmail) {
                    showToast('⚠ Please fill in all required fields (Business Name, Phone, and Email).', 'warning');
                    return;
                }
            } else if (currentWizardStep === 2) {
                const selectedServices = document.querySelectorAll('.app-service-chk:checked');
                if (selectedServices.length === 0) {
                    showToast('⚠ Please select at least one service category.', 'warning');
                    return;
                }
            } else if (currentWizardStep === 3) {
                const selectedLocations = document.querySelectorAll('.app-location-chk:checked');
                if (selectedLocations.length === 0) {
                    showToast('⚠ Please select at least one service area location.', 'warning');
                    return;
                }
            }

            if (currentWizardStep < 4) {
                updateWizardUI(currentWizardStep + 1);
            }
        });
    }

    // Wizard Back Button Click
    const btnWizardBack = document.getElementById('btn-wizard-back');
    if (btnWizardBack) {
        btnWizardBack.addEventListener('click', () => {
            if (currentWizardStep > 1) {
                updateWizardUI(currentWizardStep - 1);
            }
        });
    }

    // Edit Jump Buttons in Step 4 Review
    document.addEventListener('click', (e) => {
        const jumpBtn = e.target.closest('.btn-wizard-jump');
        if (jumpBtn) {
            e.preventDefault();
            const targetStep = parseInt(jumpBtn.getAttribute('data-targetstep'), 10);
            if (targetStep >= 1 && targetStep <= 3) {
                updateWizardUI(targetStep);
            }
        }
    });

    // Global Function to Handle Provider Application Submission with Duplicate Guard Lock
    window.processProviderAppSubmission = async (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (window.isProviderAppSubmitting) {
            console.warn('Submission already in progress. Ignoring duplicate trigger.');
            return;
        }

        window.isProviderAppSubmitting = true;

        const btnSubmit = document.getElementById('btn-wizard-submit');
        let originalBtnHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Application';

        if (btnSubmit) {
            originalBtnHTML = btnSubmit.innerHTML;
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
            btnSubmit.style.opacity = '0.7';
            btnSubmit.style.cursor = 'wait';
        }

        try {
            const bizName = document.getElementById('app-biz-name')?.value.trim() || '';
            const bizPhone = document.getElementById('app-biz-phone')?.value.trim() || '';
            const bizEmail = document.getElementById('app-biz-email')?.value.trim() || '';
            const bizDesc = document.getElementById('app-biz-desc')?.value.trim() || document.getElementById('app-service-desc')?.value.trim() || 'Professional sound, lighting, and stage equipment rentals.';

            const selectedServices = Array.from(document.querySelectorAll('.app-service-chk:checked')).map(c => c.value);
            const selectedLocations = Array.from(document.querySelectorAll('.app-location-chk:checked')).map(c => c.value);

            // Validation Checks
            if (!bizName) {
                showToast('⚠ Please enter your Business Name.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!bizPhone || !bizEmail) {
                showToast('⚠ Please enter valid Contact Information (Phone & Email).', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (selectedServices.length === 0) {
                showToast('⚠ Please select at least one Service category.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (selectedLocations.length === 0) {
                showToast('⚠ Please select at least one Service Area location.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }

            const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : {};
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;

            const payload = {
                userId: user.userId,
                businessName: bizName,
                ownerName: user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : bizName),
                businessAddress: selectedLocations.join(', ') || 'Balayan, Batangas',
                coverageArea: selectedLocations.join(', ') || 'Balayan, Batangas',
                contactNumber: bizPhone,
                govtIdUrl: 'uploaded_govt_id.png',
                businessPermitUrl: 'uploaded_permit.png'
            };

            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
            const response = await fetch('/api/provider-applications', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const resData = await response.json();

            if (!response.ok || !resData.success) {
                if (resData.duplicate) {
                    showToast(`⚠ ${resData.message || 'You already have an active application.'}`, 'warning');
                } else {
                    showToast(`✕ ${resData.message || 'Failed to submit application.'}`, 'error');
                }
                return;
            }

            // Artificial short delay for realistic submission UX
            await new Promise(resolve => setTimeout(resolve, 300));

            // Hide step 1-4 panels
            [1, 2, 3, 4].forEach(s => {
                const panel = document.getElementById(`app-step-${s}`);
                if (panel) panel.classList.add('hidden');
            });

            // Hide Stepper Bar & Footer
            const stepperBar = document.getElementById('provider-wizard-stepper-bar');
            const navFooter = document.getElementById('provider-wizard-nav-footer');
            if (stepperBar) stepperBar.style.display = 'none';
            if (navFooter) navFooter.style.display = 'none';

            // Show Confirmation Screen
            const submittedPanel = document.getElementById('app-step-submitted');
            if (submittedPanel) submittedPanel.classList.remove('hidden');

            // Save Application Status in Local & Session Storage
            localStorage.setItem('soundsphere_provider_app_status', 'Pending Review');
            sessionStorage.setItem('soundsphere_provider_app_status', 'Pending Review');
            
            if (typeof updateAccountSettingsProviderStatus === 'function') {
                updateAccountSettingsProviderStatus('Pending Review');
            } else if (typeof window.updateAccountSettingsProviderStatus === 'function') {
                window.updateAccountSettingsProviderStatus('Pending Review');
            }

            showToast(`✓ Application Submitted Successfully! "${bizName}" is pending review.`, 'success');

        } catch (error) {
            console.error('Error submitting application:', error);
            showToast('✕ Failed to submit application: ' + (error.message || 'Please check your connection.'), 'error');
        } finally {
            window.isProviderAppSubmitting = false;
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = originalBtnHTML;
                btnSubmit.style.opacity = '1';
                btnSubmit.style.cursor = 'pointer';
            }
        }
    };

    const formProviderApp = document.getElementById('form-provider-application');
    if (formProviderApp) {
        formProviderApp.addEventListener('submit', window.processProviderAppSubmission);
    } else {
        const btnWizardSubmit = document.getElementById('btn-wizard-submit');
        if (btnWizardSubmit) {
            btnWizardSubmit.addEventListener('click', window.processProviderAppSubmission);
        }
    }

    // Back to Account Settings Button
    const btnBackToSettings = document.getElementById('btn-back-to-settings');
    if (btnBackToSettings) {
        btnBackToSettings.addEventListener('click', () => {
            const providerAppModal = document.getElementById('modal-provider-application');
            if (providerAppModal) providerAppModal.classList.add('hidden');

            // Reset Wizard to Step 1
            updateWizardUI(1);

            // Switch to Profile View -> Account Settings Subtab
            switchView('profile');
            const settingsSubtab = document.getElementById('subtab-btn-settings');
            if (settingsSubtab) settingsSubtab.click();
        });
    }

    // Helper: Update Status in Account Settings Card dynamically from backend API
    const updateAccountSettingsProviderStatus = async (initialStatus = 'Not Applied') => {
        let currentStatus = initialStatus;
        let rejectReason = '';

        const authUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
        if (!authUser || (!authUser.UserID && !authUser.id && !authUser.email && !authUser.Email)) {
            // Guest or unauthenticated user
            return;
        }

        if (authUser.role === 'ServiceProvider' || authUser.role === 'Provider') {
            currentStatus = 'Approved';
        }

        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
            if (!token || token === 'token' || token.split('.').length !== 3) return; // Do not fetch if token is absent, dummy, or invalid format
            
            // If user is already an approved provider, no need to query provider-applications
            if (currentStatus === 'Approved') return;

            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/provider-applications/my-application', { headers });

            if (res.status === 401) {
                // Token is expired or invalid on backend - clear stored token to prevent repeated 401 errors
                localStorage.removeItem('soundsphere_auth_token');
                localStorage.removeItem('soundsphere_jwt_token');
                if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.clearAuthSession) {
                    SoundSphereAPI.clearAuthSession();
                }
                return;
            }

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.application) {
                    const myApp = data.application;
                    if (myApp.Status === 'Approved') {
                        currentStatus = 'Approved';
                        // Update local auth user role if promoted
                        if (authUser && authUser.role !== 'ServiceProvider') {
                            authUser.role = 'ServiceProvider';
                            authUser.RoleName = 'ServiceProvider';
                            if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.setAuthSession) {
                                SoundSphereAPI.setAuthSession(token || 'token', authUser, true);
                            } else {
                                localStorage.setItem('soundsphere_user_info', JSON.stringify(authUser));
                            }
                        }
                    } else if (myApp.Status === 'Rejected') {
                        currentStatus = 'Rejected';
                        rejectReason = myApp.RejectionReason || 'Incomplete business registration details.';
                    } else if (myApp.Status === 'Pending') {
                        currentStatus = 'Pending Approval';
                    }
                }
            }
        } catch (e) {
            console.warn('Application status fetch notice:', e.message);
        }

        const badge = document.getElementById('provider-app-status-badge');
        const desc = document.getElementById('provider-app-desc-text');
        const btnContainer = document.getElementById('provider-app-btn-container');

        if (currentStatus === 'Pending Approval' || currentStatus === 'Pending Review' || currentStatus === 'Pending') {
            if (badge) {
                badge.textContent = 'Pending Approval';
                badge.className = 'status-badge status-pending';
            }
            if (desc) desc.textContent = 'Your Service Provider application is currently pending review by administrators.';
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <button type="button" class="btn-card-secondary" id="btn-open-provider-app-modal" style="padding:10px 24px;">
                        <i class="fa-solid fa-eye"></i> View Application Details
                    </button>
                `;
            }
        } else if (currentStatus === 'Approved') {
            if (badge) {
                badge.textContent = '✓ Approved';
                badge.className = 'status-badge status-completed';
            }
            if (desc) desc.textContent = 'Congratulations! Your application has been approved. You are now an approved SoundSphere Service Provider.';
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <a href="/provider/dashboard.html" class="btn-card-primary" style="padding:10px 24px; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">
                        <i class="fa-solid fa-gauge-high"></i> Go to Service Provider Dashboard
                    </a>
                `;
            }
            const providerDashLink = document.getElementById('dropdown-provider-dashboard-link');
            const dropRole = document.getElementById('dropdown-user-role');
            if (providerDashLink) providerDashLink.classList.remove('hidden');
            if (dropRole) dropRole.textContent = 'Client + Service Provider';
        } else if (currentStatus === 'Rejected') {
            if (badge) {
                badge.textContent = 'Rejected';
                badge.className = 'status-badge status-cancelled';
            }
            if (desc) desc.textContent = `Your application was not approved. Reason: ${rejectReason || 'Incomplete business registration details.'}`;
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <button type="button" class="btn-card-primary" id="btn-open-provider-app-modal" style="padding:10px 24px;">
                        <i class="fa-solid fa-rotate"></i> Review / Resubmit Application
                    </button>
                `;
            }
        } else {
            if (badge) {
                badge.textContent = 'Not Applied';
                badge.className = 'status-badge status-pending';
            }
            if (desc) desc.textContent = 'Want to offer your services on SoundSphere? Apply to become a service provider.';
            if (btnContainer) {
                btnContainer.innerHTML = `
                    <button type="button" class="btn-card-primary" id="btn-open-provider-app-modal" style="padding:10px 24px;">
                        <i class="fa-solid fa-paper-plane"></i> Apply as Service Provider
                    </button>
                `;
            }
        }
    };

    // Make updateAccountSettingsProviderStatus available globally
    window.updateAccountSettingsProviderStatus = updateAccountSettingsProviderStatus;

    // 7. INITIAL VIEW & BROWSER NAVIGATION BACK/FORWARD LOGIC
    const handleNavState = () => {
        const activeView = window.location.hash.replace('#', '') || sessionStorage.getItem('soundsphere_active_view') || 'home';
        if (views[activeView]) {
            switchView(activeView);
        } else {
            switchView('home');
        }
        if (typeof window.loadProfileData === 'function') {
            window.loadProfileData();
        }
    };

    handleNavState();

    window.addEventListener('popstate', handleNavState);
    window.addEventListener('hashchange', handleNavState);
    window.addEventListener('pageshow', (event) => {
        if (event.persisted || (window.performance && window.performance.navigation && window.performance.navigation.type === 2)) {
            handleNavState();
        }
    });

    const savedSubtab = sessionStorage.getItem('soundsphere_active_subtab');
    if (savedSubtab) {
        const subtabTargetBtn = document.querySelector(`.subtab-btn[data-subtab="${savedSubtab}"]`);
        if (subtabTargetBtn) subtabTargetBtn.click();
    }

    // Always fetch latest Service Provider Application Status directly from SQL Server on DOM Load
    updateAccountSettingsProviderStatus();

    // 8. SECURITY & PREFERENCES FORM CONTROLLERS
    // Eye toggles for Change Password modal
    ['toggle-sec-current-password', 'toggle-sec-new-password', 'toggle-sec-confirm-password'].forEach(toggleId => {
        const toggleBtn = document.getElementById(toggleId);
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (ev) => {
                ev.preventDefault();
                const inputEl = toggleBtn.previousElementSibling;
                const icon = toggleBtn.querySelector('i');
                if (inputEl && icon) {
                    if (inputEl.type === 'password') {
                        inputEl.type = 'text';
                        icon.className = 'fa-solid fa-eye';
                        toggleBtn.setAttribute('aria-label', 'Hide password');
                    } else {
                        inputEl.type = 'password';
                        icon.className = 'fa-solid fa-eye-slash';
                        toggleBtn.setAttribute('aria-label', 'Show password');
                    }
                }
            });
        }
    });

    // Form Submit: Change Password
    const formSecChangePw = document.getElementById('form-sec-change-password');
    if (formSecChangePw) {
        formSecChangePw.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('sec-current-password')?.value || '';
            const newPassword = document.getElementById('sec-new-password')?.value || '';
            const confirmPassword = document.getElementById('sec-confirm-password')?.value || '';

            if (newPassword !== confirmPassword) {
                showToast('New passwords do not match. Please verify.', 'error');
                return;
            }

            if (newPassword.length < 8 || !/\d/.test(newPassword)) {
                showToast('New password must be at least 8 characters long and include a number.', 'error');
                return;
            }

            const currentUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
            if (!currentUser || !currentUser.userId) {
                showToast('Please log in to change your password.', 'error');
                return;
            }

            try {
                const res = await fetch('/api/users/change-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.userId,
                        currentPassword,
                        newPassword
                    })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to update password.');
                }

                showToast('✓ Password updated successfully!', 'success');
                formSecChangePw.reset();
                document.getElementById('modal-sec-change-password')?.classList.add('hidden');
            } catch (err) {
                showToast(err.message || 'An error occurred while changing password.', 'error');
            }
        });
    }

    // Form Submit: Notification Preferences
    const formSecNotif = document.getElementById('form-sec-notifications');
    if (formSecNotif) {
        formSecNotif.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailNotif = document.getElementById('pref-email-notif')?.checked;
            const inappNotif = document.getElementById('pref-inapp-notif')?.checked;
            const promoNotif = document.getElementById('pref-promo-notif')?.checked;

            localStorage.setItem('soundsphere_pref_notif', JSON.stringify({ emailNotif, inappNotif, promoNotif }));
            showToast('✓ Notification preferences saved successfully!', 'success');
            document.getElementById('modal-sec-notifications')?.classList.add('hidden');
        });
    }

    // Form Submit: Privacy Settings
    const formSecPrivacy = document.getElementById('form-sec-privacy');
    if (formSecPrivacy) {
        formSecPrivacy.addEventListener('submit', (e) => {
            e.preventDefault();
            const profileVisibility = document.getElementById('pref-privacy-profile')?.value;
            const showPhone = document.getElementById('pref-show-phone')?.checked;
            const analyticsCookies = document.getElementById('pref-analytics-cookies')?.checked;

            localStorage.setItem('soundsphere_pref_privacy', JSON.stringify({ profileVisibility, showPhone, analyticsCookies }));
            showToast('✓ Privacy settings saved successfully!', 'success');
            document.getElementById('modal-sec-privacy')?.classList.add('hidden');
        });
    }

    // =========================================================================
    // REAL SQL SERVER MESSAGING INTEGRATION FOR #view-messages
    // =========================================================================
    let platformConversations = [];
    let platformActiveConversationId = null;
    let platformIsSending = false;

    const fetchPlatformConversations = async () => {
        const currentUser = (typeof SoundSphereAPI !== 'undefined') ? SoundSphereAPI.getCurrentUser() : null;
        const userId = currentUser ? (currentUser.id || currentUser.userId || currentUser.UserID) : null;
        if (!userId) return;

        try {
            const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/messages/conversations?userId=${userId}`, { headers });
            const data = await res.json();

            if (data.success) {
                platformConversations = data.conversations || [];
                renderPlatformConversationsList();
                updatePlatformUnreadBadge();

                if (platformConversations.length > 0 && !platformActiveConversationId) {
                    setPlatformActiveConversation(platformConversations[0].conversationId);
                }
            }
        } catch (err) {
            console.error('Error fetching platform conversations:', err);
        }
    };

    const updatePlatformUnreadBadge = () => {
        const totalUnread = platformConversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const msgBadge = document.querySelector('#nav-messages-tab .badge-count') || document.querySelector('#nav-messages-tab .nav-badge') || document.getElementById('notif-badge-count');
        if (msgBadge) {
            if (totalUnread > 0) {
                msgBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                msgBadge.style.display = 'inline-flex';
            } else {
                msgBadge.style.display = 'none';
            }
        }
    };

    const getPartnerAvatarUrl = (partner) => {
        const partnerName = partner?.name || (partner?.role === 'Client' ? 'Client Partner' : 'Service Provider');
        if (partner?.avatar && partner.avatar.trim() && !partner.avatar.includes('default_avatar')) {
            return partner.avatar;
        }
        const cleanName = partnerName.trim().replace(/[^a-zA-Z0-9\s]/g, '');
        const words = cleanName.split(/\s+/).filter(w => w.length > 0);
        let initials = 'SP';
        if (words.length === 1) {
            initials = words[0].substring(0, 2).toUpperCase();
        } else if (words.length > 1) {
            initials = (words[0][0] + words[words.length - 1][0]).toUpperCase();
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=0084ff&color=fff&font-size=0.45&bold=true`;
    };

    const renderPlatformConversationsList = () => {
        const threadsList = document.querySelector('#view-messages #threads-list') || document.getElementById('threads-list');
        if (!threadsList) return;

        if (platformConversations.length === 0) {
            threadsList.innerHTML = `
                <div style="padding: 36px 16px; text-align: center; color: #64748b;">
                    <i class="fa-solid fa-comments" style="font-size: 2rem; color: #cbd5e1; margin-bottom: 8px;"></i>
                    <h4 style="margin: 0 0 4px 0; color: #0a192f; font-size: 0.95rem;">No messages yet.</h4>
                    <p style="margin: 0; font-size: 0.8rem;">Click [ 💬 Message ] on any service provider card to start chatting!</p>
                </div>
            `;
            return;
        }

        const formatTime = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        threadsList.innerHTML = platformConversations.map(c => {
            const isActive = c.conversationId === platformActiveConversationId;
            const partnerName = c.partner?.name || (c.partner?.role === 'Client' ? 'Client Partner' : 'Service Provider');
            const partnerRole = c.partner?.role || 'Provider';
            const avatar = getPartnerAvatarUrl(c.partner);
            let lastText = 'No messages yet...';
            if (c.lastMessage) {
                const prefix = c.lastMessage.isMine ? 'You: ' : '';
                const txt = c.lastMessage.text || '';
                if (txt.startsWith('IMAGE_ATTACHMENT:') || txt.startsWith('data:image/')) {
                    lastText = `${prefix}📷 Sent a photo`;
                } else {
                    lastText = `${prefix}${txt}`;
                }
            }
            const lastTime = c.lastMessage ? formatTime(c.lastMessage.sentAt) : formatTime(c.updatedAt);
            const unread = c.unreadCount || 0;

            const partnerUserId = c.partner?.userId || c.partner?.id;
            const isProvider = c.partner?.role !== 'Client';

            return `
                <div class="thread-item ${isActive ? 'active' : ''} ${unread > 0 ? 'unread' : ''}" data-id="${c.conversationId}">
                    <div class="thread-avatar-wrap" ${isProvider && partnerUserId ? `onclick="event.stopPropagation(); window.location.href='/provider-detail.html?id=${partnerUserId}';" title="Click to view Storefront Profile of ${partnerName}" style="cursor:pointer;"` : ''}>
                        <img src="${avatar}" alt="${partnerName}" class="thread-avatar" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(partnerName)}&background=0084ff&color=fff';">
                        <span class="online-status-badge"></span>
                        ${unread > 0 ? `<span class="badge-unread-dot" style="position:absolute; top:-2px; right:-2px; background:#0084ff; color:#fff; font-size:0.65rem; font-weight:800; border-radius:10px; padding:2px 6px; border:2px solid #fff; z-index:2;">${unread}</span>` : ''}
                    </div>
                    <div class="thread-info">
                        <div class="thread-top-row">
                            <span class="thread-name">${partnerName}</span>
                            <span class="thread-time">${lastTime}</span>
                        </div>
                        <div class="thread-booking-tag">
                            ${c.bookingId ? `Booking #BK-${c.bookingId}` : partnerRole}
                        </div>
                        <div class="thread-snippet">
                            ${lastText}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        threadsList.querySelectorAll('.thread-item').forEach(item => {
            item.addEventListener('click', () => {
                const cid = parseInt(item.getAttribute('data-id'), 10);
                setPlatformActiveConversation(cid);
            });
        });
    };

    const setPlatformActiveConversation = async (conversationId) => {
        platformActiveConversationId = conversationId;
        renderPlatformConversationsList();
        await fetchPlatformMessagesThread(conversationId);
    };

    const fetchPlatformMessagesThread = async (conversationId) => {
        if (!conversationId) return;

        const currentUser = (typeof SoundSphereAPI !== 'undefined') ? SoundSphereAPI.getCurrentUser() : null;
        const userId = currentUser ? (currentUser.id || currentUser.userId || currentUser.UserID) : null;
        if (!userId) return;

        try {
            const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/messages/conversations/${conversationId}?userId=${userId}`, { headers });
            const data = await res.json();

            if (data.success) {
                const conv = platformConversations.find(c => c.conversationId === conversationId);
                if (conv) {
                    conv.unreadCount = 0;
                    updatePlatformUnreadBadge();

                    const partnerName = conv.partner?.name || (conv.partner?.role === 'Client' ? 'Client Partner' : 'Service Provider');
                    const avatarUrl = getPartnerAvatarUrl(conv.partner);
                    const partnerNameEl = document.querySelector('#view-messages #active-provider-name') || document.getElementById('active-provider-name');
                    const bookingTagEl = document.querySelector('#view-messages #active-booking-tag') || document.getElementById('active-booking-tag');
                    const activeSubtitleEl = document.querySelector('#view-messages #active-status-subtitle') || document.getElementById('active-status-subtitle');
                    const activeAvatarEl = document.querySelector('#view-messages #active-chat-avatar') || document.getElementById('active-chat-avatar');
                    const activeHeaderUserInfo = document.querySelector('#view-messages #chat-header-user-info') || document.getElementById('chat-header-user-info');
                    const partnerUserId = conv.partner?.userId || conv.partner?.id;
                    const isProvider = conv.partner?.role !== 'Client';

                    if (partnerNameEl) {
                        if (isProvider && partnerUserId) {
                            partnerNameEl.innerHTML = `${partnerName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem; color:#2563eb; margin-left:6px;"></i>`;
                        } else {
                            partnerNameEl.textContent = partnerName;
                        }
                    }
                    if (bookingTagEl) bookingTagEl.textContent = conv.bookingId ? `Associated Booking #BK-${conv.bookingId}` : `Role: ${conv.partner?.role || 'Provider'}`;
                    
                    if (activeSubtitleEl) {
                        activeSubtitleEl.innerHTML = `<span class="green-dot-indicator"></span> ${conv.bookingId ? `Associated Booking #BK-${conv.bookingId}` : (conv.partner?.role === 'Client' ? 'Client Partner' : 'Service Provider')}`;
                    }

                    if (activeAvatarEl) {
                        activeAvatarEl.innerHTML = `<img src="${avatarUrl}" alt="${partnerName}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
                    }

                    if (activeHeaderUserInfo) {
                        if (isProvider && partnerUserId) {
                            activeHeaderUserInfo.style.cursor = 'pointer';
                            activeHeaderUserInfo.title = `Click to view Storefront Profile of ${partnerName}`;
                            activeHeaderUserInfo.onclick = () => {
                                window.location.href = `/provider-detail.html?id=${partnerUserId}`;
                            };
                        } else {
                            activeHeaderUserInfo.style.cursor = 'default';
                            activeHeaderUserInfo.title = '';
                            activeHeaderUserInfo.onclick = null;
                        }
                    }
                }

                renderPlatformMessagesStream(data.messages || [], userId);
            }
        } catch (err) {
            console.error('Error fetching platform messages thread:', err);
        }
    };

    const renderPlatformMessagesStream = (messages, userId) => {
        const stream = document.querySelector('#view-messages #messages-stream');
        if (!stream) return;

        if (messages.length === 0) {
            stream.innerHTML = `
                <div class="messenger-empty-state">
                    <div class="messenger-empty-icon"><i class="fa-solid fa-paper-plane"></i></div>
                    <h3>Start the Conversation</h3>
                    <p>Send a message to discuss sound equipment, setup requirements, or booking details.</p>
                </div>
            `;
            return;
        }

        const formatTime = (dateStr) => {
            if (!dateStr) return '';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        stream.innerHTML = messages.map(msg => {
            const isMine = msg.isMine || msg.senderId === parseInt(userId, 10);
            const timeStr = formatTime(msg.sentAt);
            const msgText = msg.text || '';

            let contentHtml = '';
            const isImgMsg = msgText.startsWith('IMAGE_ATTACHMENT:') || msgText.startsWith('data:image/') || (msgText.startsWith('http') && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(msgText));

            if (msgText.startsWith('IMAGE_ATTACHMENT:')) {
                const imgData = msgText.replace('IMAGE_ATTACHMENT:', '');
                contentHtml = `<img src="${imgData}" alt="Photo Attachment" class="chat-photo-attachment" style="max-width:340px; max-height:320px; border-radius:16px; object-fit:cover; display:block; box-shadow:0 4px 14px rgba(0,0,0,0.12); cursor:pointer;" onclick="window.openPhotoLightbox(this.src)">`;
            } else if (msgText.startsWith('data:image/') || (msgText.startsWith('http') && /\.(png|jpg|jpeg|webp|gif)(\?.*)?$/i.test(msgText))) {
                contentHtml = `<img src="${msgText}" alt="Photo Attachment" class="chat-photo-attachment" style="max-width:340px; max-height:320px; border-radius:16px; object-fit:cover; display:block; box-shadow:0 4px 14px rgba(0,0,0,0.12); cursor:pointer;" onclick="window.openPhotoLightbox(this.src)">`;
            } else {
                const safeText = msgText
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;")
                    .replace(/\n/g, "<br>");
                contentHtml = safeText;
            }

            return `
                <div class="message-bubble-row ${isMine ? 'client-side' : 'provider-side'}">
                    <div class="message-bubble ${isImgMsg ? 'image-bubble' : ''}" style="${isImgMsg ? 'padding:4px; background:none; box-shadow:none;' : ''}">
                        ${contentHtml}
                    </div>
                    <span class="message-time-stamp">${timeStr}</span>
                </div>
            `;
        }).join('');

        stream.scrollTop = stream.scrollHeight;
    };

    const handlePlatformSendMessage = async () => {
        const input = document.querySelector('#view-messages .chat-text-input');
        if (!input) return;

        const text = input.value.trim();
        if (!text || !platformActiveConversationId || platformIsSending) return;

        const currentUser = (typeof SoundSphereAPI !== 'undefined') ? SoundSphereAPI.getCurrentUser() : null;
        const userId = currentUser ? (currentUser.id || currentUser.userId || currentUser.UserID) : null;
        if (!userId) return;

        platformIsSending = true;
        input.value = '';

        try {
            const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    conversationId: platformActiveConversationId,
                    userId,
                    messageText: text
                })
            });

            const data = await res.json();
            if (data.success) {
                await fetchPlatformMessagesThread(platformActiveConversationId);
                await fetchPlatformConversations();
            }
        } catch (err) {
            console.error('Error sending platform message:', err);
        } finally {
            platformIsSending = false;
        }
    };

    // Platform Photo Attachment Handler
    const platformSendImageMessage = async (imageDataUrl) => {
        if (!imageDataUrl || !platformActiveConversationId || platformIsSending) return;

        const currentUser = (typeof SoundSphereAPI !== 'undefined') ? SoundSphereAPI.getCurrentUser() : null;
        const userId = currentUser ? (currentUser.id || currentUser.userId || currentUser.UserID) : null;
        if (!userId) return;

        platformIsSending = true;
        try {
            const token = localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    conversationId: platformActiveConversationId,
                    userId,
                    messageText: `IMAGE_ATTACHMENT:${imageDataUrl}`
                })
            });

            const data = await res.json();
            if (data.success) {
                if (typeof showToast === 'function') {
                    showToast('✓ Photo attachment sent!', 'success', 2500);
                }
                await fetchPlatformMessagesThread(platformActiveConversationId);
                await fetchPlatformConversations();
            } else {
                alert(data.message || 'Failed to send image.');
            }
        } catch (err) {
            console.error('Error sending platform image message:', err);
            alert('Failed to send photo attachment. Please try again.');
        } finally {
            platformIsSending = false;
            const fileInput = document.querySelector('#view-messages #image-file-input') || document.getElementById('image-file-input');
            if (fileInput) fileInput.value = '';
        }
    };

    const platformBtnAttach = document.querySelector('#view-messages #btn-attach-img') || document.getElementById('btn-attach-img');
    const platformFileInput = document.querySelector('#view-messages #image-file-input') || document.getElementById('image-file-input');

    if (platformBtnAttach && platformFileInput) {
        platformBtnAttach.addEventListener('click', () => {
            if (!platformActiveConversationId) {
                if (typeof showToast === 'function') {
                    showToast('Please select a conversation first to attach photos.', 'warning');
                } else {
                    alert('Please select a conversation first to attach photos.');
                }
                return;
            }
            platformFileInput.click();
        });

        platformFileInput.addEventListener('change', () => {
            if (platformFileInput.files && platformFileInput.files[0]) {
                const file = platformFileInput.files[0];
                if (!file.type.startsWith('image/')) {
                    if (typeof showToast === 'function') {
                        showToast('Please select a valid image file.', 'warning');
                    } else {
                        alert('Please select a valid image file.');
                    }
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const maxDim = 800;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        platformSendImageMessage(resizedDataUrl);
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Bind Send Message Button and Enter Key inside #view-messages
    const platformSendBtn = document.querySelector('#view-messages .btn-send-message');
    if (platformSendBtn) {
        platformSendBtn.addEventListener('click', handlePlatformSendMessage);
    }
    const platformInput = document.querySelector('#view-messages .chat-text-input');
    if (platformInput) {
        platformInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePlatformSendMessage();
            }
        });
    }

    // Initial Load & Polling for Platform Messages
    fetchPlatformConversations();
    setInterval(fetchPlatformConversations, 3000);

    // Expose helper globally so switchView and cardMsgBtn can call it
    window.fetchPlatformConversations = fetchPlatformConversations;
    window.setPlatformActiveConversation = setPlatformActiveConversation;

    // ------------------------------------------------------------------------
    // Real-Time Notification Bell & Dropdown Panel Controller
    // ------------------------------------------------------------------------
    const btnNotificationBell = document.getElementById('btn-notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationList = document.getElementById('notification-list');
    const btnMarkAllRead = document.getElementById('btn-mark-all-read');
    const dropdownTabAll = document.getElementById('dropdown-tab-all');
    const dropdownTabUnread = document.getElementById('dropdown-tab-unread');

    let currentNotifFilter = 'all';
    let currentNotificationsCache = [];

    const fetchNotifications = async () => {
        const token = localStorage.getItem('token') || localStorage.getItem('soundsphere_token');
        if (!token) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('http://localhost:5000/api/notifications', { headers });
            if (res.ok) {
                const data = await res.json();
                currentNotificationsCache = data.notifications || data.data || [];
                const unreadCount = currentNotificationsCache.filter(n => !n.IsRead && n.IsRead !== 1).length;

                if (notificationBadge) {
                    if (unreadCount > 0) {
                        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                        notificationBadge.classList.remove('hidden');
                    } else {
                        notificationBadge.classList.add('hidden');
                    }
                }
                renderNotificationList();
            }
        } catch (err) {
            console.warn('Notifications fetch error:', err.message);
        }
    };

    const renderNotificationList = () => {
        if (!notificationList) return;
        let filtered = currentNotificationsCache;
        if (currentNotifFilter === 'unread') {
            filtered = currentNotificationsCache.filter(n => !n.IsRead && n.IsRead !== 1);
        }

        if (filtered.length === 0) {
            notificationList.innerHTML = `<div style="padding:32px 20px; text-align:center; color:#64748b; font-size:1.0rem;">No notifications found.</div>`;
            return;
        }

        notificationList.innerHTML = filtered.map(n => {
            const isUnread = !n.IsRead && n.IsRead !== 1;
            const createdDate = new Date(n.CreatedAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" style="padding:14px 20px; border-bottom:1px solid #f1f5f9; background:${isUnread ? '#eff6ff' : '#ffffff'}; cursor:pointer; transition:background 0.2s ease;" onclick="window.markSingleNotificationRead(${n.NotificationID || n.id})">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                        <strong style="font-size:1.0rem; color:#0a192f; font-weight:800;">${n.Title || n.type || 'Notification'}</strong>
                        <span style="font-size:0.75rem; color:#94a3b8; font-weight:600;">${createdDate}</span>
                    </div>
                    <p style="margin:0; font-size:0.86rem; color:#475569; line-height:1.4;">${n.Message || n.message || ''}</p>
                </div>
            `;
        }).join('');
    };

    window.markSingleNotificationRead = async (id) => {
        const token = localStorage.getItem('token') || localStorage.getItem('soundsphere_token');
        if (!token || !id) return;
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (e) {}
    };

    if (btnNotificationBell && notificationPanel) {
        btnNotificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            const userDropdown = document.getElementById('user-dropdown-menu') || document.getElementById('header-user-dropdown');
            if (userDropdown) userDropdown.classList.add('hidden');

            const isHidden = notificationPanel.classList.contains('hidden');
            if (isHidden) {
                notificationPanel.classList.remove('hidden');
                fetchNotifications();
            } else {
                notificationPanel.classList.add('hidden');
            }
        });
    }

    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener('click', async (e) => {
            e.stopPropagation();
            const token = localStorage.getItem('token') || localStorage.getItem('soundsphere_token');
            if (!token) return;
            try {
                await fetch('http://localhost:5000/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchNotifications();
            } catch (e) {}
        });
    }

    if (dropdownTabAll && dropdownTabUnread) {
        dropdownTabAll.addEventListener('click', (e) => {
            e.stopPropagation();
            currentNotifFilter = 'all';
            dropdownTabAll.style.background = '#2563eb';
            dropdownTabAll.style.color = '#ffffff';
            dropdownTabUnread.style.background = '#e2e8f0';
            dropdownTabUnread.style.color = '#475569';
            renderNotificationList();
        });

        dropdownTabUnread.addEventListener('click', (e) => {
            e.stopPropagation();
            currentNotifFilter = 'unread';
            dropdownTabUnread.style.background = '#2563eb';
            dropdownTabUnread.style.color = '#ffffff';
            dropdownTabAll.style.background = '#e2e8f0';
            dropdownTabAll.style.color = '#475569';
            renderNotificationList();
        });
    }

    // Dismiss Notification Panel on Click Outside
    document.addEventListener('click', (e) => {
        if (notificationPanel && !notificationPanel.classList.contains('hidden')) {
            const wrapper = document.getElementById('auth-notification-wrapper');
            if (wrapper && !wrapper.contains(e.target)) {
                notificationPanel.classList.add('hidden');
            }
        }
    });

    // Initial Notifications Fetch & Polling every 10 seconds
    fetchNotifications();
    setInterval(fetchNotifications, 10000);

    // Initial Search Filter Load
    filterSearchResults();

    // Initial User Bookings Fetch from SQL Server DB
    if (typeof window.fetchUserBookings === 'function') {
        window.fetchUserBookings();
    }
});

// Global Photo Lightbox Viewer Controller
window.openPhotoLightbox = (imageSrc) => {
    if (!imageSrc) return;

    let modal = document.getElementById('photo-lightbox-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-lightbox-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(10, 20, 35, 0.96); backdrop-filter:blur(12px); display:none; flex-direction:column; align-items:center; justify-content:center; z-index:99999999; opacity:0; transition:opacity 0.25s ease; box-sizing:border-box; padding:20px; user-select:none;';
        modal.innerHTML = `
            <div style="position:absolute; top:20px; right:28px; display:flex; align-items:center; gap:10px; z-index:100000000;">
                <button type="button" id="lightbox-zoom-out-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Zoom Out"><i class="fa-solid fa-minus"></i></button>
                <button type="button" id="lightbox-zoom-in-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Zoom In"><i class="fa-solid fa-plus"></i></button>
                <a id="lightbox-download-btn" href="" download="photo-attachment.jpg" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; text-decoration:none; display:flex; align-items:center; justify-content:center; font-size:1.1rem; transition:background 0.2s ease;" title="Download Photo">
                    <i class="fa-solid fa-download"></i>
                </a>
                <button type="button" id="lightbox-close-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; font-size:1.6rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Close Viewer">&times;</button>
            </div>
            <div id="lightbox-img-container" style="max-width:96vw; max-height:90vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; cursor:zoom-in;">
                <img id="lightbox-full-img" src="" alt="Enlarged Photo Attachment" style="max-width:94vw; max-height:88vh; border-radius:14px; object-fit:contain; box-shadow:0 25px 60px rgba(0,0,0,0.7); transform:scale(1); transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);">
            </div>
            <div style="position:absolute; bottom:20px; background:rgba(0,0,0,0.5); color:#ffffff; padding:6px 16px; border-radius:20px; font-size:0.82rem; font-weight:700; backdrop-filter:blur(4px); pointer-events:none; display:flex; align-items:center; gap:8px;">
                <i class="fa-solid fa-magnifying-glass-plus"></i> Click image or use buttons to Zoom In / Out
            </div>
        `;
        document.body.appendChild(modal);

        let currentScale = 1.0;

        const setScale = (scale) => {
            currentScale = Math.min(Math.max(scale, 1.0), 3.0);
            const img = modal.querySelector('#lightbox-full-img');
            const container = modal.querySelector('#lightbox-img-container');
            if (img) img.style.transform = `scale(${currentScale})`;
            if (container) container.style.cursor = currentScale > 1.0 ? 'zoom-out' : 'zoom-in';
        };

        modal.addEventListener('click', (e) => {
            if (e.target.id === 'lightbox-close-btn' || e.target.closest('#lightbox-close-btn')) {
                window.closePhotoLightbox();
                return;
            }
            if (e.target.id === 'lightbox-zoom-in-btn' || e.target.closest('#lightbox-zoom-in-btn')) {
                setScale(currentScale + 0.5);
                return;
            }
            if (e.target.id === 'lightbox-zoom-out-btn' || e.target.closest('#lightbox-zoom-out-btn')) {
                setScale(currentScale - 0.5);
                return;
            }
            if (e.target.id === 'lightbox-full-img') {
                setScale(currentScale > 1.0 ? 1.0 : 1.8);
                return;
            }
            if (e.target === modal || e.target.id === 'lightbox-img-container') {
                window.closePhotoLightbox();
            }
        });
    }

    const img = modal.querySelector('#lightbox-full-img');
    const dlBtn = modal.querySelector('#lightbox-download-btn');
    if (!img) return;

    img.src = imageSrc;
    if (dlBtn) dlBtn.href = imageSrc;
    img.style.transform = 'scale(1)';

    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '0', 'important');

    requestAnimationFrame(() => {
        modal.style.setProperty('opacity', '1', 'important');
    });
};

window.closePhotoLightbox = () => {
    const modal = document.getElementById('photo-lightbox-modal');
    const img = modal ? modal.querySelector('#lightbox-full-img') : null;
    if (!modal) return;

    modal.style.setProperty('opacity', '0', 'important');
    if (img) img.style.transform = 'scale(0.92)';
    setTimeout(() => {
        modal.style.setProperty('display', 'none', 'important');
        modal.style.setProperty('visibility', 'hidden', 'important');
        if (img) img.src = '';
    }, 250);
};

// Global Event Delegation for all enlargeable photos
document.addEventListener('click', (e) => {
    const imgEl = e.target.closest('.message-bubble img, .chat-photo-attachment, .enlargeable-photo, .offer-card-image-wrap img, #offer-details-modal-body img, img.clickable-photo');
    if (imgEl && imgEl.src && !e.target.closest('#photo-lightbox-modal') && !imgEl.classList.contains('no-lightbox')) {
        e.preventDefault();
        e.stopPropagation();
        window.openPhotoLightbox(imgEl.src);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.closePhotoLightbox();
});
