/**
 * SoundSphere - Cashier Dashboard Controller
 * Payout Disbursements & Multi-Period Income Reports Engine (Daily, Weekly, Monthly, Yearly)
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Authentication & Role Check
    // ----------------------------------------------------
    const getStoredToken = () => {
        return (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken && SoundSphereAPI.getAuthToken()) ||
               localStorage.getItem('soundsphere_jwt_token') ||
               localStorage.getItem('soundsphere_token') ||
               localStorage.getItem('soundsphere_auth_token') ||
               localStorage.getItem('token') ||
               sessionStorage.getItem('soundsphere_jwt_token') ||
               sessionStorage.getItem('soundsphere_token') ||
               sessionStorage.getItem('soundsphere_auth_token') ||
               sessionStorage.getItem('token') || '';
    };

    const getStoredUser = () => {
        if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) {
            const u = SoundSphereAPI.getAuthUser();
            if (u) return u;
        }
        const raw = localStorage.getItem('soundsphere_user_info') ||
                    localStorage.getItem('soundsphere_user') ||
                    localStorage.getItem('user') ||
                    localStorage.getItem('userData') ||
                    sessionStorage.getItem('soundsphere_user_info') ||
                    sessionStorage.getItem('soundsphere_user') ||
                    sessionStorage.getItem('user') ||
                    sessionStorage.getItem('userData');
        try {
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    };

    const clearCashierSession = () => {
        if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.clearAuthSession) {
            SoundSphereAPI.clearAuthSession();
        }
        localStorage.removeItem('soundsphere_jwt_token');
        localStorage.removeItem('soundsphere_token');
        localStorage.removeItem('soundsphere_auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('soundsphere_user_info');
        localStorage.removeItem('soundsphere_user');
        localStorage.removeItem('soundsphere_user_name');
        localStorage.removeItem('soundsphere_user_email');
        localStorage.removeItem('user');
        localStorage.removeItem('userData');
        sessionStorage.clear();
    };

    let token = getStoredToken();
    let currentUser = getStoredUser();

    // If token exists, inspect token payload to extract role if user object is incomplete
    if (token) {
        try {
            const base64Url = token.split('.')[1];
            if (base64Url) {
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const payload = JSON.parse(jsonPayload);
                if (!currentUser) currentUser = {};
                if (!currentUser.role && !currentUser.roleName && !currentUser.RoleName) {
                    currentUser.role = payload.roleName || payload.RoleName || payload.role;
                    currentUser.roleName = payload.roleName || payload.RoleName || payload.role;
                }
                if (!currentUser.email) currentUser.email = payload.email || payload.Email;
                if (!currentUser.name) currentUser.name = payload.name || payload.AdminFullName || payload.email || 'Cashier Staff';
            }
        } catch (e) {
            console.warn('Could not parse token payload:', e);
        }
    }

    const userRoleRaw = currentUser ? (currentUser.roleName || currentUser.RoleName || currentUser.role || '') : '';
    const userRoleClean = userRoleRaw.toLowerCase().replace(/[\s_-]/g, '');
    const allowedRoles = ['cashier', 'admin', 'administrator', 'superadmin'];

    if (!token || !userRoleClean || !allowedRoles.includes(userRoleClean)) {
        console.warn(`Access Restricted. Current Role: '${userRoleRaw}'. Redirecting to Cashier Sign In...`);
        if (token && userRoleClean && !allowedRoles.includes(userRoleClean)) {
            alert(`Cashier Portal Access Restricted:\n\nYou are currently signed in with a '${userRoleRaw}' account.\nThe Cashier Financial Desk requires a Cashier or Admin staff account.\n\nPlease log in with your Cashier credentials:\n• Email: cashier@soundsphere.com\n• Password: Cashier@123`);
        }
        clearCashierSession();
        window.location.href = '/login.html?redirect=/cashier/dashboard.html';
        return;
    }

    // Helper to gracefully handle any 401 / 403 API response
    function handleCashierAuthError(res, data) {
        if (res.status === 401 || res.status === 403) {
            console.warn('Cashier authentication error:', data?.message);
            alert(`Session Expired or Unauthorized:\n\n${data?.message || 'Access restricted to Cashier and Administrator accounts.'}\n\nPlease sign in with your Cashier account (cashier@soundsphere.com).`);
            clearCashierSession();
            window.location.href = '/login.html?redirect=/cashier/dashboard.html';
            return true;
        }
        return false;
    }

    // Populate user profile info
    if (currentUser) {
        const fullName = currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : (currentUser.email || 'Cashier Staff');
        const role = currentUser.roleName || currentUser.role || 'Cashier';
        
        const nameEl = document.getElementById('cashier-user-name');
        const roleEl = document.getElementById('cashier-user-role');
        const avatarEl = document.getElementById('user-avatar-initials');
        const printCashierEl = document.getElementById('print-cashier-name');
        const printSigEl = document.getElementById('print-sig-cashier');

        if (nameEl) nameEl.textContent = fullName;
        if (roleEl) roleEl.textContent = role.toUpperCase() === 'ADMIN' || role.toUpperCase() === 'ADMINISTRATOR' ? 'Admin / Cashier' : 'Cashier Staff';
        if (avatarEl) avatarEl.textContent = fullName.charAt(0).toUpperCase() || 'C';
        if (printCashierEl) printCashierEl.textContent = fullName;
        if (printSigEl) printSigEl.textContent = fullName;
    }

    // Set today's date in topbar
    const today = new Date();
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const dateStr = today.toLocaleDateString('en-US', dateOptions);
    const datePill = document.getElementById('current-date-text');
    if (datePill) datePill.textContent = dateStr;

    // Helper for currency formatting
    const formatPHP = (amount) => {
        const num = parseFloat(amount || 0);
        return '₱' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Helper for date formatting
    const formatDateTime = (dateVal) => {
        if (!dateVal) return 'N/A';
        const d = new Date(dateVal);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
               d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // ----------------------------------------------------
    // 2. Navigation & View Routing
    // ----------------------------------------------------
    const navLinks = document.querySelectorAll('.cashier-sidebar .nav-link[href^="#"]');
    const viewPanels = document.querySelectorAll('.view-panel');
    const topbarTitle = document.getElementById('topbar-page-title');

    function switchView(targetHash) {
        const cleanHash = (targetHash || '#overview').replace('#', '');
        
        navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${cleanHash}`) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        viewPanels.forEach(panel => {
            if (panel.id === `view-${cleanHash}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        if (cleanHash === 'overview') {
            topbarTitle.textContent = 'Cashier Overview';
            loadCashierSummary();
        } else if (cleanHash === 'withdrawals') {
            topbarTitle.textContent = 'Provider Withdrawals & Payouts';
            loadWithdrawalsList();
        } else if (cleanHash === 'refunds') {
            topbarTitle.textContent = 'Client Refund Disbursements';
            loadClientRefundsList();
        } else if (cleanHash === 'subscriptions') {
            topbarTitle.textContent = 'Provider Subscription Payments';
            loadCashierSubscriptions();
        } else if (cleanHash === 'revenue') {
            topbarTitle.textContent = 'Platform Revenue & Provider Breakdown';
            loadCashierRevenueReports();
        } else if (cleanHash === 'reports') {
            topbarTitle.textContent = 'Income & Financial Reports';
            loadIncomeReport();
        }
    }

    window.addEventListener('hashchange', () => {
        switchView(window.location.hash || '#overview');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                window.location.hash = href;
            }
        });
    });

    // Mobile sidebar toggle
    const toggleBtn = document.getElementById('btn-sidebar-toggle');
    const sidebar = document.getElementById('cashier-sidebar');
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Quick action buttons in overview
    const gotoWithdrawals = document.getElementById('btn-goto-withdrawals');
    if (gotoWithdrawals) {
        gotoWithdrawals.addEventListener('click', () => { window.location.hash = '#withdrawals'; });
    }
    const gotoSubRecord = document.getElementById('btn-goto-subscriptions-record');
    if (gotoSubRecord) {
        gotoSubRecord.addEventListener('click', () => {
            window.location.hash = '#subscriptions';
            setTimeout(() => {
                openRecordSubscriptionModal();
            }, 100);
        });
    }
    const gotoReportsDaily = document.getElementById('btn-goto-reports-daily');
    if (gotoReportsDaily) {
        gotoReportsDaily.addEventListener('click', () => {
            setReportPeriod('daily');
            window.location.hash = '#reports';
        });
    }
    const gotoReportsMonthly = document.getElementById('btn-goto-reports-monthly');
    if (gotoReportsMonthly) {
        gotoReportsMonthly.addEventListener('click', () => {
            setReportPeriod('monthly');
            window.location.hash = '#reports';
        });
    }

    // Logout action
    const btnLogout = document.getElementById('btn-cashier-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            if (confirm('Are you sure you want to sign out from the Cashier Portal?')) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userData');
                sessionStorage.clear();
                window.location.href = '/login.html';
            }
        });
    }

    // ----------------------------------------------------
    // 3. Overview Dashboard Data
    // ----------------------------------------------------
    async function loadCashierSummary() {
        try {
            const res = await fetch('/api/cashier/summary', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                console.error('Failed to load summary:', data.message);
                return;
            }

            const stats = data.stats || {};

            // Metric elements
            const grossEl = document.getElementById('stat-today-gross');
            const commEl = document.getElementById('stat-total-commission');
            const pendCountEl = document.getElementById('stat-pending-withdrawals');
            const pendAmtEl = document.getElementById('stat-pending-amount');
            const subRevEl = document.getElementById('stat-subscription-revenue');
            const subActiveEl = document.getElementById('stat-active-subs-count');
            const sidebarBadge = document.getElementById('sidebar-pending-badge');

            if (grossEl) grossEl.textContent = formatPHP(stats.todayGrossVolume);
            if (commEl) commEl.textContent = formatPHP(stats.totalPlatformCommission);
            if (pendCountEl) pendCountEl.textContent = stats.pendingWithdrawalsCount || 0;
            if (pendAmtEl) pendAmtEl.textContent = `${formatPHP(stats.pendingWithdrawalsAmount)} awaiting disbursement`;
            if (subRevEl) subRevEl.textContent = formatPHP(stats.totalSubscriptionRevenue || 0);
            if (subActiveEl) subActiveEl.textContent = `${stats.activeSubscriptionsCount || 0} active provider plans`;

            // Client Refund metrics
            const refCountEl = document.getElementById('stat-pending-refunds');
            const refAmtEl = document.getElementById('stat-pending-refunds-amount');
            const refSidebarBadge = document.getElementById('sidebar-refunds-badge');

            if (refCountEl) refCountEl.textContent = stats.pendingRefundsCount || 0;
            if (refAmtEl) refAmtEl.textContent = `${formatPHP(stats.pendingRefundsAmount || 0)} to disburse`;

            if (refSidebarBadge) {
                if (stats.pendingRefundsCount > 0) {
                    refSidebarBadge.textContent = stats.pendingRefundsCount;
                    refSidebarBadge.style.display = 'inline-block';
                } else {
                    refSidebarBadge.style.display = 'none';
                }
            }

            if (sidebarBadge) {
                if (stats.pendingWithdrawalsCount > 0) {
                    sidebarBadge.textContent = stats.pendingWithdrawalsCount;
                    sidebarBadge.style.display = 'inline-block';
                } else {
                    sidebarBadge.style.display = 'none';
                }
            }

            // Recent activity ledger
            const tbody = document.getElementById('overview-recent-table-body');
            if (tbody) {
                const list = data.recentTransactions || [];
                if (list.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No recent transactions.</td></tr>`;
                } else {
                    tbody.innerHTML = list.map(item => {
                        const isOutflow = item.Flow === 'Outflow' || item.Type === 'Withdrawal';
                        const flowClass = isOutflow ? 'flow-outflow' : 'flow-inflow';
                        const flowSign = isOutflow ? '-' : '+';
                        const isPartial = item.Status === 'Partial';
                        const statusBadge = item.Status === 'Approved' || item.Status === 'Paid' 
                            ? 'badge-approved' 
                            : (isPartial ? 'badge-partial' : (item.Status === 'Pending' ? 'badge-pending' : 'badge-rejected'));
                        const isWdr = item.Type === 'Withdrawal';
                        const isRef = item.Type === 'Client Refund';

                        return `
                            <tr class="${isWdr ? 'withdrawal-row-item' : (isRef ? 'refund-row-item' : '')}" ${isWdr ? `data-wid="${item.ID}"` : (isRef ? `data-id="${item.ID}"` : '')} style="${(isWdr || isRef) ? 'cursor:pointer;' : ''}" title="${isWdr ? 'Click to view withdrawal details' : (isRef ? 'Click to view refund booking details' : '')}">
                                <td>${formatDateTime(item.Date)}</td>
                                <td><strong style="${(isWdr || isRef) ? 'color:#2563eb;' : ''}">${item.Reference}</strong></td>
                                <td><span class="badge ${item.Type === 'Withdrawal' ? 'badge-pending' : 'badge-approved'}">${item.Type}</span></td>
                                <td>${item.Recipient || 'N/A'}</td>
                                <td>${item.Method || 'Online'}</td>
                                <td><span class="${flowClass}">${isOutflow ? 'Outflow (Payout)' : 'Inflow (Payment)'}</span></td>
                                <td class="${flowClass}">
                                    <strong>${flowSign}${formatPHP(item.Amount)}</strong>
                                    ${isPartial && item.TotalAmount && item.TotalAmount > item.Amount ? `
                                        <div style="font-size:0.75rem; color:#64748b; font-weight:600; white-space:nowrap; margin-top:2px;">
                                            Partial (Total: ${formatPHP(item.TotalAmount)})
                                        </div>
                                    ` : ''}
                                </td>
                                <td><span class="badge ${statusBadge}">${item.Status}</span></td>
                            </tr>
                        `;
                    }).join('');

                    tbody.querySelectorAll('.withdrawal-row-item').forEach(row => {
                        row.addEventListener('click', () => {
                            const wid = row.getAttribute('data-wid');
                            if (wid && window.openPayMongoVerifyModal) {
                                window.openPayMongoVerifyModal(wid);
                            }
                        });
                    });

                    tbody.querySelectorAll('.refund-row-item').forEach(row => {
                        row.addEventListener('click', () => {
                            const reqId = row.getAttribute('data-id');
                            if (reqId && window.openClientBookingDetailsFullScreen) {
                                window.openClientBookingDetailsFullScreen(reqId);
                            }
                        });
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching cashier summary:', err);
        }
    }

    const refreshOverviewBtn = document.getElementById('btn-refresh-overview');
    if (refreshOverviewBtn) {
        refreshOverviewBtn.addEventListener('click', loadCashierSummary);
    }

    document.getElementById('btn-goto-withdrawals')?.addEventListener('click', () => switchView('withdrawals'));
    document.getElementById('btn-goto-refunds')?.addEventListener('click', () => switchView('refunds'));
    document.getElementById('btn-goto-reports-daily')?.addEventListener('click', () => {
        switchView('reports');
        document.querySelector('.period-tab-btn[data-period="daily"]')?.click();
    });
    document.getElementById('btn-goto-reports-monthly')?.addEventListener('click', () => {
        switchView('reports');
        document.querySelector('.period-tab-btn[data-period="monthly"]')?.click();
    });

    // ----------------------------------------------------
    // 4. Provider Withdrawals List & Actions
    // ----------------------------------------------------
    let currentWithdrawalsList = [];
    let currentWithdrawalFilter = 'Pending';

    async function loadWithdrawalsList() {
        const tbody = document.getElementById('withdrawals-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading requests...</td></tr>`;
        }

        try {
            const url = currentWithdrawalFilter === 'All' 
                ? '/api/cashier/withdrawals/list' 
                : `/api/cashier/withdrawals/list?status=${encodeURIComponent(currentWithdrawalFilter)}`;

            const res = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                if (tbody) tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:24px;">${data.message || 'Failed to load withdrawals.'}</td></tr>`;
                return;
            }

            currentWithdrawalsList = data.withdrawals || [];
            renderWithdrawalsTable();
        } catch (err) {
            console.error('Error loading withdrawals:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:#ef4444; padding:24px;">Failed to load withdrawal requests.</td></tr>`;
        }
    }

    function renderWithdrawalsTable() {
        const tbody = document.getElementById('withdrawals-table-body');
        if (!tbody) return;

        const searchQuery = (document.getElementById('withdrawal-search-input')?.value || '').toLowerCase().trim();

        const filtered = currentWithdrawalsList.filter(item => {
            if (!searchQuery) return true;
            return (
                (item.ProviderName && item.ProviderName.toLowerCase().includes(searchQuery)) ||
                (item.AccountName && item.AccountName.toLowerCase().includes(searchQuery)) ||
                (item.AccountNumber && item.AccountNumber.toLowerCase().includes(searchQuery)) ||
                (item.PayoutMethod && item.PayoutMethod.toLowerCase().includes(searchQuery)) ||
                String(item.WithdrawalID).includes(searchQuery)
            );
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748b;">No withdrawal requests found matching current filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            const isPending = item.Status === 'Pending';
            const isApproved = item.Status === 'Approved';
            const isRejected = item.Status === 'Rejected';

            let badgeClass = 'badge-pending';
            if (isApproved) badgeClass = 'badge-approved';
            if (isRejected) badgeClass = 'badge-rejected';

            return `
                <tr class="withdrawal-row-item" data-wid="${item.WithdrawalID}" title="Click anywhere to view full withdrawal and payment details">
                    <td><strong class="wdr-code" style="color:#0a192f; cursor:pointer;">#WDR-${item.WithdrawalID}</strong></td>
                    <td>
                        <div style="font-weight:700; color:#0a192f;">${item.ProviderName || 'Provider'}</div>
                        <div style="font-size:0.75rem; color:#64748b;">${item.ProviderEmail || ''}</div>
                    </td>
                    <td><strong style="font-size:1.05rem; color:#0a192f; font-weight:800;">${formatPHP(item.Amount)}</strong></td>
                    <td>
                        <div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">
                            <span class="badge" style="background:#f1f5f9; color:#0a192f; border:1px solid #cbd5e1; font-size:0.72rem;">
                                <i class="fa-solid fa-wallet"></i> ${item.PayoutMethod || 'GCash'}
                            </span>
                        </div>
                        <div style="font-weight:600; font-size:0.85rem; color:#0f172a;">${item.AccountName || 'N/A'}</div>
                        <div style="font-size:0.75rem; color:#64748b; font-family:monospace;">${item.AccountNumber || item.AccountReference || 'N/A'}</div>
                    </td>
                    <td><div style="font-size:0.8rem; color:#475569;">${formatDateTime(item.RequestedAt)}</div></td>
                    <td><span class="badge ${badgeClass}">${item.Status}</span></td>
                    <td style="text-align:right; white-space:nowrap;">
                        ${isPending ? `
                            <button type="button" class="btn btn-success btn-sm btn-disburse-action" data-wid="${item.WithdrawalID}" style="margin-right:4px;">
                                <i class="fa-solid fa-money-bill-wave"></i> Disburse
                            </button>
                            <button type="button" class="btn btn-outline btn-sm btn-reject-action" data-wid="${item.WithdrawalID}" style="color:#ef4444; border-color:#fca5a5;" title="Reject Request">
                                <i class="fa-solid fa-ban"></i> Reject
                            </button>
                        ` : `
                            <span class="badge ${badgeClass}" style="font-size:0.78rem;">
                                ${isApproved ? '<i class="fa-solid fa-circle-check"></i> Disbursed' : '<i class="fa-solid fa-circle-xmark"></i> Rejected'}
                            </span>
                        `}
                    </td>
                </tr>
            `;
        }).join('');

        // Row click opens the full withdrawal details
        tbody.querySelectorAll('.withdrawal-row-item').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.btn-disburse-action') || e.target.closest('.btn-reject-action')) {
                    return;
                }
                const wid = row.getAttribute('data-wid');
                if (wid) openPayMongoVerifyModal(wid);
            });
        });

        // Attach action handlers with event.stopPropagation
        tbody.querySelectorAll('.btn-disburse-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wid = btn.getAttribute('data-wid');
                executeDisbursePayout(wid, btn);
            });
        });

        tbody.querySelectorAll('.btn-reject-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wid = btn.getAttribute('data-wid');
                openRejectModal(wid);
            });
        });

        tbody.querySelectorAll('.btn-open-pm-proof').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const wid = btn.getAttribute('data-wid');
                openPayMongoVerifyModal(wid);
            });
        });
    }

    // Filter pill handling
    document.querySelectorAll('[data-w-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-w-filter]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentWithdrawalFilter = btn.getAttribute('data-w-filter');
            loadWithdrawalsList();
        });
    });

    // Search input debounce
    const wSearchInput = document.getElementById('withdrawal-search-input');
    if (wSearchInput) {
        wSearchInput.addEventListener('input', () => {
            renderWithdrawalsTable();
        });
    }

    const refreshWithdrawalsBtn = document.getElementById('btn-refresh-withdrawals');
    if (refreshWithdrawalsBtn) {
        refreshWithdrawalsBtn.addEventListener('click', loadWithdrawalsList);
    }

    // ----------------------------------------------------
    // Fullscreen View: Withdrawal Request & 5% Commission Payout Details
    // ----------------------------------------------------
    const viewWdrDetails = document.getElementById('view-cashier-withdrawal-details');
    let currentVerifyWid = null;

    function populateWithdrawalFullScreenData(w, v) {
        if (!w) return;
        const status = w.WithdrawalStatus || w.Status || 'Pending';
        const isPending = status === 'Pending';
        const isApproved = status === 'Approved';
        const isRejected = status === 'Rejected';

        // 1. Amount & 5% Commission Calculation
        const netAmount = parseFloat(v?.requestedPayout ?? w.Amount ?? w.RequestedAmount ?? 0);
        let grossAmount = parseFloat(w.BookingTotalAmount || 0);
        if (!grossAmount || grossAmount <= 0) {
            grossAmount = parseFloat((netAmount / 0.95).toFixed(2));
        }
        let commissionAmount = parseFloat((grossAmount * 0.05).toFixed(2));
        if (Math.abs((grossAmount - commissionAmount) - netAmount) > 0.05) {
            commissionAmount = parseFloat((grossAmount - netAmount).toFixed(2));
        }

        // Header and IDs
        const idEl = document.getElementById('cwd-wdr-id');
        if (idEl) idEl.textContent = `#WDR-${w.WithdrawalID}`;

        const reqDateEl = document.getElementById('cwd-requested-date');
        if (reqDateEl) reqDateEl.textContent = formatDateTime(w.RequestedAt);

        const statusBadgeEl = document.getElementById('cwd-wdr-status-badge');
        if (statusBadgeEl) {
            statusBadgeEl.className = `badge ${isApproved ? 'badge-approved' : (isRejected ? 'badge-rejected' : 'badge-pending')}`;
            statusBadgeEl.innerHTML = isApproved ? '<i class="fa-solid fa-circle-check"></i> Disbursed' : (isRejected ? '<i class="fa-solid fa-circle-xmark"></i> Rejected' : '<i class="fa-solid fa-clock"></i> Pending Approval');
        }

        // Provider & Booking Banner
        const provNameEl = document.getElementById('cwd-provider-name');
        if (provNameEl) provNameEl.textContent = w.ProviderName || w.BusinessName || 'Service Provider';

        const bRefEl = document.getElementById('cwd-booking-ref');
        if (bRefEl) {
            if (w.BookingReference) {
                bRefEl.textContent = `#${w.BookingReference}${w.PackageName ? ' (' + w.PackageName + ')' : ''}`;
            } else if (w.BookingID) {
                bRefEl.textContent = `#BK-${w.BookingID}${w.PackageName ? ' (' + w.PackageName + ')' : ''}`;
            } else {
                bRefEl.textContent = 'Wallet Inflow Balance';
            }
        }

        // Financial Breakdown (Gross, 5% Commission, Net)
        const grossEl = document.getElementById('cwd-gross-amount');
        if (grossEl) grossEl.textContent = formatPHP(grossAmount);

        const commEl = document.getElementById('cwd-commission-amount');
        if (commEl) commEl.textContent = `-${formatPHP(commissionAmount)}`;

        const netEl = document.getElementById('cwd-net-amount');
        if (netEl) netEl.textContent = formatPHP(netAmount);

        const formulaTextEl = document.getElementById('cwd-formula-text');
        if (formulaTextEl) {
            formulaTextEl.innerHTML = `<strong>Payout Breakdown:</strong> ${formatPHP(grossAmount)} Gross Client Inflow − 5% SoundSphere Platform Commission (${formatPHP(commissionAmount)}) = <strong style="color:#059669;">${formatPHP(netAmount)} Net Provider Payout</strong>`;
        }

        // Provider & Client Parties
        const provBizEl = document.getElementById('cwd-provider-business');
        if (provBizEl) provBizEl.textContent = w.ProviderName || w.BusinessName || 'Service Provider';

        const provContactEl = document.getElementById('cwd-provider-contact');
        if (provContactEl) {
            const parts = [w.ProviderEmail, w.ProviderPhone].filter(Boolean);
            provContactEl.textContent = parts.length ? parts.join(' • ') : 'N/A';
        }

        const clientNameEl = document.getElementById('cwd-client-name');
        if (clientNameEl) clientNameEl.textContent = w.ClientName || 'SoundSphere Client';

        const clientEmailEl = document.getElementById('cwd-client-email');
        const targetClientEmail = w.ClientEmail || (w.ClientName && w.ClientName.includes('@') ? w.ClientName : 'client@gmail.com');
        if (clientEmailEl) clientEmailEl.textContent = targetClientEmail;

        const bottomEmailEl = document.getElementById('cwd-bottom-client-email');
        if (bottomEmailEl) bottomEmailEl.textContent = targetClientEmail;

        // Payout Destination
        const methodEl = document.getElementById('cwd-payout-method');
        if (methodEl) methodEl.textContent = w.PayoutMethod || 'GCash';

        const accNameEl = document.getElementById('cwd-account-name');
        if (accNameEl) accNameEl.textContent = w.AccountName || 'N/A';

        const accNumEl = document.getElementById('cwd-account-number');
        if (accNumEl) accNumEl.textContent = w.AccountNumber || w.AccountReference || 'N/A';

        // Gateway verification
        const gwStatusEl = document.getElementById('cwd-gateway-status');
        if (gwStatusEl) {
            const isVer = v?.isVerified ?? (w.isPayMongoVerified !== false);
            gwStatusEl.innerHTML = isVer
                ? `<i class="fa-solid fa-circle-check" style="color:#059669;"></i> PayMongo Verified Inflow (${formatPHP(v?.totalClientPaid || grossAmount)})`
                : `<i class="fa-solid fa-shield-check" style="color:#2563eb;"></i> Secured Platform Inflow Recorded`;
        }

        // Admin audit record
        const adminBox = document.getElementById('cwd-admin-record-container');
        const adminText = document.getElementById('cwd-admin-record-text');
        if (adminBox && adminText) {
            if (w.AdminNotes || w.PayMongoPayoutID || w.ProcessedAt) {
                adminBox.style.display = 'block';
                let notesHtml = '';
                if (w.PayMongoPayoutID) notesHtml += `<div><strong>Transaction Ref:</strong> ${w.PayMongoPayoutID}</div>`;
                if (w.ProcessedAt) notesHtml += `<div><strong>Processed At:</strong> ${formatDateTime(w.ProcessedAt)}</div>`;
                if (w.AdminNotes) notesHtml += `<div><strong>Remarks:</strong> ${w.AdminNotes}</div>`;
                adminText.innerHTML = notesHtml || '-';
            } else {
                adminBox.style.display = 'none';
            }
        }

        // Actions in Bottom Bar
        const actionsContainer = document.getElementById('cwd-actions-container');
        if (actionsContainer) {
            if (isPending) {
                actionsContainer.innerHTML = `
                    <button type="button" class="btn btn-outline" id="btn-cwd-close-bottom">Close</button>
                    <button type="button" class="btn btn-outline" id="btn-cwd-reject" style="color:#ef4444; border-color:#fca5a5; font-weight:700;">
                        <i class="fa-solid fa-ban"></i> Reject Request
                    </button>
                    <button type="button" class="btn btn-success" id="btn-cwd-disburse" style="font-weight:800; padding:10px 24px;">
                        <i class="fa-solid fa-money-bill-wave"></i> Disburse Payout
                    </button>
                `;
                document.getElementById('btn-cwd-close-bottom')?.addEventListener('click', closeWithdrawalDetailsFullScreen);
                document.getElementById('btn-cwd-reject')?.addEventListener('click', () => {
                    openRejectModal(w.WithdrawalID);
                });
                document.getElementById('btn-cwd-disburse')?.addEventListener('click', (e) => {
                    executeDisbursePayout(w.WithdrawalID, e.currentTarget);
                });
            } else if (isApproved) {
                actionsContainer.innerHTML = `
                    <button type="button" class="btn btn-outline" id="btn-cwd-close-bottom">Close</button>
                    <span class="badge badge-approved" style="font-size:0.88rem; padding:8px 16px;">
                        <i class="fa-solid fa-circle-check"></i> Disbursed & Client Notified via Email
                    </span>
                `;
                document.getElementById('btn-cwd-close-bottom')?.addEventListener('click', closeWithdrawalDetailsFullScreen);
            } else {
                actionsContainer.innerHTML = `
                    <button type="button" class="btn btn-outline" id="btn-cwd-close-bottom">Close</button>
                    <span class="badge badge-rejected" style="font-size:0.88rem; padding:8px 16px;">
                        <i class="fa-solid fa-circle-xmark"></i> Rejected
                    </span>
                `;
                document.getElementById('btn-cwd-close-bottom')?.addEventListener('click', closeWithdrawalDetailsFullScreen);
            }
        }
    }

    async function openWithdrawalDetailsFullScreen(wid) {
        currentVerifyWid = wid;
        const view = document.getElementById('view-cashier-withdrawal-details');
        if (!view) return;

        view.classList.remove('hidden');
        view.style.setProperty('display', 'flex', 'important');
        view.style.setProperty('visibility', 'visible', 'important');
        view.style.setProperty('opacity', '1', 'important');
        document.body.style.overflow = 'hidden';

        const loadingEl = document.getElementById('cwd-loading');
        const contentEl = document.getElementById('cwd-content');

        // Render cached item immediately so UI response is instant
        const localItem = currentWithdrawalsList.find(w => String(w.WithdrawalID) === String(wid));
        if (localItem) {
            populateWithdrawalFullScreenData(localItem, null);
            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';
        } else {
            if (loadingEl) loadingEl.style.display = 'block';
            if (contentEl) contentEl.style.display = 'none';
        }

        try {
            const res = await fetch(`/api/cashier/withdrawals/${wid}/paymongo-verify`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();

            if (!data.success) {
                if (!localItem) {
                    alert(data.message || 'Failed to verify payout details.');
                    closeWithdrawalDetailsFullScreen();
                }
                return;
            }

            const w = data.withdrawal || {};
            const v = data.verification || {};

            if (loadingEl) loadingEl.style.display = 'none';
            if (contentEl) contentEl.style.display = 'block';

            populateWithdrawalFullScreenData(w, v);

        } catch (err) {
            console.error('Withdrawal details fetch error:', err);
            if (!localItem) {
                alert('Failed to connect to verification service.');
                closeWithdrawalDetailsFullScreen();
            }
        }
    }

    function closeWithdrawalDetailsFullScreen() {
        const view = document.getElementById('view-cashier-withdrawal-details');
        if (view) {
            view.classList.add('hidden');
            view.style.setProperty('display', 'none', 'important');
            view.style.setProperty('visibility', 'hidden', 'important');
            view.style.setProperty('opacity', '0', 'important');
        }
        document.body.style.overflow = '';
    }

    // Backwards-compatible aliases & global exposures
    window.openWithdrawalDetailsFullScreen = openWithdrawalDetailsFullScreen;
    window.closeWithdrawalDetailsFullScreen = closeWithdrawalDetailsFullScreen;
    window.openPayMongoVerifyModal = openWithdrawalDetailsFullScreen;
    window.closePayMongoVerifyModal = closeWithdrawalDetailsFullScreen;

    document.getElementById('btn-close-cashier-withdrawal-details')?.addEventListener('click', closeWithdrawalDetailsFullScreen);

    // ----------------------------------------------------
    // Direct Disburse Payout Logic (No modal popup needed)
    // ----------------------------------------------------
    async function executeDisbursePayout(wid, btnElement) {
        const item = currentWithdrawalsList.find(w => String(w.WithdrawalID) === String(wid));
        const providerName = item ? (item.ProviderName || 'Service Provider') : 'Service Provider';
        const amountStr = item ? formatPHP(item.Amount) : '';
        const methodStr = item?.PayoutMethod || 'GCash';
        const accDetails = item ? `${item.AccountName || ''} (${item.AccountNumber || item.AccountReference || ''})` : '';

        const confirmed = confirm(
            `Confirm Manual Payout Sent:\n\n` +
            `• Service Provider: ${providerName}\n` +
            `• Amount: ${amountStr}\n` +
            `• Sent Via: ${methodStr}\n` +
            `• Account: ${accDetails}\n\n` +
            `Mark this payout request as Disbursed & Completed?`
        );
        if (!confirmed) return;

        let originalBtnHtml = '';
        if (btnElement) {
            originalBtnHtml = btnElement.innerHTML;
            btnElement.disabled = true;
            btnElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Disbursing...`;
        }

        try {
            const res = await fetch(`/api/cashier/withdrawals/${wid}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    paymentMethod: item?.PayoutMethod || 'GCash',
                    referenceNumber: item?.AccountReference || `MANUAL-${wid}`,
                    notes: 'Cashier confirmed manual payout sent'
                })
            });
            const data = await res.json();

            if (data.success) {
                alert(data.message || 'Payout marked as disbursed successfully!');
                await loadWithdrawalsList();
                loadCashierSummary();
                const wdrView = document.getElementById('view-cashier-withdrawal-details');
                if (wdrView && !wdrView.classList.contains('hidden') && wdrView.style.display !== 'none') {
                    openWithdrawalDetailsFullScreen(wid);
                }
            } else {
                alert(data.message || 'Failed to disburse payout.');
                if (btnElement) {
                    btnElement.disabled = false;
                    btnElement.innerHTML = originalBtnHtml || `<i class="fa-solid fa-money-bill-wave"></i> Disburse Payout`;
                }
            }
        } catch (err) {
            console.error('Disburse error:', err);
            alert('An error occurred while disbursing the payout.');
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalBtnHtml || `<i class="fa-solid fa-money-bill-wave"></i> Disburse Payout`;
            }
        }
    }

    // Backwards-compatible aliases
    window.openDisburseModal = executeDisbursePayout;
    window.executeDisbursePayout = executeDisbursePayout;

    // ----------------------------------------------------
    // Reject Modal Logic
    // ----------------------------------------------------
    const modalReject = document.getElementById('modal-reject');
    const formReject = document.getElementById('form-reject-payout');

    function openRejectModal(wid) {
        const item = currentWithdrawalsList.find(w => String(w.WithdrawalID) === String(wid));
        if (!item) return;

        document.getElementById('reject-withdrawal-id').value = item.WithdrawalID;
        document.getElementById('reject-provider-name').textContent = item.ProviderName || 'Provider';
        document.getElementById('reject-amount').textContent = formatPHP(item.Amount);
        document.getElementById('reject-reason').value = '';

        modalReject.classList.add('active');
    }

    function closeRejectModal() {
        modalReject.classList.remove('active');
    }

    document.getElementById('btn-close-reject-modal')?.addEventListener('click', closeRejectModal);
    document.getElementById('btn-cancel-reject')?.addEventListener('click', closeRejectModal);

    if (formReject) {
        formReject.addEventListener('submit', async (e) => {
            e.preventDefault();
            const wid = document.getElementById('reject-withdrawal-id').value;
            const reason = document.getElementById('reject-reason').value.trim();

            if (!reason) {
                alert('Please enter a reason for rejection.');
                return;
            }

            const submitBtn = document.getElementById('btn-submit-reject');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Rejecting...`;

            try {
                const res = await fetch(`/api/cashier/withdrawals/${wid}/reject`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                });
                const data = await res.json();

                if (data.success) {
                    alert(data.message || 'Payout request rejected.');
                    closeRejectModal();
                    loadWithdrawalsList();
                    loadCashierSummary();
                } else {
                    alert(data.message || 'Failed to reject request.');
                }
            } catch (err) {
                console.error('Reject error:', err);
                alert('An error occurred while rejecting.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Reject Request`;
            }
        });
    }

    // ----------------------------------------------------
    // 4-B. Client Refund Requests Management (Disbursements & Rejections)
    // ----------------------------------------------------
    let currentRefundsList = [];
    let currentRefundFilter = 'Pending';

    async function loadClientRefundsList() {
        const tbody = document.getElementById('refunds-table-body');
        if (!tbody) return;

        try {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:28px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading client refund requests...</td></tr>`;

            const res = await fetch('/api/cashier/refund-requests', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:28px; color:#ef4444;">Failed to load refunds: ${data.message}</td></tr>`;
                return;
            }

            currentRefundsList = data.refundRequests || [];
            updateRefundFilterCounts();
            renderRefundsTable();
        } catch (err) {
            console.error('Error fetching/rendering refund requests:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:28px; color:#ef4444;">Error loading refund requests: ${err.message || 'Network error'}</td></tr>`;
        }
    }

    function updateRefundFilterCounts() {
        const pendingCount = currentRefundsList.filter(r => r.Status === 'Pending').length;
        const approvedCount = currentRefundsList.filter(r => r.Status === 'Approved').length;
        const rejectedCount = currentRefundsList.filter(r => r.Status === 'Rejected').length;
        const allCount = currentRefundsList.length;

        const countPendEl = document.getElementById('count-ref-pending');
        const countApprEl = document.getElementById('count-ref-approved');
        const countRejEl = document.getElementById('count-ref-rejected');
        const countAllEl = document.getElementById('count-ref-all');
        const refSidebarBadge = document.getElementById('sidebar-refunds-badge');

        if (countPendEl) countPendEl.textContent = pendingCount;
        if (countApprEl) countApprEl.textContent = approvedCount;
        if (countRejEl) countRejEl.textContent = rejectedCount;
        if (countAllEl) countAllEl.textContent = allCount;

        if (refSidebarBadge) {
            if (pendingCount > 0) {
                refSidebarBadge.textContent = pendingCount;
                refSidebarBadge.style.display = 'inline-block';
            } else {
                refSidebarBadge.style.display = 'none';
            }
        }
    }

    function renderRefundsTable() {
        const tbody = document.getElementById('refunds-table-body');
        if (!tbody) return;

        const searchVal = (document.getElementById('refund-search-input')?.value || '').toLowerCase().trim();

        let filtered = currentRefundsList;
        if (currentRefundFilter !== 'All') {
            filtered = filtered.filter(r => (r.Status || 'Pending') === currentRefundFilter);
        }

        if (searchVal) {
            filtered = filtered.filter(r => {
                const name = (r.ClientName || '').toLowerCase();
                const acc = (r.AccountNumber || '').toLowerCase();
                const ref = (r.ReferenceNumber || '').toLowerCase();
                const id = String(r.RefundRequestID || '');
                return name.includes(searchVal) || acc.includes(searchVal) || ref.includes(searchVal) || id.includes(searchVal);
            });
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px; color:#64748b;">No client refund requests found matching filter '${currentRefundFilter}'.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            let statusBadge = 'badge-pending';
            if (r.Status === 'Approved') statusBadge = 'badge-approved';
            if (r.Status === 'Rejected') statusBadge = 'badge-rejected';

            const isPending = (r.Status || 'Pending') === 'Pending';
            const actionHtml = isPending ? `
                <div style="display:flex; gap:6px; justify-content:flex-end;" class="refund-actions-cell">
                    <button type="button" class="btn btn-success btn-sm btn-disburse-refund" data-id="${r.RefundRequestID}" onclick="event.stopPropagation(); window.executeMarkRefundAsRefunded && window.executeMarkRefundAsRefunded('${r.RefundRequestID}', this);" title="Manually Send Refund & Mark as Refunded">
                        <i class="fa-solid fa-money-bill-transfer"></i> Mark as Refunded
                    </button>
                    <button type="button" class="btn btn-outline-danger btn-sm btn-reject-refund" data-id="${r.RefundRequestID}" onclick="event.stopPropagation(); window.openCashierRejectModal && window.openCashierRejectModal('${r.RefundRequestID}');" title="Reject & Return Funds to Client Wallet" style="color:#dc2626; border-color:#fca5a5;">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                </div>
            ` : (r.Status === 'Approved' ? `
                <div style="text-align:right;" onclick="event.stopPropagation();">
                    <strong style="color:#059669; font-size:0.85rem;"><i class="fa-solid fa-check"></i> Ref: ${r.ReferenceNumber || 'Manual'}</strong>
                    ${r.AdminNotes ? `<div style="font-size:0.75rem; color:#64748b;">${(r.AdminNotes || '').replace(/\s*outside system by cashier\s*/gi, '').trim()}</div>` : ''}
                </div>
            ` : `
                <div style="text-align:right;" onclick="event.stopPropagation();">
                    <span style="color:#dc2626; font-size:0.82rem;"><i class="fa-solid fa-xmark"></i> ${r.AdminNotes || 'Rejected'}</span>
                </div>
            `);

            return `
                <tr class="refund-row-item" data-id="${r.RefundRequestID}" title="Click this line to view client booking information">
                    <td><strong>#REF-${r.RefundRequestID}</strong></td>
                    <td>
                        <div>
                            <button type="button" class="btn-view-client-booking" data-id="${r.RefundRequestID}" onclick="event.stopPropagation(); window.openClientBookingDetailsFullScreen && window.openClientBookingDetailsFullScreen('${r.RefundRequestID}');" style="background:none; border:none; padding:0; text-align:left; cursor:pointer; font-weight:800; font-size:0.95rem; color:#2563eb; display:inline-flex; align-items:center; gap:6px; transition:all 0.15s;" onmouseover="this.style.color='#1d4ed8'; this.style.textDecoration='underline';" onmouseout="this.style.color='#2563eb'; this.style.textDecoration='none';" title="Click to view client booking information">
                                <span>${r.ClientName || 'Denver Cabrera'}</span>
                                <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i>
                            </button>
                        </div>
                        <div style="font-size:0.8rem; color:#64748b; margin-top:2px;">${r.ClientEmail || r.UserEmail || 'No Email'}</div>
                    </td>
                    <td><strong class="flow-outflow" style="font-size:1.05rem; color:#ef4444;">-${formatPHP(r.Amount)}</strong></td>
                    <td><span class="badge" style="background:#eff6ff; color:#1e40af; border:1px solid #bfdbfe; font-weight:700;">${r.PayoutMethod || 'GCash'}</span></td>
                    <td>
                        <div style="font-weight:700; color:#1e293b;">${r.AccountName || '-'}</div>
                        <div style="font-family:monospace; font-weight:800; font-size:0.95rem; color:#0a192f;">${r.AccountNumber || '-'}</div>
                    </td>
                    <td><span style="font-size:0.85rem; color:#475569;">${formatDateTime(r.RequestedAt)}</span></td>
                    <td><span class="badge ${statusBadge}">${r.Status === 'Approved' ? 'Refunded' : (r.Status || 'Pending')}</span></td>
                    <td style="text-align:right;">${actionHtml}</td>
                </tr>
            `;
        }).join('');

        // Direct event listeners for refund action buttons
        tbody.querySelectorAll('.btn-disburse-refund').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reqId = btn.getAttribute('data-id');
                executeMarkRefundAsRefunded(reqId, btn);
            });
        });

        tbody.querySelectorAll('.btn-reject-refund').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reqId = btn.getAttribute('data-id');
                openCashierRejectModal(reqId);
            });
        });

        // Row click opens the full booking/refund details, but ignore if action buttons were clicked
        tbody.querySelectorAll('.refund-row-item').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.btn-disburse-refund') || e.target.closest('.btn-reject-refund') || e.target.closest('.btn-view-client-booking') || e.target.closest('.refund-actions-cell')) {
                    return;
                }
                const reqId = row.getAttribute('data-id');
                if (reqId) openClientBookingDetailsFullScreen(reqId);
            });
        });
    }

    // Filter pill clicks
    const refundPills = document.querySelectorAll('#refund-filter-pills .period-pill');
    refundPills.forEach(pill => {
        pill.addEventListener('click', () => {
            refundPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentRefundFilter = pill.getAttribute('data-ref-filter') || 'Pending';
            renderRefundsTable();
        });
    });

    document.getElementById('refund-search-input')?.addEventListener('input', renderRefundsTable);
    document.getElementById('btn-refresh-refunds')?.addEventListener('click', loadClientRefundsList);

    // Table click delegation fallback for Disburse & Reject
    document.getElementById('refunds-table-body')?.addEventListener('click', (e) => {
        const disburseBtn = e.target.closest('.btn-disburse-refund');
        if (disburseBtn) {
            e.stopPropagation();
            const reqId = disburseBtn.getAttribute('data-id');
            executeMarkRefundAsRefunded(reqId, disburseBtn);
            return;
        }

        const rejectBtn = e.target.closest('.btn-reject-refund');
        if (rejectBtn) {
            e.stopPropagation();
            const reqId = rejectBtn.getAttribute('data-id');
            openCashierRejectModal(reqId);
            return;
        }
    });

    // Fullscreen View: Client Booking & Refund Information
    function openClientBookingDetailsFullScreen(reqId) {
        const item = currentRefundsList.find(r => String(r.RefundRequestID) === String(reqId));
        if (!item) return;

        const view = document.getElementById('view-cashier-booking-details');
        if (!view) return;

        const bRefEl = document.getElementById('cbd-booking-ref');
        const bStatusEl = document.getElementById('cbd-booking-status');
        const pStatusEl = document.getElementById('cbd-payment-status');
        const pkgNameEl = document.getElementById('cbd-package-name');
        const provNameEl = document.getElementById('cbd-provider-name');

        const cNameEl = document.getElementById('cbd-client-name');
        const cPhoneEl = document.getElementById('cbd-client-phone');
        const cEmailEl = document.getElementById('cbd-client-email');
        const cGuestNameEl = document.getElementById('cbd-booking-guest-name');
        const cGuestContainer = document.getElementById('cbd-guest-container');

        const schedEl = document.getElementById('cbd-event-schedule');
        const venueEl = document.getElementById('cbd-event-venue');
        const addrEl = document.getElementById('cbd-event-address');

        const totalEl = document.getElementById('cbd-total-amount');
        const paidEl = document.getElementById('cbd-amount-paid');
        const refAmtEl = document.getElementById('cbd-refund-amount');

        const pMethodEl = document.getElementById('cbd-payout-method');
        const destNameEl = document.getElementById('cbd-destination-name');
        const destNumEl = document.getElementById('cbd-destination-number');
        const actionsContainer = document.getElementById('cbd-actions-container');

        if (bRefEl) bRefEl.textContent = item.BookingReference ? `#${item.BookingReference}` : (item.BookingID ? `#BK-${item.BookingID}` : `Ref #${item.RefundRequestID}`);
        if (bStatusEl) {
            bStatusEl.textContent = item.BookingStatus || 'Cancelled';
            bStatusEl.style.background = (item.BookingStatus === 'Cancelled') ? '#fee2e2' : '#f1f5f9';
            bStatusEl.style.color = (item.BookingStatus === 'Cancelled') ? '#dc2626' : '#334155';
        }
        if (pStatusEl) {
            pStatusEl.textContent = (item.Status === 'Approved') ? 'Refunded' : (item.Status || 'Pending');
            pStatusEl.style.background = (item.Status === 'Approved') ? '#dcfce7' : ((item.Status === 'Rejected') ? '#fee2e2' : '#eff6ff');
            pStatusEl.style.color = (item.Status === 'Approved') ? '#15803d' : ((item.Status === 'Rejected') ? '#991b1b' : '#1e40af');
        }
        if (pkgNameEl) pkgNameEl.textContent = item.PackageName || item.EventName || 'Lights & Sounds Event Package';
        if (provNameEl) provNameEl.innerHTML = `<i class="fa-solid fa-store" style="color:#64748b;"></i> ${item.ProviderName || 'Service Provider'}`;

        if (cNameEl) cNameEl.textContent = item.ClientName || 'Denver Cabrera';
        if (cPhoneEl) cPhoneEl.textContent = item.ClientPhone || item.BookingClientPhone || 'No Phone';
        if (cEmailEl) cEmailEl.textContent = item.ClientEmail || item.UserEmail || item.BookingClientEmail || 'No Email';

        if (cGuestNameEl && cGuestContainer) {
            if (item.BookingClientName && item.BookingClientName.toLowerCase() !== (item.ClientName || '').toLowerCase()) {
                cGuestNameEl.textContent = item.BookingClientName;
                cGuestContainer.style.display = 'block';
            } else {
                cGuestContainer.style.display = 'none';
            }
        }

        let dateStr = item.EventDate || item.ServiceStartDate || 'N/A';
        let timeStr = (item.StartTime && item.EndTime) ? ` (${item.StartTime} - ${item.EndTime})` : '';
        if (schedEl) schedEl.textContent = `${dateStr}${timeStr}`;

        if (venueEl) venueEl.textContent = item.VenueName || item.EventPlace || 'Venue Provided Upon Request';
        if (addrEl) addrEl.textContent = item.EventAddress || item.EventPlace || item.Location || 'Batangas';

        const totalVal = parseFloat(item.BookingTotalAmount || item.Amount || 0);
        const paidVal = parseFloat(item.BookingAmountPaid || item.Amount || 0);
        const refVal = parseFloat(item.Amount || 0);

        if (totalEl) totalEl.textContent = formatPHP(totalVal);
        if (paidEl) paidEl.textContent = formatPHP(paidVal);
        if (refAmtEl) refAmtEl.textContent = formatPHP(refVal);

        if (pMethodEl) pMethodEl.textContent = item.PayoutMethod || 'GCash';
        if (destNameEl) destNameEl.textContent = item.AccountName || item.ClientName || '-';
        if (destNumEl) destNumEl.textContent = item.AccountNumber || '-';

        // Action buttons inside the fullscreen view
        if (actionsContainer) {
            if (item.Status === 'Pending') {
                actionsContainer.innerHTML = `
                    <button type="button" class="btn btn-outline-danger btn-sm" id="btn-fullscreen-reject" style="color:#dc2626; border-color:#fca5a5; padding:8px 16px; font-weight:700;">
                        <i class="fa-solid fa-xmark"></i> Reject
                    </button>
                    <button type="button" class="btn btn-success btn-sm" id="btn-fullscreen-disburse" style="padding:8px 20px; font-weight:800;">
                        <i class="fa-solid fa-money-bill-transfer"></i> Mark as Refunded
                    </button>
                `;
                document.getElementById('btn-fullscreen-disburse')?.addEventListener('click', (e) => {
                    executeMarkRefundAsRefunded(item.RefundRequestID, e.currentTarget);
                });
                document.getElementById('btn-fullscreen-reject')?.addEventListener('click', () => {
                    closeClientBookingDetailsFullScreen();
                    openCashierRejectModal(item.RefundRequestID);
                });
            } else if (item.Status === 'Approved') {
                actionsContainer.innerHTML = `
                    <span style="color:#059669; font-weight:800; font-size:0.92rem;">
                        <i class="fa-solid fa-circle-check"></i> Ref: ${item.ReferenceNumber || 'Manual'}
                    </span>
                `;
            } else {
                actionsContainer.innerHTML = `
                    <span style="color:#dc2626; font-weight:700; font-size:0.88rem;">
                        <i class="fa-solid fa-circle-xmark"></i> ${item.AdminNotes || 'Rejected'}
                    </span>
                `;
            }
        }

        view.classList.remove('hidden');
        view.style.setProperty('display', 'flex', 'important');
        view.style.setProperty('visibility', 'visible', 'important');
        view.style.setProperty('opacity', '1', 'important');
        document.body.style.overflow = 'hidden';
    }

    function closeClientBookingDetailsFullScreen() {
        const view = document.getElementById('view-cashier-booking-details');
        if (view) {
            view.classList.add('hidden');
            view.style.setProperty('display', 'none', 'important');
            view.style.setProperty('visibility', 'hidden', 'important');
            view.style.setProperty('opacity', '0', 'important');
        }
        document.body.style.overflow = '';
    }

    // Expose globally so inline onclick on table rows always work
    window.openClientBookingDetailsFullScreen = openClientBookingDetailsFullScreen;
    window.closeClientBookingDetailsFullScreen = closeClientBookingDetailsFullScreen;

    document.getElementById('btn-close-cashier-booking-details')?.addEventListener('click', closeClientBookingDetailsFullScreen);

    // Keyboard ESC listener to close fullscreen view or modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const bView = document.getElementById('view-cashier-booking-details');
            if (bView && !bView.classList.contains('hidden') && bView.style.display !== 'none') {
                closeClientBookingDetailsFullScreen();
            }
            const wView = document.getElementById('view-cashier-withdrawal-details');
            if (wView && !wView.classList.contains('hidden') && wView.style.display !== 'none') {
                closeWithdrawalDetailsFullScreen();
            }
        }
    });

    // Direct Mark as Refunded (Cashier transfers outside system, directly mark and notify/email)
    async function executeMarkRefundAsRefunded(reqId, btnElement) {
        const item = currentRefundsList.find(r => String(r.RefundRequestID) === String(reqId));
        const clientName = item ? (item.ClientName || 'Client') : 'Client';
        const amountStr = item ? formatPHP(item.Amount) : '';
        const methodStr = item ? (item.PayoutMethod || 'GCash') : 'GCash';
        const accName = item ? (item.AccountName || '-') : '-';
        const accNum = item ? (item.AccountNumber || '-') : '-';

        const confirmed = confirm(
            `Confirm Manual Refund Sent:\n\n` +
            `• Client: ${clientName}\n` +
            `• Amount to Refund: ${amountStr}\n` +
            `• Payout Method: ${methodStr}\n` +
            `• Destination Account: ${accName} (${accNum})\n\n` +
            `Are you sure you want to mark this as Refunded?\nThis will update the client's status and automatically send them an email confirming the refund.`
        );
        if (!confirmed) return;

        let originalBtnHtml = '';
        if (btnElement) {
            originalBtnHtml = btnElement.innerHTML;
            btnElement.disabled = true;
            btnElement.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
        }

        try {
            const res = await fetch(`/api/cashier/refund-requests/${reqId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    referenceNumber: `MANUAL-${reqId}`,
                    notes: `Manually transferred via ${methodStr}`
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to mark refund as completed.');
            }

            alert(`🎉 Refund Successfully Marked as Refunded!\n\nAmount: ${amountStr}\nStatus has been reflected to the client and a confirmation email has been sent.`);
            await loadClientRefundsList();
            loadCashierSummary();

            // Refresh fullscreen view if open
            const bView = document.getElementById('view-cashier-booking-details');
            if (bView && !bView.classList.contains('hidden') && bView.style.display !== 'none') {
                openClientBookingDetailsFullScreen(reqId);
            }
        } catch (err) {
            console.error('Error marking refund as refunded:', err);
            alert(`⚠️ Error: ${err.message}`);
            if (btnElement) {
                btnElement.disabled = false;
                btnElement.innerHTML = originalBtnHtml || `<i class="fa-solid fa-money-bill-transfer"></i> Mark as Refunded`;
            }
        }
    }

    // Modal: Reject Client Refund
    function openCashierRejectModal(reqId) {
        const item = currentRefundsList.find(r => String(r.RefundRequestID) === String(reqId));
        if (!item) return;

        const reqIdInput = document.getElementById('cashier-reject-request-id');
        const clientNameSpan = document.getElementById('cashier-reject-client-name');
        const amountSpan = document.getElementById('cashier-reject-amount');
        const reasonInput = document.getElementById('cashier-reject-reason');
        const modal = document.getElementById('modal-cashier-reject-refund');

        if (reqIdInput) reqIdInput.value = item.RefundRequestID;
        if (clientNameSpan) clientNameSpan.textContent = item.ClientName || 'Client';
        if (amountSpan) amountSpan.textContent = formatPHP(item.Amount);
        if (reasonInput) reasonInput.value = '';

        if (modal) modal.classList.add('active');
    }

    function closeCashierRejectModal() {
        const modal = document.getElementById('modal-cashier-reject-refund');
        if (modal) modal.classList.remove('active');
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#btn-close-cashier-reject') || e.target.closest('#btn-cancel-cashier-reject')) {
            closeCashierRejectModal();
        }
    });

    document.addEventListener('submit', async (e) => {
        if (e.target && e.target.id === 'form-cashier-reject-refund') {
            e.preventDefault();
            const reqId = document.getElementById('cashier-reject-request-id')?.value;
            const reason = document.getElementById('cashier-reject-reason')?.value.trim();

            if (!reason) {
                alert('Please state a reason for rejecting the refund request.');
                return;
            }

            const submitBtn = document.getElementById('btn-submit-cashier-reject');
            const origHtml = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;
            }

            try {
                const res = await fetch(`/api/cashier/refund-requests/${reqId}/reject`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ reason })
                });

                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.message || 'Failed to reject refund.');
                }

                alert(`Refund Request #${reqId} Rejected.\n\nThe funds have been automatically returned to the client's wallet balance.`);
                closeCashierRejectModal();
                await loadClientRefundsList();
                loadCashierSummary();
            } catch (err) {
                console.error('Error rejecting refund:', err);
                alert(`⚠️ Error: ${err.message}`);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = origHtml;
                }
            }
        }
    });

    // Expose helpers globally to ensure inline onclick handlers always function
    window.executeMarkRefundAsRefunded = executeMarkRefundAsRefunded;
    window.openCashierRejectModal = openCashierRejectModal;
    window.closeCashierRejectModal = closeCashierRejectModal;
    window.openClientBookingDetailsFullScreen = openClientBookingDetailsFullScreen;
    window.closeClientBookingDetailsFullScreen = closeClientBookingDetailsFullScreen;

    // ----------------------------------------------------
    // 5. Provider Subscriptions Management & Cashier Payments
    // ----------------------------------------------------
    let currentSubscriptionsList = [];
    let currentSubscriptionFilter = 'All';
    let availableProvidersList = [];

    const modalRecordSub = document.getElementById('modal-record-subscription');
    const formRecordSub = document.getElementById('form-record-subscription');
    const selectSubPlan = document.getElementById('sub-select-plan');
    const inputSubAmount = document.getElementById('sub-input-amount');
    const selectSubProvider = document.getElementById('sub-select-provider');

    // Automatically update amount when plan dropdown changes
    if (selectSubPlan && inputSubAmount) {
        selectSubPlan.addEventListener('change', () => {
            const selectedOpt = selectSubPlan.options[selectSubPlan.selectedIndex];
            const defaultAmt = selectedOpt ? selectedOpt.getAttribute('data-amount') : '199.00';
            inputSubAmount.value = defaultAmt;
        });
    }

    function openRecordSubscriptionModal() {
        if (!modalRecordSub) return;
        if (formRecordSub) formRecordSub.reset();
        if (selectSubPlan && inputSubAmount) {
            selectSubPlan.value = 'monthly';
            inputSubAmount.value = '199.00';
        }
        modalRecordSub.classList.add('active');
    }

    function closeRecordSubscriptionModal() {
        if (!modalRecordSub) return;
        modalRecordSub.classList.remove('active');
    }

    document.getElementById('btn-open-record-sub-modal')?.addEventListener('click', openRecordSubscriptionModal);
    document.getElementById('btn-close-sub-modal')?.addEventListener('click', closeRecordSubscriptionModal);
    document.getElementById('btn-cancel-sub-modal')?.addEventListener('click', closeRecordSubscriptionModal);

    // Refresh Subscriptions
    document.getElementById('btn-refresh-subscriptions')?.addEventListener('click', loadCashierSubscriptions);

    // Filter pills for subscriptions
    document.querySelectorAll('#sub-filter-pills .period-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('#sub-filter-pills .period-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentSubscriptionFilter = pill.getAttribute('data-sub-filter') || 'All';
            renderSubscriptionsList();
        });
    });

    // Search input
    const subSearchInput = document.getElementById('subscription-search-input');
    if (subSearchInput) {
        subSearchInput.addEventListener('input', () => {
            renderSubscriptionsList();
        });
    }

    async function loadCashierSubscriptions() {
        const tbody = document.getElementById('subscriptions-table-body');
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:28px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading subscription payments...</td></tr>`;
        }

        try {
            const res = await fetch('/api/cashier/subscriptions/overview', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#ef4444;">${data.message || 'Failed to load subscription payments.'}</td></tr>`;
                return;
            }

            const kpis = data.kpis || {};
            const revEl = document.getElementById('sub-stat-revenue');
            const countEl = document.getElementById('sub-stat-paid-count');
            const activeEl = document.getElementById('sub-stat-active');
            const monthlyEl = document.getElementById('sub-stat-monthly');
            const yearlyEl = document.getElementById('sub-stat-yearly');

            if (revEl) revEl.textContent = formatPHP(kpis.totalRevenue);
            if (countEl) countEl.textContent = `${kpis.totalPaidTransactions || 0} Payments Collected`;
            if (activeEl) activeEl.textContent = kpis.activeCount || 0;
            if (monthlyEl) monthlyEl.textContent = kpis.monthlyCount || 0;
            if (yearlyEl) yearlyEl.textContent = kpis.yearlyCount || 0;

            currentSubscriptionsList = data.payments || [];
            availableProvidersList = data.providers || [];

            // Populate provider select in modal
            if (selectSubProvider) {
                selectSubProvider.innerHTML = `<option value="">-- Choose Service Provider --</option>` + 
                    availableProvidersList.map(p => `<option value="${p.ProviderID}">${p.BusinessName} (${p.Email || p.ServiceCategory || 'Provider'})</option>`).join('');
            }

            renderSubscriptionsList();
        } catch (err) {
            console.error('Error fetching cashier subscriptions:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#ef4444;">Error connecting to server.</td></tr>`;
        }
    }

    function renderSubscriptionsList() {
        const tbody = document.getElementById('subscriptions-table-body');
        if (!tbody) return;

        let filtered = [...currentSubscriptionsList];
        const term = (subSearchInput ? subSearchInput.value : '').toLowerCase().trim();

        // Apply plan filter
        if (currentSubscriptionFilter !== 'All') {
            filtered = filtered.filter(item => (item.PlanType || '').toLowerCase() === currentSubscriptionFilter.toLowerCase());
        }

        // Apply search query
        if (term) {
            filtered = filtered.filter(item => 
                (item.BusinessName && item.BusinessName.toLowerCase().includes(term)) ||
                (item.PaymentReference && item.PaymentReference.toLowerCase().includes(term)) ||
                (item.ProviderEmail && item.ProviderEmail.toLowerCase().includes(term)) ||
                (item.PaymentMethod && item.PaymentMethod.toLowerCase().includes(term))
            );
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748b;">No subscription payments found for this filter.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            const isAnnual = (item.PlanType || '').toLowerCase().includes('year') || (item.PlanType || '').toLowerCase().includes('annual');
            const planBadge = isAnnual 
                ? `<span class="badge" style="background:#fef3c7; color:#b45309; border:1px solid #fde68a;"><i class="fa-solid fa-award"></i> Pro Annual</span>`
                : `<span class="badge" style="background:#f3e8ff; color:#7e22ce; border:1px solid #e9d5ff;"><i class="fa-solid fa-calendar-week"></i> Pro Monthly</span>`;

            return `
                <tr>
                    <td><strong>${item.PaymentReference || 'SUB-' + item.PaymentID}</strong></td>
                    <td>
                        <div style="font-weight:700; color:#0a192f;">${item.BusinessName || 'Service Provider'}</div>
                        <div style="font-size:0.8rem; color:#64748b;">${item.ProviderEmail || item.OwnerName || ''}</div>
                    </td>
                    <td>${planBadge}</td>
                    <td><strong class="flow-inflow">+${formatPHP(item.Amount)}</strong></td>
                    <td><span class="badge" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0a192f;">${item.PaymentMethod || 'Cash'}</span></td>
                    <td><span style="font-size:0.85rem; color:#475569;">${formatDateTime(item.PaymentDate)}</span></td>
                    <td><span class="badge badge-approved">${item.PaymentStatus || 'Paid'}</span></td>
                </tr>
            `;
        }).join('');

        // Attach print receipt listeners
        document.querySelectorAll('.btn-print-sub-receipt').forEach(btn => {
            btn.addEventListener('click', () => {
                const pid = btn.getAttribute('data-pid');
                const payment = currentSubscriptionsList.find(p => String(p.PaymentID) === String(pid));
                if (payment) {
                    printSingleSubscriptionReceipt(payment);
                }
            });
        });
    }

    // Submit Cashier Record Subscription Payment Form
    if (formRecordSub) {
        formRecordSub.addEventListener('submit', async (e) => {
            e.preventDefault();

            const providerId = selectSubProvider.value;
            const planType = selectSubPlan.value;
            const amount = parseFloat(inputSubAmount.value || 0);
            const paymentMethod = document.getElementById('sub-payment-method').value;
            const referenceNumber = document.getElementById('sub-ref-number').value.trim();
            const notes = document.getElementById('sub-notes').value.trim();

            if (!providerId) {
                alert('Please select a service provider.');
                return;
            }
            if (!amount || amount <= 0) {
                alert('Please enter a valid payment amount.');
                return;
            }
            if (!referenceNumber) {
                alert('Please enter a transaction reference number.');
                return;
            }

            const submitBtn = document.getElementById('btn-submit-sub-payment');
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing & Activating...`;

            try {
                const res = await fetch('/api/cashier/subscriptions/record-payment', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        providerId,
                        planType,
                        amount,
                        paymentMethod,
                        referenceNumber,
                        notes
                    })
                });

                const data = await res.json();

                if (data.success) {
                    alert(data.message || 'Subscription payment recorded and activated!');
                    closeRecordSubscriptionModal();
                    loadCashierSubscriptions();
                    loadCashierSummary();
                } else {
                    alert(data.message || 'Failed to record subscription payment.');
                }
            } catch (err) {
                console.error('Error recording subscription payment:', err);
                alert('An error occurred while communicating with the server.');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-check"></i> Collect & Activate Plan`;
            }
        });
    }

    // Print individual subscription receipt
    function printSingleSubscriptionReceipt(payment) {
        const printArea = document.getElementById('printable-report-area');
        if (!printArea) return;

        const docId = `REC-${payment.PaymentID || Date.now().toString().slice(-6)}`;
        document.getElementById('print-doc-id').textContent = docId;
        document.getElementById('print-timestamp').textContent = formatDateTime(payment.PaymentDate || new Date());
        document.getElementById('print-title').textContent = 'OFFICIAL SUBSCRIPTION PAYMENT RECEIPT';
        document.getElementById('print-subtitle').textContent = `SoundSphere Pro Provider Subscription • Ref: ${payment.PaymentReference || docId}`;

        // KPIs
        document.getElementById('print-val-gross').textContent = formatPHP(payment.Amount);
        const printSubVal = document.getElementById('print-val-sub');
        if (printSubVal) printSubVal.textContent = formatPHP(payment.Amount);
        document.getElementById('print-val-commission').textContent = formatPHP(payment.Amount);
        document.getElementById('print-val-payouts').textContent = '₱0.00';

        // Breakdown Table
        const printBreakdownBody = document.getElementById('print-breakdown-body');
        printBreakdownBody.innerHTML = `
            <tr>
                <td><strong>Subscription Plan</strong></td>
                <td>${payment.PlanName || (payment.PlanType === 'yearly' ? 'Pro Annual Plan (365 Days)' : 'Pro Monthly Plan (30 Days)')}</td>
                <td>${formatPHP(payment.Amount)}</td>
                <td>-</td>
                <td>1 Plan Active</td>
            </tr>
        `;

        // Ledger Table
        const printLedgerBody = document.getElementById('print-ledger-body');
        printLedgerBody.innerHTML = `
            <tr>
                <td>${formatDateTime(payment.PaymentDate)}</td>
                <td><strong>${payment.PaymentReference || 'SUB-' + payment.PaymentID}</strong></td>
                <td>Subscription</td>
                <td>${payment.BusinessName || 'Service Provider'}</td>
                <td>+${formatPHP(payment.Amount)}</td>
                <td>-</td>
                <td>${formatPHP(payment.Amount)}</td>
                <td>${payment.PaymentStatus || 'Paid'}</td>
            </tr>
        `;

        window.print();
    }

    // ----------------------------------------------------
    // 6. Categorized Income Reports (Daily, Weekly, Monthly, Yearly)
    // ----------------------------------------------------
    let currentReportPeriod = 'daily';
    let currentLoadedReport = null;

    // Set default values for date inputs
    const todayIso = new Date().toISOString().split('T')[0];
    const monthIso = todayIso.substring(0, 7);
    const yearIso = todayIso.substring(0, 4);

    const dateDailyInput = document.getElementById('report-date-daily');
    const dateWeeklyInput = document.getElementById('report-date-weekly');
    const dateMonthlyInput = document.getElementById('report-date-monthly');
    const dateYearlyInput = document.getElementById('report-date-yearly');

    if (dateDailyInput) dateDailyInput.value = todayIso;
    if (dateWeeklyInput) dateWeeklyInput.value = todayIso;
    if (dateMonthlyInput) dateMonthlyInput.value = monthIso;
    if (dateYearlyInput) dateYearlyInput.value = yearIso;

    function setReportPeriod(period) {
        currentReportPeriod = period;
        
        // Update pill active state
        document.querySelectorAll('#report-period-pills .period-pill').forEach(pill => {
            if (pill.getAttribute('data-period') === period) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });

        // Toggle date controls
        document.querySelectorAll('.date-ctrl-group').forEach(el => el.style.display = 'none');
        const activeCtrl = document.getElementById(`filter-ctrl-${period}`);
        if (activeCtrl) activeCtrl.style.display = 'block';

        loadIncomeReport();
    }

    document.querySelectorAll('#report-period-pills .period-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            const p = pill.getAttribute('data-period');
            setReportPeriod(p);
        });
    });

    document.getElementById('btn-load-report')?.addEventListener('click', loadIncomeReport);

    async function loadIncomeReport() {
        let dateVal = '';
        if (currentReportPeriod === 'daily') dateVal = dateDailyInput ? dateDailyInput.value : todayIso;
        if (currentReportPeriod === 'weekly') dateVal = dateWeeklyInput ? dateWeeklyInput.value : todayIso;
        if (currentReportPeriod === 'monthly') dateVal = dateMonthlyInput ? dateMonthlyInput.value : monthIso;
        if (currentReportPeriod === 'yearly') dateVal = dateYearlyInput ? dateYearlyInput.value : yearIso;

        let queryUrl = `/api/cashier/reports/income?period=${currentReportPeriod}`;
        if (currentReportPeriod === 'daily' || currentReportPeriod === 'weekly') queryUrl += `&date=${dateVal}`;
        if (currentReportPeriod === 'monthly') queryUrl += `&month=${dateVal}`;
        if (currentReportPeriod === 'yearly') queryUrl += `&year=${dateVal}`;

        try {
            const res = await fetch(queryUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                alert(data.message || 'Failed to load income report.');
                return;
            }

            currentLoadedReport = data.report;
            renderIncomeReportUI(data.report);
        } catch (err) {
            console.error('Error loading income report:', err);
        }
    }

    function renderIncomeReportUI(rep) {
        if (!rep) return;

        // Headline & subtext
        document.getElementById('report-display-title').textContent = rep.periodTitle || 'Income Statement';
        document.getElementById('report-display-subtitle').textContent = `Financial Period: ${rep.filterLabel || ''}`;
        document.getElementById('report-generated-timestamp').textContent = formatDateTime(rep.generatedAt);

        // KPI Summary
        const s = rep.summary || {};
        const kpiGrossEl = document.getElementById('report-kpi-gross');
        const kpiBookingsEl = document.getElementById('report-kpi-bookings-count');
        const kpiSubEl = document.getElementById('report-kpi-subscription');
        const kpiCommEl = document.getElementById('report-kpi-commission');
        const kpiDisbursedEl = document.getElementById('report-kpi-disbursed');
        const kpiWithCountEl = document.getElementById('report-kpi-withdrawals-count');

        if (kpiGrossEl) kpiGrossEl.textContent = formatPHP(s.grossBookingRevenue);
        if (kpiBookingsEl) kpiBookingsEl.textContent = `${s.totalBookingsCount || 0} Bookings Paid`;
        if (kpiSubEl) kpiSubEl.textContent = formatPHP(s.totalSubscriptionRevenue || 0);
        if (kpiCommEl) kpiCommEl.textContent = formatPHP(s.netPlatformIncome);
        if (kpiDisbursedEl) kpiDisbursedEl.textContent = formatPHP(s.totalDisbursedPayouts);
        if (kpiWithCountEl) kpiWithCountEl.textContent = `${s.totalWithdrawalsCount || 0} Withdrawals Paid`;

        // Breakdown Table
        const breakdownTitle = document.getElementById('breakdown-section-title');
        const thInterval = document.getElementById('th-breakdown-interval');
        const breakdownTbody = document.getElementById('report-breakdown-table-body');

        if (rep.period === 'daily') {
            breakdownTitle.textContent = 'Daily Timeframe Category Breakdown';
            thInterval.textContent = 'Hour / Time Interval';
        } else if (rep.period === 'weekly') {
            breakdownTitle.textContent = 'Day-by-Day Weekly Breakdown';
            thInterval.textContent = 'Day of the Week';
        } else if (rep.period === 'monthly') {
            breakdownTitle.textContent = 'Weekly Monthly Breakdown';
            thInterval.textContent = 'Week Period';
        } else if (rep.period === 'yearly') {
            breakdownTitle.textContent = 'Annual Month-by-Month Breakdown';
            thInterval.textContent = 'Month';
        }

        const buckets = rep.breakdownBuckets || [];
        if (buckets.length === 0) {
            breakdownTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:18px; color:#64748b;">No interval transactions recorded.</td></tr>`;
        } else {
            breakdownTbody.innerHTML = buckets.map(b => `
                <tr>
                    <td><strong>${b.label}</strong></td>
                    <td class="flow-inflow">${formatPHP(b.grossVolume)}</td>
                    <td><strong>${formatPHP(b.commission || b.netIncome)}</strong></td>
                    <td class="flow-outflow">${formatPHP(b.payouts)}</td>
                    <td><span class="badge" style="background:#f1f5f9; color:#0a192f; border:1px solid #cbd5e1;">${b.transactionCount || 0} entries</span></td>
                </tr>
            `).join('');
        }

        // Detailed Ledger Table
        const ledgerTbody = document.getElementById('report-ledger-table-body');
        const ledger = rep.detailedLedger || [];

        if (ledger.length === 0) {
            ledgerTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No individual transactions recorded in this period.</td></tr>`;
        } else {
            ledgerTbody.innerHTML = ledger.map(item => {
                const isInflow = item.inflow > 0;
                const flowClass = isInflow ? 'flow-inflow' : 'flow-outflow';
                const sign = isInflow ? '+' : '-';
                const amt = isInflow ? item.inflow : item.outflow;

                return `
                    <tr>
                        <td><span style="font-size:0.8rem; color:#475569;">${formatDateTime(item.date)}</span></td>
                        <td><strong>${item.reference}</strong></td>
                        <td><span class="badge" style="background:#f8fafc; border:1px solid #cbd5e1; color:#0a192f;">${item.type}</span></td>
                        <td>
                            <div style="font-weight:600; color:#0a192f;">${item.party}</div>
                        </td>
                        <td><span style="font-size:0.82rem; color:#475569;">${item.itemDescription || '-'}</span></td>
                        <td class="flow-inflow">${item.inflow > 0 ? '+' + formatPHP(item.inflow) : '-'}</td>
                        <td class="flow-outflow">${item.outflow > 0 ? '-' + formatPHP(item.outflow) : '-'}</td>
                        <td>${item.commission > 0 ? formatPHP(item.commission) : '-'}</td>
                        <td><span class="badge ${item.status === 'Approved' || item.status === 'Paid' ? 'badge-approved' : 'badge-pending'}">${item.status}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }

    // ----------------------------------------------------
    // 7. Printable Report Trigger & Generation
    // ----------------------------------------------------
    function triggerPrintReport() {
        if (!currentLoadedReport) {
            alert('Please load an income report first before printing.');
            return;
        }

        const rep = currentLoadedReport;
        const s = rep.summary || {};

        // Populate Printable template elements
        const docId = `REP-${Date.now().toString().slice(-6)}`;
        document.getElementById('print-doc-id').textContent = docId;
        document.getElementById('print-timestamp').textContent = new Date().toLocaleString();
        document.getElementById('print-title').textContent = (rep.periodTitle || 'INCOME STATEMENT').toUpperCase();
        document.getElementById('print-subtitle').textContent = `Financial Period: ${rep.filterLabel || ''} (${rep.startDate ? rep.startDate.substring(0, 10) : ''} to ${rep.endDate ? rep.endDate.substring(0, 10) : ''})`;

        // KPIs
        document.getElementById('print-val-gross').textContent = formatPHP(s.grossBookingRevenue);
        const printValSub = document.getElementById('print-val-sub');
        if (printValSub) printValSub.textContent = formatPHP(s.totalSubscriptionRevenue || 0);
        document.getElementById('print-val-commission').textContent = formatPHP(s.netPlatformIncome);
        document.getElementById('print-val-payouts').textContent = formatPHP(s.totalDisbursedPayouts);

        // Periodic Breakdown
        const printBreakdownBody = document.getElementById('print-breakdown-body');
        const printThInterval = document.getElementById('print-th-interval');
        printThInterval.textContent = rep.period === 'daily' ? 'Hour Interval' : (rep.period === 'weekly' ? 'Day of Week' : (rep.period === 'monthly' ? 'Week' : 'Month'));

        const buckets = rep.breakdownBuckets || [];
        printBreakdownBody.innerHTML = buckets.map(b => `
            <tr>
                <td><strong>${b.label}</strong></td>
                <td>${formatPHP(b.grossVolume)}</td>
                <td>${formatPHP(b.commission || b.netIncome)}</td>
                <td>${formatPHP(b.payouts)}</td>
                <td>${b.transactionCount || 0}</td>
            </tr>
        `).join('');

        // Ledger Table
        const printLedgerBody = document.getElementById('print-ledger-body');
        const ledger = rep.detailedLedger || [];
        printLedgerBody.innerHTML = ledger.slice(0, 100).map(item => `
            <tr>
                <td>${formatDateTime(item.date)}</td>
                <td><strong>${item.reference}</strong></td>
                <td>${item.type}</td>
                <td>${item.party}</td>
                <td>${item.inflow > 0 ? formatPHP(item.inflow) : '-'}</td>
                <td>${item.outflow > 0 ? formatPHP(item.outflow) : '-'}</td>
                <td>${item.commission > 0 ? formatPHP(item.commission) : '-'}</td>
                <td>${item.status}</td>
            </tr>
        `).join('');

        // Execute print
        window.print();
    }

    document.getElementById('btn-trigger-print-report')?.addEventListener('click', triggerPrintReport);

    // Quick print today's report
    document.getElementById('btn-quick-print-today')?.addEventListener('click', async () => {
        setReportPeriod('daily');
        if (dateDailyInput) dateDailyInput.value = todayIso;
        await loadIncomeReport();
        setTimeout(() => {
            triggerPrintReport();
        }, 300);
    });

    // ----------------------------------------------------
    // 8. Platform Revenue Reports & Provider Breakdown
    // ----------------------------------------------------
    let cashierProviderRevenueMap = {};

    async function loadCashierRevenueReports() {
        const tableSummary = document.getElementById('table-cashier-provider-revenue');
        const tablePayouts = document.getElementById('table-cashier-revenue-payouts');
        const grossVal = document.getElementById('cashier-revenue-gross-val');
        const completedVal = document.getElementById('cashier-revenue-completed-val');
        const commissionVal = document.getElementById('cashier-revenue-commission-val');

        // Ensure we are viewing main list
        backToCashierRevenueList();

        try {
            const res = await fetch('/api/cashier/revenue-summary', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await res.json();
            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                if (tableSummary) tableSummary.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ef4444;">${data.message || 'Failed to load revenue summary.'}</td></tr>`;
                return;
            }

            const stats = data.stats || {};
            if (grossVal) grossVal.textContent = formatPHP(stats.grossRevenue);
            if (completedVal) completedVal.textContent = formatPHP(stats.completedRevenue);
            if (commissionVal) commissionVal.textContent = formatPHP(stats.adminCommission);

            const providers = data.providerBreakdown || [];
            cashierProviderRevenueMap = {};
            providers.forEach(p => {
                cashierProviderRevenueMap[p.providerName] = p;
            });

            // 1. Render Provider Revenue Summary Table
            if (tableSummary) {
                if (providers.length === 0) {
                    tableSummary.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:#64748b;">No service provider revenue records found.</td></tr>`;
                } else {
                    tableSummary.innerHTML = providers.map(p => `
                        <tr>
                            <td>
                                <strong style="color:#0a192f; font-size:0.92rem; display:block;">${p.providerName}</strong>
                                <span style="font-size:0.75rem; color:#64748b;">${p.providerEmail || ''}</span>
                            </td>
                            <td><span style="font-size:0.82rem; color:#475569;"><i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Verified Provider</span></td>
                            <td><strong style="font-size:0.95rem; color:#0a192f;">${formatPHP(p.grossRevenue)}</strong></td>
                            <td><strong style="font-size:0.95rem; color:#10b981;">${formatPHP(p.netEarnings)}</strong></td>
                            <td><strong style="font-size:0.95rem; color:#8b5cf6;">${formatPHP(p.adminCommission)}</strong></td>
                            <td><span style="font-size:0.85rem; font-weight:700; color:#2563eb;">${p.bookingsCount} Booking(s)</span></td>
                            <td style="text-align:right;">
                                <button type="button" class="btn btn-primary btn-sm btn-view-prov-revenue" data-prov-name="${encodeURIComponent(p.providerName)}">
                                    <i class="fa-solid fa-eye"></i> View Revenue Details
                                </button>
                            </td>
                        </tr>
                    `).join('');

                    tableSummary.querySelectorAll('.btn-view-prov-revenue').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const pName = decodeURIComponent(btn.getAttribute('data-prov-name'));
                            openCashierProviderRevenueDetail(pName);
                        });
                    });
                }
            }

            // 2. Render Provider Payout Requests Table
            if (tablePayouts) {
                const payouts = data.payoutRequests || [];
                if (payouts.length === 0) {
                    tablePayouts.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:28px; color:#64748b;">No provider payout requests submitted.</td></tr>`;
                } else {
                    tablePayouts.innerHTML = payouts.map(w => {
                        const isApproved = w.status === 'Approved' || w.status === 'Processed';
                        const isPending = w.status === 'Pending';
                        const reqDate = w.dateRequested ? new Date(w.dateRequested).toLocaleDateString() : 'N/A';

                        const statusBadge = isApproved
                            ? `<span class="badge badge-approved"><i class="fa-solid fa-check"></i> Paid &amp; Sent</span>`
                            : (isPending 
                                ? `<span class="badge badge-pending"><i class="fa-solid fa-clock"></i> Pending Manual Payout</span>`
                                : `<span class="badge badge-rejected"><i class="fa-solid fa-ban"></i> Rejected</span>`);

                        const actionBtn = isApproved
                            ? `<span style="font-size:0.8rem; color:#10b981; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Paid &amp; Sent</span>`
                            : (isPending 
                                ? `<button type="button" class="btn btn-success btn-sm btn-revenue-disburse" data-wid="${w.withdrawalId}">
                                     <i class="fa-solid fa-paper-plane"></i> Disburse
                                   </button>`
                                : `<span style="font-size:0.8rem; color:#ef4444; font-weight:600;">Closed</span>`);

                        return `
                            <tr>
                                <td><strong style="color:#2563eb; font-size:0.88rem;">${w.requestId}</strong></td>
                                <td>
                                    <strong style="color:#0a192f; font-size:0.88rem; display:block;">${w.providerName}</strong>
                                    <span style="font-size:0.75rem; color:#64748b;">${w.providerEmail}</span>
                                </td>
                                <td><strong style="font-size:0.95rem; color:#10b981;">${formatPHP(w.amountRequested)}</strong></td>
                                <td><span style="font-size:0.84rem; color:#0a192f; font-weight:700;"><i class="fa-solid fa-wallet" style="color:#2563eb;"></i> ${w.payoutChannel}</span></td>
                                <td><strong style="font-size:0.88rem; color:#0a192f;">${w.accountHolderName}</strong></td>
                                <td><span style="font-size:0.88rem; color:#2563eb; font-weight:700; background:#eff6ff; padding:3px 8px; border-radius:6px;">${w.receiverAccount}</span></td>
                                <td><span style="font-size:0.84rem; color:#64748b;">${reqDate}</span></td>
                                <td>${statusBadge}</td>
                                <td style="text-align:right;">${actionBtn}</td>
                            </tr>
                        `;
                    }).join('');

                    tablePayouts.querySelectorAll('.btn-revenue-disburse').forEach(btn => {
                        btn.addEventListener('click', () => {
                            const wid = btn.getAttribute('data-wid');
                            executeDisbursePayout(wid, btn);
                        });
                    });
                }
            }

        } catch (err) {
            console.error('Error loading revenue reports:', err);
            if (tableSummary) tableSummary.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#ef4444;">Failed to load revenue reports.</td></tr>`;
        }
    }

    function openCashierProviderRevenueDetail(providerName) {
        const group = cashierProviderRevenueMap[providerName];
        if (!group) return;

        const mainView = document.getElementById('cashier-revenue-main-view');
        const detailView = document.getElementById('cashier-revenue-detail-view');

        if (mainView) mainView.style.display = 'none';
        if (detailView) detailView.style.display = 'block';

        document.getElementById('cashier-detail-prov-name').textContent = group.providerName;
        document.getElementById('cashier-detail-prov-email').textContent = group.providerEmail ? `Email: ${group.providerEmail}` : 'Verified SoundSphere Partner Provider';

        document.getElementById('cashier-detail-prov-gross').textContent = formatPHP(group.grossRevenue);
        document.getElementById('cashier-detail-prov-net').textContent = formatPHP(group.netEarnings);
        document.getElementById('cashier-detail-prov-admin').textContent = formatPHP(group.adminCommission);

        const tbody = document.getElementById('table-cashier-detail-prov-transactions');
        if (tbody) {
            const bookings = group.bookings || [];
            if (bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No transactions recorded for this provider.</td></tr>`;
            } else {
                tbody.innerHTML = bookings.map(b => `
                    <tr>
                        <td><strong>${b.bookingReference}</strong></td>
                        <td>${b.clientName}</td>
                        <td>${b.packageName}</td>
                        <td><span style="font-size:0.84rem; color:#64748b;">${b.eventDate ? new Date(b.eventDate).toLocaleDateString() : 'N/A'}</span></td>
                        <td><strong style="color:#0a192f;">${formatPHP(b.grossAmount)}</strong></td>
                        <td><strong style="color:#8b5cf6;">${formatPHP(b.adminFee)}</strong></td>
                        <td><strong style="color:#10b981;">${formatPHP(b.netPayout)}</strong></td>
                        <td><span style="font-size:0.8rem; font-weight:600;"><i class="fa-solid fa-mobile-screen" style="color:#2563eb;"></i> ${b.paymentMethod}</span></td>
                        <td><span class="badge badge-approved">${b.status}</span></td>
                    </tr>
                `).join('');
            }
        }
    }

    function backToCashierRevenueList() {
        const mainView = document.getElementById('cashier-revenue-main-view');
        const detailView = document.getElementById('cashier-revenue-detail-view');

        if (mainView) mainView.style.display = 'block';
        if (detailView) detailView.style.display = 'none';
    }

    document.getElementById('btn-cashier-back-to-revenue-list')?.addEventListener('click', backToCashierRevenueList);

    // Sign Out Button Handler
    document.getElementById('btn-cashier-logout')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to sign out of the Cashier Financial Desk?')) {
            clearCashierSession();
            window.location.href = '/login.html';
        }
    });

    // ----------------------------------------------------
    // 9. Initial Page Boot
    // ----------------------------------------------------
    const initialHash = window.location.hash || '#overview';
    switchView(initialHash);
});
