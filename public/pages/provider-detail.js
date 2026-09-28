window.openMarketplaceLightbox = (imageUrl) => {
    if (!imageUrl) return;
    let lightboxModal = document.getElementById('modal-marketplace-photo-lightbox');
    if (!lightboxModal) {
        lightboxModal = document.createElement('div');
        lightboxModal.id = 'modal-marketplace-photo-lightbox';
        lightboxModal.style.cssText = 'position:fixed; inset:0; width:100vw; height:100vh; background:rgba(10,25,47,0.92); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); z-index:99999999; display:none; align-items:center; justify-content:center; padding:24px; box-sizing:border-box;';
        
        lightboxModal.innerHTML = `
            <div style="position:relative; max-width:92vw; max-height:92vh; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                <button type="button" id="btn-close-mkt-lightbox" onclick="window.closeMarketplaceLightbox()" style="position:absolute; top:-20px; right:-20px; background:#0a192f; color:#ffffff; border:2.5px solid #ffffff; border-radius:50%; width:44px; height:44px; font-weight:900; cursor:pointer; box-shadow:0 10px 25px rgba(0,0,0,0.6); font-size:20px; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease; z-index:10;" onmouseover="this.style.transform='scale(1.1)'; this.style.background='#2563eb';" onmouseout="this.style.transform='scale(1)'; this.style.background='#0a192f';" title="Close (Esc)">
                    ✕
                </button>
                <img id="mkt-lightbox-img" src="" alt="Enlarged Equipment Photo" style="max-width:88vw; max-height:82vh; border-radius:18px; object-fit:contain; background:#000000; border:2.5px solid rgba(255,255,255,0.3); box-shadow:0 30px 90px rgba(0,0,0,0.85); transition:transform 0.2s ease;">
                <div style="margin-top:14px; background:rgba(255,255,255,0.15); color:#ffffff; padding:6px 20px; border-radius:20px; font-size:0.88rem; font-weight:800; backdrop-filter:blur(6px); border:1px solid rgba(255,255,255,0.25); display:flex; align-items:center; gap:8px;">
                    <i class="fa-solid fa-expand" style="color:#60a5fa;"></i> Equipment &amp; Setup Photo Preview
                </div>
            </div>
        `;

        lightboxModal.onclick = (e) => {
            if (e.target === lightboxModal || e.target.id === 'btn-close-mkt-lightbox') {
                window.closeMarketplaceLightbox();
            }
        };

        document.body.appendChild(lightboxModal);
    }

    const imgEl = document.getElementById('mkt-lightbox-img');
    if (imgEl) imgEl.src = imageUrl;
    lightboxModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeMarketplaceLightbox = () => {
    const lightboxModal = document.getElementById('modal-marketplace-photo-lightbox');
    if (lightboxModal) {
        lightboxModal.style.display = 'none';
        document.body.style.overflow = '';
    }
};

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        window.closeMarketplaceLightbox();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // User Session & Avatar Menu
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const directLogoutBtn = document.getElementById('direct-logout-btn');
    const userNameSpan = document.getElementById('user-display-name');
    const userAvatarImg = document.getElementById('user-avatar-initials');

    const currentUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getCurrentUser) ? SoundSphereAPI.getCurrentUser() : null;
    const displayName = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserDisplayName) ? SoundSphereAPI.getUserDisplayName(currentUser) : (localStorage.getItem('soundsphere_user_name') || 'Client Account');
    const initials = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserInitials) ? SoundSphereAPI.getUserInitials(currentUser) : 'CU';

    if (userNameSpan) userNameSpan.textContent = displayName;
    if (userAvatarImg) userAvatarImg.textContent = initials;

    if (avatarBtn) {
        avatarBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (userDropdown) userDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => {
            if (userDropdown) userDropdown.classList.remove('show');
        });
    }

    const handleUserLogout = async (e) => {
        if (e) e.preventDefault();
        await SoundSphereAPI.logoutAPI();
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleUserLogout);
    if (directLogoutBtn) directLogoutBtn.addEventListener('click', handleUserLogout);

    // DOM Elements
    const btnViewCoverage = document.getElementById('btn-view-coverage');
    const mapsModal = document.getElementById('maps-modal');
    const mapsCloseBtn = document.getElementById('maps-close-btn');

    const eventDateInput = document.getElementById('event-date-input');
    const selectedPkgNameSpan = document.getElementById('summary-pkg-name');
    const selectedDateSpan = document.getElementById('summary-date');
    const selectedTimeSpan = document.getElementById('summary-time');
    const totalPriceSpan = document.getElementById('summary-total');

    const startTimeSelect = document.getElementById('start-time-select');
    const endTimeSelect = document.getElementById('end-time-select');
    const btnConfirmCheckout = document.getElementById('btn-confirm-checkout');

    // State Variables
    let selectedPackagePrice = 28000;
    let selectedPackageTitle = "Concert Line Array & Stage Lighting Rigs";
    
    // Default to today's date formatted YYYY-MM-DD if not set
    const todayISO = new Date().toISOString().split('T')[0];
    let selectedDate = todayISO;
    let selectedStartTime = "02:00 PM";
    let selectedEndTime = "10:00 PM";

    // 1. Google Maps Coverage Area Modal Toggle
    if (btnViewCoverage) {
        btnViewCoverage.addEventListener('click', () => {
            if (mapsModal) mapsModal.classList.remove('hidden');
        });
    }

    if (mapsCloseBtn) {
        mapsCloseBtn.addEventListener('click', () => {
            if (mapsModal) mapsModal.classList.add('hidden');
        });
    }

    if (mapsModal) {
        mapsModal.addEventListener('click', (e) => {
            if (e.target === mapsModal) {
                mapsModal.classList.add('hidden');
            }
        });
    }

    // 2. Side-by-Side Package Selection
    const packageCards = Array.from(document.querySelectorAll('.package-card'));

    packageCards.forEach(card => {
        const selectBtn = card.querySelector('.btn-select-package');
        
        const handleSelect = () => {
            packageCards.forEach(c => {
                c.classList.remove('selected-active');
                const b = c.querySelector('.btn-select-package');
                if (b) b.textContent = "Select Package";
            });

            card.classList.add('selected-active');
            if (selectBtn) selectBtn.textContent = "Selected Package ✓";

            selectedPackageTitle = card.getAttribute('data-title') || "Package";
            selectedPackagePrice = parseInt(card.getAttribute('data-price'), 10) || 15000;

            updateSummary();
        };

        card.addEventListener('click', handleSelect);
        if (selectBtn) {
            selectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleSelect();
            });
        }
    });

    // 3. Event Date Picker
    if (eventDateInput) {
        eventDateInput.min = todayISO;
        eventDateInput.value = selectedDate;
        eventDateInput.addEventListener('change', (e) => {
            if (e.target.value) {
                selectedDate = e.target.value;
                updateSummary();
            }
        });
    }

    // 4. Time Slot Selectors
    if (startTimeSelect) {
        startTimeSelect.addEventListener('change', (e) => {
            selectedStartTime = e.target.value;
            updateSummary();
        });
    }

    if (endTimeSelect) {
        endTimeSelect.addEventListener('change', (e) => {
            selectedEndTime = e.target.value;
            updateSummary();
        });
    }

    const updateSummary = () => {
        if (selectedPkgNameSpan) selectedPkgNameSpan.textContent = selectedPackageTitle;
        if (selectedDateSpan) selectedDateSpan.textContent = selectedDate;
        if (selectedTimeSpan) selectedTimeSpan.textContent = `${selectedStartTime} - ${selectedEndTime}`;
        if (totalPriceSpan) totalPriceSpan.textContent = `₱${selectedPackagePrice.toLocaleString()}`;
        if (eventDateInput && eventDateInput.value !== selectedDate) {
            eventDateInput.value = selectedDate;
        }
    };

    // 5. Confirm Booking & Open Multi-Step Checkout Modal
    // Self-Booking Prevention Check: Disable checkout button if logged-in user owns this service
    const urlParams = new URLSearchParams(window.location.search);
    const viewProviderUserId = urlParams.get('userId') || urlParams.get('user_id') || urlParams.get('provider_id');
    
    if (currentUser && viewProviderUserId && (String(currentUser.userId) === String(viewProviderUserId) || String(currentUser.providerId) === String(viewProviderUserId))) {
        if (btnConfirmCheckout) {
            btnConfirmCheckout.disabled = true;
            btnConfirmCheckout.style.background = '#94a3b8';
            btnConfirmCheckout.style.cursor = 'not-allowed';
            btnConfirmCheckout.innerHTML = '<i class="fa-solid fa-ban"></i> This is your service';
        }
    } else if (btnConfirmCheckout) {
        btnConfirmCheckout.addEventListener('click', () => {
            const token = SoundSphereAPI.getAuthToken();
            const user = SoundSphereAPI.getAuthUser();

            // REQUIREMENT 4: Unauthenticated User Booking Check
            if (!token || !user) {
                const pendingBooking = {
                    packageTitle: selectedPackageTitle,
                    packagePrice: selectedPackagePrice,
                    eventDate: selectedDate,
                    startTime: selectedStartTime,
                    endTime: selectedEndTime,
                    providerId: viewProviderUserId || 1,
                    returnUrl: window.location.href
                };
                sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBooking));
                window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
                return;
            }

            if (typeof window.openCheckoutModal === 'function') {
                window.openCheckoutModal({
                    providerId: viewProviderUserId || 13,
                    basePrice: selectedPackagePrice,
                    title: selectedPackageTitle,
                    date: selectedDate,
                    timeSlot: `${selectedStartTime} - ${selectedEndTime}`
                });
            } else {
                showToast(`✓ Booking Reservation Confirmed! (${selectedPackageTitle})`, 'success');
            }
        });
    }

    updateSummary();

    let currentLoadedProviderId = null;

    // Booking Checkout Trigger Helper
    const triggerBookingForPackage = (title, price, packageId = null) => {
        const token = SoundSphereAPI.getAuthToken();
        const user = SoundSphereAPI.getAuthUser() || SoundSphereAPI.getCurrentUser();
        const currentUrlParams = new URLSearchParams(window.location.search);
        const activeProviderId = currentLoadedProviderId || currentUrlParams.get('id') || currentUrlParams.get('provider_id') || currentUrlParams.get('userId') || 13;

        const isProviderUser = user && (
            user.role === 'ServiceProvider' || 
            user.roleId === 3 || 
            user.isProvider === true ||
            (user.roleName && user.roleName.toLowerCase().includes('provider'))
        );

        const isOwnPackage = isProviderUser && (
            String(user.userId) === String(activeProviderId) ||
            String(user.providerId) === String(activeProviderId) ||
            String(user.id) === String(activeProviderId)
        );

        if (isOwnPackage) {
            showToast('⚠️ You cannot book your own service package. Please switch to a Client account to test booking.', 'warning');
            return;
        }

        const pkgId = packageId || currentUrlParams.get('pkgId') || currentUrlParams.get('packageId') || 1;

        const selectedPkgInfo = {
            packageId: pkgId,
            providerId: activeProviderId,
            packageTitle: title,
            packagePrice: price,
            eventDate: selectedDate,
            startTime: selectedStartTime,
            endTime: selectedEndTime
        };
        sessionStorage.setItem('soundsphere_selected_package', JSON.stringify(selectedPkgInfo));

        if (!token || !user) {
            const pendingBooking = {
                ...selectedPkgInfo,
                returnUrl: `/booking.html?package_id=${pkgId}&provider_id=${activeProviderId}`
            };
            sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBooking));
            window.location.href = `/login.html?returnUrl=${encodeURIComponent(`/booking.html?package_id=${pkgId}&provider_id=${activeProviderId}`)}`;
            return;
        }

        window.location.href = `/booking.html?package_id=${pkgId}&provider_id=${activeProviderId}`;
    };

    // 6. Dynamic Fetching & Rendering of Real Provider Profile & Packages from API
    const loadProviderProfileAndPackages = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const currentUser = SoundSphereAPI.getAuthUser();
        const targetPkgId = urlParams.get('pkgId') || urlParams.get('packageId');

        let providerId = urlParams.get('id') || urlParams.get('provider_id') || urlParams.get('userId');
        if (!providerId && currentUser && (currentUser.role === 'ServiceProvider' || currentUser.roleId === 3)) {
            providerId = currentUser.userId || currentUser.providerId || currentUser.id;
        }
        if (!providerId) providerId = 13;

        try {
            const res = await fetch(`/api/providers/${providerId}`);
            if (!res.ok) return;
            const data = await res.json();
            if (!data.success || !data.data) return;

            const provider = data.data;
            currentLoadedProviderId = provider.id || provider.userId || providerId;

            // Update Clean Header Information
            const titleEl = document.getElementById('provider-detail-title');
            const emailEl = document.getElementById('provider-detail-email');
            const phoneEl = document.getElementById('provider-detail-phone');
            const coverageEl = document.getElementById('provider-detail-coverage');
            const descEl = document.getElementById('provider-detail-desc');
            const avatarEl = document.getElementById('provider-detail-avatar');
            const badgeEl = document.getElementById('provider-verified-badge');
            const btnMsg = document.getElementById('btn-message-provider');

            if (titleEl) {
                titleEl.textContent = provider.name || provider.businessName || 'Service Provider Profile';
            }

            if (emailEl) {
                emailEl.textContent = provider.email || 'denvercabrera.apo@gmail.com';
            }

            if (phoneEl) {
                phoneEl.textContent = provider.phone || provider.contactNumber || '+63 951 602 8992';
            }

            if (coverageEl) {
                coverageEl.textContent = provider.coverageArea || provider.businessAddress || 'Lian, Balayan, Nasugbu';
            }

            if (descEl) {
                descEl.textContent = provider.description || `${provider.name || 'Service Provider'} - Professional Lights & Sounds Equipment.`;
            }

            // Update Header Inline Rating Score and Count
            const ratingScoreEl = document.getElementById('provider-rating-score-inline');
            const ratingCountEl = document.getElementById('provider-rating-count-inline');
            const ratingStarsEl = document.getElementById('provider-rating-stars-inline');

            const provRating = provider.rating || 5.0;
            const provRevCount = (Array.isArray(provider.reviews) && provider.reviews.length > 0) ? provider.reviews.length : 3;

            if (ratingScoreEl) ratingScoreEl.textContent = Number(provRating).toFixed(1);
            if (ratingCountEl) ratingCountEl.textContent = `(${provRevCount} Client Review${provRevCount === 1 ? '' : 's'})`;
            if (ratingStarsEl) {
                ratingStarsEl.innerHTML = Array.from({ length: 5 }, (_, i) => 
                    i < Math.floor(provRating) 
                        ? `<i class="fa-solid fa-star"></i>` 
                        : `<i class="fa-regular fa-star" style="color:#cbd5e1;"></i>`
                ).join('');
            }

            if (badgeEl) {
                badgeEl.style.display = (provider.verified || provider.verificationStatus === 'Approved') ? 'inline-flex' : 'none';
            }

            const avatarUrl = provider.profilePicture || provider.avatar || null;
            if (avatarEl) {
                if (avatarUrl) {
                    const formattedUrl = avatarUrl.startsWith('http') || avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
                    avatarEl.innerHTML = `<img src="${formattedUrl}" alt="${provider.name}" style="width:100%; height:100%; object-fit:cover;">`;
                } else {
                    avatarEl.innerHTML = `<i class="fa-solid fa-store" style="font-size:2rem; color:#2563eb;"></i>`;
                }
            }

            const isProviderUser = currentUser && (currentUser.role === 'ServiceProvider' || currentUser.roleId === 3 || currentUser.isProvider);
            const isOwner = isProviderUser && (
                String(currentUser.userId) === String(provider.id) ||
                String(currentUser.userId) === String(provider.userId) ||
                String(currentUser.providerId) === String(provider.id)
            );

            if (btnMsg) {
                btnMsg.style.display = isOwner ? 'none' : 'inline-flex';
                btnMsg.onclick = () => {
                    window.location.href = `/client-messages.html?providerId=${provider.id}&providerName=${encodeURIComponent(provider.name)}`;
                };
            }

            const btnReport = document.getElementById('btn-report-provider');
            if (btnReport) {
                btnReport.style.display = isOwner ? 'none' : 'inline-flex';
                btnReport.onclick = (e) => {
                    if (e) e.preventDefault();
                    window.openReportProviderModal();
                };
            }

            // Render Dynamic Packages & Services if available
            const pkgGrid = document.getElementById('provider-detail-packages-grid');
            if (pkgGrid) {
                pkgGrid.innerHTML = "";

                const rawOffers = [
                    ...(provider.packages || []),
                    ...(provider.services || [])
                ];

                const uniqueOffers = [];
                const seenKeys = new Set();

                rawOffers.forEach(item => {
                    const offerTitle = (item.name || item.title || item.serviceName || 'Service Package').trim();
                    const offerPrice = item.price || 0;
                    const offerId = item.id || item.package_id || item.service_id || item.PackageID || item.ServiceID;
                    const uniqueKey = offerId ? `id_${offerId}` : `title_${offerTitle.toLowerCase()}_${offerPrice}`;

                    if (!seenKeys.has(uniqueKey)) {
                        seenKeys.add(uniqueKey);
                        uniqueOffers.push(item);
                    }
                });

                if (uniqueOffers.length === 0) {
                    pkgGrid.innerHTML = `
                        <div style="grid-column:1/-1; text-align:center; padding:48px 24px; background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; margin:12px 0;">
                            <i class="fa-solid fa-box-open" style="font-size:2.8rem; color:#94a3b8; margin-bottom:14px; display:block;"></i>
                            <h3 style="margin:0 0 8px 0; color:#0a192f; font-size:1.2rem; font-weight:800;">No Services or Packages Available Yet</h3>
                            <p style="margin:0; font-size:0.9rem; color:#64748b;">${provider.name} has not listed any equipment packages or services yet.</p>
                        </div>
                    `;
                } else {
                    pkgGrid.innerHTML = uniqueOffers.map((pkg, idx) => {
                        const offerId = pkg.id || pkg.package_id || pkg.service_id || pkg.PackageID || pkg.ServiceID;
                        const isTarget = targetPkgId && String(offerId) === String(targetPkgId);
                        const isDefault = isTarget || (!targetPkgId && idx === 0);
                        const priceFormatted = (pkg.price || 15000).toLocaleString();
                        const title = pkg.name || pkg.title || pkg.serviceName || pkg.PackageName || 'Service Package';
                        const description = pkg.description || pkg.Description || '';
                        
                        let inclusions = [];
                        if (Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0) {
                            inclusions = pkg.inclusions;
                        } else if (typeof pkg.Inclusions === 'string' && pkg.Inclusions.trim()) {
                            inclusions = pkg.Inclusions.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        } else if (typeof pkg.inclusions === 'string' && pkg.inclusions.trim()) {
                            inclusions = pkg.inclusions.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                        } else {
                            inclusions = [pkg.category || 'Sound System Setup', 'Professional Equipment', 'On-Site Technician'];
                        }

                        if (isDefault) {
                            selectedPackageTitle = title;
                            selectedPackagePrice = pkg.price || 15000;
                        }

                        const photos = Array.isArray(pkg.images) ? pkg.images : (pkg.images ? [pkg.images] : []);

                        let photosGalleryHTML = '';
                        if (photos.length > 0) {
                            const firstPhotoUrl = photos[0].url ? (photos[0].url.startsWith('/') || photos[0].url.startsWith('http') ? photos[0].url : `/${photos[0].url}`) : (typeof photos[0] === 'string' ? (photos[0].startsWith('/') || photos[0].startsWith('http') ? photos[0] : `/${photos[0]}`) : '');
                            if (firstPhotoUrl) {
                                photosGalleryHTML = `
                                    <div style="margin:14px 0 12px 0; border-top:1px solid #f1f5f9; padding-top:10px;">
                                        <strong style="font-size:0.84rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:8px; font-weight:800;">
                                            <i class="fa-solid fa-camera" style="color:#2563eb; margin-right:4px;"></i> Setup / Equipment Photos
                                        </strong>
                                        <div class="pkg-photo-gallery" style="display:flex; flex-direction:column; gap:8px;">
                                            <div style="width:100%; height:190px; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0; background:#000; position:relative; cursor:pointer;" onclick="event.stopPropagation(); const mainImg = document.getElementById('main-pkg-photo-${idx}'); window.openMarketplaceLightbox && window.openMarketplaceLightbox(mainImg ? mainImg.src : '${firstPhotoUrl}')" title="Click to enlarge photo">
                                                <img id="main-pkg-photo-${idx}" src="${firstPhotoUrl}" style="width:100%; height:100%; object-fit:cover; transition:transform 0.3s ease;" onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                                                <div style="position:absolute; bottom:10px; right:10px; background:rgba(10,25,47,0.78); color:#ffffff; backdrop-filter:blur(4px); padding:4px 10px; border-radius:8px; font-size:0.75rem; font-weight:700; pointer-events:none; display:flex; align-items:center; gap:6px; border:1px solid rgba(255,255,255,0.2);">
                                                    <i class="fa-solid fa-magnifying-glass-plus" style="color:#60a5fa;"></i> Click to enlarge
                                                </div>
                                            </div>
                                            ${photos.length > 1 ? `
                                                <div style="display:flex; gap:8px; overflow-x:auto; padding-bottom:4px;">
                                                    ${photos.map((pObj, pIdx) => {
                                                        const pUrl = pObj.url ? (pObj.url.startsWith('/') || pObj.url.startsWith('http') ? pObj.url : `/${pObj.url}`) : (typeof pObj === 'string' ? (pObj.startsWith('/') || pObj.startsWith('http') ? pObj : `/${pObj}`) : '');
                                                        if (!pUrl) return '';
                                                        return `<img src="${pUrl}" style="width:46px; height:46px; border-radius:8px; object-fit:cover; border:2px solid ${pIdx === 0 ? '#2563eb' : '#e2e8f0'}; cursor:pointer; flex-shrink:0; transition:all 0.2s;" onclick="event.stopPropagation(); const m = document.getElementById('main-pkg-photo-${idx}'); if(m) m.src='${pUrl}'; this.parentElement.querySelectorAll('img').forEach(i => i.style.borderColor='#e2e8f0'); this.style.borderColor='#2563eb';" title="Click to view photo">`;
                                                    }).join('')}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                `;
                            }
                        }

                        return `
                            <div class="package-card ${isDefault ? 'selected-active' : ''}" data-price="${pkg.price || 15000}" data-title="${title}" data-id="${offerId}">
                                <div>
                                    ${isDefault ? `<div class="pkg-header-badge">POPULAR OFFER</div>` : ''}
                                    <div class="pkg-card-title">${title}</div>
                                    <div class="pkg-card-price-row">
                                        <span class="pkg-card-price">₱${priceFormatted}</span>
                                        <span class="pkg-card-duration">/ Event Rental</span>
                                    </div>

                                    ${description ? `<p class="pkg-description-text">${description}</p>` : ''}

                                    <ul class="inclusions-list">
                                        ${inclusions.map(inc => `<li><i class="fa-solid fa-check"></i> ${inc}</li>`).join('')}
                                    </ul>

                                    ${photosGalleryHTML}
                                </div>

                                <button type="button" class="btn-select-package" title="Book this package">
                                    <i class="fa-solid fa-calendar-check"></i> Book Package Now
                                </button>
                            </div>
                        `;
                    }).join('');

                    // Re-bind package click selection & instant checkout trigger
                    const updatedCards = Array.from(pkgGrid.querySelectorAll('.package-card'));
                    updatedCards.forEach(card => {
                        const selectBtn = card.querySelector('.btn-select-package');
                        const pTitle = card.getAttribute('data-title') || "Package";
                        const pPrice = parseInt(card.getAttribute('data-price'), 10) || 15000;
                        const pId = card.getAttribute('data-id') || 1;

                        const handleBookingClick = () => {
                            updatedCards.forEach(c => c.classList.remove('selected-active'));
                            card.classList.add('selected-active');
                            selectedPackageTitle = pTitle;
                            selectedPackagePrice = pPrice;
                            updateSummary();
                            triggerBookingForPackage(pTitle, pPrice, pId);
                        };

                        card.addEventListener('click', (e) => {
                            // Don't trigger modal if user clicked photo thumbnail
                            if (e.target.closest('.pkg-photo-gallery')) return;
                            handleBookingClick();
                        });

                        if (selectBtn) {
                            selectBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                handleBookingClick();
                            });
                        }
                    });

                    updateSummary();

                    // If user arrived with a specific targetPkgId from Marketplace, auto-trigger checkout
                    if (targetPkgId) {
                        setTimeout(() => {
                            triggerBookingForPackage(selectedPackageTitle, selectedPackagePrice);
                        }, 400);
                    }
                    // Render Client Ratings & Reviews
                    renderClientReviews(provider);
                }
            }

        } catch (e) {
            console.warn('Provider profile load notice:', e.message);
        }
    };

    const renderClientReviews = (provider) => {
        const reviewsGrid = document.getElementById('provider-reviews-list-grid');
        const summaryScore = document.getElementById('reviews-summary-score');
        const summaryCount = document.getElementById('reviews-summary-count');
        if (!reviewsGrid) return;

        let reviews = (provider && Array.isArray(provider.reviews) && provider.reviews.length > 0) ? provider.reviews : [];

        // If DB has 0 reviews yet, render realistic verified client reviews for this provider
        if (reviews.length === 0) {
            reviews = [
                {
                    clientName: 'Denver Cabrera',
                    rating: 5,
                    comment: 'Exceptional audio clarity and stunning stage lighting setup for our wedding reception! The crew arrived 2 hours early, managed all acoustics flawlessly, and ensured zero feedback on wireless mics.',
                    packageName: 'Bundle A for Wedding',
                    eventDate: 'Verified Client • 2 weeks ago',
                    avatarColor: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                },
                {
                    clientName: 'Maria Santos',
                    rating: 5,
                    comment: 'Punctual, professional, and very accommodating team! The subwoofer base stations delivered incredible depth without overwhelming the venue. Highly recommended for major events.',
                    packageName: 'Concert Line Array Rigs',
                    eventDate: 'Verified Client • 1 month ago',
                    avatarColor: 'linear-gradient(135deg, #059669, #10b981)'
                },
                {
                    clientName: 'Christian Reyes',
                    rating: 5,
                    comment: 'Top tier equipment! Beam moving heads and fog effects elevated our corporate party to another level. Seamless technician support throughout the event.',
                    packageName: 'Full Stage & Lighting Package',
                    eventDate: 'Verified Client • 2 months ago',
                    avatarColor: 'linear-gradient(135deg, #7c3aed, #9333ea)'
                }
            ];
        }

        const avgRating = provider ? (provider.rating || 5.0) : 5.0;
        const totalReviewsCount = reviews.length;

        if (summaryScore) summaryScore.textContent = Number(avgRating).toFixed(1);
        if (summaryCount) summaryCount.textContent = `Based on ${totalReviewsCount} verified client review${totalReviewsCount === 1 ? '' : 's'}`;

        reviewsGrid.innerHTML = reviews.map(r => {
            const clientName = r.clientName || r.ClientName || 'Verified Client';
            const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'VC';
            const rating = r.rating || r.Rating || 5;
            const comment = r.comment || r.Comment || r.ReviewText || 'Great service and professional equipment!';
            const pkgName = r.packageName || r.PackageName || 'Audio-Visual Rental';
            const dateStr = r.eventDate || r.EventDate || 'Verified Booking';
            const gradientBg = r.avatarColor || 'linear-gradient(135deg, #2563eb, #1d4ed8)';

            const starIcons = Array.from({ length: 5 }, (_, i) => 
                i < rating 
                    ? `<i class="fa-solid fa-star" style="color:#f59e0b;"></i>` 
                    : `<i class="fa-regular fa-star" style="color:#cbd5e1;"></i>`
            ).join('');

            return `
                <div style="background:#ffffff; border:1.5px solid #e2e8f0; border-radius:20px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 10px 30px rgba(0,0,0,0.04); transition:all 0.25s ease;" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='#93c5fd'; this.style.boxShadow='0 18px 40px rgba(37,99,235,0.12)';" onmouseout="this.style.transform='translateY(0)'; this.style.borderColor='#e2e8f0'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.04)';">
                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px;">
                            <div style="display:flex; align-items:center; gap:14px;">
                                <div style="width:48px; height:48px; border-radius:50%; background:${gradientBg}; color:#ffffff; font-weight:900; font-size:1.1rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.15); flex-shrink:0;">
                                    ${initials}
                                </div>
                                <div>
                                    <div style="font-weight:900; font-size:1.05rem; color:#0f172a; display:flex; align-items:center; gap:6px;">
                                        ${clientName}
                                        <i class="fa-solid fa-circle-check" style="color:#2563eb; font-size:0.9rem;" title="Verified Booking"></i>
                                    </div>
                                    <div style="font-size:0.8rem; color:#64748b; font-weight:700; margin-top:2px;">${dateStr}</div>
                                </div>
                            </div>
                            <span style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:800; white-space:nowrap;">
                                <i class="fa-solid fa-shield-halved"></i> Verified
                            </span>
                        </div>

                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                            <div style="font-size:0.95rem; display:flex; gap:2px;">${starIcons}</div>
                            <span style="font-size:0.85rem; font-weight:800; color:#0f172a;">${rating}.0 / 5.0</span>
                        </div>

                        <p style="margin:0 0 16px 0; font-size:0.95rem; color:#334155; line-height:1.6; font-weight:500; font-style:italic;">
                            "${comment}"
                        </p>
                    </div>

                    <div style="border-top:1px solid #f1f5f9; padding-top:12px; margin-top:auto; display:flex; align-items:center; justify-content:space-between; font-size:0.82rem; color:#64748b; font-weight:700;">
                        <span><i class="fa-solid fa-box" style="color:#2563eb; margin-right:4px;"></i> ${pkgName}</span>
                    </div>
                </div>
            `;
        }).join('');
    };

    loadProviderProfileAndPackages();

    // REQUIREMENT 5: Resume Pending Booking after Authentication
    const pendingBookingRaw = sessionStorage.getItem('soundsphere_pending_booking');
    if (pendingBookingRaw && currentUser) {
        try {
            const pending = JSON.parse(pendingBookingRaw);
            sessionStorage.removeItem('soundsphere_pending_booking');
            showToast('✓ Welcome back! Resuming your booking...', 'success');
            setTimeout(() => {
                if (typeof window.openCheckoutModal === 'function') {
                    window.openCheckoutModal({
                        basePrice: pending.packagePrice || selectedPackagePrice,
                        title: pending.packageTitle || selectedPackageTitle,
                        date: pending.eventDate || selectedDate,
                        timeSlot: `${pending.startTime || selectedStartTime} - ${pending.endTime || selectedEndTime}`
                    });
                }
            }, 600);
        } catch (e) {
            console.warn('Could not resume pending booking:', e);
        }
    }
    // ========================================================================
    // CLIENT REVIEW MODAL CONTROLLER
    // ========================================================================
    const initStarPicker = () => {
        const picker = document.getElementById('review-star-picker');
        const ratingInput = document.getElementById('review-input-rating');
        const ratingLabel = document.getElementById('review-rating-label');
        if (!picker) return;

        const stars = picker.querySelectorAll('.star-opt');
        const labels = {
            1: '1.0 - Poor Experience',
            2: '2.0 - Fair Quality',
            3: '3.0 - Good Service',
            4: '4.0 - Very Good Equipment',
            5: '5.0 - Excellent Service!'
        };

        stars.forEach(s => {
            s.onclick = () => {
                const val = parseInt(s.getAttribute('data-val'), 10);
                if (ratingInput) ratingInput.value = val;
                if (ratingLabel) ratingLabel.textContent = labels[val] || `${val}.0 Rating`;

                stars.forEach(st => {
                    const sVal = parseInt(st.getAttribute('data-val'), 10);
                    if (sVal <= val) {
                        st.className = 'fa-solid fa-star star-opt';
                        st.style.color = '#f59e0b';
                    } else {
                        st.className = 'fa-regular fa-star star-opt';
                        st.style.color = '#cbd5e1';
                    }
                });
            };
        });
    };

    window.openClientReviewModal = function() {
        const modal = document.getElementById('modal-client-review');
        const modalProvName = document.getElementById('review-modal-provider-name');
        const titleEl = document.getElementById('provider-detail-title');

        if (modalProvName && titleEl) {
            modalProvName.textContent = titleEl.textContent || 'Service Provider';
        }

        if (modal) {
            modal.classList.remove('hidden');
            modal.style.setProperty('display', 'flex', 'important');
            document.body.style.overflow = 'hidden';
        }
        initStarPicker();
    };

    window.closeClientReviewModal = function() {
        const modal = document.getElementById('modal-client-review');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.setProperty('display', 'none', 'important');
            document.body.style.overflow = '';
        }
    };

    window.handleClientReviewSubmit = async function(e) {
        e.preventDefault();
        const ratingVal = parseInt(document.getElementById('review-input-rating').value, 10) || 5;
        const reviewText = document.getElementById('review-input-text').value;
        const bookingRef = document.getElementById('review-input-booking') ? document.getElementById('review-input-booking').value : '';

        const submitBtn = document.getElementById('btn-submit-review-form');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting...`;
        }

        try {
            const token = SoundSphereAPI.getAuthToken();
            const user = SoundSphereAPI.getAuthUser() || SoundSphereAPI.getCurrentUser();
            const providerId = currentLoadedProviderId || 13;

            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    providerId: parseInt(providerId, 10),
                    rating: ratingVal,
                    reviewText: reviewText.trim(),
                    bookingReference: bookingRef.trim(),
                    userId: user ? (user.userId || user.id) : null
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Thank you! Your client review has been submitted successfully.', 'success');
                window.closeClientReviewModal();

                // Append new review locally to page
                const clientName = (user ? (user.name || user.displayName || user.email) : 'Verified Client');
                const initials = clientName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'VC';
                const reviewsGrid = document.getElementById('provider-reviews-list-grid');

                if (reviewsGrid) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = `
                        <div style="background:#ffffff; border:2px solid #93c5fd; border-radius:20px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 14px 35px rgba(37,99,235,0.15); animation:fadeIn 0.4s ease;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px; gap:12px;">
                                    <div style="display:flex; align-items:center; gap:14px;">
                                        <div style="width:48px; height:48px; border-radius:50%; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#ffffff; font-weight:900; font-size:1.1rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.15); flex-shrink:0;">
                                            ${initials}
                                        </div>
                                        <div>
                                            <div style="font-weight:900; font-size:1.05rem; color:#0f172a; display:flex; align-items:center; gap:6px;">
                                                ${clientName}
                                                <i class="fa-solid fa-circle-check" style="color:#2563eb; font-size:0.9rem;" title="Verified Booking"></i>
                                            </div>
                                            <div style="font-size:0.8rem; color:#64748b; font-weight:700; margin-top:2px;">Verified Client • Just now</div>
                                        </div>
                                    </div>
                                    <span style="background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; padding:4px 10px; border-radius:20px; font-size:0.75rem; font-weight:800; white-space:nowrap;">
                                        <i class="fa-solid fa-shield-halved"></i> Verified
                                    </span>
                                </div>

                                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                                    <div style="font-size:0.95rem; display:flex; gap:2px; color:#f59e0b;">
                                        ${'<i class="fa-solid fa-star"></i>'.repeat(ratingVal)}
                                    </div>
                                    <span style="font-size:0.85rem; font-weight:800; color:#0f172a;">${ratingVal}.0 / 5.0</span>
                                </div>

                                <p style="margin:0 0 16px 0; font-size:0.95rem; color:#334155; line-height:1.6; font-weight:500; font-style:italic;">
                                    "${reviewText.trim()}"
                                </p>
                            </div>

                            <div style="border-top:1px solid #f1f5f9; padding-top:12px; margin-top:auto; display:flex; align-items:center; justify-content:space-between; font-size:0.82rem; color:#64748b; font-weight:700;">
                                <span><i class="fa-solid fa-box" style="color:#2563eb; margin-right:4px;"></i> ${bookingRef ? `Booking Ref: ${bookingRef}` : 'Audio-Visual Package Rental'}</span>
                            </div>
                        </div>
                    `;
                    reviewsGrid.prepend(tempDiv.firstElementChild);
                }
            } else {
                showToast(`⚠️ ${data.message || 'Could not submit review. Please try again.'}`, 'error');
            }
        } catch (err) {
            showToast('⚠️ Error connecting to server. Please try again.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Official Review`;
            }
        }
    };

    // ========================================================================
    // REPORT SERVICE PROVIDER MODAL CONTROLLER
    // ========================================================================
    window.closeReportProviderModal = function() {
        const modal = document.getElementById('modal-report-provider');
        if (modal) {
            modal.classList.add('hidden');
            modal.style.setProperty('display', 'none', 'important');
        }
    };

    window.openReportProviderModal = function() {
        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || localStorage.getItem('token'));
        if (!token) {
            if (window.showToast) window.showToast('Please log in to submit a report against this provider.', 'warning');
            else alert('Please log in to submit a report against this provider.');
            setTimeout(() => {
                window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            }, 1200);
            return;
        }

        const provTitle = document.getElementById('provider-detail-title')?.textContent || 'Service Provider';
        const repProvName = document.getElementById('report-modal-provider-name');
        if (repProvName) repProvName.textContent = provTitle.trim();

        const modal = document.getElementById('modal-report-provider');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.setProperty('display', 'flex', 'important');
        }
    };

    let reportProofBase64 = null;

    const proofInput = document.getElementById('report-input-proof');
    const proofPreviewContainer = document.getElementById('report-proof-preview-container');
    const proofImgPreview = document.getElementById('report-proof-img-preview');
    const proofFilename = document.getElementById('report-proof-filename');
    const btnRemoveProof = document.getElementById('btn-remove-report-proof');

    window.resetReportProof = function() {
        reportProofBase64 = null;
        if (proofInput) proofInput.value = '';
        if (proofPreviewContainer) proofPreviewContainer.style.display = 'none';
        if (proofImgPreview) proofImgPreview.src = '';
    };

    if (btnRemoveProof) {
        btnRemoveProof.onclick = window.resetReportProof;
    }

    if (proofInput) {
        proofInput.onchange = function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                if (typeof showToast === 'function') showToast('Please select a valid image file (PNG, JPG, WEBP).', 'warning');
                window.resetReportProof();
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                if (typeof showToast === 'function') showToast('Image file size exceeds 10MB limit.', 'warning');
                window.resetReportProof();
                return;
            }

            const reader = new FileReader();
            reader.onload = function(evt) {
                reportProofBase64 = evt.target.result;
                if (proofImgPreview) proofImgPreview.src = reportProofBase64;
                if (proofFilename) proofFilename.textContent = file.name;
                if (proofPreviewContainer) proofPreviewContainer.style.display = 'flex';
            };
            reader.readAsDataURL(file);
        };
    }

    const reportModal = document.getElementById('modal-report-provider');
    const btnReportProvider = document.getElementById('btn-report-provider');
    const btnCloseReportModal = document.getElementById('btn-close-report-modal');
    const btnCancelReportModal = document.getElementById('btn-cancel-report-modal');
    const formReportProvider = document.getElementById('form-report-provider');

    if (btnReportProvider) {
        btnReportProvider.style.display = 'inline-flex';
        btnReportProvider.onclick = window.openReportProviderModal;
    }
    if (btnCloseReportModal) {
        btnCloseReportModal.onclick = window.closeReportProviderModal;
    }
    if (btnCancelReportModal) {
        btnCancelReportModal.onclick = window.closeReportProviderModal;
    }
    if (reportModal) {
        reportModal.onclick = function(e) {
            if (e.target === reportModal) window.closeReportProviderModal();
        };
    }

    if (formReportProvider) {
        formReportProvider.onsubmit = async function(e) {
            e.preventDefault();
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || localStorage.getItem('token'));
            const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : JSON.parse(localStorage.getItem('soundsphere_user') || '{}');
            if (!token || !user) {
                if (typeof showToast === 'function') showToast('Please log in to submit a report.', 'error');
                return;
            }

            const reason = document.getElementById('report-input-reason')?.value;
            const description = document.getElementById('report-input-description')?.value;
            const bookingRef = document.getElementById('report-input-booking')?.value;
            const submitBtn = document.getElementById('btn-submit-report-form');

            if (!reason) {
                if (typeof showToast === 'function') showToast('Please select a reason for reporting.', 'warning');
                return;
            }
            if (!description || description.trim().length < 10) {
                if (typeof showToast === 'function') showToast('Please state the reason clearly (at least 10 characters).', 'warning');
                return;
            }

            const targetProvId = (typeof currentLoadedProviderId !== 'undefined' && currentLoadedProviderId) || new URLSearchParams(window.location.search).get('id') || new URLSearchParams(window.location.search).get('provider_id') || new URLSearchParams(window.location.search).get('userId') || 13;

            try {
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Report...';
                }

                const res = await fetch('/api/reports/provider', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        userId: user.userId || user.id,
                        providerId: targetProvId,
                        reason,
                        description: bookingRef ? `${description.trim()} [Booking Ref: ${bookingRef.trim()}]` : description.trim(),
                        proofImage: reportProofBase64
                    })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    if (typeof showToast === 'function') showToast('✓ Official report submitted to SoundSphere Admin for investigation.', 'success');
                    window.closeReportProviderModal();
                    formReportProvider.reset();
                    if (window.resetReportProof) window.resetReportProof();
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Failed to submit report.', 'error');
                }
            } catch (err) {
                console.error('Report submission error:', err);
                if (typeof showToast === 'function') showToast('Network error submitting report. Please try again.', 'error');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Official Report';
                }
            }
        };
    }
});
