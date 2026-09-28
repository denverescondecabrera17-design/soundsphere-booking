/**
 * SoundSphere - Service Provider Dashboard Controller (Vanilla JS ES6)
 * Complete management for services, packages, event reservations, availability, business profile, earnings, withdrawals, and reviews.
 */

document.addEventListener('DOMContentLoaded', async () => {
    const token = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthToken() : localStorage.getItem('soundsphere_auth_token');
    const user = typeof SoundSphereAPI !== 'undefined' ? SoundSphereAPI.getAuthUser() : JSON.parse(localStorage.getItem('soundsphere_user_info') || '{}');

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

    // Logout Action Handler
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

    const btnProviderMenuLogout = document.getElementById('btn-provider-menu-logout');
    if (btnProviderMenuLogout) btnProviderMenuLogout.addEventListener('click', handleLogout);

    // Display Current Date Banner
    const currentDateDisplay = document.getElementById('current-date-display');
    if (currentDateDisplay) {
        currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    }

    let currentProviderProfile = null;

    // ------------------------------------------------------------------------
    // Server-side Authentication & Authorization Check
    // ------------------------------------------------------------------------
    const verifyApprovedProviderAccess = async () => {
        if (!token) {
            console.warn('No authentication token found. Redirecting to login.');
            window.location.href = '/login.html';
            return false;
        }

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('http://localhost:5000/api/providers/me', { headers });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.profile) {
                    currentProviderProfile = data.profile;

                    // Update Topbar Profile Details
                    const welcomeHeading = document.getElementById('welcome-heading');
                    const headerProviderName = document.getElementById('header-provider-name');
                    const dropdownEmail = document.getElementById('dropdown-provider-email');
                    const dropdownStatus = document.getElementById('dropdown-provider-status');

                    const bName = data.profile.businessName || data.profile.ownerName || 'Service Provider';
                    const oName = data.profile.ownerName || 'Provider Owner';
                    const covArea = data.profile.coverageArea || 'Batangas';
                    const avatarUrl = data.profile.profilePicture || data.profile.avatar || null;

                    if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${bName}! 🎵`;
                    if (headerProviderName) headerProviderName.textContent = bName;
                    if (dropdownEmail) dropdownEmail.textContent = data.profile.email;
                    if (dropdownStatus) dropdownStatus.textContent = `Approved Service Provider`;

                    // Update Card & Modal Header Info
                    const cardProfBizName = document.getElementById('card-prof-biz-name');
                    const cardProfOwnerName = document.getElementById('card-prof-owner-name');
                    const cardProfCoverage = document.getElementById('card-prof-coverage');

                    if (cardProfBizName) cardProfBizName.textContent = bName;
                    if (cardProfOwnerName) cardProfOwnerName.textContent = oName;
                    if (cardProfCoverage) cardProfCoverage.textContent = covArea;

                    // Update Avatar Photo Previews Across Topbar, Dropdown, and Card Header
                    const profAvatarImg = document.getElementById('prof-avatar-img');
                    const profAvatarInitials = document.getElementById('prof-avatar-initials');
                    const headerAvatarImg = document.getElementById('header-provider-avatar-img');
                    const headerAvatarIcon = document.getElementById('header-provider-avatar-icon');
                    const dropdownAvatarImg = document.getElementById('dropdown-provider-avatar-img');
                    const dropdownAvatarIcon = document.getElementById('dropdown-provider-avatar-icon');

                    const formattedAvatarUrl = avatarUrl ? (avatarUrl.startsWith('http') || avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`) : null;

                    if (formattedAvatarUrl) {
                        if (profAvatarImg) { profAvatarImg.src = formattedAvatarUrl; profAvatarImg.style.display = 'block'; }
                        if (profAvatarInitials) profAvatarInitials.style.display = 'none';

                        if (headerAvatarImg) { headerAvatarImg.src = formattedAvatarUrl; headerAvatarImg.style.display = 'block'; }
                        if (headerAvatarIcon) headerAvatarIcon.style.display = 'none';

                        if (dropdownAvatarImg) { dropdownAvatarImg.src = formattedAvatarUrl; dropdownAvatarImg.style.display = 'block'; }
                        if (dropdownAvatarIcon) dropdownAvatarIcon.style.display = 'none';
                    } else {
                        if (profAvatarImg) profAvatarImg.style.display = 'none';
                        if (profAvatarInitials) profAvatarInitials.style.display = 'flex';

                        if (headerAvatarImg) headerAvatarImg.style.display = 'none';
                        if (headerAvatarIcon) headerAvatarIcon.style.display = 'block';

                        if (dropdownAvatarImg) dropdownAvatarImg.style.display = 'none';
                        if (dropdownAvatarIcon) dropdownAvatarIcon.style.display = 'block';
                    }

                    // Update Business Profile View Elements
                    const profBizName = document.getElementById('prof-biz-name');
                    const profOwnerName = document.getElementById('prof-owner-name');
                    const profEmail = document.getElementById('prof-email');
                    const profContact = document.getElementById('prof-contact');
                    const profCoverage = document.getElementById('prof-coverage');

                    if (profBizName) profBizName.textContent = bName;
                    if (profOwnerName) profOwnerName.textContent = oName;
                    if (profEmail) profEmail.textContent = data.profile.email || 'N/A';
                    if (profContact) profContact.textContent = data.profile.contactNumber || data.profile.phone || 'N/A';
                    if (profCoverage) profCoverage.textContent = covArea;

                    return true;
                }
            }
        } catch (e) {
            console.warn('Authorization verification notice:', e.message);
        }

        return true;
    };

    // ------------------------------------------------------------------------
    // Edit Business Profile & Photo Upload Handlers
    // ------------------------------------------------------------------------
    const btnEditBusinessProfile = document.getElementById('btn-edit-business-profile');
    const btnTriggerUploadPhoto = document.getElementById('btn-trigger-upload-photo');
    const modalEditProviderProfile = document.getElementById('modal-edit-provider-profile');
    const btnCloseEditProviderProfile = document.getElementById('btn-close-edit-provider-profile');
    const btnCancelEditProviderProfile = document.getElementById('btn-cancel-edit-provider-profile');
    const formEditProviderProfile = document.getElementById('form-edit-provider-profile');
    const btnChooseProviderPhoto = document.getElementById('btn-choose-provider-photo');
    const editProviderPhotoFile = document.getElementById('edit-provider-photo-file');
    const editProviderAvatarPreview = document.getElementById('edit-provider-avatar-preview');
    const editProviderAvatarIcon = document.getElementById('edit-provider-avatar-icon');

    let selectedProviderPhotoFile = null;

    const openEditProviderModal = () => {
        if (!modalEditProviderProfile) return;
        const p = currentProviderProfile || {};

        const inputBizName = document.getElementById('edit-provider-biz-name');
        const inputFirstName = document.getElementById('edit-provider-first-name');
        const inputLastName = document.getElementById('edit-provider-last-name');
        const inputPhone = document.getElementById('edit-provider-phone');
        const inputCoverage = document.getElementById('edit-provider-coverage');
        const inputAddress = document.getElementById('edit-provider-address');

        const ownerParts = (p.ownerName || '').split(' ');
        const firstName = ownerParts[0] || '';
        const lastName = ownerParts.slice(1).join(' ') || '';

        if (inputBizName) inputBizName.value = p.businessName || '';
        if (inputFirstName) inputFirstName.value = firstName;
        if (inputLastName) inputLastName.value = lastName;
        if (inputPhone) inputPhone.value = p.contactNumber || p.phone || '';
        if (inputCoverage) inputCoverage.value = p.coverageArea || 'Batangas';
        if (inputAddress) inputAddress.value = p.businessAddress || '';

        const avatarUrl = p.profilePicture || p.avatar || null;
        if (avatarUrl && editProviderAvatarPreview && editProviderAvatarIcon) {
            editProviderAvatarPreview.src = avatarUrl.startsWith('http') || avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`;
            editProviderAvatarPreview.style.display = 'block';
            editProviderAvatarIcon.style.display = 'none';
        } else if (editProviderAvatarPreview && editProviderAvatarIcon) {
            editProviderAvatarPreview.style.display = 'none';
            editProviderAvatarIcon.style.display = 'block';
        }

        modalEditProviderProfile.classList.remove('hidden');
    };

    const closeEditProviderModal = () => {
        if (modalEditProviderProfile) modalEditProviderProfile.classList.add('hidden');
        selectedProviderPhotoFile = null;
    };

    if (btnEditBusinessProfile) btnEditBusinessProfile.addEventListener('click', openEditProviderModal);
    if (btnTriggerUploadPhoto) btnTriggerUploadPhoto.addEventListener('click', openEditProviderModal);
    if (btnCloseEditProviderProfile) btnCloseEditProviderProfile.addEventListener('click', closeEditProviderModal);
    if (btnCancelEditProviderProfile) btnCancelEditProviderProfile.addEventListener('click', closeEditProviderModal);

    if (btnChooseProviderPhoto && editProviderPhotoFile) {
        btnChooseProviderPhoto.addEventListener('click', () => editProviderPhotoFile.click());

        editProviderPhotoFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert('⚠ Profile photo must be less than 2 MB.');
                editProviderPhotoFile.value = '';
                return;
            }

            selectedProviderPhotoFile = file;

            const reader = new FileReader();
            reader.onload = (event) => {
                if (editProviderAvatarPreview && editProviderAvatarIcon) {
                    editProviderAvatarPreview.src = event.target.result;
                    editProviderAvatarPreview.style.display = 'block';
                    editProviderAvatarIcon.style.display = 'none';
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (formEditProviderProfile) {
        formEditProviderProfile.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputBizName = document.getElementById('edit-provider-biz-name');
            const inputFirstName = document.getElementById('edit-provider-first-name');
            const inputLastName = document.getElementById('edit-provider-last-name');
            const inputPhone = document.getElementById('edit-provider-phone');
            const inputCoverage = document.getElementById('edit-provider-coverage');
            const inputAddress = document.getElementById('edit-provider-address');
            const btnSubmit = document.getElementById('btn-save-provider-profile-submit');

            const p = currentProviderProfile || {};
            const userId = p.userId;

            try {
                if (btnSubmit) {
                    btnSubmit.disabled = true;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
                }

                const formData = new FormData();
                if (userId) formData.append('userId', userId);
                formData.append('businessName', inputBizName ? inputBizName.value.trim() : '');
                formData.append('firstName', inputFirstName ? inputFirstName.value.trim() : '');
                formData.append('lastName', inputLastName ? inputLastName.value.trim() : '');
                formData.append('phone', inputPhone ? inputPhone.value.trim() : '');
                formData.append('coverageArea', inputCoverage ? inputCoverage.value.trim() : '');
                formData.append('businessAddress', inputAddress ? inputAddress.value.trim() : '');
                formData.append('address', inputAddress ? inputAddress.value.trim() : '');

                if (selectedProviderPhotoFile) {
                    formData.append('avatarFile', selectedProviderPhotoFile);
                }

                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const res = await fetch('/api/providers/me', {
                    method: 'PUT',
                    headers,
                    body: formData
                });

                const resData = await res.json();

                if (!res.ok || !resData.success) {
                    alert(`✕ ${resData.message || 'Failed to update profile changes.'}`);
                    return;
                }

                alert('✓ Business Profile Information & Provider Photo Updated Successfully!');
                closeEditProviderModal();
                await verifyApprovedProviderAccess();

            } catch (err) {
                console.warn('Error saving provider profile:', err.message);
                alert(`✕ Error saving profile: ${err.message}`);
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Profile Changes`;
                }
            }
        });
    }

    // ------------------------------------------------------------------------
    // Topbar Profile Dropdown Toggle & Outside Click
    // ------------------------------------------------------------------------
    const btnProviderProfileDropdown = document.getElementById('btn-provider-profile-dropdown');
    const providerProfileMenu = document.getElementById('provider-profile-menu');
    const btnProviderMyProfile = document.getElementById('btn-provider-my-profile');
    const btnProviderAccountSettings = document.getElementById('btn-provider-account-settings');

    if (btnProviderProfileDropdown && providerProfileMenu) {
        btnProviderProfileDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            providerProfileMenu.classList.toggle('hidden');
        });
    }

    document.addEventListener('click', (e) => {
        const wrapper = document.querySelector('.user-profile-wrapper');
        if (providerProfileMenu && !providerProfileMenu.classList.contains('hidden')) {
            if (wrapper && !wrapper.contains(e.target)) {
                providerProfileMenu.classList.add('hidden');
            }
        }
    });

    if (btnProviderMyProfile) {
        btnProviderMyProfile.addEventListener('click', () => {
            if (providerProfileMenu) providerProfileMenu.classList.add('hidden');
            const navProf = document.getElementById('nav-item-profile');
            if (navProf) navProf.click();
        });
    }

    if (btnProviderAccountSettings) {
        btnProviderAccountSettings.addEventListener('click', () => {
            if (providerProfileMenu) providerProfileMenu.classList.add('hidden');
            const navProf = document.getElementById('nav-item-profile');
            if (navProf) navProf.click();
        });
    }

    // ------------------------------------------------------------------------
    // Notification Bell Toggle & Real-time Database Loader
    // ------------------------------------------------------------------------
    const btnNotificationBell = document.getElementById('btn-notification-bell');
    const notificationPanel = document.getElementById('notification-panel');
    const notificationBadge = document.getElementById('notification-badge');
    const notificationList = document.getElementById('notification-list');
    const btnMarkAllRead = document.getElementById('btn-mark-all-read');

    const fetchNotifications = async () => {
        if (!token) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('http://localhost:5000/api/notifications', { headers });
            if (res.ok) {
                const data = await res.json();
                const notifications = data.notifications || data.data || [];
                const unreadCount = notifications.filter(n => !n.IsRead && n.IsRead !== 1).length;

                if (notificationBadge) {
                    if (unreadCount > 0) {
                        notificationBadge.textContent = unreadCount;
                        notificationBadge.classList.remove('hidden');
                    } else {
                        notificationBadge.classList.add('hidden');
                    }
                }

                if (notificationList) {
                    if (notifications.length === 0) {
                        notificationList.innerHTML = `<div style="padding:28px 16px; text-align:center; color:#64748b; font-size:0.88rem;">No notifications.</div>`;
                    } else {
                        notificationList.innerHTML = notifications.map(n => {
                            const isUnread = !n.IsRead && n.IsRead !== 1;
                            const createdDate = new Date(n.CreatedAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return `
                                <div class="notification-item ${isUnread ? 'unread' : ''}" style="padding:12px 16px; border-bottom:1px solid #f1f5f9; background:${isUnread ? '#eff6ff' : '#ffffff'}; cursor:pointer;" onclick="markSingleRead(${n.NotificationID || n.id})">
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                                        <strong style="font-size:0.86rem; color:#0a192f;">${n.Title || n.type || 'Notification'}</strong>
                                        <span style="font-size:0.72rem; color:#94a3b8;">${createdDate}</span>
                                    </div>
                                    <p style="margin:0; font-size:0.82rem; color:#475569; line-height:1.4;">${n.Message || n.message || ''}</p>
                                </div>
                            `;
                        }).join('');
                    }
                }
            }
        } catch (err) {
            console.warn('Notifications fetch error:', err.message);
        }
    };

    window.markSingleRead = async (id) => {
        if (!token || !id) return;
        try {
            await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (e) {}
    };

    if (btnNotificationBell && notificationPanel) {
        btnNotificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            if (providerProfileMenu) providerProfileMenu.classList.add('hidden');
            const isHidden = notificationPanel.classList.contains('hidden');
            if (isHidden) {
                notificationPanel.classList.remove('hidden');
                fetchNotifications();
            } else {
                notificationPanel.classList.add('hidden');
            }
        });
    }

    if (btnMarkAllRead) {
        btnMarkAllRead.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!token) return;
            try {
                await fetch('http://localhost:5000/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchNotifications();
            } catch (e) {}
        });
    }

    // Dismiss notifications & profile dropdowns on click outside
    document.addEventListener('click', (e) => {
        const notifContainer = document.querySelector('.notification-container');
        if (notificationPanel && !notificationPanel.classList.contains('hidden')) {
            if (notifContainer && !notifContainer.contains(e.target)) {
                notificationPanel.classList.add('hidden');
            }
        }
    });

    // Initial notifications poll
    fetchNotifications();

    // Mobile Sidebar Toggle
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    if (btnToggleSidebar && sidebar) {
        btnToggleSidebar.addEventListener('click', () => sidebar.classList.toggle('active'));
    }

    // ------------------------------------------------------------------------
    // SPA View Router Navigation
    // ------------------------------------------------------------------------
    const sidebarNavLinks = document.querySelectorAll('.sidebar-menu .menu-item');
    const viewPanels = document.querySelectorAll('.provider-view-panel');

    const switchProviderView = (targetHash) => {
        const cleanHash = targetHash ? targetHash.replace('#', '') : 'dashboard-overview';

        let targetViewId = 'view-provider-dashboard';
        if (cleanHash === 'services-section' || cleanHash === 'view-provider-services' || cleanHash === 'packages-section' || cleanHash === 'view-provider-packages') targetViewId = 'view-provider-packages';
        else if (cleanHash === 'bookings-section' || cleanHash === 'view-provider-bookings') targetViewId = 'view-provider-bookings';
        else if (cleanHash === 'calendar-section' || cleanHash === 'view-provider-calendar') targetViewId = 'view-provider-calendar';
        else if (cleanHash === 'profile-section' || cleanHash === 'view-provider-profile') targetViewId = 'view-provider-profile';
        else if (cleanHash === 'withdrawals-section' || cleanHash === 'view-provider-withdrawals') targetViewId = 'view-provider-withdrawals';
        else if (cleanHash === 'reviews-section' || cleanHash === 'view-provider-reviews') targetViewId = 'view-provider-reviews';
        else if (cleanHash === 'messages-section' || cleanHash === 'view-provider-messages') targetViewId = 'view-provider-messages';
        else if (cleanHash === 'notifications-section' || cleanHash === 'view-provider-notifications') targetViewId = 'view-provider-notifications';
        else if (cleanHash === 'subscription-section' || cleanHash === 'view-provider-subscription' || cleanHash === 'plans-selection-grid') {
            targetViewId = 'view-provider-subscription';
            loadProviderSubscriptionData();
        }

        // Fallback: If target view panel element doesn't exist in DOM, default to view-provider-dashboard
        if (!document.getElementById(targetViewId)) {
            targetViewId = 'view-provider-dashboard';
        }

        sidebarNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${cleanHash}` || (targetViewId === 'view-provider-dashboard' && href === '#dashboard-overview') || (targetViewId === 'view-provider-packages' && href === '#packages-section') || (targetViewId === 'view-provider-subscription' && href === '#subscription-section')) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        viewPanels.forEach(panel => {
            if (panel.id === targetViewId) {
                panel.classList.remove('hidden');
            } else {
                panel.classList.add('hidden');
            }
        });

        if (cleanHash === 'plans-selection-grid') {
            setTimeout(() => {
                const grid = document.getElementById('plans-selection-grid');
                if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    sidebarNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                window.location.hash = href;
                switchProviderView(href);
            }
        });
    });

    window.addEventListener('hashchange', () => {
        switchProviderView(window.location.hash);
    });

    // Modal Backdrop Overlay & Escape Key Click Dismissal
    document.querySelectorAll('.admin-modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.add('hidden');
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.admin-modal-overlay').forEach(overlay => overlay.classList.add('hidden'));
        }
    });

        // ------------------------------------------------------------------------
    // Withdrawal Data & Modal Submission Engine
    // ------------------------------------------------------------------------
    const loadWithdrawalsData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/providers/withdrawals/list', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    const elAvail = document.getElementById('val-available-balance');
                    const elEarnings = document.getElementById('val-total-earnings');
                    const elWithdrawn = document.getElementById('val-total-withdrawn');
                    const tableBody = document.getElementById('table-provider-withdrawals-list');

                    if (elAvail) elAvail.textContent = `₱${parseFloat(data.availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (elEarnings) elEarnings.textContent = `₱${parseFloat(data.totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (elWithdrawn) elWithdrawn.textContent = `₱${parseFloat(data.totalWithdrawn || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    if (tableBody) {
                        const withdrawals = data.withdrawals || [];
                        if (withdrawals.length === 0) {
                            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">No payout requests submitted yet.</td></tr>`;
                        } else {
                            tableBody.innerHTML = withdrawals.map(w => {
                                const reqDate = new Date(w.RequestedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                const stLower = (w.Status || 'Pending').toLowerCase();
                                const isApproved = stLower === 'approved' || stLower === 'completed';

                                const statusHtml = isApproved
                                    ? `<span class="status-badge status-confirmed"><i class="fa-solid fa-check"></i> Paid & Sent</span>`
                                    : `<span class="status-badge status-pending" style="background:#fffbeb; color:#d97706; border:1px solid #fef3c7;"><i class="fa-solid fa-clock"></i> Pending Admin Payout</span>`;

                                return `
                                    <tr>
                                        <td><strong style="color:#0a192f; font-size:0.88rem;">#WD-${w.WithdrawalID}</strong></td>
                                        <td><strong style="color:#10b981; font-size:0.92rem;">₱${parseFloat(w.Amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                                        <td><span style="font-weight:700; color:#2563eb; font-size:0.88rem;"><i class="fa-solid fa-wallet"></i> ${w.PayoutMethod}</span></td>
                                        <td><span style="font-size:0.85rem; color:#475569; font-weight:600;">${w.AccountReference} (${w.AccountName || 'Account'})</span></td>
                                        <td><span style="font-size:0.82rem; color:#64748b;">${reqDate}</span></td>
                                        <td>${statusHtml}</td>
                                    </tr>
                                `;
                            }).join('');
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Withdrawals load notice:', err.message);
        }
    };

    // Open Request Withdrawal Modal
    const btnRequestWithdrawalModal = document.getElementById('btn-request-withdrawal-modal');
    const modalRequestWithdrawal = document.getElementById('modal-request-withdrawal');
    const btnCloseRequestWithdrawal = document.getElementById('btn-close-request-withdrawal');
    const btnCancelRequestWithdrawal = document.getElementById('btn-cancel-request-withdrawal');
    const formRequestWithdrawal = document.getElementById('form-request-withdrawal');

    // Payout Method Card Click Handlers
    const payoutCards = document.querySelectorAll('#payout-method-cards-container .payout-card');
    const inputWithdrawalMethod = document.getElementById('input-withdrawal-method');
    const inputAccountRef = document.getElementById('input-withdrawal-account-ref');

    payoutCards.forEach(card => {
        card.addEventListener('click', () => {
            payoutCards.forEach(c => {
                c.style.border = '1.5px solid #cbd5e1';
                c.style.background = '#ffffff';
                c.classList.remove('active-payout-card');
            });

            card.style.border = '2.5px solid #2563eb';
            card.style.background = '#f0f7ff';
            card.classList.add('active-payout-card');

            const selectedMethod = card.getAttribute('data-method');
            if (inputWithdrawalMethod) inputWithdrawalMethod.value = selectedMethod;

            if (inputAccountRef) {
                if (selectedMethod.includes('E-Wallet')) {
                    inputAccountRef.placeholder = 'e.g. 09171234567 (GCash / Maya Mobile No.)';
                } else if (selectedMethod.includes('Card')) {
                    inputAccountRef.placeholder = 'e.g. Card Account / Reference No.';
                } else {
                    inputAccountRef.placeholder = 'e.g. 10-digit Bank Account No. (BDO/BPI/UB)';
                }
            }
        });
    });

    const openWithdrawalModal = async (targetAmount = null) => {
        if (!modalRequestWithdrawal) return;
        const availEl = document.getElementById('val-available-balance');
        let availText = availEl?.textContent || '₱0.00';
        if (targetAmount !== null && targetAmount > 0) {
            availText = `₱${targetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        const modalAvail = document.getElementById('modal-withdrawal-avail-balance');
        if (modalAvail) modalAvail.textContent = availText;

        modalRequestWithdrawal.classList.remove('hidden');
    };

    if (btnRequestWithdrawalModal) {
        btnRequestWithdrawalModal.addEventListener('click', () => {
            const breakdownBox = document.getElementById('modal-withdrawal-breakdown-box');
            if (breakdownBox) breakdownBox.style.display = 'none';
            const inputBookingId = document.getElementById('input-withdrawal-booking-id');
            if (inputBookingId) inputBookingId.value = '';
            const inputAmount = document.getElementById('input-withdrawal-amount');
            if (inputAmount) {
                inputAmount.readOnly = false;
                inputAmount.style.background = '#ffffff';
                inputAmount.style.cursor = 'text';
            }
            openWithdrawalModal();
        });
    }

    window.triggerRequestWithdrawFromBooking = (bookingId, rawTotalAmount) => {
        const total = parseFloat(rawTotalAmount || 0);
        const fee = total * 0.05;
        const net = total * 0.95;

        openWithdrawalModal(net);

        const breakdownBox = document.getElementById('modal-withdrawal-breakdown-box');
        const inputBookingId = document.getElementById('input-withdrawal-booking-id');
        const wbBookingId = document.getElementById('wb-booking-id');
        const wbServiceAmount = document.getElementById('wb-service-amount');
        const wbFeeAmount = document.getElementById('wb-fee-amount');
        const wbNetAmount = document.getElementById('wb-net-amount');
        const inputAmount = document.getElementById('input-withdrawal-amount');

        if (inputBookingId) inputBookingId.value = bookingId || '';
        if (breakdownBox) breakdownBox.style.display = 'block';
        if (wbBookingId) wbBookingId.textContent = `#BK-${bookingId}`;
        if (wbServiceAmount) wbServiceAmount.textContent = `₱${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (wbFeeAmount) wbFeeAmount.textContent = `-₱${fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (wbNetAmount) wbNetAmount.textContent = `₱${net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (inputAmount) {
            inputAmount.value = net.toFixed(2);
            inputAmount.readOnly = true;
            inputAmount.style.background = '#f8fafc';
            inputAmount.style.color = '#0a192f';
            inputAmount.style.cursor = 'not-allowed';
            inputAmount.style.fontWeight = '800';
        }
    };

    if (btnCloseRequestWithdrawal && modalRequestWithdrawal) {
        btnCloseRequestWithdrawal.addEventListener('click', () => modalRequestWithdrawal.classList.add('hidden'));
    }

    if (btnCancelRequestWithdrawal && modalRequestWithdrawal) {
        btnCancelRequestWithdrawal.addEventListener('click', () => modalRequestWithdrawal.classList.add('hidden'));
    }

    // Submit Request Withdrawal Form
    if (formRequestWithdrawal) {
        formRequestWithdrawal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amount = document.getElementById('input-withdrawal-amount')?.value;
            const bookingId = document.getElementById('input-withdrawal-booking-id')?.value;
            const payoutMethod = document.getElementById('input-withdrawal-method')?.value;
            const accountName = document.getElementById('input-withdrawal-account-name')?.value;
            const accountReference = document.getElementById('input-withdrawal-account-ref')?.value;

            if (!amount || parseFloat(amount) <= 0) {
                showToast('Please enter a valid withdrawal amount.', 'error');
                return;
            }

            try {
                const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
                const res = await fetch('/api/providers/withdrawals/create', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ amount, bookingId, payoutMethod, accountName, accountReference })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(data.message || 'Withdrawal request submitted successfully!', 'success');
                    modalRequestWithdrawal.classList.add('hidden');
                    formRequestWithdrawal.reset();
                    const inputBookingId = document.getElementById('input-withdrawal-booking-id');
                    if (inputBookingId) inputBookingId.value = '';
                    loadWithdrawalsData();
                } else {
                    showToast(data.message || 'Failed to submit withdrawal request.', 'error');
                }
            } catch (err) {
                showToast('Network error submitting withdrawal request.', 'error');
            }
        });
    }

    // ------------------------------------------------------------------------
    // Dashboard Stats & Data Loaders
    // ------------------------------------------------------------------------
    const loadDashboardData = async () => {
        await verifyApprovedProviderAccess();

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('http://localhost:5000/api/providers/dashboard-stats', { headers });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.stats) {
                    const s = data.stats;

                    const statTotalServices = document.getElementById('stat-total-services');
                    const statUpcomingBookings = document.getElementById('stat-upcoming-bookings');
                    const statTodaysEvents = document.getElementById('stat-todays-events');
                    const statMonthlyEarnings = document.getElementById('stat-monthly-earnings');

                    if (statTotalServices) statTotalServices.textContent = s.totalServices || 0;
                    if (statUpcomingBookings) statUpcomingBookings.textContent = s.upcomingBookingsCount || 0;
                    if (statTodaysEvents) statTodaysEvents.textContent = s.todaysEventsCount || 0;
                    if (statMonthlyEarnings) statMonthlyEarnings.textContent = `₱${(s.monthlyEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    // Render Upcoming Event Reservations Table
                    renderUpcomingReservations(s.upcomingBookings || []);
                    renderBookingsTable(s.allBookings || []);
                    renderRecentReviews(s.reviewsList || []);
                }
            }
        } catch (err) {
            console.warn('Dashboard stats fetch notice:', err.message);
        }

        await loadWithdrawalsData();
        await loadServices();
        await loadPackages();
    };

    // Global Booking Action Handlers for Provider Dashboard
    window.acceptProviderBooking = async (bookingId) => {
        if (!confirm(`Are you sure you want to ACCEPT booking #${bookingId}?`)) return;
        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/providers/my-bookings/${bookingId}/accept`, {
                method: 'PUT',
                headers
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (typeof showToast === 'function') showToast(`✓ Booking #${bookingId} accepted successfully!`, 'success');
                loadDashboardData();
            } else {
                if (typeof showToast === 'function') showToast(data.message || 'Failed to accept booking.', 'error');
            }
        } catch (err) {
            console.error('Error accepting booking:', err);
        }
    };

    window.completeProviderBooking = async (bookingId) => {
        if (!confirm(`Mark booking #${bookingId} as COMPLETED?`)) return;
        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/providers/my-bookings/${bookingId}/complete`, {
                method: 'PUT',
                headers
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (typeof showToast === 'function') showToast(`✓ Booking #${bookingId} marked as completed!`, 'success');
                loadDashboardData();
            } else {
                if (typeof showToast === 'function') showToast(data.message || 'Failed to complete booking.', 'error');
            }
        } catch (err) {
            console.error('Error completing booking:', err);
        }
    };

    window.cancelProviderBooking = async (bookingId) => {
        if (!confirm(`Are you sure you want to CANCEL booking #${bookingId}?`)) return;
        try {
            const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token'));
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`/api/providers/my-bookings/${bookingId}/cancel`, {
                method: 'PUT',
                headers
            });
            const data = await res.json();
            if (res.ok && data.success) {
                if (typeof showToast === 'function') showToast(`✓ Booking #${bookingId} cancelled.`, 'info');
                loadDashboardData();
            } else {
                if (typeof showToast === 'function') showToast(data.message || 'Failed to cancel booking.', 'error');
            }
        } catch (err) {
            console.error('Error cancelling booking:', err);
        }
    };

    // Render Upcoming Reservations
    const renderUpcomingReservations = (bookings) => {
        const tableBody = document.getElementById('table-upcoming-reservations');
        if (!tableBody) return;

        if (!bookings || bookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748b;">No upcoming events reserved.</td></tr>`;
            return;
        }

        tableBody.innerHTML = bookings.map(b => {
            const clientNameStr = b.ClientName || b.clientName || b.ClientEmail || 'Client Account';
            const packageNameStr = b.PackageName || b.packageName || b.EventName || 'Event Service Package';
            const dateStr = b.ServiceStartDate || b.EventDate || 'Scheduled';
            const statusLower = (b.BookingStatus || 'Confirmed').toLowerCase();

            let actionButtonsHtml = '';
            if (statusLower === 'pending') {
                actionButtonsHtml = `
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="window.acceptProviderBooking(${b.BookingID})" style="padding:5px 10px; font-size:0.78rem; border:none; border-radius:6px; background:#10b981; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-check"></i> Accept</button>
                        <button type="button" onclick="window.cancelProviderBooking(${b.BookingID})" style="padding:5px 10px; font-size:0.78rem; border:none; border-radius:6px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-xmark"></i> Reject</button>
                    </div>
                `;
            } else if (statusLower === 'confirmed') {
                actionButtonsHtml = `
                    <div style="display:flex; gap:6px;">
                        <button type="button" onclick="window.completeProviderBooking(${b.BookingID})" style="padding:5px 10px; font-size:0.78rem; border:none; border-radius:6px; background:#2563eb; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-circle-check"></i> Complete</button>
                        <button type="button" onclick="window.cancelProviderBooking(${b.BookingID})" style="padding:5px 10px; font-size:0.78rem; border:none; border-radius:6px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-ban"></i> Cancel</button>
                    </div>
                `;
            } else if (statusLower === 'completed') {
                actionButtonsHtml = `<span style="font-size:0.85rem; font-weight:800; color:#10b981;"><i class="fa-solid fa-circle-check"></i> Completed</span>`;
            } else if (statusLower === 'cancelled' || statusLower === 'rejected') {
                actionButtonsHtml = `<span style="font-size:0.85rem; font-weight:800; color:#94a3b8;"><i class="fa-solid fa-ban"></i> Cancelled</span>`;
            } else {
                actionButtonsHtml = `<span style="font-size:0.85rem; font-weight:800; color:#475569;">${b.BookingStatus}</span>`;
            }

            return `
                <tr>
                    <td><strong style="color:#0a192f; font-size:0.9rem;">${clientNameStr}</strong></td>
                    <td><strong style="color:#2563eb; font-size:0.88rem;">${packageNameStr}</strong></td>
                    <td><span style="font-size:0.82rem; color:#475569;"><i class="fa-solid fa-calendar-day" style="color:#2563eb;"></i> ${dateStr}</span></td>
                    <td><strong style="font-size:0.92rem; color:#10b981;">₱${parseFloat(b.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                    <td><span class="status-badge status-${statusLower}">${b.BookingStatus || 'Confirmed'}</span></td>
                    <td>${actionButtonsHtml}</td>
                </tr>
            `;
        }).join('');
    };

    // Render Full Bookings Table
    const renderBookingsTable = (bookings) => {
        const tableBody = document.getElementById('table-provider-bookings-list');
        if (!tableBody) return;

        if (!bookings || bookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#64748b;">No bookings yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = bookings.map(b => {
            const clientNameStr = b.ClientName || b.clientName || b.ClientEmail || 'Client Account';
            const packageNameStr = b.PackageName || b.packageName || b.EventName || 'Event Service Package';
            const dateStr = b.ServiceStartDate || b.EventDate || 'Scheduled';
            const locStr = b.Location || b.EventAddress || b.EventPlace || 'Batangas';
            const statusLower = (b.BookingStatus || 'Confirmed').toLowerCase();

            let actionButtonsHtml = '';
            if (statusLower === 'pending') {
                actionButtonsHtml = `
                    <div style="display:flex; gap:10px; flex-wrap:nowrap;">
                        <button type="button" onclick="window.acceptProviderBooking(${b.BookingID})" style="padding:9px 16px; font-size:0.88rem; border:none; border-radius:8px; background:#10b981; color:#fff; cursor:pointer; font-weight:800; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.25);"><i class="fa-solid fa-check"></i> Accept</button>
                        <button type="button" onclick="window.cancelProviderBooking(${b.BookingID})" style="padding:9px 16px; font-size:0.88rem; border:none; border-radius:8px; background:#ef4444; color:#fff; cursor:pointer; font-weight:800; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(239,68,68,0.25);"><i class="fa-solid fa-xmark"></i> Reject</button>
                    </div>
                `;
            } else if (statusLower === 'confirmed') {
                actionButtonsHtml = `
                    <div style="display:flex; gap:10px; flex-wrap:nowrap;">
                        <button type="button" onclick="window.completeProviderBooking(${b.BookingID})" style="padding:9px 16px; font-size:0.88rem; border:none; border-radius:8px; background:#2563eb; color:#fff; cursor:pointer; font-weight:800; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(37,99,235,0.25);"><i class="fa-solid fa-circle-check"></i> Complete</button>
                        <button type="button" onclick="window.cancelProviderBooking(${b.BookingID})" style="padding:9px 16px; font-size:0.88rem; border:none; border-radius:8px; background:#ef4444; color:#fff; cursor:pointer; font-weight:800; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(239,68,68,0.25);"><i class="fa-solid fa-ban"></i> Cancel</button>
                    </div>
                `;
            } else if (statusLower === 'completed') {
                const wdStatus = (b.WithdrawalStatus || '').toLowerCase();
                let withdrawButtonHtml = '';
                if (wdStatus === 'pending') {
                    withdrawButtonHtml = `<span style="font-size:0.86rem; font-weight:800; color:#d97706; background:#fef3c7; border:1px solid #fde68a; padding:7px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-clock"></i> Payout Requested</span>`;
                } else if (wdStatus === 'approved' || wdStatus === 'completed' || wdStatus === 'processed') {
                    withdrawButtonHtml = `<span style="font-size:0.86rem; font-weight:800; color:#15803d; background:#dcfce7; border:1px solid #bbf7d0; padding:7px 14px; border-radius:8px; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-circle-check"></i> Paid &amp; Sent</span>`;
                } else {
                    withdrawButtonHtml = `<button type="button" onclick="window.triggerRequestWithdrawFromBooking(${b.BookingID}, ${b.TotalAmount || 0})" style="padding:9px 16px; font-size:0.88rem; border:none; border-radius:8px; background:#10b981; color:#fff; cursor:pointer; font-weight:800; display:inline-flex; align-items:center; gap:6px; box-shadow:0 3px 10px rgba(16,185,129,0.25);"><i class="fa-solid fa-paper-plane"></i> Request Withdraw</button>`;
                }

                actionButtonsHtml = `
                    <div style="display:flex; align-items:center; gap:12px; flex-wrap:nowrap;">
                        <span style="font-size:0.92rem; font-weight:800; color:#10b981; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-circle-check"></i> Completed</span>
                        ${withdrawButtonHtml}
                    </div>
                `;
            } else if (statusLower === 'cancelled' || statusLower === 'rejected') {
                actionButtonsHtml = `<span style="font-size:0.92rem; font-weight:800; color:#94a3b8; display:inline-flex; align-items:center; gap:6px;"><i class="fa-solid fa-ban"></i> Cancelled</span>`;
            } else {
                actionButtonsHtml = `<span style="font-size:0.92rem; font-weight:800; color:#475569;">${b.BookingStatus}</span>`;
            }

            return `
                <tr style="transition:background 0.2s ease;">
                    <td style="padding:20px 22px;"><strong style="color:#0a192f; font-size:1.02rem; font-weight:800;">#BK-${b.BookingID}</strong></td>
                    <td style="padding:20px 22px;"><strong style="color:#0a192f; font-size:1.05rem; font-weight:700;">${clientNameStr}</strong></td>
                    <td style="padding:20px 22px;"><strong style="color:#2563eb; font-size:1.02rem; font-weight:700;">${packageNameStr}</strong></td>
                    <td style="padding:20px 22px;"><span style="font-size:0.95rem; color:#334155; font-weight:600;"><i class="fa-solid fa-calendar-day" style="color:#2563eb; margin-right:4px;"></i> ${dateStr}</span></td>
                    <td style="padding:20px 22px;"><span style="font-size:0.95rem; color:#475569; font-weight:500;">${locStr}</span></td>
                    <td style="padding:20px 22px;"><strong style="font-size:1.18rem; font-weight:800; color:#10b981;">₱${parseFloat(b.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                    <td style="padding:20px 22px;"><span class="status-badge status-${statusLower}" style="font-size:0.9rem; padding:8px 16px; border-radius:20px; font-weight:800;">${b.BookingStatus || 'Confirmed'}</span></td>
                    <td style="padding:20px 22px;">${actionButtonsHtml}</td>
                </tr>
            `;
        }).join('');
    };

    // Render Recent Reviews
    const renderRecentReviews = (reviews) => {
        const container = document.getElementById('dash-recent-reviews-list');
        const fullContainer = document.getElementById('full-provider-reviews-list');
        if (!container) return;

        if (!reviews || reviews.length === 0) {
            const emptyHtml = `<div style="padding:20px; text-align:center; color:#64748b; font-size:0.88rem;">No reviews yet.</div>`;
            container.innerHTML = emptyHtml;
            if (fullContainer) fullContainer.innerHTML = emptyHtml;
            return;
        }

        const html = reviews.map(r => `
            <div style="padding:12px 0; border-bottom:1px solid #f1f5f9;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong style="font-size:0.88rem; color:#0a192f;">${r.ClientName}</strong>
                    <span style="font-size:0.8rem; color:#f59e0b; font-weight:700;"><i class="fa-solid fa-star"></i> ${r.Rating}.0</span>
                </div>
                <p style="font-size:0.8rem; color:#475569; margin:4px 0 0 0;">${r.Comment}</p>
            </div>
        `).join('');

        container.innerHTML = html;
        if (fullContainer) fullContainer.innerHTML = html;
    };

    // Load Services List
    const loadServices = async () => {
        const tableBody = document.getElementById('table-provider-services-list');
        if (!tableBody) return;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('http://localhost:5000/api/providers/services/list', { headers });

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data) && data.data.length > 0) {
                    tableBody.innerHTML = data.data.map(s => `
                        <tr>
                            <td><strong style="color:#0a192f; font-size:0.92rem;">${s.ServiceName}</strong></td>
                            <td><span style="font-size:0.82rem; color:#2563eb; font-weight:700;">${s.Category}</span></td>
                            <td><strong style="font-size:0.95rem; color:#10b981;">₱${parseFloat(s.Price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                            <td><span class="status-badge status-confirmed">Active</span></td>
                            <td>
                                <button type="button" onclick="window.deleteServiceItem(${s.ServiceID})" style="padding:4px 10px; font-size:0.75rem; border:none; border-radius:6px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-trash"></i> Delete</button>
                            </td>
                        </tr>
                    `).join('');
                    return;
                }
            }
        } catch (e) {
            console.warn('Load services notice:', e.message);
        }
        if (tableBody) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#64748b;">No services added yet.</td></tr>`;
        }
    };

    // Store packages and selected photos in memory
    let currentProviderPackages = [];
    let selectedPkgPhotoFiles = [];
    let existingPkgPhotoObjects = [];

    // Helper: Lightbox Viewer
    window.openImageLightbox = (imageUrl) => {
        const lightboxModal = document.getElementById('modal-package-photo-lightbox');
        const lightboxImg = document.getElementById('lightbox-full-image');
        if (lightboxModal && lightboxImg && imageUrl) {
            lightboxImg.src = imageUrl.startsWith('/') || imageUrl.startsWith('http') ? imageUrl : `/${imageUrl}`;
            lightboxModal.classList.remove('hidden');
        }
    };

    // Helper: Remove Existing Saved Photo
    window.removeExistingPackagePhoto = async (imageId) => {
        if (!confirm('Remove this photo from package offer?')) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`/api/providers/packages/photos/${imageId}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Photo removed.', 'info');
                existingPkgPhotoObjects = existingPkgPhotoObjects.filter(img => img.id != imageId);
                renderPkgPhotoPreviews();
                await loadPackages();
            } else {
                showToast(`✕ Failed to remove photo: ${data.message}`, 'error');
            }
        } catch (e) {
            showToast('✕ Error removing photo.', 'error');
        }
    };

    // Render Modal Photo Preview Grid
    const renderPkgPhotoPreviews = () => {
        const previewContainer = document.getElementById('pkg-photos-preview-grid');
        if (!previewContainer) return;

        if (existingPkgPhotoObjects.length === 0 && selectedPkgPhotoFiles.length === 0) {
            previewContainer.innerHTML = `<span style="font-size:0.8rem; color:#94a3b8; font-style:italic;">No setup photos selected yet.</span>`;
            return;
        }

        let html = '';

        // Existing Photos from DB
        existingPkgPhotoObjects.forEach(img => {
            const fullUrl = img.url.startsWith('/') || img.url.startsWith('http') ? img.url : `/${img.url}`;
            html += `
                <div style="position:relative; width:72px; height:72px; border-radius:8px; overflow:hidden; border:1px solid #cbd5e1; background:#000;">
                    <img src="${fullUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.openImageLightbox('${fullUrl}')" title="Click to view">
                    <button type="button" onclick="window.removeExistingPackagePhoto(${img.id})" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.85); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; font-weight:800; cursor:pointer;" title="Remove photo">✕</button>
                </div>
            `;
        });

        // Newly Selected Photos from File Input
        selectedPkgPhotoFiles.forEach((file, index) => {
            const tempUrl = URL.createObjectURL(file);
            html += `
                <div style="position:relative; width:72px; height:72px; border-radius:8px; overflow:hidden; border:1px solid #2563eb; background:#000;">
                    <img src="${tempUrl}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.openImageLightbox('${tempUrl}')" title="Click to view">
                    <button type="button" onclick="window.removePendingPkgPhoto(${index})" style="position:absolute; top:2px; right:2px; background:rgba(239,68,68,0.85); color:#fff; border:none; border-radius:50%; width:20px; height:20px; font-size:10px; font-weight:800; cursor:pointer;" title="Remove selection">✕</button>
                </div>
            `;
        });

        previewContainer.innerHTML = html;
    };

    window.removePendingPkgPhoto = (index) => {
        selectedPkgPhotoFiles.splice(index, 1);
        renderPkgPhotoPreviews();
    };

    // Load Service Packages List & Render Cards Grid
    const loadPackages = async () => {
        const gridContainer = document.getElementById('provider-packages-cards-grid');
        const tableBody = document.getElementById('table-provider-packages-list');
        if (!gridContainer && !tableBody) return;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/providers/packages/list', { headers });

            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    currentProviderPackages = data.data;

                    if (gridContainer) {
                        if (data.data.length === 0) {
                            gridContainer.innerHTML = `
                                <div style="grid-column:1/-1; text-align:center; padding:48px 24px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px;">
                                    <i class="fa-solid fa-box-open" style="font-size:2.5rem; color:#94a3b8; margin-bottom:12px; display:block;"></i>
                                    <h3 style="margin:0 0 6px 0; color:#0a192f; font-size:1.1rem; font-weight:800;">No Service Packages Added Yet</h3>
                                    <p style="margin:0 0 16px 0; font-size:0.88rem; color:#64748b;">Click <strong>Create New Offer</strong> to add your first service package for clients.</p>
                                </div>
                            `;
                        } else {
                            gridContainer.innerHTML = data.data.map(p => {
                                const inclusionsArr = (p.Inclusions || p.Description || 'Full Equipment Setup')
                                    .split(',')
                                    .map(s => s.trim())
                                    .filter(Boolean);
                                const isActive = p.IsActive !== false && p.IsActive !== 0;
                                const photos = Array.isArray(p.images) ? p.images : [];

                                let photosHTML = '';
                                if (photos.length > 0) {
                                    const visiblePhotos = photos.slice(0, 3);
                                    const remainingCount = photos.length - 3;

                                    photosHTML = visiblePhotos.map(img => {
                                        const src = img.url.startsWith('/') || img.url.startsWith('http') ? img.url : `/${img.url}`;
                                        return `
                                            <div style="position:relative; width:80px; height:80px; border-radius:10px; overflow:hidden; border:1px solid #cbd5e1; flex-shrink:0;">
                                                <img src="${src}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.openImageLightbox('${src}')" title="Click to view setup photo">
                                            </div>
                                        `;
                                    }).join('');

                                    if (remainingCount > 0) {
                                        const fourthSrc = photos[3].url.startsWith('/') || photos[3].url.startsWith('http') ? photos[3].url : `/${photos[3].url}`;
                                        photosHTML += `
                                            <div onclick="window.openImageLightbox('${fourthSrc}')" style="width:80px; height:80px; border-radius:10px; background:#0a192f; color:#ffffff; font-size:0.82rem; font-weight:800; display:flex; align-items:center; justify-content:center; cursor:pointer; flex-shrink:0; border:1px solid #cbd5e1;" title="View all setup photos">
                                                +${remainingCount} more
                                            </div>
                                        `;
                                    }
                                } else {
                                    photosHTML = `<span style="font-size:0.88rem; color:#94a3b8; font-style:italic;">No setup photos added yet.</span>`;
                                }

                                return `
                                    <div class="package-offer-card" style="background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; transition:all 0.2s ease; box-shadow:0 4px 14px rgba(10,25,47,0.05);">
                                        <div>
                                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                                                <span style="font-size:0.85rem; font-weight:700; color:#2563eb; background:#eff6ff; padding:5px 14px; border-radius:20px; text-transform:uppercase;">
                                                    ${p.Category || 'Concert Audio & Stage Lights'}
                                                </span>
                                                <span class="status-badge ${isActive ? 'status-confirmed' : 'status-cancelled'}" style="font-size:0.85rem; padding:5px 14px; border-radius:20px; font-weight:700;">
                                                    ${isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>

                                            <h3 style="margin:0 0 10px 0; color:#0a192f; font-size:1.3rem; font-weight:700;">${p.PackageName}</h3>
                                            <div style="font-size:1.55rem; font-weight:800; color:#10b981; margin-bottom:14px; display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                                                ₱${parseFloat(p.Price || 0).toLocaleString('en-US', {minimumFractionDigits: 2})} 
                                                <span style="font-size:0.88rem; color:#64748b; font-weight:500;">/ Event Rental</span>
                                                <span style="font-size:0.82rem; font-weight:700; color:#0284c7; background:#e0f2fe; padding:4px 10px; border-radius:12px;" title="Extra day rate percentage"><i class="fa-solid fa-calendar-plus"></i> +${p.AdditionalDayPercentage != null ? p.AdditionalDayPercentage : 20}% / Extra Day</span>
                                            </div>

                                            <p style="font-size:0.96rem; color:#64748b; margin:0 0 16px 0; line-height:1.5;">${p.Description || 'No description provided.'}</p>

                                            <div style="margin-bottom:18px;">
                                                <strong style="font-size:0.9rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:8px; font-weight:700;">Includes:</strong>
                                                <ul style="list-style:none; padding:0; margin:0; font-size:0.95rem; color:#334155; display:flex; flex-direction:column; gap:6px;">
                                                    ${inclusionsArr.map(inc => `<li><i class="fa-solid fa-check" style="color:#10b981; margin-right:8px;"></i> ${inc}</li>`).join('')}
                                                </ul>
                                            </div>

                                            <div style="margin-bottom:20px;">
                                                <strong style="font-size:0.9rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:10px; font-weight:700;">
                                                    <i class="fa-solid fa-camera" style="color:#2563eb; margin-right:4px;"></i> Setup / Inclusion Photos:
                                                </strong>
                                                <div style="display:flex; align-items:center; gap:12px; overflow-x:auto; padding-bottom:4px;">
                                                    ${photosHTML}
                                                </div>
                                            </div>
                                        </div>

                                        <div style="display:flex; gap:10px; padding-top:16px; border-top:1px solid #f1f5f9; margin-top:14px;">
                                            <button type="button" onclick="window.togglePackageStatusItem(${p.PackageID}, ${!isActive})" style="flex:1; height:46px; border:1px solid #cbd5e1; border-radius:8px; background:#f8fafc; font-size:0.96rem; font-weight:700; color:#475569; cursor:pointer;" title="Toggle Offer Status">
                                                <i class="fa-solid fa-power-off" style="color:${isActive ? '#ef4444' : '#10b981'};"></i> ${isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button type="button" onclick="window.editPackageItem(${p.PackageID})" style="flex:1; height:46px; border:none; border-radius:8px; background:#2563eb; color:#fff; font-size:0.96rem; font-weight:700; cursor:pointer;" title="Edit Offer">
                                                <i class="fa-solid fa-pen"></i> Edit
                                            </button>
                                            <button type="button" onclick="window.deletePackageItem(${p.PackageID})" style="height:46px; padding:0 18px; border:none; border-radius:8px; background:#ef4444; color:#fff; font-size:0.96rem; font-weight:700; cursor:pointer;" title="Delete Offer">
                                                <i class="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }).join('');
                        }
                    }

                    if (tableBody) {
                        tableBody.innerHTML = data.data.map(p => `
                            <tr>
                                <td><strong style="color:#0a192f; font-size:0.92rem;">${p.PackageName}</strong></td>
                                <td><span style="font-size:0.82rem; color:#2563eb; font-weight:700;">${p.Category}</span></td>
                                <td><strong style="font-size:0.95rem; color:#10b981;">₱${parseFloat(p.Price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
                                <td><span style="font-size:0.8rem; color:#64748b;">${p.Inclusions || p.Description || 'Full Equipment Set'}</span></td>
                                <td><span class="status-badge ${p.IsActive !== false ? 'status-confirmed' : 'status-cancelled'}">${p.IsActive !== false ? 'Active' : 'Inactive'}</span></td>
                                <td>
                                    <button type="button" onclick="window.editPackageItem(${p.PackageID})" style="padding:4px 10px; font-size:0.75rem; border:none; border-radius:6px; background:#2563eb; color:#fff; cursor:pointer; font-weight:700; margin-right:4px;"><i class="fa-solid fa-pen"></i> Edit</button>
                                    <button type="button" onclick="window.deletePackageItem(${p.PackageID})" style="padding:4px 10px; font-size:0.75rem; border:none; border-radius:6px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;"><i class="fa-solid fa-trash"></i> Delete</button>
                                </td>
                            </tr>
                        `).join('');
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Load packages notice:', e.message);
        }
    };

    // Modal Triggers: Create / Edit Package Photo Upload Listeners
    const btnCreatePackageModal = document.getElementById('btn-create-package-modal');
    const modalAddPackage = document.getElementById('modal-provider-add-package');
    const btnSaveNewPackage = document.getElementById('btn-save-new-package');
    const btnTriggerPkgPhotoUpload = document.getElementById('btn-trigger-pkg-photo-upload');
    const inputPkgPhotos = document.getElementById('input-pkg-photos');

    if (btnTriggerPkgPhotoUpload && inputPkgPhotos) {
        btnTriggerPkgPhotoUpload.addEventListener('click', () => inputPkgPhotos.click());
    }

    if (inputPkgPhotos) {
        inputPkgPhotos.addEventListener('change', (e) => {
            const files = Array.from(e.target.files || []);
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

            files.forEach(file => {
                if (!validTypes.includes(file.type)) {
                    showToast(`File "${file.name}" is not a supported image format (JPG, PNG, WebP).`, 'warning');
                    return;
                }
                if (file.size > 5 * 1024 * 1024) {
                    showToast(`File "${file.name}" exceeds maximum allowed size of 5 MB.`, 'warning');
                    return;
                }
                selectedPkgPhotoFiles.push(file);
            });

            inputPkgPhotos.value = '';
            renderPkgPhotoPreviews();
        });
    }

    if (btnCreatePackageModal && modalAddPackage) {
        btnCreatePackageModal.addEventListener('click', () => {
            const inputId = document.getElementById('input-pkg-id');
            const modalTitle = document.getElementById('modal-pkg-title');
            if (inputId) inputId.value = '';
            if (modalTitle) modalTitle.textContent = 'Create Service Package Offer';

            const nameInput = document.getElementById('input-pkg-name');
            const priceInput = document.getElementById('input-pkg-price');
            const addDayPctInput = document.getElementById('input-pkg-additional-day-percentage');
            const descInput = document.getElementById('input-pkg-description');
            const incInput = document.getElementById('input-pkg-inclusions');
            if (nameInput) nameInput.value = '';
            if (priceInput) priceInput.value = '';
            if (addDayPctInput) addDayPctInput.value = '20';
            if (descInput) descInput.value = '';
            if (incInput) incInput.value = '';

            selectedPkgPhotoFiles = [];
            existingPkgPhotoObjects = [];
            renderPkgPhotoPreviews();

            modalAddPackage.classList.remove('hidden');
        });
    }

    if (btnSaveNewPackage) {
        btnSaveNewPackage.addEventListener('click', async () => {
            const packageId = document.getElementById('input-pkg-id')?.value;
            const packageName = document.getElementById('input-pkg-name')?.value.trim();
            const category = document.getElementById('input-pkg-category')?.value.trim();
            const price = document.getElementById('input-pkg-price')?.value;
            const additionalDayPercentage = document.getElementById('input-pkg-additional-day-percentage')?.value || '20';
            const description = document.getElementById('input-pkg-description')?.value.trim();
            const inclusions = document.getElementById('input-pkg-inclusions')?.value.trim();

            if (!packageName || !price) {
                showToast('Please enter package name and price.', 'warning');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('packageName', packageName);
                formData.append('name', packageName);
                formData.append('category', category || 'Concert Audio & Stage Lights');
                formData.append('price', price);
                formData.append('additionalDayPercentage', additionalDayPercentage);
                formData.append('description', description || packageName);
                formData.append('inclusions', inclusions || description || 'Full Equipment Setup');
                formData.append('isActive', 'true');

                selectedPkgPhotoFiles.forEach(file => {
                    formData.append('packagePhotos', file);
                });

                const headers = { 'Authorization': `Bearer ${token}` };
                const endpoint = packageId ? `/api/providers/packages/${packageId}` : '/api/providers/packages/create';
                const method = packageId ? 'PUT' : 'POST';

                const res = await fetch(endpoint, {
                    method,
                    headers,
                    body: formData
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(packageId ? '✓ Service package updated successfully!' : '✓ Service package offer created successfully!', 'success');
                    if (modalAddPackage) modalAddPackage.classList.add('hidden');
                    selectedPkgPhotoFiles = [];
                    existingPkgPhotoObjects = [];
                    await loadPackages();
                    await loadDashboardData();
                } else {
                    showToast(`✕ Error: ${data.message || 'Failed to save package.'}`, 'error');
                }
            } catch (e) {
                showToast('✕ Network error while saving package offer.', 'error');
            }
        });
    }

    // Window Action Handlers for Edit, Delete, Toggle Status
    window.editPackageItem = (id) => {
        const pkg = currentProviderPackages.find(p => p.PackageID == id);
        if (!pkg) return;

        const inputId = document.getElementById('input-pkg-id');
        const modalTitle = document.getElementById('modal-pkg-title');
        const nameInput = document.getElementById('input-pkg-name');
        const catInput = document.getElementById('input-pkg-category');
        const priceInput = document.getElementById('input-pkg-price');
        const addDayPctInput = document.getElementById('input-pkg-additional-day-percentage');
        const descInput = document.getElementById('input-pkg-description');
        const incInput = document.getElementById('input-pkg-inclusions');

        if (inputId) inputId.value = pkg.PackageID;
        if (modalTitle) modalTitle.textContent = 'Edit Service Package Offer';
        if (nameInput) nameInput.value = pkg.PackageName || '';
        if (catInput) catInput.value = pkg.Category || 'Concert Audio & Stage Lights';
        if (priceInput) priceInput.value = pkg.Price || '';
        if (addDayPctInput) addDayPctInput.value = pkg.AdditionalDayPercentage != null ? pkg.AdditionalDayPercentage : 20;
        if (descInput) descInput.value = pkg.Description || '';
        if (incInput) incInput.value = pkg.Inclusions || '';

        selectedPkgPhotoFiles = [];
        existingPkgPhotoObjects = Array.isArray(pkg.images) ? [...pkg.images] : [];
        renderPkgPhotoPreviews();

        if (modalAddPackage) modalAddPackage.classList.remove('hidden');
    };

    window.togglePackageStatusItem = async (id, newActiveState) => {
        try {
            const pkg = currentProviderPackages.find(p => p.PackageID == id);
            if (!pkg) return;

            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
            const res = await fetch(`/api/providers/packages/${id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    name: pkg.PackageName,
                    packageName: pkg.PackageName,
                    category: pkg.Category,
                    price: pkg.Price,
                    additionalDayPercentage: pkg.AdditionalDayPercentage || 20,
                    description: pkg.Description,
                    inclusions: pkg.Inclusions,
                    isActive: newActiveState
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast(newActiveState ? '✓ Offer activated!' : '✓ Offer deactivated!', 'info');
                await loadPackages();
                await loadDashboardData();
            }
        } catch (e) {
            showToast('✕ Error updating package status.', 'error');
        }
    };

    window.deletePackageItem = async (id) => {
        if (!confirm('Are you sure you want to delete this service package offer?')) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`/api/providers/packages/${id}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Package offer deleted successfully.', 'info');
                await loadPackages();
                await loadDashboardData();
            }
        } catch (e) {
            showToast('✕ Error deleting package.', 'error');
        }
    };

    // ------------------------------------------------------------------------
    // Provider Subscription & PayMongo Checkout Engine
    // ------------------------------------------------------------------------
    let currentProviderSubscription = null;

    const loadProviderSubscriptionData = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/subscriptions/my-subscription', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    currentProviderSubscription = data.subscription;
                    const hasUsedTrial = data.hasUsedFreeTrial;

                    const elBadgeStatus = document.getElementById('sub-badge-status');
                    const elPlanTitle = document.getElementById('sub-plan-title');
                    const elExpiryDate = document.getElementById('sub-expiry-date');
                    const elDaysRemaining = document.getElementById('sub-days-remaining');
                    const btnClaimTrial = document.getElementById('btn-claim-free-trial');
                    const tablePayments = document.getElementById('table-provider-subscription-payments');

                    // 1. Update Free Trial Button
                    if (btnClaimTrial) {
                        if (hasUsedTrial) {
                            btnClaimTrial.disabled = true;
                            btnClaimTrial.innerHTML = `<i class="fa-solid fa-circle-check"></i> 1st Month Free Trial Claimed`;
                            btnClaimTrial.style.background = '#94a3b8';
                            btnClaimTrial.style.boxShadow = 'none';
                            btnClaimTrial.style.cursor = 'not-allowed';
                        } else {
                            btnClaimTrial.disabled = false;
                            btnClaimTrial.innerHTML = `<i class="fa-solid fa-circle-play"></i> Claim 1st Month Free`;
                            btnClaimTrial.style.background = '#10b981';
                            btnClaimTrial.style.boxShadow = '0 4px 12px rgba(16,185,129,0.25)';
                            btnClaimTrial.style.cursor = 'pointer';
                        }
                    }

                    // 2. Update Status Card
                    if (currentProviderSubscription) {
                        const s = currentProviderSubscription;
                        const daysLeft = s.DaysRemaining !== null && s.DaysRemaining !== undefined ? parseInt(s.DaysRemaining, 10) : 0;
                        const isCurrentlyActive = (s.IsActive === 1 || s.IsActive === true || s.Status === 'Active') && daysLeft >= 0;
                        const endDateObj = new Date(s.EndDate);
                        const endStr = !isNaN(endDateObj.getTime()) 
                            ? endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'N/A';

                        if (elBadgeStatus) {
                            if (isCurrentlyActive) {
                                elBadgeStatus.textContent = 'ACTIVE';
                                elBadgeStatus.style.background = '#10b981';
                            } else {
                                elBadgeStatus.textContent = 'EXPIRED';
                                elBadgeStatus.style.background = '#ef4444';
                            }
                        }

                        if (elPlanTitle) elPlanTitle.textContent = s.PlanName || 'Standard Membership';
                        if (elExpiryDate) elExpiryDate.textContent = endStr;
                        if (elDaysRemaining) {
                            if (daysLeft > 0) {
                                elDaysRemaining.textContent = `${daysLeft} Days Remaining`;
                                elDaysRemaining.style.color = '#ffffff';
                            } else if (daysLeft === 0) {
                                elDaysRemaining.textContent = 'Expires Today';
                                elDaysRemaining.style.color = '#f59e0b';
                            } else {
                                elDaysRemaining.textContent = 'Expired - Please Renew';
                                elDaysRemaining.style.color = '#f87171';
                            }
                        }
                    } else {
                        if (elBadgeStatus) {
                            elBadgeStatus.textContent = 'INACTIVE';
                            elBadgeStatus.style.background = '#64748b';
                        }
                        if (elPlanTitle) elPlanTitle.textContent = 'No Active Subscription';
                        if (elExpiryDate) elExpiryDate.textContent = 'N/A';
                        if (elDaysRemaining) elDaysRemaining.textContent = 'Choose a tier below';
                    }

                    // 3. Render Payment & Billing History
                    if (tablePayments) {
                        const payments = data.payments || [];
                        window.providerSubscriptionPaymentsMap = {};
                        if (payments.length === 0) {
                            tablePayments.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:#64748b;">No subscription payments recorded yet.</td></tr>`;
                        } else {
                            tablePayments.innerHTML = payments.map(p => {
                                window.providerSubscriptionPaymentsMap[p.PaymentID] = p;
                                const payDate = new Date(p.PaymentDate).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                const amt = parseFloat(p.Amount || 0);
                                const isFree = p.PlanType === 'free_trial' || amt === 0;
                                const amtDisplay = isFree ? '₱0.00 (Free)' : `₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                                const statusColor = (p.PaymentStatus === 'Paid') ? '#10b981' : '#f59e0b';
                                const refId = p.PayMongoSessionID || 'N/A';

                                return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:14px 16px; font-weight:700; color:#0a192f;">
                                            <i class="fa-solid fa-crown" style="color:#f59e0b; margin-right:6px;"></i>
                                            ${p.PlanName || p.PlanType}
                                        </td>
                                        <td style="padding:14px 16px; font-weight:800; color:#0a192f;">${amtDisplay}</td>
                                        <td style="padding:14px 16px; color:#475569; font-weight:600;">${p.PaymentMethod || 'PayMongo'}</td>
                                        <td style="padding:14px 16px; color:#64748b;">${payDate}</td>
                                        <td style="padding:14px 16px;">
                                            <span style="background:${statusColor}15; color:${statusColor}; border:1px solid ${statusColor}40; padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:800;">
                                                ${p.PaymentStatus || 'Paid'}
                                            </span>
                                        </td>
                                        <td style="padding:14px 16px; font-family:monospace; font-size:0.8rem; color:#64748b;">${refId.length > 20 ? refId.substring(0, 18) + '...' : refId}</td>
                                        <td style="padding:14px 16px; text-align:center;">
                                            <button type="button" class="btn-view-sub-receipt-item" data-payment-id="${p.PaymentID}" style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; padding:6px 14px; border-radius:8px; font-size:0.78rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                                                <i class="fa-solid fa-receipt"></i> View Receipt
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('');

                            // Attach click listeners to View Receipt buttons
                            document.querySelectorAll('.btn-view-sub-receipt-item').forEach(btn => {
                                btn.addEventListener('click', () => {
                                    const pid = btn.getAttribute('data-payment-id');
                                    const record = window.providerSubscriptionPaymentsMap[pid];
                                    if (record) openSubscriptionReceiptModal(record, data.provider);
                                });
                            });
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Subscription fetch notice:', err);
        }
    };

    // Helper to open Subscription Payment Receipt Modal
    const openSubscriptionReceiptModal = (p, providerInfo) => {
        const modal = document.getElementById('modal-subscription-receipt');
        if (!modal) return;

        const invNo = document.getElementById('sub-rec-inv-no');
        const bizName = document.getElementById('sub-rec-biz-name');
        const ownerName = document.getElementById('sub-rec-owner-name');
        const email = document.getElementById('sub-rec-email');
        const date = document.getElementById('sub-rec-date');
        const method = document.getElementById('sub-rec-method');
        const ref = document.getElementById('sub-rec-ref');
        const planName = document.getElementById('sub-rec-plan-name');
        const duration = document.getElementById('sub-rec-duration');
        const price = document.getElementById('sub-rec-price');
        const totalAmount = document.getElementById('sub-rec-total-amount');

        const invStr = `INV-SUB-${String(p.PaymentID || Math.floor(Math.random()*90000+10000)).padStart(5, '0')}`;
        const amt = parseFloat(p.Amount || 0);
        const isFree = p.PlanType === 'free_trial' || amt === 0;
        const amtStr = isFree ? '₱0.00 (Free Trial)' : `₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const payDateStr = new Date(p.PaymentDate || Date.now()).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        const planDurStr = p.PlanType === 'yearly' ? '365 Days' : '30 Days';

        if (invNo) invNo.textContent = invStr;
        if (bizName) bizName.textContent = (providerInfo && providerInfo.businessName) || 'Service Provider Account';
        if (ownerName) ownerName.textContent = (providerInfo && providerInfo.ownerName) || 'SoundSphere Member';
        if (email) email.textContent = (user && user.email) || (providerInfo && providerInfo.email) || 'provider@soundsphere.com';
        if (date) date.textContent = payDateStr;
        if (method) method.textContent = p.PaymentMethod || 'PayMongo';
        if (ref) ref.textContent = p.PayMongoSessionID || 'N/A (Direct Activation)';
        if (planName) planName.textContent = p.PlanName || p.PlanType || 'SoundSphere Membership Plan';
        if (duration) duration.textContent = planDurStr;
        if (price) price.textContent = amtStr;
        if (totalAmount) totalAmount.textContent = amtStr;

        modal.classList.remove('hidden');
    };

    // Modal Close & Print Event Listeners
    const modalSubReceipt = document.getElementById('modal-subscription-receipt');
    const btnCloseSubReceipt = document.getElementById('btn-close-sub-receipt');
    const btnCloseSubReceiptBtn = document.getElementById('btn-close-sub-receipt-btn');
    const btnPrintSubReceipt = document.getElementById('btn-print-sub-receipt');

    if (btnCloseSubReceipt && modalSubReceipt) {
        btnCloseSubReceipt.addEventListener('click', () => modalSubReceipt.classList.add('hidden'));
    }
    if (btnCloseSubReceiptBtn && modalSubReceipt) {
        btnCloseSubReceiptBtn.addEventListener('click', () => modalSubReceipt.classList.add('hidden'));
    }
    if (btnPrintSubReceipt) {
        btnPrintSubReceipt.addEventListener('click', () => window.print());
    }

    // 1. Claim Free Trial Button Handler
    const btnClaimFreeTrial = document.getElementById('btn-claim-free-trial');
    if (btnClaimFreeTrial) {
        btnClaimFreeTrial.addEventListener('click', async () => {
            if (!confirm('Activate your 1st Month Free Trial (30 Days at ₱0)?')) return;
            try {
                btnClaimFreeTrial.disabled = true;
                btnClaimFreeTrial.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Activating...`;

                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const res = await fetch('/api/subscriptions/free-trial', { method: 'POST', headers });
                const data = await res.json();

                if (res.ok && data.success) {
                    showToast(data.message || '✓ 1st Month Free Trial activated successfully!', 'success');
                    await loadProviderSubscriptionData();
                } else {
                    showToast(data.message || '✕ Failed to activate free trial.', 'error');
                }
            } catch (err) {
                showToast('✕ Network error activating free trial.', 'error');
            } finally {
                await loadProviderSubscriptionData();
            }
        });
    }

    // 2. PayMongo Checkout for Monthly (₱199) and Yearly (₱1,990)
    const initiateSubscriptionCheckout = async (planType) => {
        try {
            const btnMonthly = document.getElementById('btn-checkout-monthly');
            const btnYearly = document.getElementById('btn-checkout-yearly');
            const targetBtn = (planType === 'yearly') ? btnYearly : btnMonthly;

            if (targetBtn) {
                targetBtn.disabled = true;
                targetBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Initializing PayMongo...`;
            }

            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
            const res = await fetch('/api/subscriptions/checkout', {
                method: 'POST',
                headers,
                body: JSON.stringify({ planType })
            });

            const data = await res.json();
            if (res.ok && data.success && data.checkoutUrl) {
                // Redirect provider to PayMongo checkout session
                window.location.href = data.checkoutUrl;
            } else {
                showToast(data.message || '✕ Failed to start PayMongo checkout.', 'error');
                if (targetBtn) {
                    targetBtn.disabled = false;
                    targetBtn.innerHTML = (planType === 'yearly') 
                        ? `<i class="fa-solid fa-crown"></i> Subscribe Yearly (₱1,990)` 
                        : `<i class="fa-solid fa-credit-card"></i> Subscribe Monthly (₱199)`;
                }
            }
        } catch (err) {
            showToast('✕ Error connecting to payment gateway.', 'error');
        }
    };

    const btnChangeRenewPlan = document.getElementById('btn-change-renew-plan');
    if (btnChangeRenewPlan) {
        btnChangeRenewPlan.addEventListener('click', (e) => {
            e.preventDefault();
            switchProviderView('#plans-selection-grid');
            const grid = document.getElementById('plans-selection-grid');
            if (grid) {
                grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    const btnMonthly = document.getElementById('btn-checkout-monthly');
    if (btnMonthly) {
        btnMonthly.addEventListener('click', () => initiateSubscriptionCheckout('monthly'));
    }

    const btnYearly = document.getElementById('btn-checkout-yearly');
    if (btnYearly) {
        btnYearly.addEventListener('click', () => initiateSubscriptionCheckout('yearly'));
    }

    // Check for Return from PayMongo Checkout Session
    const checkPayMongoReturn = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        const subStatus = urlParams.get('subscription_status');
        const sessionId = urlParams.get('session_id');
        const plan = urlParams.get('plan') || 'monthly';

        if (subStatus === 'success' && sessionId) {
            try {
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const res = await fetch('/api/subscriptions/confirm', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ sessionId, planType: plan })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(data.message || '🎉 Subscription verified with PayMongo! Welcome aboard.', 'success');
                } else {
                    showToast(data.message || '⚠ Subscription verification status pending.', 'info');
                }
            } catch (e) {
                console.warn('Return verification notice:', e);
            } finally {
                // Clean URL parameters
                const cleanUrl = window.location.pathname + '#subscription-section';
                window.history.replaceState({}, document.title, cleanUrl);
                switchProviderView('#subscription-section');
                await loadProviderSubscriptionData();
            }
        }
    };

    await checkPayMongoReturn();

    // Initial Data Fetch
    await loadDashboardData();
    await loadPackages();
    switchProviderView(window.location.hash);
});
