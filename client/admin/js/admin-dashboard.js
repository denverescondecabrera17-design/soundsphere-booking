/**
 * SoundSphere - Administrator Dashboard Controller (Vanilla JS ES6)
 * Complete management for Service Provider applications, active providers, clients, bookings, revenue reports,
 * notifications, live multi-entity search, and audit activity logging.
 */

function getAdminToken() {
    if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken && SoundSphereAPI.getAuthToken()) {
        return SoundSphereAPI.getAuthToken();
    }
    return localStorage.getItem('soundsphere_jwt_token') ||
           localStorage.getItem('soundsphere_token') ||
           localStorage.getItem('soundsphere_auth_token') ||
           localStorage.getItem('token') ||
           sessionStorage.getItem('soundsphere_jwt_token') ||
           sessionStorage.getItem('soundsphere_token') ||
           sessionStorage.getItem('soundsphere_auth_token') ||
           sessionStorage.getItem('token') || '';
}

function getAdminHeaders() {
    const t = getAdminToken();
    const h = { 'Content-Type': 'application/json' };
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
}

function getAdminUser() {
    if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser && SoundSphereAPI.getAuthUser()) {
        return SoundSphereAPI.getAuthUser();
    }
    try {
        return JSON.parse(localStorage.getItem('soundsphere_user_info') || localStorage.getItem('soundsphere_user') || sessionStorage.getItem('soundsphere_user_info') || sessionStorage.getItem('soundsphere_user') || '{}');
    } catch (e) {
        return {};
    }
}

let _isRedirectingToLogin = false;
function handleAdminAuthError(res) {
    if (res && (res.status === 401 || res.status === 403)) {
        if (_isRedirectingToLogin) return true;
        _isRedirectingToLogin = true;
        console.warn(`[Admin Auth Error HTTP ${res.status}] Invalid/Expired session. Redirecting to login...`);
        if (typeof window.showToast === 'function') {
            window.showToast('Administrator session expired or unauthorized. Please sign in again.', 'warning', 4000);
        }
        setTimeout(() => {
            if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.clearAuthSession) {
                SoundSphereAPI.clearAuthSession();
            } else {
                localStorage.clear();
                sessionStorage.clear();
            }
            window.location.href = '/login.html';
        }, 1500);
        return true;
    }
    return false;
}

document.addEventListener('DOMContentLoaded', async () => {
    const user = getAdminUser();

    // Server-side Authentication & Authorization Check
    const roleStr = String(user.role || user.RoleName || user.roleName || user.Role || '').toLowerCase();
    const userEmail = String(user.email || user.Email || '').toLowerCase();
    if (user && Object.keys(user).length > 0 && userEmail !== 'soundsphere@gmail.com' && roleStr && roleStr !== 'administrator' && roleStr !== 'admin') {
        console.warn('Unauthorized access attempt to Administrator Control Panel.');
    }

    // Display Current Date in Banner
    const currentDateDisplay = document.getElementById('current-date-display');
    if (currentDateDisplay) {
        currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    // DOM Elements
    const tableBodyPending = document.getElementById('table-pending-applications');
    const tableBodyPendingFull = document.getElementById('table-pending-applications-full');

    const tableBodyActiveProviders = document.getElementById('table-active-providers');
    const tableBodyActiveProvidersFull = document.getElementById('table-active-providers-full');

    const tableBodyRegisteredClients = document.getElementById('table-registered-clients');
    const tableBodyRegisteredClientsFull = document.getElementById('table-registered-clients-full');

    const tableBodyTotalBookings = document.getElementById('table-total-bookings');
    const tableBodyTotalBookingsFull = document.getElementById('table-total-bookings-full');

    const tableRevenueTransactions = document.getElementById('table-revenue-transactions');
    const activityLogsList = document.getElementById('activity-logs-list');

    const statTotalClients = document.getElementById('stat-total-clients');
    const statActiveProviders = document.getElementById('stat-active-providers');
    const statPendingApps = document.getElementById('stat-pending-apps');
    const statTotalBookings = document.getElementById('stat-total-bookings');
    const statTotalRevenue = document.getElementById('stat-total-revenue');
    const badgePendingCount = document.getElementById('badge-pending-count');

    const revenueGrossVal = document.getElementById('revenue-gross-val');
    const revenueCompletedVal = document.getElementById('revenue-completed-val');
    const revenuePendingVal = document.getElementById('revenue-pending-val');

    const revenueGrossValFull = document.getElementById('revenue-gross-val-full');
    const revenueCompletedValFull = document.getElementById('revenue-completed-val-full');
    const revenuePendingValFull = document.getElementById('revenue-pending-val-full');

    const filterBookingStatus = document.getElementById('filter-booking-status');
    const filterBookingStatusFull = document.getElementById('filter-booking-status-full');
    const filterPendingStatus = document.getElementById('filter-pending-status');
    const filterProviderStatus = document.getElementById('filter-provider-status');

    const searchPendingApps = document.getElementById('search-pending-apps');
    const searchActiveProviders = document.getElementById('search-active-providers');
    const searchRegisteredClients = document.getElementById('search-registered-clients');
    const searchTotalBookings = document.getElementById('search-total-bookings');
    const adminSearchInput = document.getElementById('admin-search-input');

    let globalBookingsList = [];
    let globalApplicationsList = [];
    let globalActiveProvidersList = [];
    let globalRegisteredClientsList = [];
    let pendingAppIdToReject = null;

    // Toast Notification Helper
    const showToast = (message, type = 'success') => {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.cssText = 'position:fixed; bottom:24px; right:24px; z-index:999999; display:flex; flex-direction:column; gap:10px;';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        const bg = type === 'success' ? '#10b981' : (type === 'error' ? '#ef4444' : '#2563eb');
        toast.style.cssText = `background:${bg}; color:#fff; padding:12px 20px; border-radius:10px; font-weight:700; font-size:0.88rem; box-shadow:0 10px 25px rgba(0,0,0,0.2); transition:all 0.3s ease; opacity:0; transform:translateY(10px);`;
        toast.textContent = message;

        toastContainer.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateY(10px)'; setTimeout(() => toast.remove(), 300); }, 3500);
    };

    // Logout Action Handlers
    const handleLogout = async () => {
        if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.logoutAPI) {
            await SoundSphereAPI.logoutAPI();
        } else {
            localStorage.clear();
            sessionStorage.clear();
        }
        window.location.href = '/login.html';
    };

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) btnLogout.addEventListener('click', handleLogout);

    const btnAdminMenuLogout = document.getElementById('btn-admin-menu-logout');
    if (btnAdminMenuLogout) btnAdminMenuLogout.addEventListener('click', handleLogout);

    let currentAdminProfile = null;

    // Fetch Authenticated Admin Profile
    const fetchAdminProfile = async () => {
        try {
            const headers = getAdminHeaders();
            const res = await fetch('http://localhost:5000/api/admin/profile', { headers });
            if (handleAdminAuthError(res)) return;

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.profile) {
                    currentAdminProfile = data.profile;
                    
                    const userNameEl = document.querySelector('.user-profile .user-name');
                    const menuEmailEl = document.querySelector('#admin-dropdown-email');
                    const menuStatusEl = document.querySelector('#admin-dropdown-role');

                    if (userNameEl) userNameEl.textContent = data.profile.fullName || 'SoundSphere';
                    if (menuEmailEl) menuEmailEl.textContent = data.profile.email;
                    if (menuStatusEl) menuStatusEl.textContent = `Active ${data.profile.role === 'Administrator' ? 'Administrator' : data.profile.role}`;
                }
            }
        } catch (e) {
            console.warn('Fetch admin profile error:', e.message);
        }
    };

    // ------------------------------------------------------------------------
    // Admin SPA View Switcher Router
    // ------------------------------------------------------------------------
    const sidebarNavLinks = document.querySelectorAll('.sidebar-menu .menu-item');
    const viewPanels = document.querySelectorAll('.admin-view-panel');

    const switchAdminView = (targetHash) => {
        const cleanHash = targetHash ? targetHash.replace('#', '') : 'dashboard-overview';

        let targetViewId = 'view-dashboard-overview';
        if (cleanHash === 'applications-section' || cleanHash === 'pending-applications' || cleanHash === 'view-pending-applications') {
            targetViewId = 'view-pending-applications';
        } else if (cleanHash === 'providers-section' || cleanHash === 'active-providers' || cleanHash === 'view-active-providers') {
            targetViewId = 'view-active-providers';
        } else if (cleanHash === 'clients-section' || cleanHash === 'registered-clients' || cleanHash === 'view-registered-clients') {
            targetViewId = 'view-registered-clients';
        } else if (cleanHash === 'revenue-section' || cleanHash === 'revenue-reports' || cleanHash === 'view-revenue-reports') {
            targetViewId = 'view-revenue-reports';
        } else if (cleanHash === 'subscriptions-section' || cleanHash === 'provider-subscriptions' || cleanHash === 'view-admin-subscriptions') {
            targetViewId = 'view-admin-subscriptions';
        } else if (cleanHash === 'withdrawal-section' || cleanHash === 'withdrawals' || cleanHash === 'view-withdrawal') {
            targetViewId = 'view-withdrawal';
        } else if (cleanHash === 'reports-section' || cleanHash === 'client-reports' || cleanHash === 'view-client-reports') {
            targetViewId = 'view-client-reports';
        } else if (cleanHash === 'audit-section' || cleanHash === 'audit-trail' || cleanHash === 'view-audit-trail') {
            targetViewId = 'view-audit-trail';
        }

        // Update Sidebar Active Link State
        sidebarNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (
                (targetViewId === 'view-dashboard-overview' && href === '#dashboard-overview') ||
                (targetViewId === 'view-pending-applications' && (href === '#applications-section' || href === '#pending-applications')) ||
                (targetViewId === 'view-active-providers' && (href === '#providers-section' || href === '#active-providers')) ||
                (targetViewId === 'view-registered-clients' && (href === '#clients-section' || href === '#registered-clients')) ||
                (targetViewId === 'view-revenue-reports' && (href === '#revenue-section' || href === '#revenue-reports')) ||
                (targetViewId === 'view-admin-subscriptions' && (href === '#subscriptions-section' || href === '#provider-subscriptions')) ||
                (targetViewId === 'view-withdrawal' && (href === '#withdrawal-section' || href === '#withdrawals')) ||
                (targetViewId === 'view-client-reports' && (href === '#reports-section' || href === '#client-reports')) ||
                (targetViewId === 'view-audit-trail' && (href === '#audit-section' || href === '#audit-trail'))
            ) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Toggle Visibility of Dedicated View Panels
        viewPanels.forEach(panel => {
            if (panel.id === targetViewId) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Auto-load data for views when navigated to
        if (targetViewId === 'view-admin-subscriptions' && typeof loadAdminSubscriptionsPage === 'function') {
            setTimeout(() => loadAdminSubscriptionsPage(), 50);
        } else if (targetViewId === 'view-withdrawal' && typeof loadWithdrawalsPage === 'function') {
            setTimeout(() => loadWithdrawalsPage(), 50);
        } else if (targetViewId === 'view-client-reports' && typeof loadClientReportsPage === 'function') {
            setTimeout(() => loadClientReportsPage(), 50);
        } else if (targetViewId === 'view-audit-trail' && typeof loadAuditTrailPage === 'function') {
            setTimeout(() => loadAuditTrailPage(), 50);
        }
    };

    // Attach Sidebar Click Listeners
    sidebarNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            window.location.hash = href;
            switchAdminView(href);
        });
    });

    // Listen to Browser Hash Changes
    window.addEventListener('hashchange', () => {
        switchAdminView(window.location.hash);
    });

    // ------------------------------------------------------------------------
    // Admin Profile Dropdown & Modal Management
    // ------------------------------------------------------------------------
    const btnAdminProfileDropdown = document.getElementById('btn-admin-profile-dropdown');
    const adminProfileMenu = document.getElementById('admin-profile-menu');
    const btnAdminMyProfile = document.getElementById('btn-admin-my-profile');
    const btnAdminAccountSettings = document.getElementById('btn-admin-account-settings');
    const modalAccountSettings = document.getElementById('modal-admin-account-settings');
    const inputSettingsName = document.getElementById('admin-settings-name');
    const inputSettingsEmail = document.getElementById('admin-settings-email');
    const inputSettingsPhone = document.getElementById('admin-settings-phone');
    const btnSaveAccount = document.getElementById('btn-save-admin-account');

    if (btnAdminProfileDropdown && adminProfileMenu) {
        btnAdminProfileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            adminProfileMenu.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.user-profile-wrapper');
        if (adminProfileMenu && !adminProfileMenu.classList.contains('hidden')) {
            if (wrapper && !wrapper.contains(e.target)) {
                adminProfileMenu.classList.add('hidden');
            }
        }
    });

    const openAdminProfileModal = () => {
        if (adminProfileMenu) adminProfileMenu.classList.add('hidden');

        if (currentAdminProfile) {
            if (inputSettingsName) inputSettingsName.value = currentAdminProfile.fullName || '';
            if (inputSettingsEmail) inputSettingsEmail.value = currentAdminProfile.email || '';
            if (inputSettingsPhone) inputSettingsPhone.value = (currentAdminProfile.phone === 'N/A' || !currentAdminProfile.phone) ? '' : currentAdminProfile.phone;
        }

        if (modalAccountSettings) modalAccountSettings.classList.remove('hidden');
    };

    if (btnAdminMyProfile) btnAdminMyProfile.addEventListener('click', openAdminProfileModal);
    if (btnAdminAccountSettings) btnAdminAccountSettings.addEventListener('click', openAdminProfileModal);

    if (btnSaveAccount) {
        btnSaveAccount.addEventListener('click', async () => {
            const fullName = inputSettingsName ? inputSettingsName.value.trim() : '';
            const phone = inputSettingsPhone ? inputSettingsPhone.value.trim() : '';

            if (!fullName) {
                showToast('Please enter your full name.', 'warning');
                return;
            }

            try {
                const headers = getAdminHeaders();
                const res = await fetch('http://localhost:5000/api/admin/profile', {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ fullName, phone })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast('✓ Administrator profile updated successfully.', 'success');
                    if (modalAccountSettings) modalAccountSettings.classList.add('hidden');
                    await fetchAdminProfile();
                } else {
                    showToast(`✕ Update failed: ${data.message || 'Error occurred.'}`, 'error');
                }
            } catch (err) {
                console.error('Save admin account error:', err);
                showToast('✕ Error updating profile.', 'error');
            }
        });
    }

    // Sidebar Mobile Toggle
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => sidebar.classList.toggle('active'));
    }

    // Fetch Live Dashboard Stats from Backend API
    const loadDashboardData = async () => {
        await fetchAdminProfile();
        try {
            const headers = getAdminHeaders();
            const res = await fetch('http://localhost:5000/api/admin/stats', { headers });
            if (handleAdminAuthError(res)) return;

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.stats) {
                    const s = data.stats;

                    if (statTotalClients) statTotalClients.textContent = s.totalClients || 0;
                    if (statActiveProviders) statActiveProviders.textContent = s.activeProviders || 0;
                    if (statPendingApps) statPendingApps.textContent = s.pendingApplications || 0;
                    if (statTotalBookings) statTotalBookings.textContent = s.totalBookings || 0;
                    if (statTotalRevenue) statTotalRevenue.textContent = `₱${(s.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    if (badgePendingCount) {
                        badgePendingCount.textContent = s.pendingApplications || 0;
                        badgePendingCount.style.display = s.pendingApplications > 0 ? 'inline-block' : 'none';
                    }

                    const formattedGross = `₱${(s.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    const formattedCompleted = `₱${(s.completedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    const formattedPending = `₱${(s.pendingRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    if (revenueGrossVal) revenueGrossVal.textContent = formattedGross;
                    if (revenueCompletedVal) revenueCompletedVal.textContent = formattedCompleted;
                    if (revenuePendingVal) revenuePendingVal.textContent = formattedPending;

                    if (revenueGrossValFull) revenueGrossValFull.textContent = formattedGross;
                    if (revenueCompletedValFull) revenueCompletedValFull.textContent = formattedCompleted;
                    if (revenuePendingValFull) revenuePendingValFull.textContent = formattedPending;

                    globalActiveProvidersList = s.activeProvidersList || [];
                    renderActiveProvidersTable(globalActiveProvidersList);

                    globalRegisteredClientsList = s.registeredClientsList || [];
                    renderRegisteredClientsTable(globalRegisteredClientsList);

                    globalBookingsList = s.bookingsList || [];
                    renderBookingsTable(globalBookingsList);

                    renderRevenueTransactionsTable(globalBookingsList);
                    renderActivityLogs(s.activityLogs || []);
                }
            }
        } catch (err) {
            console.warn('Dashboard stats fetch notice:', err.message);
        }

        await loadPendingApplications();
        await loadProviderRevenueSummary();
    };

    // Load Pending Applications List
    const loadPendingApplications = async () => {
        try {
            const headers = getAdminHeaders();
            const res = await fetch('http://localhost:5000/api/admin/applications', { headers });
            if (handleAdminAuthError(res)) return;

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.applications)) {
                    globalApplicationsList = data.applications;
                    renderPendingApplicationsTable(globalApplicationsList);
                    return;
                }
            }
        } catch (err) {
            console.warn('Pending applications fetch notice:', err.message);
        }

        renderPendingApplicationsTable([]);
    };

    // Render Pending Applications Table
    const renderPendingApplicationsTable = (apps) => {
        const html = (!apps || apps.length === 0)
            ? `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No pending applications.</td></tr>`
            : apps.map(app => `
                <tr>
                    <td>
                        <strong style="color:#0a192f; font-size:0.92rem;">${app.ApplicantName || app.OwnerName || 'Client Applicant'}</strong>
                        <div style="font-size:0.78rem; color:#64748b;">${app.ApplicantEmail || 'No email'}</div>
                    </td>
                    <td><strong style="color:#2563eb; font-size:0.92rem;">${app.BusinessName}</strong></td>
                    <td><span style="font-size:0.82rem; color:#475569;">Sound & Lighting</span></td>
                    <td><span style="font-size:0.84rem; color:#0a192f;"><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> ${app.CoverageArea || 'Batangas'}</span></td>
                    <td><span style="font-size:0.82rem; color:#64748b;">${new Date(app.SubmittedAt || Date.now()).toLocaleDateString()}</span></td>
                    <td><span class="status-badge status-${(app.Status || 'Pending').toLowerCase()}">${app.Status || 'Pending Review'}</span></td>
                    <td>
                        <div style="display:flex; gap:6px;">
                            <button type="button" class="btn-card-secondary" onclick="window.viewAppDetails(${app.ApplicationID})" style="padding:6px 12px; font-size:0.78rem; font-weight:700;">
                                <i class="fa-solid fa-eye"></i> Details
                            </button>
                            <button type="button" onclick="window.approveApp(${app.ApplicationID})" style="padding:6px 12px; font-size:0.78rem; font-weight:700; border:none; border-radius:6px; background:#10b981; color:#fff; cursor:pointer;">
                                <i class="fa-solid fa-check"></i> Approve
                            </button>
                            <button type="button" onclick="window.promptRejectApp(${app.ApplicationID})" style="padding:6px 12px; font-size:0.78rem; font-weight:700; border:none; border-radius:6px; background:#ef4444; color:#fff; cursor:pointer;">
                                <i class="fa-solid fa-xmark"></i> Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');

        if (tableBodyPending) tableBodyPending.innerHTML = html;
        if (tableBodyPendingFull) tableBodyPendingFull.innerHTML = html;
    };

    // Render Active Service Providers Table
    const renderActiveProvidersTable = (providers) => {
        const html = (!providers || providers.length === 0)
            ? `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">No active service providers.</td></tr>`
            : providers.map(p => {
                const isSuspended = p.AccountStatus === 'Suspended';
                const statusBadge = isSuspended 
                    ? '<span class="status-badge status-cancelled">Suspended</span>' 
                    : '<span class="status-badge status-confirmed">Active</span>';

                const actionBtn = isSuspended
                    ? `<button type="button" onclick="window.reactivateProvider(${p.ProviderID})" style="padding:5px 12px; font-size:0.78rem; border:none; border-radius:6px; background:#10b981; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-check"></i> Reactivate</button>`
                    : `<button type="button" onclick="window.suspendProvider(${p.ProviderID})" style="padding:5px 12px; font-size:0.78rem; border:none; border-radius:6px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-ban"></i> Suspend</button>`;

                const ownerNameDisplay = (!p.OwnerName || p.OwnerName === 'null') ? 'Service Provider Owner' : p.OwnerName;
                const coverageDisplay = (!p.CoverageArea || p.CoverageArea === 'null') ? 'Batangas' : p.CoverageArea;

                return `
                    <tr>
                        <td><strong style="color:#0a192f; font-size:0.9rem;">${ownerNameDisplay}</strong></td>
                        <td><strong style="color:#2563eb; font-size:0.92rem;">${p.BusinessName}</strong></td>
                        <td><span style="font-size:0.84rem; color:#0a192f;"><i class="fa-solid fa-location-dot" style="color:#ef4444;"></i> ${coverageDisplay}</span></td>
                        <td><span style="font-size:0.82rem; color:#64748b;">📞 ${p.ContactNumber}</span></td>
                        <td>${statusBadge}</td>
                        <td><div style="display:flex; gap:6px;">${actionBtn}</div></td>
                    </tr>
                `;
            }).join('');

        if (tableBodyActiveProviders) tableBodyActiveProviders.innerHTML = html;
        if (tableBodyActiveProvidersFull) tableBodyActiveProvidersFull.innerHTML = html;
    };

    // Render Registered Clients Table
    const renderRegisteredClientsTable = (clients) => {
        const html = (!clients || clients.length === 0)
            ? `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">No registered clients found.</td></tr>`
            : clients.map(c => `
                <tr>
                    <td><strong style="color:#0a192f; font-size:0.9rem;">${c.FullName}</strong></td>
                    <td><span style="font-size:0.84rem; color:#2563eb;">${c.Email}</span></td>
                    <td><span style="font-size:0.82rem; color:#64748b;">${c.Phone || 'N/A'}</span></td>
                    <td><span style="font-size:0.82rem; color:#64748b;">${new Date(c.RegistrationDate || Date.now()).toLocaleDateString()}</span></td>
                    <td><span style="font-size:0.85rem; font-weight:700; color:#0a192f;">${c.BookingCount || 0} Bookings</span></td>
                    <td><span class="status-badge status-confirmed">Active Client</span></td>
                </tr>
            `).join('');

        if (tableBodyRegisteredClients) tableBodyRegisteredClients.innerHTML = html;
        if (tableBodyRegisteredClientsFull) tableBodyRegisteredClientsFull.innerHTML = html;
    };

    // Render Total Bookings Table
    const renderBookingsTable = (bookings) => {
        const html = (!bookings || bookings.length === 0)
            ? `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No bookings yet.</td></tr>`
            : bookings.map(b => {
                const sDate = b.ServiceStartDate || b.EventDate;
                const eDate = b.ServiceEndDate || b.EventDate || sDate;
                const hireDays = b.ServiceHireDays || b.NumberOfDays || 1;
                const dateDisplay = (sDate === eDate) ? sDate : `${sDate} to ${eDate}`;
                const timeText = (b.StartTime && b.EndTime) ? ` (${b.StartTime}–${b.EndTime})` : '';

                return `
                    <tr>
                        <td><strong style="color:#0a192f; font-size:0.88rem;">#BK-${b.BookingID}</strong></td>
                        <td><strong style="color:#0a192f; font-size:0.88rem;">${b.ClientName}</strong></td>
                        <td><strong style="color:#2563eb; font-size:0.88rem;">${b.ProviderName}</strong></td>
                        <td><div style="font-size:0.85rem; color:#0a192f; font-weight:600;">${b.PackageName}</div></td>
                        <td><span style="font-size:0.82rem; color:#64748b;">${dateDisplay} <strong style="color:#2563eb;">(${hireDays}d)</strong>${timeText}</span></td>
                        <td><strong style="font-size:0.95rem; color:#0a192f;">₱${parseFloat(b.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                        <td><span class="status-badge status-confirmed">${b.BookingStatus || 'Confirmed'}</span></td>
                    </tr>
                `;
            }).join('');

        if (tableBodyTotalBookings) tableBodyTotalBookings.innerHTML = html;
        if (tableBodyTotalBookingsFull) tableBodyTotalBookingsFull.innerHTML = html;
    };

    // Render Revenue Transactions Table
    const renderRevenueTransactionsTable = (bookings) => {
        if (!tableRevenueTransactions) return;

        if (!bookings || bookings.length === 0) {
            tableRevenueTransactions.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No revenue transactions found.</td></tr>`;
            return;
        }

        tableRevenueTransactions.innerHTML = bookings.map((b, idx) => `
            <tr>
                <td><strong style="color:#2563eb; font-size:0.88rem;">#TXN-${1000 + (b.BookingID || idx + 1)}</strong></td>
                <td><strong style="color:#0a192f; font-size:0.88rem;">#BK-${b.BookingID}</strong></td>
                <td><span style="font-size:0.88rem; color:#0a192f; font-weight:600;">${b.ClientName}</span></td>
                <td><span style="font-size:0.88rem; color:#2563eb; font-weight:600;">${b.ProviderName}</span></td>
                <td><strong style="font-size:0.95rem; color:#10b981;">₱${parseFloat(b.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                <td><span style="font-size:0.82rem; color:#475569; font-weight:700;"><i class="fa-solid fa-mobile-screen" style="color:#2563eb;"></i> GCash</span></td>
                <td><span class="status-badge status-confirmed">Verified Paid</span></td>
            </tr>
        `).join('');
    };

    // Render Per Service Provider Revenue Table & Detailed Modal Loader
    const loadProviderRevenueSummary = async () => {
        const tableSummary = document.getElementById('table-provider-revenue-summary');
        const revenueCommissionValFull = document.getElementById('revenue-commission-val-full');

        try {
            const headers = getAdminHeaders();
            const res = await fetch('/api/admin/escrow/list', { headers });
            if (handleAdminAuthError(res)) return;
            const data = await res.json();

            if (!res.ok || !data.success) {
                if (tableSummary) tableSummary.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ef4444;">Failed to load provider revenue breakdown.</td></tr>`;
                return;
            }

            const items = data.escrowItems || [];
            
            if (revenueCommissionValFull) {
                revenueCommissionValFull.textContent = `₱${parseFloat(data.totalPlatformCommission || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            }

            // Group transactions by ProviderName / ProviderEmail
            const providerGroups = {};
            items.forEach(item => {
                const provKey = item.ProviderName || item.ProviderEmail || 'Service Provider';
                if (!providerGroups[provKey]) {
                    providerGroups[provKey] = {
                        providerName: provKey,
                        providerEmail: item.ProviderEmail || '',
                        grossRevenue: 0,
                        netEarnings: 0,
                        adminCommission: 0,
                        escrowHeld: 0,
                        bookings: []
                    };
                }

                const gross = parseFloat(item.TotalAmount || 0);
                const paid = parseFloat(item.AmountPaid || 0);
                const comm = parseFloat(item.CommissionAmount || (gross * 0.05) || 0);
                const net = parseFloat(item.ProviderEarnings || (gross * 0.95) || 0);
                const isHeld = (item.EscrowStatus || 'Held') === 'Held' || (item.EscrowStatus || '') === 'Pending Release';

                providerGroups[provKey].grossRevenue += gross;
                providerGroups[provKey].netEarnings += net;
                providerGroups[provKey].adminCommission += comm;
                if (isHeld) providerGroups[provKey].escrowHeld += paid;

                providerGroups[provKey].bookings.push(item);
            });

            const provKeys = Object.keys(providerGroups);
            window.adminProviderRevenueMap = providerGroups;

            if (!tableSummary) return;

            if (provKeys.length === 0) {
                tableSummary.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No service provider revenue records found.</td></tr>`;
                return;
            }

            tableSummary.innerHTML = provKeys.map((pKey) => {
                const group = providerGroups[pKey];
                const grossText = `₱${group.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                const netText = `₱${group.netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                const commText = `₱${group.adminCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                return `
                    <tr>
                        <td>
                            <strong style="color:#0a192f; font-size:0.92rem; display:block;">${group.providerName}</strong>
                            <span style="font-size:0.75rem; color:#64748b;">${group.providerEmail}</span>
                        </td>
                        <td><span style="font-size:0.82rem; color:#475569;">📞 Verified Provider</span></td>
                        <td><strong style="font-size:0.95rem; color:#0a192f;">${grossText}</strong></td>
                        <td><strong style="font-size:0.95rem; color:#10b981;">${netText}</strong></td>
                        <td><strong style="font-size:0.95rem; color:#8b5cf6;">${commText}</strong></td>
                        <td><span style="font-size:0.85rem; font-weight:700; color:#2563eb;">${group.bookings.length} Booking(s)</span></td>
                        <td>
                            <button type="button" onclick="window.openProviderRevenueModal('${pKey.replace(/'/g, "\\'")}')" style="padding:6px 14px; font-size:0.78rem; font-weight:700; border:none; border-radius:6px; background:#2563eb; color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                                <i class="fa-solid fa-eye"></i> View Revenue Details
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');

            // Render Recent Client Payments & Direct Transactions Table
            const tableClientPayments = document.getElementById('table-client-payments-history');
            if (tableClientPayments) {
                if (items.length === 0) {
                    tableClientPayments.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:24px; color:#64748b;">No client payment transactions recorded yet.</td></tr>`;
                } else {
                    tableClientPayments.innerHTML = items.map((b, idx) => {
                        const gross = parseFloat(b.TotalAmount || 0);
                        const comm = parseFloat(b.CommissionAmount || (gross * 0.05) || 0);
                        const txnId = `#TXN-${1000 + (b.BookingID || idx + 1)}`;
                        const refCode = b.BookingReference || `#BK-${b.BookingID}`;
                        const payDateText = b.CreatedAt ? new Date(b.CreatedAt).toLocaleDateString() : (b.EventDate ? new Date(b.EventDate).toLocaleDateString() : 'N/A');

                        return `
                            <tr>
                                <td><strong style="color:#2563eb; font-size:0.88rem;">${txnId}</strong></td>
                                <td><strong style="color:#0a192f; font-size:0.88rem;">${refCode}</strong></td>
                                <td>
                                    <strong style="color:#0a192f; font-size:0.88rem; display:block;">${b.ClientName || 'Client'}</strong>
                                    <span style="font-size:0.75rem; color:#64748b;">${b.ClientEmail || b.ClientName || ''}</span>
                                </td>
                                <td><span style="font-size:0.84rem; color:#0a192f; font-weight:600;">${b.ProviderName || 'Service Provider'}</span></td>
                                <td><span style="font-size:0.84rem; color:#475569;">${b.PackageName || 'Event Service'}</span></td>
                                <td><strong style="font-size:0.92rem; color:#10b981;">₱${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                                <td><strong style="font-size:0.92rem; color:#8b5cf6;">₱${comm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                                <td><span style="font-size:0.82rem; color:#475569; font-weight:700;"><i class="fa-solid fa-mobile-screen" style="color:#2563eb;"></i> PayMongo GCash</span></td>
                                <td><span style="font-size:0.84rem; color:#64748b;">${payDateText}</span></td>
                                <td><span class="status-badge status-confirmed">Paid & Confirmed</span></td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // Render Provider Manual Payout Requests Table
            const tableAdminWithdrawals = document.getElementById('table-admin-withdrawals-history');
            if (tableAdminWithdrawals) {
                try {
                    const wRes = await fetch('/api/admin/withdrawals/list', { headers });
                    const wData = await wRes.json();
                    const wItems = (wData && wData.success) ? (wData.withdrawals || []) : [];

                    if (wItems.length === 0) {
                        tableAdminWithdrawals.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No provider manual payout requests submitted yet.</td></tr>`;
                    } else {
                        tableAdminWithdrawals.innerHTML = wItems.map((w, idx) => {
                            const amt = parseFloat(w.Amount || 0);
                            const isApproved = w.Status === 'Approved' || w.Status === 'Processed';
                            const reqId = `#WD-${100 + (w.WithdrawalID || idx + 1)}`;
                            const reqDate = w.RequestedAt ? new Date(w.RequestedAt).toLocaleDateString() : 'N/A';

                            const statusBadge = isApproved
                                ? `<span class="status-badge status-confirmed"><i class="fa-solid fa-check"></i> Paid & Sent</span>`
                                : `<span class="status-badge status-pending" style="background:#fffbeb; color:#d97706; border:1px solid #fef3c7;"><i class="fa-solid fa-clock"></i> Pending Manual Payout</span>`;

                            const approveBtn = isApproved
                                ? `<span style="font-size:0.8rem; color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Paid &amp; Sent</span>`
                                : `<button type="button" onclick="window.adminApproveWithdrawal(${w.WithdrawalID}, '${(w.AccountName || 'Provider Account').replace(/'/g, "\\'")}', '${(w.AccountReference || 'N/A').replace(/'/g, "\\'")}', '${amt.toFixed(2)}')" style="padding:6px 14px; font-size:0.78rem; font-weight:700; border:none; border-radius:6px; background:#10b981; color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-paper-plane"></i> Mark as Paid</button>`;

                            return `
                                <tr>
                                    <td><strong style="color:#2563eb; font-size:0.88rem;">${reqId}</strong></td>
                                    <td>
                                        <strong style="color:#0a192f; font-size:0.88rem; display:block;">${w.ProviderName || 'Service Provider'}</strong>
                                        <span style="font-size:0.75rem; color:#64748b;">${w.ProviderEmail || ''}</span>
                                    </td>
                                    <td><strong style="font-size:0.95rem; color:#10b981;">₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                                    <td><span style="font-size:0.84rem; color:#0a192f; font-weight:700;"><i class="fa-solid fa-wallet" style="color:#2563eb;"></i> ${w.PayoutMethod || 'GCash'}</span></td>
                                    <td><strong style="font-size:0.88rem; color:#0a192f;">${w.AccountName || 'Provider Account'}</strong></td>
                                    <td><span style="font-size:0.88rem; color:#2563eb; font-weight:700; background:#eff6ff; padding:3px 8px; border-radius:6px;">${w.AccountReference || 'N/A'}</span></td>
                                    <td><span style="font-size:0.84rem; color:#64748b;">${reqDate}</span></td>
                                    <td>${statusBadge}</td>
                                    <td>${approveBtn}</td>
                                </tr>
                            `;
                        }).join('');
                    }
                } catch (wErr) {
                    console.error('Fetch Admin Withdrawals Error:', wErr);
                }
            }

        } catch (err) {
            console.error('Load Provider Revenue Summary Error:', err);
        }
    };

    // Admin approve manual withdrawal payout function
    window.adminApproveWithdrawal = async (withdrawalId, accountName, accountRef, amountStr) => {
        if (!withdrawalId) return;
        const confirmMsg = `Have you manually sent ₱${parseFloat(amountStr || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${accountName} (${accountRef})?\n\nClick OK to confirm that payment has been transferred and mark this request as Paid & Sent.`;
        if (!confirm(confirmMsg)) return;

        try {
            const headers = getAdminHeaders();
            const res = await fetch(`/api/admin/withdrawals/${withdrawalId}/approve`, {
                method: 'PUT',
                headers
            });
            const data = await res.json();
            if (res.ok && data.success) {
                alert(data.message || '🎉 Provider manual payout marked as Paid & Sent successfully!');
                loadProviderRevenueSummary();
            } else {
                alert(data.message || 'Failed to approve withdrawal request.');
            }
        } catch (err) {
            console.error('Approve Withdrawal Error:', err);
            alert('An error occurred while confirming payout.');
        }
    };

    // ------------------------------------------------------------------------
    // Withdrawal Management Page — Dedicated View
    // ------------------------------------------------------------------------
    let allWithdrawalItems = [];
    let _wdCachedClientPaid = 10280;

    const renderWithdrawalTable = (items) => {
        const tbody = document.getElementById('table-withdrawal-requests');
        if (!tbody) return;

        const statTotal   = document.getElementById('wd-stat-total');
        const statPending = document.getElementById('wd-stat-pending');
        const statApproved = document.getElementById('wd-stat-approved');
        const statAmount  = document.getElementById('wd-stat-amount');
        const badge       = document.getElementById('badge-pending-withdrawals');

        const total    = items.length;
        const pending  = items.filter(w => w.Status !== 'Approved' && w.Status !== 'Processed').length;
        const approved = items.filter(w => w.Status === 'Approved' || w.Status === 'Processed').length;
        const totalWithdrawn = (allWithdrawalItems && allWithdrawalItems.length ? allWithdrawalItems : items)
            .filter(w => w.Status === 'Approved' || w.Status === 'Processed')
            .reduce((sum, w) => sum + (parseFloat(w.Amount) || 0), 0);

        if (statTotal)    statTotal.textContent   = total;
        if (statPending)  statPending.textContent  = pending;
        if (statApproved) statApproved.textContent = approved;
        if (statAmount)   statAmount.textContent   = `₱${totalWithdrawn.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const statIncome = document.getElementById('wd-stat-income');
        if (statIncome)   statIncome.textContent   = `₱${(_wdCachedClientPaid || 10280).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (badge) {
            badge.textContent = pending;
            badge.style.display = pending > 0 ? 'inline-block' : 'none';
        }

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:#64748b;"><i class="fa-solid fa-inbox" style="font-size:1.5rem; margin-bottom:8px; display:block;"></i>No withdrawal requests found.</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map((w, idx) => {
            const amt = parseFloat(w.Amount || 0);
            const isApproved = w.Status === 'Approved' || w.Status === 'Processed';
            const reqId  = `#WD-${100 + (w.WithdrawalID || idx + 1)}`;
            const reqDate = w.RequestedAt ? new Date(w.RequestedAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }) : 'N/A';

            const statusBadge = isApproved
                ? `<span class="status-badge status-confirmed"><i class="fa-solid fa-check"></i> Paid &amp; Sent</span>`
                : `<span class="status-badge status-pending" style="background:#fffbeb; color:#d97706; border:1px solid #fef3c7;"><i class="fa-solid fa-clock"></i> Pending Payout</span>`;

            const approveBtn = isApproved
                ? `<span style="font-size:0.8rem; color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Paid &amp; Sent</span>`
                : `<button type="button" onclick="window.adminApproveWithdrawal(${w.WithdrawalID}, '${(w.AccountName || 'Provider Account').replace(/'/g, "\\'")}', '${(w.AccountReference || 'N/A').replace(/'/g, "\\'")}', '${amt.toFixed(2)}')" style="padding:6px 14px; font-size:0.78rem; font-weight:700; border:none; border-radius:6px; background:#10b981; color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-paper-plane"></i> Mark as Paid</button>`;

            return `
                <tr>
                    <td><strong style="color:#2563eb; font-size:0.88rem;">${reqId}</strong></td>
                    <td>
                        <strong style="color:#0a192f; font-size:0.88rem; display:block;">${w.ProviderName || 'Service Provider'}</strong>
                        <span style="font-size:0.75rem; color:#64748b;">${w.ProviderEmail || ''}</span>
                    </td>
                    <td><strong style="font-size:0.95rem; color:#10b981;">₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                    <td><span style="font-size:0.84rem; color:#0a192f; font-weight:700;"><i class="fa-solid fa-wallet" style="color:#2563eb;"></i> ${w.PayoutMethod || 'GCash'}</span></td>
                    <td><strong style="font-size:0.88rem; color:#0a192f;">${w.AccountName || 'Provider Account'}</strong></td>
                    <td><span style="font-size:0.88rem; color:#2563eb; font-weight:700; background:#eff6ff; padding:3px 8px; border-radius:6px;">${w.AccountReference || 'N/A'}</span></td>
                    <td><span style="font-size:0.84rem; color:#64748b;">${reqDate}</span></td>
                    <td>${statusBadge}</td>
                    <td>${approveBtn}</td>
                </tr>
            `;
        }).join('');
    };

    const loadWithdrawalsPage = async () => {
        const tbody = document.getElementById('table-withdrawal-requests');
        if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading withdrawal requests...</td></tr>`;

        try {
            const headers = getAdminHeaders();
            const res = await fetch('/api/admin/withdrawals/list', { headers });
            const data = await res.json();
            allWithdrawalItems = (data && data.success) ? (data.withdrawals || []) : [];

            const filterEl = document.getElementById('wd-filter-status');
            const currentFilter = filterEl ? filterEl.value : 'all';
            const filtered = currentFilter === 'all'
                ? allWithdrawalItems
                : allWithdrawalItems.filter(w => {
                    const isPending = w.Status !== 'Approved' && w.Status !== 'Processed';
                    return currentFilter === 'Pending' ? isPending : !isPending;
                });

            renderWithdrawalTable(filtered);
        } catch (err) {
            console.error('Load Withdrawals Page Error:', err);
            const tbody2 = document.getElementById('table-withdrawal-requests');
            if (tbody2) tbody2.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px; color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Failed to load withdrawal requests. Please try again.</td></tr>`;
        }
    };

    // Override adminApproveWithdrawal to also reload the Withdrawal page if visible
    const _origApproveWithdrawal = window.adminApproveWithdrawal;
    window.adminApproveWithdrawal = async (...args) => {
        await _origApproveWithdrawal(...args);
        const wPanel = document.getElementById('view-withdrawal');
        if (wPanel && !wPanel.classList.contains('hidden')) {
            await loadWithdrawalsPage();
        }
    };

    // Withdrawal filter change listener
    const wdFilterEl = document.getElementById('wd-filter-status');
    if (wdFilterEl) {
        wdFilterEl.addEventListener('change', () => {
            const currentFilter = wdFilterEl.value;
            const filtered = currentFilter === 'all'
                ? allWithdrawalItems
                : allWithdrawalItems.filter(w => {
                    const isPending = w.Status !== 'Approved' && w.Status !== 'Processed';
                    return currentFilter === 'Pending' ? isPending : !isPending;
                });
            renderWithdrawalTable(filtered);
        });
    }

    // Withdrawal Refresh button
    const btnRefreshWithdrawals = document.getElementById('btn-refresh-withdrawals');
    if (btnRefreshWithdrawals) {
        btnRefreshWithdrawals.addEventListener('click', () => loadWithdrawalsPage());
    }

    // Top Withdraw via PayMongo button handler (directs straight to PayMongo)
    window.adminWithdrawViaPayMongo = function() {
        window.open('https://dashboard.paymongo.com/payouts', '_blank');
    };

    const btnTopWithdraw = document.getElementById('btn-top-withdraw-paymongo');
    if (btnTopWithdraw) {
        btnTopWithdraw.addEventListener('click', (e) => {
            // Let the native anchor open https://dashboard.paymongo.com/payouts directly
        });
    }

    // Auto-load Withdrawal page when sidebar nav is clicked
    const navWithdrawal = document.getElementById('nav-item-withdrawal');
    if (navWithdrawal) {
        navWithdrawal.addEventListener('click', () => {
            setTimeout(() => loadWithdrawalsPage(), 50);
        });
    }

    // Auto-load Client Reports page when sidebar nav is clicked
    const navReports = document.getElementById('nav-item-reports');
    if (navReports) {
        navReports.addEventListener('click', () => {
            setTimeout(() => loadClientReportsPage(), 50);
        });
    }

    // Auto-load Audit Trail page when sidebar nav is clicked
    const navAudit = document.getElementById('nav-item-audit');
    if (navAudit) {
        navAudit.addEventListener('click', () => {
            setTimeout(() => loadAuditTrailPage(), 50);
        });
    }

    // Open Provider Detailed Revenue Full View
    window.openProviderRevenueModal = (providerKey) => {
        const group = window.adminProviderRevenueMap ? window.adminProviderRevenueMap[providerKey] : null;
        const mainView = document.getElementById('revenue-main-view');
        const detailView = document.getElementById('revenue-provider-detail-view');
        
        if (!group || !mainView || !detailView) return;

        // Hide main summary, show detail view
        mainView.classList.add('hidden');
        detailView.classList.remove('hidden');

        // Populate detail view header & metrics
        const headerName = document.getElementById('detail-prov-header-name');
        const headerEmail = document.getElementById('detail-prov-header-email');
        const grossVal = document.getElementById('detail-prov-gross-val');
        const netVal = document.getElementById('detail-prov-net-val');
        const adminVal = document.getElementById('detail-prov-admin-val');

        if (headerName) headerName.textContent = `${group.providerName} - Financial Report`;
        if (headerEmail) headerEmail.textContent = `Owner Email: ${group.providerEmail || 'N/A'} | Verified Service Provider`;

        if (grossVal) grossVal.textContent = `₱${group.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (netVal) netVal.textContent = `₱${group.netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        if (adminVal) adminVal.textContent = `₱${group.adminCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // Render full width transactions ledger table for this provider
        const tbody = document.getElementById('detail-prov-transactions-body');
        if (tbody) {
            if (!group.bookings || group.bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No transactions recorded for this provider.</td></tr>`;
            } else {
                tbody.innerHTML = group.bookings.map((b, idx) => {
                    const gross = parseFloat(b.TotalAmount || 0);
                    const comm = parseFloat(b.CommissionAmount || (gross * 0.05) || 0);
                    const net = parseFloat(b.ProviderEarnings || (gross * 0.95) || 0);
                    const txnId = `#TXN-${1000 + (b.BookingID || idx + 1)}`;
                    const refCode = b.BookingReference || `#BK-${b.BookingID}`;
                    const eventDateText = b.EventDate ? new Date(b.EventDate).toLocaleDateString() : 'N/A';

                    return `
                        <tr>
                            <td><strong style="color:#2563eb; font-size:0.88rem;">${txnId}</strong></td>
                            <td><strong style="color:#0a192f; font-size:0.88rem;">${refCode}</strong></td>
                            <td><span style="font-size:0.86rem; color:#0a192f; font-weight:600;">${b.ClientName}</span></td>
                            <td><span style="font-size:0.84rem; color:#475569;">${b.PackageName}</span></td>
                            <td><span style="font-size:0.84rem; color:#64748b;">${eventDateText}</span></td>
                            <td><strong style="font-size:0.92rem; color:#0a192f;">₱${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                            <td><strong style="font-size:0.92rem; color:#8b5cf6;">₱${comm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                            <td><strong style="font-size:0.92rem; color:#10b981;">₱${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                            <td><span style="font-size:0.82rem; color:#475569; font-weight:700;"><i class="fa-solid fa-mobile-screen" style="color:#2563eb;"></i> PayMongo GCash</span></td>
                        </tr>
                    `;
                }).join('');
            }
        }
    };

    // Return to main provider list view
    window.backToProvidersList = () => {
        const mainView = document.getElementById('revenue-main-view');
        const detailView = document.getElementById('revenue-provider-detail-view');
        if (mainView && detailView) {
            detailView.classList.add('hidden');
            mainView.classList.remove('hidden');
        }
    };

    // Admin Release Escrow Payout Handler
    window.adminReleaseEscrow = async (bookingId) => {
        try {
            const headers = getAdminHeaders();
            const res = await fetch(`/api/admin/escrow/${bookingId}/release`, {
                method: 'PUT',
                headers
            });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast(data.message || '🎉 Escrow payout released successfully!', 'success');
                await loadProviderRevenueSummary();
                loadDashboardData();
            } else {
                showToast(data.message || 'Failed to release escrow payout.', 'error');
            }
        } catch (err) {
            showToast('Network error releasing escrow payout.', 'error');
        }
    };

    // Dedicated View Search & Filter Handlers
    if (searchPendingApps) {
        searchPendingApps.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = globalApplicationsList.filter(a => (a.ApplicantName || a.OwnerName || '').toLowerCase().includes(q) || (a.BusinessName || '').toLowerCase().includes(q));
            renderPendingApplicationsTable(filtered);
        });
    }

    if (filterPendingStatus) {
        filterPendingStatus.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'all') {
                renderPendingApplicationsTable(globalApplicationsList);
            } else {
                const filtered = globalApplicationsList.filter(a => (a.Status || 'Pending').toLowerCase() === val.toLowerCase());
                renderPendingApplicationsTable(filtered);
            }
        });
    }

    if (searchActiveProviders) {
        searchActiveProviders.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = globalActiveProvidersList.filter(p => (p.OwnerName || '').toLowerCase().includes(q) || (p.BusinessName || '').toLowerCase().includes(q));
            renderActiveProvidersTable(filtered);
        });
    }

    if (filterProviderStatus) {
        filterProviderStatus.addEventListener('change', (e) => {
            const val = e.target.value;
            if (val === 'all') {
                renderActiveProvidersTable(globalActiveProvidersList);
            } else {
                const filtered = globalActiveProvidersList.filter(p => (p.AccountStatus || 'Active').toLowerCase() === val.toLowerCase());
                renderActiveProvidersTable(filtered);
            }
        });
    }

    if (searchRegisteredClients) {
        searchRegisteredClients.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = globalRegisteredClientsList.filter(c => (c.FullName || '').toLowerCase().includes(q) || (c.Email || '').toLowerCase().includes(q));
            renderRegisteredClientsTable(filtered);
        });
    }

    if (searchTotalBookings) {
        searchTotalBookings.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase().trim();
            const filtered = globalBookingsList.filter(b => (b.ClientName || '').toLowerCase().includes(q) || (b.ProviderName || '').toLowerCase().includes(q) || (b.PackageName || '').toLowerCase().includes(q) || String(b.BookingID).includes(q));
            renderBookingsTable(filtered);
        });
    }

    const handleBookingFilter = (val) => {
        if (val === 'all') {
            renderBookingsTable(globalBookingsList);
        } else {
            const filtered = globalBookingsList.filter(b => (b.BookingStatus || '').toLowerCase() === val.toLowerCase());
            renderBookingsTable(filtered);
        }
    };

    if (filterBookingStatus) filterBookingStatus.addEventListener('change', (e) => handleBookingFilter(e.target.value));
    if (filterBookingStatusFull) filterBookingStatusFull.addEventListener('change', (e) => handleBookingFilter(e.target.value));

    // Render Activity Logs List
    const renderActivityLogs = (logs) => {
        if (!activityLogsList) return;

        if (!logs || logs.length === 0) {
            activityLogsList.innerHTML = `<li style="padding:16px 0; color:#64748b; font-size:0.85rem; text-align:center;">No recent activity.</li>`;
            return;
        }

        activityLogsList.innerHTML = logs.map(l => `
            <li class="activity-item" style="padding:12px 0; border-bottom:1px solid #f1f5f9; display:flex; gap:12px; align-items:flex-start;">
                <div class="activity-icon bg-blue" style="width:34px; height:34px; border-radius:50%; background:#eff6ff; color:#2563eb; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                    <i class="fa-solid fa-list-check"></i>
                </div>
                <div>
                    <strong style="font-size:0.86rem; color:#0a192f; display:block;">${l.Action}</strong>
                    <p style="font-size:0.78rem; color:#64748b; margin:2px 0 0 0;">${l.Description}</p>
                    <span style="font-size:0.72rem; color:#94a3b8;">${new Date(l.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </li>
        `).join('');
    };

    // View Application Details Modal Handler
    window.viewAppDetails = async (applicationId) => {
        const modal = document.getElementById('modal-admin-view-app');
        const modalBody = document.getElementById('admin-view-app-body');
        const modalActions = document.getElementById('admin-view-app-actions');

        if (!modal || !modalBody) return;

        try {
            const headers = getAdminHeaders();
            const res = await fetch('http://localhost:5000/api/admin/applications', { headers });
            const data = await res.json();
            const apps = data.applications || [];
            const app = apps.find(a => String(a.ApplicationID) === String(applicationId));

            if (app) {
                modalBody.innerHTML = `
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 6px 0; color:#0a192f; font-size:1.05rem;">Applicant Profile</h4>
                        <div style="font-size:0.88rem; color:#475569;">Name: <strong style="color:#0a192f;">${app.ApplicantName || app.OwnerName}</strong></div>
                        <div style="font-size:0.88rem; color:#475569;">Email: <strong style="color:#2563eb;">${app.ApplicantEmail || 'N/A'}</strong></div>
                        <div style="font-size:0.88rem; color:#475569;">Contact: <strong style="color:#0a192f;">${app.ContactNumber}</strong></div>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 6px 0; color:#0a192f; font-size:1.05rem;">Business Details</h4>
                        <div style="font-size:0.88rem; color:#475569;">Business Name: <strong style="color:#2563eb;">${app.BusinessName}</strong></div>
                        <div style="font-size:0.88rem; color:#475569;">Coverage Area: <strong style="color:#0a192f;">${app.CoverageArea}</strong></div>
                        <div style="font-size:0.88rem; color:#475569;">Address: <strong style="color:#0a192f;">${app.BusinessAddress}</strong></div>
                    </div>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:16px;">
                        <h4 style="margin:0 0 6px 0; color:#0a192f; font-size:1.05rem;">Submitted Credentials & Permits</h4>
                        <div style="display:flex; gap:10px; margin-top:8px;">
                            <span style="font-size:0.8rem; background:#eff6ff; color:#2563eb; padding:6px 12px; border-radius:6px; font-weight:700;"><i class="fa-solid fa-id-card"></i> Govt ID (Verified)</span>
                            <span style="font-size:0.8rem; background:#ecfdf5; color:#059669; padding:6px 12px; border-radius:6px; font-weight:700;"><i class="fa-solid fa-file-contract"></i> Business Permit</span>
                        </div>
                    </div>
                `;

                modalActions.innerHTML = `
                    <button type="button" onclick="document.getElementById('modal-admin-view-app').classList.add('hidden')" style="padding:8px 18px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-weight:600;">Close</button>
                    <button type="button" onclick="window.promptRejectApp(${app.ApplicationID})" style="padding:8px 18px; border:none; border-radius:8px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-xmark"></i> Reject</button>
                    <button type="button" onclick="window.approveApp(${app.ApplicationID})" style="padding:8px 22px; border:none; border-radius:8px; background:#10b981; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-check"></i> Approve Application</button>
                `;

                modal.classList.remove('hidden');
            }
        } catch (e) {
            console.error('Error viewing app details:', e);
        }
    };

    // Pending Application Approval State
    let pendingAppIdToApprove = null;

    // Approve Application Trigger Handler (Opens SoundSphere Custom Modal)
    window.approveApp = (applicationId) => {
        pendingAppIdToApprove = applicationId;
        document.getElementById('modal-admin-view-app')?.classList.add('hidden');
        const displaySpan = document.getElementById('approve-app-id-display');
        if (displaySpan) displaySpan.textContent = `#${applicationId}`;
        document.getElementById('modal-admin-confirm-approve')?.classList.remove('hidden');
    };

    // Confirm Approve Button Click Handler
    const btnConfirmApprove = document.getElementById('btn-confirm-approve-app');
    if (btnConfirmApprove) {
        btnConfirmApprove.addEventListener('click', async () => {
            if (!pendingAppIdToApprove) return;
            const appId = pendingAppIdToApprove;
            try {
                const headers = getAdminHeaders();
                const res = await fetch(`http://localhost:5000/api/admin/applications/${appId}/approve`, {
                    method: 'POST',
                    headers
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`✓ Application #${appId} approved successfully! Account gained Service Provider capabilities.`, 'success');
                    document.getElementById('modal-admin-confirm-approve')?.classList.add('hidden');
                    await loadDashboardData();
                } else {
                    showToast(`✕ Approval Failed: ${data.message || 'Error occurred.'}`, 'error');
                }
            } catch (err) {
                console.error('Approve application error:', err);
                showToast('✕ Network error during application approval.', 'error');
            }
        });
    }

    // Prompt Rejection Reason Modal
    window.promptRejectApp = (applicationId) => {
        pendingAppIdToReject = applicationId;
        document.getElementById('modal-admin-view-app')?.classList.add('hidden');
        const rejectModal = document.getElementById('modal-admin-reject-reason');
        if (rejectModal) {
            document.getElementById('input-rejection-reason').value = '';
            rejectModal.classList.remove('hidden');
        }
    };

    // Confirm Rejection Button Handler
    const btnConfirmReject = document.getElementById('btn-confirm-reject-app');
    if (btnConfirmReject) {
        btnConfirmReject.addEventListener('click', async () => {
            const reason = document.getElementById('input-rejection-reason')?.value.trim();
            if (!reason) {
                showToast('Please enter a rejection reason.', 'warning');
                return;
            }

            if (!pendingAppIdToReject) return;

            try {
                const headers = getAdminHeaders();
                const res = await fetch(`http://localhost:5000/api/admin/applications/${pendingAppIdToReject}/reject`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ reason })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`✓ Application #${pendingAppIdToReject} rejected successfully.`, 'info');
                    document.getElementById('modal-admin-reject-reason')?.classList.add('hidden');
                    await loadDashboardData();
                } else {
                    showToast(`✕ Rejection Failed: ${data.message || 'Error occurred.'}`, 'error');
                }
            } catch (err) {
                console.error('Reject application error:', err);
                showToast('✕ Network error during application rejection.', 'error');
            }
        });
    }

    // Suspend Provider Handler
    window.suspendProvider = async (providerId) => {
        try {
            const headers = getAdminHeaders();
            const res = await fetch(`http://localhost:5000/api/admin/providers/${providerId}/suspend`, { method: 'POST', headers });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast(`✓ Provider #${providerId} has been suspended successfully.`, 'info');
                await loadDashboardData();
            } else {
                showToast(`✕ ${data.message || 'Failed to suspend provider.'}`, 'error');
            }
        } catch (e) {
            showToast('✕ Error connecting to backend server.', 'error');
        }
    };

    // Reactivate Provider Handler
    window.reactivateProvider = async (providerId) => {
        try {
            const headers = getAdminHeaders();
            const res = await fetch(`http://localhost:5000/api/admin/providers/${providerId}/reactivate`, { method: 'POST', headers });
            const data = await res.json();

            if (res.ok && data.success) {
                showToast(`✓ Provider #${providerId} reactivated successfully.`, 'success');
                await loadDashboardData();
            } else {
                showToast(`✕ ${data.message || 'Failed to reactivate provider.'}`, 'error');
            }
        } catch (e) {
            showToast('✕ Error connecting to backend server.', 'error');
        }
    };

    // Live Multi-Entity Search Handler
    let searchDebounceTimer = null;
    if (adminSearchInput) {
        adminSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(searchDebounceTimer);

            if (query.length < 2) return;

            searchDebounceTimer = setTimeout(async () => {
                try {
                    const headers = getAdminHeaders();
                    const res = await fetch(`http://localhost:5000/api/admin/search?q=${encodeURIComponent(query)}`, { headers });
                    const data = await res.json();

                    if (res.ok && data.success) {
                        renderSearchResultsModal(query, data.results);
                    }
                } catch (e) {
                    console.warn('Search query error:', e.message);
                }
            }, 300);
        });
    }

    // Render Search Results Modal
    const renderSearchResultsModal = (query, results) => {
        const modal = document.getElementById('modal-admin-search-results');
        const body = document.getElementById('admin-search-results-body');
        if (!modal || !body) return;

        const { clients, providers, applications, bookings } = results;

        body.innerHTML = `
            <div style="margin-bottom:16px; font-size:0.9rem; color:#64748b;">
                Showing search results for "<strong style="color:#0a192f;">${query}</strong>":
            </div>
            ${clients.length > 0 ? `
                <div style="margin-bottom:18px;">
                    <h4 style="margin:0 0 8px 0; color:#2563eb; font-size:0.95rem;"><i class="fa-solid fa-users"></i> Registered Clients (${clients.length})</h4>
                    ${clients.map(c => `<div style="padding:8px 12px; background:#f8fafc; border-radius:8px; margin-bottom:6px; font-size:0.86rem; color:#0a192f;"><strong>${c.FullName}</strong> (${c.Email}) - ${c.Phone || 'No Phone'}</div>`).join('')}
                </div>
            ` : ''}
            ${providers.length > 0 ? `
                <div style="margin-bottom:18px;">
                    <h4 style="margin:0 0 8px 0; color:#2563eb; font-size:0.95rem;"><i class="fa-solid fa-store"></i> Service Providers (${providers.length})</h4>
                    ${providers.map(p => `<div style="padding:8px 12px; background:#f8fafc; border-radius:8px; margin-bottom:6px; font-size:0.86rem; color:#0a192f;"><strong>${p.BusinessName}</strong> (Owner: ${p.OwnerName}) - ${p.CoverageArea}</div>`).join('')}
                </div>
            ` : ''}
            ${applications.length > 0 ? `
                <div style="margin-bottom:18px;">
                    <h4 style="margin:0 0 8px 0; color:#2563eb; font-size:0.95rem;"><i class="fa-solid fa-file-signature"></i> Applications (${applications.length})</h4>
                    ${applications.map(a => `<div style="padding:8px 12px; background:#f8fafc; border-radius:8px; margin-bottom:6px; font-size:0.86rem; color:#0a192f;">App #${a.ApplicationID}: <strong>${a.BusinessName}</strong> (Status: ${a.Status})</div>`).join('')}
                </div>
            ` : ''}
            ${bookings.length > 0 ? `
                <div style="margin-bottom:18px;">
                    <h4 style="margin:0 0 8px 0; color:#2563eb; font-size:0.95rem;"><i class="fa-solid fa-calendar-check"></i> Bookings (${bookings.length})</h4>
                    ${bookings.map(b => `<div style="padding:8px 12px; background:#f8fafc; border-radius:8px; margin-bottom:6px; font-size:0.86rem; color:#0a192f;">Booking #${b.BookingID}: <strong>${b.PackageName}</strong> - ₱${b.TotalAmount} (${b.BookingStatus})</div>`).join('')}
                </div>
            ` : ''}
            ${(clients.length === 0 && providers.length === 0 && applications.length === 0 && bookings.length === 0) ? `
                <div style="text-align:center; padding:30px; color:#64748b;">No matching records found for "${query}".</div>
            ` : ''}
        `;

        modal.classList.remove('hidden');
    };

    // ------------------------------------------------------------------------
    // Admin Notification System Integration (SQL Server)
    // ------------------------------------------------------------------------
    const btnNotificationBell = document.getElementById('btn-notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationList = document.getElementById('notification-list');
    const btnMarkAllRead = document.getElementById('btn-mark-all-read');
    const dropdownTabAll = document.getElementById('dropdown-tab-all');
    const dropdownTabUnread = document.getElementById('dropdown-tab-unread');
    const btnViewAllNotifs = document.getElementById('btn-view-all-notifications');
    const modalNotifHistory = document.getElementById('modal-notification-history');
    const btnCloseNotifHistory = document.getElementById('btn-close-notification-history');

    let adminNotificationsData = [];
    let currentNotifFilter = 'all';

    // Toggle Dropdown Panel on Bell Click
    if (btnNotificationBell && notificationPanel) {
        btnNotificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationPanel.classList.toggle('hidden');
            if (!notificationPanel.classList.contains('hidden')) {
                loadAdminNotifications();
            }
        });
    }

    // Close Notification Panel on Outside Click
    document.addEventListener('click', (e) => {
        const container = document.querySelector('.notification-container');
        if (notificationPanel && !notificationPanel.classList.contains('hidden')) {
            if (container && !container.contains(e.target)) {
                notificationPanel.classList.add('hidden');
            }
        }
    });

    // Tab Filter Handlers (All vs Unread)
    if (dropdownTabAll && dropdownTabUnread) {
        dropdownTabAll.addEventListener('click', () => {
            currentNotifFilter = 'all';
            dropdownTabAll.style.background = '#2563eb';
            dropdownTabAll.style.color = '#ffffff';
            dropdownTabUnread.style.background = '#e2e8f0';
            dropdownTabUnread.style.color = '#475569';
            renderNotificationItems(adminNotificationsData);
        });

        dropdownTabUnread.addEventListener('click', () => {
            currentNotifFilter = 'unread';
            dropdownTabUnread.style.background = '#2563eb';
            dropdownTabUnread.style.color = '#ffffff';
            dropdownTabAll.style.background = '#e2e8f0';
            dropdownTabAll.style.color = '#475569';
            renderNotificationItems(adminNotificationsData);
        });
    }

    // Fetch Admin Notifications from SQL Server API
    const loadAdminNotifications = async () => {
        if (!getAdminToken()) return;

        try {
            const headers = getAdminHeaders();
            const res = await fetch('http://localhost:5000/api/notifications', { headers });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    adminNotificationsData = data.notifications || [];
                    const unreadCount = data.unreadCount || 0;

                    // Update Unread Counter Badge
                    if (notificationBadge) {
                        if (unreadCount > 0) {
                            notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                            notificationBadge.classList.remove('hidden');
                        } else {
                            notificationBadge.classList.add('hidden');
                        }
                    }

                    renderNotificationItems(adminNotificationsData);
                }
            }
        } catch (err) {
            console.warn('Error fetching admin notifications:', err.message);
        }
    };

    // Render Notifications List
    const renderNotificationItems = (notifs) => {
        if (!notificationList) return;

        const filtered = currentNotifFilter === 'unread' 
            ? notifs.filter(n => !n.IsRead)
            : notifs;

        if (!filtered || filtered.length === 0) {
            notificationList.innerHTML = `
                <div style="padding:28px 16px; text-align:center; color:#64748b; font-size:0.88rem;">
                    <i class="fa-solid fa-bell-slash" style="font-size:1.8rem; color:#cbd5e1; margin-bottom:8px; display:block;"></i>
                    No notifications yet.
                </div>
            `;
            return;
        }

        notificationList.innerHTML = filtered.map(n => {
            const isUnread = !n.IsRead;
            const bg = isUnread ? '#eff6ff' : '#ffffff';
            const iconColor = n.NotificationType === 'Application' ? '#2563eb' : (n.NotificationType === 'Booking' ? '#10b981' : '#f59e0b');
            const iconClass = n.NotificationType === 'Application' ? 'fa-file-signature' : (n.NotificationType === 'Booking' ? 'fa-calendar-check' : 'fa-bell');

            return `
                <div class="notification-item" data-id="${n.NotificationID}" data-type="${n.NotificationType || ''}" data-title="${n.Title || ''}" style="padding:12px 16px; background:${bg}; border-bottom:1px solid #f1f5f9; display:flex; gap:12px; align-items:flex-start; cursor:pointer; transition:background 0.2s ease;">
                    <div style="width:34px; height:34px; border-radius:50%; background:#ffffff; border:1px solid #e2e8f0; color:${iconColor}; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <strong style="font-size:0.86rem; color:#0a192f;">${n.Title}</strong>
                            ${isUnread ? '<span style="width:8px; height:8px; border-radius:50%; background:#2563eb; display:inline-block; margin-left:6px;"></span>' : ''}
                        </div>
                        <p style="font-size:0.78rem; color:#475569; margin:2px 0 4px 0; line-height:1.4;">${n.Message}</p>
                        <span style="font-size:0.72rem; color:#94a3b8;">${new Date(n.CreatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Attach Click Listeners to Individual Notification Items
        notificationList.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', async () => {
                const notifId = item.getAttribute('data-id');
                const type = item.getAttribute('data-type');
                const title = item.getAttribute('data-title');

                // Mark Notification as Read in SQL Server
                try {
                    const headers = getAdminHeaders();
                    await fetch(`http://localhost:5000/api/notifications/${notifId}/read`, { method: 'PUT', headers });
                } catch (e) {
                    console.warn('Error marking notification read:', e.message);
                }

                // Close Notification Panel
                if (notificationPanel) notificationPanel.classList.add('hidden');

                // Reload Notifications & Unread Counter
                await loadAdminNotifications();

                // Target Tab Navigation
                if (type === 'Application' || title.includes('Application')) {
                    document.getElementById('nav-item-apps')?.click();
                } else if (type === 'Provider' || title.includes('Provider')) {
                    document.getElementById('nav-item-providers')?.click();
                } else if (type === 'Booking' || title.includes('Booking')) {
                    document.getElementById('nav-item-bookings')?.click();
                } else if (type === 'Payment' || title.includes('Payment')) {
                    document.getElementById('nav-item-revenue')?.click();
                }
            });
        });
    };

    // Mark All Notifications as Read Action
    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener('click', async () => {
            if (!getAdminToken()) return;

            try {
                const headers = getAdminHeaders();
                const res = await fetch('http://localhost:5000/api/notifications/read-all', { method: 'PUT', headers });

                if (res.ok) {
                    showToast('✓ All notifications marked as read.', 'success');
                    if (notificationBadge) notificationBadge.classList.add('hidden');
                    await loadAdminNotifications();
                }
            } catch (err) {
                console.warn('Error marking all as read:', err.message);
            }
        });
    }

    // View All Notifications History Modal Handler
    if (btnViewAllNotifs && modalNotifHistory) {
        btnViewAllNotifs.addEventListener('click', () => {
            if (notificationPanel) notificationPanel.classList.add('hidden');
            modalNotifHistory.classList.remove('hidden');
            renderHistoryNotificationList(adminNotificationsData);
        });
    }

    if (btnCloseNotifHistory && modalNotifHistory) {
        btnCloseNotifHistory.addEventListener('click', () => {
            modalNotifHistory.classList.add('hidden');
        });
    }

    const renderHistoryNotificationList = (notifs) => {
        const historyList = document.getElementById('history-notification-list');
        if (!historyList) return;

        if (!notifs || notifs.length === 0) {
            historyList.innerHTML = `<div style="padding:40px; text-align:center; color:#64748b;">No notification history found.</div>`;
            return;
        }

        historyList.innerHTML = notifs.map(n => `
            <div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; background:${n.IsRead ? '#fff' : '#eff6ff'}; display:flex; gap:14px; align-items:flex-start;">
                <div style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:2px;">
                    <i class="fa-solid fa-bell"></i>
                </div>
                <div style="flex:1;">
                    <strong style="font-size:0.92rem; color:#0a192f; display:block;">${n.Title}</strong>
                    <p style="font-size:0.84rem; color:#475569; margin:4px 0 6px 0;">${n.Message}</p>
                    <span style="font-size:0.75rem; color:#94a3b8;">${new Date(n.CreatedAt).toLocaleString()}</span>
                </div>
            </div>
        `).join('');
    };

    // Background Real-Time Polling Interval (Every 15 Seconds)
    setInterval(loadAdminNotifications, 15000);
    await loadAdminNotifications();

    // Initial Dashboard Data Fetch & View Router Trigger
    await loadDashboardData();
    switchAdminView(window.location.hash);
});

// ============================================================================
// WITHDRAWAL MANAGEMENT — Global functions for the Withdrawals view panel
// ============================================================================

let _wdAllData = []; // cached withdrawal data for client-side filtering
let _wdInitialised = false; // one-time event-listener guard
let _wdPlatformIncome = 0; // cached total platform revenue

/**
 * Handle Withdraw via PayMongo button click in Withdrawal Management.
/**
 * Handle "Withdraw via PayMongo" button click from Admin Dashboard.
 * Directs directly to PayMongo Portal & Disbursal Gateway to see all client payments and withdraw.
 */
function handleWithdrawViaPayMongo() {
    window.open('https://dashboard.paymongo.com/payouts', '_blank');
}

/**
 * Load all admin withdrawal requests from the API and populate the table.
 * Called automatically by switchAdminView when navigating to #withdrawal-section.
 */
async function loadWithdrawalsPage() {
    const tbody = document.getElementById('table-withdrawal-requests');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading withdrawal requests...</td></tr>`;

    try {
        const [res, pRes] = await Promise.all([
            fetch('/api/admin/withdrawals/list', {
                headers: getAdminHeaders()
            }),
            fetch('/api/admin/payments/overview', {
                headers: getAdminHeaders()
            }).catch(() => null)
        ]);

        if (handleAdminAuthError(res)) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        _wdAllData = data.withdrawals || [];

        if (pRes && pRes.ok) {
            try {
                const pData = await pRes.json();
                if (pData && pData.success && pData.totalClientPayments) {
                    _wdCachedClientPaid = pData.totalClientPayments;
                }
            } catch (pe) {
                console.warn('Notice parsing payments overview:', pe);
            }
        }

        // Update summary stats directly
        _wdUpdateStats(_wdAllData);

        // Apply current filter and render
        _wdRenderTable(_wdAllData);

        // Wire up filter, refresh & PayMongo buttons (only once)
        if (!_wdInitialised) {
            _wdInitialised = true;

            const filterSel = document.getElementById('wd-filter-status');
            if (filterSel) {
                filterSel.addEventListener('change', () => {
                    const val = filterSel.value;
                    const filtered = val === 'all' ? _wdAllData : _wdAllData.filter(w => w.Status === val);
                    _wdRenderTable(filtered);
                });
            }

            const btnRefresh = document.getElementById('btn-refresh-withdrawals');
            if (btnRefresh) {
                btnRefresh.addEventListener('click', () => {
                    _wdInitialised = false; // allow re-wiring after refresh
                    loadWithdrawalsPage();
                });
            }

            // Wire up PayMongo top and card buttons
            const btnTop = document.getElementById('btn-top-withdraw-paymongo');
            if (btnTop) btnTop.addEventListener('click', handleWithdrawViaPayMongo);

            const btnCard = document.getElementById('btn-card-withdraw-paymongo');
            if (btnCard) btnCard.addEventListener('click', handleWithdrawViaPayMongo);

            // Modal close events
            const btnCloseModal = document.getElementById('btn-close-paymongo-select-modal');
            if (btnCloseModal) {
                btnCloseModal.addEventListener('click', () => {
                    document.getElementById('modal-paymongo-select-payout')?.classList.add('hidden');
                });
            }
            const btnCancelModal = document.getElementById('btn-cancel-paymongo-select-modal');
            if (btnCancelModal) {
                btnCancelModal.addEventListener('click', () => {
                    document.getElementById('modal-paymongo-select-payout')?.classList.add('hidden');
                });
            }
        }
    } catch (err) {
        console.error('loadWithdrawalsPage error:', err);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>Failed to load withdrawal requests. Please try again.</td></tr>`;
    }
}

/** Update the summary stat cards at the top of the Withdrawal panel */
function _wdUpdateStats(withdrawals) {
    const total   = withdrawals.length;
    const pending = withdrawals.filter(w => w.Status === 'Pending').length;
    const paid    = withdrawals.filter(w => w.Status === 'Approved' || w.Status === 'Processed').length;
    const totalWithdrawn = withdrawals
        .filter(w => w.Status === 'Approved' || w.Status === 'Processed')
        .reduce((sum, w) => sum + (parseFloat(w.Amount) || 0), 0);
    const clientPaid = _wdCachedClientPaid || 10280;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('wd-stat-total',    total);
    setEl('wd-stat-pending',  pending);
    setEl('wd-stat-approved', paid);
    setEl('wd-stat-income',   `₱${clientPaid.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    setEl('wd-stat-amount',   `₱${totalWithdrawn.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    // Update sidebar badge
    const badge = document.getElementById('badge-pending-withdrawals');
    if (badge) {
        if (pending > 0) { badge.textContent = pending; badge.style.display = ''; }
        else             { badge.style.display = 'none'; }
    }
}

/** Render the withdrawal rows into the table body */
function _wdRenderTable(withdrawals) {
    const tbody = document.getElementById('table-withdrawal-requests');
    if (!tbody) return;

    if (!withdrawals || withdrawals.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:40px;color:#64748b;"><i class="fa-solid fa-inbox" style="font-size:1.8rem;margin-bottom:8px;display:block;color:#cbd5e1;"></i>No withdrawal requests found.</td></tr>`;
        return;
    }

    const statusBadge = (status) => {
        if (status === 'Pending')  return `<span style="display:inline-flex;align-items:center;gap:5px;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid fa-clock"></i> Pending</span>`;
        if (status === 'Approved') return `<span style="display:inline-flex;align-items:center;gap:5px;background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Paid & Sent</span>`;
        return `<span style="background:#e2e8f0;color:#475569;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">${status}</span>`;
    };

    const channelIcon = (channel) => {
        const map = { 'GCash': 'fa-mobile-screen-button', 'Maya': 'fa-credit-card', 'Bank': 'fa-building-columns' };
        return `<i class="fa-solid ${map[channel] || 'fa-money-bill'}" style="margin-right:6px;color:#2563eb;"></i>${channel || '—'}`;
    };

    tbody.innerHTML = withdrawals.map(w => `
        <tr>
            <td style="font-weight:700;color:#2563eb;font-size:0.82rem;">#WD-${w.WithdrawalID}</td>
            <td>
                <div style="font-weight:700;color:#0a192f;font-size:0.88rem;">${escHtml(w.ProviderName || w.BusinessName || '—')}</div>
                <div style="font-size:0.76rem;color:#64748b;">${escHtml(w.ProviderEmail || '')}</div>
            </td>
            <td style="font-weight:800;color:#0a192f;">₱${parseFloat(w.Amount || 0).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>${channelIcon(w.PayoutMethod || w.WithdrawalMethod)}</td>
            <td style="font-size:0.86rem;">${escHtml(w.AccountName || '—')}</td>
            <td style="font-size:0.86rem;font-family:monospace;">${escHtml(w.AccountNumber || w.MobileNumber || w.AccountReference || '—')}</td>
            <td style="font-size:0.82rem;color:#475569;">${w.CreatedAt ? new Date(w.CreatedAt).toLocaleDateString('en-PH',{year:'numeric',month:'short',day:'numeric'}) : '—'}</td>
            <td>${statusBadge(w.Status)}</td>
            <td>
                ${w.Status === 'Pending'
                    ? `<button type="button"
                            onclick="wdApprove(${w.WithdrawalID}, '${escHtml(w.ProviderName || w.BusinessName || '')}', ${parseFloat(w.Amount || 0).toFixed(2)}, '${escHtml(w.PayoutMethod || w.WithdrawalMethod || '')}', '${escHtml(w.AccountName || '')}', '${escHtml(w.AccountNumber || w.MobileNumber || w.AccountReference || '')}')"
                            style="padding:7px 14px; font-size:0.8rem; font-weight:700; border:none; border-radius:8px; background:linear-gradient(135deg,#10b981,#059669); color:#fff; cursor:pointer; display:inline-flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(16,185,129,0.3); transition:all 0.2s;">
                            <i class="fa-solid fa-paper-plane"></i> Mark as Paid
                        </button>`
                    : `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.8rem; color:#059669; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Paid &amp; Sent</span>`
                }
            </td>
        </tr>
    `).join('');
}

/** Approve (mark as paid) a single withdrawal request */
async function wdApprove(id, providerName, amount, method, accName, accRef) {
    const confirmed = confirm(
        `Confirm payout to ${providerName}?\n\n` +
        `Amount : ₱${parseFloat(amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}\n` +
        `Channel: ${method}\n` +
        `Account: ${accName} — ${accRef}\n\n` +
        `Click OK only after you have manually sent the funds.`
    );
    if (!confirmed) return;

    try {
        const res = await fetch(`/api/admin/withdrawals/${id}/approve`, {
            method: 'PUT',
            headers: getAdminHeaders()
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
            alert('❌ Failed to mark withdrawal as paid: ' + (data.message || 'Unknown error'));
            return;
        }

        alert(`✅ Withdrawal #WD-${id} has been marked as Paid & Sent.`);
        // Refresh the page data
        _wdInitialised = false;
        await loadWithdrawalsPage();
    } catch (err) {
        console.error('wdApprove error:', err);
        alert('❌ A network error occurred. Please try again.');
    }
}

/** Simple HTML escape helper (may already exist elsewhere in the file) */
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ============================================================================
// CLIENT REPORTS MANAGEMENT
// ============================================================================
let _repAllData = [];
let _repInitialised = false;

/**
 * Load all client reports from API
 */
async function loadClientReportsPage() {
    const tbody = document.getElementById('table-client-reports');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading client reports...</td></tr>`;

    try {
        const headers = getAdminHeaders();
        const res = await fetch('/api/admin/reports', {
            headers
        });
        if (handleAdminAuthError(res)) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        _repAllData = data.reports || [];

        // Update Stat Cards & Badges
        if (data.stats) {
            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setEl('rep-stat-total', data.stats.total || 0);
            setEl('rep-stat-pending', data.stats.pending || 0);
            setEl('rep-stat-resolved', data.stats.resolved || 0);
            setEl('rep-stat-dismissed', data.stats.dismissed || 0);
            setEl('rep-stat-suspended', data.stats.suspendedProviders || 0);

            const badgeReports = document.getElementById('badge-pending-reports');
            if (badgeReports) {
                if (data.stats.pending > 0) {
                    badgeReports.textContent = data.stats.pending;
                    badgeReports.style.display = 'inline-block';
                } else {
                    badgeReports.style.display = 'none';
                }
            }
        }

        _repRenderTable(_repAllData);

        if (!_repInitialised) {
            _repInitialised = true;

            const filterSel = document.getElementById('rep-filter-status');
            const searchInput = document.getElementById('rep-search-input');
            const btnRefresh = document.getElementById('btn-refresh-reports');

            const applyRepFilter = () => {
                const statusVal = filterSel ? filterSel.value : 'all';
                const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

                const filtered = _repAllData.filter(r => {
                    const matchStatus = statusVal === 'all' || r.Status === statusVal;
                    const matchSearch = !searchVal ||
                        (r.ReporterName || '').toLowerCase().includes(searchVal) ||
                        (r.ReporterEmail || '').toLowerCase().includes(searchVal) ||
                        (r.ProviderBusinessName || '').toLowerCase().includes(searchVal) ||
                        (r.ProviderOwnerName || '').toLowerCase().includes(searchVal) ||
                        (r.Reason || '').toLowerCase().includes(searchVal) ||
                        String(r.ReportID).includes(searchVal);
                    return matchStatus && matchSearch;
                });

                _repRenderTable(filtered);
            };

            if (filterSel) filterSel.addEventListener('change', applyRepFilter);
            if (searchInput) searchInput.addEventListener('input', applyRepFilter);
            if (btnRefresh) {
                btnRefresh.addEventListener('click', () => {
                    _repInitialised = false;
                    loadClientReportsPage();
                });
            }
        }
    } catch (err) {
        console.error('loadClientReportsPage error:', err);
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>Failed to load client reports. Please try again.</td></tr>`;
    }
}

/** Render client reports table */
function _repRenderTable(reports) {
    const tbody = document.getElementById('table-client-reports');
    if (!tbody) return;

    if (!reports || reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:#64748b;"><i class="fa-solid fa-inbox" style="font-size:1.8rem;margin-bottom:8px;display:block;color:#cbd5e1;"></i>No client reports found matching criteria.</td></tr>`;
        return;
    }

    const statusBadge = (status) => {
        if (status === 'Pending') return `<span style="display:inline-flex;align-items:center;gap:5px;background:#fef2f2;color:#b91c1c;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid fa-clock"></i> Pending Review</span>`;
        if (status === 'Under Review') return `<span style="display:inline-flex;align-items:center;gap:5px;background:#fef3c7;color:#92400e;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid fa-magnifying-glass"></i> Under Review</span>`;
        if (status === 'Resolved') return `<span style="display:inline-flex;align-items:center;gap:5px;background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid fa-circle-check"></i> Resolved</span>`;
        if (status === 'Dismissed') return `<span style="display:inline-flex;align-items:center;gap:5px;background:#f1f5f9;color:#475569;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid fa-ban"></i> Dismissed</span>`;
        return `<span style="background:#e2e8f0;color:#475569;padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;">${status}</span>`;
    };

    tbody.innerHTML = reports.map(r => {
        const isSuspended = r.ProviderAccountStatus === 'Suspended';
        return `
            <tr>
                <td style="font-weight:700;color:#e11d48;font-size:0.82rem;">#REP-${r.ReportID}</td>
                <td>
                    <div style="font-weight:700;color:#0a192f;font-size:0.88rem;">${escHtml(r.ReporterName || 'Client')}</div>
                    <div style="font-size:0.76rem;color:#64748b;">${escHtml(r.ReporterEmail || '')}</div>
                </td>
                <td>
                    <div style="font-weight:700;color:#0a192f;font-size:0.88rem;">
                        ${escHtml(r.ProviderBusinessName || 'Provider')}
                        ${isSuspended ? '<span style="font-size:0.7rem;background:#fee2e2;color:#991b1b;padding:2px 6px;border-radius:6px;margin-left:4px;font-weight:800;">Suspended</span>' : ''}
                    </div>
                    <div style="font-size:0.76rem;color:#64748b;">Owner: ${escHtml(r.ProviderOwnerName || r.ProviderEmail || 'N/A')}</div>
                </td>
                <td>
                    <span style="display:inline-block;max-width:210px;font-size:0.84rem;font-weight:600;color:#334155;">
                        <i class="fa-solid fa-triangle-exclamation" style="color:#e11d48;margin-right:4px;"></i>${escHtml(r.Reason)}
                    </span>
                </td>
                <td style="font-size:0.82rem;color:#475569;">
                    ${r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                </td>
                <td>${statusBadge(r.Status)}</td>
                <td>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button type="button" onclick="viewAdminReportDetails(${r.ReportID})"
                            style="padding:6px 12px;font-size:0.78rem;font-weight:700;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#0a192f;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.2s;">
                            <i class="fa-solid fa-eye" style="color:#2563eb;"></i> View
                        </button>
                        ${r.Status === 'Pending' || r.Status === 'Under Review' ? `
                            <button type="button" onclick="adminQuickResolveReport(${r.ReportID})"
                                style="padding:6px 12px;font-size:0.78rem;font-weight:700;border:none;border-radius:8px;background:#10b981;color:#fff;cursor:pointer;display:inline-flex;align-items:center;gap:4px;">
                                <i class="fa-solid fa-check"></i> Resolve
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/** Open View Detailed Client Report Modal */
window.viewAdminReportDetails = function(reportId) {
    const report = _repAllData.find(r => r.ReportID === reportId);
    if (!report) return;

    const modal = document.getElementById('modal-admin-report-detail');
    const titleSpan = document.getElementById('report-detail-id-display');
    const bodyEl = document.getElementById('admin-report-detail-body');
    const actionsEl = document.getElementById('admin-report-detail-actions');

    if (!modal || !bodyEl) return;

    if (titleSpan) titleSpan.textContent = `#REP-${report.ReportID}`;

    const isSuspended = report.ProviderAccountStatus === 'Suspended';

    bodyEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 8px 0;color:#0a192f;font-size:0.92rem;display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-user" style="color:#2563eb;"></i> Reporter Client
                </h4>
                <div style="font-size:0.86rem;color:#334155;"><strong>Name:</strong> ${escHtml(report.ReporterName || 'N/A')}</div>
                <div style="font-size:0.86rem;color:#334155;margin-top:4px;"><strong>Email:</strong> ${escHtml(report.ReporterEmail || 'N/A')}</div>
                <div style="font-size:0.86rem;color:#334155;margin-top:4px;"><strong>Phone:</strong> ${escHtml(report.ReporterPhone || 'N/A')}</div>
            </div>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
                <h4 style="margin:0 0 8px 0;color:#0a192f;font-size:0.92rem;display:flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-store" style="color:#e11d48;"></i> Reported Provider
                </h4>
                <div style="font-size:0.86rem;color:#334155;"><strong>Business:</strong> ${escHtml(report.ProviderBusinessName || 'N/A')}</div>
                <div style="font-size:0.86rem;color:#334155;margin-top:4px;"><strong>Owner:</strong> ${escHtml(report.ProviderOwnerName || 'N/A')}</div>
                <div style="font-size:0.86rem;color:#334155;margin-top:4px;">
                    <strong>Account Status:</strong> 
                    ${isSuspended ? '<span style="color:#b91c1c;font-weight:800;">Suspended</span>' : '<span style="color:#10b981;font-weight:700;">Active</span>'}
                </div>
            </div>
        </div>

        <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:12px;padding:16px;">
            <div style="font-size:0.75rem;font-weight:800;color:#9f1239;text-transform:uppercase;letter-spacing:0.04em;">Reported Violation</div>
            <h4 style="margin:4px 0 8px 0;color:#881337;font-size:1.05rem;">${escHtml(report.Reason)}</h4>
            ${report.BookingReference ? `<div style="font-size:0.82rem;color:#be123c;margin-bottom:8px;">Associated Booking: <strong>${escHtml(report.BookingReference)}</strong> (${escHtml(report.BookingPackageName || '')})</div>` : ''}
            <div style="background:#ffffff;border:1px solid #fecdd3;border-radius:8px;padding:14px;font-size:0.88rem;color:#0a192f;line-height:1.5;white-space:pre-wrap;">${escHtml(report.Description)}</div>
            <div style="font-size:0.76rem;color:#9f1239;margin-top:8px;">Date Filed: ${report.CreatedAt ? new Date(report.CreatedAt).toLocaleString() : 'N/A'}</div>
        </div>

        <div>
            <label style="display:block;font-size:0.84rem;font-weight:700;color:#334155;margin-bottom:6px;">Administrator Action Notes:</label>
            <textarea id="input-admin-report-notes" rows="3" style="width:100%;padding:10px 14px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.86rem;font-family:inherit;box-sizing:border-box;" placeholder="Enter internal administrative notes or resolution summary...">${escHtml(report.AdminNotes || '')}</textarea>
        </div>
    `;

    actionsEl.innerHTML = `
        <div style="display:flex;gap:8px;">
            ${!isSuspended ? `
                <button type="button" onclick="adminExecuteReportAction(${report.ReportID}, '${report.Status}', true)"
                    style="padding:8px 16px;border:none;border-radius:8px;background:#e11d48;color:#fff;cursor:pointer;font-weight:700;font-size:0.82rem;display:inline-flex;align-items:center;gap:6px;">
                    <i class="fa-solid fa-ban"></i> Suspend Provider
                </button>
            ` : ''}
        </div>
        <div style="display:flex;gap:8px;">
            <button type="button" onclick="document.getElementById('modal-admin-report-detail').classList.add('hidden')"
                style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;color:#475569;cursor:pointer;font-weight:600;font-size:0.82rem;">
                Close
            </button>
            <button type="button" onclick="adminExecuteReportAction(${report.ReportID}, 'Dismissed')"
                style="padding:8px 16px;border:1px solid #cbd5e1;border-radius:8px;background:#f1f5f9;color:#475569;cursor:pointer;font-weight:700;font-size:0.82rem;">
                Dismiss Report
            </button>
            <button type="button" onclick="adminExecuteReportAction(${report.ReportID}, 'Under Review')"
                style="padding:8px 16px;border:none;border-radius:8px;background:#f59e0b;color:#fff;cursor:pointer;font-weight:700;font-size:0.82rem;">
                Mark Under Review
            </button>
            <button type="button" onclick="adminExecuteReportAction(${report.ReportID}, 'Resolved')"
                style="padding:8px 20px;border:none;border-radius:8px;background:#10b981;color:#fff;cursor:pointer;font-weight:800;font-size:0.82rem;display:inline-flex;align-items:center;gap:6px;">
                <i class="fa-solid fa-check"></i> Resolve Dispute
            </button>
        </div>
    `;

    modal.classList.remove('hidden');
};

/** Quick resolve button from table */
window.adminQuickResolveReport = async function(reportId) {
    if (!confirm(`Resolve client Report #${reportId}?`)) return;
    await adminExecuteReportAction(reportId, 'Resolved');
};

/** Execute report status update */
window.adminExecuteReportAction = async function(reportId, newStatus, suspendProvider = false) {
    const notes = document.getElementById('input-admin-report-notes')?.value || '';

    if (suspendProvider) {
        if (!confirm(`⚠️ Are you sure you want to SUSPEND the reported service provider account? They will lose access to accept bookings.`)) return;
    }

    try {
        const res = await fetch(`/api/admin/reports/${reportId}/status`, {
            method: 'PUT',
            headers: getAdminHeaders(),
            body: JSON.stringify({
                status: newStatus,
                adminNotes: notes,
                suspendProvider
            })
        });

        const data = await res.json();
        if (res.ok && data.success) {
            alert(`✅ ${data.message}`);
            document.getElementById('modal-admin-report-detail')?.classList.add('hidden');
            _repInitialised = false;
            await loadClientReportsPage();
            if (typeof loadDashboardData === 'function') loadDashboardData();
        } else {
            alert(`❌ Error: ${data.message || 'Failed to update report.'}`);
        }
    } catch (err) {
        console.error('adminExecuteReportAction error:', err);
        alert('❌ Network error updating report status.');
    }
};

// ============================================================================
// SYSTEM AUDIT TRAIL
// ============================================================================
let _auditAllData = [];
let _auditInitialised = false;

/**
 * Load all audit trail logs from API
 */
async function loadAuditTrailPage() {
    const tbody = document.getElementById('table-audit-trail');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i>Loading system audit logs...</td></tr>`;

    try {
        const headers = getAdminHeaders();
        const res = await fetch('/api/admin/audit-logs', {
            headers
        });
        if (handleAdminAuthError(res)) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        _auditAllData = data.auditLogs || [];

        const counterSpan = document.getElementById('audit-log-counter');
        if (counterSpan) counterSpan.textContent = `Showing ${_auditAllData.length} events`;

        _auditRenderTable(_auditAllData);

        if (!_auditInitialised) {
            _auditInitialised = true;

            const filterSel = document.getElementById('audit-filter-action');
            const searchInput = document.getElementById('audit-search-input');
            const btnRefresh = document.getElementById('btn-refresh-audit');

            const applyAuditFilter = () => {
                const actionVal = filterSel ? filterSel.value : 'all';
                const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : '';

                const filtered = _auditAllData.filter(log => {
                    const matchAction = actionVal === 'all' || (log.Action || '').toLowerCase().includes(actionVal.toLowerCase());
                    const matchSearch = !searchVal ||
                        (log.Action || '').toLowerCase().includes(searchVal) ||
                        (log.Description || '').toLowerCase().includes(searchVal) ||
                        (log.ActorName || '').toLowerCase().includes(searchVal) ||
                        (log.ActorEmail || '').toLowerCase().includes(searchVal) ||
                        (log.EntityType || '').toLowerCase().includes(searchVal) ||
                        String(log.LogID).includes(searchVal);
                    return matchAction && matchSearch;
                });

                if (counterSpan) counterSpan.textContent = `Showing ${filtered.length} of ${_auditAllData.length} events`;
                _auditRenderTable(filtered);
            };

            if (filterSel) filterSel.addEventListener('change', applyAuditFilter);
            if (searchInput) searchInput.addEventListener('input', applyAuditFilter);
            if (btnRefresh) {
                btnRefresh.addEventListener('click', () => {
                    _auditInitialised = false;
                    loadAuditTrailPage();
                });
            }
        }
    } catch (err) {
        console.error('loadAuditTrailPage error:', err);
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>Failed to load audit logs. Please try again.</td></tr>`;
    }
}

/** Render audit trail table */
function _auditRenderTable(logs) {
    const tbody = document.getElementById('table-audit-trail');
    if (!tbody) return;

    if (!logs || logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:#64748b;"><i class="fa-solid fa-inbox" style="font-size:1.8rem;margin-bottom:8px;display:block;color:#cbd5e1;"></i>No audit log events found matching criteria.</td></tr>`;
        return;
    }

    const actionBadge = (action) => {
        let bg = '#eff6ff';
        let color = '#1d4ed8';
        let icon = 'fa-circle-info';

        if (/report/i.test(action)) {
            bg = '#fff1f2'; color = '#be123c'; icon = 'fa-triangle-exclamation';
        } else if (/suspend/i.test(action)) {
            bg = '#fee2e2'; color = '#991b1b'; icon = 'fa-ban';
        } else if (/approv|reactivat|paid|resolv/i.test(action)) {
            bg = '#ecfdf5'; color = '#047857'; icon = 'fa-circle-check';
        } else if (/reject|dismiss/i.test(action)) {
            bg = '#f1f5f9'; color = '#475569'; icon = 'fa-xmark';
        } else if (/withdraw|payout/i.test(action)) {
            bg = '#f5f3ff'; color = '#6d28d9'; icon = 'fa-money-bill-transfer';
        }

        return `<span style="display:inline-flex;align-items:center;gap:6px;background:${bg};color:${color};padding:4px 10px;border-radius:20px;font-size:0.78rem;font-weight:700;"><i class="fa-solid ${icon}"></i> ${escHtml(action)}</span>`;
    };

    tbody.innerHTML = logs.map(l => `
        <tr>
            <td style="font-weight:700;color:#2563eb;font-size:0.82rem;">#LOG-${l.LogID}</td>
            <td style="font-size:0.82rem;color:#475569;white-space:nowrap;">
                ${l.CreatedAt ? new Date(l.CreatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
            </td>
            <td>
                <div style="font-weight:700;color:#0a192f;font-size:0.88rem;">${escHtml(l.ActorName || 'System')}</div>
                <div style="font-size:0.76rem;color:#64748b;">
                    ${escHtml(l.ActorEmail || '')}
                    <span style="background:#e2e8f0;color:#475569;padding:1px 6px;border-radius:4px;font-size:0.7rem;font-weight:700;margin-left:4px;">${escHtml(l.ActorRole || 'System')}</span>
                </div>
            </td>
            <td>${actionBadge(l.Action)}</td>
            <td style="font-size:0.86rem;color:#0a192f;max-width:320px;line-height:1.4;">${escHtml(l.Description)}</td>
            <td style="font-size:0.82rem;">
                ${l.EntityType ? `<span style="background:#f8fafc;border:1px solid #cbd5e1;padding:3px 8px;border-radius:6px;font-weight:700;color:#334155;">${escHtml(l.EntityType)}${l.EntityID ? ` #${l.EntityID}` : ''}</span>` : '—'}
            </td>
        </tr>
    `).join('');
}

/* ==========================================================================
   PROVIDER SUBSCRIPTIONS MONITORING (PAYMONGO + MSSQL)
   ========================================================================== */
let _subAllProviders = [];
let _subAllPayments = [];
let _subInitialised = false;

async function loadAdminSubscriptionsPage() {
    const tableSubs = document.getElementById('table-admin-subscriptions');
    const tablePayments = document.getElementById('table-admin-subscription-payments');

    if (tableSubs && _subAllProviders.length === 0) {
        tableSubs.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading provider subscriptions...</td></tr>`;
    }
    if (tablePayments && _subAllPayments.length === 0) {
        tablePayments.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:32px;color:#64748b;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading subscription payments...</td></tr>`;
    }

    try {
        const headers = getAdminHeaders();
        
        const res = await fetch('http://localhost:5000/api/subscriptions/admin/overview', {
            headers
        });
        if (handleAdminAuthError(res)) return;

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to fetch subscription overview');

        const ov = data.overview || {};
        _subAllProviders = data.subscriptions || [];
        _subAllPayments = data.payments || [];

        // Update KPI metric cards
        const elRev = document.getElementById('sub-stat-total-revenue');
        if (elRev) elRev.textContent = `₱${Number(ov.totalSubscriptionRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        const elActive = document.getElementById('sub-stat-active-count');
        if (elActive) elActive.textContent = ov.activeSubscriptions || 0;

        const elTrial = document.getElementById('sub-stat-trial-count');
        if (elTrial) elTrial.textContent = ov.freeTrialSubscriptions || 0;

        const elPaid = document.getElementById('sub-stat-paid-count');
        if (elPaid) elPaid.textContent = ov.paidSubscribers || 0;

        const elBreakdown = document.getElementById('sub-stat-paid-breakdown');
        if (elBreakdown) {
            elBreakdown.textContent = `${ov.monthlySubscribers || 0} Monthly (₱199) • ${ov.yearlySubscribers || 0} Yearly (₱1,990)`;
        }

        // Render Tables
        _renderAdminSubscriptionsTable(_subAllProviders);
        _renderAdminSubscriptionPaymentsTable(_subAllPayments);

        // Bind filter event listeners once
        if (!_subInitialised) {
            _subInitialised = true;

            const searchInput = document.getElementById('filter-admin-sub-search');
            const planSelect = document.getElementById('filter-admin-sub-plan');
            const statusSelect = document.getElementById('filter-admin-sub-status');
            const btnRefresh = document.getElementById('btn-refresh-admin-subscriptions');

            const applySubFilters = () => {
                const search = (searchInput ? searchInput.value : '').toLowerCase().trim();
                const plan = planSelect ? planSelect.value : '';
                const status = statusSelect ? statusSelect.value : '';

                const filtered = _subAllProviders.filter(sub => {
                    const matchSearch = !search ||
                        (sub.BusinessName && sub.BusinessName.toLowerCase().includes(search)) ||
                        (sub.FullName && sub.FullName.toLowerCase().includes(search)) ||
                        (sub.Email && sub.Email.toLowerCase().includes(search));

                    const matchPlan = !plan || (plan === 'None' ? (!sub.PlanType || sub.SubscriptionStatus === 'no_subscription') : sub.PlanType === plan);
                    const matchStatus = !status || sub.SubscriptionStatus === status;

                    return matchSearch && matchPlan && matchStatus;
                });

                _renderAdminSubscriptionsTable(filtered);
            };

            if (searchInput) searchInput.addEventListener('input', applySubFilters);
            if (planSelect) planSelect.addEventListener('change', applySubFilters);
            if (statusSelect) statusSelect.addEventListener('change', applySubFilters);
            if (btnRefresh) btnRefresh.addEventListener('click', () => {
                loadAdminSubscriptionsPage();
            });
        }
    } catch (err) {
        console.error('loadAdminSubscriptionsPage error:', err);
        if (tableSubs) {
            tableSubs.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:24px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error loading subscription directory: ${err.message}</td></tr>`;
        }
        if (tablePayments) {
            tablePayments.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:24px;color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> Error loading subscription payments: ${err.message}</td></tr>`;
        }
    }
}

function _renderAdminSubscriptionsTable(subs) {
    const tbody = document.getElementById('table-admin-subscriptions');
    if (!tbody) return;

    if (!subs || subs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:36px;color:#64748b;"><i class="fa-solid fa-crown" style="font-size:1.8rem;margin-bottom:8px;display:block;color:#cbd5e1;"></i>No provider subscriptions match your criteria.</td></tr>`;
        return;
    }

    const planBadge = (planType, status) => {
        const pt = String(planType || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const st = String(status || '').toLowerCase();
        if (!planType || st === 'no_subscription' || st === 'noplan') {
            return `<span style="background:#f1f5f9;color:#64748b;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;"><i class="fa-regular fa-circle"></i> None</span>`;
        }
        if (pt.includes('free') || pt.includes('trial')) {
            return `<span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;"><i class="fa-solid fa-gift" style="color:#2563eb;"></i> 1st Month Free</span>`;
        }
        if (pt.includes('monthly')) {
            return `<span style="background:#f5f3ff;color:#6d28d9;border:1px solid #ddd6fe;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;"><i class="fa-solid fa-calendar-days" style="color:#7c3aed;"></i> Monthly (₱199)</span>`;
        }
        if (pt.includes('yearly') || pt.includes('annual')) {
            return `<span style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;display:inline-flex;align-items:center;gap:5px;"><i class="fa-solid fa-crown" style="color:#f59e0b;"></i> Yearly (₱1,990)</span>`;
        }
        return `<span style="background:#f1f5f9;color:#334155;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">${planType}</span>`;
    };

    const statusBadge = (status) => {
        const st = String(status || '').toLowerCase();
        if (st === 'active') {
            return `<span style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-check"></i> Active</span>`;
        }
        if (st === 'expired' || st === 'superseded') {
            return `<span style="background:#fff1f2;color:#be123c;border:1px solid #fecdd3;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:800;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-clock-rotate-left"></i> Expired</span>`;
        }
        if (st === 'cancelled') {
            return `<span style="background:#fef2f2;color:#991b1b;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:800;">Cancelled</span>`;
        }
        return `<span style="background:#f8fafc;color:#64748b;border:1px solid #e2e8f0;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;">No Plan</span>`;
    };

    tbody.innerHTML = subs.map(sub => {
        const priceDisplay = sub.Price !== null && sub.Price !== undefined
            ? `₱${Number(sub.Price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '—';

        const startDate = sub.StartDate
            ? new Date(sub.StartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';

        const endDate = sub.EndDate
            ? new Date(sub.EndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '—';

        const subStatus = String(sub.SubscriptionStatus || sub.CurrentStatus || sub.Status || '').toLowerCase();
        let daysLeftHtml = '—';
        if (subStatus === 'active') {
            const d = sub.DaysRemaining !== null && sub.DaysRemaining !== undefined ? parseInt(sub.DaysRemaining, 10) : 0;
            const badgeColor = d <= 5 ? 'color:#b91c1c;background:#fee2e2;' : 'color:#15803d;background:#dcfce7;';
            daysLeftHtml = `<span style="${badgeColor} font-size:0.75rem;font-weight:800;padding:2px 8px;border-radius:10px;">${d} day${d === 1 ? '' : 's'} left</span>`;
        } else if (subStatus === 'expired' || subStatus === 'superseded') {
            daysLeftHtml = `<span style="color:#b91c1c;font-size:0.75rem;font-weight:700;">Ended</span>`;
        }

        const refCode = sub.PayMongoPaymentID || sub.PayMongoSessionID;
        const paymongoRef = refCode
            ? `<code style="background:#f1f5f9;color:#0a192f;padding:2px 6px;border-radius:4px;font-size:0.72rem;font-family:monospace;" title="${refCode}">${refCode.length > 14 ? refCode.slice(0, 14) + '...' : refCode}</code>`
            : '<span style="color:#94a3b8;font-size:0.78rem;">—</span>';

        return `
            <tr>
                <td>
                    <div style="font-weight:800;color:#0a192f;font-size:0.9rem;display:flex;align-items:center;gap:8px;">
                        <i class="fa-solid fa-store" style="color:#2563eb;font-size:0.85rem;"></i>
                        ${typeof escHtml === 'function' ? escHtml(sub.BusinessName || 'Provider #' + sub.ProviderID) : (sub.BusinessName || 'Provider #' + sub.ProviderID)}
                    </div>
                    <div style="font-size:0.76rem;color:#64748b;margin-top:2px;">
                        Category: <strong>${typeof escHtml === 'function' ? escHtml(sub.Category || 'General') : (sub.Category || 'General')}</strong>
                    </div>
                </td>
                <td>
                    <div style="font-weight:700;color:#334155;font-size:0.85rem;">
                        ${typeof escHtml === 'function' ? escHtml(sub.OwnerName || sub.FullName || 'Owner') : (sub.OwnerName || sub.FullName || 'Owner')}
                    </div>
                    <div style="font-size:0.76rem;color:#64748b;display:flex;flex-direction:column;gap:1px;margin-top:2px;">
                        <span><i class="fa-regular fa-envelope" style="font-size:0.7rem;"></i> ${typeof escHtml === 'function' ? escHtml(sub.Email || '—') : (sub.Email || '—')}</span>
                        <span><i class="fa-solid fa-phone" style="font-size:0.7rem;"></i> ${typeof escHtml === 'function' ? escHtml(sub.Phone || sub.ContactNumber || '—') : (sub.Phone || sub.ContactNumber || '—')}</span>
                    </div>
                </td>
                <td>${planBadge(sub.PlanType, subStatus)}</td>
                <td style="font-weight:700;color:#0a192f;font-size:0.88rem;">${priceDisplay}</td>
                <td style="font-size:0.82rem;color:#475569;white-space:nowrap;">${startDate}</td>
                <td style="font-size:0.82rem;color:#475569;white-space:nowrap;">${endDate}</td>
                <td>${daysLeftHtml}</td>
                <td>${statusBadge(subStatus)}</td>
                <td>${paymongoRef}</td>
            </tr>
        `;
    }).join('');
}

function _renderAdminSubscriptionPaymentsTable(payments) {
    const tbody = document.getElementById('table-admin-subscription-payments');
    if (!tbody) return;

    if (!payments || payments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:36px;color:#64748b;"><i class="fa-solid fa-receipt" style="font-size:1.8rem;margin-bottom:8px;display:block;color:#cbd5e1;"></i>No subscription payments recorded yet.</td></tr>`;
        return;
    }

    tbody.innerHTML = payments.map(p => {
        const amountDisplay = `₱${Number(p.Amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const pDate = p.PaymentDate || p.CreatedAt;
        const dateDisplay = pDate
            ? new Date(pDate).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : '—';

        const pType = String(p.PlanType || p.PlanName || '').toLowerCase();
        let planBadge = `<span style="background:#eff6ff;color:#1d4ed8;padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;">Free Trial</span>`;
        if (pType.includes('monthly')) {
            planBadge = `<span style="background:#f5f3ff;color:#6d28d9;padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;">Monthly ₱199</span>`;
        } else if (pType.includes('yearly') || pType.includes('annual')) {
            planBadge = `<span style="background:#fef3c7;color:#92400e;padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:700;">Yearly ₱1,990</span>`;
        }

        const sessionDisplay = p.PayMongoSessionID
            ? `<code style="background:#f8fafc;border:1px solid #e2e8f0;padding:2px 6px;border-radius:4px;font-size:0.72rem;font-family:monospace;color:#334155;" title="${p.PayMongoSessionID}">${p.PayMongoSessionID.slice(0, 16)}...</code>`
            : '<span style="color:#94a3b8;">—</span>';

        return `
            <tr>
                <td style="font-weight:700;color:#2563eb;font-size:0.82rem;">#SUB-PAY-${p.PaymentID}</td>
                <td>
                    <div style="font-weight:700;color:#0a192f;font-size:0.88rem;">${typeof escHtml === 'function' ? escHtml(p.BusinessName || 'Provider') : (p.BusinessName || 'Provider')}</div>
                    <div style="font-size:0.76rem;color:#64748b;">${typeof escHtml === 'function' ? escHtml(p.OwnerName || '') : (p.OwnerName || '')}</div>
                </td>
                <td>${planBadge}</td>
                <td style="font-weight:800;color:#059669;font-size:0.92rem;">${amountDisplay}</td>
                <td>
                    <span style="background:#f1f5f9;color:#334155;padding:3px 8px;border-radius:6px;font-size:0.75rem;font-weight:700;display:inline-flex;align-items:center;gap:4px;">
                        <i class="fa-solid fa-wallet" style="color:#6366f1;"></i> ${p.PaymentMethod || 'PayMongo'}
                    </span>
                </td>
                <td style="font-size:0.82rem;color:#475569;white-space:nowrap;">${dateDisplay}</td>
                <td>
                    <span style="background:#ecfdf5;color:#047857;border:1px solid #a7f3d0;padding:2px 8px;border-radius:12px;font-size:0.72rem;font-weight:800;display:inline-flex;align-items:center;gap:4px;">
                        <i class="fa-solid fa-circle-check"></i> ${p.PaymentStatus || p.Status || 'Paid'}
                    </span>
                </td>
                <td>${sessionDisplay}</td>
            </tr>
        `;
    }).join('');
}

