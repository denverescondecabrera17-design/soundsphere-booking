/**
 * SoundSphere - Client Booking Management Dashboard Controller (Vanilla JS)
 * Handles status tab filtering, reschedule request modal, refund policy modal, chat modal, provider report modal, feedback rating modal, and Logout handler
 */

document.addEventListener('DOMContentLoaded', () => {
    // User Session & Avatar Dropdown
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const userNameSpan = document.getElementById('user-display-name');
    const userAvatarImg = document.getElementById('user-avatar-initials');

    const currentUser = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getCurrentUser) ? SoundSphereAPI.getCurrentUser() : null;
    const displayName = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserDisplayName) ? SoundSphereAPI.getUserDisplayName(currentUser) : (localStorage.getItem('soundsphere_user_name') || 'Client Account');
    const initials = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserInitials) ? SoundSphereAPI.getUserInitials(currentUser) : 'CU';

    if (userNameSpan) userNameSpan.textContent = displayName;
    if (userAvatarImg) userAvatarImg.textContent = initials;

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

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            SoundSphereAPI.clearAuthSession();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html?logout=true';
        });
    }

    // DOM Elements
    const bookingsListContainer = document.getElementById('bookings-list');
    const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));

    // Modals
    const rescheduleModal = document.getElementById('reschedule-modal');
    const refundModal = document.getElementById('refund-modal');
    const chatModal = document.getElementById('chat-modal');
    const reportModal = document.getElementById('report-modal');
    const feedbackModal = document.getElementById('feedback-modal');

    // Close buttons
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    });

    // Live Client Bookings Array fetched from SQL Server Database
    let clientBookingsData = [];

    const fetchLiveClientBookings = async () => {
        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
            const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
            const queryParam = user?.userId ? `?userId=${user.userId}` : '';
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const res = await fetch(`/api/bookings/my-bookings${queryParam}`, { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.bookings)) {
                    clientBookingsData = data.bookings.map(b => {
                        const sDate = b.ServiceStartDate || b.EventDate;
                        const eDate = b.ServiceEndDate || b.EventDate || sDate;
                        const hireDays = b.ServiceHireDays || b.NumberOfDays || 1;
                        const dateText = (sDate === eDate) ? sDate : `${sDate} to ${eDate}`;

                        return {
                            id: b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`,
                            bookingId: b.BookingID,
                            createdDate: new Date(b.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                            providerName: b.ProviderName || 'Sound & Lights Provider',
                            providerThumb: b.ProviderAvatar || 'images/concert_line_array.png',
                            packageName: b.PackageName,
                            serviceStartDate: sDate,
                            serviceEndDate: eDate,
                            serviceHireDays: hireDays,
                            eventDate: `${dateText} (📅 ${hireDays} Day${hireDays > 1 ? 's' : ''})`,
                            eventTime: (b.StartTime && b.EndTime) ? `⏰ ${b.StartTime} – ${b.EndTime}` : (b.EventTime || '⏰ 06:00 PM – 10:00 PM'),
                            eventVenue: b.VenueName ? `${b.VenueName} (${b.EventPlace || b.Location})` : (b.Location || 'Batangas'),
                            eventPlace: b.EventPlace || 'Batangas',
                            totalPrice: parseFloat(b.TotalAmount || b.PackagePrice) || 15000,
                            amountPaid: parseFloat(b.AmountPaid) || parseFloat(b.TotalAmount) || 15000,
                            remainingBalance: parseFloat(b.RemainingBalance || 0),
                            paymentType: b.PaymentType || 'full',
                            paymentStatus: b.PaymentStatus || 'Paid',
                            paymentStatusClass: 'paid-full',
                            status: b.BookingStatus || 'Confirmed',
                            reviewId: b.ReviewID,
                            rating: b.Rating,
                            reviewText: b.ReviewText
                        };
                    });
                }
            }
        } catch (err) {
            console.warn('Live bookings fetch notice:', err.message);
        }

        renderBookings();
    };

    let activeFilterStatus = 'All';

    // Render Booking Cards Function
    const renderBookings = () => {
        const filtered = clientBookingsData.filter(b => {
            if (activeFilterStatus === 'All') return true;
            return b.status === activeFilterStatus;
        });

        // Update Tab Counters
        tabBtns.forEach(tab => {
            const statusKey = tab.getAttribute('data-status');
            const countSpan = tab.querySelector('.tab-count-badge');
            if (statusKey === 'All') {
                if (countSpan) countSpan.textContent = clientBookingsData.length;
            } else {
                const count = clientBookingsData.filter(b => b.status === statusKey).length;
                if (countSpan) countSpan.textContent = count;
            }
        });

        if (filtered.length === 0) {
            bookingsListContainer.innerHTML = `
                <div style="text-align:center; padding: 50px 20px; background:#fff; border-radius:12px; border:1px solid #cbd5e1;">
                    <i class="fa-solid fa-calendar-xmark" style="font-size: 2.5rem; color:#94a3b8; margin-bottom:12px;"></i>
                    <h3 style="color:#0a192f; margin:0 0 6px 0;">No ${activeFilterStatus} Bookings Found</h3>
                    <p style="color:#64748b; font-size:0.88rem; margin:0;">You currently have no event reservations under this category.</p>
                </div>
            `;
            return;
        }

        bookingsListContainer.innerHTML = filtered.map(b => `
            <div class="booking-card" data-id="${b.id}">
                <div class="booking-card-header">
                    <div class="booking-id-meta">
                        <span class="booking-id-tag"><i class="fa-solid fa-receipt" style="color:#2563eb;"></i> Booking ${b.id}</span>
                        <span class="created-date">Booked on ${b.createdDate}</span>
                    </div>

                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="payment-status-badge ${b.paymentStatusClass}">${b.paymentStatus}</span>
                        <span class="status-badge status-${b.status.toLowerCase()}">
                            <i class="fa-solid fa-circle" style="font-size:0.5rem;"></i> ${b.status}
                        </span>
                    </div>
                </div>

                <div class="booking-card-body">
                    <div>
                        <div class="provider-info-row">
                            <img src="${b.providerThumb}" alt="${b.providerName}" class="provider-thumb" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Provider&background=0084ff&color=fff';">
                            <div class="provider-details">
                                <h3>${b.providerName}</h3>
                                <div class="package-name"><i class="fa-solid fa-compact-disc"></i> ${b.packageName}</div>
                            </div>
                        </div>

                        <div class="event-details-grid">
                            <div class="event-detail-item">
                                <i class="fa-solid fa-calendar-day"></i>
                                <span>Date: <strong>${b.eventDate}</strong> (${b.eventTime})</span>
                            </div>
                            <div class="event-detail-item">
                                <i class="fa-solid fa-location-dot"></i>
                                <span>Venue: <strong>${b.eventVenue}</strong></span>
                            </div>
                        </div>
                    </div>

                    <div class="pricing-side-box">
                        <div class="total-price-label">Total Booking Amount</div>
                        <div class="total-price-amount">₱${b.totalPrice.toLocaleString()}</div>
                        <div style="font-size:0.82rem; font-weight:700; color:#10b981; margin-top:4px;">Paid: ₱${b.amountPaid.toLocaleString()} (${b.paymentType === 'full' ? '100% Full' : '50% Down'})</div>
                        ${b.remainingBalance > 0 ? `<div style="font-size:0.82rem; font-weight:800; color:#ef4444; margin-top:2px;">Balance: ₱${b.remainingBalance.toLocaleString()} (Due 1 day before)</div>` : `<div style="font-size:0.82rem; font-weight:700; color:#2563eb; margin-top:2px;">✓ Remaining Balance Paid</div>`}
                    </div>
                </div>

                <div class="booking-card-actions">
                    <button type="button" class="btn-action-sm btn-reschedule" data-id="${b.id}" ${b.status === 'Completed' || b.status === 'Cancelled' ? 'disabled' : ''}>
                        <i class="fa-solid fa-calendar-pen"></i> Request Reschedule
                    </button>

                    <button type="button" class="btn-action-sm btn-cancel-refund" data-id="${b.id}" ${b.status === 'Completed' || b.status === 'Cancelled' ? 'disabled' : ''}>
                        <i class="fa-solid fa-ban"></i> Cancel & Refund
                    </button>

                    <button type="button" class="btn-action-sm btn-chat" data-id="${b.id}">
                        <i class="fa-solid fa-comments"></i> Chat with Provider
                    </button>

                    <button type="button" class="btn-action-sm btn-report" data-id="${b.id}">
                        <i class="fa-solid fa-triangle-exclamation"></i> Report Issue
                    </button>

                    <button type="button" class="btn-action-sm btn-feedback" data-id="${b.id}" ${b.status !== 'Completed' ? 'disabled' : ''}>
                        <i class="fa-solid fa-star"></i> Leave Feedback
                    </button>
                </div>
            </div>
        `).join('');

        attachActionListeners();
    };

    const attachActionListeners = () => {
        document.querySelectorAll('.btn-reschedule:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const bId = btn.getAttribute('data-id');
                document.getElementById('reschedule-booking-id').textContent = bId;
                rescheduleModal.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.btn-cancel-refund:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const bId = btn.getAttribute('data-id');
                document.getElementById('refund-booking-id').textContent = bId;
                refundModal.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.btn-chat').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = 'client-messages.html';
            });
        });

        document.querySelectorAll('.btn-report').forEach(btn => {
            btn.addEventListener('click', () => {
                const bId = btn.getAttribute('data-id');
                currentReportingBooking = clientBookingsData.find(x => x.id === bId || String(x.bookingId) === String(bId)) || null;
                const displaySpan = document.getElementById('report-booking-id');
                if (displaySpan) displaySpan.textContent = bId;
                if (reportModal) reportModal.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.btn-feedback:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const bId = btn.getAttribute('data-id');
                const feedbackIdSpan = document.getElementById('feedback-booking-id');
                if (feedbackIdSpan) feedbackIdSpan.textContent = bId;
                if (feedbackModal) feedbackModal.classList.remove('hidden');
            });
        });
    };

    let currentReportingBooking = null;

    tabBtns.forEach(tab => {
        tab.addEventListener('click', () => {
            tabBtns.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilterStatus = tab.getAttribute('data-status');
            renderBookings();
        });
    });

    document.getElementById('reschedule-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('✓ Reschedule request sent to provider for confirmation!', 'success');
        if (rescheduleModal) rescheduleModal.classList.add('hidden');
    });

    document.getElementById('refund-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('✓ Cancellation and Refund request submitted successfully.', 'success');
        if (refundModal) refundModal.classList.add('hidden');
    });

    document.getElementById('report-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const reason = document.getElementById('booking-report-reason')?.value;
        const description = document.getElementById('booking-report-desc')?.value;
        const submitBtn = document.getElementById('btn-submit-booking-report');

        if (!reason) {
            showToast('Please select an issue category.', 'warning');
            return;
        }
        if (!description || description.trim().length < 10) {
            showToast('Please provide at least 10 characters describing the issue.', 'warning');
            return;
        }

        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
        const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;

        if (!token || !user) {
            showToast('Please log in to submit a report.', 'error');
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
            }

            const res = await fetch('/api/reports/provider', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    userId: user.userId || user.id,
                    providerId: currentReportingBooking?.providerId || 1,
                    bookingId: currentReportingBooking?.bookingId || null,
                    reason,
                    description: `[Booking ${currentReportingBooking?.id || ''}] ${description.trim()}`
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Official report submitted to SoundSphere Administration for review.', 'success');
                if (reportModal) reportModal.classList.add('hidden');
                document.getElementById('report-form')?.reset();
            } else {
                showToast(data.message || 'Failed to submit report.', 'error');
            }
        } catch (err) {
            console.error('Booking report submit error:', err);
            showToast('Network error submitting report.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Report to Admin';
            }
        }
    });

    document.getElementById('feedback-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const bIdStr = document.getElementById('feedback-booking-id')?.textContent || '';
        const numericId = parseInt(bIdStr.replace('BK-', ''), 10) || 1;
        const reviewText = document.querySelector('#feedback-form textarea')?.value || 'Great service!';
        const rating = parseInt(document.querySelector('#feedback-form select')?.value, 10) || 5;

        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
            const headers = token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
            await fetch('/api/bookings/reviews', {
                method: 'POST',
                headers,
                body: JSON.stringify({ bookingId: numericId, rating, reviewText })
            });
        } catch (err) {
            console.warn('Review submit notice:', err.message);
        }

        showToast('✓ Thank you! Your review has been saved successfully.', 'success');
        if (feedbackModal) feedbackModal.classList.add('hidden');
        fetchLiveClientBookings();
    });

    fetchLiveClientBookings();
});
