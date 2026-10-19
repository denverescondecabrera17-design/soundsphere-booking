/**
 * SoundSphere - Booking Module Logic (Vanilla JS)
 * Handles Package Loading, Hours/Days Calculation, Real-Time Backend Availability Check, Google Maps, and Booking Submission
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Session Guard & Header Setup
    const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : localStorage.getItem('soundsphere_jwt_token');
    const currentUser = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthUser() : null;

    if (!token || !currentUser) {
        window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
        return;
    }

    const userNameSpan = document.getElementById('user-display-name');
    const userAvatarImg = document.getElementById('user-avatar-initials');
    const avatarBtn = document.getElementById('avatar-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    const displayName = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserDisplayName) ? SoundSphereAPI.getUserDisplayName(currentUser) : (localStorage.getItem('soundsphere_user_name') || 'Client Account');
    const initials = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserInitials) ? SoundSphereAPI.getUserInitials(currentUser) : 'CU';

    if (userNameSpan) userNameSpan.textContent = displayName;
    if (userAvatarImg) userAvatarImg.textContent = initials;

    if (avatarBtn && userDropdown) {
        avatarBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isHidden = userDropdown.style.display === 'none' || getComputedStyle(userDropdown).display === 'none';
            userDropdown.style.display = isHidden ? 'flex' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!avatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.style.display = 'none';
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.logoutAPI) {
                SoundSphereAPI.logoutAPI();
            } else {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/login.html?logout=true';
            }
        });
    }

    // Handle PayMongo checkout return / cancellation (client clicked Back or Cancel on PayMongo)
    const bookingUrlParams = new URLSearchParams(window.location.search);
    if (bookingUrlParams.get('cancelled') === '1') {
        const pendingRef = bookingUrlParams.get('ref');
        setTimeout(() => {
            if (typeof window.showToast === 'function') {
                window.showToast(`ℹ️ Payment was not completed. Your booking ${pendingRef ? `(${pendingRef}) ` : ''}is saved as Pending. You can complete your payment at any time under My Bookings.`, 'info');
            }
        }, 500);
    }

    // 2. DOM Form & Display Elements
    const form = document.getElementById('booking-main-form');
    const clientFirstNameInput = document.getElementById('booking-client-firstname');
    const clientMIInput = document.getElementById('booking-client-mi');
    const clientLastNameInput = document.getElementById('booking-client-lastname');
    const clientPhoneInput = document.getElementById('booking-client-phone');
    const clientEmailInput = document.getElementById('booking-client-email');
    const clientAltPhoneInput = document.getElementById('booking-client-alt-phone');

    const eventNameInput = document.getElementById('booking-event-name');
    const eventTypeSelect = document.getElementById('booking-event-type');
    const customEventTypeGroup = document.getElementById('custom-event-type-group');
    const customEventTypeInput = document.getElementById('booking-custom-event-type');
    const startDateInput = document.getElementById('booking-start-date');
    const endDateInput = document.getElementById('booking-end-date');
    const startTimeInput = document.getElementById('booking-start-time');
    const endTimeInput = document.getElementById('booking-end-time');
    const calcHoursDisplay = document.getElementById('calc-hours-display');
    const calcDaysDisplay = document.getElementById('calc-days-display');

    const placeSelect = document.getElementById('booking-place-select');
    const venueNameInput = document.getElementById('booking-venue-name');
    const completeAddressInput = document.getElementById('booking-complete-address');
    const locationNotesInput = document.getElementById('booking-location-notes');

    const mapSearchInput = document.getElementById('map-search-input');
    const btnSearchMap = document.getElementById('btn-search-map');
    const displayLatSpan = document.getElementById('display-lat');
    const displayLngSpan = document.getElementById('display-lng');

    const planDownpaymentCard = document.getElementById('plan-downpayment-card');
    const planFullCard = document.getElementById('plan-full-card');
    const planDownpaymentVal = document.getElementById('plan-downpayment-val');
    const planFullVal = document.getElementById('plan-full-val');
    const termsCheckbox = document.getElementById('booking-terms-agree');

    const summaryProviderImg = document.getElementById('summary-provider-img');
    const summaryProviderName = document.getElementById('summary-provider-name');
    const summaryProviderArea = document.getElementById('summary-provider-area');
    const summaryProviderAddress = document.getElementById('summary-provider-address-text');
    const summaryPkgName = document.getElementById('summary-pkg-name');
    const summaryPkgPrice = document.getElementById('summary-pkg-price');
    const summaryInclusionsList = document.getElementById('summary-inclusions-list');

    const summaryValPkgPrice = document.getElementById('summary-val-pkgprice');
    const summaryValTransport = document.getElementById('summary-val-transport');
    const summaryValTotal = document.getElementById('summary-val-total');
    const summaryValPlan = document.getElementById('summary-val-plan');
    const summaryValDueNow = document.getElementById('summary-val-duenow');
    const summaryValRemaining = document.getElementById('summary-val-remaining');

    const conflictBanner = document.getElementById('schedule-conflict-banner');
    const conflictText = document.getElementById('schedule-conflict-text');
    const btnSubmit = document.getElementById('btn-submit-booking');

    // Back to Select Date & Time / Open Calendar Handler
    const handleBackToCalendarSelection = (e) => {
        if (e && e.preventDefault) e.preventDefault();

        const urlParams = new URLSearchParams(window.location.search);
        const sessionSelected = (() => {
            try {
                const raw = sessionStorage.getItem('soundsphere_selected_package') || sessionStorage.getItem('soundsphere_pending_booking');
                return raw ? JSON.parse(raw) : null;
            } catch(err) { return null; }
        })();

        const pkgId = (packageData && (packageData.PackageID || packageData.id)) 
            || urlParams.get('package_id') || urlParams.get('packageId') || urlParams.get('pkgId') 
            || (sessionSelected && (sessionSelected.packageId || sessionSelected.PackageID)) || 1;

        const provId = (packageData && (packageData.ProviderID || packageData.providerId)) 
            || urlParams.get('provider_id') || urlParams.get('providerId') || urlParams.get('id') 
            || (sessionSelected && (sessionSelected.providerId || sessionSelected.ProviderID)) || 1;

        const pkgTitle = (packageData && (packageData.PackageName || packageData.title || packageData.name)) 
            || urlParams.get('package_name')
            || (sessionSelected && (sessionSelected.packageTitle || sessionSelected.packageName || sessionSelected.PackageName))
            || (summaryPkgName && summaryPkgName.textContent) || 'Event Service Package';

        const pkgPrice = (packageData && packageData.Price) 
            || (sessionSelected && (sessionSelected.packagePrice || sessionSelected.price || sessionSelected.Price))
            || (basePackagePrice || 15000);

        const provName = (packageData && (packageData.ProviderName || packageData.BusinessName))
            || urlParams.get('provider_name')
            || (sessionSelected && (sessionSelected.providerName || sessionSelected.ProviderName))
            || (summaryProviderName && summaryProviderName.textContent && summaryProviderName.textContent !== 'Service Provider' ? summaryProviderName.textContent : 'SoundSphere Provider');

        const curStartDate = (startDateInput && startDateInput.value) 
            || urlParams.get('startDate') || urlParams.get('date') || urlParams.get('eventDate') 
            || (sessionSelected && (sessionSelected.serviceStartDate || sessionSelected.eventDate || sessionSelected.date))
            || new Date().toISOString().split('T')[0];

        const curEndDate = (endDateInput && endDateInput.value)
            || urlParams.get('endDate')
            || (sessionSelected && sessionSelected.serviceEndDate)
            || curStartDate;

        const curTime = (startTimeInput && startTimeInput.value) 
            || urlParams.get('startTime') || urlParams.get('start_time') 
            || (sessionSelected && (sessionSelected.startTime || sessionSelected.start_time)) 
            || '08:00';

        if (typeof window.openBookingCalendarModal === 'function') {
            window.openBookingCalendarModal({
                packageId: pkgId,
                providerId: provId,
                title: pkgTitle,
                packageName: pkgTitle,
                price: pkgPrice,
                packagePrice: pkgPrice,
                providerName: provName,
                defaultStartDate: curStartDate,
                defaultEndDate: curEndDate,
                defaultDate: curStartDate,
                startTime: curTime
            });
        } else if (provId) {
            window.location.href = `provider-detail.html?id=${provId}&packageId=${pkgId}&openCalendar=true`;
        } else {
            window.location.href = 'marketplace.html';
        }
    };

    window.handleBackToCalendarSelection = handleBackToCalendarSelection;

    // Back navigation to Dashboard or Home
    const handleBookingBackNav = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const targetUrl = (typeof window.getDashboardOrHomeUrl === 'function') 
            ? window.getDashboardOrHomeUrl() 
            : ((typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser()) ? '/marketplace.html' : '/index.html');
        window.location.href = targetUrl;
    };

    window.handleBookingBackNav = handleBookingBackNav;

    const btnHeaderBack = document.getElementById('btn-header-back-to-calendar');
    const btnPageBack = document.getElementById('btn-page-back-to-calendar');
    const btnChangeSchedule = document.getElementById('btn-change-selected-schedule');

    if (btnHeaderBack) btnHeaderBack.addEventListener('click', handleBookingBackNav);
    if (btnPageBack) btnPageBack.addEventListener('click', handleBookingBackNav);
    if (btnChangeSchedule) btnChangeSchedule.addEventListener('click', handleBackToCalendarSelection);

    // Auto-populate Logged-In Client Information
    const autoPopulateClientInfo = async () => {
        const user = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) ? SoundSphereAPI.getAuthUser() : null;
        let liveProfile = null;

        if (token) {
            try {
                const res = await fetch('/api/users/profile', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.user) {
                        liveProfile = data.user;
                        if (typeof window.syncAllProfileUI === 'function') {
                            window.syncAllProfileUI(liveProfile);
                        }
                    }
                }
            } catch (e) {
                console.warn('Live client profile notice:', e.message);
            }
        }

        const activeUser = liveProfile || user || {};
        const fullName = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getUserDisplayName)
            ? SoundSphereAPI.getUserDisplayName(activeUser)
            : (activeUser.personalName || activeUser.clientName || activeUser.name || `${activeUser.firstName || activeUser.ClientFirstName || ''} ${activeUser.lastName || activeUser.ClientLastName || ''}`.trim() || activeUser.email || '');

        const email = activeUser.email || activeUser.Email || localStorage.getItem('soundsphere_user_email') || '';
        const phone = activeUser.phone || activeUser.Phone || activeUser.cellphone || '';

        let fName = activeUser.firstName || activeUser.ClientFirstName || '';
        let lName = activeUser.lastName || activeUser.ClientLastName || '';
        let mInit = activeUser.middleInitial || activeUser.middleName || activeUser.ClientMiddleInitial || '';

        if (!fName && fullName) {
            const parts = fullName.trim().split(/\s+/);
            if (parts.length === 1) {
                fName = parts[0];
            } else if (parts.length === 2) {
                fName = parts[0];
                lName = parts[1];
            } else if (parts.length >= 3) {
                fName = parts[0];
                if (parts[1].length <= 2) {
                    mInit = parts[1].replace(/\./g, '');
                    lName = parts.slice(2).join(' ');
                } else {
                    lName = parts.slice(1).join(' ');
                }
            }
        }

        if (clientFirstNameInput && !clientFirstNameInput.value) clientFirstNameInput.value = fName;
        if (clientMIInput && !clientMIInput.value) clientMIInput.value = mInit;
        if (clientLastNameInput && !clientLastNameInput.value) clientLastNameInput.value = lName;
        if (clientEmailInput && !clientEmailInput.value) clientEmailInput.value = email;
        if (clientPhoneInput && !clientPhoneInput.value) clientPhoneInput.value = phone;
    };
    autoPopulateClientInfo();

    // 3. State Management
    const urlParams = new URLSearchParams(window.location.search);
    const sessionSelected = (() => {
        try {
            const raw = sessionStorage.getItem('soundsphere_selected_package') || sessionStorage.getItem('soundsphere_pending_booking');
            return raw ? JSON.parse(raw) : null;
        } catch(e) { return null; }
    })();

    const targetPackageId = urlParams.get('package_id') || urlParams.get('packageId') || urlParams.get('pkgId') || (sessionSelected ? (sessionSelected.packageId || sessionSelected.PackageID) : null);
    const targetProviderId = urlParams.get('provider_id') || urlParams.get('providerId') || urlParams.get('id') || (sessionSelected ? (sessionSelected.providerId || sessionSelected.ProviderID) : null);

    let packageData = null;
    let basePackagePrice = 0;
    let additionalDayPercentage = 20.00;
    let additionalDayCharges = 0;
    let transportRatePerKm = 20.00; // ₱20 per km from service provider to client location
    let transportFee = 200; // Default for 10km initial distance (10 * 20 = 200)
    let calculatedDistanceKm = 10.0;
    let totalCost = 0;
    let selectedPaymentPlan = 'downpayment'; // 'downpayment' or 'full'
    let calculatedHours = 4.0;
    let calculatedDays = 1;

    let currentLat = 13.9388;
    let currentLng = 120.7308;
    let isScheduleAvailable = true;
    let transportationFeeTiers = [];
    let isPinLocked = false;

    const lockLocationPin = () => {
        isPinLocked = true;
        const pinLockBadge = document.getElementById('pin-lock-status-badge');
        if (pinLockBadge) pinLockBadge.style.display = 'inline-flex';
        if (window._soundsphereLeafletMap) {
            try {
                window._soundsphereLeafletMap.dragging.disable();
                window._soundsphereLeafletMap.touchZoom.disable();
                window._soundsphereLeafletMap.doubleClickZoom.disable();
                window._soundsphereLeafletMap.scrollWheelZoom.disable();
            } catch (e) {}
        }
        if (window._soundsphereLeafletMarker) {
            try {
                if (window._soundsphereLeafletMarker.dragging) {
                    window._soundsphereLeafletMarker.dragging.disable();
                }
            } catch (e) {}
        }
    };
    window.lockLocationPin = lockLocationPin;

    
    // Comprehensive Instant Offline Database for Batangas Places, Barangays & Venues
    const BATANGAS_PLACES_DB = [
        // BALAYAN BARANGAYS & VENUES
        { name: 'Barangay 1 (Poblacion)', place: 'Balayan', lat: 13.9349, lng: 120.7285, aliases: ['brgy 1', 'bry 1', 'bgy 1', 'pob 1', 'barangay 1'] },
        { name: 'Barangay 2 (Poblacion)', place: 'Balayan', lat: 13.9355, lng: 120.7260, aliases: ['brgy 2', 'bry 2', 'bgy 2', 'pob 2', 'barangay 2'] },
        { name: 'Barangay 3 (Poblacion)', place: 'Balayan', lat: 13.9381, lng: 120.7265, aliases: ['brgy 3', 'bry 3', 'bgy 3', 'pob 3', 'barangay 3'] },
        { name: 'Barangay 4 (Poblacion)', place: 'Balayan', lat: 13.9389, lng: 120.7286, aliases: ['brgy 4', 'bry 4', 'bgy 4', 'pob 4', 'barangay 4'] },
        { name: 'Barangay 5 (Poblacion)', place: 'Balayan', lat: 13.9396, lng: 120.7310, aliases: ['brgy 5', 'bry 5', 'bgy 5', 'pob 5', 'barangay 5'] },
        { name: 'Barangay 6 (Poblacion)', place: 'Balayan', lat: 13.9398, lng: 120.7338, aliases: ['brgy 6', 'bry 6', 'bgy 6', 'pob 6', 'barangay 6'] },
        { name: 'Barangay 7 (Poblacion)', place: 'Balayan', lat: 13.9381, lng: 120.7359, aliases: ['brgy 7', 'bry 7', 'bgy 7', 'pob 7', 'barangay 7'] },
        { name: 'Barangay 8 (Poblacion)', place: 'Balayan', lat: 13.9369, lng: 120.7382, aliases: ['brgy 8', 'bry 8', 'bgy 8', 'pob 8', 'barangay 8', 'bry 8 balayan'] },
        { name: 'Barangay 9 (Poblacion)', place: 'Balayan', lat: 13.9354, lng: 120.7358, aliases: ['brgy 9', 'bry 9', 'bgy 9', 'pob 9', 'barangay 9'] },
        { name: 'Barangay 10 (Poblacion)', place: 'Balayan', lat: 13.9360, lng: 120.7344, aliases: ['brgy 10', 'bry 10', 'bgy 10', 'pob 10', 'barangay 10'] },
        { name: 'Barangay 11 (Poblacion)', place: 'Balayan', lat: 13.9359, lng: 120.7326, aliases: ['brgy 11', 'bry 11', 'bgy 11', 'pob 11', 'barangay 11'] },
        { name: 'Barangay 12 (Poblacion)', place: 'Balayan', lat: 13.9366, lng: 120.7306, aliases: ['brgy 12', 'bry 12', 'bgy 12', 'pob 12', 'barangay 12'] },
        { name: 'Barangay Caloocan', place: 'Balayan', lat: 13.9460, lng: 120.7320, aliases: ['caloocan', 'brgy caloocan', 'bry caloocan'] },
        { name: 'Barangay Canda', place: 'Balayan', lat: 13.9550, lng: 120.7180, aliases: ['canda', 'brgy canda'] },
        { name: 'Barangay Carenahan', place: 'Balayan', lat: 13.9620, lng: 120.7250, aliases: ['carenahan', 'brgy carenahan'] },
        { name: 'Barangay Cayponce', place: 'Balayan', lat: 13.9500, lng: 120.7420, aliases: ['cayponce', 'brgy cayponce'] },
        { name: 'Barangay Dalig', place: 'Balayan', lat: 13.9680, lng: 120.7100, aliases: ['dalig', 'brgy dalig'] },
        { name: 'Barangay Dao', place: 'Balayan', lat: 13.9720, lng: 120.7380, aliases: ['dao', 'brgy dao'] },
        { name: 'Barangay Dilao', place: 'Balayan', lat: 13.9480, lng: 120.7050, aliases: ['dilao', 'brgy dilao'] },
        { name: 'Barangay Duhatan', place: 'Balayan', lat: 13.9580, lng: 120.7010, aliases: ['duhatan', 'brgy duhatan'] },
        { name: 'Barangay Gumamela', place: 'Balayan', lat: 13.9360, lng: 120.7410, aliases: ['gumamela', 'brgy gumamela'] },
        { name: 'Barangay Lanatan', place: 'Balayan', lat: 13.9520, lng: 120.7550, aliases: ['lanatan', 'brgy lanatan'] },
        { name: 'Barangay Lucban Pook', place: 'Balayan', lat: 13.9750, lng: 120.7220, aliases: ['lucban', 'brgy lucban', 'lucban pook'] },
        { name: 'Barangay Magabe', place: 'Balayan', lat: 13.9820, lng: 120.7150, aliases: ['magabe', 'brgy magabe'] },
        { name: 'Barangay Malalay', place: 'Balayan', lat: 13.9450, lng: 120.7620, aliases: ['malalay', 'brgy malalay'] },
        { name: 'Barangay Navotas', place: 'Balayan', lat: 13.9310, lng: 120.7220, aliases: ['navotas', 'brgy navotas'] },
        { name: 'Barangay Palikpikan', place: 'Balayan', lat: 13.9440, lng: 120.7480, aliases: ['palikpikan', 'brgy palikpikan'] },
        { name: 'Barangay Pooc', place: 'Balayan', lat: 13.9600, lng: 120.7450, aliases: ['pooc', 'brgy pooc'] },
        { name: 'Barangay Putol', place: 'Balayan', lat: 13.9650, lng: 120.7300, aliases: ['putol', 'brgy putol'] },
        { name: 'Barangay Sampaga', place: 'Balayan', lat: 13.9470, lng: 120.7150, aliases: ['sampaga', 'brgy sampaga'] },
        { name: 'Barangay San Piro', place: 'Balayan', lat: 13.9280, lng: 120.7120, aliases: ['san piro', 'brgy san piro'] },
        { name: 'Barangay Sukol', place: 'Balayan', lat: 13.9850, lng: 120.7350, aliases: ['sukol', 'brgy sukol'] },
        { name: 'Barangay Talisay', place: 'Balayan', lat: 13.9350, lng: 120.7500, aliases: ['talisay', 'brgy talisay'] },
        { name: 'Balayan Covered Court / Gymnasium', place: 'Balayan', lat: 13.9405, lng: 120.7368, aliases: ['covered court', 'balayan court', 'court', 'gym', 'gymnasium'] },
        { name: 'Balayan Municipal Hall & Plaza', place: 'Balayan', lat: 13.9412, lng: 120.7318, aliases: ['municipal hall', 'munisipyo', 'plaza', 'balayan plaza'] },
        { name: 'Balayan Baywalk', place: 'Balayan', lat: 13.9320, lng: 120.7325, aliases: ['baywalk', 'balayan baywalk'] },

        // NASUGBU BARANGAYS & VENUES
        { name: 'Barangay 1 (Poblacion)', place: 'Nasugbu', lat: 14.0725, lng: 120.6320, aliases: ['brgy 1 nasugbu', 'bry 1 nasugbu', 'pob 1 nasugbu'] },
        { name: 'Barangay 2 (Poblacion)', place: 'Nasugbu', lat: 14.0715, lng: 120.6335, aliases: ['brgy 2 nasugbu', 'bry 2 nasugbu'] },
        { name: 'Barangay 3 (Poblacion)', place: 'Nasugbu', lat: 14.0700, lng: 120.6345, aliases: ['brgy 3 nasugbu', 'bry 3 nasugbu'] },
        { name: 'Barangay 4 (Poblacion)', place: 'Nasugbu', lat: 14.0685, lng: 120.6350, aliases: ['brgy 4 nasugbu', 'bry 4 nasugbu'] },
        { name: 'Barangay 5 (Poblacion)', place: 'Nasugbu', lat: 14.0670, lng: 120.6340, aliases: ['brgy 5 nasugbu', 'bry 5 nasugbu'] },
        { name: 'Barangay 6 (Poblacion)', place: 'Nasugbu', lat: 14.0680, lng: 120.6325, aliases: ['brgy 6 nasugbu', 'bry 6 nasugbu'] },
        { name: 'Barangay 7 (Poblacion)', place: 'Nasugbu', lat: 14.0695, lng: 120.6310, aliases: ['brgy 7 nasugbu', 'bry 7 nasugbu'] },
        { name: 'Barangay 8 (Poblacion)', place: 'Nasugbu', lat: 14.0710, lng: 120.6295, aliases: ['brgy 8 nasugbu', 'bry 8 nasugbu', 'bgy 8 nasugbu'] },
        { name: 'Barangay 9 (Poblacion)', place: 'Nasugbu', lat: 14.0730, lng: 120.6305, aliases: ['brgy 9 nasugbu', 'bry 9 nasugbu'] },
        { name: 'Barangay 10 (Poblacion)', place: 'Nasugbu', lat: 14.0745, lng: 120.6320, aliases: ['brgy 10 nasugbu', 'bry 10 nasugbu'] },
        { name: 'Barangay 11 (Poblacion)', place: 'Nasugbu', lat: 14.0755, lng: 120.6340, aliases: ['brgy 11 nasugbu', 'bry 11 nasugbu'] },
        { name: 'Barangay 12 (Poblacion)', place: 'Nasugbu', lat: 14.0740, lng: 120.6355, aliases: ['brgy 12 nasugbu', 'bry 12 nasugbu'] },
        { name: 'Barangay Aga', place: 'Nasugbu', lat: 14.1350, lng: 120.8050, aliases: ['aga', 'brgy aga'] },
        { name: 'Barangay Balitoc', place: 'Nasugbu', lat: 14.1120, lng: 120.6120, aliases: ['balitoc', 'brgy balitoc'] },
        { name: 'Barangay Banilad', place: 'Nasugbu', lat: 14.0880, lng: 120.6650, aliases: ['banilad', 'brgy banilad'] },
        { name: 'Barangay Bilaran', place: 'Nasugbu', lat: 14.0550, lng: 120.6480, aliases: ['bilaran', 'brgy bilaran'] },
        { name: 'Barangay Bucana', place: 'Nasugbu', lat: 14.0780, lng: 120.6250, aliases: ['bucana', 'brgy bucana', 'bry bucana'] },
        { name: 'Barangay Bulihan', place: 'Nasugbu', lat: 14.0950, lng: 120.6520, aliases: ['bulihan', 'brgy bulihan'] },
        { name: 'Barangay Calayo', place: 'Nasugbu', lat: 14.2150, lng: 120.6180, aliases: ['calayo', 'brgy calayo', 'calayo beach'] },
        { name: 'Barangay Catandaan', place: 'Nasugbu', lat: 14.0850, lng: 120.6920, aliases: ['catandaan', 'brgy catandaan'] },
        { name: 'Barangay Dayap', place: 'Nasugbu', lat: 14.1200, lng: 120.7100, aliases: ['dayap', 'brgy dayap'] },
        { name: 'Barangay Kaylaway', place: 'Nasugbu', lat: 14.1080, lng: 120.7650, aliases: ['kaylaway', 'brgy kaylaway'] },
        { name: 'Barangay Looc', place: 'Nasugbu', lat: 14.2400, lng: 120.6050, aliases: ['looc', 'brgy looc', 'pico de loro', 'hamilo coast'] },
        { name: 'Barangay Lumbangan', place: 'Nasugbu', lat: 14.0620, lng: 120.6800, aliases: ['lumbangan', 'brgy lumbangan'] },
        { name: 'Barangay Natipuan', place: 'Nasugbu', lat: 14.1850, lng: 120.6020, aliases: ['natipuan', 'brgy natipuan', 'canyon cove'] },
        { name: 'Barangay Pantalan', place: 'Nasugbu', lat: 14.0760, lng: 120.6310, aliases: ['pantalan', 'brgy pantalan'] },
        { name: 'Barangay Papaya', place: 'Nasugbu', lat: 14.2520, lng: 120.5980, aliases: ['papaya', 'brgy papaya'] },
        { name: 'Barangay Putat', place: 'Nasugbu', lat: 14.0480, lng: 120.6650, aliases: ['putat', 'brgy putat'] },
        { name: 'Barangay Talangan', place: 'Nasugbu', lat: 14.0820, lng: 120.6450, aliases: ['talangan', 'brgy talangan'] },
        { name: 'Barangay Wawa', place: 'Nasugbu', lat: 14.0750, lng: 120.6270, aliases: ['wawa', 'brgy wawa'] },
        { name: 'Nasugbu Municipal Gymnasium & Covered Court', place: 'Nasugbu', lat: 14.0718, lng: 120.6342, aliases: ['nasugbu covered court', 'gym', 'gymnasium'] },
        { name: 'Club Balai Isabel / Events Pavilion', place: 'Nasugbu', lat: 14.0780, lng: 120.6400, aliases: ['club balai', 'balai', 'events hall'] },

        // LIAN BARANGAYS & VENUES
        { name: 'Barangay Bagong Pook', place: 'Lian', lat: 14.0380, lng: 120.6550, aliases: ['bagong pook', 'brgy bagong pook'] },
        { name: 'Barangay Balibago', place: 'Lian', lat: 13.9850, lng: 120.6280, aliases: ['balibago', 'brgy balibago'] },
        { name: 'Barangay Binubusan', place: 'Lian', lat: 14.0150, lng: 120.6620, aliases: ['binubusan', 'brgy binubusan'] },
        { name: 'Barangay Bungahan', place: 'Lian', lat: 14.0450, lng: 120.6680, aliases: ['bungahan', 'brgy bungahan'] },
        { name: 'Barangay Cumba', place: 'Lian', lat: 14.0280, lng: 120.6850, aliases: ['cumba', 'brgy cumba'] },
        { name: 'Barangay Humayingan', place: 'Lian', lat: 14.0520, lng: 120.6720, aliases: ['humayingan', 'brgy humayingan'] },
        { name: 'Barangay Kapito', place: 'Lian', lat: 14.0180, lng: 120.6420, aliases: ['kapito', 'brgy kapito'] },
        { name: 'Barangay Lumaniag', place: 'Lian', lat: 14.0410, lng: 120.6350, aliases: ['lumaniag', 'brgy lumaniag'] },
        { name: 'Barangay Luyahan', place: 'Lian', lat: 14.0620, lng: 120.6580, aliases: ['luyahan', 'brgy luyahan'] },
        { name: 'Barangay Malaruhatan', place: 'Lian', lat: 14.0250, lng: 120.6310, aliases: ['malaruhatan', 'brgy malaruhatan'] },
        { name: 'Barangay Matabungkay', place: 'Lian', lat: 13.9680, lng: 120.6320, aliases: ['matabungkay', 'brgy matabungkay', 'matabungkay beach'] },
        { name: 'Barangay Poblacion 1-5', place: 'Lian', lat: 14.0322, lng: 120.6514, aliases: ['poblacion', 'lian poblacion', 'pob lian'] },
        { name: 'Barangay Prenza', place: 'Lian', lat: 14.0480, lng: 120.6450, aliases: ['prenza', 'brgy prenza'] },
        { name: 'Barangay Puting-Kahoy', place: 'Lian', lat: 14.0050, lng: 120.6750, aliases: ['puting kahoy', 'brgy puting-kahoy'] },
        { name: 'Barangay San Diego', place: 'Lian', lat: 13.9890, lng: 120.6450, aliases: ['san diego', 'brgy san diego'] },
        { name: 'Lian Covered Court / Plaza', place: 'Lian', lat: 14.0325, lng: 120.6510, aliases: ['lian covered court', 'lian court', 'lian plaza'] }
    ];

    // Instant local place search matching algorithm
    const matchLocalBatangasPlaces = (query, selectedPlace = '') => {
        if (!query) return [];
        const normQ = String(query).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').trim();
        const tokens = normQ.split(/\s+/).filter(t => t.length > 0);
        if (tokens.length === 0) return [];

        return BATANGAS_PLACES_DB.map(p => {
            let score = 0;
            const pName = p.name.toLowerCase();
            const pPlace = p.place.toLowerCase();
            const allSearchText = [pName, pPlace, ...(p.aliases || [])].join(' ').toLowerCase();

            // Match priority if place matches current selected municipality
            if (selectedPlace && pPlace === selectedPlace.toLowerCase()) {
                score += 10;
            }

            tokens.forEach(tok => {
                // Ignore general filler words
                if (['philippines', 'batangas', 'calabarzon', 'street', 'st'].includes(tok)) return;

                if (p.aliases && p.aliases.some(a => a === tok || a.includes(tok))) {
                    score += 25;
                } else if (pName.includes(tok)) {
                    score += 15;
                } else if (allSearchText.includes(tok)) {
                    score += 8;
                }
            });

            return { place: p, score };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.place);
    };

    const MUNICIPALITY_COORDS = {
        'Balayan': { lat: 13.9388, lng: 120.7308, name: 'Balayan, Batangas' },
        'Nasugbu': { lat: 14.0714, lng: 120.6347, name: 'Nasugbu, Batangas' },
        'Lian': { lat: 14.0322, lng: 120.6514, name: 'Lian, Batangas' },
        'Calatagan': { lat: 13.8322, lng: 120.6322, name: 'Calatagan, Batangas' },
        'Tuy': { lat: 14.0225, lng: 120.7308, name: 'Tuy, Batangas' },
        'Calaca': { lat: 13.9317, lng: 120.8128, name: 'Calaca, Batangas' },
        'Lemery': { lat: 13.9189, lng: 120.8911, name: 'Lemery, Batangas' },
        'Taal': { lat: 13.8833, lng: 120.9333, name: 'Taal, Batangas' }
    };

    const normalizePhAddress = (query, place = '') => {
        if (!query) return '';
        let q = String(query).trim();
        // Convert abbreviations: BRY, BRGY, BGY, BGRY -> Barangay
        q = q.replace(/\b(?:brgy|bry|bgy|bgry)\.?\s*(\d+|[a-zA-Z]+)?\b/gi, (match, p1) => {
            return p1 ? `Barangay ${p1}` : 'Barangay';
        });
        q = q.replace(/\bpob\.?\b/gi, 'Poblacion');
        q = q.replace(/\bst\.?\b/gi, 'Street');
        q = q.replace(/\bave\.?\b/gi, 'Avenue');
        q = q.replace(/\s+/g, ' ').trim();
        return q;
    };
    window.normalizePhAddress = normalizePhAddress;

    const searchLocation = async (query) => {
        if (!query) return [];
        const place = (placeSelect && placeSelect.value) ? placeSelect.value : 'Nasugbu';
        const isOthers = (place === 'Others' || place === 'Other');
        const cleanQ = normalizePhAddress(query, isOthers ? '' : place);

        // 1. Instant 0ms local match (only when place is within service area, or query specifically matches Batangas dataset)
        if (typeof matchLocalBatangasPlaces === 'function' && !isOthers) {
            const localMatches = matchLocalBatangasPlaces(cleanQ, place);
            if (localMatches && localMatches.length > 0) {
                return localMatches.map(m => ({
                    lat: String(m.lat),
                    lon: String(m.lng || m.lon),
                    display_name: `${m.name}, ${m.place || place}, Batangas, Philippines`
                }));
            }
        }

        // 2. Extract barangay if present
        const brgyMatch = cleanQ.match(/\bBarangay\s+([A-Za-z0-9\s]+?)(?:,|$|\s+(?:Balayan|Nasugbu|Lian|Batangas))/i);
        const brgyName = brgyMatch ? `Barangay ${brgyMatch[1].trim()}` : '';

        // Strip generic venue words to get cleaner location
        const strippedQ = cleanQ.replace(/\b(?:covered court|court|gym|gymnasium|multipurpose hall|hall|plaza|resort|hotel|near|beside|in front of|tapat ng|tabi ng|compound|subdivision|phase \d+|blk \d+|lot \d+)\b/gi, '').trim();

        const hasPh = /philippines/i.test(cleanQ);
        const hasBatangas = /batangas/i.test(cleanQ);

        const queriesToTry = [];
        if (hasPh) {
            queriesToTry.push(cleanQ);
        } else {
            if (!isOthers) {
                if (hasBatangas) {
                    queriesToTry.push(`${cleanQ}, ${place}, Philippines`);
                } else {
                    queriesToTry.push(`${cleanQ}, ${place}, Batangas, Philippines`);
                    queriesToTry.push(`${cleanQ}, ${place}, Philippines`);
                }
            }
            queriesToTry.push(`${cleanQ}, Batangas, Philippines`);
            queriesToTry.push(`${cleanQ}, Philippines`);
        }

        if (brgyName) {
            if (!isOthers) queriesToTry.push(`${brgyName}, ${place}, Philippines`);
            queriesToTry.push(`${brgyName}, Batangas, Philippines`);
            queriesToTry.push(`${brgyName}, Philippines`);
        }

        if (strippedQ && strippedQ !== cleanQ) {
            if (!isOthers) queriesToTry.push(`${strippedQ}, ${place}, Philippines`);
            queriesToTry.push(`${strippedQ}, Philippines`);
        }

        if (!isOthers) {
            queriesToTry.push(`${place}, Batangas, Philippines`);
        }

        for (const q of queriesToTry) {
            try {
                const res = await fetch(`/api/config/geocode?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const results = await res.json();
                    if (results && results.length > 0) return results;
                }
            } catch (e) {}

            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&countrycodes=ph&limit=5`);
                if (res.ok) {
                    const results = await res.json();
                    if (results && results.length > 0) return results;
                }
            } catch (e) {}
        }

        if (!isOthers) {
            const mCoords = MUNICIPALITY_COORDS[place] || MUNICIPALITY_COORDS['Nasugbu'] || { lat: 14.0714, lng: 120.6347 };
            return [{
                lat: String(mCoords.lat),
                lon: String(mCoords.lng),
                display_name: `${cleanQ ? cleanQ + ', ' : ''}${place}, Batangas, Philippines`
            }];
        }
        return [];
    };
    window.searchLocation = searchLocation;

    // Haversine Spherical Distance Calculation (in kilometers)
    const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 10.0;
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round((R * c) * 10) / 10;
    };

    // Fetch Distance-Based Transportation Fee Configuration from Database
    const fetchTransportationFeeTiers = async () => {
        try {
            const res = await fetch('/api/bookings/transportation-fees');
            if (res.ok) {
                const data = await res.json();
                if (data.ratePerKm) {
                    transportRatePerKm = parseFloat(data.ratePerKm) || 20.00;
                }
                if (data.success && Array.isArray(data.fees)) {
                    transportationFeeTiers = data.fees;
                }
                if (typeof updatePriceBreakdown === 'function') {
                    updatePriceBreakdown();
                }
            }
        } catch (e) {
            console.warn('Transport fee rate fetch notice:', e.message);
        }
    };
    fetchTransportationFeeTiers();

    // Calculate Transportation / Service Fee at 20 pesos per km from service provider location to client location
    const getTransportFeeForDistance = (distKm) => {
        const km = Math.max(0, parseFloat(distKm) || 0);
        const rate = (typeof transportRatePerKm === 'number' && transportRatePerKm > 0) ? transportRatePerKm : 20.00;
        return Math.round(km * rate);
    };

    // Set Event Dates & Times (Start & End) from URL params, session selected package, or Default Tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const dd = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowStr = `${yyyy}-${mm}-${dd}`;
    const todayStr = new Date().toISOString().split('T')[0];

    const prefilledDate = urlParams.get('startDate') || urlParams.get('date') || urlParams.get('eventDate') || (sessionSelected && (sessionSelected.serviceStartDate || sessionSelected.eventDate || sessionSelected.date));
    const prefilledEndDate = urlParams.get('endDate') || (sessionSelected && sessionSelected.serviceEndDate) || prefilledDate;
    const prefilledStartTime = urlParams.get('startTime') || urlParams.get('start_time') || (sessionSelected && (sessionSelected.startTime || sessionSelected.start_time));
    const prefilledEndTime = urlParams.get('endTime') || urlParams.get('end_time') || (sessionSelected && (sessionSelected.endTime || sessionSelected.end_time));

    const initialStartDate = prefilledDate || tomorrowStr;
    const initialEndDate = prefilledEndDate || initialStartDate;

    if (startDateInput) {
        startDateInput.min = todayStr;
        startDateInput.value = initialStartDate;
    }
    if (endDateInput) {
        endDateInput.min = todayStr;
        endDateInput.value = initialEndDate;
    }
    if (startTimeInput && prefilledStartTime) {
        startTimeInput.value = prefilledStartTime;
    }
    if (endTimeInput && prefilledEndTime) {
        endTimeInput.value = prefilledEndTime;
    }

    // Initialize Extra-Large Flatpickr Calendar Popup if library is loaded and inputs are visible
    if (typeof flatpickr === 'function') {
        if (startDateInput && startDateInput.type !== 'hidden') {
            flatpickr(startDateInput, {
                minDate: 'today',
                defaultDate: initialStartDate,
                animate: true,
                onChange: function(selectedDates, dateStr) {
                    if (endDateInput && endDateInput.value < dateStr) {
                        endDateInput.value = dateStr;
                    }
                    if (typeof calculateDuration === 'function') calculateDuration();
                }
            });
        }
        if (endDateInput && endDateInput.type !== 'hidden') {
            flatpickr(endDateInput, {
                minDate: 'today',
                defaultDate: initialEndDate,
                animate: true,
                onChange: function() {
                    if (typeof calculateDuration === 'function') calculateDuration();
                }
            });
        }
    }

    // 4. Fetch Package & Provider Details Dynamically from Backend Database
    const loadPackageData = async () => {
        try {
            let fetched = false;

            // 1. Try fetching package details directly via GET /api/packages/:id
            if (targetPackageId) {
                const res = await fetch(`/api/packages/${targetPackageId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.package) {
                        packageData = data.package;
                        fetched = true;
                    }
                }
            }

            // 2. Fallback: Query provider details via GET /api/providers/:id to locate package
            if (!fetched && targetProviderId) {
                const provRes = await fetch(`/api/providers/${targetProviderId}`);
                if (provRes.ok) {
                    const provData = await provRes.json();
                    const prov = provData.provider || provData.data;
                    if (prov) {
                        const pkgs = prov.packages || [];
                        const targetTitle = (sessionSelected && (sessionSelected.packageTitle || sessionSelected.packageName || sessionSelected.title)) || '';
                        const foundPkg = targetPackageId ? (pkgs.find(p => p.id == targetPackageId || p.PackageID == targetPackageId || (targetTitle && (p.name === targetTitle || p.title === targetTitle))) || pkgs[0]) : pkgs[0];

                        if (foundPkg) {
                            packageData = {
                                PackageID: foundPkg.id || foundPkg.PackageID || targetPackageId,
                                PackageName: foundPkg.title || foundPkg.name || foundPkg.PackageName || 'Birthday Package',
                                Price: parseFloat(foundPkg.price || foundPkg.Price || 1000),
                                Description: foundPkg.description || foundPkg.Description || '',
                                Inclusions: Array.isArray(foundPkg.inclusions) ? foundPkg.inclusions.join(', ') : (foundPkg.Inclusions || '2 microphone, 2 speakers, 2 lights'),
                                images: foundPkg.images || [],
                                ProviderID: prov.ProviderID || prov.providerId || prov.id || targetProviderId,
                                ProviderName: prov.BusinessName || prov.businessName || prov.name || 'CHiCHa Lights and Sounds',
                                ProviderAvatar: prov.ProviderProfilePicture || prov.profilePicture || prov.avatar || prov.userProfilePicture || '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg',
                                CoverageArea: prov.CoverageArea || prov.coverageArea || 'Lian, Balayan, Nasugbu'
                            };
                            fetched = true;
                        }
                    }
                }
            }

            // 3. Fallback: Parse session stored package details
            if (!fetched && sessionSelected) {
                const fallbackProvName = sessionSelected.providerName || sessionSelected.ProviderName;
                const fallbackProvAvatar = sessionSelected.providerAvatar || sessionSelected.ProviderAvatar;
                const fallbackCoverage = sessionSelected.coverageArea || sessionSelected.CoverageArea;

                packageData = {
                    PackageID: sessionSelected.packageId || sessionSelected.PackageID || targetPackageId || 17,
                    PackageName: sessionSelected.packageTitle || sessionSelected.packageName || sessionSelected.PackageName || 'Birthday Package',
                    Price: parseFloat(sessionSelected.packagePrice || sessionSelected.price || sessionSelected.Price || 1000),
                    Description: sessionSelected.description || 'Professional Lights & Sounds Package',
                    Inclusions: sessionSelected.inclusions || '2 microphone, 2 speakers, 2 lights',
                    ProviderID: sessionSelected.providerId || sessionSelected.ProviderID || targetProviderId || 1,
                    ProviderName: (fallbackProvName && fallbackProvName !== 'Service Provider') ? fallbackProvName : 'CHiCHa Lights and Sounds',
                    ProviderAvatar: fallbackProvAvatar || '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg',
                    CoverageArea: fallbackCoverage || 'Lian, Balayan, Nasugbu'
                };
                fetched = true;
            }

            // 4. Default safety fallback if nothing resolved
            if (!packageData) {
                packageData = {
                    PackageID: 17,
                    PackageName: 'Birthday Package',
                    Price: 1000,
                    Description: 'its for birthday party',
                    Inclusions: '2 microphone, 2 speakers, 2 lights',
                    ProviderID: 1,
                    ProviderName: 'CHiCHa Lights and Sounds',
                    ProviderAvatar: '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg',
                    CoverageArea: 'Lian, Balayan, Nasugbu'
                };
            }

            // Render UI with exact availed package information
            basePackagePrice = parseFloat(packageData.Price || packageData.price || 0);
            totalCost = basePackagePrice + transportFee;

            if (summaryProviderName) {
                const pName = packageData.ProviderName || packageData.BusinessName || urlParams.get('provider_name') || (sessionSelected && sessionSelected.providerName);
                summaryProviderName.textContent = (pName && pName !== 'Service Provider') ? pName : 'CHiCHa Lights and Sounds';
            }
            if (summaryProviderImg) {
                const defaultAvatar = '/uploads/avatars/provider-avatar-1788072268945-324628540.jpg';
                let avatarUrl = packageData.ProviderAvatar || packageData.ProfilePicture || (packageData.images && packageData.images[0] && packageData.images[0].url) || defaultAvatar;
                if (avatarUrl && typeof avatarUrl === 'string') {
                    avatarUrl = avatarUrl.trim();
                    if (avatarUrl.startsWith('/data:')) {
                        avatarUrl = avatarUrl.substring(1);
                    } else if (!avatarUrl.startsWith('http') && !avatarUrl.startsWith('/') && !avatarUrl.startsWith('data:')) {
                        avatarUrl = '/' + avatarUrl;
                    }
                }
                summaryProviderImg.src = avatarUrl;
                summaryProviderImg.onerror = function() {
                    this.src = defaultAvatar;
                };
            }
            if (summaryProviderArea) {
                const cov = packageData.CoverageArea || urlParams.get('coverage_area') || (sessionSelected && sessionSelected.coverageArea);
                summaryProviderArea.innerHTML = `<i class="fa-solid fa-location-dot"></i> Coverage: ${cov || 'Lian, Balayan, Nasugbu'}`;
            }
            if (summaryProviderAddress) {
                const bAddr = (packageData && (packageData.BusinessAddress || packageData.businessAddress || packageData.address)) || 'Balayan, Batangas';
                summaryProviderAddress.textContent = bAddr;
            }
            if (summaryPkgName) {
                const pTitle = packageData.PackageName || urlParams.get('package_name') || (sessionSelected && (sessionSelected.packageTitle || sessionSelected.packageName));
                summaryPkgName.textContent = pTitle || 'Birthday Package';
            }
            const formatMoney = (val) => {
                const num = parseFloat(val) || 0;
                return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            if (summaryPkgPrice) summaryPkgPrice.textContent = formatMoney(basePackagePrice);

            // Render Inclusions
            if (summaryInclusionsList) {
                let incs = [];
                if (Array.isArray(packageData.inclusionsList) && packageData.inclusionsList.length > 0) {
                    incs = packageData.inclusionsList;
                } else if (typeof packageData.Inclusions === 'string') {
                    incs = packageData.Inclusions.split(',').map(s => s.trim()).filter(Boolean);
                } else if (Array.isArray(packageData.inclusions)) {
                    incs = packageData.inclusions;
                } else {
                    incs = ['Audio & Lighting Rig', 'Operator & Crew Support'];
                }
                summaryInclusionsList.innerHTML = incs.map(inc => `<li><i class="fa-solid fa-check" style="color:#10b981; margin-right:6px;"></i> ${inc}</li>`).join('');
            }

            updatePriceBreakdown();
            checkScheduleAvailability();

        } catch (err) {
            console.warn('Package load notice:', err);
        }
    };

    // 5. Dynamic Real-Time Price & Payment Plan Breakdown Calculation
    const updatePriceBreakdown = () => {
        const formatMoney = (val) => {
            const num = parseFloat(val) || 0;
            return `₱${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        };

        // 1. Base Package Price
        basePackagePrice = packageData ? parseFloat(packageData.Price || 0) : basePackagePrice;

        // 2. Multi-Day Package Calculation: Package price multiplies by the number of days booked, but transportation is NOT multiplied
        // Day 1 is basePackagePrice; each additional day is also charged at full daily basePackagePrice
        additionalDayCharges = calculatedDays > 1 ? Math.round(basePackagePrice * (calculatedDays - 1)) : 0;

        // 3. Distance & Transportation Fee Calculation (One-time fee, not multiplied by days)
        let pLat = (packageData && packageData.ProviderLatitude) ? parseFloat(packageData.ProviderLatitude) : null;
        let pLng = (packageData && packageData.ProviderLongitude) ? parseFloat(packageData.ProviderLongitude) : null;

        if (!pLat || !pLng) {
            const provAddr = (packageData && packageData.ProviderBusinessAddress) ? packageData.ProviderBusinessAddress : (packageData && packageData.CoverageArea ? packageData.CoverageArea : '');
            if (provAddr.includes('Balayan')) { pLat = 13.9388; pLng = 120.7308; }
            else if (provAddr.includes('Nasugbu')) { pLat = 14.0722; pLng = 120.6318; }
            else { pLat = 13.8402; pLng = 120.6558; } // Lian default
        }

        let eLat = currentLat;
        let eLng = currentLng;

        if (!eLat || !eLng) {
            const selectedPlace = placeSelect ? placeSelect.value : 'Lian';
            const mCoords = MUNICIPALITY_COORDS[selectedPlace] || MUNICIPALITY_COORDS['Lian'];
            eLat = mCoords.lat;
            eLng = mCoords.lng;
        }

        calculatedDistanceKm = calculateHaversineDistance(pLat, pLng, eLat, eLng);
        transportFee = getTransportFeeForDistance(calculatedDistanceKm);

        // 4. Total Booking Price: (Base Package Price * Days) + One-Time Transportation Fee
        totalCost = basePackagePrice + additionalDayCharges + transportFee;

        // 5. Payment Plan Amounts
        const downpaymentVal = Math.round(totalCost * 0.5);
        const fullVal = totalCost;

        if (planDownpaymentVal) planDownpaymentVal.textContent = formatMoney(downpaymentVal);
        if (planFullVal) planFullVal.textContent = formatMoney(fullVal);

        if (summaryValPkgPrice) summaryValPkgPrice.textContent = formatMoney(basePackagePrice);

        // Additional Day Row Display
        const summaryRowAddDays = document.getElementById('summary-row-adddays');
        const summaryLblAddDays = document.getElementById('summary-lbl-adddays');
        const summaryValAddDays = document.getElementById('summary-val-adddays');

        if (calculatedDays > 1) {
            const addDaysCount = calculatedDays - 1;
            if (summaryRowAddDays) summaryRowAddDays.style.display = 'table-row';
            if (summaryLblAddDays) summaryLblAddDays.textContent = `${addDaysCount} add'l day${addDaysCount > 1 ? 's' : ''}`;
            if (summaryValAddDays) summaryValAddDays.textContent = `+${formatMoney(additionalDayCharges)}`;
        } else {
            if (summaryRowAddDays) summaryRowAddDays.style.display = 'none';
        }

        // Distance & Transport Fee Display
        const summaryLblDistance = document.getElementById('summary-lbl-distance');
        if (summaryLblDistance) summaryLblDistance.textContent = `${calculatedDistanceKm} km`;
        if (summaryValTransport) summaryValTransport.textContent = formatMoney(transportFee);

        if (summaryValTotal) summaryValTotal.textContent = formatMoney(totalCost);

        if (selectedPaymentPlan === 'downpayment') {
            if (summaryValPlan) summaryValPlan.textContent = '50% Down Payment';
            if (summaryValDueNow) summaryValDueNow.textContent = formatMoney(downpaymentVal);
            if (summaryValRemaining) summaryValRemaining.textContent = formatMoney(totalCost - downpaymentVal);
        } else {
            if (summaryValPlan) summaryValPlan.textContent = '100% Full Payment';
            if (summaryValDueNow) summaryValDueNow.textContent = formatMoney(fullVal);
            if (summaryValRemaining) summaryValRemaining.textContent = '₱0.00 (Fully Paid)';
        }

        // Update Selected Date & Time displays in Summary
        const summaryScheduleDate = document.getElementById('summary-schedule-date');
        const summaryScheduleTime = document.getElementById('summary-schedule-time');
        const summaryTableDate = document.getElementById('summary-table-date');
        const summaryTableTime = document.getElementById('summary-table-time');

        const curStartDate = (startDateInput && startDateInput.value) ? startDateInput.value : (prefilledDate || tomorrowStr);
        const curEndDate = (endDateInput && endDateInput.value) ? endDateInput.value : curStartDate;
        const curStartTime = (startTimeInput && startTimeInput.value) ? startTimeInput.value : (prefilledStartTime || '08:00');
        const curEndTime = (endTimeInput && endTimeInput.value) ? endTimeInput.value : (prefilledEndTime || '13:00');

        const formatPretty = (dStr) => {
            if (!dStr) return 'Not selected';
            try {
                const parts = dStr.split('-');
                if (parts.length === 3) {
                    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
                }
                return dStr;
            } catch (e) {
                return dStr;
            }
        };

        const format12h = (t24) => {
            if (!t24) return '';
            const parts = t24.split(':');
            const h = parseInt(parts[0], 10);
            const m = parts[1] || '00';
            const period = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${m} ${period}`;
        };

        const formattedDateText = (curStartDate === curEndDate || !curEndDate) ? formatPretty(curStartDate) : `${formatPretty(curStartDate)} – ${formatPretty(curEndDate)}`;
        const formattedStartTimeOnly = curStartTime ? format12h(curStartTime) : '08:00 AM';
        const durationDaySuffix = (calculatedDays && calculatedDays > 1) ? ` (${calculatedDays} Days)` : ` (1 Day)`;

        if (summaryScheduleDate) summaryScheduleDate.textContent = formattedDateText;
        if (summaryScheduleTime) summaryScheduleTime.innerHTML = `<i class="fa-regular fa-clock" style="font-size:0.75rem;"></i> Starts at ${formattedStartTimeOnly}${durationDaySuffix}`;
        if (summaryTableDate) summaryTableDate.textContent = formattedDateText;
        if (summaryTableTime) summaryTableTime.textContent = formattedStartTimeOnly;
    };
    updatePriceBreakdown();

    if (planDownpaymentCard && planFullCard) {
        planDownpaymentCard.addEventListener('click', () => {
            selectedPaymentPlan = 'downpayment';
            planDownpaymentCard.classList.add('selected');
            planFullCard.classList.remove('selected');
            const downIcon = planDownpaymentCard.querySelector('i');
            if (downIcon) {
                downIcon.className = 'fa-solid fa-circle-dot';
                downIcon.style.color = '#2563eb';
            }
            const fullIcon = planFullCard.querySelector('i');
            if (fullIcon) {
                fullIcon.className = 'fa-regular fa-circle';
                fullIcon.style.color = '#94a3b8';
            }
            updatePriceBreakdown();
        });

        planFullCard.addEventListener('click', () => {
            selectedPaymentPlan = 'full';
            planFullCard.classList.add('selected');
            planDownpaymentCard.classList.remove('selected');
            const downIcon = planDownpaymentCard.querySelector('i');
            if (downIcon) {
                downIcon.className = 'fa-regular fa-circle';
                downIcon.style.color = '#94a3b8';
            }
            const fullIcon = planFullCard.querySelector('i');
            if (fullIcon) {
                fullIcon.className = 'fa-solid fa-circle-dot';
                fullIcon.style.color = '#2563eb';
            }
            updatePriceBreakdown();
        });
    }

    // PayMongo Payment Method Selection Handling (Official Gateway)
    let selectedPayMongoMethod = 'PayMongo';
    const paymongoMethodCards = Array.from(document.querySelectorAll('.paymongo-method-card'));
    paymongoMethodCards.forEach(card => {
        card.addEventListener('click', () => {
            paymongoMethodCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            const m = card.getAttribute('data-method');
            if (m === 'card') {
                selectedPayMongoMethod = 'PayMongo - Card';
            } else if (m === 'gcash') {
                selectedPayMongoMethod = 'PayMongo - GCash';
            } else if (m === 'maya') {
                selectedPayMongoMethod = 'PayMongo - Maya';
            } else if (m === 'qrph') {
                selectedPayMongoMethod = 'PayMongo - QR PH';
            } else {
                selectedPayMongoMethod = 'PayMongo';
            }
        });
    });

    // 6. Service Hire Duration (Calendar Days Calculation) & Flexible Time Display
    const calculateDuration = () => {
        const startVal = startDateInput ? startDateInput.value : '';
        const endVal = endDateInput ? endDateInput.value : '';
        const startTimeVal = startTimeInput ? startTimeInput.value : '';
        const endTimeVal = endTimeInput ? endTimeInput.value : '';

        if (!startVal || !endVal) return;

        const startDt = new Date(startVal);
        let endDt = new Date(endVal);

        // Validation: End Date cannot be earlier than Start Date
        if (endDt < startDt) {
            endDt = new Date(startDt);
            if (endDateInput) endDateInput.value = startVal;
        }

        // Calculate calendar days (inclusive: DATEDIFF + 1)
        const diffMs = Math.abs(endDt - startDt);
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

        calculatedDays = diffDays;
        calculatedHours = 0; // Hours are flexible and not fixed

        // Format flexible time string (e.g. 06:00 PM – 10:00 PM)
        const formatTimeStr = (time24) => {
            if (!time24) return '';
            const parts = time24.split(':');
            const h = parseInt(parts[0], 10);
            const m = parts[1] || '00';
            const period = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            return `${String(h12).padStart(2, '0')}:${m} ${period}`;
        };

        const formattedStartTime = formatTimeStr(startTimeVal);
        const formattedEndTime = formatTimeStr(endTimeVal);
        const timeRangeText = (formattedStartTime && formattedEndTime) ? `${formattedStartTime} – ${formattedEndTime}` : 'Flexible Hours';

        if (calcDaysDisplay) calcDaysDisplay.textContent = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
        if (calcHoursDisplay) calcHoursDisplay.textContent = timeRangeText;

        updatePriceBreakdown();
        checkScheduleAvailability();
    };

    if (startDateInput) startDateInput.addEventListener('change', calculateDuration);
    if (endDateInput) endDateInput.addEventListener('change', calculateDuration);
    if (startTimeInput) startTimeInput.addEventListener('change', calculateDuration);
    if (endTimeInput) endTimeInput.addEventListener('change', calculateDuration);

    // Event Type Other Toggle
    if (eventTypeSelect && customEventTypeGroup) {
        eventTypeSelect.addEventListener('change', () => {
            if (eventTypeSelect.value === 'Other') {
                customEventTypeGroup.classList.remove('hidden');
                if (customEventTypeInput) customEventTypeInput.required = true;
            } else {
                customEventTypeGroup.classList.add('hidden');
                if (customEventTypeInput) customEventTypeInput.required = false;
            }
        });
    }

    // Place Select Sync with Address Input
    if (placeSelect) {
        placeSelect.addEventListener('change', () => {
            const selectedPlace = placeSelect.value;
            const isOthers = (selectedPlace === 'Others' || selectedPlace === 'Other');

            if (isOthers) {
                if (completeAddressInput) {
                    const currentAddr = completeAddressInput.value.trim();
                    if (!currentAddr || currentAddr.includes('Brgy. Central') || currentAddr.includes('Lian') || currentAddr.includes('Balayan') || currentAddr.includes('Nasugbu')) {
                        completeAddressInput.value = '';
                        completeAddressInput.placeholder = 'e.g. Brgy. 2, Calatagan, Batangas';
                    }
                    completeAddressInput.focus();
                }
            } else if (completeAddressInput) {
                const currentAddr = completeAddressInput.value.trim();
                if (!currentAddr || currentAddr.includes('Brgy. Central') || currentAddr.includes('Lian') || currentAddr.includes('Balayan') || currentAddr.includes('Nasugbu')) {
                    completeAddressInput.value = `Brgy. Central, ${selectedPlace}, Batangas`;
                }
            }
            updatePriceBreakdown();
        });
    }

    // 7. Real-Time Backend Schedule Availability Checking (Prevents Double Booking)
    const checkScheduleAvailability = async () => {
        const provId = (packageData && packageData.ProviderID) ? packageData.ProviderID : targetProviderId;
        const startVal = startDateInput ? startDateInput.value : '';
        const endVal = endDateInput ? endDateInput.value : '';
        const startTimeVal = startTimeInput ? startTimeInput.value : '';
        const endTimeVal = endTimeInput ? endTimeInput.value : '';

        if (!provId || !startVal || !endVal) return;

        try {
            const res = await fetch('/api/bookings/check-availability', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    providerId: provId,
                    serviceStartDate: startVal,
                    serviceEndDate: endVal,
                    eventDate: startVal,
                    startTime: startTimeVal,
                    endTime: endTimeVal
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    if (data.isAvailable) {
                        isScheduleAvailable = true;
                        if (conflictBanner) conflictBanner.style.display = 'none';
                        if (btnSubmit) btnSubmit.disabled = false;
                    } else {
                        isScheduleAvailable = false;
                        if (conflictBanner) {
                            conflictBanner.style.display = 'flex';
                            if (conflictText) conflictText.textContent = data.message || 'This provider is not available for the selected dates. Please choose another schedule.';
                        }
                        // Keep button clickable so user receives immediate guided feedback
                        if (btnSubmit) btnSubmit.disabled = false;
                    }
                }
            }
        } catch (err) {
            console.warn('Availability check notice:', err);
        }
    };

    // 8. Location Selector Integration (100% Free OpenStreetMap via Leaflet.js + Google Maps Fallback)
    const initGoogleMap = async () => {
        const pinLockBadge = document.getElementById('pin-lock-status-badge');
        if (pinLockBadge && isPinLocked) pinLockBadge.style.display = 'inline-flex';
        const mapContainer = document.getElementById('booking-google-map');
        if (!mapContainer) return;

        const mapSearchSuggestions = document.getElementById('map-search-suggestions');
        const addressSuggestionsList = document.getElementById('address-suggestions-list');
        const placeSelect = document.getElementById('booking-place-select');

        const updateCoords = (lat, lng) => {
            currentLat = Math.round(lat * 1000000) / 1000000;
            currentLng = Math.round(lng * 1000000) / 1000000;
            if (displayLatSpan) displayLatSpan.textContent = currentLat;
            if (displayLngSpan) displayLngSpan.textContent = currentLng;
            updatePriceBreakdown();
        };

        // Real-time Address Autocomplete Helper with Automatic Location Pinning
        const bindAddressAutocomplete = (inputEl, suggestionsEl, onSelectPlace) => {
            if (!inputEl || !suggestionsEl) return;
            let timer = null;

            const hide = () => {
                suggestionsEl.classList.add('hidden');
                suggestionsEl.innerHTML = '';
            };

            const renderSuggestions = (items) => {
                if (!items || items.length === 0) {
                    hide();
                    return;
                }

                suggestionsEl.innerHTML = '';
                items.slice(0, 6).forEach((item) => {
                    const li = document.createElement('li');
                    li.className = 'address-suggestion-item';
                    const title = item.name || item.display_name;
                    const subtitle = item.place ? `${item.place}, Batangas, Philippines` : (item.display_name || '');

                    li.innerHTML = `
                        <i class="fa-solid fa-location-dot" style="color:#2563eb; font-size:1.1rem; margin-top:2px;"></i>
                        <div style="flex:1; overflow:hidden;">
                            <strong style="color:#0f172a; display:block; font-size:0.96rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</strong>
                            <span style="color:#64748b; font-size:0.82rem; display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${subtitle}</span>
                        </div>
                    `;

                    li.addEventListener('click', () => {
                        const fullAddr = item.display_name || `${title}, ${item.place || (placeSelect ? placeSelect.value : 'Batangas')}, Batangas`;
                        inputEl.value = fullAddr;
                        hide();
                        if (typeof onSelectPlace === 'function') {
                            onSelectPlace(parseFloat(item.lat), parseFloat(item.lng || item.lon), fullAddr);
                        }
                    });

                    suggestionsEl.appendChild(li);
                });

                suggestionsEl.classList.remove('hidden');
            };

            // INSTANT SUGGESTIONS & AUTO-PIN WHILE TYPING
            inputEl.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                clearTimeout(timer);

                if (query.length < 2) {
                    hide();
                    return;
                }

                const currPlace = placeSelect ? placeSelect.value : '';

                // 1. Instant 0ms Local Matching
                const localMatches = matchLocalBatangasPlaces(query, currPlace);
                if (localMatches.length > 0) {
                    renderSuggestions(localMatches);

                    // AUTOMATICALLY PIN IMMEDIATELY TO TOP MATCH WHILE TYPING!
                    if (!isPinLocked && typeof onSelectPlace === 'function') {
                        const top = localMatches[0];
                        onSelectPlace(parseFloat(top.lat), parseFloat(top.lng), null, false);
                    }
                    return;
                }

                // 2. Debounced Remote Fallback for places outside local dataset
                timer = setTimeout(async () => {
                    try {
                        const results = await searchLocation(query);
                        if (results && results.length > 0) {
                            renderSuggestions(results);
                            if (!isPinLocked && typeof onSelectPlace === 'function') {
                                onSelectPlace(parseFloat(results[0].lat), parseFloat(results[0].lon), null, false);
                            }
                        } else {
                            hide();
                        }
                    } catch (err) {
                        hide();
                    }
                }, 250);
            });

            inputEl.addEventListener('focus', () => {
                const query = inputEl.value.trim();
                if (query.length >= 2) {
                    const currPlace = placeSelect ? placeSelect.value : '';
                    const localMatches = matchLocalBatangasPlaces(query, currPlace);
                    if (localMatches.length > 0) renderSuggestions(localMatches);
                }
            });

            inputEl.addEventListener('keydown', async (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = inputEl.value.trim();
                    if (!query) return;

                    hide();
                    const currPlace = placeSelect ? placeSelect.value : '';
                    const localMatches = matchLocalBatangasPlaces(query, currPlace);
                    if (localMatches.length > 0) {
                        const top = localMatches[0];
                        const fullAddr = `${top.name}, ${top.place}, Batangas`;
                        inputEl.value = fullAddr;
                        if (typeof onSelectPlace === 'function') {
                            onSelectPlace(parseFloat(top.lat), parseFloat(top.lng), fullAddr);
                        }
                    } else {
                        const results = await searchLocation(query);
                        if (results && results.length > 0) {
                            const item = results[0];
                            inputEl.value = item.display_name;
                            if (typeof onSelectPlace === 'function') {
                                onSelectPlace(parseFloat(item.lat), parseFloat(item.lon), item.display_name);
                            }
                        }
                    }
                }
            });

            document.addEventListener('click', (e) => {
                if (!inputEl.contains(e.target) && !suggestionsEl.contains(e.target)) {
                    hide();
                }
            });
        };

        try {
            const configRes = await fetch('/api/config/maps-key');
            let apiKey = '';
            if (configRes.ok) {
                const cfg = await configRes.json();
                apiKey = (cfg.mapsApiKey && cfg.mapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') ? cfg.mapsApiKey : '';
            }

            // A) If Google Maps API key IS configured, use official Google Maps API
            if (apiKey) {
                if (!window.google || !window.google.maps) {
                    const script = document.createElement('script');
                    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                    script.async = true;
                    script.defer = true;
                    document.head.appendChild(script);
                    await new Promise(resolve => script.onload = resolve);
                }

                const map = new google.maps.Map(mapContainer, {
                    center: { lat: currentLat, lng: currentLng },
                    zoom: 13,
                    mapTypeControl: false
                });

                const marker = new google.maps.Marker({
                    position: { lat: currentLat, lng: currentLng },
                    map: map,
                    draggable: false,
                    title: 'Event Location'
                });

                const geocoder = new google.maps.Geocoder();

                const selectPlaceOnMap = (lat, lng, displayName) => {
                    const loc = { lat, lng };
                    map.setCenter(loc);
                    marker.setPosition(loc);
                    updateCoords(lat, lng);
                    if (completeAddressInput) completeAddressInput.value = displayName;
                };

                bindAddressAutocomplete(mapSearchInput, mapSearchSuggestions, selectPlaceOnMap);
                bindAddressAutocomplete(completeAddressInput, addressSuggestionsList, selectPlaceOnMap);
                const venueSuggestionsList = document.getElementById('venue-suggestions-list');
                if (venueNameInput && venueSuggestionsList) {
                    bindAddressAutocomplete(venueNameInput, venueSuggestionsList, selectPlaceOnMap);
                }

                marker.addListener('dragend', (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    updateCoords(lat, lng);

                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        if (status === 'OK' && results[0] && completeAddressInput) {
                            completeAddressInput.value = results[0].formatted_address;
                        }
                    });
                });

                map.addListener('click', (e) => {
                    const lat = e.latLng.lat();
                    const lng = e.latLng.lng();
                    marker.setPosition({ lat, lng });
                    updateCoords(lat, lng);

                    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                        if (status === 'OK' && results[0] && completeAddressInput) {
                            completeAddressInput.value = results[0].formatted_address;
                        }
                    });
                });

                if (btnSearchMap && mapSearchInput) {
                    btnSearchMap.addEventListener('click', () => {
                        const q = mapSearchInput.value.trim();
                        if (!q) return;

                        geocoder.geocode({ address: `${q}, Batangas, Philippines` }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                const loc = results[0].geometry.location;
                                map.setCenter(loc);
                                marker.setPosition(loc);
                                updateCoords(loc.lat(), loc.lng());
                                if (completeAddressInput) completeAddressInput.value = results[0].formatted_address;
                            } else {
                                if (typeof window.showToast === 'function') window.showToast('Location not found. Please try another query.', 'warning');
                            }
                        });
                    });
                }
                return;
            }

            // B) 100% FREE Interactive OpenStreetMap via Leaflet.js (0 API Key Required!)
            if (typeof L !== 'undefined') {
                mapContainer.innerHTML = '';
                
                const leafletMap = L.map(mapContainer, {
                    center: [currentLat, currentLng],
                    zoom: 13,
                    zoomControl: true
                });
                window._soundsphereLeafletMap = leafletMap;

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '&copy; OpenStreetMap'
                }).addTo(leafletMap);

                const leafletMarker = L.marker([currentLat, currentLng], {
                    draggable: true
                }).addTo(leafletMap);
                window._soundsphereLeafletMarker = leafletMarker;

                const selectPlaceOnMap = (lat, lng, displayName = null, force = false) => {
                    if (isPinLocked && !force) {
                        if (typeof window.showToast === 'function') {
                            window.showToast('🔒 Location pin is locked. Click "Pin Locked" below to unlock.', 'info');
                        }
                        return;
                    }
                    leafletMap.setView([lat, lng], 16);
                    leafletMarker.setLatLng([lat, lng]);
                    updateCoords(lat, lng);
                    if (displayName && completeAddressInput && completeAddressInput.value !== displayName) {
                        completeAddressInput.value = displayName;
                    }
                };

                window._soundsphereSelectPlaceOnMap = selectPlaceOnMap;
                bindAddressAutocomplete(mapSearchInput, mapSearchSuggestions, selectPlaceOnMap);
                bindAddressAutocomplete(completeAddressInput, addressSuggestionsList, selectPlaceOnMap);
                const venueSuggestionsList = document.getElementById('venue-suggestions-list');
                if (venueNameInput && venueSuggestionsList) {
                    bindAddressAutocomplete(venueNameInput, venueSuggestionsList, selectPlaceOnMap);
                }

                // Reverse Geocoding with Nominatim API (Free)
                const reverseGeocode = async (lat, lng) => {
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.display_name && completeAddressInput) {
                                completeAddressInput.value = data.display_name;
                            }
                        }
                    } catch (e) {
                        console.warn('Reverse geocode notice:', e);
                    }
                };

                leafletMarker.on('dragend', (e) => {
                    if (isPinLocked) return;
                    const pos = e.target.getLatLng();
                    updateCoords(pos.lat, pos.lng);
                    reverseGeocode(pos.lat, pos.lng);
                });

                leafletMap.on('click', (e) => {
                    if (isPinLocked) {
                        if (typeof window.showToast === 'function') {
                            window.showToast('🔒 Location pin is locked. Click "Pin Locked" below to unlock if you want to move it.', 'info');
                        }
                        return;
                    }
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    leafletMarker.setLatLng([lat, lng]);
                    updateCoords(lat, lng);
                    reverseGeocode(lat, lng);
                });

                if (btnSearchMap && mapSearchInput) {
                    btnSearchMap.addEventListener('click', async () => {
                        if (isPinLocked) {
                            if (typeof window.showToast === 'function') window.showToast('🔒 Location pin is locked. Please unlock it below first.', 'warning');
                            return;
                        }
                        const q = mapSearchInput.value.trim();
                        if (!q) return;

                        btnSearchMap.disabled = true;
                        btnSearchMap.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Searching...`;

                        try {
                            const hasPh = /philippines/i.test(q);
                            const qSearch = hasPh ? q : `${q}, Philippines`;
                            const searchUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(qSearch)}`;
                            const res = await fetch(searchUrl);
                            if (res.ok) {
                                const results = await res.json();
                                if (results && results.length > 0) {
                                    const lat = parseFloat(results[0].lat);
                                    const lon = parseFloat(results[0].lon);
                                    selectPlaceOnMap(lat, lon, results[0].display_name);
                                } else {
                                    if (typeof window.showToast === 'function') window.showToast('Location not found. Try another query.', 'warning');
                                }
                            }
                        } catch (e) {
                            console.warn('Nominatim search notice:', e);
                        } finally {
                            btnSearchMap.disabled = false;
                        }
                    });
                }

                // Auto-pin location when municipality dropdown changes or when venue/address fields are entered
                if (placeSelect) {
                    placeSelect.addEventListener('change', () => {
                        if (isPinLocked) return;
                        const selectedPlace = placeSelect.value;
                        if (selectedPlace === 'Others' || selectedPlace === 'Other') {
                            const addr = completeAddressInput ? completeAddressInput.value.trim() : '';
                            if (addr) {
                                searchLocation(addr).then(res => {
                                    if (res && res.length > 0) selectPlaceOnMap(parseFloat(res[0].lat), parseFloat(res[0].lon || res[0].lng));
                                });
                            }
                            return;
                        }
                        const mCoords = MUNICIPALITY_COORDS[selectedPlace] || MUNICIPALITY_COORDS['Nasugbu'];
                        selectPlaceOnMap(mCoords.lat, mCoords.lng);

                        fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(selectedPlace + ', Batangas, Philippines')}&countrycodes=ph&limit=1`)
                            .then(r => r.json())
                            .then(res => {
                                if (res && res.length > 0) {
                                    selectPlaceOnMap(parseFloat(res[0].lat), parseFloat(res[0].lon));
                                }
                            })
                            .catch(() => {});
                    });
                }

                // Automatic address & venue pin lookup when user types address or venue name
                let autoPinTimer = null;
                const autoPinFromInputs = async () => {
                    if (isPinLocked) return;
                    const venue = venueNameInput ? venueNameInput.value.trim() : '';
                    const addr = completeAddressInput ? completeAddressInput.value.trim() : '';
                    const place = placeSelect ? placeSelect.value : 'Nasugbu';
                    const isOthers = (place === 'Others' || place === 'Other');

                    if (!venue && !addr) {
                        if (!isOthers) {
                            const mCoords = MUNICIPALITY_COORDS[place] || MUNICIPALITY_COORDS['Nasugbu'] || { lat: 14.0714, lng: 120.6347 };
                            selectPlaceOnMap(mCoords.lat, mCoords.lng);
                        }
                        return;
                    }

                    const cleanAddr = typeof normalizePhAddress === 'function' ? normalizePhAddress(addr, isOthers ? '' : place) : addr;
                    const cleanVenue = typeof normalizePhAddress === 'function' ? normalizePhAddress(venue, isOthers ? '' : place) : venue;

                    // 1. Instant 0ms local match with Batangas places dataset (if not Others)
                    if (typeof matchLocalBatangasPlaces === 'function' && !isOthers) {
                        const localMatches = matchLocalBatangasPlaces(`${cleanVenue} ${cleanAddr}`, place);
                        if (localMatches && localMatches.length > 0) {
                            const top = localMatches[0];
                            selectPlaceOnMap(parseFloat(top.lat), parseFloat(top.lng || top.lon));
                            return;
                        }
                    }

                    // 2. Direct search for complete address and venue
                    const searchQueries = [
                        cleanAddr ? (!isOthers && !cleanAddr.toLowerCase().includes(place.toLowerCase()) ? `${cleanAddr}, ${place}` : cleanAddr) : null,
                        cleanVenue ? (!isOthers && !cleanVenue.toLowerCase().includes(place.toLowerCase()) ? `${cleanVenue}, ${place}` : cleanVenue) : null,
                        cleanAddr,
                        cleanVenue
                    ].filter(Boolean);

                    for (const q of searchQueries) {
                        try {
                            const results = await searchLocation(q);
                            if (results && results.length > 0) {
                                selectPlaceOnMap(parseFloat(results[0].lat), parseFloat(results[0].lon || results[0].lng));
                                return;
                            }
                        } catch (err) {}
                    }

                    // Fallback to municipality coords if known
                    if (!isOthers) {
                        const mCoords = MUNICIPALITY_COORDS[place] || MUNICIPALITY_COORDS['Nasugbu'] || { lat: 14.0714, lng: 120.6347 };
                        selectPlaceOnMap(mCoords.lat, mCoords.lng);
                    }
                };

                const debouncedAutoPin = () => {
                    clearTimeout(autoPinTimer);
                    autoPinTimer = setTimeout(autoPinFromInputs, 700);
                };

                if (venueNameInput) {
                    venueNameInput.addEventListener('blur', autoPinFromInputs);
                    venueNameInput.addEventListener('change', autoPinFromInputs);
                    venueNameInput.addEventListener('input', debouncedAutoPin);
                }
                if (completeAddressInput) {
                    completeAddressInput.addEventListener('blur', autoPinFromInputs);
                    completeAddressInput.addEventListener('change', autoPinFromInputs);
                    completeAddressInput.addEventListener('input', debouncedAutoPin);
                }

                // Initial pin setup on land
                const initPlace = placeSelect ? placeSelect.value : 'Nasugbu';
                const initCoords = MUNICIPALITY_COORDS[initPlace] || MUNICIPALITY_COORDS['Nasugbu'];
                selectPlaceOnMap(initCoords.lat, initCoords.lng);
            }

        } catch (err) {
            console.warn('Map initialization notice:', err);
        }
    };

    // 9. Booking Submission Handler
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!isScheduleAvailable) {
                if (conflictBanner) conflictBanner.style.display = 'flex';
                const msg = (conflictText && conflictText.textContent) ? conflictText.textContent : 'This provider is not available for the selected date and time. Please choose another schedule.';
                if (typeof window.showToast === 'function') {
                    window.showToast(`⚠️ ${msg}`, 'warning');
                }
                if (startDateInput) {
                    startDateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    startDateInput.focus();
                }
                return;
            }

            if (!termsCheckbox.checked) {
                if (typeof window.showToast === 'function') {
                    window.showToast('⚠️ Please agree to the Terms and Conditions to proceed.', 'warning');
                }
                return;
            }

            const clientFirstName = clientFirstNameInput ? clientFirstNameInput.value.trim() : '';
            const clientMI = clientMIInput ? clientMIInput.value.trim() : '';
            const clientLastName = clientLastNameInput ? clientLastNameInput.value.trim() : '';
            const clientFullname = [clientFirstName, clientMI ? (clientMI.endsWith('.') ? clientMI : `${clientMI}.`) : '', clientLastName].filter(Boolean).join(' ');
            const clientPhone = clientPhoneInput ? clientPhoneInput.value.trim() : '';
            const clientEmail = clientEmailInput ? clientEmailInput.value.trim() : '';
            const clientAltPhone = clientAltPhoneInput ? clientAltPhoneInput.value.trim() : '';

            const eventName = (eventNameInput && eventNameInput.value && eventNameInput.value.trim()) ? eventNameInput.value.trim() : (packageData ? `${packageData.PackageName} Booking` : 'SoundSphere Event Booking');
            const eventType = (eventTypeSelect && eventTypeSelect.value) ? eventTypeSelect.value : 'Event';
            const customEventType = (customEventTypeInput && customEventTypeInput.value.trim()) ? customEventTypeInput.value.trim() : '';
            const serviceStartDate = (startDateInput && startDateInput.value) ? startDateInput.value : (initialStartDate || todayStr);
            const serviceEndDate = (endDateInput && endDateInput.value) ? endDateInput.value : serviceStartDate;
            const serviceHireDays = calculatedDays || 1;
            const startTime = (startTimeInput && startTimeInput.value) ? startTimeInput.value : '08:00';
            const endTime = (endTimeInput && endTimeInput.value) ? endTimeInput.value : '13:00';
            const eventPlace = (placeSelect && placeSelect.value) ? placeSelect.value : 'Nasugbu';
            const venueName = (venueNameInput && venueNameInput.value.trim()) ? venueNameInput.value.trim() : '';
            const eventAddress = (completeAddressInput && completeAddressInput.value.trim()) ? completeAddressInput.value.trim() : '';
            const locationNotes = locationNotesInput ? locationNotesInput.value.trim() : '';

            if (!clientFirstName || !clientLastName || !clientPhone || !clientEmail || !venueName || !eventAddress) {
                if (typeof window.showToast === 'function') {
                    window.showToast('⚠️ Please complete all required client information, municipality, venue name, and event address fields.', 'warning');
                }
                return;
            }

            // Auto-lock location pin upon confirming booking
            lockLocationPin();

            btnSubmit.disabled = true;
            btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Directing to PayMongo...`;

            const amountToPayNow = selectedPaymentPlan === 'downpayment' ? Math.round(totalCost * 0.5) : totalCost;

            try {
                // 1. Initialize PayMongo Checkout Session
                const sessionRes = await fetch('/api/payments/paymongo/checkout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount: amountToPayNow,
                        packageName: packageData ? packageData.PackageName : 'Audio & Light Package',
                        paymentType: selectedPaymentPlan,
                        paymentMethod: selectedPayMongoMethod,
                        clientEmail,
                        clientName: clientFullname,
                        clientPhone
                    })
                });

                const sessionData = await sessionRes.json();

                // Handle 401 Unauthorized (Session Expired)
                if (sessionRes.status === 401 || (sessionData && sessionData.message && sessionData.message.includes('Session expired'))) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('⚠️ Session expired. Please log in again to complete your booking.', 'warning');
                    }
                    if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.clearAuthSession) {
                        SoundSphereAPI.clearAuthSession();
                    } else {
                        localStorage.clear();
                        sessionStorage.clear();
                    }
                    setTimeout(() => {
                        window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
                    }, 1200);
                    return;
                }

                // 2. Prepare and save booking record in SQL Database
                const bookingPayload = {
                    bookingReference: sessionData.bookingReference || null,
                    clientName: clientFullname,
                    clientPhone,
                    clientEmail,
                    clientAltPhone,
                    packageId: packageData ? packageData.PackageID : targetPackageId,
                    providerId: packageData ? packageData.ProviderID : targetProviderId,
                    packageName: packageData ? packageData.PackageName : 'Audio & Light Package',
                    eventName,
                    eventType,
                    customEventType,
                    serviceStartDate,
                    serviceEndDate,
                    serviceHireDays,
                    eventDate: serviceStartDate,
                    numberOfDays: serviceHireDays,
                    startTime,
                    endTime,
                    numberOfHours: 0,
                    eventPlace,
                    venueName,
                    eventAddress,
                    eventLatitude: currentLat,
                    eventLongitude: currentLng,
                    locationNotes,
                    packagePrice: basePackagePrice,
                    additionalDayCharges: additionalDayCharges,
                    transportationFee: transportFee,
                    distanceKm: calculatedDistanceKm,
                    totalAmount: totalCost,
                    paymentType: selectedPaymentPlan,
                    paymentMethod: selectedPayMongoMethod,
                    transactionReference: sessionData.sessionId || `TXN-PM-${Date.now()}`
                };

                const bkRes = await fetch('/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(bookingPayload)
                });

                const bkData = await bkRes.json();

                if (bkRes.status === 401 || (bkData && bkData.message && bkData.message.includes('Session expired'))) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('⚠️ Session expired. Please log in again.', 'warning');
                    }
                    setTimeout(() => {
                        window.location.href = `/login.html?returnUrl=${encodeURIComponent(window.location.href)}`;
                    }, 1200);
                    return;
                }

                if (!bkRes.ok || !bkData.success) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<span>Confirm Booking</span> <i class="fa-solid fa-arrow-right"></i>`;
                    const errMsg = (bkData && (bkData.message || bkData.error)) || 'Failed to submit booking reservation. Please check schedule availability and try again.';
                    if (typeof window.showToast === 'function') {
                        window.showToast(`⚠️ ${errMsg}`, 'error');
                    } else {
                        alert(errMsg);
                    }
                    return;
                }

                if (bkData && bkData.success && bkData.booking) {
                    try {
                        sessionStorage.setItem('soundsphere_last_booking', JSON.stringify(bkData.booking));
                    } catch (e) {}
                }

                // 3. Direct Live Redirect to PayMongo Official Hosted Checkout Page
                if (sessionData && sessionData.checkoutUrl && sessionData.checkoutUrl.startsWith('http')) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('🚀 Redirecting to PayMongo Secure Checkout...', 'info');
                    }
                    setTimeout(() => {
                        window.location.href = sessionData.checkoutUrl;
                    }, 400);
                    return;
                }

                // If sandbox / fallback mode, launch the Interactive PayMongo Gateway Modal Overlay
                const pmOverlay = document.getElementById('paymongo-modal-overlay');
                const pmModalAmount = document.getElementById('paymongo-modal-amount');
                const pmModalMethodName = document.getElementById('paymongo-modal-method-name');
                const pmCloseBtn = document.getElementById('paymongo-modal-close');
                const pmCancelBtn = document.getElementById('btn-paymongo-cancel');
                const pmConfirmBtn = document.getElementById('btn-paymongo-confirm');

                const pmViews = {
                    'card': document.getElementById('paymongo-view-card'),
                    'gcash': document.getElementById('paymongo-view-gcash'),
                    'maya': document.getElementById('paymongo-view-maya'),
                    'qrph': document.getElementById('paymongo-view-qrph')
                };

                if (pmModalAmount) pmModalAmount.textContent = `₱${(parseFloat(amountToPayNow) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                if (pmModalMethodName) pmModalMethodName.textContent = selectedPayMongoMethod;

                // Hide all views and show active method view
                Object.keys(pmViews).forEach(k => {
                    if (pmViews[k]) pmViews[k].classList.add('hidden');
                });

                let activeKey = 'card';
                if (selectedPayMongoMethod.includes('GCash')) activeKey = 'gcash';
                else if (selectedPayMongoMethod.includes('Maya')) activeKey = 'maya';
                else if (selectedPayMongoMethod.includes('QR PH')) activeKey = 'qrph';

                if (pmViews[activeKey]) pmViews[activeKey].classList.remove('hidden');

                // Pre-fill real user details into payment fields if available
                const cardNameInput = document.getElementById('pm-card-name');
                if (cardNameInput && clientFullname) {
                    cardNameInput.value = clientFullname.toUpperCase();
                }
                const gcashPhoneInput = document.getElementById('pm-gcash-phone');
                if (gcashPhoneInput && clientPhone) {
                    gcashPhoneInput.value = clientPhone;
                }
                const mayaPhoneInput = document.getElementById('pm-maya-phone');
                if (mayaPhoneInput && clientPhone) {
                    mayaPhoneInput.value = clientPhone;
                }

                if (pmOverlay) pmOverlay.classList.remove('hidden');

                const closePmModal = () => {
                    if (pmOverlay) pmOverlay.classList.add('hidden');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<span>Confirm Booking</span> <i class="fa-solid fa-arrow-right"></i>`;
                };

                if (pmCloseBtn) pmCloseBtn.onclick = closePmModal;
                if (pmCancelBtn) pmCancelBtn.onclick = closePmModal;

                if (pmConfirmBtn) {
                    pmConfirmBtn.onclick = async () => {
                        pmConfirmBtn.disabled = true;
                        pmConfirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

                        // If booking was already registered in database during checkout setup, finalize immediately
                        if (bkData && bkData.success && bkData.booking) {
                            const bk = bkData.booking || {};
                            const refCode = bk.BookingReference || `SS-${new Date().getFullYear()}-00001`;

                            if (typeof window.showToast === 'function') {
                                window.showToast(`🎉 Payment Authorized & Booking Confirmed! (${refCode})`, 'success');
                            }

                            setTimeout(() => {
                                window.location.href = `/booking-confirmation.html?ref=${encodeURIComponent(refCode)}&id=${bk.BookingID || ''}`;
                            }, 800);
                            return;
                        }

                        // Fallback: If booking was not pre-created, execute booking creation now
                        try {
                            const res = await fetch('/api/bookings', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify(bookingPayload)
                            });

                            const data = await res.json();

                            if (res.ok && data.success) {
                                const bk = data.booking || {};
                                const refCode = bk.BookingReference || `SS-${new Date().getFullYear()}-00001`;

                                if (typeof window.showToast === 'function') {
                                    window.showToast(`🎉 Payment Authorized & Booking Confirmed! (${refCode})`, 'success');
                                }

                                setTimeout(() => {
                                    window.location.href = `/booking-confirmation.html?ref=${encodeURIComponent(refCode)}&id=${bk.BookingID || ''}`;
                                }, 800);
                            } else {
                                if (typeof window.showToast === 'function') {
                                    window.showToast(`⚠️ ${data.message || 'Failed to complete payment.'}`, 'warning');
                                }
                                pmConfirmBtn.disabled = false;
                                pmConfirmBtn.innerHTML = `<span>Authorize & Pay</span> <i class="fa-solid fa-lock"></i>`;
                            }
                        } catch (err) {
                            console.error('Booking submission error:', err);
                            if (typeof window.showToast === 'function') {
                                window.showToast('✕ An unexpected error occurred.', 'error');
                            }
                            pmConfirmBtn.disabled = false;
                            pmConfirmBtn.innerHTML = `<span>Authorize & Pay</span> <i class="fa-solid fa-lock"></i>`;
                        }
                    };
                }
            } catch (err) {
                console.error('PayMongo initialization error:', err);
                if (typeof window.showToast === 'function') {
                    window.showToast('✕ Failed to initialize PayMongo payment gateway.', 'error');
                }
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = `<span>Confirm Booking</span> <i class="fa-solid fa-arrow-right"></i>`;
            }
        });
    }

    // Initial Execution
    await loadPackageData();
    calculateDuration();
    initGoogleMap();
});
