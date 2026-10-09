/**
 * SoundSphere - Interactive Select Date & Time Booking Calendar Modal Controller
 * Matches the reference design with real-time provider availability status
 */

(function () {
    'use strict';

    // State
    let calCurrentMonth = new Date().getMonth();
    let calCurrentYear = new Date().getFullYear();
    let calSelectedDate = null; // YYYY-MM-DD
    let calSelectedSlot = 'Full day';
    let calSelectedStartTime = '08:00';
    let calSelectedEndTime = '22:00';
    let calProviderId = null;
    let calPackageId = null;
    let calPackageTitle = 'Event Package';
    let calPackagePrice = 15000;
    let calProviderName = 'SoundSphere Service Provider';
    let calBookedSlots = []; // from backend
    let calDateCapacities = [];
    let calDefaultMaxDailyBookings = 1;

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
                
                <!-- Modal Header -->
                <div class="cal-modal-header">
                    <div class="cal-modal-header-titles">
                        <h2>Select Date & Time</h2>
                        <p>Choose your preferred appointment date and available hourly slot.</p>
                    </div>
                    <button type="button" class="cal-btn-close" id="cal-modal-close-btn" title="Close">&times;</button>
                </div>

                <!-- Modal Body 2-Columns Grid -->
                <div class="cal-modal-body">
                    
                    <!-- Left: Interactive Monthly Calendar -->
                    <div class="cal-left-box">
                        <div class="cal-month-nav-row">
                            <button type="button" class="cal-nav-btn" id="cal-btn-prev" title="Previous Month">
                                <i class="fa-solid fa-chevron-left"></i>
                            </button>
                            <div class="cal-month-title-wrap">
                                <h3 class="cal-month-title" id="cal-month-year-display">October 2026</h3>
                                <div class="cal-month-subtitle">Select an available date</div>
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

                        <!-- Legend -->
                        <div class="cal-legend-row">
                            <div class="cal-legend-items">
                                <div class="cal-legend-item">
                                    <span class="cal-legend-dot available"></span> Available
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
                            <h3 class="cal-selected-day-header" id="cal-selected-header-date">Fri, October 23, 2026</h3>
                            
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

                <!-- Modal Footer -->
                <div class="cal-modal-footer">
                    <button type="button" class="cal-btn-cancel" id="cal-btn-cancel-action">Cancel</button>
                    <button type="button" class="cal-btn-confirm" id="cal-btn-confirm-action">
                        Confirm Booking <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>

            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Bind events
        document.getElementById('cal-modal-close-btn').onclick = window.closeBookingCalendarModal;
        document.getElementById('cal-btn-cancel-action').onclick = window.closeBookingCalendarModal;
        document.getElementById('modal-booking-calendar').onclick = (e) => {
            if (e.target === document.getElementById('modal-booking-calendar')) {
                window.closeBookingCalendarModal();
            }
        };

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
        const d = new Date(parts[0], parseInt(parts[1], 10) - 1, parts[2]);
        const dayName = DAY_NAMES[d.getDay()];
        const monthName = MONTH_NAMES[d.getMonth()];
        return `${dayName}, ${monthName} ${d.getDate()}, ${d.getFullYear()}`;
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
        // 1. Check custom capacity override
        const override = (calDateCapacities || []).find(c => c.SpecificDate === dateIso);
        const maxAllowed = override ? override.MaxBookings : calDefaultMaxDailyBookings;

        // If provider blocked this date (0 capacity)
        if (maxAllowed === 0) return true;

        if (!calBookedSlots || calBookedSlots.length === 0) return false;

        // Count overlapping active bookings on this date
        const activeCount = calBookedSlots.filter(slot => {
            const startDate = slot.ServiceStartDate ? slot.ServiceStartDate.split('T')[0] : (slot.EventDate ? slot.EventDate.split('T')[0] : '');
            const endDate = slot.ServiceEndDate ? slot.ServiceEndDate.split('T')[0] : startDate;
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

    // Render Calendar Grid
    function renderCalendarGrid() {
        const monthTitle = document.getElementById('cal-month-year-display');
        const grid = document.getElementById('cal-grid-cells');
        const prevBtn = document.getElementById('cal-btn-prev');
        const todayLabel = document.getElementById('cal-today-label');

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
            const isSelected = (calSelectedDate === cellDateIso);

            if (isToday) {
                cell.classList.add('today-marker');
            }

            if (isPast) {
                cell.classList.add('past', 'unavailable');
                cell.title = 'Past date (Unavailable)';
            } else if (isBooked) {
                cell.classList.add('blocked');
                cell.title = 'Date is already booked by another client';
            } else {
                cell.classList.add('available');
                cell.title = 'Available for booking';

                // Click listener for available dates
                cell.onclick = () => {
                    calSelectedDate = cellDateIso;
                    document.querySelectorAll('.cal-cell').forEach(c => c.classList.remove('selected'));
                    cell.classList.add('selected');
                    updateSelectedSummaryDisplay();
                };
            }

            if (isSelected) {
                cell.classList.add('selected');
            }

            grid.appendChild(cell);
        }
    }

    // Update the Right Summary Box
    function updateSelectedSummaryDisplay() {
        const headerDate = document.getElementById('cal-selected-header-date');
        const summaryDateText = document.getElementById('cal-summary-date-text');
        const summaryTimeText = document.getElementById('cal-summary-time-text');
        const summaryPackageNote = document.getElementById('cal-summary-package-note');
        const confirmBtn = document.getElementById('cal-btn-confirm-action');

        if (!calSelectedDate) {
            if (headerDate) headerDate.textContent = 'Select an available date';
            if (summaryDateText) summaryDateText.textContent = 'No date selected';
            if (summaryTimeText) summaryTimeText.textContent = 'Select a date and time';
            if (confirmBtn) confirmBtn.disabled = true;
            return;
        }

        const pretty = formatPrettyDate(calSelectedDate);
        if (headerDate) headerDate.textContent = pretty;
        if (summaryDateText) summaryDateText.textContent = pretty;

        const start12 = formatTime12h(calSelectedStartTime || '08:00');
        if (summaryTimeText) summaryTimeText.textContent = start12 || '08:00 AM';

        if (summaryPackageNote) {
            summaryPackageNote.textContent = `Reserves ${calPackageTitle} with ${calProviderName} for the selected date.`;
        }

        if (confirmBtn) confirmBtn.disabled = false;
    }

    // Handle Confirm Booking Click
    function handleCalendarBookingConfirm() {
        if (!calSelectedDate) {
            if (typeof showToast === 'function') {
                showToast('⚠ Please select an available date on the calendar first.', 'warning');
            } else {
                alert('Please select an available date on the calendar first.');
            }
            return;
        }

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
            packageId: calPackageId || 1,
            providerId: calProviderId || 13,
            packageTitle: calPackageTitle,
            packagePrice: calPackagePrice,
            eventDate: calSelectedDate,
            serviceStartDate: calSelectedDate,
            serviceEndDate: calSelectedDate,
            startTime: calSelectedStartTime || '08:00',
            endTime: calSelectedEndTime || '22:00',
            slotName: calSelectedSlot
        };

        sessionStorage.setItem('soundsphere_selected_package', JSON.stringify(selectedPkgInfo));

        const targetUrl = `/booking.html?package_id=${calPackageId || 1}&provider_id=${calProviderId || 13}&date=${calSelectedDate}&startTime=${calSelectedStartTime}&endTime=${calSelectedEndTime}`;

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

        calPackageId = options.packageId || options.pkgId || options.PackageID || options.id || 1;
        calProviderId = options.providerId || options.provider_id || options.ProviderID || options.userId || (new URLSearchParams(window.location.search).get('provider_id') || new URLSearchParams(window.location.search).get('providerId') || new URLSearchParams(window.location.search).get('id') || 1);
        calPackageTitle = options.title || options.packageName || options.PackageName || options.name || 'Audio-Visual Package';
        calPackagePrice = options.price || options.packagePrice || options.Price || 15000;
        calProviderName = options.providerName || options.provider_name || options.businessName || 'SoundSphere Provider';
        calSelectedStartTime = options.startTime || '08:00';

        // Update time input field in DOM
        const startTimeInput = document.getElementById('cal-start-time-input');
        if (startTimeInput) startTimeInput.value = calSelectedStartTime;

        // Set default calendar month to current date or initial preselected date
        const initialDate = options.defaultDate ? new Date(options.defaultDate) : new Date();
        calCurrentMonth = initialDate.getMonth();
        calCurrentYear = initialDate.getFullYear();

        // Set default selected date to tomorrow (or initialDate if future)
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        calSelectedDate = options.defaultDate || formatDateIso(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

        // Fetch provider's active bookings
        calBookedSlots = await fetchProviderBookings(calProviderId);

        // If default selected date is booked, find the next available date
        if (isDateBooked(calSelectedDate)) {
            for (let offset = 1; offset <= 30; offset++) {
                const nextD = new Date();
                nextD.setDate(nextD.getDate() + offset);
                const testIso = formatDateIso(nextD.getFullYear(), nextD.getMonth(), nextD.getDate());
                if (!isDateBooked(testIso)) {
                    calSelectedDate = testIso;
                    calCurrentMonth = nextD.getMonth();
                    calCurrentYear = nextD.getFullYear();
                    break;
                }
            }
        }

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
