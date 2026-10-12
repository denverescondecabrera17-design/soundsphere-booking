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
                } else {
                    packageItems.push({
                        provider: p,
                        pkg: { id: null, name: p.name, price: p.startingPrice || 15000, images: [] }
                    });
                }
            });

            // Render Dynamic Real Package Cards
            packagesGrid.innerHTML = packageItems.map((item, index) => {
                const p = item.provider;
                const pkg = item.pkg;
                let bannerImg = (pkg.images && pkg.images[0] && pkg.images[0].url) || p.banner || (index % 2 === 0 ? 'assets/images/banner.png' : 'assets/images/wedding.png');
                if (typeof bannerImg === 'string' && bannerImg.startsWith('/data:')) {
                    bannerImg = bannerImg.substring(1);
                }
                return `
                    <div class="product-card" data-provider-id="${p.id}" data-package-id="${pkg.id || ''}" onclick="window.location.href='/provider-detail.html?id=${p.id}'" style="cursor:pointer;">
                        <span class="product-badge-mall">SoundSphere Verified</span>
                        <div class="product-img-wrapper">
                            <img src="${bannerImg}" alt="${pkg.name}" onerror="this.src='assets/images/banner.png'">
                        </div>
                        <div class="product-info">
                            <h4 class="product-title">${pkg.name}</h4>
                            <span class="provider-name-sub"><i class="fa-solid fa-store"></i> ${p.name}</span>
                            <div class="product-tags">
                                <span class="tag-pill"><i class="fa-solid fa-location-dot"></i> ${p.coverageArea || 'Batangas'}</span>
                            </div>
                            <div class="product-rating-row">
                                <span class="rating-stars">${p.rating ? p.rating.toFixed(1) : '5.0'} ★</span>
                                <span>Verified Provider</span>
                            </div>
                            <div class="product-price-row">
                                <span class="product-price">₱${priceFormatted}</span>
                                <button type="button" class="btn-book-sm btn-action-book" data-provider-id="${p.id}" data-pkg-id="${pkg.id || ''}" data-pkg-title="${pkg.name}" data-pkg-price="${pkg.price || p.startingPrice || 15000}" style="border:none; cursor:pointer;">Book Now</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Attach Unauthenticated Booking Check to Dynamic "Book Now" Buttons
            const actionBookBtns = packagesGrid.querySelectorAll('.btn-action-book');
            actionBookBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const providerId = btn.getAttribute('data-provider-id');
                    const pkgId = btn.getAttribute('data-pkg-id');
                    const pkgTitle = btn.getAttribute('data-pkg-title');
                    const pkgPrice = parseInt(btn.getAttribute('data-pkg-price'), 10) || 15000;

                    const pendingBooking = {
                        packageId: pkgId,
                        packageTitle: pkgTitle,
                        packagePrice: pkgPrice,
                        providerId: providerId,
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
            packagesGrid.querySelectorAll('.product-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    if (e.target.closest('.btn-action-book')) return;
                    const providerId = card.getAttribute('data-provider-id');
                    if (providerId) {
                        window.location.href = `/provider-detail.html?id=${providerId}`;
                    }
                });
            });

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
