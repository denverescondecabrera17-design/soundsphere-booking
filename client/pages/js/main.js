/**
 * SoundSphere - Client Application Main Script for Public Interface (index.html)
 * Dynamically fetches & displays real Service Providers & Packages from SQL Server DB (/api/providers)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic Public Navbar Auth Recognition
    const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : localStorage.getItem('soundsphere_jwt_token');
    const user = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthUser() : null;

    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        if (token && user) {
            const displayName = user.personalName || user.name || user.email || 'Account';
            const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            
            headerActions.innerHTML = `
                <div style="display:flex; align-items:center; gap:12px;">
                    <a href="${user.role === 'ServiceProvider' ? '/provider/dashboard.html' : '/marketplace.html'}" style="display:flex; align-items:center; gap:8px; color:#ffffff; text-decoration:none; font-weight:700; font-size:0.9rem; background:rgba(255,255,255,0.1); padding:6px 14px; border-radius:20px;">
                        <div style="width:28px; height:28px; border-radius:50%; background:#2563eb; color:#ffffff; display:flex; align-items:center; justify-content:center; font-size:0.75rem; font-weight:800;">${initials}</div>
                        <span>${displayName}</span>
                    </a>
                    <button type="button" id="btn-public-logout" style="background:none; border:1px solid #64748b; color:#cbd5e1; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.8rem;">Logout</button>
                </div>
            `;

            const btnLogout = document.getElementById('btn-public-logout');
            if (btnLogout) {
                btnLogout.addEventListener('click', async () => {
                    if (typeof SoundSphereAPI !== 'undefined') {
                        await SoundSphereAPI.logoutAPI();
                    } else {
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.href = '/login.html';
                    }
                });
            }
        }
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
            const url = 'http://localhost:5000/api/providers';
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

            // Render Dynamic Real Provider Cards
            packagesGrid.innerHTML = providers.map((p, index) => {
                const pkg = (p.packages && p.packages[0]) ? p.packages[0] : { name: p.name, price: p.startingPrice || 15000 };
                const priceFormatted = (pkg.price || p.startingPrice || 15000).toLocaleString();
                const bannerImg = p.banner || (index % 2 === 0 ? 'assets/images/banner.png' : 'assets/images/wedding.png');

                return `
                    <div class="product-card" data-provider-id="${p.id}">
                        <span class="product-badge-mall">SoundSphere Verified</span>
                        <div class="product-img-wrapper">
                            <img src="${bannerImg}" alt="${p.name}" onerror="this.src='assets/images/banner.png'">
                        </div>
                        <div class="product-info">
                            <h4 class="product-title">${pkg.name}</h4>
                            <span class="provider-name-sub"><i class="fa-solid fa-store"></i> ${p.name}</span>
                            <div class="product-tags">
                                <span class="tag-pill"><i class="fa-solid fa-location-dot"></i> ${p.coverageArea || 'Batangas'}</span>
                            </div>
                            <div class="product-rating-row">
                                <span class="rating-stars">5.0 ★</span>
                                <span>Verified Provider</span>
                            </div>
                            <div class="product-price-row">
                                <span class="product-price">₱${priceFormatted}</span>
                                <button type="button" class="btn-book-sm btn-action-book" data-provider-id="${p.id}" data-pkg-title="${pkg.name}" data-pkg-price="${pkg.price || p.startingPrice || 15000}" style="border:none; cursor:pointer;">Book Now</button>
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
                    const pkgTitle = btn.getAttribute('data-pkg-title');
                    const pkgPrice = parseInt(btn.getAttribute('data-pkg-price'), 10) || 15000;

                    if (!token || !user) {
                        e.preventDefault();
                        const pendingBooking = {
                            packageTitle: pkgTitle,
                            packagePrice: pkgPrice,
                            providerId: providerId,
                            returnUrl: `/provider-detail.html?id=${providerId}`
                        };
                        if (typeof window.openAuthModal === 'function') {
                            window.openAuthModal('login', pendingBooking);
                        } else {
                            sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBooking));
                            window.location.href = `/login.html?returnUrl=${encodeURIComponent(`/provider-detail.html?id=${providerId}`)}`;
                        }
                    } else {
                        window.location.href = `/provider-detail.html?id=${providerId}`;
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
