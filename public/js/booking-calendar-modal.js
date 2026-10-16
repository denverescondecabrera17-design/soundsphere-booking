/**
 * SoundSphere - Interactive Select Date & Time Booking Calendar Modal Controller
 * Matches the reference design with real-time provider availability status
 */

(function () {
    'use strict';

    // State
    let calCurrentMonth = new Date().getMonth();
    let calCurrentYear = new Date().getFullYear();
    let calActiveSelectionMode = 'start'; // 'start' | 'end'
    let calSelectedStartDate = null; // YYYY-MM-DD
    let calSelectedEndDate = null; // YYYY-MM-DD
    let calSelectedSlot = 'Full day';
    let calSelectedStartTime = '08:00';
    let calSelectedEndTime = '22:00';
    let calProviderId = null;
    let calPackageId = null;
    let calPackageTitle = 'Event Package';
    let calPackagePrice = 15000;
    let calProviderName = 'CHiCHa Lights and Sounds';
    let calProviderAvatar = '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg';
    let calCoverageArea = 'Lian, Balayan, Nasugbu';
    let calBookedSlots = []; // from backend
    let calDateCapacities = [];
    let calDefaultMaxDailyBookings = 1;
    let calIsPermitExpired = false;
    let calPermitExpiryDate = null;
    let calIsSubscriptionInactive = false;

    const MONTH_NAMES = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Initialize & Inject Modal HTML if not present
    function ensureModalHTML() {
        if (document.getElementById('modal-booking-calendar')) return;

        const modalHTML = `
        <div class="cal-modal-overlay hidden" id="modal-booking-calendar" role="dialog" aria-modal="true">
            <div class="cal-modal-card">
                
                <!-- Fullscreen Header -->
                <div class="cal-modal-header">
                    <div class="cal-modal-header-left">
                        <button type="button" class="cal-btn-back-nav" id="cal-modal-back-btn" title="Back">
                            <i class="fa-solid fa-arrow-left"></i>
                            <span>Back</span>
                        </button>
                        <div class="cal-modal-header-titles">
                            <h2>Select Date & Time</h2>
                            <p>Choose any start date for your booking. Multi-day bookings must be consecutive with no gaps in between.</p>
                        </div>
                    </div>
                    <div class="cal-modal-header-right">
                        <div class="cal-step-indicator">
                            <span class="cal-step-badge"><i class="fa-solid fa-calendar-check"></i> Step 1 of 2</span>
                            <span class="cal-step-label">Select Date & Time</span>
                        </div>
                    </div>
                </div>

                <!-- Main Content Container -->
                <div class="cal-modal-body-container">
                    <div class="cal-modal-body">
                        
                        <!-- Left: Interactive Monthly Calendar -->
                        <div class="cal-left-box">
                            <!-- Permit Expired Lock Alert -->
                            <div id="cal-permit-locked-alert" style="display:none; background:#fee2e2; border:1.5px solid #fecaca; border-radius:10px; padding:10px 14px; margin-bottom:12px; align-items:center; gap:10px; color:#991b1b;">
                                <i class="fa-solid fa-lock" style="font-size:1.15rem; color:#dc2626; flex-shrink:0;"></i>
                                <div style="font-size:0.78rem; line-height:1.4;">
                                    <strong style="color:#7f1d1d; display:block;">Calendar Locked — Business Permit Expired</strong>
                                    <span>This service provider's municipal business permit has expired. All calendar dates are locked and cannot accept new bookings until renewed by admin.</span>
                                </div>
                            </div>

                            <!-- Subscription Inactive Lock Alert -->
                            <div id="cal-sub-locked-alert" style="display:none; background:#fffbeb; border:1.5px solid #fde68a; border-radius:10px; padding:10px 14px; margin-bottom:12px; align-items:center; gap:10px; color:#92400e;">
                                <i class="fa-solid fa-crown" style="font-size:1.15rem; color:#d97706; flex-shrink:0;"></i>
                                <div style="font-size:0.78rem; line-height:1.4;">
                                    <strong style="color:#78350f; display:block;">Calendar Locked — Active Subscription Required</strong>
                                    <span>This service provider does not currently have an active subscription. All calendar dates are locked and cannot accept new bookings until subscribed.</span>
                                </div>
                            </div>

                            <div class="cal-month-nav-row">
                                <button type="button" class="cal-nav-btn" id="cal-btn-prev" title="Previous Month">
                                    <i class="fa-solid fa-chevron-left"></i>
                                </button>
                                <div class="cal-month-title-wrap">
                                    <h3 class="cal-month-title" id="cal-month-year-display">October 2026</h3>
                                    <div class="cal-month-subtitle" id="cal-month-subtitle-display">Choose any start date on the calendar</div>
                                </div>
                                <button type="button" class="cal-nav-btn" id="cal-btn-next" title="Next Month">
                                    <i class="fa-solid fa-chevron-right"></i>
                                </button>
                            </div>

                            <!-- Days of Week Header -->
                            <div class="cal-days-header">
                                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                            </div>

                            <!-- 7-Column Dates Grid -->
                            <div class="cal-grid" id="cal-grid-cells">
                                <!-- Injected dynamically -->
                            </div>

                            <!-- Consecutive Booking Rule Hint & Conflict Alert -->
                            <div id="cal-range-alert-box" style="display:none; background:#fff1f2; border:1.5px solid #fecdd3; border-radius:10px; padding:10px 14px; margin-bottom:12px; color:#be123c; font-size:0.82rem; align-items:center; gap:10px;">
                                <i class="fa-solid fa-triangle-exclamation" style="font-size:1.1rem; color:#e11d48; flex-shrink:0;"></i>
                                <span id="cal-range-alert-text" style="flex:1; font-weight:600; line-height:1.4;"></span>
                                <button type="button" id="cal-range-alert-close" style="background:none; border:none; color:#be123c; cursor:pointer; font-size:1.1rem; padding:0 4px; font-weight:bold;" title="Dismiss">&times;</button>
                            </div>

                            <!-- Legend -->
                            <div class="cal-legend-row">
                                <div class="cal-legend-items">
                                    <div class="cal-legend-item">
                                        <span class="cal-legend-dot available"></span> Available
                                    </div>
                                    <div class="cal-legend-item">
                                        <span class="cal-legend-dot in-range"></span> In Range
                                    </div>
                                    <div class="cal-legend-item">
                                        <span class="cal-legend-dot unavailable"></span> Unavailable
                                    </div>
                                    <div class="cal-legend-item">
                                        <span class="cal-legend-dot blocked"></span> Blocked
                                    </div>
                                    <div class="cal-legend-item">
                                        <span class="cal-legend-dot selected"></span> Selected
                                    </div>
                                </div>
                                <div class="cal-today-text" id="cal-today-label">Today: Fri, October 9, 2026</div>
                            </div>
                        </div>

                        <!-- Right: Select Time & Summary -->
                        <div class="cal-right-box">
                            <div>
                                <h3 class="cal-selected-day-header" id="cal-selected-header-date" style="margin-bottom: 6px;">Fri, October 23, 2026</h3>
                                <div id="cal-consecutive-badge-container" style="display:none; margin-bottom: 12px;">
                                    <!-- Injected dynamically: badge and reset button -->
                                </div>

                                
                                <!-- Custom Time Picker Controls (Select Time - Start Time Only) -->
                                <div class="cal-time-category-title"><i class="fa-regular fa-clock"></i> Select Time</div>
                                <div class="cal-time-pickers-container">
                                    <div class="cal-time-field">
                                        <label for="cal-start-time-input"><i class="fa-regular fa-clock"></i> Start Time</label>
                                        <input type="time" id="cal-start-time-input" class="cal-time-input" value="08:00">
                                    </div>
                                </div>
                            </div>

                            <!-- Summary Box -->
                            <div class="cal-appointment-card">
                                <div class="cal-app-header-badge-wrap">
                                    <span class="cal-app-header-badge">SUMMARY</span>
                                </div>
                                <div class="cal-app-details">
                                    <div class="cal-app-detail-item">
                                        <i class="fa-regular fa-calendar"></i>
                                        <span id="cal-summary-date-text">Fri, October 23, 2026</span>
                                    </div>
                                    <div class="cal-app-detail-item">
                                        <i class="fa-regular fa-clock"></i>
                                        <span id="cal-summary-time-text">08:00 AM</span>
                                    </div>
                                    <div class="cal-app-detail-item" style="border-top: 1px dashed #bfdbfe; padding-top: 8px;">
                                        <i class="fa-solid fa-box-archive"></i>
                                        <div class="cal-app-note" id="cal-summary-package-note">Reserves package with service provider for the selected date.</div>
                                    </div>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>

                <!-- Fullscreen Footer -->
                <div class="cal-modal-footer">
                    <button type="button" class="cal-btn-confirm" id="cal-btn-confirm-action">
                        Next <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Resolve target Dashboard or Home URL based on user role and auth state
        const getDashboardOrHomeUrl = () => {
            try {
                const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) 
                    ? SoundSphereAPI.getAuthToken() 
                    : (localStorage.getItem('soundsphere_auth_token') || localStorage.getItem('soundsphere_jwt_token'));
                const userRaw = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) 
                    ? SoundSphereAPI.getAuthUser() 
                    : (() => {
                        const u = localStorage.getItem('soundsphere_user') || sessionStorage.getItem('soundsphere_user') || localStorage.getItem('soundsphere_user_info');
                        try { return u ? JSON.parse(u) : null; } catch (e) { return null; }
                    })();

                if (token && userRaw) {
                    const role = ((userRaw.role || userRaw.RoleName || userRaw.roleName) || '').toLowerCase();
                    if (role === 'admin' || role === 'administrator') {
                        return '/admin/dashboard.html';
                    } else if (role === 'cashier') {
                        return '/cashier/dashboard.html';
                    } else if (role === 'serviceprovider' || role === 'provider') {
                        return '/provider/dashboard.html';
                    } else {
                        return (window.location.pathname || '').includes('/client/') ? '/client/dashboard.html' : '/marketplace.html';
                    }
                }
            } catch (err) {
                console.error('Error determining dashboard/home URL:', err);
            }
            return '/index.html';
        };
        window.getDashboardOrHomeUrl = getDashboardOrHomeUrl;

        // Handle back button navigation in calendar header
        const handleCalendarBackNavigation = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const path = (window.location.pathname || '').toLowerCase();
            const isBookingPage = path.includes('booking.html') || path.endsWith('/booking');

            if (isBookingPage) {
                window.location.href = getDashboardOrHomeUrl();
            } else {
                window.closeBookingCalendarModal();
            }
        };

        // Handle cancel button in calendar footer
        const handleCalendarCancelNavigation = (e) => {
            if (e && e.preventDefault) e.preventDefault();
            const path = (window.location.pathname || '').toLowerCase();
            const isBookingPage = path.includes('booking.html') || path.endsWith('/booking');

            if (isBookingPage) {
                window.location.href = getDashboardOrHomeUrl();
            } else {
                window.closeBookingCalendarModal();
            }
        };

        // Bind events
        const closeBtn = document.getElementById('cal-modal-close-btn');
        if (closeBtn) closeBtn.onclick = handleCalendarCancelNavigation;
        const headerBackBtn = document.getElementById('cal-modal-back-btn');
        if (headerBackBtn) headerBackBtn.onclick = handleCalendarBackNavigation;
        const cancelActionBtn = document.getElementById('cal-btn-cancel-action');
        if (cancelActionBtn) cancelActionBtn.onclick = handleCalendarCancelNavigation;
        document.getElementById('modal-booking-calendar').onclick = (e) => {
            if (e.target === document.getElementById('modal-booking-calendar')) {
                const path = (window.location.pathname || '').toLowerCase();
                if (path.includes('booking.html') || path.endsWith('/booking')) {
                    window.location.href = getDashboardOrHomeUrl();
                } else {
                    window.closeBookingCalendarModal();
                }
            }
        };

        const alertCloseBtn = document.getElementById('cal-range-alert-close');
        if (alertCloseBtn) {
            alertCloseBtn.onclick = clearCalendarAlert;
        }

        document.getElementById('cal-btn-prev').onclick = () => {
            changeMonth(-1);
        };

        document.getElementById('cal-btn-next').onclick = () => {
            changeMonth(1);
        };


        // Start time picker input listener
        const startTimeInput = document.getElementById('cal-start-time-input');
        if (startTimeInput) {
            startTimeInput.addEventListener('input', () => {
                calSelectedStartTime = startTimeInput.value || '08:00';
                updateSelectedSummaryDisplay();
            });
        }

        // Confirm button click
        document.getElementById('cal-btn-confirm-action').onclick = handleCalendarBookingConfirm;
    }

    // Format 24-hour time string ("08:00") to 12-hour AM/PM string ("08:00 AM")
    function formatTime12h(time24) {
        if (!time24) return '';
        const parts = time24.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }

    // Format Date string: "YYYY-MM-DD"
    function formatDateIso(year, month, day) {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    }

    // Format Date for header: "Fri, October 23, 2026"
    function formatPrettyDate(dateStr) {
        if (!dateStr) return 'Select Date';
        const parts = dateStr.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayName = DAY_NAMES[d.getDay()];
        const monthName = MONTH_NAMES[d.getMonth()];
        return `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
    }

    // Format Short Date: "Wed, Oct 28"
    function formatShortPrettyDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayName = DAY_NAMES[d.getDay()];
        const monthShort = MONTH_NAMES[d.getMonth()].slice(0, 3);
        return `${dayName}, ${monthShort} ${d.getDate()}`;
    }

    // Helper: Add N days to an ISO date string ("YYYY-MM-DD")
    function addDaysToIso(startDateIso, numDays) {
        if (!startDateIso) return startDateIso;
        const [y, m, d] = startDateIso.split('-').map(Number);
        const date = new Date(y, m - 1, d);
        date.setDate(date.getDate() + numDays);
        return formatDateIso(date.getFullYear(), date.getMonth(), date.getDate());
    }

    // Generate list of all consecutive dates between start and end (inclusive)
    function getDatesInRange(startDateIso, endDateIso) {
        if (!startDateIso || !endDateIso) return [];
        const [sY, sM, sD] = startDateIso.split('-').map(Number);
        const [eY, eM, eD] = endDateIso.split('-').map(Number);
        let cur = new Date(sY, sM - 1, sD);
        const end = new Date(eY, eM - 1, eD);
        const list = [];
        while (cur <= end) {
            list.push(formatDateIso(cur.getFullYear(), cur.getMonth(), cur.getDate()));
            cur.setDate(cur.getDate() + 1);
        }
        return list;
    }

    // Check if consecutive range is continuous with no gaps or booked dates
    function checkRangeAvailability(startDateIso, endDateIso) {
        if (!startDateIso || !endDateIso) {
            return { available: false, message: 'Please select valid dates.' };
        }
        if (endDateIso < startDateIso) {
            return { available: false, message: 'End date cannot be earlier than start date.' };
        }

        const dates = getDatesInRange(startDateIso, endDateIso);
        if (dates.length === 0) {
            return { available: false, message: 'No dates in range.' };
        }

        // Validate each date in the range: must be continuous with no gaps
        for (let i = 0; i < dates.length; i++) {
            const dIso = dates[i];
            if (isDateBooked(dIso)) {
                const pretty = formatPrettyDate(dIso);
                return {
                    available: false,
                    blockedDate: dIso,
                    message: `Bookings must be continuous with no gaps between dates. Date ${pretty} is already booked or unavailable.`
                };
            }
        }

        return {
            available: true,
            dates,
            count: dates.length
        };
    }


    // Show alert banner on calendar modal
    function showCalendarAlert(message) {
        const box = document.getElementById('cal-range-alert-box');
        const text = document.getElementById('cal-range-alert-text');
        if (box && text) {
            text.textContent = message;
            box.style.display = 'flex';
        }
    }

    // Clear alert banner
    function clearCalendarAlert() {
        const box = document.getElementById('cal-range-alert-box');
        if (box) {
            box.style.display = 'none';
        }
    }

    // Fetch availability for provider
    async function fetchProviderBookings(providerId) {
        if (!providerId) return [];
        try {
            const res = await fetch(`/api/providers/${providerId}/availability`);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    calDateCapacities = data.dateCapacities || [];
                    calDefaultMaxDailyBookings = data.defaultMaxDailyBookings || 1;
                    calIsSubscriptionInactive = (data.isSubscriptionActive === false);
                    calIsPermitExpired = !!(data.isPermitExpired);
                    calPermitExpiryDate = data.permitExpiryDate || null;
                    if (Array.isArray(data.bookedSlots)) {
                        return data.bookedSlots;
                    }
                }
            }
        } catch (err) {
            console.warn('Provider availability fetch notice:', err.message);
        }
        return [];
    }

    // Check if a date is booked or blocked according to provider capacity rules
    function isDateBooked(dateIso) {
        // If business permit is expired or subscription is inactive, ALL calendar dates are locked
        if (calIsPermitExpired || calIsSubscriptionInactive) return true;

        // 1. Check custom capacity override
        const override = (calDateCapacities || []).find(c => c.SpecificDate === dateIso);
        const maxAllowed = override ? override.MaxBookings : calDefaultMaxDailyBookings;

        // If provider blocked this date (0 capacity)
        if (maxAllowed === 0) return true;

        if (!calBookedSlots || calBookedSlots.length === 0) return false;

        // Count overlapping active bookings on this date
        const activeCount = calBookedSlots.filter(slot => {
            const startDate = String(slot.ServiceStartDate || slot.EventDate || '').trim().split('T')[0];
            const endDate = String(slot.ServiceEndDate || startDate).trim().split('T')[0];
            return (dateIso >= startDate && dateIso <= endDate);
        }).length;

        return activeCount >= maxAllowed;
    }

    // Change Month
    function changeMonth(delta) {
        const today = new Date();
        const currentMonthAbsolute = today.getFullYear() * 12 + today.getMonth();
        const targetMonthAbsolute = calCurrentYear * 12 + calCurrentMonth + delta;

        // Prevent navigating into past months
        if (targetMonthAbsolute < currentMonthAbsolute) return;

        calCurrentMonth += delta;
        if (calCurrentMonth > 11) {
            calCurrentMonth = 0;
            calCurrentYear++;
        } else if (calCurrentMonth < 0) {
            calCurrentMonth = 11;
            calCurrentYear--;
        }

        renderCalendarGrid();
    }

    // Handle Date Cell Click (Choose Any Start Date + Consecutive Days with No Gaps)
    function handleDateCellClick(clickedIso) {
        if (isDateBooked(clickedIso)) return;

        // If no start date is selected yet, or if a multi-day range was already established, start fresh on clicked date
        if (!calSelectedStartDate || (calSelectedStartDate && calSelectedEndDate && calSelectedStartDate !== calSelectedEndDate)) {
            calSelectedStartDate = clickedIso;
            calSelectedEndDate = clickedIso;
            clearCalendarAlert();
            renderCalendarGrid();
            updateSelectedSummaryDisplay();
            return;
        }

        // A single start date is currently selected:
        if (clickedIso < calSelectedStartDate) {
            // User clicked an earlier date: set as the new start date
            calSelectedStartDate = clickedIso;
            calSelectedEndDate = clickedIso;
            clearCalendarAlert();
            renderCalendarGrid();
            updateSelectedSummaryDisplay();
            return;
        }

        if (clickedIso === calSelectedStartDate) {
            // Same date clicked: maintain single day
            calSelectedEndDate = clickedIso;
            clearCalendarAlert();
            renderCalendarGrid();
            updateSelectedSummaryDisplay();
            return;
        }

        // Clicked a later date: validate continuous consecutive booking with no gaps
        const check = checkRangeAvailability(calSelectedStartDate, clickedIso);
        if (!check.available) {
            showCalendarAlert(check.message);
            return;
        }

        calSelectedEndDate = clickedIso;
        clearCalendarAlert();
        renderCalendarGrid();
        updateSelectedSummaryDisplay();
    }

    // Render Calendar Grid
    function renderCalendarGrid() {
        const monthTitle = document.getElementById('cal-month-year-display');
        const grid = document.getElementById('cal-grid-cells');
        const prevBtn = document.getElementById('cal-btn-prev');
        const todayLabel = document.getElementById('cal-today-label');
        const permitAlert = document.getElementById('cal-permit-locked-alert');
        const subAlert = document.getElementById('cal-sub-locked-alert');

        if (permitAlert) {
            permitAlert.style.display = calIsPermitExpired ? 'flex' : 'none';
        }
        if (subAlert) {
            subAlert.style.display = calIsSubscriptionInactive ? 'flex' : 'none';
        }

        if (monthTitle) {
            monthTitle.textContent = `${MONTH_NAMES[calCurrentMonth]} ${calCurrentYear}`;
        }

        const now = new Date();
        const todayIso = formatDateIso(now.getFullYear(), now.getMonth(), now.getDate());

        if (todayLabel) {
            todayLabel.textContent = `Today: ${DAY_NAMES[now.getDay()]}, ${MONTH_NAMES[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
        }

        // Disable previous month button if we are currently looking at today's month
        if (prevBtn) {
            prevBtn.disabled = (calCurrentYear === now.getFullYear() && calCurrentMonth === now.getMonth());
        }

        if (!grid) return;
        grid.innerHTML = '';

        // First day of month (0 = Sun, 1 = Mon, ...)
        const firstDayIndex = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
        const totalDaysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();

        // Add blank cells
        for (let i = 0; i < firstDayIndex; i++) {
            const blank = document.createElement('div');
            blank.className = 'cal-cell empty';
            grid.appendChild(blank);
        }

        const isMultiDay = calSelectedStartDate && calSelectedEndDate && (calSelectedStartDate < calSelectedEndDate);

        // Add day cells
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const cellDateIso = formatDateIso(calCurrentYear, calCurrentMonth, d);
            const cell = document.createElement('div');
            cell.className = 'cal-cell';
            cell.textContent = d;
            cell.setAttribute('data-date', cellDateIso);

            const isPast = (cellDateIso < todayIso);
            const isToday = (cellDateIso === todayIso);
            const isBooked = isDateBooked(cellDateIso);

            if (isToday) {
                cell.classList.add('today-marker');
            }

            if (isPast) {
                cell.classList.add('past', 'unavailable');
                cell.title = 'Past date (Unavailable)';
            } else if (calIsSubscriptionInactive) {
                cell.classList.add('blocked');
                cell.style.background = '#fefce8';
                cell.style.color = '#94a3b8';
                cell.style.cursor = 'not-allowed';
                cell.title = 'Calendar Locked: Provider does not have an active subscription';
                cell.onclick = () => {
                    alert('⚠️ Calendar Locked\n\nThis service provider cannot accept new bookings because they do not have an active SoundSphere subscription.\n\nThe calendar will be automatically unlocked once the provider subscribes.');
                };
            } else if (calIsPermitExpired) {
                cell.classList.add('blocked');
                cell.style.background = '#f1f5f9';
                cell.style.color = '#94a3b8';
                cell.style.cursor = 'not-allowed';
                cell.title = 'Calendar Locked: Provider business permit is expired';
                cell.onclick = () => {
                    alert('⚠️ Calendar Locked\n\nThis service provider cannot accept new bookings because their municipal business permit has expired.\n\nThe calendar will be automatically unlocked once the provider submits a renewed permit and the admin approves it.');
                };
            } else if (isBooked) {
                cell.classList.add('blocked');
                cell.title = 'Date is already booked by another client';
            } else {
                cell.classList.add('available');
                cell.title = 'Click to select date or extend consecutive booking';

                // Click listener for available dates
                cell.onclick = () => {
                    handleDateCellClick(cellDateIso);
                };
            }

            // Apply Selection / Range highlighting
            if (calSelectedStartDate) {
                if (!isMultiDay) {
                    if (cellDateIso === calSelectedStartDate) {
                        cell.classList.add('selected');
                        cell.title = 'Selected Booking Date';
                    }
                } else {
                    if (cellDateIso === calSelectedStartDate) {
                        cell.classList.add('selected', 'selected-range-start');
                        cell.title = 'Booking Start Date';
                    } else if (cellDateIso === calSelectedEndDate) {
                        cell.classList.add('selected', 'selected-range-end');
                        cell.title = 'Booking End Date';
                    } else if (cellDateIso > calSelectedStartDate && cellDateIso < calSelectedEndDate) {
                        cell.classList.add('selected-range-mid');
                        cell.title = 'Included in continuous booking';
                    }
                }
            }

            grid.appendChild(cell);
        }

        updateSelectedSummaryDisplay();
    }

    // Update the Right Summary Box
    function updateSelectedSummaryDisplay() {
        const headerDate = document.getElementById('cal-selected-header-date');
        const badgeContainer = document.getElementById('cal-consecutive-badge-container');
        const summaryDateText = document.getElementById('cal-summary-date-text');
        const summaryTimeText = document.getElementById('cal-summary-time-text');
        const summaryPackageNote = document.getElementById('cal-summary-package-note');
        const confirmBtn = document.getElementById('cal-btn-confirm-action');
        const subtitleDisplay = document.getElementById('cal-month-subtitle-display');

        if (calIsSubscriptionInactive) {
            if (headerDate) headerDate.innerHTML = '<span style="color:#d97706;"><i class="fa-solid fa-lock"></i> Calendar Locked</span>';
            if (badgeContainer) badgeContainer.style.display = 'none';
            if (summaryDateText) summaryDateText.textContent = 'Unavailable (Subscription Required)';
            if (summaryTimeText) summaryTimeText.textContent = 'Bookings Disabled';
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Calendar Locked (Subscription Required)';
                confirmBtn.style.background = '#94a3b8';
                confirmBtn.style.cursor = 'not-allowed';
            }
            return;
        }

        if (calIsPermitExpired) {
            if (headerDate) headerDate.innerHTML = '<span style="color:#dc2626;"><i class="fa-solid fa-lock"></i> Calendar Locked</span>';
            if (badgeContainer) badgeContainer.style.display = 'none';
            if (summaryDateText) summaryDateText.textContent = 'Unavailable (Permit Expired)';
            if (summaryTimeText) summaryTimeText.textContent = 'Bookings Disabled';
            if (confirmBtn) {
                confirmBtn.disabled = true;
                confirmBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Calendar Locked (Permit Expired)';
                confirmBtn.style.background = '#94a3b8';
                confirmBtn.style.cursor = 'not-allowed';
            }
            return;
        }

        if (!calSelectedStartDate) {
            if (headerDate) headerDate.textContent = 'Select an available date';
            if (badgeContainer) badgeContainer.style.display = 'none';
            if (summaryDateText) summaryDateText.textContent = 'No date selected';
            if (summaryTimeText) summaryTimeText.textContent = 'Select a date and time';
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        const isMultiDay = calSelectedEndDate && (calSelectedStartDate < calSelectedEndDate);
        const dates = getDatesInRange(calSelectedStartDate, calSelectedEndDate || calSelectedStartDate);
        const dayCount = dates.length;

        if (!isMultiDay) {
            // Single Day
            const pretty = formatPrettyDate(calSelectedStartDate);
            if (headerDate) headerDate.textContent = pretty;
            if (badgeContainer) badgeContainer.style.display = 'none';
            if (summaryDateText) summaryDateText.textContent = `${pretty} (1 Day)`;
            if (subtitleDisplay) {
                subtitleDisplay.textContent = 'Select an available date on the calendar';
            }
        } else {
            // Multi-Day Consecutive Range
            const startPrettyShort = formatShortPrettyDate(calSelectedStartDate);
            const endPretty = formatPrettyDate(calSelectedEndDate);
            if (headerDate) headerDate.textContent = `${startPrettyShort} – ${endPretty}`;
            
            if (badgeContainer) {
                badgeContainer.style.display = 'flex';
                badgeContainer.style.alignItems = 'center';
                badgeContainer.style.gap = '8px';
                badgeContainer.style.flexWrap = 'wrap';
                badgeContainer.innerHTML = `
                    <span class="cal-days-count-badge">
                        <i class="fa-solid fa-link"></i> ${dayCount} Consecutive Days (Continuous)
                    </span>
                    <button type="button" class="cal-btn-reset-days" id="cal-btn-reset-range-action" title="Reset to single day booking">
                        <i class="fa-solid fa-rotate-left"></i> Reset to 1 Day
                    </button>
                `;

                const resetBtn = document.getElementById('cal-btn-reset-range-action');
                if (resetBtn) {
                    resetBtn.onclick = () => {
                        calSelectedEndDate = calSelectedStartDate;
                        clearCalendarAlert();
                        renderCalendarGrid();
                        updateSelectedSummaryDisplay();
                    };
                }
            }

            if (summaryDateText) summaryDateText.textContent = `${startPrettyShort} – ${endPretty} (${dayCount} Consecutive Days)`;
            if (subtitleDisplay) {
                subtitleDisplay.textContent = `${dayCount} consecutive days selected • Strictly continuous (no gaps)`;
            }
        }

        const start12 = formatTime12h(calSelectedStartTime || '08:00');
        if (summaryTimeText) {
            summaryTimeText.textContent = isMultiDay ? `${start12 || '08:00 AM'} (Daily Start Time)` : (start12 || '08:00 AM');
        }

        if (summaryPackageNote) {
            if (isMultiDay) {
                summaryPackageNote.textContent = `Reserves ${calPackageTitle} with ${calProviderName} for ${dayCount} consecutive days (continuous setup, no gaps).`;
            } else {
                summaryPackageNote.textContent = `Reserves ${calPackageTitle} with ${calProviderName} for the selected date.`;
            }
        }

        if (confirmBtn) confirmBtn.disabled = false;
    }

    // Handle Confirm Booking Click
    function handleCalendarBookingConfirm() {
        if (!calSelectedStartDate) {
            if (typeof showToast === 'function') {
                showToast('⚠ Please select an available date on the calendar first.', 'warning');
            } else {
                alert('Please select an available date on the calendar first.');
            }
            return;
        }

        // Validate continuous consecutive booking
        const effectiveEndDate = calSelectedEndDate || calSelectedStartDate;
        const validation = checkRangeAvailability(calSelectedStartDate, effectiveEndDate);
        if (!validation.available) {
            showCalendarAlert(validation.message);
            if (typeof showToast === 'function') {
                showToast(`⚠️ ${validation.message}`, 'warning');
            }
            return;
        }

        const totalDays = validation.count || 1;

        const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : localStorage.getItem('soundsphere_jwt_token');
        const user = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthUser() : null;

        // Check if user is the provider owner
        const isProviderUser = user && (
            user.role === 'ServiceProvider' || 
            user.roleId === 3 || 
            user.isProvider === true ||
            (user.roleName && user.roleName.toLowerCase().includes('provider'))
        );

        const isOwn = isProviderUser && (
            String(user.userId) === String(calProviderId) ||
            String(user.providerId) === String(calProviderId) ||
            String(user.id) === String(calProviderId)
        );

        if (isOwn) {
            if (typeof showToast === 'function') {
                showToast('⚠️ You cannot book your own service package. Please switch to a Client account.', 'warning');
            } else {
                alert('You cannot book your own service package.');
            }
            return;
        }

        // Package selection payload
        const selectedPkgInfo = {
            packageId: calPackageId || 17,
            providerId: calProviderId || 1,
            packageTitle: calPackageTitle || 'Birthday Package',
            packagePrice: calPackagePrice || 1000,
            providerName: (calProviderName && calProviderName !== 'SoundSphere Service Provider' && calProviderName !== 'Service Provider') ? calProviderName : 'CHiCHa Lights and Sounds',
            providerAvatar: calProviderAvatar || '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg',
            coverageArea: calCoverageArea || 'Lian, Balayan, Nasugbu',
            eventDate: calSelectedStartDate,
            serviceStartDate: calSelectedStartDate,
            serviceEndDate: effectiveEndDate,
            serviceHireDays: totalDays,
            numberOfDays: totalDays,
            startTime: calSelectedStartTime || '08:00',
            endTime: calSelectedEndTime || '22:00',
            slotName: calSelectedSlot
        };

        sessionStorage.setItem('soundsphere_selected_package', JSON.stringify(selectedPkgInfo));

        const targetUrl = `/booking.html?package_id=${selectedPkgInfo.packageId}&provider_id=${selectedPkgInfo.providerId}&date=${calSelectedStartDate}&startDate=${calSelectedStartDate}&endDate=${effectiveEndDate}&days=${totalDays}&startTime=${calSelectedStartTime}&endTime=${calSelectedEndTime}&provider_name=${encodeURIComponent(selectedPkgInfo.providerName)}&package_name=${encodeURIComponent(selectedPkgInfo.packageTitle)}`;

        if (!token || !user) {
            const pendingBooking = {
                ...selectedPkgInfo,
                returnUrl: targetUrl
            };
            sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBooking));
            window.location.href = `/login.html?returnUrl=${encodeURIComponent(targetUrl)}`;
            return;
        }

        window.closeBookingCalendarModal();
        window.location.href = targetUrl;
    }

    // Public API: Open Modal
    window.openBookingCalendarModal = async function (options = {}) {
        ensureModalHTML();

        calPackageId = options.packageId || options.pkgId || options.PackageID || options.id || 17;
        calProviderId = options.providerId || options.provider_id || options.ProviderID || options.userId || (new URLSearchParams(window.location.search).get('provider_id') || new URLSearchParams(window.location.search).get('providerId') || new URLSearchParams(window.location.search).get('id') || 1);
        calPackageTitle = options.title || options.packageName || options.PackageName || options.name || 'Birthday Package';
        calPackagePrice = options.price || options.packagePrice || options.Price || 1000;
        calProviderName = options.providerName || options.provider_name || options.businessName || 'CHiCHa Lights and Sounds';
        calProviderAvatar = options.providerAvatar || options.avatar || options.profilePicture || '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg';
        calCoverageArea = options.coverageArea || options.CoverageArea || 'Lian, Balayan, Nasugbu';
        calSelectedStartTime = options.startTime || '08:00';

        // Update time input field in DOM
        const startTimeInput = document.getElementById('cal-start-time-input');
        if (startTimeInput) startTimeInput.value = calSelectedStartTime;

        // Initial dates from options
        const initialStartDate = options.defaultStartDate || options.defaultDate || options.startDate || options.eventDate || null;
        const initialEndDate = options.defaultEndDate || options.endDate || initialStartDate;

        const initialDateObj = initialStartDate ? new Date(initialStartDate) : new Date();
        calCurrentMonth = initialDateObj.getMonth();
        calCurrentYear = initialDateObj.getFullYear();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        calSelectedStartDate = initialStartDate || formatDateIso(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        calSelectedEndDate = initialEndDate || calSelectedStartDate;

        // Fetch provider's active bookings
        calBookedSlots = await fetchProviderBookings(calProviderId);

        // If default selected start date is booked, find the next available date
        if (isDateBooked(calSelectedStartDate)) {
            for (let offset = 1; offset <= 30; offset++) {
                const nextD = new Date();
                nextD.setDate(nextD.getDate() + offset);
                const testIso = formatDateIso(nextD.getFullYear(), nextD.getMonth(), nextD.getDate());
                if (!isDateBooked(testIso)) {
                    calSelectedStartDate = testIso;
                    calSelectedEndDate = testIso;
                    calCurrentMonth = nextD.getMonth();
                    calCurrentYear = nextD.getFullYear();
                    break;
                }
            }
        } else {
            // Verify continuous range if initialEndDate was provided
            const check = checkRangeAvailability(calSelectedStartDate, calSelectedEndDate);
            if (!check.available) {
                calSelectedEndDate = calSelectedStartDate;
            }
        }

        clearCalendarAlert();
        renderCalendarGrid();
        updateSelectedSummaryDisplay();

        const modal = document.getElementById('modal-booking-calendar');
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    };

    // Public API: Close Modal
    window.closeBookingCalendarModal = function () {
        const modal = document.getElementById('modal-booking-calendar');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    };

})();
