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
        const effectiveView = (viewName === 'search' && !document.getElementById('view-search')) ? 'home' : viewName;
        Object.keys(views).forEach(key => {
            if (views[key]) {
                if (key === effectiveView) {
                    views[key].classList.remove('hidden');
                } else {
                    views[key].classList.add('hidden');
                }
            }

            if (navTabs[key]) {
                if (key === effectiveView || (viewName === 'search' && key === 'home')) {
                    navTabs[key].classList.add('active');
                } else {
                    navTabs[key].classList.remove('active');
                }
            }
        });

        // Save state to sessionStorage & location hash so refreshing F5 stays on current page
        sessionStorage.setItem('soundsphere_active_view', effectiveView);
        if (window.location.hash !== '#' + effectiveView) {
            history.replaceState(null, null, '#' + effectiveView);
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
            const activeSubtab = sessionStorage.getItem('soundsphere_active_subtab');
            if (activeSubtab === 'wallet' && typeof window.loadClientWalletData === 'function') {
                window.loadClientWalletData();
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
            if (document.getElementById('home-featured-providers-grid') || !document.getElementById('view-search')) return;
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
                if (document.getElementById('home-featured-providers-grid') || !document.getElementById('view-search')) return;
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
            if (document.getElementById('home-featured-providers-grid') || !document.getElementById('view-search')) return;
            const selectedCategory = homeCategorySelect.value;
            const selectedPlace = homePlaceSelect ? homePlaceSelect.value : 'all';
            const query = heroSearchInput ? heroSearchInput.value.trim() : '';
            handleSearchQuery(query, selectedCategory, selectedPlace, 'all');
        });
    }

    if (homePlaceSelect) {
        homePlaceSelect.addEventListener('change', () => {
            if (document.getElementById('home-featured-providers-grid') || !document.getElementById('view-search')) return;
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

    // Direct Booking Action from Marketplace Offer Cards - Shows Calendar First!
    window.bookMarketplaceOffer = (packageId, providerId, title, price, providerName) => {
        const decodedTitle = title ? decodeURIComponent(title) : 'Service Package';
        const decodedProvName = providerName ? decodeURIComponent(providerName) : 'SoundSphere Service Provider';
        const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
        const isProviderUser = user && (user.role === 'ServiceProvider' || user.roleId === 3 || user.isProvider);
        if (isProviderUser && (String(user.userId) === String(providerId) || String(user.id) === String(providerId) || String(user.providerId) === String(providerId))) {
            if (typeof showToast === 'function') {
                showToast('⚠️ You cannot book your own service package.', 'warning');
            } else if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.showNotification) {
                SoundSphereAPI.showNotification('Provider Notice: You cannot book your own service package.', 'info');
            } else {
                alert('Provider Notice: You cannot book your own service package.');
            }
            return;
        }

        try {
            sessionStorage.setItem('soundsphere_selected_package', JSON.stringify({
                packageId: packageId,
                providerId: providerId,
                title: decodedTitle,
                price: Number(price) || 0,
                providerName: decodedProvName
            }));
        } catch(e) {}

        // Show the Calendar first!
        if (typeof window.openBookingCalendarModal === 'function') {
            window.openBookingCalendarModal({
                packageId: packageId,
                providerId: providerId,
                title: decodedTitle,
                price: Number(price) || 0,
                providerName: decodedProvName
            });
            return;
        }

        window.location.href = `/booking.html?package_id=${packageId}&provider_id=${providerId}`;
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

            const rawOfferPhotos = Array.isArray(offer.images) ? offer.images : (offer.images ? [offer.images] : []);
            const photoUrls = rawOfferPhotos.map(img => {
                const raw = typeof img === 'string' ? img : (img && img.url ? img.url : '');
                if (!raw) return '';
                return (raw.startsWith('/') || raw.startsWith('http')) ? raw : `/${raw}`;
            }).filter(Boolean);

            const hasMultiplePhotos = photoUrls.length > 1;
            const offerPhotoUrl = photoUrls.length > 0 ? photoUrls[0] : null;

            if (!window.packagePhotosMap) window.packagePhotosMap = {};
            window.packagePhotosMap[offer.PackageID] = photoUrls;

            const avatarSrc = offer.providerAvatar;
            const avatarHTML = avatarSrc ?
                `<img src="${avatarSrc.startsWith('/') || avatarSrc.startsWith('http') ? avatarSrc : '/' + avatarSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">` :
                `<i class="fa-solid fa-store" style="color:#2563eb;"></i>`;

                return `
                <div class="shopee-offer-card" data-id="${offer.providerId}" data-pkg-id="${offer.PackageID}" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(10,25,47,0.06); transition:all 0.25s ease; display:flex; flex-direction:column; justify-content:space-between; width:100%;">
                    <div>
                        <!-- 1. Setup / Inclusion Photo (Swipeable / Clickable Carousel) -->
                        <div class="offer-card-image-wrap" 
                             data-pkg-id="${offer.PackageID}" 
                             data-photo-idx="0" 
                             style="position:relative; height:180px; overflow:hidden; background:linear-gradient(135deg, #0a192f 0%, #1e3e62 100%); display:flex; align-items:center; justify-content:center; user-select:none; cursor:pointer;" 
                             onclick="if(!event.target.closest('.card-carousel-btn') && !event.target.closest('.card-enlarge-btn')) { if (window.packagePhotosMap && window.packagePhotosMap['${offer.PackageID}'] && window.packagePhotosMap['${offer.PackageID}'].length > 1) { window.switchCardPhoto('${offer.PackageID}', 'next', event); } else { window.openCardGalleryLightbox('${offer.PackageID}', event); } }"
                             title="${hasMultiplePhotos ? 'Click photo to swipe to next photo' : 'Click photo to enlarge'}">
                            ${offerPhotoUrl ? 
                                `<img id="main-offer-img-${offer.PackageID}" src="${offerPhotoUrl}" alt="${offerTitle}" class="card-main-img" style="width:100%; height:100%; object-fit:cover; transition:transform 0.25s ease, opacity 0.15s ease;">` : 
                                `<i class="fa-solid fa-sliders" style="font-size:2.5rem; color:rgba(255,255,255,0.2);"></i>`
                            }
                            <span style="position:absolute; top:10px; left:10px; background:rgba(37,99,235,0.95); color:#ffffff; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:800; text-transform:uppercase; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:none; z-index:2;">${category}</span>
                            <span style="position:absolute; top:10px; right:10px; background:rgba(16,185,129,0.95); color:#ffffff; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:800; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:none; z-index:2;"><i class="fa-solid fa-circle-check"></i> Available</span>

                            ${hasMultiplePhotos ? `
                                <!-- Left / Right Navigation Buttons -->
                                <button type="button" class="card-carousel-btn prev-btn" onclick="event.stopPropagation(); window.switchCardPhoto('${offer.PackageID}', 'prev', event);" title="Previous photo" style="position:absolute; left:8px; top:50%; transform:translateY(-50%); width:30px; height:30px; border-radius:50%; background:rgba(10,25,47,0.75); color:#ffffff; border:1px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:all 0.2s ease; z-index:4;">
                                    <i class="fa-solid fa-chevron-left" style="font-size:0.8rem;"></i>
                                </button>
                                <button type="button" class="card-carousel-btn next-btn" onclick="event.stopPropagation(); window.switchCardPhoto('${offer.PackageID}', 'next', event);" title="Next photo" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); width:30px; height:30px; border-radius:50%; background:rgba(10,25,47,0.75); color:#ffffff; border:1px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:all 0.2s ease; z-index:4;">
                                    <i class="fa-solid fa-chevron-right" style="font-size:0.8rem;"></i>
                                </button>

                                <!-- Photo Counter Pill -->
                                <span id="card-photo-counter-${offer.PackageID}" style="position:absolute; bottom:10px; left:10px; background:rgba(10,25,47,0.75); color:#ffffff; padding:2px 8px; border-radius:10px; font-size:0.6875rem; font-weight:800; backdrop-filter:blur(4px); pointer-events:none; border:1px solid rgba(255,255,255,0.2); z-index:2;">
                                    1 / ${photoUrls.length}
                                </span>
                            ` : ''}

                            ${offerPhotoUrl ? `
                                <button type="button" class="card-enlarge-btn" onclick="event.stopPropagation(); window.openCardGalleryLightbox('${offer.PackageID}', event);" style="position:absolute; bottom:10px; right:10px; background:rgba(10,25,47,0.78); color:#ffffff; padding:3px 9px; border-radius:8px; font-size:0.6875rem; font-weight:700; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.25); cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s; z-index:3;" title="Click to enlarge photo">
                                    <i class="fa-solid fa-magnifying-glass-plus" style="color:#60a5fa;"></i> Enlarge
                                </button>
                            ` : ''}
                        </div>

                        <!-- Mini Gallery Preview Thumbnails (Click to switch / swipe main photo) -->
                        ${hasMultiplePhotos ? `
                            <div id="card-thumbnails-row-${offer.PackageID}" style="display:flex; gap:6px; padding:6px 10px; background:#f8fafc; border-bottom:1px solid #e2e8f0; overflow-x:auto;">
                                ${photoUrls.map((u, pIdx) => `
                                    <img src="${u}" class="card-thumb-item ${pIdx === 0 ? 'active' : ''}" 
                                         data-pkg-id="${offer.PackageID}" 
                                         data-idx="${pIdx}" 
                                         onclick="event.stopPropagation(); window.switchCardPhoto('${offer.PackageID}', ${pIdx}, event);" 
                                         style="width:36px; height:36px; border-radius:6px; object-fit:cover; border:2px solid ${pIdx === 0 ? '#2563eb' : '#cbd5e1'}; cursor:pointer; flex-shrink:0; opacity:${pIdx === 0 ? '1' : '0.65'}; transition:all 0.2s ease; ${pIdx === 0 ? 'box-shadow:0 2px 6px rgba(37,99,235,0.35); transform:scale(1.05);' : ''}" 
                                         onmouseover="this.style.opacity='1'; this.style.transform='scale(1.08)';" 
                                         onmouseout="if(!this.classList.contains('active')) { this.style.opacity='0.65'; this.style.transform='scale(1)'; }" 
                                         title="Photo ${pIdx + 1} - Click to switch">
                                `).join('')}
                            </div>
                        ` : ''}

                        <!-- Card Content Body -->
                        <div style="padding:16px 16px 8px 16px;">
                            <!-- 2. Service Offer Name (Clickable Title for Details Modal) -->
                            <h3 onclick="window.openMarketplaceOfferModal ? window.openMarketplaceOfferModal('${offer.PackageID}', '${offer.providerId}') : window.location.href='/provider-detail.html?id=${offer.providerId}&pkgId=${offer.PackageID}'" style="margin:0 0 8px 0; font-size:1.05rem; font-weight:800; color:#0a192f; line-height:1.35; min-height:2.7em; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; cursor:pointer; transition:color 0.2s ease;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#0a192f'" title="Click to view offer details: ${offerTitle}">${offerTitle}</h3>

                            <!-- 3. Price -->
                            <div style="margin-bottom:10px;">
                                <div style="font-size:1.25rem; font-weight:900; color:#2563eb; letter-spacing:-0.2px;">
                                    ₱${offerPrice.toLocaleString('en-US', {minimumFractionDigits: 2})} 
                                    <span style="font-size:0.8125rem; color:#64748b; font-weight:600;">/ Event</span>
                                </div>
                            </div>

                            <!-- 5. Short Description / Inclusions (Clickable for Details Modal) -->
                            <div onclick="window.openMarketplaceOfferModal ? window.openMarketplaceOfferModal('${offer.PackageID}', '${offer.providerId}') : window.location.href='/provider-detail.html?id=${offer.providerId}&pkgId=${offer.PackageID}'" style="margin-bottom:10px; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0; cursor:pointer;" title="Click to view full inclusions list">
                                <strong style="font-size:0.75rem; color:#475569; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px; font-weight:800;">Inclusions:</strong>
                                <ul style="list-style:none; padding:0; margin:0; font-size:0.8125rem; color:#0f172a; display:flex; flex-direction:column; gap:3px;">
                                    ${inclusionsArr.slice(0, 3).map(inc => `<li style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600;"><i class="fa-solid fa-check" style="color:#059669; margin-right:6px; font-size:0.8125rem; font-weight:900;"></i> ${inc}</li>`).join('')}
                                    ${inclusionsArr.length > 3 ? `<li style="font-size:0.75rem; color:#64748b; font-style:italic; font-weight:600; margin-top:2px;">+ ${inclusionsArr.length - 3} more included</li>` : ''}
                                </ul>
                            </div>

                            <!-- 6. Provider Name & 7. Location (Clickable for Provider Profile) -->
                            <div style="border-top:1px solid #e2e8f0; padding-top:10px; margin-top:8px;">
                                <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.location.href='/provider-detail.html?id=${offer.providerId}'" title="View Storefront Profile of ${offer.providerName}">
                                    <div style="width:32px; height:32px; border-radius:50%; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:0.875rem; overflow:hidden; border:1px solid #93c5fd; flex-shrink:0;" onclick="event.stopPropagation(); const img = this.querySelector('img'); if (img && img.src) window.openPhotoLightbox(img.src); else window.location.href='/provider-detail.html?id=${offer.providerId}';">
                                        ${avatarHTML}
                                    </div>
                                    <div style="overflow:hidden; flex:1;">
                                        <a href="/provider-detail.html?id=${offer.providerId}" onclick="event.stopPropagation();" style="font-size:0.875rem; font-weight:800; color:#0a192f; text-decoration:none; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="Click to view ${offer.providerName} Profile">
                                            ${offer.providerName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.6875rem; color:#2563eb; margin-left:2px;"></i>
                                        </a>
                                        <span style="font-size:0.8125rem; color:#64748b; font-weight:500; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px;">
                                            <i class="fa-solid fa-location-dot" style="color:#ef4444; margin-right:4px;"></i> ${offer.coverageArea}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 9. Action Buttons (Standard 40px Touch Height) -->
                    <div style="padding:0 16px 16px 16px;">
                        <div style="display:flex; gap:8px;">
                            <button type="button" onclick="window.location.href='/client-messages.html?providerId=${offer.providerId}&providerName=${encodeURIComponent(offer.providerName)}'" style="flex:1; height:40px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; color:#2563eb; font-weight:700; font-size:0.875rem; cursor:pointer; transition:all 0.2s ease; display:inline-flex; align-items:center; justify-content:center; gap:6px;" title="Message Provider"><i class="fa-solid fa-comment-dots"></i> Chat</button>
                            <button type="button" onclick="window.bookMarketplaceOffer('${offer.PackageID}', '${offer.providerId}', '${encodeURIComponent(offerTitle)}', ${offerPrice}, '${encodeURIComponent(offer.providerName || '')}')" style="flex:1.2; height:40px; border:none; border-radius:8px; background:#2563eb; color:#ffffff; font-weight:700; font-size:0.875rem; cursor:pointer; box-shadow:0 2px 6px rgba(37,99,235,0.25); transition:all 0.2s ease; display:inline-flex; align-items:center; justify-content:center; gap:6px;" title="Book Offer">Book Now</button>
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

            // Helper for 12-hour AM/PM formatting
            const formatDisplayTime = (timeStr) => {
                if (!timeStr) return '06:00 PM';
                if (/AM|PM/i.test(timeStr)) return timeStr;
                const parts = String(timeStr).split(':');
                if (parts.length < 2) return timeStr;
                let hours = parseInt(parts[0], 10);
                const minutes = parts[1].padStart(2, '0');
                if (isNaN(hours)) return timeStr;
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
                return `${hours}:${minutes} ${ampm}`;
            };

            // Status Count Tracking (All, Confirmed, Pending, Completed, Cancelled)
            const counts = { all: bookings.length, pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
            bookings.forEach(b => {
                const st = (b.BookingStatus || 'Confirmed').toLowerCase().trim();
                if (counts[st] !== undefined) {
                    counts[st]++;
                } else if (st === 'approved' || st === 'paid') {
                    counts.confirmed++;
                }
            });

            // Update subtab count badges in DOM (All (N), Confirmed (N), Pending (N), Completed (N), Cancelled (N))
            document.querySelectorAll('.booking-status-filter-btn[data-status]').forEach(btn => {
                const statusKey = (btn.getAttribute('data-status') || '').toLowerCase().trim();
                const count = counts[statusKey] !== undefined ? counts[statusKey] : (statusKey === 'all' ? bookings.length : 0);
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
                        let clientName = b.ClientName;
                        if (Array.isArray(clientName)) clientName = clientName[0];
                        if (!clientName || clientName === 'null') {
                            clientName = (currentUser && (currentUser.name || currentUser.fullname || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : null))) || 'Verified Client';
                        }

                        // Overdue check for booking balance
                        let isOverdue = false;
                        let daysOverdue = 0;
                        if (sDate && sDate !== 'N/A') {
                            const match = String(sDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
                            if (match) {
                                const targetYear = parseInt(match[1], 10);
                                const targetMonth = parseInt(match[2], 10) - 1;
                                const targetDay = parseInt(match[3], 10);
                                const targetMidnight = new Date(targetYear, targetMonth, targetDay).getTime();
                                const now = new Date();
                                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                    isOverdue = true;
                                    daysOverdue = Math.abs(diffDays);
                                }
                            }
                        }

                        // 3-Hour Cancellation Calculation
                        const createdAtRaw = b.CreatedAt;
                        const createdAtMs = createdAtRaw ? new Date(createdAtRaw).getTime() : Date.now();
                        const nowMs = Date.now();
                        const elapsedMinutes = Math.max(0, (nowMs - createdAtMs) / (1000 * 60));
                        const maxAllowedMinutes = 180; // 3 hours
                        const isWithin3Hours = elapsedMinutes <= maxAllowedMinutes;
                        const remainingMinutes = Math.max(0, Math.floor(maxAllowedMinutes - elapsedMinutes));
                        const remHours = Math.floor(remainingMinutes / 60);
                        const remMins = remainingMinutes % 60;
                        const timeRemainingText = remHours > 0 ? `${remHours}h ${remMins}m left` : `${remMins}m left`;

                        let cancelBtnHtml = '';
                        if (statusLower === 'cancelled' || statusLower === 'rejected') {
                            cancelBtnHtml = `
                                <span style="padding:10px 18px; font-size:0.88rem; font-weight:800; border-radius:10px; background:#fee2e2; color:#ef4444; display:inline-flex; align-items:center; gap:6px;">
                                    <i class="fa-solid fa-ban"></i> Cancelled
                                </span>
                            `;
                        } else if (statusLower === 'completed') {
                            cancelBtnHtml = '';
                        } else if (isWithin3Hours) {
                            cancelBtnHtml = `
                                <button type="button" class="btn-cancel-marketplace-booking" data-id="${b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`}" data-booking-id="${b.BookingID}" data-time-remaining="${timeRemainingText}" style="padding:10px 18px; font-size:0.95rem; font-weight:800; border-radius:10px; border:1.5px solid #fecdd3; background:#fff1f2; color:#be123c; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s ease;" title="You have ${timeRemainingText} left to cancel this booking">
                                    <i class="fa-solid fa-ban" style="color:#e11d48;"></i> Cancel Booking
                                </button>
                            `;
                        } else {
                            cancelBtnHtml = `
                                <button type="button" disabled style="padding:10px 18px; font-size:0.95rem; font-weight:700; border-radius:10px; border:1px solid #e2e8f0; background:#f8fafc; color:#94a3b8; cursor:not-allowed; opacity:0.6; display:inline-flex; align-items:center; gap:8px;" title="Cancellation window closed. Bookings can only be cancelled within 3 hours of reservation.">
                                    <i class="fa-solid fa-lock" style="color:#94a3b8;"></i> Cancel Closed (>3h)
                                </button>
                            `;
                        }

                        let statusBadgeClass = 'status-confirmed';
                        if (statusLower === 'pending') statusBadgeClass = 'status-pending';
                        else if (statusLower === 'completed') statusBadgeClass = 'status-completed';
                        else if (statusLower === 'cancelled' || statusLower === 'rejected') statusBadgeClass = 'status-cancelled';

                        const totalAmountVal = parseFloat(b.TotalAmount || b.PackagePrice || 0);
                        const amountPaidVal = parseFloat(b.AmountPaid !== undefined && b.AmountPaid !== null ? b.AmountPaid : (b.PaymentType === 'downpayment' ? totalAmountVal * 0.5 : totalAmountVal));
                        const remainingBalVal = parseFloat(b.RemainingBalance !== undefined && b.RemainingBalance !== null ? b.RemainingBalance : (totalAmountVal - amountPaidVal));
                        const isDownpayment = (b.PaymentType === 'downpayment' || remainingBalVal > 0);

                        const formattedStart = formatDisplayTime(b.StartTime);
                        const formattedEnd = formatDisplayTime(b.EndTime);

                        return `
                            <div class="booking-item-card" data-booking-status="${statusLower}" style="background:#ffffff; border:1.5px solid #cbd5e1; border-radius:18px; padding:24px 28px; margin-bottom:20px; box-shadow:0 6px 20px rgba(10,25,47,0.06); display:flex; flex-direction:column; gap:16px;">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
                                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                                        <span style="font-size:1.1rem; font-weight:900; color:#0a192f;">Ref: ${b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`}</span>
                                        <span style="font-size:0.88rem; color:#64748b; font-weight:600;">Booked on ${new Date(b.CreatedAt).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'})}</span>
                                        <span style="font-size:0.88rem; color:#1e293b; font-weight:700; background:#f1f5f9; padding:3px 10px; border-radius:6px;">Booked by: <strong>${clientName}</strong></span>
                                        ${b.EventType ? `<span style="font-size:0.82rem; color:#2563eb; font-weight:800; background:#eff6ff; border:1px solid #bfdbfe; padding:2px 8px; border-radius:6px;">${b.EventType}</span>` : ''}
                                    </div>
                                    <span class="status-badge ${statusBadgeClass}" style="padding:6px 16px; border-radius:20px; font-weight:800; font-size:0.95rem;">${statusStr}</span>
                                </div>

                                <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
                                    <img src="${b.ProviderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(b.ProviderName || 'Provider') + '&background=0084ff&color=fff'}" alt="${b.ProviderName || 'Provider'}" style="width:75px; height:75px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Provider&background=0084ff&color=fff';">
                                    <div style="flex:1; min-width:260px;">
                                        <h4 style="margin:0 0 6px 0; font-size:1.25rem; font-weight:900; color:#0a192f;">${b.PackageName || 'Event Service Package'}</h4>
                                        <div style="font-size:1rem; font-weight:700; color:#2563eb; margin-bottom:10px;">${b.ProviderName || 'Sound & Lights Provider'}</div>
                                        
                                        <div style="font-size:0.92rem; color:#334155; font-weight:600; display:flex; flex-direction:column; gap:8px;">
                                            <div style="display:flex; flex-wrap:wrap; gap:16px;">
                                                <span>Client: <strong style="color:#0f172a;">${clientName}</strong></span>
                                                <span>Date: <strong style="color:#0f172a;">${dateText}</strong></span>
                                                <span>Start Time: <strong style="color:#0f172a;">${formattedStart}</strong></span>
                                            </div>
                                            
                                            <div style="display:flex; flex-wrap:wrap; gap:16px;">
                                                <span>Venue: <strong style="color:#0f172a;">${b.VenueName || 'Private Event Venue'}</strong></span>
                                                <span>Location: <strong style="color:#0f172a;">${b.EventAddress || (b.EventPlace ? b.EventPlace + ', Batangas' : 'Batangas')}</strong></span>
                                            </div>

                                            ${b.EventName && b.EventName !== 'Event Service Booking' && b.EventName !== b.PackageName ? `
                                            <div>
                                                <span>Event Title: <strong style="color:#0f172a;">${b.EventName}</strong></span>
                                            </div>` : ''}

                                            ${b.LocationNotes ? `
                                            <div style="background:#f8fafc; border-left:3px solid #64748b; padding:4px 10px; border-radius:4px; font-size:0.85rem; color:#475569;">
                                                <strong>Client Note:</strong> ${b.LocationNotes}
                                            </div>` : ''}
                                        </div>
                                    </div>

                                    <div style="text-align:right; min-width:200px; display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                                        <div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase;">Total Amount</div>
                                        <div style="font-size:1.65rem; font-weight:900; color:#2563eb;">₱${totalAmountVal.toLocaleString()}</div>
                                        
                                        <div style="display:flex; flex-direction:column; gap:4px; align-items:flex-end;">
                                            <span style="font-size:0.84rem; font-weight:800; background:#ecfdf5; color:#047857; padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; border:1px solid #a7f3d0;">
                                                Paid: ₱${amountPaidVal.toLocaleString()} (${isDownpayment ? '50% Deposit' : '100% Full'})
                                            </span>
                                            
                                            ${remainingBalVal > 0 ? (isOverdue ? `
                                            <span style="font-size:0.82rem; font-weight:800; background:#fee2e2; color:#b91c1c; padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; gap:5px; border:1.5px solid #f87171;">
                                                <i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i> Overdue: ₱${remainingBalVal.toLocaleString()} (${daysOverdue}d past due)
                                            </span>` : `
                                            <span style="font-size:0.82rem; font-weight:800; background:#fff1f2; color:#be123c; padding:4px 10px; border-radius:6px; display:inline-flex; align-items:center; border:1px solid #fecdd3;">
                                                Balance: ₱${remainingBalVal.toLocaleString()} (Due on event)
                                            </span>`) : ''}
                                        </div>

                                        <div style="font-size:0.75rem; color:#64748b; font-weight:600; text-align:right; margin-top:2px;">
                                            Package: ₱${parseFloat(b.PackagePrice || 0).toLocaleString()} | Transpo: ₱${parseFloat(b.TransportationFee || 0).toLocaleString()}${b.DistanceKm ? ` (${b.DistanceKm}km)` : ''}${b.AdditionalDayCharges > 0 ? ` | Extra: ₱${parseFloat(b.AdditionalDayCharges).toLocaleString()}` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #e2e8f0; padding-top:14px; flex-wrap:wrap;">
                                    ${statusLower === 'completed' ? `
                                        <button type="button" class="btn-card-rate-review" onclick="window.handleRateButtonClick(this)"
                                            data-booking-id="${b.BookingID}"
                                            data-provider-id="${b.ProviderID || ''}"
                                            data-provider-name="${encodeURIComponent(b.ProviderName || 'Provider')}"
                                            data-package-name="${encodeURIComponent(b.PackageName || 'Package')}"
                                            data-existing-rating="${b.Rating || ''}"
                                            data-existing-review="${encodeURIComponent(b.ReviewText || '')}"
                                            style="padding:10px 24px; font-size:0.95rem; font-weight:800; border:1.5px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:8px; border-radius:10px; background:#ffffff; color:#0a192f; box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.2s ease;">
                                            <i class="fa-solid fa-star" style="color:#f59e0b;"></i> ${b.ReviewID ? `Rated (${b.Rating}★)` : 'To Rate'}
                                        </button>
                                    ` : (statusLower === 'cancelled' || statusLower === 'rejected') ? `
                                        ${cancelBtnHtml}
                                    ` : `
                                        <a href="booking-confirmation.html?ref=${encodeURIComponent(b.BookingReference || '')}&id=${b.BookingID}" class="btn-card-secondary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px;">
                                            <i class="fa-solid fa-file-invoice"></i> View Official Receipt
                                        </a>
                                        ${cancelBtnHtml}
                                        <a href="client-messages.html?providerId=${b.ProviderID}&providerName=${encodeURIComponent(b.ProviderName || 'Provider')}" class="btn-card-primary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px;">
                                            <i class="fa-solid fa-comments"></i> Chat Provider
                                        </a>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('');

                    myBookingsContainer.innerHTML = cardsHtml;

                    // Attach Cancel Booking click listeners
                    const cancelModal = document.getElementById('marketplace-cancel-modal');
                    const cancelRefSpan = document.getElementById('marketplace-cancel-booking-ref');
                    const cancelTimerSpan = document.getElementById('marketplace-cancel-timer-text');
                    const cancelForm = document.getElementById('marketplace-cancel-form');

                    document.querySelectorAll('.btn-cancel-marketplace-booking').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const bRef = btn.getAttribute('data-id');
                            const bId = btn.getAttribute('data-booking-id');
                            const timeRem = btn.getAttribute('data-time-remaining') || '3 hours';

                            if (cancelForm) {
                                cancelForm.dataset.bookingId = bId;
                                cancelForm.dataset.bookingRef = bRef;
                            }
                            if (cancelRefSpan) cancelRefSpan.textContent = bRef;
                            if (cancelTimerSpan) cancelTimerSpan.textContent = `${timeRem} left to cancel (3-hour limit)`;
                            if (cancelModal) cancelModal.classList.remove('hidden');
                        });
                    });

                    // Cancel Modal Close Buttons
                    document.querySelectorAll('.btn-close-marketplace-cancel').forEach(btn => {
                        btn.addEventListener('click', () => {
                            if (cancelModal) cancelModal.classList.add('hidden');
                        });
                    });

                    // Cancel Form Submit Handler
                    if (cancelForm && !cancelForm.dataset.initialized) {
                        cancelForm.dataset.initialized = 'true';
                        cancelForm.addEventListener('submit', async (e) => {
                            e.preventDefault();
                            const bookingId = cancelForm.dataset.bookingId;
                            const bookingRef = cancelForm.dataset.bookingRef;

                            if (!bookingId) {
                                showToast('⚠️ No booking selected.', 'warning');
                                return;
                            }

                            const reason = document.getElementById('marketplace-cancel-reason')?.value;
                            const notes = document.getElementById('marketplace-cancel-notes')?.value ? document.getElementById('marketplace-cancel-notes').value.trim() : '';
                            const fullReason = notes ? `${reason} - ${notes}` : reason;
                            const submitBtn = document.getElementById('btn-submit-marketplace-cancel');

                            if (!reason) {
                                showToast('⚠️ Please select a cancellation reason.', 'warning');
                                return;
                            }

                            try {
                                if (submitBtn) {
                                    submitBtn.disabled = true;
                                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
                                }

                                const headers = { 'Content-Type': 'application/json' };
                                if (token) headers['Authorization'] = `Bearer ${token}`;

                                const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({
                                        userId: user?.userId || user?.id,
                                        reason: fullReason
                                    })
                                    });

                                const data = await res.json();
                                if (res.ok && data.success) {
                                    showToast(`✓ Booking ${bookingRef || bookingId} successfully cancelled!`, 'success');
                                    if (cancelModal) cancelModal.classList.add('hidden');
                                    cancelForm.reset();
                                    delete cancelForm.dataset.bookingId;
                                    delete cancelForm.dataset.bookingRef;
                                    if (typeof window.fetchUserBookings === 'function') {
                                        window.fetchUserBookings();
                                    }
                                } else {
                                    showToast(`⚠️ ${data.message || 'Failed to cancel booking.'}`, 'error');
                                    if (data.expired) {
                                        if (cancelModal) cancelModal.classList.add('hidden');
                                        if (typeof window.fetchUserBookings === 'function') {
                                            window.fetchUserBookings();
                                        }
                                    }
                                }
                            } catch (err) {
                                console.error('Cancel booking error:', err);
                                showToast('Network error while cancelling booking.', 'error');
                            } finally {
                                if (submitBtn) {
                                    submitBtn.disabled = false;
                                    submitBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Confirm Cancellation';
                                }
                            }
                        });
                    }

                    // Active status pill filter execution
                    const activeStatusBtn = document.querySelector('.booking-status-filter-btn.active');
                    const targetSt = activeStatusBtn ? (activeStatusBtn.getAttribute('data-status') || 'all').toLowerCase() : 'all';
                    let matchCount = 0;
                    document.querySelectorAll('#my-bookings-cards-container .booking-item-card[data-booking-status]').forEach(card => {
                        const st = card.getAttribute('data-booking-status');
                        if (targetSt === 'all' || st === targetSt) {
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
                        const clientName = b.ClientName || (currentUser && (currentUser.name || currentUser.fullname || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : null))) || 'Verified Client';

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
                                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                                        <span style="font-size:1.15rem; font-weight:900; color:#0a192f;">
                                            Ref: ${b.BookingReference || `SS-2026-${String(b.BookingID || 1).padStart(5, '0')}`}
                                        </span>
                                        <span style="font-size:0.98rem; color:#64748b; font-weight:600;">
                                            Booked on ${bookedOn}
                                        </span>
                                        <span style="font-size:0.88rem; color:#1e293b; font-weight:700; background:#f1f5f9; padding:3px 10px; border-radius:6px;">
                                            Booked by: <strong>${clientName}</strong>
                                        </span>
                                    </div>
                                    <span class="status-badge ${statusBadgeClass}" style="padding:6px 16px; border-radius:20px; font-weight:800; font-size:0.95rem; background:${badgeBg}; color:${badgeColor}; display:inline-flex; align-items:center;">
                                        ${statusStr}
                                    </span>
                                </div>

                                <!-- Main Booking Info -->
                                <div style="display:flex; gap:24px; align-items:center; flex-wrap:wrap;">
                                    <img src="${b.ProviderAvatar || 'assets/images/banner.png'}" alt="${providerName}" style="width:80px; height:80px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;" onerror="this.onerror=null; this.src='assets/images/banner.png';">
                                    <div style="flex:1; min-width:260px;">
                                        <h4 style="margin:0 0 6px 0; font-size:1.35rem; font-weight:900; color:#0a192f;">${b.PackageName || 'Event Service Package'}</h4>
                                        <div style="font-size:1.05rem; font-weight:700; color:#2563eb; margin-bottom:8px;">
                                            ${providerName}
                                        </div>
                                        <div style="font-size:0.95rem; color:#475569; font-weight:600; display:flex; flex-wrap:wrap; gap:18px;">
                                            <span>Client: <strong style="color:#0f172a;">${clientName}</strong></span>
                                            <span>Date: <strong style="color:#0f172a;">${dateText}</strong></span>
                                            <span>Start Time: <strong style="color:#0f172a;">${b.StartTime || '08:00 AM'}</strong></span>
                                            <span>Venue: <strong style="color:#0f172a;">${b.VenueName || 'Private Event Venue'}</strong></span>
                                            <span>Location: <strong style="color:#0f172a;">${b.EventAddress || (b.EventPlace ? b.EventPlace + ', Batangas' : 'Batangas')}</strong></span>
                                        </div>
                                    </div>
                                    <div style="text-align:right; min-width:180px; display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
                                        <div style="font-size:0.85rem; font-weight:800; color:#64748b; text-transform:uppercase; letter-spacing:0.5px;">Total Amount</div>
                                        <div style="font-size:1.8rem; font-weight:900; color:#2563eb;">₱${parseFloat(b.TotalAmount || b.PackagePrice || 0).toLocaleString()}</div>
                                        <span style="font-size:0.85rem; font-weight:800; background:#ecfdf5; color:#047857; padding:5px 12px; border-radius:6px; display:inline-block;">
                                            ${b.PaymentStatus || 'Paid'} (${b.PaymentType === 'downpayment' ? '50% Deposit' : '100% Full'})
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
                                        ${statusLower === 'completed' ? `
                                            <button type="button" class="btn-card-rate-review" onclick="window.handleRateButtonClick(this)"
                                                data-booking-id="${b.BookingID}"
                                                data-provider-id="${b.ProviderID || ''}"
                                                data-provider-name="${encodeURIComponent(b.ProviderName || providerName || 'Provider')}"
                                                data-package-name="${encodeURIComponent(b.PackageName || 'Package')}"
                                                data-existing-rating="${b.Rating || ''}"
                                                data-existing-review="${encodeURIComponent(b.ReviewText || '')}"
                                                style="padding:10px 24px; font-size:0.95rem; font-weight:800; border:1.5px solid #cbd5e1; cursor:pointer; display:inline-flex; align-items:center; gap:8px; border-radius:10px; background:#ffffff; color:#0a192f; box-shadow:0 2px 8px rgba(0,0,0,0.04); transition:all 0.2s ease;">
                                                <i class="fa-solid fa-star" style="color:#f59e0b;"></i> ${b.ReviewID ? `Rated (${b.Rating}★)` : 'To Rate'}
                                            </button>
                                        ` : (statusLower === 'cancelled' || statusLower === 'rejected') ? `
                                            <span style="padding:10px 18px; font-size:0.88rem; font-weight:800; border-radius:10px; background:#fee2e2; color:#ef4444; display:inline-flex; align-items:center; gap:6px;">
                                                <i class="fa-solid fa-ban"></i> Cancelled
                                            </span>
                                        ` : `
                                            <a href="booking-confirmation.html?ref=${encodeURIComponent(b.BookingReference || '')}&id=${b.BookingID}" class="btn-card-secondary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px; background:#f1f5f9; color:#0a192f; border:1.5px solid #cbd5e1;">
                                                <i class="fa-solid fa-file-invoice"></i> View Official Receipt
                                            </a>
                                            <a href="client-messages.html?providerId=${b.ProviderID}&providerName=${encodeURIComponent(providerName)}" class="btn-card-primary" style="padding:10px 20px; font-size:0.95rem; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:8px; border-radius:10px; background:#2563eb; color:#ffffff;">
                                                <i class="fa-solid fa-comments"></i> Chat Provider
                                            </a>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }

            // Populate Payment Balances tab (#payment-balances-cards-container)
            const balancesContainer = document.getElementById('payment-balances-cards-container');
            const totalDueAmountEl = document.getElementById('balances-total-due-amount');

            if (balancesContainer) {
                const dueBookings = bookings.filter(b => {
                    const statusLower = (b.BookingStatus || '').toLowerCase();
                    if (statusLower === 'cancelled' || statusLower === 'rejected') return false;
                    const totalAmountVal = parseFloat(b.TotalAmount || b.PackagePrice || 0);
                    const amountPaidVal = parseFloat(b.AmountPaid !== undefined && b.AmountPaid !== null ? b.AmountPaid : (b.PaymentType === 'downpayment' ? totalAmountVal * 0.5 : totalAmountVal));
                    const remainingBalVal = parseFloat(b.RemainingBalance !== undefined && b.RemainingBalance !== null ? b.RemainingBalance : (totalAmountVal - amountPaidVal));
                    return remainingBalVal > 0;
                });

                let sumOutstandingDue = 0;

                if (dueBookings.length > 0) {
                    const overdueCount = dueBookings.filter(b => {
                        const sDate = b.ServiceStartDate || b.EventDate;
                        if (!sDate || sDate === 'N/A') return false;
                        const match = String(sDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (!match) return false;
                        const targetMidnight = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10)).getTime();
                        const now = new Date();
                        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                        return Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24)) < 0;
                    }).length;

                    const overdueBannerHtml = overdueCount > 0 ? `
                        <div style="background:#fef2f2; border:1.5px solid #fecaca; border-left:6px solid #dc2626; border-radius:12px; padding:14px 20px; display:flex; align-items:center; gap:14px; margin-bottom:12px; box-shadow:0 2px 8px rgba(220,38,38,0.06);">
                            <i class="fa-solid fa-triangle-exclamation" style="font-size:1.6rem; color:#dc2626; flex-shrink:0;"></i>
                            <div>
                                <div style="color:#991b1b; font-weight:900; font-size:0.95rem;">Action Required: You have ${overdueCount} overdue payment balance${overdueCount === 1 ? '' : 's'}</div>
                                <div style="color:#7f1d1d; font-size:0.85rem; font-weight:600; margin-top:2px;">The event/service start date has already passed. Please settle overdue balances immediately to keep your account in good standing.</div>
                            </div>
                        </div>
                    ` : '';

                    balancesContainer.innerHTML = overdueBannerHtml + dueBookings.map(b => {
                        const totalAmountVal = parseFloat(b.TotalAmount || b.PackagePrice || 0);
                        const amountPaidVal = parseFloat(b.AmountPaid !== undefined && b.AmountPaid !== null ? b.AmountPaid : (b.PaymentType === 'downpayment' ? totalAmountVal * 0.5 : totalAmountVal));
                        const remainingBalVal = parseFloat(b.RemainingBalance !== undefined && b.RemainingBalance !== null ? b.RemainingBalance : (totalAmountVal - amountPaidVal));
                        sumOutstandingDue += remainingBalVal;

                        const sDate = b.ServiceStartDate || b.EventDate || 'N/A';
                        const eDate = b.ServiceEndDate || b.EventDate || sDate;
                        const dateText = (sDate === eDate) ? sDate : `${sDate} to ${eDate}`;
                        const formattedStart = formatDisplayTime(b.StartTime);
                        let clientName = b.ClientName;
                        if (Array.isArray(clientName)) clientName = clientName[0];
                        if (!clientName || clientName === 'null') {
                            clientName = (currentUser && (currentUser.name || currentUser.fullname || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : null))) || 'Verified Client';
                        }

                        // Overdue and Due Date Calculation
                        let isOverdue = false;
                        let daysOverdue = 0;
                        let isDueToday = false;
                        let isDueTomorrow = false;
                        let diffDays = null;

                        if (sDate && sDate !== 'N/A') {
                            const match = String(sDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
                            if (match) {
                                const targetYear = parseInt(match[1], 10);
                                const targetMonth = parseInt(match[2], 10) - 1;
                                const targetDay = parseInt(match[3], 10);
                                const targetMidnight = new Date(targetYear, targetMonth, targetDay).getTime();
                                const now = new Date();
                                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                    isOverdue = true;
                                    daysOverdue = Math.abs(diffDays);
                                } else if (diffDays === 0) {
                                    isDueToday = true;
                                } else if (diffDays === 1) {
                                    isDueTomorrow = true;
                                }
                            }
                        }

                        let statusHeaderBadgeHtml = '';
                        if (isOverdue) {
                            statusHeaderBadgeHtml = `
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <span style="background:#fee2e2; color:#b91c1c; border:1.5px solid #ef4444; padding:6px 14px; border-radius:20px; font-weight:900; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 6px rgba(220,38,38,0.15);">
                                        <i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i> Payment Overdue (${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago)
                                    </span>
                                    <span style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; padding:6px 14px; border-radius:20px; font-weight:800; font-size:0.85rem;">
                                        Partial Payment (50% Downpayment)
                                    </span>
                                </div>
                            `;
                        } else if (isDueToday) {
                            statusHeaderBadgeHtml = `
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <span style="background:#fef3c7; color:#b45309; border:1.5px solid #f59e0b; padding:6px 14px; border-radius:20px; font-weight:900; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px;">
                                        <i class="fa-solid fa-bell" style="color:#d97706;"></i> Balance Due Today!
                                    </span>
                                    <span style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; padding:6px 14px; border-radius:20px; font-weight:800; font-size:0.85rem;">
                                        Partial Payment (50% Downpayment)
                                    </span>
                                </div>
                            `;
                        } else if (isDueTomorrow) {
                            statusHeaderBadgeHtml = `
                                <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                    <span style="background:#fef9c3; color:#854d0e; border:1.5px solid #eab308; padding:6px 14px; border-radius:20px; font-weight:800; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px;">
                                        <i class="fa-solid fa-clock" style="color:#ca8a04;"></i> Due Tomorrow
                                    </span>
                                    <span style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; padding:6px 14px; border-radius:20px; font-weight:800; font-size:0.85rem;">
                                        Partial Payment (50% Downpayment)
                                    </span>
                                </div>
                            `;
                        } else {
                            statusHeaderBadgeHtml = `
                                <span style="background:#fff1f2; color:#be123c; border:1px solid #fecdd3; padding:6px 16px; border-radius:20px; font-weight:800; font-size:0.9rem;">
                                    Partial Payment (50% Downpayment)
                                </span>
                            `;
                        }

                        const cardBorderStyle = isOverdue
                            ? 'background:#fffafa; border:1.5px solid #fca5a5; border-left:6px solid #dc2626; border-radius:18px; padding:24px 28px; box-shadow:0 6px 20px rgba(220,38,38,0.08); display:flex; flex-direction:column; gap:16px;'
                            : 'background:#ffffff; border:1.5px solid #cbd5e1; border-left:6px solid #e11d48; border-radius:18px; padding:24px 28px; box-shadow:0 6px 20px rgba(10,25,47,0.06); display:flex; flex-direction:column; gap:16px;';

                        const dueBoxHtml = isOverdue ? `
                            <div style="font-size:0.82rem; font-weight:800; color:#991b1b; background:#fee2e2; border-radius:6px; padding:6px 10px; width:100%; box-sizing:border-box; text-align:center; border:1px solid #fca5a5; display:flex; align-items:center; justify-content:center; gap:6px;">
                                <i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;"></i> Overdue since <strong>${dateText}</strong> (${daysOverdue} day${daysOverdue === 1 ? '' : 's'} late)
                            </div>
                        ` : isDueToday ? `
                            <div style="font-size:0.82rem; font-weight:800; color:#92400e; background:#fef3c7; border-radius:6px; padding:6px 10px; width:100%; box-sizing:border-box; text-align:center; border:1px solid #fde68a; display:flex; align-items:center; justify-content:center; gap:6px;">
                                <i class="fa-solid fa-bell" style="color:#d97706;"></i> Due Date: <strong>${dateText}</strong> (Due Today!)
                            </div>
                        ` : isDueTomorrow ? `
                            <div style="font-size:0.82rem; font-weight:800; color:#854d0e; background:#fef9c3; border-radius:6px; padding:6px 10px; width:100%; box-sizing:border-box; text-align:center; border:1px solid #fef08a; display:flex; align-items:center; justify-content:center; gap:6px;">
                                <i class="fa-solid fa-clock" style="color:#ca8a04;"></i> Due Date: <strong>${dateText}</strong> (Due Tomorrow)
                            </div>
                        ` : `
                            <div style="font-size:0.8rem; font-weight:700; color:#475569; background:#fff1f2; border-radius:6px; padding:4px 10px; width:100%; box-sizing:border-box; text-align:center; border:1px solid #fecdd3;">
                                Due Date: <strong>${dateText}</strong> (On event day)
                            </div>
                        `;

                        const payBtnHtml = isOverdue ? `
                            <button type="button" class="btn-pay-balance-due btn-card-primary" 
                                    data-booking-id="${b.BookingID}" 
                                    data-booking-ref="${b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`}" 
                                    data-amount="${remainingBalVal}" 
                                    data-pkg-name="${encodeURIComponent(b.PackageName || 'Event Service Package')}" 
                                    data-client-name="${encodeURIComponent(clientName)}"
                                    data-client-email="${encodeURIComponent(b.ClientEmail || (currentUser && currentUser.email) || '')}"
                                    data-client-phone="${encodeURIComponent(b.ClientPhone || (currentUser && currentUser.phone) || '')}"
                                    style="padding:12px 28px; font-size:1rem; font-weight:900; border:none; border-radius:10px; background:linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 14px rgba(220,38,38,0.35); transition:all 0.2s ease;">
                                <i class="fa-solid fa-triangle-exclamation"></i> Pay Overdue Balance (₱${remainingBalVal.toLocaleString()})
                            </button>
                        ` : `
                            <button type="button" class="btn-pay-balance-due btn-card-primary" 
                                    data-booking-id="${b.BookingID}" 
                                    data-booking-ref="${b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`}" 
                                    data-amount="${remainingBalVal}" 
                                    data-pkg-name="${encodeURIComponent(b.PackageName || 'Event Service Package')}" 
                                    data-client-name="${encodeURIComponent(clientName)}"
                                    data-client-email="${encodeURIComponent(b.ClientEmail || (currentUser && currentUser.email) || '')}"
                                    data-client-phone="${encodeURIComponent(b.ClientPhone || (currentUser && currentUser.phone) || '')}"
                                    style="padding:12px 28px; font-size:1rem; font-weight:800; border:none; border-radius:10px; background:linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color:#ffffff; cursor:pointer; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 14px rgba(37,99,235,0.3); transition:all 0.2s ease;">
                                <i class="fa-solid fa-credit-card"></i> Pay Remaining Balance (₱${remainingBalVal.toLocaleString()})
                            </button>
                        `;

                        return `
                            <div class="booking-balance-card" style="${cardBorderStyle}">
                                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; border-bottom:1px solid #e2e8f0; padding-bottom:14px;">
                                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
                                        <span style="font-size:1.1rem; font-weight:900; color:#0a192f;">Ref: ${b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`}</span>
                                        <span style="font-size:0.88rem; color:#64748b; font-weight:600;">Booked on ${new Date(b.CreatedAt).toLocaleDateString('en-US', {month:'short', day:'2-digit', year:'numeric'})}</span>
                                        <span style="font-size:0.88rem; color:#1e293b; font-weight:700; background:#f1f5f9; padding:3px 10px; border-radius:6px;">Booked by: <strong>${clientName}</strong></span>
                                        ${b.EventType ? `<span style="font-size:0.82rem; color:#2563eb; font-weight:800; background:#eff6ff; border:1px solid #bfdbfe; padding:2px 8px; border-radius:6px;">${b.EventType}</span>` : ''}
                                    </div>
                                    ${statusHeaderBadgeHtml}
                                </div>

                                <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
                                    <img src="${b.ProviderAvatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(b.ProviderName || 'Provider') + '&background=0084ff&color=fff'}" alt="${b.ProviderName || 'Provider'}" style="width:75px; height:75px; border-radius:14px; object-fit:cover; border:1px solid #e2e8f0; flex-shrink:0;" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Provider&background=0084ff&color=fff';">
                                    <div style="flex:1; min-width:260px;">
                                        <h4 style="margin:0 0 6px 0; font-size:1.25rem; font-weight:900; color:#0a192f;">${b.PackageName || 'Event Service Package'}</h4>
                                        <div style="font-size:1rem; font-weight:700; color:#2563eb; margin-bottom:10px;">${b.ProviderName || 'Sound & Lights Provider'}</div>
                                        
                                        <div style="font-size:0.92rem; color:#334155; font-weight:600; display:flex; flex-direction:column; gap:8px;">
                                            <div style="display:flex; flex-wrap:wrap; gap:16px;">
                                                <span>Client: <strong style="color:#0f172a;">${clientName}</strong></span>
                                                <span>Date: <strong style="color:#0f172a;">${dateText}</strong></span>
                                                <span>Start Time: <strong style="color:#0f172a;">${formattedStart}</strong></span>
                                            </div>
                                            <div style="display:flex; flex-wrap:wrap; gap:16px;">
                                                <span>Venue: <strong style="color:#0f172a;">${b.VenueName || 'Private Event Venue'}</strong></span>
                                                <span>Location: <strong style="color:#0f172a;">${b.EventAddress || (b.EventPlace ? b.EventPlace + ', Batangas' : 'Batangas')}</strong></span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Due and Financial Breakdown Box -->
                                    <div style="text-align:right; min-width:240px; display:flex; flex-direction:column; gap:8px; align-items:flex-end; background:${isOverdue ? '#fef2f2' : '#f8fafc'}; border:1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}; padding:16px 20px; border-radius:14px;">
                                        <div style="display:flex; justify-content:space-between; width:100%; gap:16px;">
                                            <span style="font-size:0.85rem; font-weight:700; color:#64748b;">Total Package & Transpo:</span>
                                            <span style="font-size:0.95rem; font-weight:800; color:#0a192f;">₱${totalAmountVal.toLocaleString()}</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; width:100%; gap:16px;">
                                            <span style="font-size:0.85rem; font-weight:700; color:#059669;">Initial Deposit Paid:</span>
                                            <span style="font-size:0.95rem; font-weight:800; color:#059669;">-₱${amountPaidVal.toLocaleString()}</span>
                                        </div>
                                        <div style="display:flex; justify-content:space-between; width:100%; gap:16px; border-top:1.5px dashed ${isOverdue ? '#f87171' : '#cbd5e1'}; padding-top:8px;">
                                            <span style="font-size:0.9rem; font-weight:800; color:${isOverdue ? '#b91c1c' : '#be123c'};">${isOverdue ? 'Overdue Balance Due:' : 'Remaining Due:'}</span>
                                            <span style="font-size:1.45rem; font-weight:900; color:${isOverdue ? '#dc2626' : '#e11d48'};">₱${remainingBalVal.toLocaleString()}</span>
                                        </div>
                                        ${dueBoxHtml}
                                    </div>
                                </div>

                                <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid #e2e8f0; padding-top:14px; flex-wrap:wrap;">
                                    ${payBtnHtml}
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    balancesContainer.innerHTML = `
                        <div id="payment-balances-empty-msg" style="text-align:center; padding:48px 24px; background:#ffffff; border-radius:14px; border:1px solid #cbd5e1; box-shadow:0 2px 8px rgba(10,25,47,0.04);">
                            <i class="fa-solid fa-circle-check" style="font-size:2.5rem; color:#10b981; margin-bottom:12px; display:block;"></i>
                            <h3 style="color:#0a192f; margin:0 0 6px 0; font-size:1.15rem; font-weight:800;">No outstanding balances!</h3>
                            <p style="color:#64748b; font-size:0.88rem; font-weight:500; margin:0;">All your bookings are fully settled. Any future bookings with a 50% downpayment will show their remaining balance here.</p>
                        </div>
                    `;
                }

                if (totalDueAmountEl) {
                    totalDueAmountEl.textContent = `₱${sumOutstandingDue.toLocaleString()}`;
                }
            }
        } catch (err) {
            console.warn('Error fetching user bookings:', err);
        }
    };

    window.renderMyBookingsCards = window.fetchUserBookings;

    // 4. GLOBAL DELEGATED EVENT LISTENER FOR ALL CLICK INTERACTIONS
    document.addEventListener('click', async (e) => {
        // -1. Pay Remaining Balance Button -> Direct to PayMongo Test Payment
        const payBalanceBtn = e.target.closest('.btn-pay-balance-due');
        if (payBalanceBtn) {
            e.preventDefault();
            e.stopPropagation();

            const bookingId = payBalanceBtn.getAttribute('data-booking-id');
            const bookingRef = payBalanceBtn.getAttribute('data-booking-ref');
            const amount = parseFloat(payBalanceBtn.getAttribute('data-amount') || 0);
            const pkgName = decodeURIComponent(payBalanceBtn.getAttribute('data-pkg-name') || 'Event Package');
            const clientName = decodeURIComponent(payBalanceBtn.getAttribute('data-client-name') || '');
            const clientEmail = decodeURIComponent(payBalanceBtn.getAttribute('data-client-email') || '');
            const clientPhone = decodeURIComponent(payBalanceBtn.getAttribute('data-client-phone') || '');

            if (!amount || amount <= 0) {
                if (typeof showToast === 'function') showToast('No outstanding balance due for this booking.', 'info');
                return;
            }

            const origHtml = payBalanceBtn.innerHTML;
            payBalanceBtn.disabled = true;
            payBalanceBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Initializing PayMongo...';

            try {
                const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch('/api/payments/paymongo/checkout', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        amount: amount,
                        packageName: `Remaining Balance: ${pkgName} (${bookingRef})`,
                        bookingReference: bookingRef,
                        paymentType: 'full',
                        paymentMethod: 'all',
                        clientEmail: clientEmail,
                        clientName: clientName,
                        clientPhone: clientPhone
                    })
                });

                const data = await res.json();

                if (res.ok && data.success && data.checkoutUrl) {
                    if (typeof showToast === 'function') showToast('✓ Directing to PayMongo test payment gateway...', 'success');
                    setTimeout(() => {
                        window.location.href = data.checkoutUrl;
                    }, 400);
                } else {
                    if (typeof showToast === 'function') showToast(`⚠️ ${data.message || 'Failed to initialize PayMongo checkout.'}`, 'error');
                    payBalanceBtn.disabled = false;
                    payBalanceBtn.innerHTML = origHtml;
                }
            } catch (err) {
                console.error('PayMongo balance checkout error:', err);
                if (typeof showToast === 'function') showToast('Network error connecting to PayMongo gateway.', 'error');
                payBalanceBtn.disabled = false;
                payBalanceBtn.innerHTML = origHtml;
            }
            return;
        }

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

        // A. Profile Subtab Buttons (My Bookings | Booking History | Account Settings | Payment Balances | Wallet)
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
                settings: document.getElementById('profile-sec-settings'),
                balances: document.getElementById('profile-sec-balances'),
                wallet: document.getElementById('profile-sec-wallet')
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

            if (targetSec === 'wallet' && typeof window.loadClientWalletData === 'function') {
                window.loadClientWalletData();
            }
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
            const savedPref = JSON.parse(localStorage.getItem('soundsphere_pref_notif') || '{"emailNotif":true,"inappNotif":true}');
            const emailBox = document.getElementById('pref-email-notif');
            const inappBox = document.getElementById('pref-inapp-notif');
            if (emailBox) emailBox.checked = savedPref.emailNotif !== false;
            if (inappBox) inappBox.checked = savedPref.inappNotif !== false;

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
            const savedPrivacy = JSON.parse(localStorage.getItem('soundsphere_pref_privacy') || '{"showPhone":true}');
            const showPhoneBox = document.getElementById('pref-show-phone');
            if (showPhoneBox) showPhoneBox.checked = savedPrivacy.showPhone !== false;

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
            if (providerAppModal) {
                // Auto-fill user information if available
                const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : {};
                const ownerFirst = document.getElementById('app-owner-firstname');
                const ownerMiddle = document.getElementById('app-owner-middlename');
                const ownerLast = document.getElementById('app-owner-lastname');
                const bizPhone = document.getElementById('app-biz-phone');
                const bizEmail = document.getElementById('app-biz-email');

                if (ownerFirst && !ownerFirst.value && user.firstName) ownerFirst.value = user.firstName;
                if (ownerMiddle && !ownerMiddle.value && user.middleName) ownerMiddle.value = user.middleName;
                if (ownerLast && !ownerLast.value && user.lastName) ownerLast.value = user.lastName;
                if (bizPhone && !bizPhone.value && user.phone) bizPhone.value = String(user.phone).replace(/\D/g, '');
                if (bizEmail && !bizEmail.value && user.email) bizEmail.value = user.email;

                providerAppModal.classList.remove('hidden');
            }
            return;
        }

        // G. Close / Exit Service Provider Application Fullscreen View
        const closeProviderAppBtn = e.target.closest('#close-provider-app-modal-btn, #close-provider-app-modal-btn-x, .close-provider-app-btn');
        if (closeProviderAppBtn) {
            e.preventDefault();
            const providerAppModal = document.getElementById('modal-provider-application');
            if (providerAppModal) providerAppModal.classList.add('hidden');
            return;
        }
    });

    // Escape key closes fullscreen provider application if active
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const otpModal = document.getElementById('modal-provider-email-otp');
            if (otpModal && !otpModal.classList.contains('hidden')) return;
            const providerAppModal = document.getElementById('modal-provider-application');
            if (providerAppModal && !providerAppModal.classList.contains('hidden')) {
                providerAppModal.classList.add('hidden');
            }
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
            const ownerFirst = document.getElementById('app-owner-firstname')?.value.trim() || '';
            const ownerMiddle = document.getElementById('app-owner-middlename')?.value.trim() || '';
            const ownerLast = document.getElementById('app-owner-lastname')?.value.trim() || '';
            const ownerFullName = [ownerFirst, ownerMiddle, ownerLast].filter(Boolean).join(' ') || 'Denver Cabrera';
            const bizPhone = document.getElementById('app-biz-phone')?.value || '09516028992';
            const bizEmail = document.getElementById('app-biz-email')?.value || 'dendenescondecabrera17@gmail.com';
            const permitIssued = document.getElementById('app-permit-issued')?.value || '';
            const permitExpiry = document.getElementById('app-permit-expiry')?.value || '';
            const selectedServices = Array.from(document.querySelectorAll('.app-service-chk:checked')).map(c => c.value);
            const selectedLocations = Array.from(document.querySelectorAll('.app-location-chk:checked')).map(c => c.value);
            const bizDesc = selectedServices.length > 0 ? selectedServices.join(', ') : 'Professional lights & sound rental.';

            const summaryBizName = document.getElementById('summary-biz-name');
            const summaryOwnerName = document.getElementById('summary-owner-name');
            const summaryBizPhone = document.getElementById('summary-biz-phone');
            const summaryBizEmail = document.getElementById('summary-biz-email');
            const summaryBizAddress = document.getElementById('summary-biz-address');
            const summaryGovtIdFront = document.getElementById('summary-govt-id-front');
            const summaryGovtIdBack = document.getElementById('summary-govt-id-back');
            const summaryPermit = document.getElementById('summary-permit');
            const summaryPermitIssued = document.getElementById('summary-permit-issued');
            const summaryPermitExpiry = document.getElementById('summary-permit-expiry');
            const summaryServices = document.getElementById('summary-services');
            const summaryLocations = document.getElementById('summary-locations');
            const summaryDescription = document.getElementById('summary-description');

            const bizAddress = document.getElementById('app-biz-address')?.value.trim() || 'Balayan, Batangas';

            if (summaryBizName) summaryBizName.textContent = bizName;
            if (summaryOwnerName) summaryOwnerName.textContent = ownerFullName;
            if (summaryBizPhone) summaryBizPhone.textContent = bizPhone;
            if (summaryBizEmail) summaryBizEmail.textContent = bizEmail;
            if (summaryBizAddress) summaryBizAddress.textContent = bizAddress;
            if (summaryGovtIdFront) summaryGovtIdFront.textContent = window.providerAppGovtIdFrontData ? 'Uploaded ✓' : 'Attached';
            if (summaryGovtIdBack) summaryGovtIdBack.textContent = window.providerAppGovtIdBackData ? 'Uploaded ✓' : 'Attached';
            if (summaryPermit) summaryPermit.textContent = window.providerAppPermitData ? 'Uploaded ✓' : 'Attached';
            if (summaryPermitIssued) summaryPermitIssued.textContent = permitIssued ? new Date(permitIssued).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not specified';
            if (summaryPermitExpiry) summaryPermitExpiry.textContent = permitExpiry ? new Date(permitExpiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not specified';
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

    // Global image state for Application wizard
    window.providerAppGovtIdFrontData = null;
    window.providerAppGovtIdBackData = null;
    window.providerAppPermitData = null;

    window.clearGovtIdFrontUpload = () => {
        window.providerAppGovtIdFrontData = null;
        const input = document.getElementById('app-govt-id-front-input');
        if (input) input.value = '';
        const previewWrap = document.getElementById('govt-id-front-preview-wrap');
        const placeholder = document.getElementById('govt-id-front-placeholder');
        if (previewWrap) previewWrap.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    };

    window.clearGovtIdBackUpload = () => {
        window.providerAppGovtIdBackData = null;
        const input = document.getElementById('app-govt-id-back-input');
        if (input) input.value = '';
        const previewWrap = document.getElementById('govt-id-back-preview-wrap');
        const placeholder = document.getElementById('govt-id-back-placeholder');
        if (previewWrap) previewWrap.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    };

    window.clearPermitUpload = () => {
        window.providerAppPermitData = null;
        const input = document.getElementById('app-permit-input');
        if (input) input.value = '';
        const previewWrap = document.getElementById('permit-preview-wrap');
        const placeholder = document.getElementById('permit-placeholder');
        if (previewWrap) previewWrap.style.display = 'none';
        if (placeholder) placeholder.style.display = 'block';
    };

    // Document file change listeners
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'app-govt-id-front-input') {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('⚠ Valid ID (Front) image file must be less than 5MB.', 'warning');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (re) => {
                    window.providerAppGovtIdFrontData = re.target.result;
                    const previewImg = document.getElementById('govt-id-front-preview-img');
                    const fileName = document.getElementById('govt-id-front-filename');
                    const previewWrap = document.getElementById('govt-id-front-preview-wrap');
                    const placeholder = document.getElementById('govt-id-front-placeholder');
                    if (previewImg) previewImg.src = re.target.result;
                    if (fileName) fileName.textContent = file.name;
                    if (previewWrap) previewWrap.style.display = 'flex';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        } else if (e.target && e.target.id === 'app-govt-id-back-input') {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('⚠ Valid ID (Back) image file must be less than 5MB.', 'warning');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (re) => {
                    window.providerAppGovtIdBackData = re.target.result;
                    const previewImg = document.getElementById('govt-id-back-preview-img');
                    const fileName = document.getElementById('govt-id-back-filename');
                    const previewWrap = document.getElementById('govt-id-back-preview-wrap');
                    const placeholder = document.getElementById('govt-id-back-placeholder');
                    if (previewImg) previewImg.src = re.target.result;
                    if (fileName) fileName.textContent = file.name;
                    if (previewWrap) previewWrap.style.display = 'flex';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        } else if (e.target && e.target.id === 'app-permit-input') {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showToast('⚠ Business Permit image must be less than 5MB.', 'warning');
                    e.target.value = '';
                    return;
                }
                const reader = new FileReader();
                reader.onload = (re) => {
                    window.providerAppPermitData = re.target.result;
                    const previewImg = document.getElementById('permit-preview-img');
                    const fileName = document.getElementById('permit-filename');
                    const previewWrap = document.getElementById('permit-preview-wrap');
                    const placeholder = document.getElementById('permit-placeholder');
                    if (previewImg) previewImg.src = re.target.result;
                    if (fileName) fileName.textContent = file.name;
                    if (previewWrap) previewWrap.style.display = 'flex';
                    if (placeholder) placeholder.style.display = 'none';
                };
                reader.readAsDataURL(file);
            }
        }
    });

    // Global OTP Verification State for Provider Application
    window.providerAppEmailVerified = null;
    window.providerOtpTimer = null;
    window.providerOtpCooldownTimer = null;

    // Reset verified email if user changes the email input field
    const bizEmailInput = document.getElementById('app-biz-email');
    if (bizEmailInput) {
        bizEmailInput.addEventListener('input', () => {
            if (window.providerAppEmailVerified && window.providerAppEmailVerified !== bizEmailInput.value.trim().toLowerCase()) {
                window.providerAppEmailVerified = null;
            }
        });
    }

    // Start 5-minute countdown for OTP expiration
    window.startProviderOtpCountdown = (durationSeconds = 300) => {
        if (window.providerOtpTimer) clearInterval(window.providerOtpTimer);
        let remaining = durationSeconds;
        const countdownEl = document.getElementById('provider-otp-countdown');
        const timerMsgEl = document.getElementById('provider-otp-timer-msg');

        const updateDisplay = () => {
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            if (countdownEl) {
                countdownEl.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            }
            if (remaining <= 0) {
                clearInterval(window.providerOtpTimer);
                if (timerMsgEl) {
                    timerMsgEl.innerHTML = '<span style="color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Code expired. Please click Resend Code.</span>';
                }
            }
            remaining--;
        };

        if (timerMsgEl) {
            timerMsgEl.innerHTML = '<i class="fa-solid fa-stopwatch"></i> Code expires in <span id="provider-otp-countdown">05:00</span>';
        }
        updateDisplay();
        window.providerOtpTimer = setInterval(updateDisplay, 1000);
    };

    // Trigger Send OTP Email to Gmail
    window.triggerProviderAppSendOtp = async (isResend = false) => {
        const bizName = document.getElementById('app-biz-name')?.value.trim() || 'SoundSphere Provider';
        const ownerFirst = document.getElementById('app-owner-firstname')?.value.trim() || '';
        const ownerMiddle = document.getElementById('app-owner-middlename')?.value.trim() || '';
        const ownerLast = document.getElementById('app-owner-lastname')?.value.trim() || '';
        const ownerFullName = [ownerFirst, ownerMiddle, ownerLast].filter(Boolean).join(' ') || 'Applicant';
        const bizEmail = document.getElementById('app-biz-email')?.value.trim().toLowerCase() || '';

        if (!bizEmail) {
            showToast('⚠ Please provide a valid Business Email.', 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(bizEmail)) {
            showToast('⚠ Please enter a valid email address.', 'warning');
            return;
        }

        const btnVerify = document.getElementById('btn-verify-provider-otp');
        const btnResend = document.getElementById('btn-resend-provider-otp');

        if (isResend && btnResend) {
            btnResend.disabled = true;
            btnResend.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...';
        }

        showToast(`📧 Sending verification code to ${bizEmail}...`, 'info');

        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

            const response = await fetch('/api/provider-applications/send-otp', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    email: bizEmail,
                    businessName: bizName,
                    ownerName: ownerFullName
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showToast(`✕ ${data.message || 'Failed to send OTP code.'}`, 'error');
                if (isResend && btnResend) {
                    btnResend.disabled = false;
                    btnResend.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Resend Code';
                }
                return;
            }

            // Populate and open OTP Modal
            const targetEmailEl = document.getElementById('provider-otp-target-email');
            if (targetEmailEl) targetEmailEl.textContent = bizEmail;

            const otpInput = document.getElementById('provider-app-otp-input');
            if (otpInput) {
                otpInput.value = '';
                setTimeout(() => otpInput.focus(), 150);
            }

            const otpModal = document.getElementById('modal-provider-email-otp');
            if (otpModal) otpModal.classList.remove('hidden');

            window.startProviderOtpCountdown(300);

            showToast(`✓ Verification code sent to ${bizEmail}!`, 'success');

            // Handle Resend cooldown (30s)
            if (btnResend) {
                let cooldown = 30;
                btnResend.disabled = true;
                btnResend.style.opacity = '0.6';
                btnResend.style.cursor = 'not-allowed';
                
                if (window.providerOtpCooldownTimer) clearInterval(window.providerOtpCooldownTimer);
                window.providerOtpCooldownTimer = setInterval(() => {
                    btnResend.innerHTML = `<i class="fa-solid fa-clock"></i> Resend (${cooldown}s)`;
                    cooldown--;
                    if (cooldown < 0) {
                        clearInterval(window.providerOtpCooldownTimer);
                        btnResend.disabled = false;
                        btnResend.style.opacity = '1';
                        btnResend.style.cursor = 'pointer';
                        btnResend.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Resend Code';
                    }
                }, 1000);
            }

        } catch (err) {
            console.error('Error sending provider OTP:', err);
            showToast('✕ Network error while sending OTP. Please check your connection.', 'error');
            if (isResend && btnResend) {
                btnResend.disabled = false;
                btnResend.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Resend Code';
            }
        }
    };

    // Verify OTP Code
    window.verifyProviderAppOtp = async () => {
        const bizEmail = document.getElementById('app-biz-email')?.value.trim().toLowerCase() || '';
        const otpInput = document.getElementById('provider-app-otp-input');
        const otpCode = otpInput?.value.trim() || '';

        if (!otpCode || otpCode.length !== 6 || !/^\d{6}$/.test(otpCode)) {
            showToast('⚠ Please enter the complete 6-digit numeric verification code.', 'warning');
            if (otpInput) otpInput.focus();
            return;
        }

        const btnVerify = document.getElementById('btn-verify-provider-otp');
        let origHTML = '<i class="fa-solid fa-circle-check"></i> Verify & Continue';
        if (btnVerify) {
            origHTML = btnVerify.innerHTML;
            btnVerify.disabled = true;
            btnVerify.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Verifying...';
            btnVerify.style.opacity = '0.7';
        }

        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

            const response = await fetch('/api/provider-applications/verify-otp', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    email: bizEmail,
                    otp: otpCode
                })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                showToast(`✕ ${data.message || 'Incorrect verification code.'}`, 'error');
                if (btnVerify) {
                    btnVerify.disabled = false;
                    btnVerify.innerHTML = origHTML;
                    btnVerify.style.opacity = '1';
                }
                if (otpInput) {
                    otpInput.select();
                    otpInput.focus();
                }
                return;
            }

            // OTP verified successfully!
            window.providerAppEmailVerified = bizEmail;

            if (window.providerOtpTimer) clearInterval(window.providerOtpTimer);
            if (window.providerOtpCooldownTimer) clearInterval(window.providerOtpCooldownTimer);

            // Hide OTP modal
            const otpModal = document.getElementById('modal-provider-email-otp');
            if (otpModal) otpModal.classList.add('hidden');

            if (btnVerify) {
                btnVerify.disabled = false;
                btnVerify.innerHTML = origHTML;
                btnVerify.style.opacity = '1';
            }

            showToast('✓ Business Email verified successfully!', 'success');

            // Automatically advance to Step 2!
            updateWizardUI(2);

        } catch (err) {
            console.error('Error verifying OTP:', err);
            showToast('✕ Network error while verifying code. Please try again.', 'error');
            if (btnVerify) {
                btnVerify.disabled = false;
                btnVerify.innerHTML = origHTML;
                btnVerify.style.opacity = '1';
            }
        }
    };

    // Close / Cancel OTP Modal
    const btnCancelOtp = document.getElementById('btn-cancel-provider-otp');
    if (btnCancelOtp) {
        btnCancelOtp.addEventListener('click', () => {
            const otpModal = document.getElementById('modal-provider-email-otp');
            if (otpModal) otpModal.classList.add('hidden');
            if (window.providerOtpTimer) clearInterval(window.providerOtpTimer);
        });
    }

    // Resend OTP Click
    const btnResendOtp = document.getElementById('btn-resend-provider-otp');
    if (btnResendOtp) {
        btnResendOtp.addEventListener('click', () => {
            window.triggerProviderAppSendOtp(true);
        });
    }

    // Verify OTP Button Click
    const btnVerifyOtp = document.getElementById('btn-verify-provider-otp');
    if (btnVerifyOtp) {
        btnVerifyOtp.addEventListener('click', () => {
            window.verifyProviderAppOtp();
        });
    }

    // Enter key support on OTP input
    const otpInputEl = document.getElementById('provider-app-otp-input');
    if (otpInputEl) {
        otpInputEl.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                window.verifyProviderAppOtp();
            }
        });
    }

    // Strict numeric enforcement on Business Phone Number and all phone fields (numbers only)
    const bizPhoneInput = document.getElementById('app-biz-phone');
    if (bizPhoneInput) {
        bizPhoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Global listener ensuring all phone inputs only accept numbers
    document.addEventListener('input', (e) => {
        if (!e.target) return;
        if (e.target.id === 'app-biz-phone' || 
            e.target.id === 'profile-phone' || 
            e.target.id === 'booking-client-phone' || 
            e.target.id === 'edit-provider-phone' || 
            e.target.id === 'modal-reg-phone' || 
            (e.target.tagName === 'INPUT' && e.target.type === 'tel' && !e.target.classList.contains('otp-digit-input'))) {
            e.target.value = e.target.value.replace(/\D/g, '');
        }
    });

    // Wizard Next Button Click
    const btnWizardNext = document.getElementById('btn-wizard-next');
    if (btnWizardNext) {
        btnWizardNext.addEventListener('click', () => {
            if (currentWizardStep === 1) {
                const bizName = document.getElementById('app-biz-name')?.value.trim();
                const ownerFirst = document.getElementById('app-owner-firstname')?.value.trim();
                const ownerLast = document.getElementById('app-owner-lastname')?.value.trim();
                const bizPhone = document.getElementById('app-biz-phone')?.value.trim();
                const bizEmail = document.getElementById('app-biz-email')?.value.trim().toLowerCase();
                const bizAddress = document.getElementById('app-biz-address')?.value.trim();
                const permitIssued = document.getElementById('app-permit-issued')?.value;
                const permitExpiry = document.getElementById('app-permit-expiry')?.value;

                if (!bizName) {
                    showToast('⚠ Please enter your Business Name.', 'warning');
                    return;
                }
                if (!ownerFirst || !ownerLast) {
                    showToast('⚠ Please enter the owner First Name and Last Name.', 'warning');
                    return;
                }
                if (!bizPhone || !bizEmail) {
                    showToast('⚠ Please fill in contact details (Phone and Email).', 'warning');
                    return;
                }
                if (!/^\d{10,11}$/.test(bizPhone)) {
                    showToast('⚠ Business phone number must be numbers only (10-11 digits, e.g. 09171234567).', 'warning');
                    return;
                }
                if (!bizAddress) {
                    showToast('⚠ Please enter your complete Business Address.', 'warning');
                    return;
                }
                if (!window.providerAppGovtIdFrontData && !document.getElementById('app-govt-id-front-input')?.files?.length) {
                    showToast('⚠ Please upload the Front Side of your Valid Government ID.', 'warning');
                    return;
                }
                if (!window.providerAppGovtIdBackData && !document.getElementById('app-govt-id-back-input')?.files?.length) {
                    showToast('⚠ Please upload the Back Side of your Valid Government ID.', 'warning');
                    return;
                }
                if (!window.providerAppPermitData && !document.getElementById('app-permit-input')?.files?.length) {
                    showToast('⚠ Please upload an image of your Business Permit.', 'warning');
                    return;
                }
                if (!permitIssued) {
                    showToast('⚠ Please select the Business Permit date issued.', 'warning');
                    return;
                }
                if (!permitExpiry) {
                    showToast('⚠ Please select the Business Permit expiration date.', 'warning');
                    return;
                }

                // Verify Email with OTP before proceeding to Step 2
                if (!window.providerAppEmailVerified || window.providerAppEmailVerified !== bizEmail) {
                    window.triggerProviderAppSendOtp();
                    return;
                }
            } else if (currentWizardStep === 2) {
                const selectedServices = document.querySelectorAll('.app-service-chk:checked');
                if (selectedServices.length === 0) {
                    showToast('⚠ Please select at least one service package.', 'warning');
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
            const ownerFirst = document.getElementById('app-owner-firstname')?.value.trim() || '';
            const ownerMiddle = document.getElementById('app-owner-middlename')?.value.trim() || '';
            const ownerLast = document.getElementById('app-owner-lastname')?.value.trim() || '';
            const ownerFullName = [ownerFirst, ownerMiddle, ownerLast].filter(Boolean).join(' ');
            const bizPhone = document.getElementById('app-biz-phone')?.value.trim() || '';
            const bizEmail = document.getElementById('app-biz-email')?.value.trim() || '';
            const bizAddress = document.getElementById('app-biz-address')?.value.trim() || '';
            const permitIssued = document.getElementById('app-permit-issued')?.value || null;
            const permitExpiry = document.getElementById('app-permit-expiry')?.value || null;
            const selectedServices = Array.from(document.querySelectorAll('.app-service-chk:checked')).map(c => c.value);
            const selectedLocations = Array.from(document.querySelectorAll('.app-location-chk:checked')).map(c => c.value);
            const bizDesc = selectedServices.length > 0 ? selectedServices.join(', ') : 'Professional sound, lighting, and stage equipment rentals.';

            // Validation Checks
            if (!bizName) {
                showToast('⚠ Please enter your Business Name.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!ownerFirst || !ownerLast) {
                showToast('⚠ Please enter the owner First Name and Last Name.', 'warning');
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
            if (!/^\d{10,11}$/.test(bizPhone)) {
                showToast('⚠ Business phone number must be numbers only (10-11 digits, e.g. 09171234567).', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!bizAddress) {
                showToast('⚠ Please enter your complete Business Address.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!window.providerAppGovtIdFrontData) {
                showToast('⚠ Please upload the Front Side of your Valid ID.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!window.providerAppGovtIdBackData) {
                showToast('⚠ Please upload the Back Side of your Valid ID.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!window.providerAppPermitData) {
                showToast('⚠ Please upload your Business Permit image.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!permitIssued) {
                showToast('⚠ Please select the Business Permit date issued.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (!permitExpiry) {
                showToast('⚠ Please select the Business Permit expiry date.', 'warning');
                if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = originalBtnHTML; btnSubmit.style.opacity = '1'; btnSubmit.style.cursor = 'pointer'; }
                window.isProviderAppSubmitting = false;
                return;
            }
            if (selectedServices.length === 0) {
                showToast('⚠ Please select at least one Service package.', 'warning');
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
                ownerName: ownerFullName || user.name || (user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : bizName),
                businessAddress: bizAddress || selectedLocations.join(', ') || 'Balayan, Batangas',
                coverageArea: selectedLocations.join(', ') || 'Balayan, Batangas',
                contactNumber: bizPhone,
                govtIdUrl: window.providerAppGovtIdFrontData || 'uploaded_govt_id_front.png',
                govtIdBackUrl: window.providerAppGovtIdBackData || 'uploaded_govt_id_back.png',
                businessPermitUrl: window.providerAppPermitData || 'uploaded_permit.png',
                permitIssuedDate: permitIssued,
                permitExpiryDate: permitExpiry
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

        const isProviderRole = Boolean(
            authUser.role === 'ServiceProvider' ||
            authUser.role === 'Provider' ||
            authUser.role === 'serviceprovider' ||
            authUser.RoleName === 'ServiceProvider' ||
            authUser.RoleName === 'Provider' ||
            authUser.roleId === 3 ||
            authUser.RoleID === 3
        );

        if (isProviderRole) {
            currentStatus = 'Approved';
        }

        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
            if (token && token !== 'token' && token.split('.').length === 3 && currentStatus !== 'Approved') {
                const headers = { 'Authorization': `Bearer ${token}` };
                const res = await fetch('/api/provider-applications/my-application', { headers });

                if (res.status === 401) {
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
            }
        } catch (e) {
            console.warn('Application status fetch notice:', e.message);
        }

        const badge = document.getElementById('provider-app-status-badge');
        const desc = document.getElementById('provider-app-desc-text');
        const btnContainer = document.getElementById('provider-app-btn-container');

        const providerDashLink = document.getElementById('dropdown-provider-dashboard-link');
        const dropRole = document.getElementById('dropdown-user-role');

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
            if (providerDashLink) {
                providerDashLink.classList.add('hidden');
                providerDashLink.style.setProperty('display', 'none', 'important');
            }
            if (dropRole) dropRole.textContent = 'Client Account';
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
            if (providerDashLink) {
                providerDashLink.classList.remove('hidden');
                providerDashLink.style.setProperty('display', 'flex', 'important');
            }
            if (dropRole) dropRole.textContent = 'Service Provider';
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
            if (providerDashLink) {
                providerDashLink.classList.add('hidden');
                providerDashLink.style.setProperty('display', 'none', 'important');
            }
            if (dropRole) dropRole.textContent = 'Client Account';
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
            if (providerDashLink) {
                providerDashLink.classList.add('hidden');
                providerDashLink.style.setProperty('display', 'none', 'important');
            }
            if (dropRole) dropRole.textContent = 'Client Account';
        }
    };

    // Make updateAccountSettingsProviderStatus available globally
    window.updateAccountSettingsProviderStatus = updateAccountSettingsProviderStatus;

    // 7. INITIAL VIEW & BROWSER NAVIGATION BACK/FORWARD LOGIC
    const handleNavState = () => {
        let activeView = window.location.hash.replace('#', '') || sessionStorage.getItem('soundsphere_active_view') || 'home';
        if (activeView === 'balances') {
            activeView = 'profile';
            sessionStorage.setItem('soundsphere_active_subtab', 'balances');
        }
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

    // 8-B. CLIENT WALLET & REFUND PAYOUT CONTROLLER
    let activeClientWalletBalance = 0;

    window.loadClientWalletData = async function() {
        const balEl = document.getElementById('wallet-display-balance');
        const pendingEl = document.getElementById('wallet-pending-payout');
        const reqContainer = document.getElementById('wallet-requests-container');
        const txContainer = document.getElementById('wallet-transactions-container');
        const maxValLbl = document.getElementById('lbl-refund-max-val');
        const amtInput = document.getElementById('refund-input-amount');

        if (!balEl) return;

        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_jwt_token') || localStorage.getItem('token') || '');
            const authUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
            const userId = authUser ? (authUser.userId || authUser.id || authUser.UserID) : '';

            const url = `/api/wallet/my-wallet${userId ? `?userId=${userId}` : ''}`;
            const res = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });
            const resData = await res.json();
            if (!resData.success || !resData.data) {
                console.warn('Could not load wallet data:', resData.message);
                return;
            }

            const data = resData.data;
            activeClientWalletBalance = parseFloat(data.balance || 0);
            const pendingAmt = parseFloat(data.pendingAmount || 0);

            balEl.textContent = `₱${activeClientWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (pendingEl) {
                pendingEl.textContent = `₱${pendingAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            if (maxValLbl) {
                maxValLbl.textContent = `₱${activeClientWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
            if (amtInput) {
                amtInput.max = activeClientWalletBalance;
            }

            // Render Payout Requests sent to Cashier
            if (reqContainer) {
                const requests = data.refundRequests || [];
                if (requests.length === 0) {
                    reqContainer.innerHTML = `
                        <div style="text-align:center; padding:32px 16px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
                            <i class="fa-solid fa-clock-rotate-left" style="font-size:2rem; color:#94a3b8; margin-bottom:8px; display:block;"></i>
                            <p style="color:#64748b; font-size:0.9rem; margin:0; font-weight:700;">No refund payout requests yet.</p>
                            <p style="color:#94a3b8; font-size:0.82rem; margin:4px 0 0 0;">When you request a payout of your refund balance, the progress with the Cashier will appear here.</p>
                        </div>
                    `;
                } else {
                    reqContainer.innerHTML = `
                        <div style="overflow-x:auto;">
                            <table style="width:100%; border-collapse:collapse; font-size:0.88rem; text-align:left;">
                                <thead>
                                    <tr style="border-bottom:2px solid #e2e8f0; color:#475569; font-weight:700;">
                                        <th style="padding:10px 12px;">Req #</th>
                                        <th style="padding:10px 12px;">Amount</th>
                                        <th style="padding:10px 12px;">Channel</th>
                                        <th style="padding:10px 12px;">Destination Account</th>
                                        <th style="padding:10px 12px;">Requested Date</th>
                                        <th style="padding:10px 12px;">Status</th>
                                        <th style="padding:10px 12px;">Cashier Remarks / Ref</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${requests.map(r => {
                                        let badgeBg = '#fef3c7';
                                        let badgeColor = '#d97706';
                                        let badgeIcon = 'fa-hourglass-half';
                                        let statusLabel = 'Pending Cashier';

                                        if (r.Status === 'Approved') {
                                            badgeBg = '#d1fae5';
                                            badgeColor = '#059669';
                                            badgeIcon = 'fa-circle-check';
                                            statusLabel = 'Disbursed (Paid)';
                                        } else if (r.Status === 'Rejected') {
                                            badgeBg = '#fee2e2';
                                            badgeColor = '#dc2626';
                                            badgeIcon = 'fa-circle-xmark';
                                            statusLabel = 'Rejected (Returned)';
                                        }

                                        const dateStr = r.RequestedAt ? new Date(r.RequestedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
                                        const refLine = r.ReferenceNumber ? `<div style="font-weight:800; color:#0a192f;"><i class="fa-solid fa-receipt" style="color:#2563eb;"></i> Ref: ${r.ReferenceNumber}</div>` : '';
                                        const notesLine = r.AdminNotes ? `<div style="font-size:0.8rem; color:#64748b; margin-top:2px;">${r.AdminNotes}</div>` : '<div style="color:#94a3b8; font-size:0.8rem;">Awaiting manual transfer</div>';

                                        return `
                                            <tr style="border-bottom:1px solid #f1f5f9;">
                                                <td style="padding:12px; font-weight:800; color:#0a192f;">#REF-${r.RefundRequestID}</td>
                                                <td style="padding:12px; font-weight:900; color:#2563eb; font-size:0.95rem;">₱${parseFloat(r.Amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                                <td style="padding:12px;"><span style="background:#eff6ff; color:#1e40af; padding:3px 8px; border-radius:6px; font-weight:800; font-size:0.8rem;">${r.PayoutMethod || 'GCash'}</span></td>
                                                <td style="padding:12px;">
                                                    <div style="font-weight:700; color:#1e293b;">${r.AccountName || 'Account'}</div>
                                                    <div style="font-size:0.82rem; color:#64748b;">${r.AccountNumber || ''}</div>
                                                </td>
                                                <td style="padding:12px; color:#475569;">${dateStr}</td>
                                                <td style="padding:12px;">
                                                    <span style="display:inline-flex; align-items:center; gap:5px; background:${badgeBg}; color:${badgeColor}; padding:4px 10px; border-radius:20px; font-size:0.78rem; font-weight:800;">
                                                        <i class="fa-solid ${badgeIcon}"></i> ${statusLabel}
                                                    </span>
                                                </td>
                                                <td style="padding:12px;">${refLine}${notesLine}</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    `;
                }
            }

            // Render Wallet Activity & Refund History
            if (txContainer) {
                const txs = data.transactions || [];
                if (txs.length === 0) {
                    txContainer.innerHTML = `
                        <div style="text-align:center; padding:32px 16px; background:#f8fafc; border-radius:12px; border:1px dashed #cbd5e1;">
                            <i class="fa-solid fa-list-check" style="font-size:2rem; color:#94a3b8; margin-bottom:8px; display:block;"></i>
                            <p style="color:#64748b; font-size:0.9rem; margin:0; font-weight:700;">No wallet activity recorded yet.</p>
                            <p style="color:#94a3b8; font-size:0.82rem; margin:4px 0 0 0;">Cancelled booking refunds and payout withdrawals will be logged here.</p>
                        </div>
                    `;
                } else {
                    txContainer.innerHTML = `
                        <div style="display:flex; flex-direction:column; gap:10px;">
                            ${txs.map(t => {
                                const isPositive = parseFloat(t.Amount) > 0;
                                const amtSign = isPositive ? '+' : '';
                                const amtColor = isPositive ? '#10b981' : '#ef4444';
                                const iconClass = isPositive ? 'fa-arrow-down-left' : 'fa-arrow-up-right';
                                const iconBg = isPositive ? '#ecfdf5' : '#fef2f2';
                                const iconColor = isPositive ? '#059669' : '#dc2626';
                                const dateFormatted = t.CreatedAt ? new Date(t.CreatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';

                                return `
                                    <div style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; gap:12px; flex-wrap:wrap;">
                                        <div style="display:flex; align-items:center; gap:12px;">
                                            <div style="width:40px; height:40px; border-radius:10px; background:${iconBg}; color:${iconColor}; display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0;">
                                                <i class="fa-solid ${iconClass}"></i>
                                            </div>
                                            <div>
                                                <div style="font-weight:800; color:#0a192f; font-size:0.92rem;">${t.Description || 'Wallet Transaction'}</div>
                                                <div style="font-size:0.8rem; color:#64748b; margin-top:2px;">${dateFormatted} ${t.BookingReference ? `• Ref: ${t.BookingReference}` : ''}</div>
                                            </div>
                                        </div>
                                        <div style="text-align:right;">
                                            <div style="font-size:1.1rem; font-weight:900; color:${amtColor};">${amtSign}₱${Math.abs(parseFloat(t.Amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                            <div style="font-size:0.78rem; color:#64748b; font-weight:700;">Balance After: ₱${parseFloat(t.BalanceAfter).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.error('Wallet fetch error:', err);
        }
    };

    // Modal Triggers: Request Refund Payout
    const btnOpenWithdraw = document.getElementById('btn-open-wallet-withdraw');
    const modalRefund = document.getElementById('modal-refund-request');
    const btnCloseRefund = document.getElementById('close-refund-modal-btn');
    const btnCancelRefund = document.getElementById('btn-cancel-refund-modal');
    const btnMaxAmount = document.getElementById('btn-refund-max-amount');
    const formRefund = document.getElementById('form-refund-request');

    const openRefundModal = () => {
        if (!modalRefund) return;
        if (activeClientWalletBalance <= 0) {
            alert('Your Refund Wallet currently has ₱0.00.\n\nAutomatic refunds from cancelled bookings will appear here instantly. Once available, you can request a payout anytime.');
            return;
        }

        modalRefund.classList.remove('hidden');
        modalRefund.style.display = 'flex';

        // Auto fill amount & client details
        const amtInput = document.getElementById('refund-input-amount');
        const maxValLbl = document.getElementById('lbl-refund-max-val');
        const nameInput = document.getElementById('refund-input-name');
        const numInput = document.getElementById('refund-input-number');

        if (amtInput) amtInput.value = activeClientWalletBalance.toFixed(2);
        if (maxValLbl) maxValLbl.textContent = `₱${activeClientWalletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const authUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
        if (authUser) {
            const clientName = authUser.fullName || authUser.name || (authUser.ClientFirstName ? `${authUser.ClientFirstName} ${authUser.ClientLastName || ''}`.trim() : '') || localStorage.getItem('soundsphere_user_name') || '';
            const clientPhone = authUser.phone || authUser.Phone || '';
            if (nameInput && !nameInput.value && clientName) nameInput.value = clientName;
            if (numInput && !numInput.value && clientPhone) numInput.value = clientPhone;
        }
    };

    const closeRefundModal = () => {
        if (!modalRefund) return;
        modalRefund.classList.add('hidden');
        modalRefund.style.display = 'none';
    };

    if (btnOpenWithdraw) {
        btnOpenWithdraw.addEventListener('click', (e) => {
            e.preventDefault();
            openRefundModal();
        });
    }

    if (btnCloseRefund) {
        btnCloseRefund.addEventListener('click', (e) => {
            e.preventDefault();
            closeRefundModal();
        });
    }

    if (btnCancelRefund) {
        btnCancelRefund.addEventListener('click', (e) => {
            e.preventDefault();
            closeRefundModal();
        });
    }

    if (modalRefund) {
        modalRefund.addEventListener('click', (e) => {
            if (e.target === modalRefund) closeRefundModal();
        });
    }

    if (btnMaxAmount) {
        btnMaxAmount.addEventListener('click', (e) => {
            e.preventDefault();
            const amtInput = document.getElementById('refund-input-amount');
            if (amtInput && activeClientWalletBalance > 0) {
                amtInput.value = activeClientWalletBalance.toFixed(2);
            }
        });
    }

    if (formRefund) {
        formRefund.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amtInput = document.getElementById('refund-input-amount');
            const methodSelect = document.getElementById('refund-select-method');
            const nameInput = document.getElementById('refund-input-name');
            const numInput = document.getElementById('refund-input-number');
            const notesInput = document.getElementById('refund-input-notes');
            const submitBtn = document.getElementById('btn-submit-refund-req');

            const reqAmt = parseFloat(amtInput?.value || 0);
            if (isNaN(reqAmt) || reqAmt <= 0) {
                alert('Please enter a valid refund amount greater than ₱0.00.');
                return;
            }
            if (reqAmt > activeClientWalletBalance) {
                alert(`The requested amount (₱${reqAmt.toFixed(2)}) exceeds your available wallet balance of ₱${activeClientWalletBalance.toFixed(2)}.`);
                return;
            }

            const method = methodSelect?.value || 'GCash';
            const accountName = nameInput?.value.trim() || '';
            const accountNumber = numInput?.value.trim() || '';
            const notes = notesInput?.value.trim() || '';

            if (!accountName || !accountNumber) {
                alert('Please provide your Account Holder Name and Mobile / Account Number.');
                return;
            }

            const origBtnHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
            }

            try {
                const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_jwt_token') || localStorage.getItem('token') || '');
                const authUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;

                const res = await fetch('/api/wallet/request-refund', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    body: JSON.stringify({
                        userId: authUser ? (authUser.userId || authUser.id || authUser.UserID) : undefined,
                        amount: reqAmt,
                        payoutMethod: method,
                        accountName,
                        accountNumber,
                        notes,
                        clientName: accountName,
                        clientEmail: authUser?.email,
                        clientPhone: authUser?.phone
                    })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to submit refund request.');
                }

                alert(`🎉 Refund Request Submitted to Cashier!\n\nAmount: ₱${reqAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}\nChannel: ${method}\nAccount: ${accountName} (${accountNumber})\n\nOur Cashier will manually verify and send the funds to your account.`);

                closeRefundModal();
                formRefund.reset();
                await window.loadClientWalletData();
            } catch (err) {
                console.error('Submit refund request error:', err);
                alert(`⚠️ Error: ${err.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origBtnHtml;
                }
            }
        });
    }

    // Auto-load wallet if on wallet subtab on page load
    if (sessionStorage.getItem('soundsphere_active_subtab') === 'wallet') {
        window.loadClientWalletData();
    }

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
            const emailNotif = document.getElementById('pref-email-notif')?.checked ?? true;
            const inappNotif = document.getElementById('pref-inapp-notif')?.checked ?? true;

            localStorage.setItem('soundsphere_pref_notif', JSON.stringify({ emailNotif, inappNotif }));

            if (inappNotif && typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }
            }

            showToast('✓ Notification preferences saved successfully!', 'success');
            document.getElementById('modal-sec-notifications')?.classList.add('hidden');
        });
    }

    // Form Submit: Privacy Settings
    const formSecPrivacy = document.getElementById('form-sec-privacy');
    if (formSecPrivacy) {
        formSecPrivacy.addEventListener('submit', (e) => {
            e.preventDefault();
            const showPhone = document.getElementById('pref-show-phone')?.checked ?? true;

            localStorage.setItem('soundsphere_pref_privacy', JSON.stringify({ showPhone }));
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
    const btnViewAllNotifs = document.getElementById('btn-view-all-notifications');

    // Modals
    const modalNotifDetail = document.getElementById('modal-notification-detail');
    const btnCloseNotifDetail = document.getElementById('btn-close-notif-detail');
    const btnDismissNotifDetail = document.getElementById('btn-dismiss-notif-detail');

    const modalAllNotifs = document.getElementById('modal-all-notifications');
    const btnCloseAllNotifs = document.getElementById('btn-close-all-notifs');
    const btnDismissAllNotifs = document.getElementById('btn-dismiss-all-notifs');
    const btnModalMarkAllRead = document.getElementById('btn-modal-mark-all-read');
    const inputSearchAllNotifs = document.getElementById('input-search-all-notifs');
    const allNotifsListContainer = document.getElementById('all-notifications-list-container');
    const allNotifTotalBadge = document.getElementById('all-notif-total-badge');
    const allNotifCountSummary = document.getElementById('all-notif-count-summary');

    let currentNotifFilter = 'all';
    let currentModalNotifFilter = 'all';
    let currentModalSearchQuery = '';
    let currentNotificationsCache = [];

    let knownNotifIds = new Set();
    let isInitialNotifFetch = true;

    window.triggerInAppPushAlert = (title, message, options = {}) => {
        const savedPref = JSON.parse(localStorage.getItem('soundsphere_pref_notif') || '{"inappNotif":true}');
        if (savedPref.inappNotif === false) return;

        // 1. Browser Push Notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                const bNotif = new Notification(title, {
                    body: message,
                    icon: '/images/concert_line_array.png'
                });
                bNotif.onclick = () => {
                    window.focus();
                    if (options.notificationId && typeof window.viewSingleNotification === 'function') {
                        window.viewSingleNotification(options.notificationId);
                    }
                    bNotif.close();
                };
            } catch (e) {}
        }

        // 2. High-visibility Interactive Floating In-App Push Banner
        let pushContainer = document.getElementById('inapp-push-alert-container');
        if (!pushContainer) {
            pushContainer = document.createElement('div');
            pushContainer.id = 'inapp-push-alert-container';
            pushContainer.style.cssText = 'position:fixed; top:24px; right:24px; z-index:9999999; display:flex; flex-direction:column; gap:12px; pointer-events:none; max-width:380px; width:calc(100vw - 48px);';
            document.body.appendChild(pushContainer);
        }

        const alertEl = document.createElement('div');
        alertEl.style.cssText = 'pointer-events:auto; background:linear-gradient(135deg, #0a192f 0%, #1e293b 100%); color:#ffffff; border-radius:14px; padding:14px 18px; box-shadow:0 12px 32px rgba(10,25,47,0.35), 0 0 0 1px rgba(255,255,255,0.1); display:flex; align-items:flex-start; gap:14px; transform:translateX(120%); transition:transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease; cursor:pointer; overflow:hidden; position:relative;';

        alertEl.innerHTML = `
            <div style="width:38px; height:38px; border-radius:10px; background:rgba(37,99,235,0.2); border:1px solid rgba(59,130,246,0.3); color:#38bdf8; display:flex; align-items:center; justify-content:center; font-size:1.1rem; flex-shrink:0; margin-top:2px;">
                <i class="fa-solid fa-bell"></i>
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-size:0.75rem; font-weight:700; color:#38bdf8; text-transform:uppercase; letter-spacing:0.04em; margin-bottom:2px;">SoundSphere In-App Alert</div>
                <strong style="font-size:0.92rem; color:#ffffff; font-weight:800; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px;">${title}</strong>
                <p style="margin:0; font-size:0.82rem; color:#cbd5e1; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${message}</p>
            </div>
            <button type="button" class="close-push-btn" style="background:none; border:none; color:#94a3b8; font-size:1.2rem; cursor:pointer; padding:0; line-height:1; display:flex; align-items:center; justify-content:center; width:24px; height:24px; border-radius:50%; transition:color 0.2s;" title="Close">&times;</button>
        `;

        pushContainer.appendChild(alertEl);

        requestAnimationFrame(() => {
            alertEl.style.transform = 'translateX(0)';
        });

        const dismiss = () => {
            alertEl.style.transform = 'translateX(120%)';
            alertEl.style.opacity = '0';
            setTimeout(() => {
                alertEl.remove();
            }, 350);
        };

        alertEl.querySelector('.close-push-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss();
        });

        alertEl.addEventListener('click', () => {
            dismiss();
            if (options.notificationId && typeof window.viewSingleNotification === 'function') {
                window.viewSingleNotification(options.notificationId);
            } else if (options.url) {
                window.location.href = options.url;
            }
        });

        setTimeout(dismiss, 6000);
    };

    const fetchNotifications = async () => {
        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
        if (!token) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('http://localhost:5000/api/notifications', { headers });
            if (res.ok) {
                const data = await res.json();
                currentNotificationsCache = data.notifications || data.data || [];
                const unreadCount = currentNotificationsCache.filter(n => !n.IsRead && n.IsRead !== 1).length;

                // Fire In-App Push Alerts for newly arrived unread notifications
                if (!isInitialNotifFetch) {
                    currentNotificationsCache.forEach(n => {
                        const id = n.NotificationID || n.id;
                        const isUnread = !n.IsRead && n.IsRead !== 1;
                        if (isUnread && !knownNotifIds.has(id)) {
                            window.triggerInAppPushAlert(n.Title || 'New Notification', n.Message || '', { notificationId: id });
                        }
                    });
                }

                currentNotificationsCache.forEach(n => {
                    const id = n.NotificationID || n.id;
                    knownNotifIds.add(id);
                });
                isInitialNotifFetch = false;

                if (notificationBadge) {
                    if (unreadCount > 0) {
                        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                        notificationBadge.classList.remove('hidden');
                    } else {
                        notificationBadge.classList.add('hidden');
                    }
                }

                if (allNotifTotalBadge) {
                    allNotifTotalBadge.textContent = unreadCount > 0 ? `${unreadCount} Unread` : `${currentNotificationsCache.length} Total`;
                }

                renderNotificationList();
                if (modalAllNotifs && modalAllNotifs.style.display === 'flex') {
                    renderAllNotificationsModalList();
                }
            }
        } catch (err) {
            console.warn('Notifications fetch error:', err.message);
        }
    };

    // Helper to format date nicely
    const formatNotifDate = (dateVal) => {
        if (!dateVal) return 'Just now';
        const d = new Date(dateVal);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
               d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderNotificationList = () => {
        if (!notificationList) return;
        let filtered = currentNotificationsCache;
        if (currentNotifFilter === 'unread') {
            filtered = currentNotificationsCache.filter(n => !n.IsRead && n.IsRead !== 1);
        }

        if (filtered.length === 0) {
            notificationList.innerHTML = `<div style="padding:32px 20px; text-align:center; color:#64748b; font-size:0.95rem;"><i class="fa-solid fa-bell-slash" style="font-size:1.8rem; color:#cbd5e1; display:block; margin-bottom:8px;"></i>No notifications found.</div>`;
            return;
        }

        notificationList.innerHTML = filtered.map(n => {
            const isUnread = !n.IsRead && n.IsRead !== 1;
            const createdDate = formatNotifDate(n.CreatedAt);
            const id = n.NotificationID || n.id;
            return `
                <div class="notification-item ${isUnread ? 'unread' : ''}" style="padding:14px 20px; border-bottom:1px solid #f1f5f9; background:${isUnread ? '#eff6ff' : '#ffffff'}; cursor:pointer; transition:background 0.2s ease;" onclick="window.viewSingleNotification(${id})">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                        <strong style="font-size:0.95rem; color:#0a192f; font-weight:800;">${n.Title || n.type || 'Notification'}</strong>
                        <span style="font-size:0.75rem; color:#94a3b8; font-weight:600;">${createdDate}</span>
                    </div>
                    <p style="margin:0; font-size:0.86rem; color:#475569; line-height:1.4;">${n.Message || n.message || ''}</p>
                </div>
            `;
        }).join('');
    };

    window.markSingleNotificationRead = async (id) => {
        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
        if (!token || !id) return;
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // Update local item
            const item = currentNotificationsCache.find(n => (n.NotificationID || n.id) == id);
            if (item) item.IsRead = 1;
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
        } catch (e) {}
    };

    // Open Single Notification Details in Modal
    window.viewSingleNotification = (id) => {
        const notif = currentNotificationsCache.find(n => (n.NotificationID || n.id) == id);
        if (!notif) return;

        // Mark as read immediately in UI
        notif.IsRead = 1;
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

        // Mark as read on backend
        window.markSingleNotificationRead(id);

        // Hide dropdown
        if (notificationPanel) notificationPanel.classList.add('hidden');

        // Populate detail modal
        const title = notif.Title || notif.type || 'Notification Update';
        const message = notif.Message || notif.message || '';
        const dateStr = formatNotifDate(notif.CreatedAt);

        const titleEl = document.getElementById('notif-detail-title');
        const timeEl = document.getElementById('notif-detail-time');
        const msgEl = document.getElementById('notif-detail-message');
        const badgeEl = document.getElementById('notif-detail-badge');
        const statusEl = document.getElementById('notif-detail-status');
        const iconEl = document.getElementById('notif-detail-icon');
        const iconBox = document.getElementById('notif-detail-icon-box');
        const actionsEl = document.getElementById('notif-detail-actions');

        if (titleEl) titleEl.textContent = title;
        if (timeEl) timeEl.textContent = dateStr;
        if (msgEl) msgEl.textContent = message;
        if (statusEl) {
            statusEl.textContent = 'Read';
            statusEl.style.background = '#dcfce7';
            statusEl.style.color = '#15803d';
        }

        // Detect Category and Icons
        const fullText = (title + ' ' + message).toLowerCase();
        let catName = 'System Alert';
        let iconClass = 'fa-bell';
        let iconColor = '#f59e0b';
        let boxBg = 'rgba(245, 158, 11, 0.2)';

        const isBalanceNotif = /balance|due date|outstanding|remaining balance/i.test(fullText) || notif.NotificationType === 'BalanceDueReminder';

        if (isBalanceNotif) {
            catName = 'Payment Balance';
            iconClass = 'fa-wallet';
            iconColor = '#e11d48';
            boxBg = 'rgba(225, 29, 72, 0.15)';
        } else if (/payment|paid|receipt|invoice|gcash|cashier|payout/i.test(fullText)) {
            catName = 'Payment Update';
            iconClass = 'fa-receipt';
            iconColor = '#2563eb';
            boxBg = 'rgba(37, 99, 235, 0.2)';
        } else if (/booking|reservation|event/i.test(fullText)) {
            catName = 'Booking Confirmation';
            iconClass = 'fa-calendar-check';
            iconColor = '#10b981';
            boxBg = 'rgba(16, 185, 129, 0.2)';
        } else if (/message|chat|inquiry/i.test(fullText)) {
            catName = 'Message Alert';
            iconClass = 'fa-comments';
            iconColor = '#8b5cf6';
            boxBg = 'rgba(139, 92, 246, 0.2)';
        }

        if (badgeEl) {
            badgeEl.textContent = catName;
            badgeEl.style.color = iconColor;
            badgeEl.style.background = boxBg;
            badgeEl.style.border = `1px solid ${iconColor}`;
        }
        if (iconEl) iconEl.className = `fa-solid ${iconClass}`;
        if (iconBox) {
            iconBox.style.background = boxBg;
            iconBox.style.color = iconColor;
        }

        // Check for Booking Reference (e.g. SS-2026-00012)
        let actionsHtml = '';
        const refMatch = message.match(/SS-\d{4}-\d+/i) || message.match(/SS-[A-Z0-9-]+/i);
        const bookingRef = refMatch ? refMatch[0] : '';

        if (isBalanceNotif) {
            actionsHtml = `
                <button type="button" class="btn-notif-view-balance" onclick="window.goToPaymentBalancesTab('${bookingRef}')" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 18px; background:#2563eb; color:#ffffff; border-radius:10px; font-weight:700; border:none; cursor:pointer; font-size:0.95rem; box-shadow:0 4px 14px rgba(37,99,235,0.3); transition:all 0.2s ease;">
                    <i class="fa-solid fa-wallet"></i> View Payment Balance${bookingRef ? ` (${bookingRef})` : ''}
                </button>
            `;
        } else if (bookingRef) {
            actionsHtml = `
                <a href="/booking-confirmation.html?ref=${encodeURIComponent(bookingRef)}" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 18px; background:#2563eb; color:#ffffff; border-radius:10px; font-weight:700; text-decoration:none; font-size:0.92rem; box-shadow:0 4px 14px rgba(37,99,235,0.3); transition:background 0.2s ease;">
                    <i class="fa-solid fa-file-invoice"></i> View Official Booking Receipt (${bookingRef})
                </a>
            `;
        }

        if (actionsEl) {
            actionsEl.innerHTML = actionsHtml;
        }

        if (modalNotifDetail) {
            modalNotifDetail.classList.remove('hidden');
            modalNotifDetail.style.display = 'flex';
        }
    };

    window.closeNotificationDetailModal = () => {
        if (modalNotifDetail) {
            modalNotifDetail.classList.add('hidden');
            modalNotifDetail.style.display = 'none';
        }
    };

    // Navigate directly to Payment Balances tab from Notification Modal
    window.goToPaymentBalancesTab = (bookingRef) => {
        if (typeof window.closeNotificationDetailModal === 'function') {
            window.closeNotificationDetailModal();
        }
        if (modalAllNotifs) {
            modalAllNotifs.classList.add('hidden');
            modalAllNotifs.style.display = 'none';
        }
        if (notificationPanel) {
            notificationPanel.classList.add('hidden');
        }

        const balancesSubtabBtn = document.getElementById('subtab-btn-balances');
        const balancesSec = document.getElementById('profile-sec-balances');

        if (balancesSubtabBtn) {
            if (typeof switchView === 'function') {
                switchView('profile');
            } else {
                const profileNav = document.getElementById('nav-profile-tab');
                if (profileNav) profileNav.click();
            }

            balancesSubtabBtn.click();
            sessionStorage.setItem('soundsphere_active_subtab', 'balances');

            setTimeout(() => {
                if (balancesSec) {
                    balancesSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 100);
        } else {
            sessionStorage.setItem('soundsphere_active_view', 'profile');
            sessionStorage.setItem('soundsphere_active_subtab', 'balances');
            window.location.href = '/marketplace.html#balances';
        }
    };

    // Open Full Notifications Center Modal
    window.openAllNotificationsModal = () => {
        if (notificationPanel) notificationPanel.classList.add('hidden');
        if (modalAllNotifs) {
            modalAllNotifs.classList.remove('hidden');
            modalAllNotifs.style.display = 'flex';
            currentModalNotifFilter = 'all';
            currentModalSearchQuery = '';
            if (inputSearchAllNotifs) inputSearchAllNotifs.value = '';
            
            // Reset active button
            document.querySelectorAll('.all-notif-filter-btn').forEach(btn => {
                if (btn.getAttribute('data-filter') === 'all') {
                    btn.style.background = '#2563eb';
                    btn.style.color = '#ffffff';
                } else {
                    btn.style.background = '#e2e8f0';
                    btn.style.color = '#475569';
                }
            });

            renderAllNotificationsModalList();
        }
    };

    window.closeAllNotificationsModal = () => {
        if (modalAllNotifs) {
            modalAllNotifs.classList.add('hidden');
            modalAllNotifs.style.display = 'none';
        }
    };

    const renderAllNotificationsModalList = () => {
        if (!allNotifsListContainer) return;

        let list = [...currentNotificationsCache];

        // Apply Filter
        if (currentModalNotifFilter === 'unread') {
            list = list.filter(n => !n.IsRead && n.IsRead !== 1);
        } else if (currentModalNotifFilter === 'booking') {
            list = list.filter(n => /booking|reservation|event/i.test((n.Title || '') + ' ' + (n.Message || '')));
        } else if (currentModalNotifFilter === 'payment') {
            list = list.filter(n => /payment|paid|receipt|invoice|gcash|cashier/i.test((n.Title || '') + ' ' + (n.Message || '')));
        }

        // Apply Search
        if (currentModalSearchQuery.trim()) {
            const q = currentModalSearchQuery.toLowerCase();
            list = list.filter(n => (n.Title || '').toLowerCase().includes(q) || (n.Message || '').toLowerCase().includes(q));
        }

        if (allNotifCountSummary) {
            allNotifCountSummary.textContent = `Showing ${list.length} of ${currentNotificationsCache.length} notifications`;
        }

        if (list.length === 0) {
            allNotifsListContainer.innerHTML = `
                <div style="padding:48px 20px; text-align:center; color:#64748b;">
                    <i class="fa-solid fa-bell-slash" style="font-size:2.4rem; color:#cbd5e1; display:block; margin-bottom:12px;"></i>
                    <strong style="font-size:1.05rem; color:#0a192f; display:block; margin-bottom:4px;">No notifications found</strong>
                    <p style="margin:0; font-size:0.86rem;">Try clearing search filters to see all messages.</p>
                </div>
            `;
            return;
        }

        allNotifsListContainer.innerHTML = list.map(n => {
            const isUnread = !n.IsRead && n.IsRead !== 1;
            const createdDate = formatNotifDate(n.CreatedAt);
            const id = n.NotificationID || n.id;
            const fullText = (n.Title || '') + ' ' + (n.Message || '');

            let iconClass = 'fa-bell';
            let iconColor = '#f59e0b';
            let boxBg = 'rgba(245, 158, 11, 0.15)';

            if (/booking|reservation|event/i.test(fullText)) {
                iconClass = 'fa-calendar-check';
                iconColor = '#10b981';
                boxBg = 'rgba(16, 185, 129, 0.15)';
            } else if (/payment|paid|receipt|invoice/i.test(fullText)) {
                iconClass = 'fa-receipt';
                iconColor = '#2563eb';
                boxBg = 'rgba(37, 99, 235, 0.15)';
            } else if (/message|chat/i.test(fullText)) {
                iconClass = 'fa-comments';
                iconColor = '#8b5cf6';
                boxBg = 'rgba(139, 92, 246, 0.15)';
            }

            return `
                <div class="all-notif-item" style="padding:16px 20px; margin-bottom:10px; border-radius:14px; border:1px solid ${isUnread ? '#bfdbfe' : '#e2e8f0'}; background:${isUnread ? '#eff6ff' : '#ffffff'}; cursor:pointer; display:flex; gap:16px; align-items:flex-start;" onclick="window.viewSingleNotification(${id})">
                    <div style="width:42px; height:42px; border-radius:12px; background:${boxBg}; color:${iconColor}; display:flex; align-items:center; justify-content:center; font-size:1.15rem; flex-shrink:0; margin-top:2px;">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                            <strong style="font-size:0.98rem; color:#0a192f; font-weight:800;">${n.Title || n.type || 'Notification'}</strong>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <span style="font-size:0.75rem; color:#94a3b8; font-weight:600;">${createdDate}</span>
                                ${isUnread ? '<span style="width:8px; height:8px; border-radius:50%; background:#2563eb; display:inline-block;"></span>' : ''}
                            </div>
                        </div>
                        <p style="margin:0 0 6px 0; font-size:0.88rem; color:#334155; line-height:1.5;">${n.Message || n.message || ''}</p>
                        <span style="font-size:0.75rem; color:#2563eb; font-weight:700;">Click to view details & actions →</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    // Modal Filter Tabs
    document.querySelectorAll('.all-notif-filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentModalNotifFilter = e.target.getAttribute('data-filter') || 'all';
            document.querySelectorAll('.all-notif-filter-btn').forEach(b => {
                b.style.background = '#e2e8f0';
                b.style.color = '#475569';
            });
            e.target.style.background = '#2563eb';
            e.target.style.color = '#ffffff';
            renderAllNotificationsModalList();
        });
    });

    if (inputSearchAllNotifs) {
        inputSearchAllNotifs.addEventListener('input', (e) => {
            currentModalSearchQuery = e.target.value;
            renderAllNotificationsModalList();
        });
    }

    if (btnModalMarkAllRead) {
        btnModalMarkAllRead.addEventListener('click', async () => {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            if (!token) return;
            try {
                await fetch('http://localhost:5000/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                currentNotificationsCache.forEach(n => n.IsRead = 1);
                fetchNotifications();
            } catch (e) {}
        });
    }

    // Modal Close Buttons
    btnCloseNotifDetail?.addEventListener('click', window.closeNotificationDetailModal);
    btnDismissNotifDetail?.addEventListener('click', window.closeNotificationDetailModal);
    btnCloseAllNotifs?.addEventListener('click', window.closeAllNotificationsModal);
    btnDismissAllNotifs?.addEventListener('click', window.closeAllNotificationsModal);
    btnViewAllNotifs?.addEventListener('click', window.openAllNotificationsModal);

    // Modal Outside Click Dismiss
    modalNotifDetail?.addEventListener('click', (e) => {
        if (e.target === modalNotifDetail) window.closeNotificationDetailModal();
    });
    modalAllNotifs?.addEventListener('click', (e) => {
        if (e.target === modalAllNotifs) window.closeAllNotificationsModal();
    });

    // Dropdown Bell Toggle
    if (btnNotificationBell && notificationPanel) {
        btnNotificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            const userDropdown = document.getElementById('user-dropdown-menu') || document.getElementById('header-user-dropdown') || document.getElementById('user-dropdown');
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
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            if (!token) return;
            try {
                await fetch('http://localhost:5000/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                currentNotificationsCache.forEach(n => n.IsRead = 1);
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

    // ------------------------------------------------------------------------
    // Real-time Rate & Review Modal Controller for Completed Bookings
    // ------------------------------------------------------------------------
    let currentSelectedRating = 5;
    const ratingLabels = {
        1: '1.0 - Terrible',
        2: '2.0 - Poor',
        3: '3.0 - Average',
        4: '4.0 - Very Good!',
        5: '5.0 - Excellent!'
    };

    window.safeDecodeString = (str) => {
        if (!str) return '';
        try {
            return decodeURIComponent(str);
        } catch (e) {
            return String(str);
        }
    };

    window.handleRateButtonClick = (btn) => {
        if (!btn) return;
        const bookingId = btn.getAttribute('data-booking-id');
        const providerId = btn.getAttribute('data-provider-id');
        const providerName = btn.getAttribute('data-provider-name');
        const packageName = btn.getAttribute('data-package-name');
        const existingRating = btn.getAttribute('data-existing-rating');
        const existingReview = btn.getAttribute('data-existing-review');

        window.openRateReviewModal({
            bookingId: bookingId ? parseInt(bookingId, 10) : null,
            providerId: providerId ? parseInt(providerId, 10) : null,
            providerName: window.safeDecodeString(providerName),
            packageName: window.safeDecodeString(packageName),
            existingRating: existingRating ? parseInt(existingRating, 10) : null,
            existingReview: window.safeDecodeString(existingReview)
        });
    };

    // Global Delegated Click Listener for Rate & Review Button
    document.addEventListener('click', (e) => {
        const rateBtn = e.target.closest('.btn-card-rate-review');
        if (rateBtn) {
            e.preventDefault();
            e.stopPropagation();
            window.handleRateButtonClick(rateBtn);
        }
    });

    window.openRateReviewModal = (options = {}) => {
        let modal = document.getElementById('modal-rate-review');
        if (!modal) {
            // Dynamically inject modal if not already present in DOM
            const modalMarkup = `
                <div class="modal-overlay hidden" id="modal-rate-review" role="dialog" aria-modal="true" style="position:fixed; inset:0; background:rgba(10,25,47,0.7); backdrop-filter:blur(6px); display:none; align-items:center; justify-content:center; z-index:999999; padding:16px;">
                    <div class="modal-card" style="background:#ffffff; border-radius:20px; width:100%; max-width:540px; box-shadow:0 25px 60px rgba(10,25,47,0.3); overflow:hidden;">
                        <div style="padding:22px 26px; background:linear-gradient(135deg, #0a192f 0%, #1e293b 100%); color:#ffffff; display:flex; justify-content:space-between; align-items:flex-start;">
                            <div style="display:flex; align-items:center; gap:12px;">
                                <div style="width:44px; height:44px; border-radius:12px; background:rgba(245, 158, 11, 0.2); border:1px solid rgba(245, 158, 11, 0.4); color:#f59e0b; display:flex; align-items:center; justify-content:center; font-size:1.3rem;">
                                    <i class="fa-solid fa-star"></i>
                                </div>
                                <div>
                                    <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:#ffffff;">Rate & Review Provider</h3>
                                    <p style="margin:3px 0 0 0; font-size:0.84rem; color:#94a3b8;" id="rate-modal-provider-name">Service Provider Review</p>
                                </div>
                            </div>
                            <button type="button" class="btn-close-rate-modal" style="background:none; border:none; font-size:1.5rem; color:#94a3b8; cursor:pointer; line-height:1;" title="Close">&times;</button>
                        </div>
                        <form id="form-rate-review" style="padding:24px 26px; display:flex; flex-direction:column; gap:18px;">
                            <input type="hidden" id="rate-modal-booking-id" value="">
                            <input type="hidden" id="rate-modal-provider-id" value="">
                            <div style="padding:12px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <span style="font-size:0.75rem; font-weight:800; color:#64748b; text-transform:uppercase;">Completed Booking</span>
                                    <div style="font-size:0.95rem; font-weight:800; color:#0a192f; margin-top:2px;" id="rate-modal-package-name">Audio-Visual Event Package</div>
                                </div>
                                <span style="background:#ecfdf5; color:#047857; border:1px solid #a7f3d0; font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:20px;">
                                    <i class="fa-solid fa-circle-check"></i> Completed
                                </span>
                            </div>
                            <div style="text-align:center; padding:12px 0 6px 0;">
                                <label style="display:block; font-size:0.92rem; font-weight:800; color:#0a192f; margin-bottom:8px;">
                                    Overall Rating <span style="color:#ef4444;">*</span>
                                </label>
                                <div id="rate-stars-container" style="display:inline-flex; gap:10px; font-size:2rem; cursor:pointer; color:#cbd5e1;">
                                    <i class="fa-solid fa-star rate-star" data-rating="1" style="transition:transform 0.15s, color 0.15s;"></i>
                                    <i class="fa-solid fa-star rate-star" data-rating="2" style="transition:transform 0.15s, color 0.15s;"></i>
                                    <i class="fa-solid fa-star rate-star" data-rating="3" style="transition:transform 0.15s, color 0.15s;"></i>
                                    <i class="fa-solid fa-star rate-star" data-rating="4" style="transition:transform 0.15s, color 0.15s;"></i>
                                    <i class="fa-solid fa-star rate-star" data-rating="5" style="transition:transform 0.15s, color 0.15s;"></i>
                                </div>
                                <div id="rate-star-text" style="font-size:0.9rem; font-weight:800; color:#f59e0b; margin-top:6px;">5.0 - Excellent!</div>
                            </div>
                            <div>
                                <label for="rate-review-text" style="display:block; font-size:0.88rem; font-weight:800; color:#0a192f; margin-bottom:6px;">
                                    Your Feedback & Experience <span style="color:#ef4444;">*</span>
                                </label>
                                <textarea id="rate-review-text" rows="4" required style="width:100%; padding:12px 14px; border:1.5px solid #cbd5e1; border-radius:12px; font-size:0.9rem; font-family:inherit; color:#0a192f; box-sizing:border-box; outline:none;" placeholder="Describe how the setup, sound quality, technician support, and punctuality went for your event..."></textarea>
                                <span style="font-size:0.75rem; color:#64748b; margin-top:4px; display:block;">Your verified review will be posted publicly on the provider's SoundSphere profile.</span>
                            </div>
                            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px; border-top:1px solid #e2e8f0; padding-top:16px;">
                                <button type="button" class="btn-close-rate-modal" style="padding:10px 18px; border:1.5px solid #cbd5e1; border-radius:10px; background:#ffffff; color:#475569; font-weight:700; font-size:0.9rem; cursor:pointer;">Cancel</button>
                                <button type="submit" id="btn-submit-rate-review" style="padding:10px 24px; border:none; border-radius:10px; background:linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color:#ffffff; font-weight:800; font-size:0.92rem; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 14px rgba(245,158,11,0.35);">
                                    <i class="fa-solid fa-paper-plane"></i> Submit Review
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalMarkup);
            modal = document.getElementById('modal-rate-review');
            initRateReviewModal();
        }

        const bookingIdInput = document.getElementById('rate-modal-booking-id');
        const providerIdInput = document.getElementById('rate-modal-provider-id');
        const providerNameEl = document.getElementById('rate-modal-provider-name');
        const packageNameEl = document.getElementById('rate-modal-package-name');
        const reviewTextEl = document.getElementById('rate-review-text');

        const rawProvName = options.providerName ? window.safeDecodeString(options.providerName) : 'Service Provider';
        const rawPkgName = options.packageName ? window.safeDecodeString(options.packageName) : 'Audio-Visual Event Package';
        const rawReview = options.existingReview ? window.safeDecodeString(options.existingReview) : '';

        if (bookingIdInput) bookingIdInput.value = options.bookingId || '';
        if (providerIdInput) providerIdInput.value = options.providerId || '';
        if (providerNameEl) providerNameEl.textContent = `Reviewing ${rawProvName}`;
        if (packageNameEl) packageNameEl.textContent = rawPkgName;
        if (reviewTextEl) reviewTextEl.value = rawReview;

        currentSelectedRating = options.existingRating ? parseInt(options.existingRating, 10) : 5;
        updateStarRatingUI(currentSelectedRating);

        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
    };

    window.closeRateReviewModal = () => {
        const modal = document.getElementById('modal-rate-review');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.display = 'none';
        }
    };

    function updateStarRatingUI(rating) {
        const starContainer = document.getElementById('rate-stars-container');
        const textEl = document.getElementById('rate-star-text');
        if (starContainer) {
            starContainer.querySelectorAll('.rate-star').forEach(star => {
                const starVal = parseInt(star.getAttribute('data-rating'), 10);
                if (starVal <= rating) {
                    star.style.color = '#f59e0b';
                    star.classList.remove('fa-regular');
                    star.classList.add('fa-solid');
                } else {
                    star.style.color = '#cbd5e1';
                    star.classList.remove('fa-solid');
                    star.classList.add('fa-regular');
                }
            });
        }
        if (textEl) {
            textEl.textContent = ratingLabels[rating] || `${rating}.0`;
        }
    }

    function initRateReviewModal() {
        const modal = document.getElementById('modal-rate-review');
        if (!modal) return;

        // Close buttons
        modal.querySelectorAll('.btn-close-rate-modal').forEach(btn => {
            btn.addEventListener('click', window.closeRateReviewModal);
        });

        // Click outside modal to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeRateReviewModal();
        });

        // Interactive Stars
        const starContainer = document.getElementById('rate-stars-container');
        if (starContainer) {
            starContainer.querySelectorAll('.rate-star').forEach(star => {
                star.addEventListener('mouseenter', () => {
                    const hoverVal = parseInt(star.getAttribute('data-rating'), 10);
                    updateStarRatingUI(hoverVal);
                });
                star.addEventListener('click', () => {
                    currentSelectedRating = parseInt(star.getAttribute('data-rating'), 10);
                    updateStarRatingUI(currentSelectedRating);
                });
            });
            starContainer.addEventListener('mouseleave', () => {
                updateStarRatingUI(currentSelectedRating);
            });
        }

        // Form Submission
        const form = document.getElementById('form-rate-review');
        if (form && !form.dataset.initialized) {
            form.dataset.initialized = 'true';
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const bookingId = document.getElementById('rate-modal-booking-id')?.value;
                const providerId = document.getElementById('rate-modal-provider-id')?.value;
                const reviewText = document.getElementById('rate-review-text')?.value;
                const submitBtn = document.getElementById('btn-submit-rate-review');

                if (!reviewText || !reviewText.trim()) {
                    showToast('⚠️ Please enter your review comments.', 'warning');
                    return;
                }

                const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
                if (!token) {
                    showToast('⚠️ Please log in to submit your review.', 'warning');
                    return;
                }

                try {
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
                    }

                    const res = await fetch('http://localhost:5000/api/reviews', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            bookingId: bookingId ? parseInt(bookingId, 10) : null,
                            providerId: providerId ? parseInt(providerId, 10) : null,
                            rating: currentSelectedRating,
                            reviewText: reviewText.trim()
                        })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        showToast('✓ Thank you! Your review has been submitted and published to the provider profile.', 'success');
                        window.closeRateReviewModal();
                        form.reset();
                        if (typeof window.fetchUserBookings === 'function') {
                            window.fetchUserBookings();
                        }
                    } else {
                        showToast(`⚠️ ${data.message || 'Failed to submit review.'}`, 'error');
                    }
                } catch (err) {
                    showToast('⚠️ Error submitting review. Please try again.', 'error');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Review';
                    }
                }
            });
        }
    }

    initRateReviewModal();

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

// ==================== GLOBAL PHOTO CAROUSEL & SWIPE CONTROLLERS ====================
window.packagePhotosMap = window.packagePhotosMap || {};

window.switchCardPhoto = (pkgId, target, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const urls = window.packagePhotosMap[pkgId] || [];
    if (!urls || urls.length <= 1) return;

    const wrap = document.querySelector(`.offer-card-image-wrap[data-pkg-id="${pkgId}"]`) || document.querySelector(`[data-pkg-id="${pkgId}"] .offer-card-image-wrap`) || document.getElementById(`pkg-photo-wrap-${pkgId}`);
    const mainImg = document.getElementById(`main-offer-img-${pkgId}`) || document.getElementById(`main-pkg-photo-${pkgId}`) || (wrap ? wrap.querySelector('img.card-main-img, img.enlargeable-photo, img') : null);
    const counter = document.getElementById(`card-photo-counter-${pkgId}`);
    const thumbsRow = document.getElementById(`card-thumbnails-row-${pkgId}`);

    let currentIdx = wrap ? parseInt(wrap.getAttribute('data-photo-idx') || '0', 10) : 0;
    if (isNaN(currentIdx)) currentIdx = 0;

    let newIdx = currentIdx;
    if (target === 'next') {
        newIdx = (currentIdx + 1) % urls.length;
    } else if (target === 'prev') {
        newIdx = (currentIdx - 1 + urls.length) % urls.length;
    } else if (typeof target === 'number') {
        newIdx = (target + urls.length) % urls.length;
    }

    if (wrap) wrap.setAttribute('data-photo-idx', newIdx);

    if (mainImg) {
        mainImg.style.opacity = '0.35';
        mainImg.style.transform = target === 'prev' ? 'translateX(8px) scale(0.98)' : 'translateX(-8px) scale(0.98)';
        setTimeout(() => {
            mainImg.src = urls[newIdx];
            mainImg.style.opacity = '1';
            mainImg.style.transform = 'translateX(0) scale(1)';
        }, 110);
    }

    if (counter) {
        counter.textContent = `${newIdx + 1} / ${urls.length}`;
    }

    if (thumbsRow) {
        const thumbs = thumbsRow.querySelectorAll('.card-thumb-item, img');
        thumbs.forEach((th, idx) => {
            if (idx === newIdx) {
                th.classList.add('active');
                th.style.borderColor = '#2563eb';
                th.style.opacity = '1';
                th.style.transform = 'scale(1.08)';
                th.style.boxShadow = '0 2px 8px rgba(37,99,235,0.4)';
                if (typeof th.scrollIntoView === 'function') {
                    th.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                }
            } else {
                th.classList.remove('active');
                th.style.borderColor = '#cbd5e1';
                th.style.opacity = '0.65';
                th.style.transform = 'scale(1)';
                th.style.boxShadow = 'none';
            }
        });
    }
};

window.openCardGalleryLightbox = (pkgId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const urls = window.packagePhotosMap[pkgId] || [];
    const wrap = document.querySelector(`.offer-card-image-wrap[data-pkg-id="${pkgId}"]`) || document.querySelector(`[data-pkg-id="${pkgId}"] .offer-card-image-wrap`);
    const currentIdx = wrap ? parseInt(wrap.getAttribute('data-photo-idx') || '0', 10) : 0;
    if (urls && urls.length > 0) {
        window.openPhotoLightbox(urls, currentIdx);
    } else {
        const mainImg = document.getElementById(`main-offer-img-${pkgId}`) || (wrap ? wrap.querySelector('img') : null);
        if (mainImg && mainImg.src) window.openPhotoLightbox(mainImg.src, 0);
    }
};

// Touch / Swipe Gestures on Offer Card Image Wrappers
document.addEventListener('touchstart', (e) => {
    const wrap = e.target.closest('.offer-card-image-wrap');
    if (!wrap || e.target.closest('.card-carousel-btn') || e.target.closest('.card-enlarge-btn')) return;
    wrap._touchStartX = e.touches[0].clientX;
    wrap._touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener('touchend', (e) => {
    const wrap = e.target.closest('.offer-card-image-wrap');
    if (!wrap || wrap._touchStartX === undefined) return;
    const diffX = e.changedTouches[0].clientX - wrap._touchStartX;
    const diffY = e.changedTouches[0].clientY - wrap._touchStartY;
    wrap._touchStartX = undefined;

    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
        const pkgId = wrap.getAttribute('data-pkg-id');
        if (pkgId) {
            if (diffX < 0) {
                window.switchCardPhoto(pkgId, 'next');
            } else {
                window.switchCardPhoto(pkgId, 'prev');
            }
        }
    }
}, { passive: true });

// ==================== GLOBAL PHOTO LIGHTBOX VIEWER CONTROLLER ====================
window._lightboxPhotos = [];
window._lightboxIndex = 0;

window.openPhotoLightbox = (imageSrcOrArray, startIndex = 0) => {
    if (!imageSrcOrArray) return;

    if (Array.isArray(imageSrcOrArray)) {
        window._lightboxPhotos = imageSrcOrArray.filter(Boolean);
        window._lightboxIndex = typeof startIndex === 'number' ? startIndex : 0;
    } else if (typeof imageSrcOrArray === 'object' && imageSrcOrArray.images) {
        window._lightboxPhotos = (imageSrcOrArray.images || []).filter(Boolean);
        window._lightboxIndex = imageSrcOrArray.index || 0;
    } else {
        window._lightboxPhotos = [imageSrcOrArray];
        window._lightboxIndex = 0;
    }

    if (window._lightboxPhotos.length === 0) return;
    if (window._lightboxIndex < 0 || window._lightboxIndex >= window._lightboxPhotos.length) {
        window._lightboxIndex = 0;
    }

    let modal = document.getElementById('photo-lightbox-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'photo-lightbox-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(10, 20, 35, 0.96); backdrop-filter:blur(14px); display:none; flex-direction:column; align-items:center; justify-content:center; z-index:99999999; opacity:0; transition:opacity 0.25s ease; box-sizing:border-box; padding:20px; user-select:none;';
        modal.innerHTML = `
            <!-- Top Controls Toolbar -->
            <div style="position:absolute; top:20px; left:28px; z-index:100000000; display:flex; align-items:center; gap:12px;">
                <span id="lightbox-counter-badge" style="background:rgba(255,255,255,0.18); color:#ffffff; padding:6px 14px; border-radius:20px; font-size:0.85rem; font-weight:800; backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.25); display:none;">
                    Photo 1 of 1
                </span>
            </div>

            <div style="position:absolute; top:20px; right:28px; display:flex; align-items:center; gap:10px; z-index:100000000;">
                <button type="button" id="lightbox-zoom-out-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Zoom Out"><i class="fa-solid fa-minus"></i></button>
                <button type="button" id="lightbox-zoom-in-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Zoom In"><i class="fa-solid fa-plus"></i></button>
                <a id="lightbox-download-btn" href="" download="photo-attachment.jpg" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; text-decoration:none; display:flex; align-items:center; justify-content:center; font-size:1.1rem; transition:background 0.2s ease;" title="Download Photo">
                    <i class="fa-solid fa-download"></i>
                </a>
                <button type="button" id="lightbox-close-btn" style="background:rgba(255,255,255,0.2); border:none; color:#ffffff; width:44px; height:44px; border-radius:50%; font-size:1.6rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s ease;" title="Close Viewer">&times;</button>
            </div>

            <!-- Left & Right Carousel Arrows -->
            <button type="button" id="lightbox-prev-btn" style="position:absolute; left:24px; top:50%; transform:translateY(-50%); width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.18); border:1.5px solid rgba(255,255,255,0.3); color:#ffffff; font-size:1.3rem; cursor:pointer; display:none; align-items:center; justify-content:center; backdrop-filter:blur(8px); z-index:100000000; transition:all 0.2s ease;" title="Previous Photo (Left Arrow)">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" id="lightbox-next-btn" style="position:absolute; right:24px; top:50%; transform:translateY(-50%); width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.18); border:1.5px solid rgba(255,255,255,0.3); color:#ffffff; font-size:1.3rem; cursor:pointer; display:none; align-items:center; justify-content:center; backdrop-filter:blur(8px); z-index:100000000; transition:all 0.2s ease;" title="Next Photo (Right Arrow)">
                <i class="fa-solid fa-chevron-right"></i>
            </button>

            <!-- Main Image Viewport -->
            <div id="lightbox-img-container" style="max-width:94vw; max-height:80vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; cursor:zoom-in;">
                <img id="lightbox-full-img" src="" alt="Enlarged Photo Attachment" style="max-width:92vw; max-height:78vh; border-radius:14px; object-fit:contain; box-shadow:0 25px 60px rgba(0,0,0,0.75); transform:scale(1); transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;">
            </div>

            <!-- Bottom Gallery Thumbnails Bar -->
            <div id="lightbox-thumbnails-bar" style="position:absolute; bottom:20px; max-width:85vw; display:none; gap:10px; overflow-x:auto; padding:8px 16px; background:rgba(10,25,47,0.7); border-radius:16px; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.15); z-index:100000000;">
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
            if (e.target.id === 'lightbox-prev-btn' || e.target.closest('#lightbox-prev-btn')) {
                window.switchLightboxPhoto('prev');
                return;
            }
            if (e.target.id === 'lightbox-next-btn' || e.target.closest('#lightbox-next-btn')) {
                window.switchLightboxPhoto('next');
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

        // Touch Swipe on Lightbox
        let lbTouchStartX = 0;
        let lbTouchStartY = 0;
        modal.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches[0]) {
                lbTouchStartX = e.touches[0].clientX;
                lbTouchStartY = e.touches[0].clientY;
            }
        }, { passive: true });

        modal.addEventListener('touchend', (e) => {
            if (e.changedTouches && e.changedTouches[0]) {
                const diffX = e.changedTouches[0].clientX - lbTouchStartX;
                const diffY = e.changedTouches[0].clientY - lbTouchStartY;
                if (Math.abs(diffX) > 45 && Math.abs(diffX) > Math.abs(diffY)) {
                    if (diffX < 0) {
                        window.switchLightboxPhoto('next');
                    } else {
                        window.switchLightboxPhoto('prev');
                    }
                }
            }
        }, { passive: true });
    }

    window.updateLightboxDisplay();

    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.setProperty('visibility', 'visible', 'important');
    modal.style.setProperty('opacity', '0', 'important');

    requestAnimationFrame(() => {
        modal.style.setProperty('opacity', '1', 'important');
    });
};

window.switchLightboxPhoto = (target) => {
    const photos = window._lightboxPhotos || [];
    if (photos.length <= 1) return;

    if (target === 'next') {
        window._lightboxIndex = (window._lightboxIndex + 1) % photos.length;
    } else if (target === 'prev') {
        window._lightboxIndex = (window._lightboxIndex - 1 + photos.length) % photos.length;
    } else if (typeof target === 'number') {
        window._lightboxIndex = (target + photos.length) % photos.length;
    }

    const modal = document.getElementById('photo-lightbox-modal');
    const img = modal ? modal.querySelector('#lightbox-full-img') : null;
    if (img) {
        img.style.opacity = '0.3';
        img.style.transform = target === 'prev' ? 'translateX(16px) scale(0.96)' : 'translateX(-16px) scale(0.96)';
        setTimeout(() => {
            window.updateLightboxDisplay();
            img.style.opacity = '1';
            img.style.transform = 'translateX(0) scale(1)';
        }, 120);
    } else {
        window.updateLightboxDisplay();
    }
};

window.updateLightboxDisplay = () => {
    const modal = document.getElementById('photo-lightbox-modal');
    if (!modal) return;

    const photos = window._lightboxPhotos || [];
    const idx = window._lightboxIndex || 0;
    const currentSrc = photos[idx] || '';

    const img = modal.querySelector('#lightbox-full-img');
    const dlBtn = modal.querySelector('#lightbox-download-btn');
    const counterBadge = modal.querySelector('#lightbox-counter-badge');
    const prevBtn = modal.querySelector('#lightbox-prev-btn');
    const nextBtn = modal.querySelector('#lightbox-next-btn');
    const thumbBar = modal.querySelector('#lightbox-thumbnails-bar');

    if (img) img.src = currentSrc;
    if (dlBtn) dlBtn.href = currentSrc;

    const isMultiple = photos.length > 1;
    if (counterBadge) {
        counterBadge.style.display = isMultiple ? 'inline-block' : 'none';
        counterBadge.textContent = `Photo ${idx + 1} of ${photos.length}`;
    }
    if (prevBtn) prevBtn.style.display = isMultiple ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = isMultiple ? 'flex' : 'none';

    if (thumbBar) {
        if (isMultiple) {
            thumbBar.style.display = 'flex';
            thumbBar.innerHTML = photos.map((url, pIdx) => `
                <img src="${url}" style="width:48px; height:48px; border-radius:8px; object-fit:cover; border:2px solid ${pIdx === idx ? '#2563eb' : 'rgba(255,255,255,0.3)'}; opacity:${pIdx === idx ? '1' : '0.6'}; cursor:pointer; flex-shrink:0; transition:all 0.2s;" onclick="event.stopPropagation(); window.switchLightboxPhoto(${pIdx});" title="View photo ${pIdx + 1}">
            `).join('');
        } else {
            thumbBar.style.display = 'none';
        }
    }
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

// Global Event Delegation for Standalone Enlargeable Photos & Chat Attachments
document.addEventListener('click', (e) => {
    if (e.target.closest('#photo-lightbox-modal') || e.target.closest('.card-carousel-btn') || e.target.closest('.card-thumb-item') || e.target.closest('.offer-card-image-wrap')) return;

    const imgEl = e.target.closest('.message-bubble img, .chat-photo-attachment, .clickable-photo, [data-action="enlarge"]');
    if (imgEl && imgEl.src && !imgEl.classList.contains('no-lightbox')) {
        e.preventDefault();
        e.stopPropagation();
        window.openPhotoLightbox(imgEl.src);
    }
});

document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('photo-lightbox-modal');
    const isVisible = modal && modal.style.display !== 'none' && modal.style.visibility !== 'hidden';
    if (!isVisible) return;

    if (e.key === 'Escape') {
        window.closePhotoLightbox();
    } else if (e.key === 'ArrowLeft') {
        window.switchLightboxPhoto('prev');
    } else if (e.key === 'ArrowRight') {
        window.switchLightboxPhoto('next');
    }
});
