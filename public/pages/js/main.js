/**
 * SoundSphere - Client Application Main Script for Public Interface (index.html)
 * Dynamically fetches & displays real Service Providers & Packages from SQL Server DB (/api/providers)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Logged-in Auth Check: Automatically redirect authenticated users to their dashboard / marketplace
    const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_auth_token') || localStorage.getItem('soundsphere_jwt_token'));
    const user = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthUser() : (() => {
        try { return JSON.parse(localStorage.getItem('soundsphere_user')); } catch (e) { return null; }
    })();

    if (token && user) {
        const role = ((user && (user.role || user.RoleName || user.roleName)) || '').toLowerCase();
        const target = (role === 'admin' || role === 'administrator') ? '/admin/dashboard.html' :
                       (role === 'cashier') ? '/cashier/dashboard.html' :
                       (role === 'serviceprovider' || role === 'provider') ? '/provider/dashboard.html' :
                       '/marketplace.html';
        window.location.replace(target);
        return;
    }

    // 2. Dynamic Fetching & Rendering of Real Service Providers from SQL Server DB
    const packagesGrid = document.getElementById('public-packages-grid');

    const fetchPublicProviders = async () => {
        if (!packagesGrid) return;

        // Render Loading State
        packagesGrid.innerHTML = `
            <div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: #64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: #2563eb;"></i>
                <p style="margin-top: 10px; font-weight: 600;">Loading verified service providers from database...</p>
            </div>
        `;

        try {
            const url = '/api/providers';
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const data = await response.json();
            const providers = data.data || [];

            if (providers.length === 0) {
                packagesGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1;">
                        <i class="fa-solid fa-sliders" style="font-size: 2.5rem; color: #94a3b8;"></i>
                        <h4 style="margin-top: 12px; color: #0a192f; font-weight: 700;">No Approved Service Providers Currently Listed</h4>
                        <p style="color: #64748b; font-size: 0.9rem; margin-top: 4px;">Service providers approved by the Administrator will automatically appear here.</p>
                    </div>
                `;
                return;
            }

            // Collect all packages across all approved providers
            const packageItems = [];
            providers.forEach(p => {
                if (p.packages && p.packages.length > 0) {
                    p.packages.forEach(pkg => {
                        packageItems.push({
                            provider: p,
                            pkg: pkg
                        });
                    });
                }
            });

            if (packageItems.length === 0) {
                packagesGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; padding: 40px; text-align: center; background: #ffffff; border-radius: 12px; border: 1px solid #cbd5e1;">
                        <i class="fa-solid fa-sliders" style="font-size: 2.5rem; color: #94a3b8;"></i>
                        <h4 style="margin-top: 12px; color: #0a192f; font-weight: 700;">No Available Packages Currently Listed</h4>
                        <p style="color: #64748b; font-size: 0.9rem; margin-top: 4px;">Service packages created by providers will automatically appear here once published.</p>
                    </div>
                `;
                return;
            }

            // Initialize global package photos dictionary for slider & lightbox
            if (!window.packagePhotosMap) window.packagePhotosMap = {};

            const allPackageItems = packageItems;
            const searchBanner = document.getElementById('search-status-banner');
            const searchStatusText = document.getElementById('search-status-text');
            const searchClearBtn = document.getElementById('search-status-clear-btn');
            const mainSearchInput = document.getElementById('main-search-input');
            const mainSearchBtn = document.getElementById('main-search-btn');

            const escapeHtml = (str) => {
                return String(str || '').replace(/[&<>"']/g, m => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                }[m]));
            };

            const renderPackages = (items) => {
                if (!items || items.length === 0) {
                    packagesGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: #ffffff; border-radius: 14px; border: 1.5px dashed #cbd5e1; box-shadow: 0 4px 14px rgba(10,25,47,0.04);">
                            <div style="width: 64px; height: 64px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: inline-flex; align-items: center; justify-content: center; font-size: 1.8rem; margin-bottom: 14px;">
                                <i class="fa-solid fa-magnifying-glass"></i>
                            </div>
                            <h4 style="color: #0a192f; font-weight: 800; font-size: 1.15rem; margin: 0 0 6px 0;">No Matching Packages Found</h4>
                            <p style="color: #64748b; font-size: 0.9rem; max-width: 500px; margin: 0 auto 18px auto; line-height: 1.45;">
                                We couldn't find any service packages matching your search. Try searching by service provider (e.g. <em>CHiCHa, AG Lights</em>), package type (e.g. <em>Wedding, Birthday</em>), equipment (e.g. <em>Speakers, Lights, Mic</em>), or area (e.g. <em>Lian, Balayan, Nasugbu</em>).
                            </p>
                            <button type="button" id="btn-reset-empty-search" style="background: #2563eb; color: #ffffff; border: none; padding: 10px 22px; border-radius: 10px; font-weight: 800; cursor: pointer; font-size: 0.88rem; box-shadow: 0 4px 12px rgba(37,99,235,0.25);">
                                <i class="fa-solid fa-rotate-left" style="margin-right: 6px;"></i> View All Packages
                            </button>
                        </div>
                    `;

                    const resetEmptyBtn = document.getElementById('btn-reset-empty-search');
                    if (resetEmptyBtn) {
                        resetEmptyBtn.addEventListener('click', () => {
                            if (mainSearchInput) mainSearchInput.value = '';
                            applySearch('');
                        });
                    }
                    return;
                }

                packagesGrid.innerHTML = items.map((item, index) => {
                    const p = item.provider;
                    const pkg = item.pkg;
                    const title = pkg.name || pkg.title || 'Sound Package';
                    const rawPrice = Number(pkg.price || p.startingPrice || 15000);
                    const providerName = p.businessName || p.name || 'SoundSphere Provider';
                    const businessAddress = p.businessAddress || p.address || '';
                    const coverageArea = p.coverageArea || 'Batangas';
                    const category = (pkg.category || 'Basic Package').toUpperCase();
                    const cardKey = `main-pkg-${p.id || index}-${pkg.id || index}`;

                    // Inclusions parsing
                    let inclusions = [];
                    if (Array.isArray(pkg.inclusions)) {
                        inclusions = pkg.inclusions.filter(Boolean);
                    } else if (typeof pkg.inclusions === 'string' && pkg.inclusions.trim()) {
                        inclusions = pkg.inclusions.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
                    }

                    // Photos extraction
                    let rawPhotos = [];
                    if (pkg.images && Array.isArray(pkg.images)) {
                        rawPhotos = pkg.images.map(img => typeof img === 'string' ? img : (img && img.url ? img.url : '')).filter(Boolean);
                    } else if (pkg.photos && Array.isArray(pkg.photos)) {
                        rawPhotos = pkg.photos.map(img => typeof img === 'string' ? img : (img && img.url ? img.url : '')).filter(Boolean);
                    }
                    if (rawPhotos.length === 0 && p.banner) {
                        rawPhotos.push(p.banner);
                    }
                    if (rawPhotos.length === 0) {
                        rawPhotos.push(index % 2 === 0 ? 'assets/images/banner.png' : 'assets/images/wedding.png');
                    }

                    const pkgPhotoUrls = rawPhotos.map(url => {
                        let clean = url.trim();
                        if (clean.startsWith('/data:')) return clean.substring(1);
                        return clean;
                    });

                    window.packagePhotosMap[cardKey] = pkgPhotoUrls;

                    const firstPhotoUrl = pkgPhotoUrls[0] || 'assets/images/banner.png';
                    const hasMultiplePkgPhotos = pkgPhotoUrls.length > 1;

                    // Provider Avatar extraction
                    let avatarSrc = p.profilePicture || p.avatar || p.userProfilePicture || '';
                    if (avatarSrc && typeof avatarSrc === 'string') {
                        avatarSrc = avatarSrc.trim();
                        if (avatarSrc.startsWith('/data:')) avatarSrc = avatarSrc.substring(1);
                        else if (!avatarSrc.startsWith('/') && !avatarSrc.startsWith('http') && !avatarSrc.startsWith('data:')) avatarSrc = '/' + avatarSrc;
                    }
                    const avatarHTML = avatarSrc ?
                        `<img src="${avatarSrc}" alt="${escapeHtml(providerName)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;" onerror="this.outerHTML='<i class=\\'fa-solid fa-store\\' style=\\'color:#2563eb;\\'></i>'">` :
                        `<i class="fa-solid fa-store" style="color:#2563eb;"></i>`;

                    return `
                        <div class="package-card shopee-offer-card" data-provider-id="${p.id}" data-package-id="${pkg.id || ''}" data-price="${rawPrice}" data-title="${escapeHtml(title)}" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; overflow:hidden; box-shadow:0 1px 4px rgba(10,25,47,0.06); transition:all 0.25s ease; display:flex; flex-direction:column; justify-content:space-between; width:100%; box-sizing:border-box;">
                            <div>
                                <!-- 1. Setup / Equipment Photo Carousel -->
                                <div class="offer-card-image-wrap" 
                                     data-pkg-id="${cardKey}" 
                                     data-photo-idx="0" 
                                     style="position:relative; height:180px; overflow:hidden; background:linear-gradient(135deg, #0a192f 0%, #1e3e62 100%); display:flex; align-items:center; justify-content:center; user-select:none; cursor:pointer;" 
                                     onclick="if(!event.target.closest('.card-carousel-btn') && !event.target.closest('.card-enlarge-btn')) { if (window.packagePhotosMap && window.packagePhotosMap['${cardKey}'] && window.packagePhotosMap['${cardKey}'].length > 1) { window.switchCardPhoto('${cardKey}', 'next', event); } else { window.openCardGalleryLightbox('${cardKey}', event); } }"
                                     title="${hasMultiplePkgPhotos ? 'Click photo to swipe to next photo' : 'Click photo to enlarge'}">
                                    <img id="main-offer-img-${cardKey}" src="${firstPhotoUrl}" alt="${escapeHtml(title)}" class="card-main-img" style="width:100%; height:100%; object-fit:cover; transition:transform 0.25s ease, opacity 0.15s ease;">
                                    <span style="position:absolute; top:10px; left:10px; background:rgba(37,99,235,0.95); color:#ffffff; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:800; text-transform:uppercase; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:none; z-index:2;">${escapeHtml(category)}</span>
                                    <span style="position:absolute; top:10px; right:10px; background:rgba(16,185,129,0.95); color:#ffffff; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:800; backdrop-filter:blur(4px); box-shadow:0 2px 4px rgba(0,0,0,0.2); pointer-events:none; z-index:2;"><i class="fa-solid fa-circle-check"></i> Available</span>

                                    ${hasMultiplePkgPhotos ? `
                                        <button type="button" class="card-carousel-btn prev-btn" onclick="event.stopPropagation(); window.switchCardPhoto('${cardKey}', 'prev', event);" title="Previous photo" style="position:absolute; left:8px; top:50%; transform:translateY(-50%); width:30px; height:30px; border-radius:50%; background:rgba(10,25,47,0.75); color:#ffffff; border:1px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:all 0.2s ease; z-index:4;">
                                            <i class="fa-solid fa-chevron-left" style="font-size:0.8rem;"></i>
                                        </button>
                                        <button type="button" class="card-carousel-btn next-btn" onclick="event.stopPropagation(); window.switchCardPhoto('${cardKey}', 'next', event);" title="Next photo" style="position:absolute; right:8px; top:50%; transform:translateY(-50%); width:30px; height:30px; border-radius:50%; background:rgba(10,25,47,0.75); color:#ffffff; border:1px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(4px); transition:all 0.2s ease; z-index:4;">
                                            <i class="fa-solid fa-chevron-right" style="font-size:0.8rem;"></i>
                                        </button>
                                        <span id="card-photo-counter-${cardKey}" style="position:absolute; bottom:10px; left:10px; background:rgba(10,25,47,0.75); color:#ffffff; padding:2px 8px; border-radius:10px; font-size:0.6875rem; font-weight:800; backdrop-filter:blur(4px); pointer-events:none; border:1px solid rgba(255,255,255,0.2); z-index:2;">
                                            1 / ${pkgPhotoUrls.length}
                                        </span>
                                    ` : ''}

                                    <button type="button" class="card-enlarge-btn" onclick="event.stopPropagation(); window.openCardGalleryLightbox('${cardKey}', event);" style="position:absolute; bottom:10px; right:10px; background:rgba(10,25,47,0.78); color:#ffffff; padding:3px 9px; border-radius:8px; font-size:0.6875rem; font-weight:700; backdrop-filter:blur(4px); border:1px solid rgba(255,255,255,0.25); cursor:pointer; display:flex; align-items:center; gap:4px; transition:all 0.2s; z-index:3;" title="Click to enlarge photo">
                                        <i class="fa-solid fa-magnifying-glass-plus" style="color:#60a5fa;"></i> Enlarge
                                    </button>
                                </div>

                                <!-- Mini Gallery Preview Thumbnails -->
                                ${hasMultiplePkgPhotos ? `
                                    <div id="card-thumbnails-row-${cardKey}" style="display:flex; gap:6px; padding:6px 10px; background:#f8fafc; border-bottom:1px solid #e2e8f0; overflow-x:auto;">
                                        ${pkgPhotoUrls.map((pUrl, pIdx) => `
                                            <img src="${pUrl}" class="card-thumb-item ${pIdx === 0 ? 'active' : ''}" 
                                                 data-pkg-id="${cardKey}" 
                                                 data-idx="${pIdx}" 
                                                 onclick="event.stopPropagation(); window.switchCardPhoto('${cardKey}', ${pIdx}, event);" 
                                                 style="width:36px; height:36px; border-radius:6px; object-fit:cover; border:2px solid ${pIdx === 0 ? '#2563eb' : '#cbd5e1'}; cursor:pointer; flex-shrink:0; opacity:${pIdx === 0 ? '1' : '0.65'}; transition:all 0.2s ease; ${pIdx === 0 ? 'box-shadow:0 2px 6px rgba(37,99,235,0.35); transform:scale(1.05);' : ''}" 
                                                 onmouseover="this.style.opacity='1'; this.style.transform='scale(1.08)';" 
                                                 onmouseout="if(!this.classList.contains('active')) { this.style.opacity='0.65'; this.style.transform='scale(1)'; }" 
                                                 title="Photo ${pIdx + 1} - Click to switch">
                                        `).join('')}
                                    </div>
                                ` : ''}

                                <!-- Card Content Body -->
                                <div style="padding:16px 16px 8px 16px;">
                                    <!-- Service Package Title -->
                                    <h3 onclick="window.location.href='/provider-detail.html?id=${p.id}${pkg.id ? `&package_id=${pkg.id}` : ''}'" style="margin:0 0 8px 0; font-size:1.05rem; font-weight:800; color:#0a192f; line-height:1.35; min-height:2.7em; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; cursor:pointer; transition:color 0.2s ease;" onmouseover="this.style.color='#2563eb'" onmouseout="this.style.color='#0a192f'" title="${escapeHtml(title)}">${escapeHtml(title)}</h3>

                                    <!-- Price Row -->
                                    <div style="margin-bottom:10px;">
                                        <div style="font-size:1.25rem; font-weight:900; color:#2563eb; letter-spacing:-0.2px;">
                                            ₱${rawPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                                            <span style="font-size:0.8125rem; color:#64748b; font-weight:600;">/Event</span>
                                        </div>
                                    </div>

                                    <!-- Inclusions Box -->
                                    <div onclick="window.location.href='/provider-detail.html?id=${p.id}${pkg.id ? `&package_id=${pkg.id}` : ''}'" style="margin-bottom:10px; background:#f8fafc; padding:8px 12px; border-radius:6px; border:1px solid #e2e8f0; cursor:pointer;" title="Click to view inclusions">
                                        <strong style="font-size:0.75rem; color:#475569; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px; font-weight:800;">INCLUSIONS:</strong>
                                        <ul style="list-style:none; padding:0; margin:0; font-size:0.8125rem; color:#0f172a; display:flex; flex-direction:column; gap:3px;">
                                            ${inclusions.slice(0, 3).map(inc => `<li style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-weight:600;"><i class="fa-solid fa-check" style="color:#059669; margin-right:6px; font-size:0.8125rem; font-weight:900;"></i> ${escapeHtml(inc)}</li>`).join('')}
                                            ${inclusions.length > 3 ? `<li style="font-size:0.75rem; color:#64748b; font-style:italic; font-weight:600; margin-top:2px;">+ ${inclusions.length - 3} more included</li>` : ''}
                                        </ul>
                                    </div>

                                    <!-- Provider Profile and Coverage Location -->
                                    <div style="border-top:1px solid #e2e8f0; padding-top:10px; margin-top:8px;">
                                        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.location.href='/provider-detail.html?id=${p.id}'" title="View Storefront Profile of ${escapeHtml(providerName)}">
                                            <div style="width:32px; height:32px; border-radius:50%; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; font-size:0.875rem; overflow:hidden; border:1px solid #93c5fd; flex-shrink:0;">
                                                ${avatarHTML}
                                            </div>
                                            <div style="overflow:hidden; flex:1;">
                                                <a href="/provider-detail.html?id=${p.id}" onclick="event.stopPropagation();" style="font-size:0.875rem; font-weight:800; color:#0a192f; text-decoration:none; display:flex; align-items:center; gap:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="Click to view ${escapeHtml(providerName)} Profile">
                                                    ${escapeHtml(providerName)} <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.6875rem; color:#2563eb;"></i>
                                                </a>
                                                <span style="font-size:0.8125rem; color:#64748b; font-weight:500; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px;">
                                                    ${businessAddress ? `<span title="Business Place"><i class="fa-solid fa-store" style="color:#2563eb; margin-right:3px;"></i>${escapeHtml(businessAddress)}</span> <span style="margin:0 4px; color:#cbd5e1;">•</span> ` : ''}<span title="Coverage Area"><i class="fa-solid fa-location-dot" style="color:#ef4444; margin-right:3px;"></i>${escapeHtml(coverageArea)}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Bottom Action Buttons: Chat & Book Now -->
                            <div style="padding:0 16px 16px 16px;">
                                <div style="display:flex; gap:8px;">
                                    <button type="button" class="btn-card-chat" data-provider-id="${p.id}" data-provider-name="${encodeURIComponent(providerName)}" style="flex:1; height:40px; border:1px solid #bfdbfe; border-radius:8px; background:#eff6ff; color:#2563eb; font-weight:700; font-size:0.875rem; cursor:pointer; transition:all 0.2s ease; display:inline-flex; align-items:center; justify-content:center; gap:6px;" title="Message Provider">
                                        <i class="fa-solid fa-comment-dots"></i> Chat
                                    </button>
                                    <button type="button" class="btn-action-book" data-provider-id="${p.id}" data-pkg-id="${pkg.id || ''}" data-pkg-title="${encodeURIComponent(title)}" data-pkg-price="${rawPrice}" data-provider-name="${encodeURIComponent(providerName)}" style="flex:1.2; height:40px; border:none; border-radius:8px; background:#2563eb; color:#ffffff; font-weight:700; font-size:0.875rem; cursor:pointer; box-shadow:0 2px 6px rgba(37,99,235,0.25); transition:all 0.2s ease; display:inline-flex; align-items:center; justify-content:center; gap:6px;" title="Book Offer">
                                        Book Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');

                // Attach Chat Button Click Listener
                const chatBtns = packagesGrid.querySelectorAll('.btn-card-chat');
                chatBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const providerId = btn.getAttribute('data-provider-id');
                        const providerName = decodeURIComponent(btn.getAttribute('data-provider-name') || '');
                        const targetUrl = `/client-messages.html?providerId=${providerId}&providerName=${encodeURIComponent(providerName)}`;

                        if (!token || !user) {
                            if (typeof window.openAuthModal === 'function') {
                                window.openAuthModal('login', { returnUrl: targetUrl });
                            } else {
                                sessionStorage.setItem('soundsphere_pending_redirect', targetUrl);
                                window.location.href = `/login.html?returnUrl=${encodeURIComponent(targetUrl)}`;
                            }
                        } else {
                            window.location.href = targetUrl;
                        }
                    });
                });

                // Attach Unauthenticated Booking Check to Dynamic "Book Now" Buttons
                const actionBookBtns = packagesGrid.querySelectorAll('.btn-action-book');
                actionBookBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const providerId = btn.getAttribute('data-provider-id');
                        const pkgId = btn.getAttribute('data-pkg-id');
                        const pkgTitle = decodeURIComponent(btn.getAttribute('data-pkg-title') || '');
                        const pkgPrice = parseInt(btn.getAttribute('data-pkg-price'), 10) || 15000;
                        const providerName = decodeURIComponent(btn.getAttribute('data-provider-name') || '');

                        const pendingBooking = {
                            packageId: pkgId,
                            packageTitle: pkgTitle,
                            packagePrice: pkgPrice,
                            providerId: providerId,
                            providerName: providerName,
                            returnUrl: `/provider-detail.html?id=${providerId}`
                        };

                        if (!token || !user) {
                            e.preventDefault();
                            if (typeof window.openAuthModal === 'function') {
                                window.openAuthModal('login', pendingBooking);
                            } else {
                                sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBooking));
                                window.location.href = `/login.html?returnUrl=${encodeURIComponent(`/provider-detail.html?id=${providerId}`)}`;
                            }
                        } else {
                            sessionStorage.setItem('soundsphere_selected_package', JSON.stringify(pendingBooking));
                            window.location.href = `/booking.html?package_id=${pkgId || ''}&provider_id=${providerId}`;
                        }
                    });
                });

                // Make entire card clickable to view provider details
                packagesGrid.querySelectorAll('.package-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        if (e.target.closest('.offer-card-image-wrap') || 
                            e.target.closest('.card-thumb-item') || 
                            e.target.closest('.btn-card-chat') || 
                            e.target.closest('.btn-action-book') || 
                            e.target.closest('a')) return;
                        const providerId = card.getAttribute('data-provider-id');
                        const pkgId = card.getAttribute('data-package-id');
                        if (providerId) {
                            window.location.href = `/provider-detail.html?id=${providerId}${pkgId ? `&package_id=${pkgId}` : ''}`;
                        }
                    });
                });
            };

            // Universal Search Filter Function
            // Matches: Service Provider Name, Package Title, Category, Description, Inclusions (equipment), and Area / Location
            const applySearch = (query) => {
                const q = (query || '').trim();
                if (!q) {
                    if (searchBanner) searchBanner.style.display = 'none';
                    renderPackages(allPackageItems);
                    return;
                }

                const terms = q.toLowerCase().replace(/[,;:&/\\+]+/g, ' ').split(/\s+/).filter(Boolean);
                const filtered = allPackageItems.filter(item => {
                    const p = item.provider;
                    const pkg = item.pkg;

                    let inclusionsText = '';
                    if (Array.isArray(pkg.inclusions)) {
                        inclusionsText = pkg.inclusions.join(' ');
                    } else if (typeof pkg.inclusions === 'string') {
                        inclusionsText = pkg.inclusions;
                    }

                    const searchableContent = [
                        p.name || '',
                        p.businessName || '',
                        p.ownerName || '',
                        p.coverageArea || '',
                        p.businessAddress || '',
                        p.address || '',
                        p.city || '',
                        p.municipality || '',
                        p.province || '',
                        p.location || '',
                        pkg.name || '',
                        pkg.title || '',
                        pkg.category || '',
                        pkg.description || '',
                        inclusionsText
                    ].join(' ').toLowerCase();

                    return terms.every(term => searchableContent.includes(term));
                });

                if (searchBanner && searchStatusText) {
                    searchBanner.style.display = 'flex';
                    searchStatusText.innerHTML = `Found <strong>${filtered.length}</strong> package${filtered.length === 1 ? '' : 's'} for "<strong>${escapeHtml(q)}</strong>"`;
                }

                renderPackages(filtered);
            };

            // Attach Live Search Listeners
            if (mainSearchInput) {
                mainSearchInput.addEventListener('input', (e) => {
                    applySearch(e.target.value);
                });

                mainSearchInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        applySearch(mainSearchInput.value);
                        const section = document.querySelector('.flash-deals-section');
                        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            }

            if (mainSearchBtn) {
                mainSearchBtn.addEventListener('click', () => {
                    applySearch(mainSearchInput ? mainSearchInput.value : '');
                    const section = document.querySelector('.flash-deals-section');
                    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }

            if (searchClearBtn) {
                searchClearBtn.addEventListener('click', () => {
                    if (mainSearchInput) mainSearchInput.value = '';
                    applySearch('');
                });
            }

            // Check if user came with a search query in URL (?search=... or ?q=...)
            const urlParams = new URLSearchParams(window.location.search);
            const initialQuery = urlParams.get('search') || urlParams.get('q') || '';
            if (initialQuery && mainSearchInput) {
                mainSearchInput.value = initialQuery;
                applySearch(initialQuery);
            } else {
                renderPackages(allPackageItems);
            }

        } catch (err) {
            console.error('Error fetching public providers from DB:', err);
            packagesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #ef4444;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 2rem;"></i>
                    <p style="margin-top: 8px; font-weight: 700;">Failed to load service providers from database.</p>
                </div>
            `;
        }
    };

    fetchPublicProviders();
});

// ==================== GLOBAL PACKAGE PHOTO CAROUSEL & LIGHTBOX CONTROLLER ====================
window.packagePhotosMap = window.packagePhotosMap || {};

window.switchCardPhoto = (pkgId, target, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const urls = window.packagePhotosMap[pkgId] || [];
    if (!urls || urls.length <= 1) return;

    const wrap = document.getElementById(`pkg-photo-wrap-${pkgId}`) || document.querySelector(`.offer-card-image-wrap[data-pkg-id="${pkgId}"]`);
    const mainImg = document.getElementById(`main-offer-img-${pkgId}`) || (wrap ? wrap.querySelector('img.card-main-img, img') : null);
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
    const wrap = document.getElementById(`pkg-photo-wrap-${pkgId}`) || document.querySelector(`.offer-card-image-wrap[data-pkg-id="${pkgId}"]`);
    const currentIdx = wrap ? parseInt(wrap.getAttribute('data-photo-idx') || '0', 10) : 0;
    if (urls && urls.length > 0) {
        window.openPhotoLightbox(urls, currentIdx);
    } else {
        const mainImg = document.getElementById(`main-offer-img-${pkgId}`) || (wrap ? wrap.querySelector('img') : null);
        if (mainImg && mainImg.src) window.openPhotoLightbox(mainImg.src, 0);
    }
};

// Lightbox Viewer
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

            <button type="button" id="lightbox-prev-btn" style="position:absolute; left:24px; top:50%; transform:translateY(-50%); width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.18); border:1.5px solid rgba(255,255,255,0.3); color:#ffffff; font-size:1.3rem; cursor:pointer; display:none; align-items:center; justify-content:center; backdrop-filter:blur(8px); z-index:100000000; transition:all 0.2s ease;" title="Previous Photo">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button type="button" id="lightbox-next-btn" style="position:absolute; right:24px; top:50%; transform:translateY(-50%); width:52px; height:52px; border-radius:50%; background:rgba(255,255,255,0.18); border:1.5px solid rgba(255,255,255,0.3); color:#ffffff; font-size:1.3rem; cursor:pointer; display:none; align-items:center; justify-content:center; backdrop-filter:blur(8px); z-index:100000000; transition:all 0.2s ease;" title="Next Photo">
                <i class="fa-solid fa-chevron-right"></i>
            </button>

            <div id="lightbox-img-container" style="max-width:94vw; max-height:80vh; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; cursor:zoom-in;">
                <img id="lightbox-full-img" src="" alt="Enlarged Photo" style="max-width:92vw; max-height:78vh; border-radius:14px; object-fit:contain; box-shadow:0 25px 60px rgba(0,0,0,0.75); transform:scale(1); transition:transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.15s ease;">
            </div>

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
    }, 200);
};
