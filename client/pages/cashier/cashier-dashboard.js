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
            alert(`Cashier Portal Access Restricted:\n\nYou are currently signed in with a '${userRoleRaw}' account.\nThe Cashier Financial Desk requires a Cashier or Admin staff account.\n\nPlease log in with your Cashier credentials:\n• Email: soundsphere.cashier@gmail.com\n• Password: soundsphere@17`);
        }
        clearCashierSession();
        window.location.href = '/login.html?redirect=/cashier/dashboard.html';
        return;
    }

    // Helper to gracefully handle any 401 / 403 API response
    function handleCashierAuthError(res, data) {
        if (res.status === 401 || res.status === 403) {
            console.warn('Cashier authentication error:', data?.message);
            alert(`Session Expired or Unauthorized:\n\n${data?.message || 'Access restricted to Cashier and Administrator accounts.'}\n\nPlease sign in with your Cashier account (soundsphere.cashier@gmail.com).`);
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
            topbarTitle.textContent = 'Revenue';
            loadCashierRevenueReports();
        } else if (cleanHash === 'reports') {
            topbarTitle.textContent = 'Income Report';
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

            // Also refresh notifications when summary refreshes
            loadCashierNotifications();
        } catch (err) {
            console.error('Error fetching cashier summary:', err);
        }
    }

    const refreshOverviewBtn = document.getElementById('btn-refresh-overview');
    if (refreshOverviewBtn) {
        refreshOverviewBtn.addEventListener('click', () => {
            loadCashierSummary();
            loadCashierNotifications();
        });
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
    // Cashier Real-Time Topbar Notifications System
    // ----------------------------------------------------
    let cashierNotificationsList = [];
    const notifBtn = document.getElementById('btn-cashier-notifications');
    const notifDropdown = document.getElementById('cashier-notif-dropdown');
    const notifBadge = document.getElementById('cashier-notif-badge');
    const notifHeaderCount = document.getElementById('cashier-notif-header-count');
    const notifListContainer = document.getElementById('cashier-notif-list');
    const markAllReadBtn = document.getElementById('btn-cashier-mark-all-read');

    const getCashierNotifMeta = (n) => {
        const type = String(n.NotificationType || n.RelatedType || '').toLowerCase();
        const title = String(n.Title || '').toLowerCase();
        const text = String(n.Message || '').toLowerCase();

        if (type.includes('refund') || title.includes('refund') || text.includes('refund')) {
            return {
                icon: 'fa-hand-holding-dollar',
                color: '#ef4444',
                bg: '#fef2f2',
                target: 'refunds',
                badgeText: 'Client Refund'
            };
        }
        if (type.includes('disburs') || title.includes('disburs') || text.includes('disburs') || (type.includes('withdrawal') && n.IsRead)) {
            return {
                icon: 'fa-circle-check',
                color: '#10b981',
                bg: '#ecfdf5',
                target: 'withdrawals',
                badgeText: 'Disbursed'
            };
        }
        if (type.includes('withdraw') || title.includes('withdraw') || text.includes('payout')) {
            return {
                icon: 'fa-money-bill-transfer',
                color: '#d97706',
                bg: '#fffbeb',
                target: 'withdrawals',
                badgeText: 'Withdrawal'
            };
        }
        if (type.includes('subscription') || title.includes('subscription')) {
            return {
                icon: 'fa-crown',
                color: '#8b5cf6',
                bg: '#f5f3ff',
                target: 'subscriptions',
                badgeText: 'Subscription'
            };
        }
        return {
            icon: 'fa-bell',
            color: '#2563eb',
            bg: '#eff6ff',
            target: 'overview',
            badgeText: 'Alert'
        };
    };

    const formatNotifRelativeTime = (dateVal) => {
        if (!dateVal) return 'Just now';
        const d = new Date(dateVal);
        const now = new Date();
        const diffMs = now - d;
        const diffSecs = Math.floor(diffMs / 1000);
        const diffMins = Math.floor(diffSecs / 60);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSecs < 60) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    async function loadCashierNotifications() {
        if (!token) return;
        try {
            const res = await fetch('/api/cashier/notifications', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();
            if (handleCashierAuthError(res, data)) return;

            if (!data.success) {
                console.warn('Could not load cashier notifications:', data.message);
                return;
            }

            cashierNotificationsList = data.notifications || [];
            const unreadCount = data.unreadCount !== undefined ? data.unreadCount : cashierNotificationsList.filter(n => !n.IsRead).length;

            // Update badge in topbar
            if (notifBadge) {
                if (unreadCount > 0) {
                    notifBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                    notifBadge.style.display = 'flex';
                    notifBtn?.classList.add('has-unread');
                } else {
                    notifBadge.style.display = 'none';
                    notifBtn?.classList.remove('has-unread');
                }
            }

            // Update header count in dropdown
            if (notifHeaderCount) {
                if (unreadCount > 0) {
                    notifHeaderCount.textContent = `${unreadCount} new`;
                    notifHeaderCount.style.display = 'inline-block';
                } else {
                    notifHeaderCount.style.display = 'none';
                }
            }

            // Render list
            renderCashierNotificationsList();
            renderFullScreenNotifications();

        } catch (err) {
            console.warn('Error fetching cashier notifications:', err);
        }
    }

    function renderCashierNotificationsList() {
        if (!notifListContainer) return;

        if (cashierNotificationsList.length === 0) {
            notifListContainer.innerHTML = `
                <div style="padding:36px 16px; text-align:center; color:#94a3b8; font-size:0.88rem;">
                    <i class="fa-solid fa-bell-slash" style="font-size:1.8rem; color:#cbd5e1; margin-bottom:10px; display:block;"></i>
                    No notifications at this time.
                </div>
            `;
            return;
        }

        notifListContainer.innerHTML = cashierNotificationsList.map(n => {
            const isUnread = !n.IsRead && n.IsRead !== 1;
            const meta = getCashierNotifMeta(n);
            const timeAgo = formatNotifRelativeTime(n.CreatedAt);

            return `
                <div class="cashier-notif-item ${isUnread ? 'unread' : ''}" 
                     data-id="${n.NotificationID || ''}" 
                     data-target="${meta.target}"
                     data-related-id="${n.RelatedID || ''}"
                     style="padding:12px 16px; border-bottom:1px solid #f1f5f9; background:${isUnread ? '#f0f7ff' : '#ffffff'}; cursor:pointer; display:flex; gap:12px; align-items:flex-start; transition:background 0.15s ease;"
                     title="Click to open ${meta.target}">
                    <div class="cashier-notif-icon" style="background:${meta.bg}; color:${meta.color};">
                        <i class="fa-solid ${meta.icon}"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:3px;">
                            <strong style="font-size:0.86rem; color:#0f172a; display:flex; align-items:center; gap:6px; line-height:1.3;">
                                ${isUnread ? '<span style="width:7px; height:7px; border-radius:50%; background:#2563eb; display:inline-block; flex-shrink:0;"></span>' : ''}
                                ${n.Title || 'Notice'}
                            </strong>
                            <span style="font-size:0.72rem; color:#94a3b8; white-space:nowrap; margin-top:1px;">${timeAgo}</span>
                        </div>
                        <p style="font-size:0.8rem; color:#475569; margin:0 0 5px 0; line-height:1.4; word-break:break-word;">
                            ${n.Message || ''}
                        </p>
                        <div style="display:flex; align-items:center; justify-content:space-between; font-size:0.72rem;">
                            <span style="background:${meta.bg}; color:${meta.color}; padding:2px 7px; border-radius:6px; font-weight:700; font-size:0.7rem;">
                                ${meta.badgeText}
                            </span>
                            <span style="color:#2563eb; font-weight:600; display:inline-flex; align-items:center; gap:4px;">
                                View <i class="fa-solid fa-arrow-right" style="font-size:0.65rem;"></i>
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click listeners to notification items
        notifListContainer.querySelectorAll('.cashier-notif-item').forEach(item => {
            item.addEventListener('click', async () => {
                const notifId = item.getAttribute('data-id');
                const targetView = item.getAttribute('data-target') || 'overview';
                const relatedId = item.getAttribute('data-related-id');

                // Mark as read in UI immediately
                item.classList.remove('unread');
                item.style.backgroundColor = '#ffffff';
                const dot = item.querySelector('strong span');
                if (dot) dot.remove();

                // Call API to mark as read
                if (notifId && token) {
                    try {
                        fetch(`/api/cashier/notifications/${encodeURIComponent(notifId)}/read`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Accept': 'application/json'
                            }
                        }).catch(e => console.warn('Mark read error:', e));
                    } catch (e) {}
                }

                // Update unread count in UI
                const notifObj = cashierNotificationsList.find(x => String(x.NotificationID) === String(notifId));
                if (notifObj) notifObj.IsRead = true;
                const newUnread = cashierNotificationsList.filter(n => !n.IsRead).length;
                if (notifBadge) {
                    if (newUnread > 0) {
                        notifBadge.textContent = newUnread > 99 ? '99+' : newUnread;
                        notifBadge.style.display = 'flex';
                    } else {
                        notifBadge.style.display = 'none';
                        notifBtn?.classList.remove('has-unread');
                    }
                }
                if (notifHeaderCount) {
                    if (newUnread > 0) {
                        notifHeaderCount.textContent = `${newUnread} new`;
                        notifHeaderCount.style.display = 'inline-block';
                    } else {
                        notifHeaderCount.style.display = 'none';
                    }
                }

                // Close dropdown
                if (notifDropdown) notifDropdown.style.display = 'none';
                if (notifBtn) notifBtn.classList.remove('active');

                // Navigate to target view panel
                if (targetView) {
                    window.location.hash = `#${targetView}`;
                    switchView(targetView);

                    if (targetView === 'withdrawals') {
                        currentWithdrawalFilter = 'Pending';
                        const filterSelect = document.getElementById('withdrawals-filter-status');
                        if (filterSelect) filterSelect.value = 'Pending';
                        loadWithdrawalsList();
                    } else if (targetView === 'refunds') {
                        currentRefundsFilter = 'Pending';
                        const refSelect = document.getElementById('refunds-filter-status');
                        if (refSelect) refSelect.value = 'Pending';
                        loadClientRefundsList();
                    }
                }
            });
        });
    }

    // Toggle Dropdown on Bell Button Click
    if (notifBtn) {
        notifBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!notifDropdown) return;
            const isVisible = notifDropdown.style.display === 'block';
            if (isVisible) {
                notifDropdown.style.display = 'none';
                notifBtn.classList.remove('active');
            } else {
                notifDropdown.style.display = 'block';
                notifBtn.classList.add('active');
                loadCashierNotifications();
            }
        });
    }

    // Mark All Read Handler
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!token) return;
            try {
                // Instantly update UI
                cashierNotificationsList.forEach(n => { n.IsRead = true; });
                if (notifBadge) {
                    notifBadge.style.display = 'none';
                    notifBtn?.classList.remove('has-unread');
                }
                if (notifHeaderCount) notifHeaderCount.style.display = 'none';
                renderCashierNotificationsList();
                renderFullScreenNotifications();

                await fetch('/api/cashier/notifications/read-all', {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json'
                    }
                });
            } catch (err) {
                console.warn('Error marking all notifications read:', err);
            }
        });
    }

    // Close Dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (notifDropdown && notifDropdown.style.display === 'block') {
            if (!notifDropdown.contains(e.target) && !notifBtn?.contains(e.target)) {
                notifDropdown.style.display = 'none';
                notifBtn?.classList.remove('active');
            }
        }
    });

    // Prevent clicks inside the dropdown from bubbling to document and closing it
    if (notifDropdown) {
        notifDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    // ----------------------------------------------------
    // Fullscreen Cashier Notifications Desk
    // ----------------------------------------------------
    let currentFsNotifFilter = 'all';
    let currentFsNotifSearch = '';

    function openCashierNotificationsFullScreen() {
        if (notifDropdown) notifDropdown.style.display = 'none';
        if (notifBtn) notifBtn.classList.remove('active');

        const view = document.getElementById('view-cashier-fullscreen-notifications');
        if (!view) return;

        view.classList.remove('hidden');
        view.style.setProperty('display', 'flex', 'important');
        view.style.setProperty('visibility', 'visible', 'important');
        view.style.setProperty('opacity', '1', 'important');
        document.body.style.overflow = 'hidden';

        renderFullScreenNotifications();
    }

    function closeCashierNotificationsFullScreen() {
        const view = document.getElementById('view-cashier-fullscreen-notifications');
        if (view) {
            view.classList.add('hidden');
            view.style.setProperty('display', 'none', 'important');
            view.style.setProperty('visibility', 'hidden', 'important');
            view.style.setProperty('opacity', '0', 'important');
        }
        document.body.style.overflow = '';
    }

    window.openCashierNotificationsFullScreen = openCashierNotificationsFullScreen;
    window.closeCashierNotificationsFullScreen = closeCashierNotificationsFullScreen;

    document.getElementById('btn-cashier-view-all-notifs')?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openCashierNotificationsFullScreen();
    });

    document.getElementById('btn-close-cashier-fullscreen-notifs')?.addEventListener('click', closeCashierNotificationsFullScreen);

    function updateFsCounts() {
        const unreadCount = cashierNotificationsList.filter(n => !n.IsRead).length;
        const wdCount = cashierNotificationsList.filter(n => {
            const meta = getCashierNotifMeta(n);
            return meta.target === 'withdrawals' && !n.IsRead;
        }).length;
        const refCount = cashierNotificationsList.filter(n => {
            const meta = getCashierNotifMeta(n);
            return meta.target === 'refunds' && !n.IsRead;
        }).length;
        const disbCount = cashierNotificationsList.filter(n => {
            const meta = getCashierNotifMeta(n);
            return meta.badgeText === 'Disbursed';
        }).length;

        const elAll = document.getElementById('fs-count-all');
        const elUnread = document.getElementById('fs-count-unread');
        const elWd = document.getElementById('fs-count-withdrawals');
        const elRef = document.getElementById('fs-count-refunds');
        const elDisb = document.getElementById('fs-count-disbursed');

        if (elAll) elAll.textContent = cashierNotificationsList.length;
        if (elUnread) elUnread.textContent = unreadCount;
        if (elWd) elWd.textContent = wdCount;
        if (elRef) elRef.textContent = refCount;
        if (elDisb) elDisb.textContent = disbCount;
    }

    function renderFullScreenNotifications() {
        updateFsCounts();

        const container = document.getElementById('fs-notifs-feed');
        if (!container) return;

        let filtered = cashierNotificationsList.slice();

        // Apply tab filter
        if (currentFsNotifFilter === 'unread') {
            filtered = filtered.filter(n => !n.IsRead);
        } else if (currentFsNotifFilter === 'withdrawals') {
            filtered = filtered.filter(n => {
                const meta = getCashierNotifMeta(n);
                return meta.target === 'withdrawals' && !n.IsRead;
            });
        } else if (currentFsNotifFilter === 'refunds') {
            filtered = filtered.filter(n => {
                const meta = getCashierNotifMeta(n);
                return meta.target === 'refunds' && !n.IsRead;
            });
        } else if (currentFsNotifFilter === 'disbursed') {
            filtered = filtered.filter(n => {
                const meta = getCashierNotifMeta(n);
                return meta.badgeText === 'Disbursed';
            });
        }

        // Apply search filter
        if (currentFsNotifSearch.trim()) {
            const query = currentFsNotifSearch.trim().toLowerCase();
            filtered = filtered.filter(n => {
                const title = String(n.Title || '').toLowerCase();
                const msg = String(n.Message || '').toLowerCase();
                const ref = String(n.RelatedID || '').toLowerCase();
                return title.includes(query) || msg.includes(query) || ref.includes(query);
            });
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="padding:60px 20px; text-align:center; color:#94a3b8;">
                    <i class="fa-solid fa-bell-slash" style="font-size:2.4rem; color:#cbd5e1; margin-bottom:12px; display:block;"></i>
                    <strong style="font-size:1.05rem; color:#475569; display:block; margin-bottom:4px;">No notifications found</strong>
                    <p style="font-size:0.86rem; color:#94a3b8; margin:0;">Try switching the filter tab or clearing the search query.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filtered.map(n => {
            const isUnread = !n.IsRead && n.IsRead !== 1;
            const meta = getCashierNotifMeta(n);
            const timeAgo = formatNotifRelativeTime(n.CreatedAt);
            const exactTime = n.CreatedAt ? new Date(n.CreatedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Recent';

            let actionBtnText = 'View Details';
            let actionBtnIcon = 'fa-arrow-right';
            let actionBtnClass = 'btn-secondary';

            if (meta.target === 'withdrawals' && !n.IsRead) {
                actionBtnText = 'Disburse Payout';
                actionBtnIcon = 'fa-money-bill-transfer';
                actionBtnClass = 'btn-primary';
            } else if (meta.target === 'refunds' && !n.IsRead) {
                actionBtnText = 'Process Refund';
                actionBtnIcon = 'fa-hand-holding-dollar';
                actionBtnClass = 'btn-danger';
            }

            return `
                <div class="fs-notif-row ${isUnread ? 'unread' : ''}" data-id="${n.NotificationID || ''}" data-target="${meta.target}" style="border-bottom:1px solid #f1f5f9; padding:20px 24px; display:flex; gap:20px; align-items:flex-start; transition:all 0.15s ease;">
                    <div style="width:48px; height:48px; border-radius:14px; background:${meta.bg}; color:${meta.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.35rem; margin-top:2px; box-shadow:0 2px 6px rgba(0,0,0,0.04);">
                        <i class="fa-solid ${meta.icon}"></i>
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:8px; margin-bottom:6px;">
                            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                <strong style="font-size:1.02rem; color:#0f172a; display:flex; align-items:center; gap:8px;">
                                    ${isUnread ? '<span style="width:8px; height:8px; border-radius:50%; background:#2563eb; display:inline-block; flex-shrink:0;"></span>' : ''}
                                    ${n.Title || 'Cashier Alert'}
                                </strong>
                                <span style="background:${meta.bg}; color:${meta.color}; padding:3px 10px; border-radius:8px; font-weight:800; font-size:0.75rem; border:1px solid ${meta.bg};">
                                    ${meta.badgeText}
                                </span>
                            </div>
                            <span style="font-size:0.78rem; color:#94a3b8; font-weight:600; white-space:nowrap;">
                                ${exactTime} • <span style="color:#64748b;">${timeAgo}</span>
                            </span>
                        </div>
                        <p style="font-size:0.9rem; color:#334155; margin:0 0 12px 0; line-height:1.5;">
                            ${n.Message || ''}
                        </p>
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                                ${n.RelatedID ? `<span style="font-family:monospace; font-size:0.76rem; background:#f1f5f9; color:#475569; padding:2px 8px; border-radius:6px; font-weight:700;">Ref #${n.RelatedID}</span>` : ''}
                                ${isUnread ? `
                                    <button type="button" class="btn-fs-mark-single-read" data-id="${n.NotificationID || ''}" style="background:none; border:none; color:#2563eb; font-size:0.78rem; font-weight:700; cursor:pointer; padding:2px 6px;">
                                        <i class="fa-solid fa-check"></i> Mark read
                                    </button>
                                ` : '<span style="font-size:0.76rem; color:#10b981; font-weight:700;"><i class="fa-solid fa-check-double"></i> Read</span>'}
                            </div>
                            <button type="button" class="btn ${actionBtnClass} btn-sm btn-fs-action" data-id="${n.NotificationID || ''}" data-target="${meta.target}" style="display:inline-flex; align-items:center; gap:6px; font-weight:700;">
                                <i class="fa-solid ${actionBtnIcon}"></i> <span>${actionBtnText}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Action button listeners
        container.querySelectorAll('.btn-fs-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notifId = btn.getAttribute('data-id');
                const targetView = btn.getAttribute('data-target') || 'overview';

                // Mark as read
                if (notifId && token) {
                    fetch(`/api/cashier/notifications/${encodeURIComponent(notifId)}/read`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => {});
                    const item = cashierNotificationsList.find(x => String(x.NotificationID) === String(notifId));
                    if (item) item.IsRead = true;
                }

                closeCashierNotificationsFullScreen();
                window.location.hash = `#${targetView}`;
                switchView(targetView);

                if (targetView === 'withdrawals') {
                    currentWithdrawalFilter = 'Pending';
                    const filterSelect = document.getElementById('withdrawals-filter-status');
                    if (filterSelect) filterSelect.value = 'Pending';
                    loadWithdrawalsList();
                } else if (targetView === 'refunds') {
                    currentRefundsFilter = 'Pending';
                    const refSelect = document.getElementById('refunds-filter-status');
                    if (refSelect) refSelect.value = 'Pending';
                    loadClientRefundsList();
                }
            });
        });

        // Mark single read listeners
        container.querySelectorAll('.btn-fs-mark-single-read').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const notifId = btn.getAttribute('data-id');
                if (notifId && token) {
                    fetch(`/api/cashier/notifications/${encodeURIComponent(notifId)}/read`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => {});
                    const item = cashierNotificationsList.find(x => String(x.NotificationID) === String(notifId));
                    if (item) item.IsRead = true;
                    renderCashierNotificationsList();
                    renderFullScreenNotifications();
                }
            });
        });

        // Whole row click listener
        container.querySelectorAll('.fs-notif-row').forEach(row => {
            row.addEventListener('click', () => {
                const notifId = row.getAttribute('data-id');
                const targetView = row.getAttribute('data-target') || 'overview';
                if (notifId && token) {
                    fetch(`/api/cashier/notifications/${encodeURIComponent(notifId)}/read`, {
                        method: 'PUT',
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => {});
                    const item = cashierNotificationsList.find(x => String(x.NotificationID) === String(notifId));
                    if (item) item.IsRead = true;
                }
                closeCashierNotificationsFullScreen();
                window.location.hash = `#${targetView}`;
                switchView(targetView);
            });
        });
    }

    // Filter Tabs Click Listener
    document.querySelectorAll('.fs-notif-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.fs-notif-tab').forEach(t => {
                t.classList.remove('active');
                t.style.borderColor = '#cbd5e1';
                t.style.background = '#ffffff';
                t.style.color = '#475569';
            });
            tab.classList.add('active');
            tab.style.borderColor = '#2563eb';
            tab.style.background = '#eff6ff';
            tab.style.color = '#2563eb';

            currentFsNotifFilter = tab.getAttribute('data-filter') || 'all';
            renderFullScreenNotifications();
        });
    });

    // Search input listener
    const fsSearchInput = document.getElementById('fs-notif-search');
    if (fsSearchInput) {
        fsSearchInput.addEventListener('input', (e) => {
            currentFsNotifSearch = e.target.value || '';
            renderFullScreenNotifications();
        });
    }

    // Fullscreen Refresh button
    document.getElementById('btn-fullscreen-notifs-refresh')?.addEventListener('click', async () => {
        const refreshIcon = document.querySelector('#btn-fullscreen-notifs-refresh i');
        if (refreshIcon) refreshIcon.classList.add('fa-spin');
        await loadCashierNotifications();
        renderFullScreenNotifications();
        setTimeout(() => {
            if (refreshIcon) refreshIcon.classList.remove('fa-spin');
        }, 500);
    });

    // Fullscreen Mark All Read button
    document.getElementById('btn-fullscreen-notifs-mark-read')?.addEventListener('click', async () => {
        if (!token) return;
        try {
            cashierNotificationsList.forEach(n => { n.IsRead = true; });
            if (notifBadge) {
                notifBadge.style.display = 'none';
                notifBtn?.classList.remove('has-unread');
            }
            if (notifHeaderCount) notifHeaderCount.style.display = 'none';
            renderCashierNotificationsList();
            renderFullScreenNotifications();

            await fetch('/api/cashier/notifications/read-all', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
        } catch (err) {
            console.warn('Error marking all notifications read:', err);
        }
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
                <tr class="withdrawal-row-item" data-wid="${item.WithdrawalID}" style="cursor:pointer; transition:background-color 0.15s ease;" title="Click to view withdrawal details and disburse/reject payout">
                    <td><strong class="wdr-code" style="color:#2563eb; font-weight:800; font-family:monospace; text-decoration:underline;">#WDR-${item.WithdrawalID}</strong></td>
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
                </tr>
            `;
        }).join('');

        // Row click opens the full withdrawal details
        tbody.querySelectorAll('.withdrawal-row-item').forEach(row => {
            row.addEventListener('click', () => {
                const wid = row.getAttribute('data-wid');
                if (wid) openWithdrawalDetailsFullScreen(wid);
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

        const headerBadgeContainer = document.getElementById('cwd-header-badge-container');
        if (headerBadgeContainer) {
            if (isPending) {
                headerBadgeContainer.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span id="cwd-wdr-status-badge" class="badge badge-pending" style="font-size:0.85rem; padding:6px 14px;"><i class="fa-solid fa-clock"></i> Pending</span>
                        <button type="button" class="btn btn-outline btn-sm" id="btn-cwd-header-reject" style="color:#ef4444; border-color:#fca5a5; font-weight:700;">
                            <i class="fa-solid fa-ban"></i> Reject
                        </button>
                        <button type="button" class="btn btn-success btn-sm" id="btn-cwd-header-disburse" style="font-weight:800;">
                            <i class="fa-solid fa-money-bill-wave"></i> Disburse Payout
                        </button>
                    </div>
                `;
                document.getElementById('btn-cwd-header-reject')?.addEventListener('click', () => {
                    openRejectModal(w.WithdrawalID);
                });
                document.getElementById('btn-cwd-header-disburse')?.addEventListener('click', (e) => {
                    executeDisbursePayout(w.WithdrawalID, e.currentTarget);
                });
            } else {
                headerBadgeContainer.innerHTML = `
                    <span id="cwd-wdr-status-badge" class="badge ${isApproved ? 'badge-approved' : 'badge-rejected'}" style="font-size:0.85rem; padding:6px 14px;">
                        ${isApproved ? '<i class="fa-solid fa-circle-check"></i> Disbursed' : '<i class="fa-solid fa-circle-xmark"></i> Rejected'}
                    </span>
                `;
            }
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

        const payoutAmtEl = document.getElementById('cwd-payout-amount');
        if (payoutAmtEl) payoutAmtEl.textContent = formatPHP(netAmount);

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
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:32px; color:#64748b;">No client refund requests found matching filter '${currentRefundFilter}'.</td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(r => {
            let statusBadge = 'badge-pending';
            if (r.Status === 'Approved') statusBadge = 'badge-approved';
            if (r.Status === 'Rejected') statusBadge = 'badge-rejected';

            return `
                <tr class="refund-row-item" data-id="${r.RefundRequestID}" title="Click anywhere on this row to view client booking details & process refund">
                    <td><strong style="color:#0a192f;">#REF-${r.RefundRequestID}</strong></td>
                    <td>
                        <div>
                            <span style="font-weight:800; font-size:0.95rem; color:#2563eb; display:inline-flex; align-items:center; gap:6px;">
                                <span>${r.ClientName || 'Denver Cabrera'}</span>
                                <i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.75rem;"></i>
                            </span>
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
                </tr>
            `;
        }).join('');

        // Row click opens the full booking/refund details
        tbody.querySelectorAll('.refund-row-item').forEach(row => {
            row.addEventListener('click', () => {
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

        // Action buttons inside the fullscreen view (Destination Account card only)
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
            const nView = document.getElementById('view-cashier-fullscreen-notifications');
            if (nView && !nView.classList.contains('hidden') && nView.style.display !== 'none') {
                closeCashierNotificationsFullScreen();
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
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:28px; color:#64748b;"><i class="fa-solid fa-spinner fa-spin"></i> Loading subscription payments...</td></tr>`;
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
                if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#ef4444;">${data.message || 'Failed to load subscription payments.'}</td></tr>`;
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
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#ef4444;">Error connecting to server.</td></tr>`;
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
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#64748b;">No subscription payments found for this filter.</td></tr>`;
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
    // 6. Categorized Income Reports (Monthly, Yearly)
    // ----------------------------------------------------
    let currentReportPeriod = 'monthly';
    let currentLoadedReport = null;

    // Set default values for date inputs
    const todayIso = new Date().toISOString().split('T')[0];
    const monthIso = todayIso.substring(0, 7);
    const yearIso = todayIso.substring(0, 4);

    const dateMonthlyInput = document.getElementById('report-date-monthly');
    const dateYearlyInput = document.getElementById('report-date-yearly');

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
        if (currentReportPeriod === 'monthly') dateVal = dateMonthlyInput ? dateMonthlyInput.value : monthIso;
        if (currentReportPeriod === 'yearly') dateVal = dateYearlyInput ? dateYearlyInput.value : yearIso;

        let queryUrl = `/api/cashier/reports/income?period=${currentReportPeriod}`;
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
        document.getElementById('report-display-title').textContent = rep.periodTitle || 'Income Report';
        document.getElementById('report-display-subtitle').textContent = `Financial Period: ${rep.filterLabel || ''}`;
        document.getElementById('report-generated-timestamp').textContent = formatDateTime(rep.generatedAt);

        // KPI Summary
        const s = rep.summary || {};
        const kpiCommEl = document.getElementById('report-kpi-commission');
        const kpiCommCountEl = document.getElementById('report-kpi-commission-count');
        const kpiSubEl = document.getElementById('report-kpi-subscription');
        const kpiSubCountEl = document.getElementById('report-kpi-subscription-count');
        const kpiTotalIncomeEl = document.getElementById('report-kpi-total-income');
        const badgeCommCount = document.getElementById('badge-commission-count');
        const badgeSubCount = document.getElementById('badge-subscription-count');

        // Extract or fallback commission records
        const commRecords = rep.commissionRecords || (rep.detailedLedger || []).filter(i => i.type === 'Booking Payment').map(i => ({
            date: i.date,
            reference: i.reference,
            providerName: i.party?.includes('→') ? i.party.split('→')[1].trim() : i.party || 'Service Provider',
            clientName: i.party?.includes('→') ? i.party.split('→')[0].trim() : 'Client',
            packageName: i.itemDescription || 'Booking Service',
            bookingAmount: i.inflow || 0,
            amountPaid: i.inflow || 0,
            commissionRate: '5%',
            commissionEarned: i.commission || 0,
            status: i.status || 'Paid'
        }));

        // Extract or fallback subscription records
        const subRecords = rep.subscriptionRecords || (rep.detailedLedger || []).filter(i => i.type === 'Subscription Payment').map(i => ({
            date: i.date,
            reference: i.reference,
            providerName: i.party || 'Service Provider',
            planName: i.itemDescription || 'Pro Plan',
            amount: i.inflow || i.commission || 0,
            paymentMethod: i.method || 'Online',
            status: i.status || 'Paid'
        }));

        if (kpiCommEl) kpiCommEl.textContent = formatPHP(s.totalCommissionIncome || 0);
        if (kpiCommCountEl) kpiCommCountEl.textContent = `${commRecords.length} Bookings Paid`;
        if (badgeCommCount) badgeCommCount.textContent = `${commRecords.length} Bookings`;

        if (kpiSubEl) kpiSubEl.textContent = formatPHP(s.totalSubscriptionRevenue || 0);
        if (kpiSubCountEl) kpiSubCountEl.textContent = `${subRecords.length} Subscriptions Paid`;
        if (badgeSubCount) badgeSubCount.textContent = `${subRecords.length} Subscriptions`;

        if (kpiTotalIncomeEl) kpiTotalIncomeEl.textContent = formatPHP(s.netPlatformIncome || 0);

        // 1. Render Commission Income Table
        const commTbody = document.getElementById('report-commission-table-body');
        if (commTbody) {
            if (commRecords.length === 0) {
                commTbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:24px; color:#64748b;">No commission earnings recorded for this period.</td></tr>`;
            } else {
                commTbody.innerHTML = commRecords.map(item => `
                    <tr>
                        <td><span style="font-size:0.8rem; color:#475569;">${formatDateTime(item.date)}</span></td>
                        <td><strong>${item.reference}</strong></td>
                        <td>
                            <div style="font-weight:700; color:#0a192f;">${item.providerName}</div>
                        </td>
                        <td><span style="font-size:0.85rem; color:#334155;">${item.clientName || 'Client'}</span></td>
                        <td><span style="font-size:0.82rem; color:#475569;">${item.packageName || 'Booking Service'}</span></td>
                        <td class="flow-inflow">${formatPHP(item.bookingAmount || item.amountPaid)}</td>
                        <td><span class="badge" style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe;">5%</span></td>
                        <td><strong style="color:#2563eb; font-size:0.95rem;">+${formatPHP(item.commissionEarned)}</strong></td>
                        <td><span class="badge badge-approved">${item.status || 'Paid'}</span></td>
                    </tr>
                `).join('');
            }
        }

        // 2. Render Subscription Income Table (Under Commission Table)
        const subTbody = document.getElementById('report-subscription-table-body');
        if (subTbody) {
            if (subRecords.length === 0) {
                subTbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px; color:#64748b;">No subscription payments recorded for this period.</td></tr>`;
            } else {
                subTbody.innerHTML = subRecords.map(item => `
                    <tr>
                        <td><span style="font-size:0.8rem; color:#475569;">${formatDateTime(item.date)}</span></td>
                        <td><strong>${item.reference}</strong></td>
                        <td>
                            <div style="font-weight:700; color:#0a192f;">${item.providerName}</div>
                        </td>
                        <td><span class="badge" style="background:#f5f3ff; color:#8b5cf6; border:1px solid #ddd6fe; font-weight:700;">${item.planName || 'Pro Plan'}</span></td>
                        <td><strong style="color:#8b5cf6; font-size:0.95rem;">+${formatPHP(item.amount)}</strong></td>
                        <td><span style="font-size:0.84rem; color:#475569;">${item.paymentMethod || 'Online'}</span></td>
                        <td><span class="badge badge-approved">${item.status || 'Paid'}</span></td>
                    </tr>
                `).join('');
            }
        }
    }

    // ----------------------------------------------------
    // 7. Export Income Report (Excel & PDF with Official Header)
    // ----------------------------------------------------
    function exportIncomeReportToExcel() {
        if (!currentLoadedReport) {
            alert('Please generate an income report first before exporting.');
            return;
        }

        const rep = currentLoadedReport;
        const s = rep.summary || {};
        const periodLabel = rep.filterLabel || (rep.period === 'monthly' ? (dateMonthlyInput?.value || monthIso) : (dateYearlyInput?.value || yearIso));
        const printedByName = currentUser?.name || 'Cashier Staff';
        const printDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const escapeCsv = (str) => {
            const val = String(str ?? '');
            if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
                return `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        };

        const commRecords = rep.commissionRecords || [];
        const subRecords = rep.subscriptionRecords || [];

        const commRows = commRecords.map(item => [
            escapeCsv(formatDateTime(item.date)),
            escapeCsv(item.reference),
            escapeCsv(item.providerName),
            escapeCsv(item.clientName || 'Client'),
            escapeCsv(item.packageName || 'Booking Service'),
            (item.bookingAmount || item.amountPaid || 0).toFixed(2),
            escapeCsv(item.commissionRate || '5%'),
            (item.commissionEarned || 0).toFixed(2),
            escapeCsv(item.status || 'Paid')
        ]);

        const subRows = subRecords.map(item => [
            escapeCsv(formatDateTime(item.date)),
            escapeCsv(item.reference),
            escapeCsv(item.providerName),
            escapeCsv(item.planName || 'Pro Plan'),
            (item.amount || 0).toFixed(2),
            escapeCsv(item.paymentMethod || 'Online'),
            escapeCsv(item.status || 'Paid')
        ]);

        const csvContent = [
            ['SOUNDSPHERE - CASHIER FINANCIAL DESK'],
            ['OFFICIAL PLATFORM INCOME REPORT'],
            ['Reporting Period:', escapeCsv(periodLabel)],
            ['Generated Date & Time:', escapeCsv(printDate)],
            ['Generated By (Cashier Staff):', escapeCsv(printedByName)],
            [],
            ['=== FINANCIAL SUMMARY ==='],
            ['Category', 'Amount (PHP)'],
            ['Booking Commission Income (5%)', (s.totalCommissionIncome || 0).toFixed(2)],
            ['Provider Subscription Income', (s.totalSubscriptionRevenue || 0).toFixed(2)],
            ['Total Platform Income', (s.netPlatformIncome || 0).toFixed(2)],
            [],
            ['=== 1. BOOKING COMMISSION INCOME (FROM SERVICE PROVIDERS) ==='],
            ['Date & Time', 'Booking Ref', 'Service Provider', 'Client / Event', 'Package / Service', 'Booking Amount (PHP)', 'Commission Rate', 'Platform Commission (PHP)', 'Status'],
            ...(commRows.length > 0 ? commRows : [['No commission records for this period.', '', '', '', '', '', '', '', '']]),
            ['Total Booking Commission Income (PHP):', '', '', '', '', '', '', (s.totalCommissionIncome || 0).toFixed(2), ''],
            [],
            ['=== 2. SUBSCRIPTION INCOME (FROM SERVICE PROVIDERS) ==='],
            ['Date & Time', 'Payment Ref', 'Service Provider', 'Subscription Plan', 'Subscription Fee (PHP)', 'Payment Method', 'Status'],
            ...(subRows.length > 0 ? subRows : [['No subscription records for this period.', '', '', '', '', '', '']]),
            ['Total Subscription Income (PHP):', '', '', '', (s.totalSubscriptionRevenue || 0).toFixed(2), '', '']
        ];

        const csvString = '\uFEFF' + csvContent.map(r => r.join(',')).join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filenameSlug = (periodLabel || rep.period || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
        a.href = url;
        a.download = `SoundSphere_Income_Report_${filenameSlug}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportIncomeReportToPDF() {
        if (!currentLoadedReport) {
            alert('Please generate an income report first before exporting.');
            return;
        }

        const rep = currentLoadedReport;
        const s = rep.summary || {};
        const periodLabel = rep.filterLabel || (rep.period === 'monthly' ? (dateMonthlyInput?.value || monthIso) : (dateYearlyInput?.value || yearIso));
        const printedByName = currentUser?.name || 'Cashier Staff';
        const printDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const commRecords = rep.commissionRecords || [];
        const subRecords = rep.subscriptionRecords || [];

        const commRowsHtml = commRecords.length === 0
            ? `<tr><td colspan="8" style="text-align:center; padding:12px; color:#64748b;">No commission earnings recorded for this period.</td></tr>`
            : commRecords.map(item => `
                <tr>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:8pt;">${formatDateTime(item.date)}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-weight:700; font-family:monospace; font-size:8pt;">${item.reference}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-weight:700; font-size:8.5pt;">${item.providerName}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:8.5pt;">${item.clientName || 'Client'}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:8pt; color:#475569;">${item.packageName || 'Booking Service'}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; text-align:right; font-size:8.5pt;">₱${(item.bookingAmount || item.amountPaid || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:800; color:#2563eb; font-size:8.5pt;">+₱${(item.commissionEarned || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; text-align:center; font-size:8pt;">${item.status || 'Paid'}</td>
                </tr>
            `).join('');

        const subRowsHtml = subRecords.length === 0
            ? `<tr><td colspan="7" style="text-align:center; padding:12px; color:#64748b;">No subscription payments recorded for this period.</td></tr>`
            : subRecords.map(item => `
                <tr>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:8pt;">${formatDateTime(item.date)}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-weight:700; font-family:monospace; font-size:8pt;">${item.reference}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-weight:700; font-size:8.5pt;">${item.providerName}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:8.5pt; color:#6b21a8; font-weight:600;">${item.planName || 'Pro Plan'}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:800; color:#8b5cf6; font-size:8.5pt;">+₱${(item.amount || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; font-size:8pt; color:#475569;">${item.paymentMethod || 'Online'}</td>
                    <td style="padding:7px 10px; border-bottom:1px solid #e2e8f0; text-align:center; font-size:8pt;">${item.status || 'Paid'}</td>
                </tr>
            `).join('');

        const printableHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SoundSphere - Income Report (${periodLabel})</title>
    <style>
        @page { size: A4 portrait; margin: 12mm 15mm; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 15px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0a192f; padding-bottom: 12px; margin-bottom: 16px; }
        .brand { font-size: 18pt; font-weight: 800; letter-spacing: 0.5px; color: #0a192f; }
        .subbrand { font-size: 8.5pt; color: #64748b; font-weight: 600; margin-top: 2px; }
        .meta-box { text-align: right; font-size: 8.5pt; color: #334155; line-height: 1.5; }
        .report-title { font-size: 14pt; font-weight: 800; text-transform: uppercase; color: #0a192f; margin: 8px 0 2px 0; }
        .report-subtitle { font-size: 9pt; font-weight: 600; color: #2563eb; margin-bottom: 16px; }
        .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
        .kpi-card { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 6px; padding: 10px 14px; }
        .kpi-label { font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 13pt; font-weight: 800; color: #0a192f; margin-top: 3px; }
        .section-header { font-size: 10pt; font-weight: 800; text-transform: uppercase; color: #0a192f; margin: 18px 0 8px 0; border-left: 3px solid #2563eb; padding-left: 8px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #f1f5f9; color: #334155; font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 7px 10px; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #cbd5e1; text-align: left; }
        th.text-right { text-align: right; }
        th.text-center { text-align: center; }
        .total-row td { background: #f8fafc; border-top: 2px solid #0a192f; border-bottom: 2px solid #0a192f; font-weight: 800; padding: 8px 10px; }
        .footer-sig { margin-top: 32px; display: flex; justify-content: space-between; align-items: flex-end; page-break-inside: avoid; }
        .sig-block { width: 220px; border-top: 1px solid #94a3b8; padding-top: 6px; text-align: center; font-size: 8.5pt; }
        @media print { body { padding: 0; } }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="brand">SOUNDSPHERE</div>
            <div class="subbrand">Audio & Event Booking Platform • Cashier Financial Desk</div>
        </div>
        <div class="meta-box">
            <div><strong>Report Period:</strong> ${periodLabel}</div>
            <div><strong>Printed By:</strong> ${printedByName}</div>
            <div><strong>Date & Time:</strong> ${printDate}</div>
        </div>
    </div>

    <div class="report-title">${(rep.periodTitle || 'Income Report').toUpperCase()}</div>
    <div class="report-subtitle">Official Platform Income Report • Period: ${periodLabel}</div>

    <div class="kpi-grid">
        <div class="kpi-card" style="border-left: 4px solid #2563eb;">
            <div class="kpi-label">Commission Income (5%)</div>
            <div class="kpi-value" style="color:#2563eb;">₱${(s.totalCommissionIncome || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #8b5cf6;">
            <div class="kpi-label">Subscription Income</div>
            <div class="kpi-value" style="color:#8b5cf6;">₱${(s.totalSubscriptionRevenue || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #10b981;">
            <div class="kpi-label">Total Platform Income</div>
            <div class="kpi-value" style="color:#059669;">₱${(s.netPlatformIncome || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</div>
        </div>
    </div>

    <!-- 1. Commission Table -->
    <div class="section-header">1. Booking Commission Income (From Service Providers)</div>
    <table>
        <thead>
            <tr>
                <th>Date & Time</th>
                <th>Booking Ref</th>
                <th>Service Provider</th>
                <th>Client / Event</th>
                <th>Package / Service</th>
                <th class="text-right">Booking Amount</th>
                <th class="text-right">Platform Commission</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            ${commRowsHtml}
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="6" style="text-align:right; font-size:8.5pt; text-transform:uppercase;">Total Commission Earned:</td>
                <td style="text-align:right; font-size:9.5pt; font-weight:800; color:#2563eb;">₱${(s.totalCommissionIncome || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>

    <!-- 2. Subscription Table -->
    <div class="section-header">2. Subscription Income (From Service Providers)</div>
    <table>
        <thead>
            <tr>
                <th>Date & Time</th>
                <th>Payment Ref</th>
                <th>Service Provider</th>
                <th>Subscription Plan</th>
                <th class="text-right">Subscription Fee</th>
                <th>Payment Method</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            ${subRowsHtml}
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="4" style="text-align:right; font-size:8.5pt; text-transform:uppercase;">Total Subscription Revenue:</td>
                <td style="text-align:right; font-size:9.5pt; font-weight:800; color:#8b5cf6;">₱${(s.totalSubscriptionRevenue || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</td>
                <td colspan="2"></td>
            </tr>
        </tfoot>
    </table>

    <div class="footer-sig">
        <div>
            <div style="font-size:7.5pt; color:#94a3b8; text-transform:uppercase;">System Verification</div>
            <div style="font-size:8pt; color:#64748b; margin-top:2px;">Generated via SoundSphere Cashier Portal • ${periodLabel}</div>
        </div>
        <div>
            <div class="sig-block">
                <strong>${printedByName}</strong><br>
                <span style="font-size:7.5pt; color:#64748b;">Official Cashier Staff</span>
            </div>
        </div>
    </div>
</body>
</html>
        `;

        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);

        const frameDoc = printIframe.contentWindow.document;
        frameDoc.open();
        frameDoc.write(printableHtml);
        frameDoc.close();

        printIframe.contentWindow.focus();
        setTimeout(() => {
            printIframe.contentWindow.print();
            setTimeout(() => {
                if (printIframe.parentNode) printIframe.parentNode.removeChild(printIframe);
            }, 1000);
        }, 350);
    }

    document.getElementById('btn-export-income-excel')?.addEventListener('click', exportIncomeReportToExcel);
    document.getElementById('btn-export-income-pdf')?.addEventListener('click', exportIncomeReportToPDF);

    // ----------------------------------------------------
    // 8. Platform Revenue Reports & Provider Breakdown
    // ----------------------------------------------------
    let cashierProviderRevenueMap = {};

    async function loadCashierRevenueReports() {
        const tableSummary = document.getElementById('table-cashier-provider-revenue');
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
                if (tableSummary) tableSummary.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#ef4444;">${data.message || 'Failed to load revenue summary.'}</td></tr>`;
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
                const tableEl = tableSummary.closest('table');
                if (tableEl) {
                    const thead = tableEl.querySelector('thead');
                    if (thead) {
                        thead.innerHTML = `
                            <tr>
                                <th>SERVICE PROVIDER</th>
                                <th>GROSS REVENUE</th>
                                <th>NET PROVIDER (95%)</th>
                                <th>5% ADMIN FEE</th>
                                <th>TOTAL BOOKINGS</th>
                            </tr>
                        `;
                    }
                }

                if (providers.length === 0) {
                    tableSummary.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:28px; color:#64748b;">No service provider revenue records found.</td></tr>`;
                } else {
                    tableSummary.innerHTML = providers.map(p => `
                        <tr class="clickable-prov-revenue-row" data-prov-name="${encodeURIComponent(p.providerName)}" style="cursor:pointer; transition: background 0.15s ease;" title="Click to view ${p.providerName} revenue details">
                            <td>
                                <strong style="color:#0a192f; font-size:0.92rem; display:block;">${p.providerName}</strong>
                                <span style="font-size:0.75rem; color:#64748b;">${p.providerEmail || ''}</span>
                            </td>
                            <td><strong style="font-size:0.95rem; color:#0a192f;">${formatPHP(p.grossRevenue)}</strong></td>
                            <td><strong style="font-size:0.95rem; color:#0a192f;">${formatPHP(p.netEarnings)}</strong></td>
                            <td><strong style="font-size:0.95rem; color:#0a192f;">${formatPHP(p.adminCommission)}</strong></td>
                            <td><span style="font-size:0.85rem; font-weight:700; color:#0a192f;">${p.bookingsCount} Booking(s)</span></td>
                        </tr>
                    `).join('');

                    tableSummary.querySelectorAll('.clickable-prov-revenue-row').forEach(row => {
                        row.addEventListener('click', () => {
                            const pName = decodeURIComponent(row.getAttribute('data-prov-name'));
                            openCashierProviderRevenueDetail(pName);
                        });
                        row.addEventListener('mouseenter', () => {
                            row.style.backgroundColor = '#f1f5f9';
                        });
                        row.addEventListener('mouseleave', () => {
                            row.style.backgroundColor = '';
                        });
                    });
                }
            }

        } catch (err) {
            console.error('Error loading revenue reports:', err);
            if (tableSummary) tableSummary.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#ef4444;">Failed to load revenue reports.</td></tr>`;
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
            const bookings = (group.bookings || []).filter(b => b.status === 'Confirmed' || b.status === 'Completed');
            if (bookings.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No verified confirmed or completed transactions recorded for this provider.</td></tr>`;
            } else {
                tbody.innerHTML = bookings.map(b => `
                    <tr>
                        <td><strong>${b.bookingReference}</strong></td>
                        <td>${b.clientName}</td>
                        <td>${b.packageName}</td>
                        <td><span style="font-size:0.84rem; color:#64748b;">${b.eventDate ? new Date(b.eventDate).toLocaleDateString() : 'N/A'}</span></td>
                        <td>
                            <strong style="color:#0a192f; font-size:0.95rem;">${formatPHP(b.grossAmount)}</strong>
                            ${b.isPartial ? `
                                <div style="font-size:0.75rem; color:#b45309; font-weight:600; margin-top:2px;">
                                    <i class="fa-solid fa-circle-half-stroke"></i> 50% Downpayment
                                </div>
                                <div style="font-size:0.72rem; color:#64748b;">(Package Total: ${formatPHP(b.totalAmount)})</div>
                            ` : `
                                <div style="font-size:0.72rem; color:#10b981; font-weight:600; margin-top:2px;">Full Payment</div>
                            `}
                        </td>
                        <td><strong style="color:#0a192f;">${formatPHP(b.adminFee)}</strong></td>
                        <td><strong style="color:#059669;">${formatPHP(b.netPayout)}</strong></td>
                        <td><span class="badge ${b.status === 'Completed' ? 'badge-approved' : 'badge-confirmed'}" style="${b.status === 'Confirmed' ? 'background:#ecfdf5; color:#065f46; border:1px solid #a7f3d0; font-weight:700;' : 'font-weight:700;'}">${b.status}</span></td>
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

    // Initial load and live notification polling (every 30 seconds)
    loadCashierNotifications();
    setInterval(loadCashierNotifications, 30000);
});

