/**
 * SoundSphere - Client Marketplace Controller (Vanilla JS)
 * End-to-End backend integration with GET /api/providers API endpoint
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const providersGrid = document.getElementById('providers-grid');
    const providerCountSpan = document.getElementById('provider-count');
    const locationSearchInput = document.getElementById('location-search');
    const coverageBadge = document.getElementById('coverage-badge');
    const coverageTextSpan = document.getElementById('coverage-text');
    const navSearchInput = document.getElementById('nav-search');
    const dateFilterInput = document.getElementById('date-filter');
    const categoryPills = Array.from(document.querySelectorAll('.category-pill'));
    
    // User Session & Header Elements
    const userNameSpan = document.getElementById('user-display-name');
    const userAvatarImg = document.getElementById('user-avatar-initials');
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const directLogoutBtn = document.getElementById('direct-logout-btn');

    const notifBtn = document.getElementById('notifications-btn');
    const messagesBtn = document.getElementById('messages-btn');

    // State Variables
    let activeCategory = 'All';
    let searchQuery = '';
    let locationQuery = '';
    let selectedDate = '';
    let fetchedProvidersData = [];

    // Header Navigation Wiring
    if (notifBtn) {
        notifBtn.addEventListener('click', () => {
            window.location.href = 'client-messages.html';
        });
    }

    if (messagesBtn) {
        messagesBtn.addEventListener('click', () => {
            window.location.href = 'client-messages.html';
        });
    }

    // User Session Initialization & Public Navbar Auth Recognition
    const currentUser = SoundSphereAPI.getCurrentUser();
    const token = SoundSphereAPI.getAuthToken();
    const guestAuthBtns = document.getElementById('guest-auth-buttons');
    const authNotifWrapper = document.getElementById('auth-notification-wrapper');
    const authUserMenu = document.getElementById('auth-user-menu');

    if (token && currentUser) {
        // Authenticated User State
        if (guestAuthBtns) guestAuthBtns.classList.add('hidden');
        if (authNotifWrapper) authNotifWrapper.classList.remove('hidden');
        if (authUserMenu) authUserMenu.classList.remove('hidden');

        const displayName = currentUser.name || currentUser.email || 'Client Account';
        if (userNameSpan) userNameSpan.textContent = displayName;
        if (userAvatarImg) {
            const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            userAvatarImg.textContent = initials || 'C';
        }

        // Show provider dashboard link if user is an approved provider
        if (currentUser.role === 'ServiceProvider' || currentUser.providerStatus === 'Approved') {
            const provLink = document.getElementById('dropdown-provider-dashboard-link');
            if (provLink) provLink.classList.remove('hidden');
            const dropRole = document.getElementById('dropdown-user-role');
            if (dropRole) dropRole.textContent = 'Client + Service Provider';
        }
    } else {
        // Unauthenticated Guest State
        if (guestAuthBtns) guestAuthBtns.classList.remove('hidden');
        if (authNotifWrapper) authNotifWrapper.classList.add('hidden');
        if (authUserMenu) authUserMenu.classList.add('hidden');
    }

    // Dynamic Unread Messages Counter
    const updateUnreadMessagesBadge = async () => {
        const msgBadge = document.getElementById('unread-messages-badge');
        if (!msgBadge) return;

        if (!token || !currentUser) {
            msgBadge.style.display = 'none';
            return;
        }

        try {
            const uId = currentUser.userId || currentUser.id || currentUser.UserID;
            const res = await fetch(`/api/messages/conversations?userId=${uId}`);
            if (res.ok) {
                const data = await res.json();
                const conversations = data.conversations || [];
                const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
                if (totalUnread > 0) {
                    msgBadge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                    msgBadge.style.display = 'inline-flex';
                } else {
                    msgBadge.style.display = 'none';
                }
            } else {
                msgBadge.style.display = 'none';
            }
        } catch (e) {
            msgBadge.style.display = 'none';
        }
    };
    updateUnreadMessagesBadge();

    // Protected Nav Tabs for Guests (Messages & Me/Profile)
    const navMessagesTab = document.getElementById('nav-messages-tab');
    const navProfileTab = document.getElementById('nav-profile-tab');

    if (navMessagesTab) {
        navMessagesTab.addEventListener('click', (e) => {
            if (!token || !currentUser) {
                e.stopImmediatePropagation();
                window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
            }
        });
    }

    if (navProfileTab) {
        navProfileTab.addEventListener('click', (e) => {
            if (!token || !currentUser) {
                e.stopImmediatePropagation();
                window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
            }
        });
    }

    if (avatarBtn) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (userDropdown) userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.classList.remove('show');
        });
    }

    // End-to-End Logout Function Invocation
    const handleUserLogout = async (e) => {
        if (e) e.preventDefault();
        await SoundSphereAPI.logoutAPI();
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleUserLogout);
    if (directLogoutBtn) directLogoutBtn.addEventListener('click', handleUserLogout);

    // Render Skeleton Loaders State
    const showSkeletonLoaders = () => {
        if (!providersGrid) return;
        providersGrid.innerHTML = `
            <div class="skeleton-card">
                <div class="skeleton-banner"></div>
                <div class="skeleton-body">
                    <div class="skeleton-line" style="width: 70%;"></div>
                    <div class="skeleton-line" style="width: 50%;"></div>
                    <div class="skeleton-line" style="width: 90%; margin-top: auto;"></div>
                </div>
            </div>
            <div class="skeleton-card">
                <div class="skeleton-banner"></div>
                <div class="skeleton-body">
                    <div class="skeleton-line" style="width: 80%;"></div>
                    <div class="skeleton-line" style="width: 40%;"></div>
                    <div class="skeleton-line" style="width: 90%; margin-top: auto;"></div>
                </div>
            </div>
            <div class="skeleton-card">
                <div class="skeleton-banner"></div>
                <div class="skeleton-body">
                    <div class="skeleton-line" style="width: 65%;"></div>
                    <div class="skeleton-line" style="width: 45%;"></div>
                    <div class="skeleton-line" style="width: 90%; margin-top: auto;"></div>
                </div>
            </div>
        `;
    };

    // End-to-End Backend API Fetching (/api/providers)
    const fetchProvidersFromAPI = async () => {
        showSkeletonLoaders();

        try {
            const queryParams = new URLSearchParams();
            if (activeCategory && activeCategory !== 'All') queryParams.append('category', activeCategory);
            if (searchQuery) queryParams.append('search', searchQuery);
            if (locationQuery) queryParams.append('location', locationQuery);
            if (selectedDate) queryParams.append('date', selectedDate);

            const url = `/api/providers?${queryParams.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Server error: ${response.statusText}`);
            }

            const resData = await response.json();
            fetchedProvidersData = resData.data || [];

            renderProviderCards(fetchedProvidersData);

        } catch (error) {
            console.error('Error fetching providers from backend API:', error);
            renderProviderCards([]);
        }
    };

    // Universal Flexible Multi-Field Match Helper
    const matchesUniversalSearch = (offer, queryStr) => {
        if (!queryStr || !queryStr.trim()) return true;

        const rawTerms = queryStr.toLowerCase().trim().split(/\s+/).filter(Boolean);
        if (rawTerms.length === 0) return true;

        const searchableText = [
            offer.PackageName || offer.name || offer.title || '',
            offer.Category || offer.category || '',
            offer.Description || offer.description || '',
            Array.isArray(offer.Inclusions) ? offer.Inclusions.join(' ') : (offer.Inclusions || offer.inclusions || ''),
            offer.providerName || offer.businessName || '',
            offer.ownerName || '',
            offer.coverageArea || offer.location || '',
            offer.businessAddress || ''
        ].join(' ').toLowerCase();

        const cleanSearchableText = searchableText.replace(/[\s\-_,.:;()]/g, '');

        return rawTerms.every(term => {
            const cleanTerm = term.replace(/[\s\-_,.:;()]/g, '');
            const singularTerm = term.endsWith('s') && term.length > 3 ? term.slice(0, -1) : term;
            const cleanSingular = cleanTerm.endsWith('s') && cleanTerm.length > 3 ? cleanTerm.slice(0, -1) : cleanTerm;

            return searchableText.includes(term) ||
                   searchableText.includes(singularTerm) ||
                   cleanSearchableText.includes(cleanTerm) ||
                   cleanSearchableText.includes(cleanSingular);
        });
    };

    // Render Service Offers & Packages Cards Function
    const renderProviderCards = (providers) => {
        const featuredGrid = document.getElementById('home-featured-providers-grid');

        // Extract all individual active service/package offers directly from DB
        let allOffers = [];
        (providers || []).forEach(p => {
            if (p.verified && Array.isArray(p.packages) && p.packages.length > 0) {
                p.packages.forEach(pkg => {
                    if (pkg.isActive !== false && pkg.isActive !== 0) {
                        const offerObj = {
                            ...pkg,
                            providerId: p.id || p.userId,
                            providerName: p.name || p.businessName,
                            providerAvatar: p.profilePicture || p.avatar || p.userProfilePicture,
                            providerRating: p.rating || 5.0,
                            providerVerified: p.verified,
                            coverageArea: p.coverageArea || 'Batangas',
                            businessAddress: p.businessAddress || ''
                        };

                        if (matchesUniversalSearch(offerObj, searchQuery)) {
                            allOffers.push(offerObj);
                        }
                    }
                });
            }
        });

        if (providerCountSpan) {
            providerCountSpan.textContent = `${allOffers.length} Service Offer${allOffers.length === 1 ? '' : 's'} Available`;
        }

        const emptyHTML = `
            <div class="empty-state-box" style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 48px 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; margin: 12px 0;">
                <i class="fa-solid fa-box-open" style="font-size: 2.8rem; color: #94a3b8; margin-bottom: 14px; display: block;"></i>
                <h3 style="margin: 0 0 8px 0; color: #0a192f; font-size: 1.2rem; font-weight: 800;">No Service Offers Available</h3>
                <p style="margin: 0; font-size: 0.9rem; color: #64748b; max-width: 500px; margin: 0 auto;">There are currently no active service package offers listed in the marketplace.</p>
            </div>
        `;

        if (!allOffers || allOffers.length === 0) {
            if (providersGrid) providersGrid.innerHTML = emptyHTML;
            if (featuredGrid) featuredGrid.innerHTML = emptyHTML;
            return;
        }

        const cardsHTML = allOffers.map(offer => {
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

        if (providersGrid) providersGrid.innerHTML = cardsHTML;
        if (featuredGrid) featuredGrid.innerHTML = cardsHTML;

        const searchResultsGrid = document.getElementById('search-results-grid');
        if (searchResultsGrid) searchResultsGrid.innerHTML = cardsHTML;
        const countSpan = document.getElementById('search-results-count');
        if (countSpan) countSpan.textContent = allOffers.length;
    };

    // Hero Search Input & Button Listeners (Universal Search across Place, Events, Inclusions, Providers, Packages)
    const heroSearchInput = document.getElementById('hero-search-input');
    const heroSearchBtn = document.getElementById('hero-search-btn');
    const homePlaceSelect = document.getElementById('home-place-select');

    const handleUniversalSearchInput = () => {
        const val = heroSearchInput ? heroSearchInput.value.trim() : (navSearchInput ? navSearchInput.value.trim() : '');
        searchQuery = val;
        fetchProvidersFromAPI();
    };

    if (heroSearchBtn) {
        heroSearchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleUniversalSearchInput();
        });
    }

    if (heroSearchInput) {
        heroSearchInput.addEventListener('input', handleUniversalSearchInput);
        heroSearchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleUniversalSearchInput();
            }
        });
    }

    if (navSearchInput) {
        navSearchInput.addEventListener('input', handleUniversalSearchInput);
    }

    if (homePlaceSelect) {
        homePlaceSelect.addEventListener('change', (e) => {
            const val = e.target.value;
            locationQuery = (val === 'all' || val === 'All') ? '' : val;
            fetchProvidersFromAPI();
        });
    }

    // Global Offer Details Modal Handler
    window.openMarketplaceOfferModal = async (pkgId, providerId) => {
        let modal = document.getElementById('modal-marketplace-offer-details');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-marketplace-offer-details';
            modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(10,25,47,0.85); backdrop-filter:blur(8px); z-index:999999; align-items:center; justify-content:center; padding:20px; box-sizing:border-box;';
            modal.innerHTML = `
                <div style="background:#ffffff; border-radius:24px; width:100%; max-width:960px; max-height:94vh; overflow-y:auto; box-shadow:0 25px 60px rgba(0,0,0,0.4); position:relative;">
                    <button type="button" onclick="document.getElementById('modal-marketplace-offer-details').style.display='none'" style="position:absolute; top:20px; right:20px; width:44px; height:44px; border-radius:50%; background:#f1f5f9; border:none; color:#475569; font-size:1.3rem; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:10; transition:all 0.2s ease;" onmouseover="this.style.background='#e2e8f0'; this.style.color='#0f172a'" onmouseout="this.style.background='#f1f5f9'; this.style.color='#475569'">&times;</button>
                    <div id="offer-details-modal-body" style="padding:32px;"></div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        const modalBody = modal.querySelector('#offer-details-modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div style="text-align:center; padding:50px 20px;">
                <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2.5rem; color:#2563eb;"></i>
                <p style="margin-top:16px; font-weight:700; color:#475569;">Loading Offer Details...</p>
            </div>
        `;
        modal.style.display = 'flex';

        let targetOffer = null;
        const providersPool = []
            .concat(typeof currentLoadedProviders !== 'undefined' ? currentLoadedProviders : [])
            .concat(window.allRawProvidersCache || [])
            .concat(window.providerDatabase || []);
        
        // A. Match package ID & provider ID in pool
        for (const p of providersPool) {
            if (Array.isArray(p.packages)) {
                const found = p.packages.find(k => String(k.PackageID || k.id) === String(pkgId));
                if (found && (!providerId || String(p.id) === String(providerId) || String(p.userId) === String(providerId))) {
                    targetOffer = {
                        ...found,
                        providerId: p.id || p.userId,
                        providerName: p.name || p.businessName || 'Service Provider',
                        providerAvatar: p.profilePicture || p.avatar || p.userProfilePicture,
                        providerRating: p.rating || 5.0,
                        providerVerified: p.verified,
                        coverageArea: p.coverageArea || p.location || 'Batangas'
                    };
                    break;
                }
            }
        }

        // B. Fallback match: pkgId alone in pool
        if (!targetOffer) {
            for (const p of providersPool) {
                if (Array.isArray(p.packages)) {
                    const found = p.packages.find(k => String(k.PackageID || k.id) === String(pkgId));
                    if (found) {
                        targetOffer = {
                            ...found,
                            providerId: p.id || p.userId,
                            providerName: p.name || p.businessName || 'Service Provider',
                            providerAvatar: p.profilePicture || p.avatar || p.userProfilePicture,
                            providerRating: p.rating || 5.0,
                            providerVerified: p.verified,
                            coverageArea: p.coverageArea || p.location || 'Batangas'
                        };
                        break;
                    }
                }
            }
        }

        // C. Network fetch fallback: fetch from API
        if (!targetOffer) {
            try {
                const fetchUrl = (providerId && providerId !== 'undefined') ? `/api/providers/${providerId}` : '/api/providers';
                const res = await fetch(fetchUrl);
                if (res.ok) {
                    const data = await res.json();
                    let provs = [];
                    if (data.success) {
                        if (Array.isArray(data.data)) provs = data.data;
                        else if (data.data) provs = [data.data];
                    }
                    for (const p of provs) {
                        if (Array.isArray(p.packages)) {
                            const found = p.packages.find(k => String(k.PackageID || k.id) === String(pkgId));
                            if (found) {
                                targetOffer = {
                                    ...found,
                                    providerId: p.id || p.userId,
                                    providerName: p.name || p.businessName || 'Service Provider',
                                    providerAvatar: p.profilePicture || p.avatar || p.userProfilePicture,
                                    providerRating: p.rating || 5.0,
                                    providerVerified: p.verified,
                                    coverageArea: p.coverageArea || p.location || 'Batangas'
                                };
                                break;
                            }
                        }
                    }
                }
            } catch (err) {
                console.error('Error fetching offer details fallback:', err);
            }
        }

        if (!targetOffer) {
            modalBody.innerHTML = `
                <div style="text-align:center; padding:40px 20px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem; color:#f59e0b; margin-bottom:12px;"></i>
                    <h3 style="margin:0 0 8px 0; font-size:1.2rem; color:#0a192f;">Package Details Unavailable</h3>
                    <p style="color:#64748b; font-size:0.95rem; margin-bottom:20px;">Could not load details for this offer package.</p>
                    <button type="button" onclick="window.location.href='/provider-detail.html?id=${providerId || ''}'" style="padding:10px 20px; background:#2563eb; color:#fff; border:none; border-radius:10px; font-weight:700; cursor:pointer;">View Storefront Profile</button>
                </div>
            `;
            return;
        }

        const title = targetOffer.PackageName || targetOffer.name || 'Service Offer Package';
        const price = parseFloat(targetOffer.Price || targetOffer.price || 0);
        const category = targetOffer.Category || targetOffer.category || 'Concert Audio & Stage Lights';
        const desc = targetOffer.Description || targetOffer.description || 'Full event audio and lighting setup package.';
        const rawModalInc = targetOffer.Inclusions || targetOffer.inclusions || desc;
        const inclusions = Array.isArray(rawModalInc)
            ? rawModalInc.map(s => String(s).trim()).filter(Boolean)
            : String(rawModalInc).split(/[\r\n,]+/).map(s => s.trim()).filter(Boolean);

        const images = Array.isArray(targetOffer.images) ? targetOffer.images : [];
        const mainImgUrl = images.length > 0 && images[0].url ? 
            (images[0].url.startsWith('/') || images[0].url.startsWith('http') ? images[0].url : `/${images[0].url}`) : null;

        const avatarSrc = targetOffer.providerAvatar;
        const avatarHTML = avatarSrc ?
            `<img src="${avatarSrc.startsWith('/') || avatarSrc.startsWith('http') ? avatarSrc : '/' + avatarSrc}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" class="enlargeable-photo">` :
            `<i class="fa-solid fa-store" style="color:#2563eb;"></i>`;

        modalBody.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:24px;">
                <!-- Main Header / Setup Photo (Enlarged Height 420px) -->
                <div style="position:relative; width:100%; height:420px; border-radius:20px; overflow:hidden; background:linear-gradient(135deg, #0a192f 0%, #1e3e62 100%); display:flex; align-items:center; justify-content:center; cursor:pointer;" onclick="const img=this.querySelector('img'); if(img && img.src) window.openPhotoLightbox(img.src);" title="Click photo to enlarge full screen">
                    ${mainImgUrl ? 
                        `<img id="modal-offer-main-img" src="${mainImgUrl}" class="enlargeable-photo" style="width:100%; height:100%; object-fit:cover; transition:transform 0.35s ease;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">` : 
                        `<i class="fa-solid fa-sliders" style="font-size:5rem; color:rgba(255,255,255,0.18);"></i>`
                    }
                    <span style="position:absolute; top:18px; left:18px; background:rgba(37,99,235,0.95); color:#ffffff; padding:8px 18px; border-radius:24px; font-size:0.9rem; font-weight:800; text-transform:uppercase; backdrop-filter:blur(4px); box-shadow:0 3px 10px rgba(0,0,0,0.3);">${category}</span>
                    <span style="position:absolute; top:18px; right:18px; background:rgba(16,185,129,0.95); color:#ffffff; padding:8px 18px; border-radius:24px; font-size:0.9rem; font-weight:800; backdrop-filter:blur(4px); box-shadow:0 3px 10px rgba(0,0,0,0.3);"><i class="fa-solid fa-circle-check"></i> Available</span>
                    ${mainImgUrl ? `<span style="position:absolute; bottom:18px; right:18px; background:rgba(10,25,47,0.85); color:#ffffff; padding:8px 18px; border-radius:20px; font-size:0.88rem; font-weight:800; backdrop-filter:blur(6px); box-shadow:0 4px 12px rgba(0,0,0,0.3); pointer-events:none;"><i class="fa-solid fa-magnifying-glass-plus"></i> Click Photo to Enlarge Full Screen</span>` : ''}
                </div>

                <!-- Gallery Thumbnails (Enlarged 88px x 88px) -->
                ${images.length > 1 ? `
                    <div>
                        <strong style="font-size:0.88rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:10px; font-weight:800; letter-spacing:0.5px;">Setup & Inclusion Photos Gallery (${images.length} photos):</strong>
                        <div style="display:flex; gap:12px; overflow-x:auto; padding-bottom:8px;">
                            ${images.map(img => {
                                const u = img.url.startsWith('/') || img.url.startsWith('http') ? img.url : `/${img.url}`;
                                return `<img src="${u}" class="enlargeable-photo" onclick="document.getElementById('modal-offer-main-img').src='${u}'; window.openPhotoLightbox('${u}');" style="width:88px; height:88px; border-radius:14px; object-fit:cover; border:2.5px solid #2563eb; cursor:pointer; flex-shrink:0; transition:transform 0.25s ease;" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" title="Click to view & enlarge photo">`;
                            }).join('')}
                        </div>
                    </div>
                ` : ''}

                <!-- Offer Details -->
                <div>
                    <h2 style="margin:0 0 12px 0; font-size:1.85rem; font-weight:900; color:#0a192f; line-height:1.3;">${title}</h2>
                    
                    <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:22px; border-bottom:1px solid #e2e8f0; padding-bottom:18px;">
                        <div style="font-size:2.1rem; font-weight:900; color:#2563eb; letter-spacing:-0.5px;">
                            ₱${price.toLocaleString('en-US', {minimumFractionDigits: 2})} 
                            <span style="font-size:1.0rem; color:#64748b; font-weight:600;">/ Event Rental</span>
                        </div>
                        <div style="font-size:1.05rem; font-weight:800; color:#10b981; background:#ecfdf5; padding:6px 16px; border-radius:24px; border:1px solid #a7f3d0;">
                            <i class="fa-solid fa-circle-check"></i> Available for Booking
                        </div>
                    </div>

                    <!-- Complete Description -->
                    <div style="margin-bottom:22px;">
                        <strong style="font-size:0.88rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:8px; font-weight:800;">Offer Description:</strong>
                        <p style="margin:0; font-size:1.1rem; color:#334155; line-height:1.6; background:#f8fafc; padding:18px 20px; border-radius:14px; border:1px solid #e2e8f0;">${desc}</p>
                    </div>

                    <!-- Itemized Inclusions List -->
                    <div style="margin-bottom:24px; background:#eff6ff; padding:20px 24px; border-radius:16px; border:1px solid #bfdbfe;">
                        <strong style="font-size:0.92rem; color:#1e40af; text-transform:uppercase; display:block; margin-bottom:12px; font-weight:800; letter-spacing:0.5px;"><i class="fa-solid fa-list-check" style="margin-right:8px;"></i> Complete Equipment & Service Inclusions:</strong>
                        <ul style="list-style:none; padding:0; margin:0; font-size:1.08rem; color:#1e293b; display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:10px;">
                            ${inclusions.map(inc => `<li style="display:flex; align-items:center; gap:10px; font-weight:700;"><i class="fa-solid fa-circle-check" style="color:#10b981; font-size:1.15rem; flex-shrink:0;"></i> ${inc}</li>`).join('')}
                        </ul>
                    </div>

                    <!-- Provider Meta Section -->
                    <div style="display:flex; align-items:center; justify-content:space-between; background:#f8fafc; padding:16px 20px; border-radius:16px; border:1px solid #e2e8f0; margin-bottom:24px; cursor:pointer;" onclick="window.location.href='/provider-detail.html?id=${targetOffer.providerId}'" title="View Storefront Profile of ${targetOffer.providerName}">
                        <div style="display:flex; align-items:center; gap:16px;">
                            <div style="width:54px; height:54px; border-radius:50%; background:#ffffff; display:flex; align-items:center; justify-content:center; overflow:hidden; border:2.5px solid #2563eb; flex-shrink:0;" onclick="event.stopPropagation(); const img=this.querySelector('img'); if(img && img.src) window.openPhotoLightbox(img.src);">
                                ${avatarHTML}
                            </div>
                            <div>
                                <a href="/provider-detail.html?id=${targetOffer.providerId}" onclick="event.stopPropagation();" style="font-size:1.2rem; font-weight:800; color:#0a192f; text-decoration:none; display:block;" title="View Provider Profile">
                                    ${targetOffer.providerName} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.8rem; color:#2563eb; margin-left:6px;"></i>
                                </a>
                                <span style="font-size:0.85rem; color:#2563eb; font-weight:700;"><i class="fa-solid fa-circle-check"></i> SoundSphere Verified Provider</span>
                                <span style="font-size:0.85rem; color:#64748b; display:block; margin-top:2px;"><i class="fa-solid fa-location-dot" style="color:#ef4444; margin-right:4px;"></i> ${targetOffer.coverageArea}</span>
                            </div>
                        </div>
                        <div>
                            <button type="button" onclick="event.stopPropagation(); window.location.href='/provider-detail.html?id=${targetOffer.providerId}'" style="padding:10px 18px; border:1.5px solid #2563eb; border-radius:12px; background:#ffffff; color:#2563eb; font-size:0.92rem; font-weight:800; cursor:pointer;" title="View Storefront Profile">
                                <i class="fa-solid fa-store" style="margin-right:6px;"></i> Profile
                            </button>
                        </div>
                    </div>

                    <!-- Modal Actions -->
                    <div style="display:flex; gap:14px;">
                        <button type="button" onclick="window.location.href='/client-messages.html?providerId=${targetOffer.providerId}&providerName=${encodeURIComponent(targetOffer.providerName)}'" style="flex:1; height:52px; border:1px solid #cbd5e1; border-radius:12px; background:#ffffff; color:#0a192f; font-weight:800; font-size:1.05rem; cursor:pointer; transition:all 0.2s ease;">
                            <i class="fa-solid fa-comment-dots" style="color:#2563eb; margin-right:8px;"></i> Message Provider
                        </button>
                        <button type="button" onclick="window.location.href='/provider-detail.html?id=${targetOffer.providerId}&pkgId=${targetOffer.PackageID}'" style="flex:1.4; height:52px; border:none; border-radius:12px; background:#2563eb; color:#ffffff; font-weight:800; font-size:1.1rem; cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,0.3); transition:all 0.2s ease;">
                            <i class="fa-solid fa-calendar-check" style="margin-right:8px;"></i> Book This Offer Now
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
    };

    // Initial API Fetch
    fetchProvidersFromAPI();
});
