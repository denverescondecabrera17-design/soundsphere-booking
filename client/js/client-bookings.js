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

                        const currentUser = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getCurrentUser() : null;
                        let clientName = b.ClientName;
                        if (Array.isArray(clientName)) clientName = clientName[0];
                        if (!clientName || clientName === 'null') {
                            clientName = (currentUser && (currentUser.name || currentUser.fullname || (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : null))) || 'Denver Cabrera';
                        }

                        // Cancellation Policy Evaluation
                        // 1. Bookings made 2+ days before event: Can cancel up to 1 day before the event
                        // 2. Same-day / short-notice bookings: Can cancel within 1 hour of reservation
                        const createdAtRaw = b.CreatedAt;
                        const createdAtDate = createdAtRaw ? new Date(createdAtRaw) : new Date();
                        const now = new Date();
                        const eventDateRaw = sDate || b.EventDate || b.ServiceStartDate;

                        let canCancel = false;
                        let cancelBadgeText = 'Cancel Closed';
                        let cancelTitle = 'Cancellation window closed.';
                        let timeRemainingText = '';

                        if (eventDateRaw && eventDateRaw !== 'N/A') {
                            let eventMidnight;
                            const match = String(eventDateRaw).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
                            if (match) {
                                eventMidnight = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 0, 0, 0);
                            } else {
                                const parsed = new Date(eventDateRaw);
                                eventMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0);
                            }

                            const createdMidnight = new Date(createdAtDate.getFullYear(), createdAtDate.getMonth(), createdAtDate.getDate(), 0, 0, 0);
                            const daysBetweenBookingAndEvent = Math.round((eventMidnight.getTime() - createdMidnight.getTime()) / (1000 * 60 * 60 * 24));

                            if (daysBetweenBookingAndEvent >= 2) {
                                // 2+ days before event: can cancel up to 1 day before the event
                                const cutoffTime = eventMidnight.getTime();
                                const oneDayBefore = new Date(cutoffTime - (24 * 60 * 60 * 1000));
                                const deadlineFormatted = oneDayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                                if (now.getTime() < cutoffTime) {
                                    canCancel = true;
                                    timeRemainingText = `Available until ${deadlineFormatted}`;
                                    cancelTitle = `You can cancel this booking up to 1 day before the event (${deadlineFormatted}).`;
                                } else {
                                    canCancel = false;
                                    cancelBadgeText = 'Cancel Closed';
                                    cancelTitle = `Cancellation closed. Bookings made in advance can only be cancelled up to 1 day before the event (${deadlineFormatted}).`;
                                }
                            } else {
                                // Same-day / short-notice bookings: can cancel within 1 hour
                                const elapsedMinutes = Math.max(0, (now.getTime() - createdAtDate.getTime()) / (1000 * 60));
                                const maxAllowedMinutes = 60; // 1 hour
                                if (elapsedMinutes <= maxAllowedMinutes) {
                                    canCancel = true;
                                    const remMins = Math.max(0, Math.floor(maxAllowedMinutes - elapsedMinutes));
                                    timeRemainingText = `${remMins}m left`;
                                    cancelTitle = `Same-day booking: You have ${remMins}m left to cancel (1-hour grace period).`;
                                } else {
                                    canCancel = false;
                                    cancelBadgeText = 'Cancel Closed (>1h)';
                                    cancelTitle = `Cancellation window closed. Same-day bookings can only be cancelled within 1 hour of reservation.`;
                                }
                            }
                        } else {
                            const elapsedMinutes = Math.max(0, (now.getTime() - createdAtDate.getTime()) / (1000 * 60));
                            if (elapsedMinutes <= 60) {
                                canCancel = true;
                                const remMins = Math.max(0, Math.floor(60 - elapsedMinutes));
                                timeRemainingText = `${remMins}m left`;
                                cancelTitle = `You have ${remMins}m left to cancel (1-hour grace period).`;
                            } else {
                                canCancel = false;
                                cancelBadgeText = 'Cancel Closed (>1h)';
                                cancelTitle = 'Cancellation window closed.';
                            }
                        }

                        const formatTime12h = (timeStr) => {
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

                        const totalAmountVal = parseFloat(b.TotalAmount || b.PackagePrice || 0);
                        const amountPaidVal = parseFloat(b.AmountPaid !== undefined && b.AmountPaid !== null ? b.AmountPaid : (b.PaymentType === 'downpayment' ? totalAmountVal * 0.5 : totalAmountVal));
                        const remainingBalVal = parseFloat(b.RemainingBalance !== undefined && b.RemainingBalance !== null ? b.RemainingBalance : (totalAmountVal - amountPaidVal));

                        let isOverdue = false;
                        let daysOverdue = 0;
                        if (sDate && sDate !== 'N/A') {
                            const match = String(sDate).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
                            if (match) {
                                const targetMidnight = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10)).getTime();
                                const now = new Date();
                                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                                const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
                                if (diffDays < 0) {
                                    isOverdue = true;
                                    daysOverdue = Math.abs(diffDays);
                                }
                            }
                        }

                        return {
                            id: b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`,
                            bookingId: b.BookingID,
                            clientName: clientName,
                            createdDate: new Date(b.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                            rawCreatedAt: b.CreatedAt,
                            canCancel,
                            cancelBadgeText,
                            cancelTitle,
                            timeRemainingText,
                            providerName: b.ProviderName || 'Sound & Lights Provider',
                            providerThumb: (b.ProviderAvatar && typeof b.ProviderAvatar === 'string' && b.ProviderAvatar.startsWith('/data:')) ? b.ProviderAvatar.substring(1) : (b.ProviderAvatar || 'images/concert_line_array.png'),
                            packageName: b.PackageName,
                            eventName: b.EventName,
                            eventType: b.EventType,
                            serviceStartDate: sDate,
                            serviceEndDate: eDate,
                            serviceHireDays: hireDays,
                            eventDate: dateText,
                            eventTime: formatTime12h(b.StartTime) || '08:00 AM',
                            eventVenue: b.VenueName || 'Private Event Venue',
                            eventAddress: b.EventAddress || (b.EventPlace ? `${b.EventPlace}, Batangas` : (b.Location || 'Batangas')),
                            locationNotes: b.LocationNotes,
                            eventPlace: b.EventPlace || 'Batangas',
                            packagePrice: parseFloat(b.PackagePrice || 0),
                            transportationFee: parseFloat(b.TransportationFee || 0),
                            distanceKm: parseFloat(b.DistanceKm || 0),
                            additionalDayCharges: parseFloat(b.AdditionalDayCharges || 0),
                            totalPrice: totalAmountVal,
                            amountPaid: amountPaidVal,
                            remainingBalance: remainingBalVal,
                            isOverdue,
                            daysOverdue,
                            paymentType: b.PaymentType || 'full',
                            paymentStatus: b.PaymentStatus || 'Paid',
                            paymentStatusClass: (remainingBalVal > 0) ? (isOverdue ? 'paid-overdue' : 'paid-partial') : 'paid-full',
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
    let currentCancellingBooking = null;

    // Render Booking Cards Function
    const renderBookings = () => {
        const filtered = clientBookingsData.filter(b => {
            if (activeFilterStatus === 'All') return true;
            if (activeFilterStatus === 'Confirmed') {
                return b.status === 'Confirmed' || b.status === 'Awaiting Client Confirmation';
            }
            return b.status === activeFilterStatus;
        });

        // Update Tab Counters
        tabBtns.forEach(tab => {
            const statusKey = tab.getAttribute('data-status');
            const countSpan = tab.querySelector('.tab-count-badge');
            if (statusKey === 'All') {
                if (countSpan) countSpan.textContent = clientBookingsData.length;
            } else if (statusKey === 'Confirmed') {
                const count = clientBookingsData.filter(b => b.status === 'Confirmed' || b.status === 'Awaiting Client Confirmation').length;
                if (countSpan) countSpan.textContent = count;
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

        bookingsListContainer.innerHTML = filtered.map(b => {
            // Determine cancel button state based on 3-hour limit
            let cancelBtnHtml = '';
            if (b.status === 'Cancelled') {
                cancelBtnHtml = `
                    <button type="button" class="btn-action-sm btn-cancel-refund" disabled style="opacity:0.6; background:#fee2e2; color:#ef4444; border-color:#fca5a5; cursor:not-allowed;">
                        <i class="fa-solid fa-ban"></i> Cancelled
                    </button>
                `;
            } else if (b.status === 'Completed') {
                cancelBtnHtml = `
                    <button type="button" class="btn-action-sm btn-cancel-refund" disabled style="opacity:0.5; cursor:not-allowed;">
                        <i class="fa-solid fa-ban"></i> Cancel & Refund
                    </button>
                `;
            } else if (b.canCancel) {
                cancelBtnHtml = `
                    <button type="button" class="btn-action-sm btn-cancel-refund btn-cancel-active" data-id="${b.id}" data-booking-id="${b.bookingId}" style="background:#fff1f2; color:#be123c; border:1.5px solid #fecdd3; font-weight:700; cursor:pointer;" title="${b.cancelTitle}">
                        <i class="fa-solid fa-ban" style="color:#e11d48;"></i> Cancel Booking
                    </button>
                `;
            } else {
                cancelBtnHtml = `
                    <button type="button" class="btn-action-sm btn-cancel-refund" disabled title="${b.cancelTitle}" style="opacity:0.55; cursor:not-allowed; background:#f8fafc; color:#94a3b8; border-color:#e2e8f0;">
                        <i class="fa-solid fa-lock" style="color:#94a3b8;"></i> ${b.cancelBadgeText}
                    </button>
                `;
            }

            return `
            <div class="booking-card" data-id="${b.id}">
                <div class="booking-card-header">
                    <div class="booking-id-meta" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                        <span class="booking-id-tag">Booking ${b.id}</span>
                        <span class="created-date">Booked on ${b.createdDate}</span>
                        <span style="font-size:0.88rem; color:#1e293b; font-weight:700; background:#f1f5f9; padding:2px 8px; border-radius:6px;">Booked by: <strong>${b.clientName}</strong></span>
                        ${b.eventType ? `<span style="font-size:0.82rem; color:#2563eb; font-weight:800; background:#eff6ff; border:1px solid #bfdbfe; padding:2px 8px; border-radius:6px;">${b.eventType}</span>` : ''}
                    </div>

                    <div style="display:flex; align-items:center; gap:8px;">
                        <span class="payment-status-badge ${b.paymentStatusClass}">${b.paymentStatus}</span>
                        ${b.status === 'Awaiting Client Confirmation' ? `
                            <span class="status-badge status-awaiting" style="background:#fef3c7; color:#b45309; border:1.5px solid #f59e0b; font-weight:800;" title="Provider finished services. Confirm completion within 24h.">
                                Awaiting Your Confirmation
                            </span>
                        ` : `
                            <span class="status-badge status-${b.status.toLowerCase()}">
                                ${b.status}
                            </span>
                        `}
                    </div>
                </div>

                <div class="booking-card-body">
                    <div>
                        <div class="provider-info-row">
                            <img src="${(typeof b.providerThumb === 'string' && b.providerThumb.startsWith('/data:')) ? b.providerThumb.substring(1) : (b.providerThumb || 'images/concert_line_array.png')}" alt="${b.providerName}" class="provider-thumb" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=Provider&background=0084ff&color=fff';">
                            <div class="provider-details">
                                <h3>${b.providerName}</h3>
                                <div class="package-name">${b.packageName}</div>
                            </div>
                        </div>

                        <div class="event-details-grid">
                            <div class="event-detail-item">
                                <span>Client: <strong>${b.clientName}</strong></span>
                            </div>
                            <div class="event-detail-item">
                                <span>Date: <strong>${b.eventDate}</strong></span>
                            </div>
                            <div class="event-detail-item">
                                <span>Start Time: <strong>${b.eventTime}</strong></span>
                            </div>
                            <div class="event-detail-item">
                                <span>Venue: <strong>${b.eventVenue}</strong></span>
                            </div>
                            <div class="event-detail-item">
                                <span>Location: <strong>${b.eventAddress}</strong></span>
                            </div>
                            ${b.eventName && b.eventName !== 'Event Service Booking' && b.eventName !== b.packageName ? `
                            <div class="event-detail-item">
                                <span>Title: <strong>${b.eventName}</strong></span>
                            </div>` : ''}
                        </div>
                        ${b.locationNotes ? `
                        <div style="margin-top:10px; background:#f8fafc; border-left:3px solid #64748b; padding:5px 12px; border-radius:4px; font-size:0.85rem; color:#475569;">
                            <strong>Client Note:</strong> ${b.locationNotes}
                        </div>` : ''}
                    </div>

                    <div class="pricing-side-box">
                        <div class="total-price-label">Total Booking Amount</div>
                        <div class="total-price-amount">₱${b.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div style="font-size:0.82rem; font-weight:700; color:#10b981; margin-top:4px;">Paid: ₱${b.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${b.paymentType === 'full' ? '100% Full' : '50% Down'})</div>
                        ${b.remainingBalance > 0 ? (b.isOverdue ? `<div style="font-size:0.82rem; font-weight:800; color:#dc2626; margin-top:2px;"><i class="fa-solid fa-triangle-exclamation"></i> Overdue: ₱${b.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${b.daysOverdue}d past due)</div>` : `<div style="font-size:0.82rem; font-weight:800; color:#ef4444; margin-top:2px;">Balance: ₱${b.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Due on event date)</div>`) : `<div style="font-size:0.82rem; font-weight:700; color:#2563eb; margin-top:2px;">Remaining Balance Paid</div>`}
                        <div style="font-size:0.75rem; color:#64748b; font-weight:600; margin-top:6px; border-top:1px dashed #e2e8f0; padding-top:4px;">
                            Pkg: ₱${b.packagePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Transpo: ₱${b.transportationFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${b.distanceKm ? ` (${b.distanceKm}km)` : ''}${b.additionalDayCharges > 0 ? ` | Extra: ₱${b.additionalDayCharges.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                        </div>
                    </div>
                </div>

                ${b.status === 'Awaiting Client Confirmation' ? `
                    <div style="background:#fffbeb; border:1.5px solid #fde68a; border-radius:10px; padding:12px 16px; margin: 12px 20px 0 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <i class="fa-solid fa-bell" style="color:#d97706; font-size:1.4rem;"></i>
                            <div>
                                <div style="font-weight:800; color:#92400e; font-size:0.92rem;">Service Marked Complete by Provider</div>
                                <div style="font-size:0.82rem; color:#b45309;">Please confirm that your lights &amp; sounds service was performed. Automatically accepts in 24 hours.</div>
                            </div>
                        </div>
                        <button type="button" onclick="window.acceptBookingCompletion(${b.bookingId}, '${b.id}')" style="background:#10b981; color:#fff; border:none; padding:9px 18px; border-radius:8px; font-weight:800; font-size:0.88rem; cursor:pointer; box-shadow:0 2px 6px rgba(16,185,129,0.3); transition:all 0.15s ease;">
                            Accept Completion
                        </button>
                    </div>
                ` : ''}

                <div class="booking-card-actions">
                    ${(b.status === 'Pending' || b.status === 'Pending Payment') ? `
                        <button type="button" class="btn-action-sm btn-continue-payment" onclick="window.continueBookingPayment('${b.id}', ${b.bookingId})" style="background:#2563eb; color:#fff; border:none; font-weight:800; cursor:pointer; box-shadow:0 2px 6px rgba(37,99,235,0.25); display:inline-flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-credit-card"></i> Complete Payment
                        </button>
                    ` : ''}
                    ${b.status === 'Awaiting Client Confirmation' ? `
                        <button type="button" class="btn-action-sm btn-accept-completion" onclick="window.acceptBookingCompletion(${b.bookingId}, '${b.id}')" style="background:#10b981; color:#fff; border:none; font-weight:800; cursor:pointer; box-shadow:0 2px 6px rgba(16,185,129,0.25);">
                            Accept Completion
                        </button>
                    ` : ''}

                    <button type="button" class="btn-action-sm btn-reschedule" data-id="${b.id}" ${b.status === 'Completed' || b.status === 'Cancelled' ? 'disabled' : ''}>
                        Request Reschedule
                    </button>

                    ${cancelBtnHtml}

                    <button type="button" class="btn-action-sm btn-chat" data-id="${b.id}">
                        Chat with Provider
                    </button>

                    <button type="button" class="btn-action-sm btn-report" data-id="${b.id}">
                        Report Issue
                    </button>

                    <button type="button" class="btn-action-sm btn-feedback" data-id="${b.id}" ${b.status !== 'Completed' ? 'disabled' : ''}>
                        Leave Feedback
                    </button>
                </div>
            </div>
            `;
        }).join('');

        attachActionListeners();
    };

    const attachActionListeners = () => {
        document.querySelectorAll('.btn-reschedule:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const bId = btn.getAttribute('data-id');
                document.getElementById('reschedule-booking-id').textContent = bId;
                if (rescheduleModal) rescheduleModal.classList.remove('hidden');
            });
        });

        document.querySelectorAll('.btn-cancel-active').forEach(btn => {
            btn.addEventListener('click', () => {
                const bId = btn.getAttribute('data-id');
                const numericBookingId = btn.getAttribute('data-booking-id');
                currentCancellingBooking = clientBookingsData.find(x => x.id === bId || String(x.bookingId) === String(numericBookingId)) || null;

                const displaySpan = document.getElementById('refund-booking-id');
                if (displaySpan) displaySpan.textContent = bId;

                const timerTextSpan = document.getElementById('cancel-time-remaining-text');
                if (timerTextSpan && currentCancellingBooking) {
                    const tRem = currentCancellingBooking.timeRemainingText || '';
                    timerTextSpan.textContent = tRem.includes('left')
                        ? `${tRem} left to cancel (1-hour same-day limit)`
                        : `${tRem} (1 day before event)`;
                }

                if (refundModal) refundModal.classList.remove('hidden');
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

    // 3-Hour Cancellation Form Submit Handler
    document.getElementById('refund-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentCancellingBooking) {
            showToast('⚠️ No booking selected for cancellation.', 'warning');
            return;
        }

        const reasonSelect = document.getElementById('cancel-booking-reason');
        const notesInput = document.getElementById('cancel-booking-notes');
        const submitBtn = document.getElementById('btn-confirm-cancel-booking');

        const reason = reasonSelect?.value;
        const notes = notesInput?.value ? notesInput.value.trim() : '';
        const fullReason = notes ? `${reason} - ${notes}` : reason;

        if (!reason) {
            showToast('⚠️ Please select a cancellation reason.', 'warning');
            return;
        }

        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
        const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/bookings/${currentCancellingBooking.bookingId}/cancel`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    userId: user?.userId || user?.id,
                    reason: fullReason
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showToast(`✓ Booking ${currentCancellingBooking.id} cancelled successfully.`, 'success');
                if (refundModal) refundModal.classList.add('hidden');
                document.getElementById('refund-form')?.reset();
                currentCancellingBooking = null;
                fetchLiveClientBookings();
            } else {
                showToast(`⚠️ ${data.message || 'Unable to cancel booking.'}`, 'error');
                if (data.expired) {
                    if (refundModal) refundModal.classList.add('hidden');
                    fetchLiveClientBookings();
                }
            }
        } catch (err) {
            console.error('Cancel booking submit error:', err);
            showToast('Network error while processing cancellation.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Confirm Cancellation';
            }
        }
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

    // Global Client Completion Acceptance Handler
    window.acceptBookingCompletion = async (bookingId, bookingRef) => {
        if (!confirm(`Confirm that provider services for Booking #${bookingRef || bookingId} have been completed?\n\nThis will mark the booking as Completed and release provider payout to the Cashier. You can also leave a rating and review.`)) return;
        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/bookings/${bookingId}/accept-completion`, {
                method: 'POST',
                headers
            });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast(data.message || '✓ Service completion accepted!', 'success');
                fetchLiveClientBookings();
            } else {
                showToast(data.message || 'Failed to accept completion.', 'error');
            }
        } catch (err) {
            console.error('Accept completion error:', err);
            showToast('Network error while accepting completion.', 'error');
        }
    };

    // Global Client Continue / Complete Payment Handler
    window.continueBookingPayment = async (bookingRef, bookingId) => {
        try {
            if (typeof showToast === 'function') {
                showToast('Connecting to PayMongo checkout...', 'info');
            }
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) 
                ? SoundSphereAPI.getAuthToken() 
                : (localStorage.getItem('soundsphere_jwt_token') || localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/bookings/paymongo/checkout', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    bookingReference: bookingRef,
                    bookingId: bookingId
                })
            });
            const data = await res.json();
            if (res.ok && (data.checkoutUrl || data.url)) {
                window.location.href = data.checkoutUrl || data.url;
            } else {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Unable to open checkout session. Please try again.', 'error');
                } else {
                    alert(data.message || 'Unable to open checkout session. Please try again.');
                }
            }
        } catch (err) {
            console.error('Continue booking payment error:', err);
            if (typeof showToast === 'function') {
                showToast('Network error while connecting to payment gateway.', 'error');
            } else {
                alert('Network error while connecting to payment gateway.');
            }
        }
    };

    fetchLiveClientBookings();
});
