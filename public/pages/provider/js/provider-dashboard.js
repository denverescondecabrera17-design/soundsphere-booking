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
            const res = await fetch('/api/providers/me', { headers });
            
            if (res.status === 401) {
                alert('Your session has expired. Please log in again.');
                window.location.href = '/login.html';
                return false;
            }

            if (res.status === 403 || !res.ok) {
                const errData = await res.json().catch(() => ({}));
                alert(errData.message || 'Access Denied: The Provider Dashboard is strictly for clients who have applied as a service provider and have been approved by the Administrator.');
                window.location.href = '/marketplace.html';
                return false;
            }

            const data = await res.json();
            if (data.success && data.isApprovedProvider && data.profile) {
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

                if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${bName}!`;
                if (headerProviderName) headerProviderName.textContent = bName;
                if (dropdownEmail) dropdownEmail.textContent = data.profile.email;
                if (dropdownStatus) dropdownStatus.textContent = `Approved Service Provider`;

                // Update Card & Modal Header Info
                const bAddress = data.profile.businessAddress || data.profile.address || 'Balayan, Batangas';
                const cardProfBizName = document.getElementById('card-prof-biz-name');
                const cardProfOwnerName = document.getElementById('card-prof-owner-name');
                const cardProfAddress = document.getElementById('card-prof-address');
                const cardProfCoverage = document.getElementById('card-prof-coverage');

                if (cardProfBizName) cardProfBizName.textContent = bName;
                if (cardProfOwnerName) cardProfOwnerName.textContent = oName;
                if (cardProfAddress) cardProfAddress.textContent = bAddress;
                if (cardProfCoverage) cardProfCoverage.textContent = covArea;

                // Update Avatar Photo Previews Across Topbar, Dropdown, and Card Header
                const profAvatarImg = document.getElementById('prof-avatar-img');
                const profAvatarInitials = document.getElementById('prof-avatar-initials');
                const headerAvatarImg = document.getElementById('header-provider-avatar-img');
                const headerAvatarIcon = document.getElementById('header-provider-avatar-icon');
                const dropdownAvatarImg = document.getElementById('dropdown-provider-avatar-img');
                const dropdownAvatarIcon = document.getElementById('dropdown-provider-avatar-icon');

                const formattedAvatarUrl = avatarUrl ? (
                    typeof avatarUrl === 'string' && avatarUrl.startsWith('/data:') ? avatarUrl.substring(1) :
                    (avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.startsWith('data:') ? avatarUrl : `/${avatarUrl}`)
                ) : null;

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
                const profAddress = document.getElementById('prof-address');
                const profEmail = document.getElementById('prof-email');
                const profContact = document.getElementById('prof-contact');
                const profCoverage = document.getElementById('prof-coverage');

                if (profBizName) profBizName.textContent = bName;
                if (profOwnerName) profOwnerName.textContent = oName;
                if (profAddress) profAddress.textContent = bAddress;
                if (profEmail) profEmail.textContent = data.profile.email || 'N/A';
                if (profContact) profContact.textContent = data.profile.contactNumber || data.profile.phone || 'N/A';
                if (profCoverage) profCoverage.textContent = covArea;

                return true;
            } else {
                alert('Access Denied: You must be an approved Service Provider to access the Provider Portal.');
                window.location.href = '/marketplace.html';
                return false;
            }
        } catch (e) {
            console.warn('Authorization verification notice:', e.message);
            alert('Unable to verify provider credentials. Redirecting to Marketplace.');
            window.location.href = '/marketplace.html';
            return false;
        }
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
            editProviderAvatarPreview.src = typeof avatarUrl === 'string' && avatarUrl.startsWith('/data:') ? avatarUrl.substring(1) : (avatarUrl.startsWith('http') || avatarUrl.startsWith('/') || avatarUrl.startsWith('data:') ? avatarUrl : `/${avatarUrl}`);
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
            const res = await fetch('/api/notifications', { headers });
            if (res.ok) {
                const data = await res.json();
                const notifications = data.notifications || data.data || [];
                const unreadCount = notifications.filter(n => !n.IsRead && n.IsRead !== 1).length;

                if (notificationBadge) {
                    if (unreadCount > 0) {
                        notificationBadge.textContent = unreadCount > 99 ? '99+' : unreadCount;
                        notificationBadge.classList.remove('hidden');
                    } else {
                        notificationBadge.classList.add('hidden');
                    }
                }

                // Helper to pick contextual icons, tags, and targets
                const getNotifMeta = (n) => {
                    const text = `${n.Title || ''} ${n.Message || ''} ${n.NotificationType || ''} ${n.RelatedType || ''}`.toLowerCase();
                    const typeStr = `${n.NotificationType || ''} ${n.RelatedType || ''}`.toLowerCase();
                    const titleStr = `${n.Title || ''}`.toLowerCase();

                    if (typeStr.includes('permit') || titleStr.includes('permit') || text.includes('business permit') || text.includes('permit expired') || text.includes('permit expiring') || text.includes('permit compliance') || text.includes('renew permit')) {
                        return { icon: 'fa-file-signature', color: '#e11d48', bg: '#fff1f2', target: 'modal-permit', label: 'Upload Permit' };
                    }
                    if (text.includes('booking') || text.includes('booked') || text.includes('reservation')) {
                        return { icon: 'fa-calendar-check', color: '#2563eb', bg: '#eff6ff', target: '#bookings-section', label: 'View Booking' };
                    }
                    if (text.includes('message') || text.includes('chat')) {
                        return { icon: 'fa-comments', color: '#0284c7', bg: '#e0f2fe', target: '#messages-section', label: 'Open Chat' };
                    }
                    if (text.includes('payout') || text.includes('withdrawal') || text.includes('wallet') || text.includes('paid')) {
                        return { icon: 'fa-calendar-check', color: '#10b981', bg: '#ecfdf5', target: '#bookings-section', label: 'View Bookings' };
                    }
                    if (text.includes('review') || text.includes('rating') || text.includes('feedback')) {
                        return { icon: 'fa-star', color: '#f59e0b', bg: '#fffbeb', target: '#reviews-section', label: 'View Review' };
                    }
                    if (text.includes('subscription') || text.includes('plan')) {
                        return { icon: 'fa-crown', color: '#8b5cf6', bg: '#f5f3ff', target: '#subscription-section', label: 'View Plan' };
                    }
                    return { icon: 'fa-bell', color: '#64748b', bg: '#f1f5f9', target: '#dashboard-overview', label: 'View Details' };
                };

                const escapeJs = (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, ' ');

                // 1. Render Dropdown List
                if (notificationList) {
                    if (notifications.length === 0) {
                        notificationList.innerHTML = `<div style="padding:28px 16px; text-align:center; color:#64748b; font-size:0.88rem;">No notifications.</div>`;
                    } else {
                        notificationList.innerHTML = notifications.map(n => {
                            const isUnread = !n.IsRead && n.IsRead !== 1;
                            const createdDate = new Date(n.CreatedAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            const meta = getNotifMeta(n);
                            return `
                                <div class="notification-item ${isUnread ? 'unread' : ''}" 
                                     style="padding:12px 16px; border-bottom:1px solid #f1f5f9; background:${isUnread ? '#f0f7ff' : '#ffffff'}; cursor:pointer; display:flex; gap:12px; align-items:flex-start; transition:background 0.15s ease;"
                                     onmouseover="this.style.backgroundColor='#f8fafc';"
                                     onmouseout="this.style.backgroundColor='${isUnread ? '#f0f7ff' : '#ffffff'}';"
                                     onclick="window.handleNotificationClick(${n.NotificationID || n.id}, '${escapeJs(n.RelatedType || n.NotificationType || '')}', ${n.RelatedID || 'null'}, '${escapeJs(n.Title || '')}', '${escapeJs(n.Message || '')}')"
                                     title="Click to view details">
                                    <div style="width:34px; height:34px; border-radius:10px; background:${meta.bg}; color:${meta.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:0.95rem; margin-top:2px;">
                                        <i class="fa-solid ${meta.icon}"></i>
                                    </div>
                                    <div style="flex:1; min-width:0;">
                                        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:6px; margin-bottom:3px;">
                                            <strong style="font-size:0.86rem; color:#0a192f; display:flex; align-items:center; gap:6px;">
                                                ${isUnread ? '<span style="width:7px; height:7px; border-radius:50%; background:#2563eb; display:inline-block;"></span>' : ''}
                                                ${n.Title || n.type || 'Notification'}
                                            </strong>
                                            <span style="font-size:0.7rem; color:#94a3b8; white-space:nowrap;">${createdDate}</span>
                                        </div>
                                        <p style="margin:0; font-size:0.8rem; color:#475569; line-height:1.35; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;">${n.Message || n.message || ''}</p>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    }
                }

                // 2. Render Full Notifications History Page
                const fullList = document.getElementById('full-notifications-history-list');
                if (fullList) {
                    if (notifications.length === 0) {
                        fullList.innerHTML = `<div style="padding:40px 20px; text-align:center; color:#64748b; font-size:0.95rem;"><i class="fa-solid fa-bell-slash" style="font-size:2rem; color:#cbd5e1; margin-bottom:10px; display:block;"></i>No notifications yet.</div>`;
                    } else {
                        fullList.innerHTML = notifications.map(n => {
                            const isUnread = !n.IsRead && n.IsRead !== 1;
                            const createdDate = new Date(n.CreatedAt || Date.now()).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            const meta = getNotifMeta(n);
                            return `
                                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:18px 20px; border-radius:12px; border:1px solid ${isUnread ? '#bfdbfe' : '#e2e8f0'}; background:${isUnread ? '#f8faff' : '#ffffff'}; transition:all 0.2s ease; cursor:pointer;"
                                     onmouseover="this.style.boxShadow='0 4px 12px rgba(15,23,42,0.06)'; this.style.borderColor='#93c5fd';"
                                     onmouseout="this.style.boxShadow='none'; this.style.borderColor='${isUnread ? '#bfdbfe' : '#e2e8f0'}';"
                                     onclick="window.handleNotificationClick(${n.NotificationID || n.id}, '${escapeJs(n.RelatedType || n.NotificationType || '')}', ${n.RelatedID || 'null'}, '${escapeJs(n.Title || '')}', '${escapeJs(n.Message || '')}')">
                                    <div style="display:flex; gap:16px; align-items:flex-start; flex:1;">
                                        <div style="width:44px; height:44px; border-radius:12px; background:${meta.bg}; color:${meta.color}; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:1.15rem;">
                                            <i class="fa-solid ${meta.icon}"></i>
                                        </div>
                                        <div>
                                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px; flex-wrap:wrap;">
                                                <h4 style="margin:0; font-size:0.98rem; font-weight:800; color:#0a192f;">${n.Title || n.type || 'Notification'}</h4>
                                                ${isUnread ? '<span style="font-size:0.72rem; font-weight:800; color:#2563eb; background:#eff6ff; padding:2px 8px; border-radius:12px; border:1px solid #dbeafe;">NEW</span>' : ''}
                                                <span style="font-size:0.78rem; color:#94a3b8;">${createdDate}</span>
                                            </div>
                                            <p style="margin:0; font-size:0.88rem; color:#475569; line-height:1.45;">${n.Message || n.message || ''}</p>
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
                                        <button type="button" 
                                                onclick="event.stopPropagation(); window.handleNotificationClick(${n.NotificationID || n.id}, '${escapeJs(n.RelatedType || n.NotificationType || '')}', ${n.RelatedID || 'null'}, '${escapeJs(n.Title || '')}', '${escapeJs(n.Message || '')}')"
                                                style="padding:6px 14px; border:1px solid ${meta.target === 'modal-permit' ? '#fecdd3' : '#bfdbfe'}; border-radius:8px; background:${meta.target === 'modal-permit' ? '#fff1f2' : '#eff6ff'}; color:${meta.target === 'modal-permit' ? '#e11d48' : '#2563eb'}; font-weight:700; font-size:0.82rem; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                                            ${meta.label} <i class="fa-solid fa-arrow-right" style="font-size:0.72rem;"></i>
                                        </button>
                                    </div>
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
            await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (e) {}
    };

    window.handleNotificationClick = async (notifId, relatedType, relatedId, title = '', message = '') => {
        if (!token) return;

        // 1. Mark as read in database
        if (notifId) {
            try {
                await fetch(`/api/notifications/${notifId}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {}
        }

        // 2. Dismiss dropdown
        if (notificationPanel) notificationPanel.classList.add('hidden');

        // 3. Refresh list & badge
        fetchNotifications();

        // 4. Intelligent Navigation based on notification topic
        const str = `${relatedType || ''} ${title || ''} ${message || ''}`.toLowerCase();
        const typeStr = `${relatedType || ''}`.toLowerCase();
        const titleStr = `${title || ''}`.toLowerCase();

        if (typeStr.includes('permit') || titleStr.includes('permit') || str.includes('business permit') || str.includes('permit expired') || str.includes('permit expiring') || str.includes('permit compliance') || str.includes('renew permit')) {
            if (typeof window.openUploadPermitModal === 'function') {
                window.openUploadPermitModal();
            } else {
                const modal = document.getElementById('modal-provider-upload-permit');
                if (modal) modal.classList.remove('hidden');
            }
            return;
        }

        if (str.includes('booking') || str.includes('booked') || str.includes('reservation')) {
            window.location.hash = '#bookings-section';
            switchProviderView('#bookings-section');

            // Scroll to and highlight booking row if ID matches
            let targetBookingId = relatedId;
            if (!targetBookingId) {
                const match = (message || title).match(/#BK-(\d+)|booking\s*#?(\d+)/i);
                if (match) targetBookingId = match[1] || match[2];
            }
            if (targetBookingId) {
                setTimeout(() => {
                    const row = document.getElementById(`booking-row-${targetBookingId}`) || document.querySelector(`tr[data-booking-id="${targetBookingId}"]`);
                    if (row) {
                        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        row.style.transition = 'background-color 0.4s ease';
                        row.style.backgroundColor = '#fef08a';
                        setTimeout(() => { row.style.backgroundColor = ''; }, 3000);
                    }
                }, 300);
            }
        } else if (str.includes('message') || str.includes('chat')) {
            window.location.hash = '#messages-section';
            switchProviderView('#messages-section');
        } else if (str.includes('payout') || str.includes('withdrawal') || str.includes('wallet')) {
            window.location.hash = '#bookings-section';
            switchProviderView('#bookings-section');
        } else if (str.includes('review') || str.includes('rating') || str.includes('feedback')) {
            window.location.hash = '#reviews-section';
            switchProviderView('#reviews-section');
        } else if (str.includes('subscription') || str.includes('plan')) {
            window.location.hash = '#subscription-section';
            switchProviderView('#subscription-section');
        }
        else if (str.includes('permit') || str.includes('license') || (relatedType && relatedType.toLowerCase().includes('permit'))) {
            if (typeof window.openUploadPermitModal === 'function') window.openUploadPermitModal();
        } else {
            window.location.hash = '#bookings-section';
            switchProviderView('#bookings-section');
        }
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
                await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchNotifications();
                showToast('✓ All notifications marked as read', 'success');
            } catch (e) {}
        });
    }

    const btnDropdownViewAll = document.getElementById('btn-dropdown-view-all-notifs');
    if (btnDropdownViewAll) {
        btnDropdownViewAll.addEventListener('click', (e) => {
            e.preventDefault();
            if (notificationPanel) notificationPanel.classList.add('hidden');
            window.location.hash = '#notifications-section';
            switchProviderView('#notifications-section');
        });
    }

    const btnPageMarkAllRead = document.getElementById('btn-page-mark-all-read');
    if (btnPageMarkAllRead) {
        btnPageMarkAllRead.addEventListener('click', async () => {
            if (!token) return;
            try {
                await fetch('/api/notifications/read-all', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                fetchNotifications();
                showToast('✓ All notifications marked as read', 'success');
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
        else if (cleanHash === 'income-report-section' || cleanHash === 'view-provider-income-report') {
            targetViewId = 'view-provider-income-report';
            loadProviderIncomeReport();
        }
        else if (cleanHash === 'calendar-section' || cleanHash === 'view-provider-calendar') {
            targetViewId = 'view-provider-calendar';
            loadProviderCalendarSchedule();
        }
        else if (cleanHash === 'profile-section' || cleanHash === 'view-provider-profile') targetViewId = 'view-provider-profile';
        else if (cleanHash === 'wallet-section' || cleanHash === 'view-provider-wallet' || cleanHash === 'withdrawals-section' || cleanHash === 'view-provider-withdrawals') {
            targetViewId = 'view-provider-wallet';
            loadWalletData();
        }
        else if (cleanHash === 'reviews-section' || cleanHash === 'view-provider-reviews') targetViewId = 'view-provider-reviews';
        else if (cleanHash === 'messages-section' || cleanHash === 'view-provider-messages') {
            targetViewId = 'view-provider-messages';
            const msgIframe = document.getElementById('iframe-provider-messages');
            if (msgIframe && (!msgIframe.src || msgIframe.src.endsWith('about:blank'))) {
                msgIframe.src = '/client-messages.html?embed=true';
            }
        }
        else if (cleanHash === 'notifications-section' || cleanHash === 'view-provider-notifications') {
            targetViewId = 'view-provider-notifications';
            fetchNotifications();
        }
        else if (cleanHash === 'subscription-section' || cleanHash === 'view-provider-subscription' || cleanHash === 'plans-selection-grid') {
            targetViewId = 'view-provider-subscription';
            loadProviderSubscriptionData();
        }
        else if (cleanHash === 'archive-section' || cleanHash === 'view-provider-archive') {
            targetViewId = 'view-provider-archive';
            if (typeof loadArchivedPackages === 'function') loadArchivedPackages();
        }

        // Fallback: If target view panel element doesn't exist in DOM, default to view-provider-dashboard
        if (!document.getElementById(targetViewId)) {
            targetViewId = 'view-provider-dashboard';
        }

        sidebarNavLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${cleanHash}` || (targetViewId === 'view-provider-dashboard' && href === '#dashboard-overview') || (targetViewId === 'view-provider-packages' && href === '#packages-section') || (targetViewId === 'view-provider-archive' && href === '#archive-section') || (targetViewId === 'view-provider-subscription' && href === '#subscription-section') || (targetViewId === 'view-provider-income-report' && href === '#income-report-section') || (targetViewId === 'view-provider-wallet' && (href === '#wallet-section' || href === '#withdrawals-section'))) {
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

    // Unread Messages Badge Tracker
    const updateProviderUnreadMessagesBadge = async () => {
        try {
            const currentUid = user?.id || user?.userId || user?.UserID;
            if (!currentUid) return;
            const res = await fetch(`/api/messages/conversations?userId=${currentUid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.conversations)) {
                const totalUnread = data.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
                const badge = document.getElementById('unread-messages-badge');
                if (badge) {
                    if (totalUnread > 0) {
                        badge.textContent = totalUnread > 99 ? '99+' : totalUnread;
                        badge.classList.remove('hidden');
                    } else {
                        badge.classList.add('hidden');
                    }
                }
            }
        } catch (e) {}
    };
    updateProviderUnreadMessagesBadge();
    setInterval(updateProviderUnreadMessagesBadge, 25000);

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
    // ------------------------------------------------------------------------
    // Provider Wallet & Cashier Disbursements Engine
    // ------------------------------------------------------------------------
    window.currentWalletAvailableBalance = 0;

    const loadWalletData = async () => {
        try {
            const authToken = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token') || token);
            const headers = { 'Authorization': `Bearer ${authToken}` };
            const res = await fetch('/api/providers/withdrawals/list', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    const avail = parseFloat(data.availableBalance || 0);
                    const escrow = parseFloat(data.heldInEscrow || 0);
                    const pending = parseFloat(data.pendingWithdrawals || 0);
                    const withdrawn = parseFloat(data.totalWithdrawn || 0);

                    window.currentWalletAvailableBalance = avail;

                    // Update stat cards in view-provider-wallet
                    const elAvail = document.getElementById('wallet-stat-available');
                    const elEscrow = document.getElementById('wallet-stat-escrow');
                    const elPending = document.getElementById('wallet-stat-pending');
                    const elWithdrawn = document.getElementById('wallet-stat-withdrawn');

                    if (elAvail) elAvail.textContent = `₱${avail.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (elEscrow) elEscrow.textContent = `₱${escrow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (elPending) elPending.textContent = `₱${pending.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (elWithdrawn) elWithdrawn.textContent = `₱${withdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    // Also update dashboard cards if present
                    const dashWallet = document.getElementById('stat-wallet-balance');
                    const dashEscrow = document.getElementById('stat-escrow-balance');
                    if (dashWallet) dashWallet.textContent = `₱${avail.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (dashEscrow) dashEscrow.textContent = `₱${escrow.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    // Also modal display
                    const modalAvail = document.getElementById('bw-available-wallet-display');
                    if (modalAvail) modalAvail.textContent = `₱${avail.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    // Legacy ledger elements support
                    const legAvail = document.getElementById('val-available-balance');
                    const legEarnings = document.getElementById('val-total-earnings');
                    const legWithdrawn = document.getElementById('val-total-withdrawn');
                    if (legAvail) legAvail.textContent = `₱${avail.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (legEarnings) legEarnings.textContent = `₱${parseFloat(data.totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (legWithdrawn) legWithdrawn.textContent = `₱${withdrawn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    // Render Complete Services Confirmed by Clients (Not Yet Disbursed by Cashier)
                    const tableUndisbursed = document.getElementById('table-wallet-undisbursed-bookings');
                    const badgeUndisbursed = document.getElementById('undisbursed-count-badge');
                    const undisbursedList = data.undisbursedCompletedBookings || [];

                    if (badgeUndisbursed) {
                        badgeUndisbursed.textContent = `${undisbursedList.length} Undisbursed Service${undisbursedList.length === 1 ? '' : 's'}`;
                    }

                    if (tableUndisbursed) {
                        if (undisbursedList.length === 0) {
                            tableUndisbursed.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#64748b;">
                                <i class="fa-solid fa-circle-check" style="color:#10b981; font-size:1.4rem; display:block; margin-bottom:8px;"></i>
                                All completed services have been disbursed by the Cashier! No pending undisbursed services.
                            </td></tr>`;
                        } else {
                            tableUndisbursed.innerHTML = undisbursedList.map(b => {
                                const tot = parseFloat(b.TotalAmount || 0);
                                const paid = parseFloat(b.AmountPaid || 0);
                                const pSt = (b.PaymentStatus || '').toLowerCase();
                                const isFull = (pSt === 'paid' || b.BookingStatus === 'Completed');
                                const gross = isFull ? tot : paid;
                                const net = parseFloat(b.netEarnings || (gross * 0.95));

                                return `
                                    <tr>
                                        <td><strong style="color:#0a192f; font-size:0.88rem; font-family:monospace;">#${b.BookingReference || 'BK-' + b.BookingID}</strong></td>
                                        <td><strong style="color:#1e293b; font-size:0.88rem;">${b.ClientName || 'Client'}</strong></td>
                                        <td><span style="color:#2563eb; font-weight:600; font-size:0.88rem;">${b.PackageName || 'Event Service Package'}</span></td>
                                        <td style="text-align:right; font-size:0.9rem; font-weight:600; color:#475569;">₱${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td style="text-align:right; font-size:0.95rem; font-weight:800; color:#059669;">₱${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td style="text-align:center;">
                                            <span style="background:#fffbeb; color:#b45309; border:1px solid #fde68a; padding:4px 12px; border-radius:12px; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                                                <i class="fa-solid fa-clock"></i> Pending
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('');
                        }
                    }

                    // Render Transactional History of All Disbursed
                    const tableBody = document.getElementById('table-provider-withdrawals-list');
                    if (tableBody) {
                        const withdrawals = data.withdrawals || [];
                        const disbursedList = withdrawals.filter(w => {
                            const stLower = (w.Status || '').toLowerCase();
                            return stLower === 'approved' || stLower === 'completed';
                        });

                        if (disbursedList.length === 0) {
                            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:32px; color:#64748b;">No disbursed transactions recorded yet. Once the Cashier releases your payout, it will appear in this ledger.</td></tr>`;
                        } else {
                            tableBody.innerHTML = disbursedList.map(w => {
                                const disbDate = new Date(w.ProcessedAt || w.RequestedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                                const amt = parseFloat(w.Amount || 0);

                                return `
                                    <tr>
                                        <td><strong style="color:#0a192f; font-size:0.88rem; font-family:monospace;">#WD-${w.WithdrawalID}</strong></td>
                                        <td><strong style="color:#059669; font-size:0.95rem; font-weight:800;">₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                                        <td><span style="font-weight:700; color:#2563eb; font-size:0.88rem;"><i class="fa-solid fa-wallet"></i> ${w.PayoutMethod || 'GCash'}</span></td>
                                        <td><span style="font-size:0.85rem; color:#475569; font-weight:600;">${w.AccountReference} <span style="color:#64748b; font-weight:400;">(${w.AccountName || 'Account'})</span></span></td>
                                        <td><span style="font-size:0.82rem; color:#64748b; font-weight:600;">${disbDate}</span></td>
                                        <td>
                                            <span class="status-badge status-confirmed" style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; padding:4px 10px; border-radius:12px; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                                                <i class="fa-solid fa-circle-check"></i> Disbursed by Cashier
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('');
                        }
                    }

                    // Optional legacy table support
                    const tableCompleted = document.getElementById('table-wallet-completed-bookings');
                    if (tableCompleted) {
                        const completedList = data.completedBookings || [];
                        if (completedList.length === 0) {
                            tableCompleted.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:28px; color:#64748b;">No completed services released to wallet yet.</td></tr>`;
                        } else {
                            tableCompleted.innerHTML = completedList.map(b => {
                                const tot = parseFloat(b.TotalAmount || 0);
                                const paid = parseFloat(b.AmountPaid || 0);
                                const pSt = (b.PaymentStatus || '').toLowerCase();
                                const isFull = (pSt === 'paid' || b.BookingStatus === 'Completed');
                                const gross = isFull ? tot : paid;
                                const comm = gross * 0.05;
                                const net = gross * 0.95;

                                const compDate = b.CompletionAcceptedAt ? new Date(b.CompletionAcceptedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'Confirmed Complete';

                                return `
                                    <tr>
                                        <td><strong style="color:#0a192f; font-size:0.88rem; font-family:monospace;">#${b.BookingReference || 'BK-' + b.BookingID}</strong></td>
                                        <td><strong style="color:#1e293b; font-size:0.88rem;">${b.ClientName || 'Client'}</strong></td>
                                        <td><span style="color:#2563eb; font-weight:600; font-size:0.88rem;">${b.PackageName || 'Sound & Lights'}</span></td>
                                        <td style="text-align:right; font-size:0.9rem; font-weight:600; color:#475569;">₱${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td style="text-align:right; font-size:0.9rem; font-weight:600; color:#ef4444;">-₱${comm.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td style="text-align:right; font-size:0.95rem; font-weight:800; color:#059669;">₱${net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                        <td style="text-align:center;">
                                            <span style="background:#ecfdf5; color:#059669; border:1px solid #a7f3d0; padding:4px 10px; border-radius:12px; font-size:0.78rem; font-weight:700; display:inline-flex; align-items:center; gap:5px;">
                                                <i class="fa-solid fa-circle-check"></i> ${compDate}
                                            </span>
                                        </td>
                                    </tr>
                                `;
                            }).join('');
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Wallet load notice:', err.message);
        }
    };

    const loadWithdrawalsData = loadWalletData;
    window.loadWalletData = loadWalletData;

    // ------------------------------------------------------------------------
    // Provider Income Report & Financial Ledger Engine
    // ------------------------------------------------------------------------
    let currentIncomeBookings = [];
    let allTimeIncomeStats = { totalNet: 0, completedCount: 0 };

    const getBookingYearMonth = (b) => {
        const raw = b.ServiceStartDate || b.EventDate || b.CreatedAt;
        if (!raw) return { year: '', month: '', yearMonth: '' };
        if (typeof raw === 'string' && /^\d{4}-\d{2}/.test(raw)) {
            const y = raw.substring(0, 4);
            const m = raw.substring(5, 7);
            return { year: y, month: m, yearMonth: `${y}-${m}` };
        }
        const d = new Date(raw);
        if (isNaN(d.getTime())) return { year: '', month: '', yearMonth: '' };
        const y = String(d.getFullYear());
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return { year: y, month: m, yearMonth: `${y}-${m}` };
    };

    const formatMonthLabel = (yearMonthStr) => {
        if (!yearMonthStr) return '';
        const parts = yearMonthStr.split('-');
        if (parts.length < 2) return yearMonthStr;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = new Date(y, m, 1);
        return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    };

    const getActiveIncomePeriodInfo = () => {
        const periodSelect = document.getElementById('select-income-period');
        const period = periodSelect ? periodSelect.value : 'all';
        const monthInput = document.getElementById('input-income-month');
        const selectedMonth = monthInput ? monthInput.value : '';
        const yearSelect = document.getElementById('select-income-year');
        const selectedYear = yearSelect ? yearSelect.value : '';

        let label = 'All Time';
        let slug = 'AllTime';
        if (period === 'monthly' && selectedMonth) {
            label = formatMonthLabel(selectedMonth);
            slug = `Monthly_${selectedMonth}`;
        } else if (period === 'yearly' && selectedYear) {
            label = `Year ${selectedYear}`;
            slug = `Yearly_${selectedYear}`;
        }
        return { period, selectedMonth, selectedYear, label, slug };
    };

    const populateIncomeYears = () => {
        const yearSelect = document.getElementById('select-income-year');
        if (!yearSelect) return;
        const yearsSet = new Set();
        const currentYear = String(new Date().getFullYear());
        yearsSet.add(currentYear);

        currentIncomeBookings.forEach(b => {
            const ym = getBookingYearMonth(b);
            if (ym.year) yearsSet.add(ym.year);
        });

        const sortedYears = Array.from(yearsSet).sort().reverse();
        const curVal = yearSelect.value || currentYear;
        yearSelect.innerHTML = sortedYears.map(y => `<option value="${y}" ${y === curVal ? 'selected' : ''}>Year ${y}</option>`).join('');
    };

    const getFilteredIncomeBookings = (filterQuery = null) => {
        const searchInput = document.getElementById('input-income-ledger-search');
        const q = (filterQuery != null ? filterQuery : (searchInput ? searchInput.value : '')).trim().toLowerCase();
        const periodInfo = getActiveIncomePeriodInfo();

        return currentIncomeBookings.filter(b => {
            // 1. Period filter (Monthly or Yearly)
            if (periodInfo.period === 'monthly' && periodInfo.selectedMonth) {
                const ym = getBookingYearMonth(b);
                if (ym.yearMonth !== periodInfo.selectedMonth) return false;
            } else if (periodInfo.period === 'yearly' && periodInfo.selectedYear) {
                const ym = getBookingYearMonth(b);
                if (ym.year !== periodInfo.selectedYear) return false;
            }

            // 2. Search query filter
            if (q) {
                const ref = `bk-${b.BookingID} ${b.BookingReference || ''}`.toLowerCase();
                const client = (b.ClientName || '').toLowerCase();
                const pkg = (b.PackageName || b.EventName || '').toLowerCase();
                const evtType = (b.EventType || '').toLowerCase();
                if (!ref.includes(q) && !client.includes(q) && !pkg.includes(q) && !evtType.includes(q)) {
                    return false;
                }
            }

            return true;
        });
    };

    const renderIncomeBookingsTable = (filterQuery = null) => {
        const tableBody = document.getElementById('table-provider-income-list');
        const badge = document.getElementById('income-bookings-badge');
        if (!tableBody) return;

        const periodInfo = getActiveIncomePeriodInfo();
        const filtered = getFilteredIncomeBookings(filterQuery);

        if (badge) {
            badge.textContent = `${filtered.length} Booking${filtered.length === 1 ? '' : 's'} (${periodInfo.label})`;
        }

        // Dynamically update the Stat Cards for the selected period
        let periodIncome = 0;
        let periodCompleted = 0;
        filtered.forEach(b => {
            const gross = parseFloat(b.TotalAmount || 0);
            const paid = (b.AmountPaid != null && !isNaN(b.AmountPaid)) ? parseFloat(b.AmountPaid) : 0;
            const commRate = parseFloat(b.CommissionRate || 5) / 100;
            const isFull = (b.PaymentStatus === 'Paid' || b.BookingStatus === 'Completed');
            const net = (isFull ? gross : paid) * (1 - commRate);
            periodIncome += net;
            if ((b.BookingStatus || '').toLowerCase() === 'completed') {
                periodCompleted++;
            }
        });

        const elTotalNet = document.getElementById('inc-stat-total-net');
        const elCompletedCount = document.getElementById('inc-stat-completed-count');
        const elNetDesc = document.getElementById('inc-stat-total-net-desc');
        const elCompletedDesc = document.getElementById('inc-stat-completed-desc');

        if (periodInfo.period === 'all') {
            if (elTotalNet) elTotalNet.textContent = `₱${allTimeIncomeStats.totalNet.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (elCompletedCount) elCompletedCount.textContent = allTimeIncomeStats.completedCount;
            if (elNetDesc) elNetDesc.textContent = 'Total net earnings from all confirmed & completed bookings';
            if (elCompletedDesc) elCompletedDesc.textContent = 'Total reservations successfully serviced & completed';
        } else {
            if (elTotalNet) elTotalNet.textContent = `₱${periodIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (elCompletedCount) elCompletedCount.textContent = periodCompleted;
            if (elNetDesc) elNetDesc.textContent = `Net earnings for ${periodInfo.label}`;
            if (elCompletedDesc) elCompletedDesc.textContent = `Completed reservations in ${periodInfo.label}`;
        }

        if (filtered.length === 0) {
            const searchInput = document.getElementById('input-income-ledger-search');
            const q = searchInput ? searchInput.value.trim() : '';
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:36px; color:#64748b; font-size:0.95rem;">No booking revenue records found for ${periodInfo.label}${q ? ` matching "${q}"` : ''}.</td></tr>`;
            return;
        }

        tableBody.innerHTML = filtered.map(b => {
            const bRef = b.BookingReference || `#BK-${b.BookingID}`;
            const clientName = b.ClientName || 'Client Account';
            const pkgName = b.PackageName || b.EventName || 'Event Service Package';
            const eventDate = formatEventDisplayDate(b.ServiceStartDate || b.EventDate);

            const gross = parseFloat(b.TotalAmount || 0);
            const paid = (b.AmountPaid != null && !isNaN(b.AmountPaid)) ? parseFloat(b.AmountPaid) : 0;
            const commRate = parseFloat(b.CommissionRate || 5) / 100;
            const netEarnings = parseFloat((paid > 0 ? paid * (1 - commRate) : 0).toFixed(2));
            const fullNetExpected = parseFloat((gross * (1 - commRate)).toFixed(2));

            const paymentInfo = typeof getBookingPaymentInfo === 'function' ? getBookingPaymentInfo(b) : null;
            const isPartial = paymentInfo ? paymentInfo.isPartial : (paid > 0 && paid < gross);
            const rawRemBal = (paymentInfo && paymentInfo.remBal != null) ? paymentInfo.remBal : Math.max(0, gross - paid);
            const remBal = (isNaN(parseFloat(rawRemBal)) ? 0 : parseFloat(rawRemBal));

            let paymentBadge = '';
            if (paid <= 0) {
                paymentBadge = `<span class="status-badge" style="background:#fef2f2; color:#ef4444; border:1px solid #fee2e2; font-size:0.75rem;"><i class="fa-solid fa-circle-xmark"></i> Unpaid</span>`;
            } else if (isPartial) {
                paymentBadge = `<span class="status-badge" style="background:#fffbeb; color:#d97706; border:1px solid #fef3c7; font-size:0.75rem;"><i class="fa-solid fa-circle-half-stroke"></i> Partial<br><small style="font-size:0.7rem; color:#b45309;">Bal: ₱${remBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</small></span>`;
            } else {
                paymentBadge = `<span class="status-badge" style="background:#ecfdf5; color:#059669; border:1px solid #d1fae5; font-size:0.75rem;"><i class="fa-solid fa-circle-check"></i> Paid Full</span>`;
            }

            const bStatus = b.BookingStatus || 'Pending';
            const bStatusLower = bStatus.toLowerCase();
            let bStatusBadge = `<span class="status-badge status-${bStatusLower}">${bStatus}</span>`;

            return `
                <tr style="border-bottom:1px solid #f1f5f9;">
                    <td style="padding:14px 18px;">
                        <strong style="color:#0a192f; font-size:0.88rem; font-family:monospace;">${bRef}</strong>
                        <div style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">#BK-${b.BookingID}</div>
                    </td>
                    <td style="padding:14px 18px;">
                        <div style="font-weight:700; color:#0a192f; font-size:0.9rem;">${clientName}</div>
                        <div style="font-size:0.78rem; color:#2563eb; font-weight:600; margin-top:2px;">${pkgName}</div>
                    </td>
                    <td style="padding:14px 18px;">
                        <span style="font-size:0.85rem; color:#475569; font-weight:600;"><i class="fa-regular fa-calendar" style="color:#94a3b8; margin-right:4px;"></i>${eventDate}</span>
                    </td>
                    <td style="padding:14px 18px; text-align:right;">
                        <span style="font-weight:700; color:#0a192f; font-size:0.9rem;">₱${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td style="padding:14px 18px; text-align:right;">
                        <span style="font-weight:800; color:#10b981; font-size:0.92rem;">₱${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td style="padding:14px 18px; text-align:right;">
                        <strong style="font-weight:800; color:#059669; font-size:0.95rem;">₱${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                        ${isPartial ? `<div style="font-size:0.72rem; color:#64748b; margin-top:1px;" title="Total contract net upon full completion">Expected: ₱${fullNetExpected.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>` : ''}
                    </td>
                    <td style="padding:14px 18px; text-align:center;">
                        ${paymentBadge}
                    </td>
                    <td style="padding:14px 18px; text-align:center;">
                        ${bStatusBadge}
                    </td>
                </tr>
            `;
        }).join('');
    };

    const loadProviderIncomeReport = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const [statsRes, wRes] = await Promise.all([
                fetch('/api/providers/dashboard-stats', { headers }).catch(e => null),
                fetch('/api/providers/withdrawals/list', { headers }).catch(e => null)
            ]);

            let totalContractEarnings = 0;
            let totalCollectedEarnings = 0;
            let totalCommissionFee = 0;
            let validBookings = [];

            if (statsRes && statsRes.ok) {
                const sData = await statsRes.json();
                if (sData.success && sData.stats) {
                    const allBookings = sData.stats.allBookings || [];
                    validBookings = allBookings.filter(b => {
                        const st = (b.BookingStatus || '').toLowerCase();
                        const pSt = (b.PaymentStatus || '').toLowerCase();
                        return st !== 'cancelled' && st !== 'rejected' && pSt !== 'refunded';
                    });

                    validBookings.forEach(b => {
                        const tot = parseFloat(b.TotalAmount || 0);
                        const paid = (b.AmountPaid != null && !isNaN(b.AmountPaid)) ? parseFloat(b.AmountPaid) : 0;
                        const commRate = parseFloat(b.CommissionRate || 5) / 100;
                        const isFull = (b.PaymentStatus === 'Paid' || b.BookingStatus === 'Completed');

                        const cNet = tot * (1 - commRate);
                        const colNet = (isFull ? tot : paid) * (1 - commRate);
                        const fee = (isFull ? tot : paid) * commRate;

                        totalContractEarnings += cNet;
                        totalCollectedEarnings += colNet;
                        totalCommissionFee += fee;
                    });
                }
            }

            let withdrawals = [];
            let availableWalletBalance = 0;
            let totalWithdrawn = 0;
            if (wRes && wRes.ok) {
                const wData = await wRes.json();
                if (wData.success) {
                    withdrawals = wData.withdrawals || [];
                    availableWalletBalance = parseFloat(wData.availableBalance || 0);
                    totalWithdrawn = parseFloat(wData.totalWithdrawn != null ? wData.totalWithdrawn : (
                        withdrawals
                            .filter(w => (w.Status || '').toLowerCase() === 'approved' || (w.Status || '').toLowerCase() === 'completed')
                            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0)
                    ));
                }
            }

            // Store All-Time KPI stats
            const completedBookingsCount = validBookings.filter(b => (b.BookingStatus || '').toLowerCase() === 'completed').length;
            allTimeIncomeStats = {
                totalNet: totalContractEarnings,
                completedCount: completedBookingsCount
            };

            const elTotalNet = document.getElementById('inc-stat-total-net');
            const elCompletedCount = document.getElementById('inc-stat-completed-count');
            const elWithdrawn = document.getElementById('inc-stat-withdrawn');

            if (elTotalNet) elTotalNet.textContent = `₱${totalContractEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (elCompletedCount) elCompletedCount.textContent = completedBookingsCount;
            if (elWithdrawn) elWithdrawn.textContent = `₱${totalWithdrawn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

            // Populate Years & Initialize Month Picker
            currentIncomeBookings = validBookings;
            populateIncomeYears();

            const monthInput = document.getElementById('input-income-month');
            if (monthInput && !monthInput.value) {
                const now = new Date();
                monthInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            }

            renderIncomeBookingsTable();
        } catch (err) {
            console.error('Error loading provider income report:', err);
        }
    };

    const searchIncomeInput = document.getElementById('input-income-ledger-search');
    if (searchIncomeInput) {
        searchIncomeInput.addEventListener('input', (e) => {
            renderIncomeBookingsTable(e.target.value);
        });
    }

    const selectIncomePeriod = document.getElementById('select-income-period');
    const filterCtrlMonthly = document.getElementById('filter-ctrl-income-monthly');
    const filterCtrlYearly = document.getElementById('filter-ctrl-income-yearly');
    const inputIncomeMonth = document.getElementById('input-income-month');
    const selectIncomeYear = document.getElementById('select-income-year');

    if (selectIncomePeriod) {
        selectIncomePeriod.addEventListener('change', () => {
            const val = selectIncomePeriod.value;
            if (filterCtrlMonthly) filterCtrlMonthly.style.display = (val === 'monthly' ? 'flex' : 'none');
            if (filterCtrlYearly) filterCtrlYearly.style.display = (val === 'yearly' ? 'flex' : 'none');
            renderIncomeBookingsTable();
        });
    }

    if (inputIncomeMonth) {
        inputIncomeMonth.addEventListener('change', () => {
            renderIncomeBookingsTable();
        });
    }

    if (selectIncomeYear) {
        selectIncomeYear.addEventListener('change', () => {
            renderIncomeBookingsTable();
        });
    }

    const btnRefreshIncome = document.getElementById('btn-refresh-income-report');
    if (btnRefreshIncome) {
        btnRefreshIncome.addEventListener('click', async () => {
            const icon = btnRefreshIncome.querySelector('i');
            if (icon) icon.classList.add('fa-spin');
            await loadProviderIncomeReport();
            if (icon) icon.classList.remove('fa-spin');
            if (typeof showToast === 'function') showToast('✓ Income Report refreshed!', 'success');
        });
    }

    // ------------------------------------------------------------------------
    // Export Income Report to Excel (.csv) & PDF (Supports All Time, Monthly, Yearly)
    // ------------------------------------------------------------------------
    const exportIncomeToExcel = () => {
        const periodInfo = getActiveIncomePeriodInfo();
        const listToExport = getFilteredIncomeBookings();

        if (!listToExport || listToExport.length === 0) {
            showToast(`No booking income records to export for ${periodInfo.label}.`, 'error');
            return;
        }

        let printedByName = '';
        if (currentProviderProfile) {
            printedByName = currentProviderProfile.ownerName || currentProviderProfile.businessName || '';
            if (currentProviderProfile.ownerName && currentProviderProfile.businessName && currentProviderProfile.ownerName !== currentProviderProfile.businessName) {
                printedByName = `${currentProviderProfile.ownerName} (${currentProviderProfile.businessName})`;
            }
        }
        if (!printedByName && user) {
            printedByName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.Email || '';
        }
        if (!printedByName) printedByName = 'Service Provider';

        const printDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        const escapeCsv = (str) => {
            const s = String(str ?? '');
            if (s.includes(',') || s.includes('"') || s.includes('\n')) {
                return `"${s.replace(/"/g, '""')}"`;
            }
            return s;
        };

        let totalIncome = 0;
        const dataRows = listToExport.map(b => {
            const bRef = b.BookingReference || `#BK-${b.BookingID}`;
            const paid = (b.AmountPaid != null && !isNaN(b.AmountPaid)) ? parseFloat(b.AmountPaid) : 0;
            const commRate = parseFloat(b.CommissionRate || 5) / 100;
            const netEarnings = parseFloat((paid > 0 ? paid * (1 - commRate) : 0).toFixed(2));
            totalIncome += netEarnings;
            return [escapeCsv(bRef), netEarnings.toFixed(2)];
        });

        const csvRows = [
            ['SOUNDSPHERE - PROVIDER INCOME REPORT'],
            ['Period:', escapeCsv(periodInfo.label)],
            ['Printed By:', escapeCsv(printedByName)],
            ['Date:', escapeCsv(printDate)],
            [],
            ['Booking Reference', 'Provider Income (PHP)'],
            ...dataRows,
            ['Total', totalIncome.toFixed(2)]
        ];

        const csvString = '\uFEFF' + csvRows.map(r => r.join(',')).join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Provider_Income_Report_${periodInfo.slug}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`✓ Income Report (${periodInfo.label}) exported to Excel (.csv) successfully!`, 'success');
    };

    const exportIncomeToPDF = () => {
        const periodInfo = getActiveIncomePeriodInfo();
        const listToExport = getFilteredIncomeBookings();

        if (!listToExport || listToExport.length === 0) {
            showToast(`No booking income records to print or export for ${periodInfo.label}.`, 'error');
            return;
        }

        let printedByName = '';
        let businessName = '';
        if (currentProviderProfile) {
            businessName = currentProviderProfile.businessName || '';
            printedByName = currentProviderProfile.ownerName || currentProviderProfile.businessName || '';
            if (currentProviderProfile.ownerName && currentProviderProfile.businessName && currentProviderProfile.ownerName !== currentProviderProfile.businessName) {
                printedByName = `${currentProviderProfile.ownerName} (${currentProviderProfile.businessName})`;
            }
        }
        if (!printedByName && user) {
            printedByName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.Email || '';
        }
        if (!printedByName) printedByName = 'Service Provider';

        const printDate = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });

        let totalGross = 0;
        let totalPaid = 0;
        let totalIncome = 0;
        let completedCount = 0;

        const tableRowsHtml = listToExport.map(b => {
            const bRef = b.BookingReference || `#BK-${b.BookingID}`;
            const clientName = b.ClientName || 'Client Account';
            const pkgName = b.PackageName || b.EventName || 'Event Service Package';
            const eventDate = typeof formatEventDisplayDate === 'function' ? formatEventDisplayDate(b.ServiceStartDate || b.EventDate) : (b.ServiceStartDate || b.EventDate || '-');

            const gross = parseFloat(b.TotalAmount || 0);
            const paid = (b.AmountPaid != null && !isNaN(b.AmountPaid)) ? parseFloat(b.AmountPaid) : 0;
            const commRate = parseFloat(b.CommissionRate || 5) / 100;
            const netEarnings = parseFloat((paid > 0 ? paid * (1 - commRate) : 0).toFixed(2));

            totalGross += gross;
            totalPaid += paid;
            totalIncome += netEarnings;
            if ((b.BookingStatus || '').toLowerCase() === 'completed') completedCount++;

            const status = b.BookingStatus || 'Confirmed';

            return `
                <tr>
                    <td style="padding:8px 10px; font-weight:700; font-family:monospace; border-bottom:1px solid #e2e8f0;">${bRef}</td>
                    <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0;">
                        <strong>${clientName}</strong><br>
                        <span style="font-size:8pt; color:#2563eb;">${pkgName}</span>
                    </td>
                    <td style="padding:8px 10px; border-bottom:1px solid #e2e8f0; font-size:8.5pt;">${eventDate}</td>
                    <td style="padding:8px 10px; text-align:right; border-bottom:1px solid #e2e8f0;">₱${gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style="padding:8px 10px; text-align:right; border-bottom:1px solid #e2e8f0;">₱${paid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style="padding:8px 10px; text-align:right; font-weight:800; color:#059669; border-bottom:1px solid #e2e8f0;">₱${netEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td style="padding:8px 10px; text-align:center; border-bottom:1px solid #e2e8f0; font-size:8.5pt;">${status}</td>
                </tr>
            `;
        }).join('');

        const printableHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>SoundSphere - Provider Income Report (${periodInfo.label})</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 12mm 15mm;
        }
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0a192f;
            background: #ffffff;
            margin: 0;
            padding: 15px;
            font-size: 9pt;
            line-height: 1.4;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0a192f;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .brand {
            font-size: 16pt;
            font-weight: 900;
            letter-spacing: 0.5px;
            color: #0a192f;
        }
        .subbrand {
            font-size: 8.5pt;
            color: #64748b;
            font-weight: 600;
        }
        .meta-box {
            text-align: right;
            font-size: 8.5pt;
            color: #334155;
            line-height: 1.5;
        }
        .report-title {
            font-size: 13pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0a192f;
            margin: 12px 0 4px 0;
        }
        .report-subtitle {
            font-size: 9pt;
            font-weight: 600;
            color: #2563eb;
            margin-bottom: 14px;
        }
        .kpi-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px;
            margin-bottom: 18px;
        }
        .kpi-card {
            border: 1px solid #cbd5e1;
            background: #f8fafc;
            border-radius: 6px;
            padding: 10px 14px;
        }
        .kpi-label {
            font-size: 7.5pt;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .kpi-value {
            font-size: 13pt;
            font-weight: 800;
            color: #0a192f;
            margin-top: 3px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background: #f1f5f9;
            color: #334155;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 8px 10px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
        }
        th.text-right { text-align: right; }
        th.text-center { text-align: center; }
        .total-row td {
            background: #f8fafc;
            border-top: 2px solid #0a192f;
            border-bottom: 2px solid #0a192f;
            font-weight: 800;
            padding: 10px;
        }
        .footer-sig {
            margin-top: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            page-break-inside: avoid;
        }
        .sig-block {
            width: 240px;
            border-top: 1px solid #94a3b8;
            padding-top: 6px;
            text-align: center;
            font-size: 8.5pt;
        }
        @media print {
            body { padding: 0; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="brand">SOUNDSPHERE</div>
            <div class="subbrand">Lights & Sounds Service Provider Platform</div>
            ${businessName ? `<div style="font-size:9.5pt; font-weight:700; color:#2563eb; margin-top:4px;">${businessName}</div>` : ''}
        </div>
        <div class="meta-box">
            <div><strong>Period:</strong> ${periodInfo.label}</div>
            <div><strong>Printed By:</strong> ${printedByName}</div>
            <div><strong>Date & Time:</strong> ${printDate}</div>
            <div><strong>Total Records:</strong> ${listToExport.length} Bookings</div>
        </div>
    </div>

    <div class="report-title">Provider Income Statement & Earnings Report</div>
    <div class="report-subtitle">Official verified financial breakdown • Financial Period: ${periodInfo.label}</div>

    <div class="kpi-grid">
        <div class="kpi-card" style="border-left: 4px solid #10b981;">
            <div class="kpi-label">Provider Income (${periodInfo.label})</div>
            <div class="kpi-value" style="color:#059669;">₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #2563eb;">
            <div class="kpi-label">Completed Bookings</div>
            <div class="kpi-value" style="color:#2563eb;">${completedCount}</div>
        </div>
        <div class="kpi-card" style="border-left: 4px solid #7c3aed;">
            <div class="kpi-label">Total Amount Paid by Clients</div>
            <div class="kpi-value" style="color:#7c3aed;">₱${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Booking Ref</th>
                <th>Client & Event</th>
                <th>Event Date</th>
                <th class="text-right">Gross Amount</th>
                <th class="text-right">Amount Paid</th>
                <th class="text-right">Provider Income</th>
                <th class="text-center">Status</th>
            </tr>
        </thead>
        <tbody>
            ${tableRowsHtml}
        </tbody>
        <tfoot>
            <tr class="total-row">
                <td colspan="5" style="text-align:right; font-size:9pt; text-transform:uppercase; letter-spacing:0.5px;">Total Provider Income (${periodInfo.label}):</td>
                <td style="text-align:right; font-size:10.5pt; font-weight:900; color:#059669;">₱${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>

    <div class="footer-sig">
        <div>
            <div style="font-size:7.5pt; color:#94a3b8; text-transform:uppercase;">System Verification</div>
            <div style="font-size:8pt; color:#64748b; margin-top:2px;">Generated via SoundSphere Provider Portal • ${periodInfo.label}</div>
        </div>
        <div>
            <div class="sig-block">
                <strong>${printedByName}</strong><br>
                <span style="font-size:7.5pt; color:#64748b;">Printed By / Authorized Provider</span>
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

        showToast(`✓ Opening print dialog for ${periodInfo.label} — select "Save as PDF" to download PDF.`, 'info');
    };

    const btnExportExcel = document.getElementById('btn-export-income-excel');
    if (btnExportExcel) {
        btnExportExcel.addEventListener('click', exportIncomeToExcel);
    }

    const btnExportPDF = document.getElementById('btn-export-income-pdf');
    if (btnExportPDF) {
        btnExportPDF.addEventListener('click', exportIncomeToPDF);
    }

    // ------------------------------------------------------------------------
    // Booking & Wallet Withdrawal Request Modal Logic
    // ------------------------------------------------------------------------
    const formatCurrencyDisplay = (val) => {
        const num = parseFloat(val || 0);
        return isNaN(num) ? '0.00' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    window.openBookingWithdrawalModal = (bookingId, totalAmount, bookingRef) => {
        const modal = document.getElementById('modal-booking-withdrawal');
        if (!modal) return;

        const total = parseFloat(totalAmount || 0);
        const fee = total * 0.05;
        const net = total * 0.95;

        const titleEl = document.getElementById('bw-modal-title');
        const breakdownCard = document.getElementById('bw-booking-breakdown-card');
        const walletCard = document.getElementById('bw-wallet-amount-card');
        const idInput = document.getElementById('input-bw-booking-id');
        const netInput = document.getElementById('input-bw-net-amount');
        const amtInput = document.getElementById('input-bw-amount');
        const refDisplay = document.getElementById('bw-booking-ref');
        const totDisplay = document.getElementById('bw-total-amount');
        const feeDisplay = document.getElementById('bw-commission-amount');
        const netDisplay = document.getElementById('bw-net-display');

        if (titleEl) titleEl.textContent = `Request Cashier Payout (${bookingRef || '#' + bookingId})`;
        if (breakdownCard) breakdownCard.style.display = 'block';
        if (walletCard) walletCard.style.display = 'block';

        if (idInput) idInput.value = bookingId || '';
        if (netInput) netInput.value = net.toFixed(2);
        if (amtInput) {
            amtInput.value = net > 0 ? formatCurrencyDisplay(net) : '0.00';
            amtInput.removeAttribute('max');
        }
        if (refDisplay) refDisplay.textContent = bookingRef || `#BK-${bookingId}`;
        if (totDisplay) totDisplay.textContent = `₱${formatCurrencyDisplay(total)}`;
        if (feeDisplay) feeDisplay.textContent = `-₱${formatCurrencyDisplay(fee)}`;
        if (netDisplay) netDisplay.textContent = `₱${formatCurrencyDisplay(net)}`;

        updatePayoutMethodFields();
        modal.classList.remove('hidden');
    };

    window.openWalletWithdrawalModal = async () => {
        const modal = document.getElementById('modal-booking-withdrawal');
        if (!modal) return;

        let avail = parseFloat(window.currentWalletAvailableBalance || 0);
        const titleEl = document.getElementById('bw-modal-title');
        const breakdownCard = document.getElementById('bw-booking-breakdown-card');
        const walletCard = document.getElementById('bw-wallet-amount-card');
        const idInput = document.getElementById('input-bw-booking-id');
        const netInput = document.getElementById('input-bw-net-amount');
        const amtInput = document.getElementById('input-bw-amount');
        const walletDisp = document.getElementById('bw-available-wallet-display');

        if (titleEl) titleEl.textContent = 'Request Cashier Payout (My Wallet)';
        if (breakdownCard) breakdownCard.style.display = 'none';
        if (walletCard) walletCard.style.display = 'block';

        if (idInput) idInput.value = '';
        if (netInput) netInput.value = avail.toFixed(2);
        if (amtInput) {
            amtInput.value = avail > 0 ? formatCurrencyDisplay(avail) : '0.00';
        }
        if (walletDisp) walletDisp.textContent = `₱${formatCurrencyDisplay(avail)}`;

        updatePayoutMethodFields();
        modal.classList.remove('hidden');

        // Fetch fresh balance to guarantee 100% real-time accuracy
        if (typeof loadWalletData === 'function') {
            await loadWalletData();
            const freshAvail = parseFloat(window.currentWalletAvailableBalance || 0);
            if (amtInput) {
                amtInput.value = freshAvail > 0 ? formatCurrencyDisplay(freshAvail) : '0.00';
            }
            if (netInput) netInput.value = freshAvail.toFixed(2);
            if (walletDisp) walletDisp.textContent = `₱${formatCurrencyDisplay(freshAvail)}`;
        }
    };

    window.triggerRequestWithdrawFromBooking = window.openBookingWithdrawalModal;

    const updatePayoutMethodFields = () => {
        const methodSelect = document.getElementById('input-bw-method');
        const labelRef = document.getElementById('label-bw-account-ref');
        const inputRef = document.getElementById('input-bw-account-ref');
        if (!methodSelect || !labelRef || !inputRef) return;

        const method = (methodSelect.value || '').toUpperCase();
        if (method === 'GCASH' || method === 'MAYA') {
            labelRef.innerHTML = `MOBILE NUMBER <span style="color:#ef4444;">*</span>`;
            inputRef.placeholder = 'e.g. 09516028992';
        } else {
            // BPI, BDO, PNB
            labelRef.innerHTML = `ACCOUNT NUMBER <span style="color:#ef4444;">*</span>`;
            inputRef.placeholder = 'e.g. 10 or 12-digit Account Number';
        }
    };

    document.getElementById('input-bw-method')?.addEventListener('change', updatePayoutMethodFields);

    const amtInputEl = document.getElementById('input-bw-amount');
    if (amtInputEl) {
        amtInputEl.addEventListener('input', () => {
            let val = amtInputEl.value.replace(/[^\d.,]/g, '');
            const parts = val.split('.');
            if (parts.length > 2) {
                val = parts[0] + '.' + parts.slice(1).join('');
            }
            amtInputEl.value = val;
        });

        amtInputEl.addEventListener('blur', () => {
            const clean = amtInputEl.value.replace(/,/g, '').replace(/[^\d.]/g, '').trim();
            const num = parseFloat(clean);
            if (!isNaN(num) && num >= 0) {
                amtInputEl.value = formatCurrencyDisplay(num);
            }
        });
    }

    document.getElementById('btn-close-booking-withdrawal')?.addEventListener('click', () => {
        document.getElementById('modal-booking-withdrawal')?.classList.add('hidden');
    });
    document.getElementById('btn-cancel-booking-withdrawal')?.addEventListener('click', () => {
        document.getElementById('modal-booking-withdrawal')?.classList.add('hidden');
    });

    const formBookingWithdrawal = document.getElementById('form-booking-withdrawal');
    if (formBookingWithdrawal) {
        formBookingWithdrawal.addEventListener('submit', async (e) => {
            e.preventDefault();
            const bookingId = document.getElementById('input-bw-booking-id')?.value;
            const customAmountStr = document.getElementById('input-bw-amount')?.value;
            const netAmount = document.getElementById('input-bw-net-amount')?.value;

            // Sanitize formatted amount (e.g. "21,496.60" -> 21496.60)
            const cleanCustom = customAmountStr ? customAmountStr.replace(/,/g, '').replace(/PHP/gi, '').replace(/[^\d.]/g, '').trim() : '';
            const amount = cleanCustom ? parseFloat(cleanCustom) : parseFloat(netAmount || 0);

            const payoutMethod = document.getElementById('input-bw-method')?.value;
            const accountName = document.getElementById('input-bw-account-name')?.value?.trim();
            const accountReference = document.getElementById('input-bw-account-ref')?.value?.trim();

            if (!amount || isNaN(amount) || amount <= 0) {
                alert('Please enter a valid withdrawal amount.');
                return;
            }

            const availBalance = parseFloat(window.currentWalletAvailableBalance || 0);
            if (!bookingId && availBalance > 0 && amount > (availBalance + 0.05)) {
                alert(`The requested amount (PHP ${formatCurrencyDisplay(amount)}) exceeds your available wallet balance of PHP ${formatCurrencyDisplay(availBalance)}.`);
                return;
            }

            if (!accountReference) {
                const method = (payoutMethod || '').toUpperCase();
                const isMobile = (method === 'GCASH' || method === 'MAYA');
                alert(`Please enter your ${isMobile ? 'mobile number' : 'account number'}.`);
                return;
            }

            const submitBtn = document.getElementById('btn-submit-booking-withdrawal');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Submitting to Cashier...`;
            }

            try {
                const authToken = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token') || localStorage.getItem('soundsphere_auth_token'));
                const headers = { 'Content-Type': 'application/json' };
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                const res = await fetch('/api/providers/withdrawals/create', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        bookingId: bookingId || null,
                        amount,
                        payoutMethod,
                        accountName,
                        accountReference
                    })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    if (typeof showToast === 'function') {
                        showToast(data.message || '🎉 Withdrawal request routed to Cashier for disbursement!', 'success');
                    } else {
                        alert(data.message || '🎉 Withdrawal request submitted successfully! It has been routed to the Cashier for verified disbursement.');
                    }
                    document.getElementById('modal-booking-withdrawal')?.classList.add('hidden');
                    formBookingWithdrawal.reset();
                    if (typeof loadWalletData === 'function') {
                        await loadWalletData();
                    }
                    if (typeof loadDashboardData === 'function') {
                        await loadDashboardData();
                    }
                } else {
                    alert(data.message || 'Failed to submit withdrawal request.');
                }
            } catch (err) {
                console.error('Withdrawal error:', err);
                alert('An error occurred while submitting the withdrawal request.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Submit Request to Cashier`;
                }
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
            const res = await fetch('/api/providers/dashboard-stats', { headers });

            if (res.ok) {
                const data = await res.json();
                if (data.success && data.stats) {
                    const s = data.stats;

                    const statUpcomingBookings = document.getElementById('stat-upcoming-bookings');
                    const statTodaysEvents = document.getElementById('stat-todays-events');
                    const statWalletBalance = document.getElementById('stat-wallet-balance');
                    const statEscrowBalance = document.getElementById('stat-escrow-balance');

                    if (statUpcomingBookings) statUpcomingBookings.textContent = s.upcomingBookingsCount != null ? s.upcomingBookingsCount : 0;
                    if (statTodaysEvents) statTodaysEvents.textContent = s.todaysEventsCount != null ? s.todaysEventsCount : 0;
                    if (statWalletBalance) statWalletBalance.textContent = `₱${parseFloat(s.availableBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                    if (statEscrowBalance) statEscrowBalance.textContent = `₱${parseFloat(s.heldInEscrow || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

                    if (statUpcomingBookings) statUpcomingBookings.textContent = s.upcomingBookingsCount != null ? s.upcomingBookingsCount : 0;
                    if (statTodaysEvents) statTodaysEvents.textContent = s.todaysEventsCount != null ? s.todaysEventsCount : 0;

                    // Filter out any unpaid pending bookings
                    const isPaidBooking = (b) => {
                        const st = (b.BookingStatus || '').toLowerCase();
                        const pSt = (b.PaymentStatus || '').toLowerCase();
                        const paid = parseFloat(b.AmountPaid || 0);
                        return st !== 'pending' && pSt !== 'pending' && paid > 0;
                    };

                    // Render Upcoming Event Reservations Table (include Today's events + future upcoming)
                    const combinedReservations = [];
                    const seenBookingIds = new Set();
                    (s.todaysEvents || []).forEach(b => {
                        if (b && b.BookingID && !seenBookingIds.has(b.BookingID)) {
                            seenBookingIds.add(b.BookingID);
                            combinedReservations.push(b);
                        }
                    });
                    (s.upcomingBookings || []).forEach(b => {
                        if (b && b.BookingID && !seenBookingIds.has(b.BookingID)) {
                            seenBookingIds.add(b.BookingID);
                            combinedReservations.push(b);
                        }
                    });
                    // Sort chronologically (earliest first)
                    combinedReservations.sort((a, b) => {
                        const dateA = new Date(a.ServiceStartDate || a.EventDate || 0).getTime();
                        const dateB = new Date(b.ServiceStartDate || b.EventDate || 0).getTime();
                        return dateA - dateB;
                    });

                    renderUpcomingReservations(combinedReservations.filter(isPaidBooking));
                    renderBookingsTable((s.allBookings || []).filter(isPaidBooking));
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

    window.loadDashboardData = loadDashboardData;

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
                if (data && data.isPermitExpired) {
                    alert(`⚠️ Booking Acceptance Blocked\n\n${data.message || 'Your municipal business permit has expired. You cannot accept new bookings until your business permit renewal is approved by the administrator.'}\n\nPlease submit your renewed business permit in the Permit Compliance section.`);
                    if (typeof window.openUploadPermitModal === 'function') {
                        window.openUploadPermitModal();
                    }
                } else {
                    if (typeof showToast === 'function') showToast(data.message || 'Failed to accept booking.', 'error');
                }
            }
        } catch (err) {
            console.error('Error accepting booking:', err);
        }
    };

    window.completeProviderBooking = async (bookingId) => {
        if (!confirm(`Mark booking #${bookingId} as COMPLETED?\n\nOnce submitted, the client will be notified to confirm and accept within 24 hours. If not accepted within 1 day, it will be automatically accepted, unlocking your withdrawal payout to the Cashier.`)) return;
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
                if (typeof showToast === 'function') showToast(data.message || `✓ Completion request sent to client!`, 'success');
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

    let currentLoadedBookings = [];
    let pbdLeafletMap = null;
    let pbdLeafletMarker = null;

    // Helper to format date cleanly as "Oct 17, 2026"
    const formatEventDisplayDate = (dStr) => {
        if (!dStr || dStr === 'Scheduled') return 'Scheduled';
        try {
            const cleanStr = String(dStr).split('T')[0];
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) {
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }
            }
            const d = new Date(dStr);
            if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            return dStr;
        } catch (e) {
            return dStr;
        }
    };

    // Helper to determine if an event date is today
    const isEventToday = (dStr) => {
        if (!dStr || dStr === 'Scheduled') return false;
        try {
            const cleanStr = String(dStr).split('T')[0];
            const parts = cleanStr.split('-');
            let eventDate;
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                eventDate = new Date(year, month, day);
            } else {
                eventDate = new Date(dStr);
            }
            if (isNaN(eventDate.getTime())) return false;
            const now = new Date();
            return eventDate.getFullYear() === now.getFullYear() &&
                   eventDate.getMonth() === now.getMonth() &&
                   eventDate.getDate() === now.getDate();
        } catch (e) {
            return false;
        }
    };

    // Helper to determine if today is the day of services or later
    const isEventServiceDayOrPast = (dStr) => {
        if (!dStr || dStr === 'Scheduled') return true;
        try {
            const cleanStr = String(dStr).split('T')[0];
            const parts = cleanStr.split('-');
            let eventDate;
            if (parts.length === 3) {
                const year = parseInt(parts[0], 10);
                const month = parseInt(parts[1], 10) - 1;
                const day = parseInt(parts[2], 10);
                eventDate = new Date(year, month, day);
            } else {
                eventDate = new Date(dStr);
            }
            if (isNaN(eventDate.getTime())) return true;
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const eventStart = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();
            return todayStart >= eventStart;
        } catch (e) {
            return true;
        }
    };

    // Helper to evaluate paid amount, remaining balance, and identify Partial vs Full payment
    const getBookingPaymentInfo = (b) => {
        const totalAmt = parseFloat(b.TotalAmount || 0);
        const amtPaid = (b.AmountPaid != null && !isNaN(b.AmountPaid)) ? parseFloat(b.AmountPaid) : 0;
        const statusLower = String(b.BookingStatus || '').toLowerCase();
        const isCancelled = (statusLower === 'cancelled' || statusLower === 'rejected');

        const payStatus = String(b.PaymentStatus || '').toLowerCase();
        const payType = String(b.PaymentType || '').toLowerCase();

        // The unpaid portion based on the package total and amount paid
        const unpaidPortion = Math.max(0, totalAmt - amtPaid);

        // For cancelled bookings, the DB sets RemainingBalance = 0 upon cancellation/refund,
        // but the original balance was unpaidPortion.
        const remBal = (isCancelled && unpaidPortion > 0)
            ? unpaidPortion
            : ((b.RemainingBalance != null && !isNaN(b.RemainingBalance)) 
                ? parseFloat(b.RemainingBalance) 
                : unpaidPortion);

        // A booking is genuinely a Partial Payment if:
        // 1. It was booked as downpayment/partial and total amount was not fully settled (amtPaid < totalAmt - 0.01)
        // 2. OR the amount paid is greater than 0 but less than the total booking amount (e.g., 750 paid out of 1500)
        // 3. OR there is an active remaining balance
        const isPartial = (
            (payType === 'downpayment' || payType === 'partial' || payStatus === 'partial') && (totalAmt <= 0 || amtPaid < (totalAmt - 0.01))
        ) || (
            amtPaid > 0 && totalAmt > 0 && amtPaid < (totalAmt - 0.01)
        ) || (
            amtPaid > 0 && remBal > 0 && !isCancelled
        );

        // Check if fully paid (ONLY if not partial, and paid covers total or type is explicitly full)
        const isFull = !isPartial && (
            (totalAmt > 0 && amtPaid >= (totalAmt - 0.01)) ||
            (payType === 'full' && (amtPaid > 0 || remBal <= 0)) ||
            (payStatus === 'paid' && remBal <= 0 && amtPaid > 0)
        );

        let badgeText = 'Unpaid';
        let badgeColor = '#64748b';
        let badgeBg = '#f1f5f9';
        let badgeBorder = '#cbd5e1';
        let badgeIcon = 'fa-circle-exclamation';

        if (isFull) {
            badgeText = 'Full Payment';
            badgeColor = '#059669';
            badgeBg = '#ecfdf5';
            badgeBorder = '#a7f3d0';
            badgeIcon = 'fa-circle-check';
        } else if (isPartial) {
            badgeText = 'Partial Payment';
            badgeColor = '#d97706';
            badgeBg = '#fef3c7';
            badgeBorder = '#fde68a';
            badgeIcon = 'fa-clock-rotate-left';
        }

        const badgeHtml = `
            <span style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; font-weight:800; color:${badgeColor}; background:${badgeBg}; border:1px solid ${badgeBorder}; padding:2px 8px; border-radius:12px; text-transform:uppercase; letter-spacing:0.3px; white-space:nowrap;">
                <i class="fa-solid ${badgeIcon}" style="font-size:0.7rem;"></i> ${badgeText}
            </span>
        `;

        return {
            totalAmt,
            amtPaid,
            remBal,
            isFull,
            isPartial,
            badgeText,
            badgeHtml
        };
    };

    // Render Upcoming Reservations
    const renderUpcomingReservations = (bookings) => {
        const tableBody = document.getElementById('table-upcoming-reservations');
        if (!tableBody) return;

        const paidBookings = (bookings || []).filter(b => {
            const st = (b.BookingStatus || '').toLowerCase();
            const pSt = (b.PaymentStatus || '').toLowerCase();
            const paid = parseFloat(b.AmountPaid || 0);
            return st !== 'pending' && pSt !== 'pending' && paid > 0;
        });

        if (!paidBookings || paidBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:24px; color:#64748b;">No upcoming events reserved.</td></tr>`;
            return;
        }

        tableBody.innerHTML = paidBookings.map(b => {
            const clientNameStr = b.ClientName || b.clientName || b.ClientEmail || 'Client Account';
            const packageNameStr = b.PackageName || b.packageName || b.EventName || 'Event Service Package';
            const dateStr = formatEventDisplayDate(b.ServiceStartDate || b.EventDate);
            const statusLower = (b.BookingStatus || 'Confirmed').toLowerCase();
            const payInfo = getBookingPaymentInfo(b);
            const isToday = isEventToday(b.ServiceStartDate || b.EventDate);

            return `
                <tr style="cursor:pointer; transition:background 0.2s ease;" onclick="window.openProviderBookingDetails(${b.BookingID})" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'" title="Click to view full reservation details">
                    <td><strong style="color:#0a192f; font-size:0.9rem;">${clientNameStr}</strong></td>
                    <td><strong style="color:#2563eb; font-size:0.88rem;">${packageNameStr}</strong></td>
                    <td style="white-space:nowrap;">
                        <span style="font-size:0.85rem; color:#334155; font-weight:600;">
                            ${dateStr}
                            ${isToday ? `<span style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; font-size:0.68rem; font-weight:800; padding:2px 7px; border-radius:10px; margin-left:6px; letter-spacing:0.4px;">TODAY</span>` : ''}
                        </span>
                    </td>
                    <td style="white-space:nowrap;">
                        <div style="display:flex; flex-direction:column; gap:1px; line-height:1.35;">
                            <strong style="font-size:0.95rem; color:#10b981; font-weight:800;">₱${payInfo.amtPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                            ${payInfo.isPartial ? `
                                <span style="font-size:0.76rem; color:#475569; font-weight:500;">Bal: ₱${payInfo.remBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <span style="font-size:0.74rem; color:#d97706; font-weight:600;">Partial Payment</span>
                            ` : (payInfo.isFull ? `
                                <span style="font-size:0.74rem; color:#16a34a; font-weight:600;">Full Payment</span>
                            ` : `
                                <span style="font-size:0.74rem; color:#64748b; font-weight:500;">Unpaid</span>
                            `)}
                        </div>
                    </td>
                    <td style="white-space:nowrap;"><span class="status-badge status-${statusLower}">${b.BookingStatus || 'Confirmed'}</span></td>
                </tr>
            `;
        }).join('');
    };

    // Render Full Bookings Table
    const renderBookingsTable = (bookings) => {
        const tableBody = document.getElementById('table-provider-bookings-list');
        if (!tableBody) return;

        const paidBookings = (bookings || []).filter(b => {
            const st = (b.BookingStatus || '').toLowerCase();
            const pSt = (b.PaymentStatus || '').toLowerCase();
            const paid = parseFloat(b.AmountPaid || 0);
            return st !== 'pending' && pSt !== 'pending' && paid > 0;
        });

        if (Array.isArray(paidBookings)) {
            currentLoadedBookings = paidBookings;
        }

        if (!paidBookings || paidBookings.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:36px; color:#64748b; font-size:1.02rem;">No bookings yet.</td></tr>`;
            return;
        }

        tableBody.innerHTML = paidBookings.map(b => {
            const clientNameStr = b.ClientName || b.clientName || b.ClientEmail || 'Client Account';
            const packageNameStr = b.PackageName || b.packageName || b.EventName || 'Event Service Package';
            const rawStartDate = b.ServiceStartDate || b.EventDate;
            const rawEndDate = b.ServiceEndDate || rawStartDate;
            const formattedStart = formatEventDisplayDate(rawStartDate);
            const formattedEnd = formatEventDisplayDate(rawEndDate);
            const dateDisplay = (formattedStart === formattedEnd || !rawEndDate) ? formattedStart : `${formattedStart} – ${formattedEnd}`;
            const locStr = b.Location || b.EventAddress || b.EventPlace || 'Batangas';
            const statusLower = (b.BookingStatus || 'Confirmed').toLowerCase();
            const payInfo = getBookingPaymentInfo(b);

            return `
                <tr id="booking-row-${b.BookingID}" data-booking-id="${b.BookingID}" style="transition:all 0.2s ease; cursor:pointer;" onclick="window.openProviderBookingDetails(${b.BookingID})" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='transparent'" title="Click row or ID to view full reservation details">
                    <td style="padding:18px 20px; white-space:nowrap;">
                        <span style="color:#2563eb; font-size:0.98rem; font-weight:800; background:#eff6ff; border:1px solid #bfdbfe; padding:5px 12px; border-radius:8px; display:inline-block; cursor:pointer;" title="Click to view full reservation details">
                            #BK-${b.BookingID}
                        </span>
                    </td>
                    <td style="padding:18px 20px;">
                        <strong style="color:#0a192f; font-size:0.98rem; font-weight:700; display:block;">${clientNameStr}</strong>
                        ${b.ClientPhone ? `<div style="font-size:0.82rem; color:#64748b; font-weight:500; margin-top:3px; white-space:nowrap;">${b.ClientPhone}</div>` : ''}
                    </td>
                    <td style="padding:18px 20px;"><strong style="color:#2563eb; font-size:0.98rem; font-weight:700;">${packageNameStr}</strong></td>
                    <td style="padding:18px 20px; white-space:nowrap;"><span style="font-size:0.92rem; color:#334155; font-weight:600;">${dateDisplay}</span></td>
                    <td style="padding:18px 20px;"><span style="font-size:0.92rem; color:#475569; font-weight:500;">${locStr}</span></td>
                    <td style="padding:18px 20px; white-space:nowrap;">
                        <div style="display:flex; flex-direction:column; gap:1px; line-height:1.35;">
                            <strong style="font-size:1.05rem; font-weight:800; color:#10b981;">₱${payInfo.amtPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                            ${payInfo.isPartial ? `
                                <span style="font-size:0.82rem; color:#475569; font-weight:500;">Bal: ₱${payInfo.remBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <span style="font-size:0.78rem; color:#d97706; font-weight:600;">Partial Payment</span>
                            ` : (payInfo.isFull ? `
                                <span style="font-size:0.78rem; color:#16a34a; font-weight:600;">Full Payment</span>
                            ` : `
                                <span style="font-size:0.78rem; color:#64748b; font-weight:500;">Unpaid</span>
                            `)}
                        </div>
                    </td>
                    <td style="padding:18px 20px; white-space:nowrap;"><span class="status-badge status-${statusLower}" style="font-size:0.86rem; padding:6px 14px; border-radius:20px; font-weight:700;">${b.BookingStatus || 'Confirmed'}</span></td>
                </tr>
            `;
        }).join('');
    };

    // Global Handler to Open Booking Details Modal
    window.openProviderBookingDetails = (bookingId) => {
        const booking = (currentLoadedBookings || []).find(b => Number(b.BookingID) === Number(bookingId));
        if (!booking) return;

        const fullscreenView = document.getElementById('view-booking-details-fullscreen') || document.getElementById('modal-provider-booking-details');
        if (!fullscreenView) return;

        // Set Ref & Status
        const refEl = document.getElementById('pbd-ref-id');
        if (refEl) refEl.textContent = `#BK-${booking.BookingID}`;

        const statusBadge = document.getElementById('pbd-status-badge');
        const statusLower = (booking.BookingStatus || 'confirmed').toLowerCase();
        if (statusBadge) {
            statusBadge.textContent = booking.BookingStatus || 'Confirmed';
            statusBadge.className = `status-badge status-${statusLower}`;
        }

        const createdEl = document.getElementById('pbd-created-at');
        if (createdEl) {
            const createdDate = booking.CreatedAt ? new Date(booking.CreatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            createdEl.innerHTML = `Placed on ${createdDate} &bull; Ref Code: <strong style="color:#2563eb;">${booking.BookingReference || ('SS-2026-000' + booking.BookingID)}</strong>`;
        }

        // Client Info
        const clientNameEl = document.getElementById('pbd-client-name');
        if (clientNameEl) clientNameEl.textContent = booking.ClientName || 'Client Account';

        const clientPhoneEl = document.getElementById('pbd-client-phone');
        if (clientPhoneEl) {
            clientPhoneEl.innerHTML = booking.ClientPhone 
                ? `<a href="tel:${booking.ClientPhone}" style="color:#2563eb; text-decoration:none; font-weight:700;">${booking.ClientPhone}</a>`
                : '<span style="color:#94a3b8;">Not provided</span>';
        }

        const clientEmailEl = document.getElementById('pbd-client-email');
        if (clientEmailEl) {
            clientEmailEl.innerHTML = booking.ClientEmail 
                ? `<a href="mailto:${booking.ClientEmail}" style="color:#475569; text-decoration:none;">${booking.ClientEmail}</a>`
                : '<span style="color:#94a3b8;">Not provided</span>';
        }

        // Chat Button Handler
        const chatBtn = document.getElementById('pbd-btn-chat-client');
        if (chatBtn) {
            chatBtn.onclick = () => {
                fullscreenView.classList.add('hidden');
                const messagesTab = document.querySelector('[data-view="view-provider-messages"]');
                if (messagesTab) messagesTab.click();
            };
        }

        // Service & Event
        const pkgNameEl = document.getElementById('pbd-package-name');
        if (pkgNameEl) pkgNameEl.textContent = booking.PackageName || 'Custom Event Service Package';

        const eventNameEl = document.getElementById('pbd-event-name');
        if (eventNameEl) eventNameEl.textContent = booking.EventName || `${booking.EventType || 'Event'} Celebration`;

        const eventDateEl = document.getElementById('pbd-event-date');
        if (eventDateEl) {
            const sDate = booking.ServiceStartDate || booking.EventDate;
            const eDate = booking.ServiceEndDate || sDate;
            const formattedS = formatEventDisplayDate(sDate);
            const formattedE = formatEventDisplayDate(eDate);
            eventDateEl.innerHTML = `<span style="font-weight:700; color:#0a192f;">${(formattedS === formattedE || !eDate) ? formattedS : `${formattedS} to ${formattedE}`}</span>`;
        }

        const eventTimeEl = document.getElementById('pbd-event-time');
        if (eventTimeEl) {
            let sTime = booking.StartTime || booking.EventTime || '08:00';
            if (sTime.includes('-')) sTime = sTime.split('-')[0].trim();
            if (!sTime.toLowerCase().includes('am') && !sTime.toLowerCase().includes('pm')) {
                const parts = sTime.split(':');
                if (parts.length >= 2) {
                    let hour = parseInt(parts[0], 10);
                    const minutes = parts[1].padStart(2, '0');
                    const period = hour >= 12 ? 'PM' : 'AM';
                    hour = hour % 12;
                    if (hour === 0) hour = 12;
                    sTime = `${hour}:${minutes} ${period}`;
                }
            }
            eventTimeEl.textContent = sTime;
        }

        const venueEl = document.getElementById('pbd-event-venue');
        if (venueEl) venueEl.textContent = booking.VenueName || booking.EventPlace || 'Private Venue';

        const addressEl = document.getElementById('pbd-event-address');
        if (addressEl) addressEl.textContent = booking.EventAddress || booking.Location || 'Batangas';

        const notesBox = document.getElementById('pbd-location-notes-box');
        const notesEl = document.getElementById('pbd-location-notes');
        if (notesBox && notesEl) {
            if (booking.LocationNotes) {
                notesEl.textContent = booking.LocationNotes;
                notesBox.style.display = 'block';
            } else {
                notesBox.style.display = 'none';
            }
        }

        // Render Pinned Event Location on Leaflet Map
        const mapWrapper = document.getElementById('pbd-map-wrapper');
        const mapContainer = document.getElementById('pbd-booking-map');
        const mapCoordsEl = document.getElementById('pbd-map-coordinates');
        const mapExtLink = document.getElementById('pbd-map-external-link');

        const latVal = booking.EventLatitude != null ? parseFloat(booking.EventLatitude) : null;
        const lngVal = booking.EventLongitude != null ? parseFloat(booking.EventLongitude) : null;
        const hasValidCoords = latVal != null && lngVal != null && !isNaN(latVal) && !isNaN(lngVal) && (latVal !== 0 || lngVal !== 0);

        if (mapWrapper && mapContainer) {
            if (hasValidCoords) {
                mapWrapper.style.display = 'block';
                if (mapCoordsEl) {
                    mapCoordsEl.textContent = `(${latVal.toFixed(5)}, ${lngVal.toFixed(5)})`;
                }
                if (mapExtLink) {
                    mapExtLink.href = `https://www.google.com/maps?q=${latVal},${lngVal}`;
                }

                const venueLabel = booking.VenueName || 'Event Venue';
                const addressLabel = booking.EventAddress || booking.Location || '';

                if (typeof L !== 'undefined') {
                    setTimeout(() => {
                        try {
                            if (!pbdLeafletMap) {
                                pbdLeafletMap = L.map('pbd-booking-map', {
                                    scrollWheelZoom: false
                                }).setView([latVal, lngVal], 16);

                                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                    attribution: '&copy; OpenStreetMap contributors',
                                    maxZoom: 19
                                }).addTo(pbdLeafletMap);

                                pbdLeafletMarker = L.marker([latVal, lngVal]).addTo(pbdLeafletMap);
                            } else {
                                pbdLeafletMap.setView([latVal, lngVal], 16);
                                if (pbdLeafletMarker) {
                                    pbdLeafletMarker.setLatLng([latVal, lngVal]);
                                } else {
                                    pbdLeafletMarker = L.marker([latVal, lngVal]).addTo(pbdLeafletMap);
                                }
                            }

                            pbdLeafletMarker.bindPopup(`
                                <div style="font-family:'Inter',sans-serif; padding:4px;">
                                    <strong style="font-size:0.95rem; color:#0a192f; display:block; margin-bottom:2px;">${venueLabel}</strong>
                                    <span style="font-size:0.82rem; color:#475569;">${addressLabel}</span>
                                </div>
                            `).openPopup();

                            pbdLeafletMap.invalidateSize();
                        } catch (err) {
                            console.warn('[Leaflet] Error updating booking map:', err);
                        }
                    }, 120);
                }
            } else {
                if (booking.EventAddress || booking.Location) {
                    const query = encodeURIComponent(`${booking.VenueName ? booking.VenueName + ', ' : ''}${booking.EventAddress || booking.Location}`);
                    mapWrapper.style.display = 'block';
                    if (mapCoordsEl) mapCoordsEl.textContent = 'Approximate venue';
                    if (mapExtLink) mapExtLink.href = `https://www.google.com/maps/search/?api=1&query=${query}`;
                    if (typeof L !== 'undefined') {
                        const fallbackLat = 13.9419;
                        const fallbackLng = 120.7326;
                        setTimeout(() => {
                            try {
                                if (!pbdLeafletMap) {
                                    pbdLeafletMap = L.map('pbd-booking-map', {
                                        scrollWheelZoom: false
                                    }).setView([fallbackLat, fallbackLng], 12);
                                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                        attribution: '&copy; OpenStreetMap contributors',
                                        maxZoom: 19
                                    }).addTo(pbdLeafletMap);
                                    pbdLeafletMarker = L.marker([fallbackLat, fallbackLng]).addTo(pbdLeafletMap);
                                } else {
                                    pbdLeafletMap.setView([fallbackLat, fallbackLng], 12);
                                    if (pbdLeafletMarker) pbdLeafletMarker.setLatLng([fallbackLat, fallbackLng]);
                                }
                                pbdLeafletMarker.bindPopup(`
                                    <div style="font-family:'Inter',sans-serif; padding:4px;">
                                        <strong style="font-size:0.95rem; color:#0a192f; display:block; margin-bottom:2px;">${booking.VenueName || 'Event Venue'}</strong>
                                        <span style="font-size:0.82rem; color:#475569;">${booking.EventAddress || booking.Location || ''}</span>
                                    </div>
                                `).openPopup();
                                pbdLeafletMap.invalidateSize();
                            } catch (e) {}
                        }, 120);
                    }
                } else {
                    mapWrapper.style.display = 'none';
                }
            }
        }

        // Financial Breakdown
        const pkgPrice = parseFloat(booking.PackagePrice || 0);
        const addCharges = parseFloat(booking.AdditionalDayCharges || 0);
        const transFee = parseFloat(booking.TransportationFee || 0);
        const totalAmt = parseFloat(booking.TotalAmount || 0);
        const amtPaid = parseFloat(booking.AmountPaid || 0);
        const remBal = parseFloat(booking.RemainingBalance != null ? booking.RemainingBalance : (totalAmt - amtPaid));
        const payInfo = getBookingPaymentInfo(booking);

        const commRate = parseFloat(booking.CommissionRate || 5) / 100;
        const expectedTotalNet = Math.round((totalAmt * (1 - commRate)) * 100) / 100;
        const expectedPaidNet = Math.round((amtPaid * (1 - commRate)) * 100) / 100;

        // If booking is fully paid or remaining balance is 0, provider net earnings is full 95% net amount
        let provEarn = parseFloat(booking.ProviderEarnings || expectedTotalNet);
        if (payInfo.isFull || amtPaid >= totalAmt || remBal <= 0) {
            provEarn = expectedTotalNet;
        } else if (provEarn <= 0 && amtPaid > 0) {
            provEarn = expectedPaidNet;
        }

        const pkgPriceEl = document.getElementById('pbd-package-price');
        if (pkgPriceEl) pkgPriceEl.textContent = `₱${pkgPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const addChargesRow = document.getElementById('pbd-additional-days-row');
        const addChargesEl = document.getElementById('pbd-additional-day-charges');
        if (addChargesRow && addChargesEl) {
            if (addCharges > 0) {
                addChargesRow.style.display = 'flex';
                addChargesEl.textContent = `₱${addCharges.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            } else {
                addChargesRow.style.display = 'none';
            }
        }

        const transFeeEl = document.getElementById('pbd-transport-fee');
        if (transFeeEl) transFeeEl.textContent = `₱${transFee.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const totalEl = document.getElementById('pbd-total-amount');
        if (totalEl) totalEl.textContent = `₱${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
        const badgeEl = document.getElementById('pbd-payment-type-badge');
        if (badgeEl) {
            badgeEl.innerHTML = payInfo.isFull 
                ? `<span style="font-size:0.85rem; color:#16a34a; font-weight:600;">(Full Payment)</span>` 
                : (payInfo.isPartial 
                    ? `<span style="font-size:0.85rem; color:#d97706; font-weight:600;">(Partial Payment)</span>` 
                    : `<span style="font-size:0.85rem; color:#64748b; font-weight:500;">(Unpaid)</span>`
                );
        }

        const paidEl = document.getElementById('pbd-amount-paid');
        if (paidEl) paidEl.textContent = `₱${payInfo.amtPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const balEl = document.getElementById('pbd-remaining-balance');
        if (balEl) balEl.textContent = `₱${Math.max(0, payInfo.remBal).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const earnEl = document.getElementById('pbd-provider-earnings');
        if (earnEl) earnEl.textContent = `₱${provEarn.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        // Actions
        const actionsContainer = document.getElementById('pbd-modal-actions');
        const footerBar = document.getElementById('pbd-footer-bar');
        if (actionsContainer) {
            const hideFullscreen = "const v = document.getElementById('view-booking-details-fullscreen') || document.getElementById('modal-provider-booking-details'); if(v) v.classList.add('hidden');";
            if (statusLower === 'pending') {
                actionsContainer.innerHTML = `
                    <button type="button" onclick="${hideFullscreen} window.acceptProviderBooking(${booking.BookingID})" style="padding:10px 22px; font-size:0.92rem; border:none; border-radius:8px; background:#10b981; color:#fff; cursor:pointer; font-weight:700;">Accept Booking</button>
                    <button type="button" onclick="${hideFullscreen} window.cancelProviderBooking(${booking.BookingID})" style="padding:10px 22px; font-size:0.92rem; border:none; border-radius:8px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;">Reject</button>
                `;
                if (footerBar) footerBar.style.display = 'flex';
            } else if (statusLower === 'confirmed') {
                const rawDateModal = booking.ServiceStartDate || booking.EventDate;
                const isDayOfServiceModal = isEventServiceDayOrPast(rawDateModal);
                const formattedDateModal = formatEventDisplayDate(rawDateModal);
                actionsContainer.innerHTML = `
                    ${isDayOfServiceModal ? `
                        <button type="button" onclick="${hideFullscreen} window.completeProviderBooking(${booking.BookingID})" style="padding:10px 22px; font-size:0.92rem; border:none; border-radius:8px; background:#2563eb; color:#fff; cursor:pointer; font-weight:700;">Complete Event</button>
                    ` : `
                        <button type="button" disabled title="The Complete button will unlock on the day of services (${formattedDateModal})" style="padding:10px 22px; font-size:0.92rem; border:1.5px solid #cbd5e1; border-radius:8px; background:#f1f5f9; color:#94a3b8; cursor:not-allowed; font-weight:700; opacity:0.8;" onclick="event.stopPropagation();">Complete Event (${formattedDateModal})</button>
                    `}
                    <button type="button" onclick="${hideFullscreen} window.cancelProviderBooking(${booking.BookingID})" style="padding:10px 22px; font-size:0.92rem; border:none; border-radius:8px; background:#ef4444; color:#fff; cursor:pointer; font-weight:700;">Cancel Booking</button>
                `;
                if (footerBar) footerBar.style.display = 'flex';
            } else if (statusLower === 'awaiting client confirmation') {
                actionsContainer.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:0.92rem; font-weight:700; color:#b45309; background:#fef3c7; border:1px solid #fde68a; padding:8px 16px; border-radius:8px;">
                            Service Marked Complete - Awaiting Client Acceptance (Auto-accepts in 24h)
                        </span>
                    </div>
                `;
                if (footerBar) footerBar.style.display = 'flex';
            } else if (statusLower === 'completed') {
                const wdStatus = (booking.WithdrawalStatus || '').toLowerCase();
                let withdrawStatusHtml = '';
                if (wdStatus === 'pending') {
                    withdrawStatusHtml = `<span style="font-size:0.88rem; font-weight:700; color:#d97706; background:#fef3c7; border:1px solid #fde68a; padding:8px 16px; border-radius:8px;">Payout Requested</span>`;
                } else if (wdStatus === 'approved' || wdStatus === 'completed' || wdStatus === 'processed') {
                    withdrawStatusHtml = `<span style="font-size:0.88rem; font-weight:700; color:#15803d; background:#dcfce7; border:1px solid #bbf7d0; padding:8px 16px; border-radius:8px;">Paid &amp; Sent</span>`;
                }

                actionsContainer.innerHTML = `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="font-size:0.92rem; font-weight:700; color:#10b981; display:flex; align-items:center; gap:6px;">
                            <i class="fa-solid fa-circle-check"></i> Booking Completed
                        </span>
                        ${withdrawStatusHtml}
                    </div>
                `;
                if (footerBar) footerBar.style.display = 'flex';
            } else {
                actionsContainer.innerHTML = '';
                if (footerBar) footerBar.style.display = 'none';
            }
        }

        fullscreenView.classList.remove('hidden');
    };

    // Close / Back Fullscreen Listeners
    const backPbdBtn = document.getElementById('btn-back-from-booking-details');
    const closePbdBtn = document.getElementById('btn-close-provider-booking-details');
    const pbdFullscreen = document.getElementById('view-booking-details-fullscreen') || document.getElementById('modal-provider-booking-details');
    if (backPbdBtn && pbdFullscreen) {
        backPbdBtn.onclick = () => pbdFullscreen.classList.add('hidden');
    }
    if (closePbdBtn && pbdFullscreen) {
        closePbdBtn.onclick = () => pbdFullscreen.classList.add('hidden');
    }

    // Render Recent Reviews
    const renderRecentReviews = (reviews) => {
        const container = document.getElementById('dash-recent-reviews-list');
        const fullContainer = document.getElementById('full-provider-reviews-list');
        if (!container && !fullContainer) return;

        if (!reviews || reviews.length === 0) {
            const emptyHtml = `<div style="padding:30px; text-align:center; color:#64748b; font-size:0.9rem;"><i class="fa-regular fa-star" style="font-size:1.8rem; color:#cbd5e1; margin-bottom:8px; display:block;"></i>No client reviews yet. Reviews will appear here after completed events.</div>`;
            if (container) container.innerHTML = emptyHtml;
            if (fullContainer) fullContainer.innerHTML = emptyHtml;
            return;
        }

        const buildStars = (rating) => {
            const r = Math.round(Number(rating) || 0);
            return Array.from({ length: 5 }, (_, i) =>
                `<i class="fa-${i < r ? 'solid' : 'regular'} fa-star" style="color:${i < r ? '#f59e0b' : '#cbd5e1'}; font-size:0.85rem;"></i>`
            ).join('');
        };

        const formatDate = (dateStr) => {
            if (!dateStr) return '';
            try {
                return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            } catch (e) {
                return '';
            }
        };

        // Compact list for dashboard widget
        if (container) {
            container.innerHTML = reviews.slice(0, 5).map(r => `
                <div style="padding:12px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="font-size:0.88rem; color:#0a192f;">${r.ClientName || 'Client'}</strong>
                        <span style="font-size:0.8rem; color:#f59e0b; font-weight:700;"><i class="fa-solid fa-star"></i> ${(Number(r.Rating) || 0).toFixed(1)}</span>
                    </div>
                    ${r.PackageName ? `<div style="font-size:0.75rem; color:#64748b; margin-top:2px;"><i class="fa-solid fa-cube" style="font-size:0.7rem; color:#3b82f6;"></i> ${r.PackageName} ${r.BookingID ? `<span style="color:#94a3b8;">(#BK-${r.BookingID})</span>` : ''}</div>` : ''}
                    <p style="font-size:0.8rem; color:#475569; margin:4px 0 0 0;">${r.Comment || 'No feedback text.'}</p>
                </div>
            `).join('');
        }

        // Full reviews view panel
        if (fullContainer) {
            fullContainer.innerHTML = reviews.map(r => {
                const dateStr = formatDate(r.CreatedAt);
                const reviewId = r.ReviewID || r.id;
                return `
                <div style="padding:16px 20px; border-bottom:1px solid #f1f5f9; background:#fff; border-radius:10px; margin-bottom:12px; border:1px solid #e2e8f0; transition:all 0.2s ease;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px; margin-bottom:8px;">
                        <div>
                            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                                <strong style="font-size:0.95rem; color:#0a192f;">${r.ClientName || 'Client'}</strong>
                                ${r.PackageName ? `<span style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem; background:#eff6ff; color:#2563eb; font-weight:600; padding:3px 9px; border-radius:12px; border:1px solid #bfdbfe;"><i class="fa-solid fa-box-open" style="font-size:0.7rem;"></i> ${r.PackageName}</span>` : ''}
                                ${r.BookingID ? `<span style="font-size:0.75rem; color:#64748b; font-weight:600; background:#f8fafc; padding:3px 8px; border-radius:6px; border:1px solid #e2e8f0;">Booking #BK-${r.BookingID}</span>` : ''}
                                ${dateStr ? `<span style="font-size:0.75rem; color:#94a3b8;"><i class="fa-regular fa-calendar" style="font-size:0.7rem;"></i> ${dateStr}</span>` : ''}
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="display:flex; align-items:center; gap:6px; background:#fffbeb; padding:4px 10px; border-radius:20px; border:1px solid #fef3c7;">
                                <div>${buildStars(r.Rating)}</div>
                                <span style="font-size:0.85rem; color:#d97706; font-weight:700;">${(Number(r.Rating) || 0).toFixed(1)}</span>
                            </div>
                            ${reviewId ? `
                            <button type="button" onclick="window.deleteProviderReview(${reviewId})" style="background:#fff1f2; color:#e11d48; border:1px solid #fecdd3; padding:5px 12px; border-radius:8px; font-size:0.75rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center; gap:5px; transition:all 0.15s ease;" title="Delete this review">
                                <i class="fa-solid fa-trash-can"></i> Delete
                            </button>
                            ` : ''}
                        </div>
                    </div>
                    <p style="font-size:0.88rem; color:#334155; margin:8px 0 0 0; line-height:1.5;">"${r.Comment || 'No feedback text provided.'}"</p>
                </div>
                `;
            }).join('');
        }
    };

    // Handler to permanently delete a client review
    window.deleteProviderReview = async (reviewId) => {
        if (!reviewId) return;
        if (!confirm('Are you sure you want to permanently delete this client review?')) return;

        try {
            const authToken = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) 
                ? SoundSphereAPI.getAuthToken() 
                : (localStorage.getItem('soundsphere_token') || sessionStorage.getItem('soundsphere_token') || token);

            const res = await fetch(`/api/providers/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (typeof showToast === 'function') {
                    showToast(data.message || 'Review deleted successfully.', 'success');
                } else {
                    alert(data.message || 'Review deleted successfully.');
                }
                if (typeof loadDashboardData === 'function') {
                    await loadDashboardData();
                }
            } else {
                alert(data.message || 'Failed to delete review.');
            }
        } catch (err) {
            console.error('Error deleting review:', err);
            alert('Failed to delete review: ' + err.message);
        }
    };

    // Load Services List
    const loadServices = async () => {
        const tableBody = document.getElementById('table-provider-services-list');
        if (!tableBody) return;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/providers/services/list', { headers });

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
            lightboxImg.src = imageUrl.startsWith('/') || imageUrl.startsWith('http') || imageUrl.startsWith('data:') ? imageUrl : `/${imageUrl}`;
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
            const fullUrl = img.url.startsWith('/') || img.url.startsWith('http') || img.url.startsWith('data:') ? img.url : `/${img.url}`;
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
                                        const src = img.url.startsWith('/') || img.url.startsWith('http') || img.url.startsWith('data:') ? img.url : `/${img.url}`;
                                        return `
                                            <div style="position:relative; width:80px; height:80px; border-radius:10px; overflow:hidden; border:1px solid #cbd5e1; flex-shrink:0;">
                                                <img src="${src}" style="width:100%; height:100%; object-fit:cover; cursor:pointer;" onclick="window.openImageLightbox('${src}')" title="Click to view setup photo">
                                            </div>
                                        `;
                                    }).join('');

                                    if (remainingCount > 0) {
                                        const fourthSrc = photos[3].url.startsWith('/') || photos[3].url.startsWith('http') || photos[3].url.startsWith('data:') ? photos[3].url : `/${photos[3].url}`;
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
                                            </div>

                                            <p style="font-size:0.96rem; color:#64748b; margin:0 0 16px 0; line-height:1.5;">${p.Description || 'No description provided.'}</p>

                                            <div style="margin-bottom:18px;">
                                                <strong style="font-size:0.9rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:8px; font-weight:700;">Includes:</strong>
                                                <ul style="list-style:none; padding:0; margin:0; font-size:0.95rem; color:#334155; display:flex; flex-direction:column; gap:6px;">
                                                    ${inclusionsArr.slice(0, 3).map(inc => `<li><i class="fa-solid fa-check" style="color:#10b981; margin-right:8px;"></i> ${inc}</li>`).join('')}
                                                    ${inclusionsArr.length > 3 ? `<li style="font-weight:700; color:#2563eb; display:flex; align-items:center; gap:6px; margin-top:2px; font-size:0.88rem;"><i class="fa-solid fa-plus" style="font-size:0.75rem;"></i> +${inclusionsArr.length - 3} more included</li>` : ''}
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
                    updateArchiveBadge();
                    return;
                }
            }
        } catch (e) {
            console.warn('Load packages notice:', e.message);
        } finally {
            updateArchiveBadge();
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
                formData.append('category', category || 'Basic Package');
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
        if (catInput) catInput.value = pkg.Category || 'Basic Package';
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

    const updateArchiveBadge = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/providers/packages/archived', { headers });
            if (res.ok) {
                const data = await res.json();
                const count = Array.isArray(data.data) ? data.data.length : 0;
                const sideBadge = document.getElementById('archive-count-badge');
                const pkgPill = document.getElementById('packages-archive-pill');
                if (sideBadge) {
                    sideBadge.textContent = count;
                    sideBadge.style.display = count > 0 ? 'inline-block' : 'none';
                }
                if (pkgPill) {
                    pkgPill.textContent = count;
                    pkgPill.style.display = count > 0 ? 'inline-block' : 'none';
                }
            }
        } catch (e) {
            // silent catch
        }
    };

    window.loadArchivedPackages = async () => {
        const grid = document.getElementById('provider-archived-cards-grid');
        if (!grid) return;
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:48px 24px; color:#64748b;">
                <i class="fa-solid fa-spinner fa-spin" style="font-size:2rem; color:#2563eb; margin-bottom:12px; display:block;"></i>
                <p style="margin:0; font-size:0.95rem;">Loading archived packages...</p>
            </div>
        `;

        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/providers/packages/archived', { headers });
            if (res.ok) {
                const data = await res.json();
                const packages = Array.isArray(data.data) ? data.data : [];
                updateArchiveBadge();

                if (packages.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column:1/-1; text-align:center; padding:52px 24px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px;">
                            <i class="fa-solid fa-box-archive" style="font-size:2.8rem; color:#cbd5e1; margin-bottom:14px; display:block;"></i>
                            <h3 style="margin:0 0 6px 0; color:#0a192f; font-size:1.15rem; font-weight:800;">Archive is Empty</h3>
                            <p style="margin:0; font-size:0.9rem; color:#64748b;">When you delete a service package, it will safely appear here first before permanent deletion.</p>
                        </div>
                    `;
                    return;
                }

                grid.innerHTML = packages.map(p => {
                    const inclusionsArr = (p.Inclusions || p.Description || 'Full Equipment Setup')
                        .split(',')
                        .map(s => s.trim())
                        .filter(Boolean);
                    const photos = Array.isArray(p.images) ? p.images : [];
                    let photosHTML = '';
                    if (photos.length > 0) {
                        photosHTML = photos.slice(0, 3).map(img => {
                            const src = img.url.startsWith('/') || img.url.startsWith('http') || img.url.startsWith('data:') ? img.url : `/${img.url}`;
                            return `
                                <div style="width:70px; height:70px; border-radius:8px; overflow:hidden; border:1px solid #cbd5e1; flex-shrink:0;">
                                    <img src="${src}" style="width:100%; height:100%; object-fit:cover;">
                                </div>
                            `;
                        }).join('');
                    }

                    const archivedDateStr = p.ArchivedAt 
                        ? new Date(p.ArchivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Recently';

                    return `
                        <div class="package-offer-card" style="background:#ffffff; border:1.5px solid #fed7aa; border-radius:14px; padding:24px; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 4px 14px rgba(10,25,47,0.05); position:relative;">
                            <div>
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
                                    <span style="font-size:0.82rem; font-weight:700; color:#64748b; background:#f1f5f9; padding:4px 12px; border-radius:20px; text-transform:uppercase;">
                                        ${p.Category || 'Package Offer'}
                                    </span>
                                    <span style="font-size:0.82rem; font-weight:800; color:#ef4444; background:#fee2e2; padding:4px 12px; border-radius:20px; display:inline-flex; align-items:center; gap:6px;">
                                        <i class="fa-solid fa-box-archive"></i> Archived
                                    </span>
                                </div>

                                <h3 style="margin:0 0 8px 0; color:#0a192f; font-size:1.25rem; font-weight:800;">${p.PackageName}</h3>
                                <div style="font-size:1.45rem; font-weight:800; color:#0f766e; margin-bottom:12px;">
                                    ₱${parseFloat(p.Price || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    <span style="font-size:0.85rem; color:#64748b; font-weight:500;">/ Event</span>
                                </div>

                                <p style="font-size:0.92rem; color:#64748b; margin:0 0 14px 0; line-height:1.45;">${p.Description || 'No description.'}</p>

                                <div style="margin-bottom:14px;">
                                    <strong style="font-size:0.85rem; color:#475569; text-transform:uppercase; display:block; margin-bottom:6px; font-weight:700;">Includes:</strong>
                                    <ul style="list-style:none; padding:0; margin:0; font-size:0.88rem; color:#334155; display:flex; flex-direction:column; gap:4px;">
                                        ${inclusionsArr.slice(0, 4).map(inc => `<li><i class="fa-solid fa-check" style="color:#10b981; margin-right:6px;"></i> ${inc}</li>`).join('')}
                                    </ul>
                                </div>

                                ${photosHTML ? `
                                    <div style="margin-bottom:16px;">
                                        <strong style="font-size:0.82rem; color:#64748b; text-transform:uppercase; display:block; margin-bottom:8px; font-weight:700;">Photos:</strong>
                                        <div style="display:flex; align-items:center; gap:8px; overflow-x:auto;">${photosHTML}</div>
                                    </div>
                                ` : ''}

                                <div style="font-size:0.8rem; color:#94a3b8; margin-top:8px; padding-top:10px; border-top:1px dashed #e2e8f0; display:flex; align-items:center; gap:6px;">
                                    <i class="fa-regular fa-clock" style="color:#94a3b8;"></i> Moved to Archive: <strong>${archivedDateStr}</strong>
                                </div>
                            </div>

                            <div style="display:flex; gap:10px; padding-top:16px; border-top:1px solid #f1f5f9; margin-top:16px;">
                                <button type="button" onclick="window.restorePackageItem(${p.PackageID})" style="flex:1; height:44px; border:none; border-radius:8px; background:#10b981; color:#fff; font-size:0.92rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 2px 8px rgba(16,185,129,0.25);" title="Restore this package offer back to active services">
                                    <i class="fa-solid fa-rotate-left"></i> Restore Offer
                                </button>
                                <button type="button" onclick="window.permanentDeletePackageItem(${p.PackageID})" style="height:44px; padding:0 16px; border:1.5px solid #ef4444; border-radius:8px; background:#ffffff; color:#ef4444; font-size:0.88rem; font-weight:800; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px;" title="Permanently delete from database (cannot be undone)">
                                    <i class="fa-solid fa-trash-can"></i> Delete Permanently
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (e) {
            console.warn('Load archived packages notice:', e.message);
        }
    };

    window.restorePackageItem = async (id) => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`/api/providers/packages/${id}/restore`, { method: 'PUT', headers });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Package offer successfully restored to active services!', 'success');
                await loadArchivedPackages();
                await loadPackages();
            } else {
                showToast(`✕ ${data.message || 'Failed to restore package.'}`, 'error');
            }
        } catch (e) {
            showToast('✕ Error restoring package.', 'error');
        }
    };

    window.permanentDeletePackageItem = async (id) => {
        if (!confirm('Are you sure you want to permanently delete this package offer?\n\nWARNING: This action cannot be undone and will permanently erase this package and its images from the database.')) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`/api/providers/packages/${id}/permanent`, { method: 'DELETE', headers });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Package offer permanently deleted.', 'info');
                await loadArchivedPackages();
                await updateArchiveBadge();
            } else {
                showToast(`✕ ${data.message || 'Failed to permanently delete package.'}`, 'error');
            }
        } catch (e) {
            showToast('✕ Error permanently deleting package.', 'error');
        }
    };

    window.deletePackageItem = async (id) => {
        if (!confirm('Move this service package to Archive?\n\nIt will be moved to Archive first where it is hidden from clients. You can safely restore it anytime or delete it permanently.')) return;
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch(`/api/providers/packages/${id}`, { method: 'DELETE', headers });
            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Package moved to Archive.', 'info');
                await loadPackages();
                await updateArchiveBadge();
                await loadDashboardData();
            } else {
                showToast(`✕ ${data.message || 'Failed to archive package.'}`, 'error');
            }
        } catch (e) {
            showToast('✕ Error archiving package.', 'error');
        }
    };

    const btnRefreshArchive = document.getElementById('btn-refresh-archive');
    if (btnRefreshArchive) {
        btnRefreshArchive.addEventListener('click', () => {
            loadArchivedPackages();
            showToast('Archive refreshed.', 'info');
        });
    }

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
                            btnClaimTrial.innerHTML = `1st Month Free Trial Claimed`;
                            btnClaimTrial.style.background = '#94a3b8';
                            btnClaimTrial.style.color = '#ffffff';
                            btnClaimTrial.style.boxShadow = 'none';
                            btnClaimTrial.style.cursor = 'not-allowed';
                        } else {
                            btnClaimTrial.disabled = false;
                            btnClaimTrial.innerHTML = `Claim 1st Month Free`;
                            btnClaimTrial.style.background = '#0a192f';
                            btnClaimTrial.style.color = '#ffffff';
                            btnClaimTrial.style.boxShadow = 'none';
                            btnClaimTrial.style.cursor = 'pointer';
                        }
                    }

                    const cleanPlanTitle = (name) => {
                        if (!name) return 'Monthly Plan';
                        return String(name).replace(/\s*\(\?[0-9,]+\)|\s*\(₱[0-9,]+\)|\s*\(\?\d+\)|\s*\(\d+\)/gi, '').trim();
                    };

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

                        if (elPlanTitle) elPlanTitle.textContent = cleanPlanTitle(s.PlanName);
                        if (elExpiryDate) elExpiryDate.textContent = endStr;
                        if (elDaysRemaining) {
                            if (daysLeft > 0) {
                                elDaysRemaining.textContent = `${daysLeft} Day${daysLeft === 1 ? '' : 's'}`;
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
                                const refId = p.PayMongoSessionID || 'N/A';

                                return `
                                    <tr style="border-bottom:1px solid #f1f5f9;">
                                        <td style="padding:14px 16px; font-weight:700; color:#0a192f;">
                                            ${cleanPlanTitle(p.PlanName || p.PlanType)}
                                        </td>
                                        <td style="padding:14px 16px; font-weight:800; color:#0a192f;">${amtDisplay}</td>
                                        <td style="padding:14px 16px; color:#475569; font-weight:600;">${p.PaymentMethod || 'PayMongo'}</td>
                                        <td style="padding:14px 16px; color:#64748b;">${payDate}</td>
                                        <td style="padding:14px 16px;">
                                            <span style="background:#f1f5f9; color:#334155; border:1px solid #cbd5e1; padding:3px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">
                                                ${p.PaymentStatus || 'Paid'}
                                            </span>
                                        </td>
                                        <td style="padding:14px 16px; font-family:monospace; font-size:0.8rem; color:#64748b;">${refId.length > 20 ? refId.substring(0, 18) + '...' : refId}</td>
                                        <td style="padding:14px 16px; text-align:center;">
                                            <button type="button" class="btn-view-sub-receipt-item" data-payment-id="${p.PaymentID}" style="background:#f8fafc; color:#0a192f; border:1px solid #cbd5e1; padding:6px 14px; border-radius:8px; font-size:0.78rem; font-weight:700; cursor:pointer; display:inline-flex; align-items:center;">
                                                View Receipt
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
        const isCancelled = urlParams.get('cancelled_subscription') || urlParams.get('cancelled');
        const viewParam = urlParams.get('view');

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
        } else if (isCancelled || viewParam === 'subscription' || window.location.hash === '#subscription-section' || window.location.hash === '#subscription') {
            const cleanUrl = window.location.pathname + '#subscription-section';
            window.history.replaceState({}, document.title, cleanUrl);
            switchProviderView('#subscription-section');
            await loadProviderSubscriptionData();
        }
    };

    await checkPayMongoReturn();

    // ------------------------------------------------------------------------
    // PROVIDER AVAILABILITY CALENDAR & CAPACITY MANAGEMENT CONTROLLER
    // ------------------------------------------------------------------------
    let provCalMonth = new Date().getMonth();
    let provCalYear = new Date().getFullYear();
    let provCalSelectedDate = null; // YYYY-MM-DD
    let provCalData = {
        defaultCapacity: 1,
        bookings: [],
        capacities: []
    };

    const MONTH_NAMES_FULL = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    const formatDateIsoStr = (year, month, day) => {
        const mm = String(month + 1).padStart(2, '0');
        const dd = String(day).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    };

    const formatPrettyDateLong = (dateStr) => {
        if (!dateStr) return 'Select Date';
        const parts = dateStr.split('-');
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return `${DAY_NAMES_FULL[d.getDay()]}, ${MONTH_NAMES_FULL[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    };

    const formatTime12Hour = (timeStr) => {
        if (!timeStr) return '08:00 AM';
        const str = String(timeStr).trim();
        if (str.toLowerCase().includes('am') || str.toLowerCase().includes('pm')) return str;
        const parts = str.split(':');
        if (parts.length < 2) return str;
        let hours = parseInt(parts[0], 10);
        const minutes = parts[1].substring(0, 2);
        if (isNaN(hours)) return str;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    };

    // Load Provider Calendar Schedule from backend
    const loadProviderCalendarSchedule = async () => {
        try {
            const headers = { 'Authorization': `Bearer ${token}` };
            const res = await fetch('/api/providers/calendar/schedule', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    provCalData = {
                        defaultCapacity: data.defaultCapacity || 1,
                        bookings: data.bookings || [],
                        capacities: data.capacities || [],
                        isPermitExpired: !!(data.isPermitExpired),
                        isSubscriptionActive: data.isSubscriptionActive !== false,
                        isLocked: !!(data.isLocked || data.isPermitExpired || data.isSubscriptionActive === false),
                        permitExpiryDate: data.permitExpiryDate,
                        subscriptionMessage: data.subscriptionMessage || ''
                    };

                    const isCalLocked = provCalData.isPermitExpired || !provCalData.isSubscriptionActive;

                    const defInput = document.getElementById('prov-default-daily-capacity-input');
                    if (defInput) {
                        defInput.value = provCalData.defaultCapacity;
                        if (isCalLocked) {
                            defInput.disabled = true;
                            defInput.title = !provCalData.isSubscriptionActive
                                ? 'Calendar is locked due to inactive subscription'
                                : 'Calendar is locked due to expired business permit';
                        } else {
                            defInput.disabled = false;
                            defInput.title = '';
                        }
                    }

                    const btnSaveCap = document.getElementById('btn-save-default-capacity') || document.getElementById('btn-save-default-daily-capacity');
                    if (btnSaveCap) {
                        if (isCalLocked) {
                            btnSaveCap.disabled = true;
                            btnSaveCap.style.opacity = '0.5';
                            btnSaveCap.title = !provCalData.isSubscriptionActive
                                ? 'Calendar is locked due to inactive subscription'
                                : 'Calendar is locked due to expired business permit';
                        } else {
                            btnSaveCap.disabled = false;
                            btnSaveCap.style.opacity = '1';
                            btnSaveCap.title = '';
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Calendar schedule fetch notice:', err.message);
        }

        renderProviderCalendarGrid();
    };

    // Render Calendar Grid
    const renderProviderCalendarGrid = () => {
        const monthDisplay = document.getElementById('prov-cal-month-display');
        const grid = document.getElementById('prov-cal-cells-grid');
        const todayText = document.getElementById('prov-cal-today-text');

        if (monthDisplay) {
            monthDisplay.textContent = `${MONTH_NAMES_FULL[provCalMonth]} ${provCalYear}`;
        }

        const now = new Date();
        const todayIso = formatDateIsoStr(now.getFullYear(), now.getMonth(), now.getDate());

        if (todayText) {
            todayText.textContent = `Today: ${MONTH_NAMES_FULL[now.getMonth()].substring(0, 3)} ${now.getDate()}, ${now.getFullYear()}`;
        }

        if (!grid) return;
        grid.innerHTML = '';

        // Permit Expired Alert Banner on Provider Calendar
        const calPermitBanner = document.getElementById('prov-cal-permit-alert-banner');
        if (calPermitBanner) {
            calPermitBanner.style.display = (provCalData && provCalData.isPermitExpired) ? 'flex' : 'none';
        }

        // Subscription Inactive Alert Banner on Provider Calendar
        const calSubBanner = document.getElementById('prov-cal-sub-alert-banner');
        if (calSubBanner) {
            calSubBanner.style.display = (provCalData && !provCalData.isSubscriptionActive) ? 'flex' : 'none';
        }

        const firstDayIndex = new Date(provCalYear, provCalMonth, 1).getDay();
        const totalDaysInMonth = new Date(provCalYear, provCalMonth + 1, 0).getDate();

        // If no selected date yet, default to today if in current month, or 1st day of month
        if (!provCalSelectedDate || !provCalSelectedDate.startsWith(`${provCalYear}-${String(provCalMonth + 1).padStart(2, '0')}`)) {
            if (provCalYear === now.getFullYear() && provCalMonth === now.getMonth()) {
                provCalSelectedDate = todayIso;
            } else {
                provCalSelectedDate = formatDateIsoStr(provCalYear, provCalMonth, 1);
            }
        }

        // Blank cells for alignment
        for (let i = 0; i < firstDayIndex; i++) {
            const blank = document.createElement('div');
            blank.className = 'prov-day-cell empty';
            grid.appendChild(blank);
        }

        // Build Day Cells
        for (let d = 1; d <= totalDaysInMonth; d++) {
            const cellDateIso = formatDateIsoStr(provCalYear, provCalMonth, d);
            const cell = document.createElement('div');
            cell.className = 'prov-day-cell';
            cell.setAttribute('data-date', cellDateIso);

            const isToday = (cellDateIso === todayIso);
            const isSelected = (cellDateIso === provCalSelectedDate);
            const isPast = (cellDateIso < todayIso);

            if (isToday) cell.classList.add('today-cell');
            if (isSelected) cell.classList.add('selected');

            // Find capacity override if exists
            const override = (provCalData.capacities || []).find(c => c.SpecificDate === cellDateIso);
            const maxAllowed = override ? override.MaxBookings : provCalData.defaultCapacity;
            const isBlocked = (maxAllowed === 0);

            // Count bookings overlapping with this date
            const activeBookings = (provCalData.bookings || []).filter(b => {
                const sDate = String(b.ServiceStartDate || b.EventDate || '').trim().split('T')[0];
                const eDate = String(b.ServiceEndDate || sDate).trim().split('T')[0];
                return (cellDateIso >= sDate && cellDateIso <= eDate);
            });
            const bookingCount = activeBookings.length;

            let badgeHtml = '';
            if (isPast) {
                cell.classList.add('is-past');
                const bookedTxt = bookingCount > 0 ? ` (${bookingCount})` : '';
                badgeHtml = `<span class="prov-day-badge badge-status-past" title="Closed${bookedTxt}"><i class="fa-solid fa-lock"></i> Closed${bookedTxt}</span>`;
            } else if (provCalData && !provCalData.isSubscriptionActive) {
                cell.classList.add('is-subscription-locked');
                if (bookingCount > 0) {
                    badgeHtml = `<span class="prov-day-badge" style="background:#eff6ff;color:#1e40af;font-size:0.68rem;font-weight:700;" title="Ongoing booking active"><i class="fa-solid fa-calendar-check"></i> ${bookingCount} Ongoing</span>`;
                } else {
                    badgeHtml = `<span class="prov-day-badge" style="background:#fef3c7;color:#92400e;font-size:0.68rem;font-weight:700;border:1px solid #fde68a;" title="Calendar Locked: Active subscription required"><i class="fa-solid fa-lock"></i> Locked</span>`;
                }
            } else if (provCalData && provCalData.isPermitExpired) {
                cell.classList.add('is-permit-locked');
                if (bookingCount > 0) {
                    badgeHtml = `<span class="prov-day-badge" style="background:#eff6ff;color:#1e40af;font-size:0.68rem;font-weight:700;" title="Ongoing booking active"><i class="fa-solid fa-calendar-check"></i> ${bookingCount} Ongoing</span>`;
                } else {
                    badgeHtml = `<span class="prov-day-badge" style="background:#fee2e2;color:#b91c1c;font-size:0.68rem;font-weight:700;" title="Calendar Locked: Business permit is expired"><i class="fa-solid fa-lock"></i> Locked</span>`;
                }
            } else if (isBlocked) {
                cell.classList.add('is-blocked');
                badgeHtml = `<span class="prov-day-badge badge-status-blocked" title="Blocked"><i class="fa-solid fa-ban"></i> Blocked</span>`;
            } else if (bookingCount >= maxAllowed) {
                cell.classList.add('is-full');
                badgeHtml = `<span class="prov-day-badge badge-status-full" title="Full (${bookingCount}/${maxAllowed})"><i class="fa-solid fa-lock"></i> Full (${bookingCount}/${maxAllowed})</span>`;
            } else if (bookingCount > 0) {
                cell.classList.add('is-partial');
                badgeHtml = `<span class="prov-day-badge badge-status-partial" title="${bookingCount}/${maxAllowed} Booked"><i class="fa-solid fa-user-check"></i> ${bookingCount}/${maxAllowed} Booked</span>`;
            } else {
                cell.classList.add('is-available');
                badgeHtml = `<span class="prov-day-badge badge-status-avail" title="${maxAllowed} Available"><i class="fa-regular fa-circle-check"></i> ${maxAllowed} Avail</span>`;
            }

            cell.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%; min-width:0;">
                    <span class="day-num" style="font-weight:800; font-size:0.92rem; color:#0a192f; line-height:1;">${d}</span>
                    ${override ? `<i class="fa-solid fa-sliders" style="font-size:0.6rem; color:#2563eb;" title="Custom limit: ${override.MaxBookings}"></i>` : ''}
                </div>
                <div style="margin-top:3px; width:100%; min-width:0; overflow:hidden;">
                    ${badgeHtml}
                </div>
            `;

            cell.setAttribute('title', `Click to view bookings for ${formatPrettyDateLong(cellDateIso)}`);

            cell.addEventListener('click', () => {
                provCalSelectedDate = cellDateIso;
                document.querySelectorAll('.prov-calendar-grid .prov-day-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');
                renderInspectorPanel();
            });

            grid.appendChild(cell);
        }

        renderInspectorPanel();
    };

    // Jump to Booking in Management Tab
    window.viewBookingInManagement = (bookingId) => {
        // Switch active tab in sidebar
        const navBookings = document.getElementById('nav-item-bookings');
        if (navBookings) navBookings.click();

        // Highlight table row after view panel switch
        setTimeout(() => {
            const rows = document.querySelectorAll('#table-provider-bookings-list tr');
            rows.forEach(r => {
                if (r.textContent.includes(`#BK-${bookingId}`)) {
                    r.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    r.style.background = '#eff6ff';
                    r.style.transition = 'background 0.5s';
                    setTimeout(() => { r.style.background = ''; }, 3500);
                }
            });
        }, 250);
    };

    // Render Inspector Panel for Selected Date
    const renderInspectorPanel = () => {
        if (!provCalSelectedDate) return;

        const now = new Date();
        const todayIso = formatDateIsoStr(now.getFullYear(), now.getMonth(), now.getDate());

        const dateTitle = document.getElementById('prov-inspector-date-title');
        const statusBadge = document.getElementById('prov-inspector-status-badge');
        const summaryText = document.getElementById('prov-inspector-summary-text');
        const capacityInput = document.getElementById('prov-date-capacity-input');
        const saveDateCapBtn = document.getElementById('btn-save-date-capacity');
        const toggleBlockBtn = document.getElementById('btn-toggle-block-date');
        const resetBtn = document.getElementById('btn-reset-date-capacity');
        const bookingsList = document.getElementById('prov-inspector-bookings-list');
        const countBadge = document.getElementById('prov-inspector-bookings-count-badge');
        const customCapNotice = document.getElementById('prov-past-date-notice');

        if (dateTitle) {
            dateTitle.textContent = formatPrettyDateLong(provCalSelectedDate);
            dateTitle.style.setProperty('color', '#ffffff', 'important');
        }

        // Find capacity override for this date
        const override = (provCalData.capacities || []).find(c => c.SpecificDate === provCalSelectedDate);
        const maxAllowed = override ? override.MaxBookings : provCalData.defaultCapacity;
        const isBlocked = (maxAllowed === 0);
        const isPast = (provCalSelectedDate < todayIso);

        // Filter bookings for this date
        const activeBookings = (provCalData.bookings || []).filter(b => {
            const sDate = String(b.ServiceStartDate || b.EventDate || '').trim().split('T')[0];
            const eDate = String(b.ServiceEndDate || sDate).trim().split('T')[0];
            return (provCalSelectedDate >= sDate && provCalSelectedDate <= eDate);
        });

        const bookedCount = activeBookings.length;

        // Custom capacity cannot be lower than existing bookings
        if (capacityInput) {
            capacityInput.min = bookedCount;
            capacityInput.value = Math.max(bookedCount, maxAllowed);
        }

        // Show minimum capacity hint if there are active bookings
        const minCapNotice = document.getElementById('prov-date-min-cap-notice');
        if (minCapNotice) {
            if (bookedCount > 0) {
                minCapNotice.style.display = 'block';
                minCapNotice.innerHTML = `📌 <strong>${bookedCount} booking${bookedCount === 1 ? '' : 's'} already scheduled.</strong> Capacity cannot be lower than ${bookedCount}.`;
            } else {
                minCapNotice.style.display = 'none';
            }
        }

        if (countBadge) countBadge.textContent = `${activeBookings.length} Booking${activeBookings.length === 1 ? '' : 's'}`;

        if (statusBadge && summaryText) {
            if (isPast) {
                statusBadge.textContent = 'Closed (Past Date)';
                statusBadge.style.background = '#64748b';
                summaryText.innerHTML = `Past date &bull; Booking window is closed (${activeBookings.length} booking${activeBookings.length === 1 ? '' : 's'} recorded).`;
            } else if (provCalData && !provCalData.isSubscriptionActive) {
                if (activeBookings.length > 0) {
                    statusBadge.textContent = 'Ongoing Booking Active';
                    statusBadge.style.background = '#2563eb';
                    summaryText.innerHTML = `<i class="fa-solid fa-calendar-check" style="color:#3b82f6;"></i> ${activeBookings.length} ongoing booking(s) scheduled. New bookings are locked until subscription is activated.`;
                } else {
                    statusBadge.textContent = 'Calendar Locked';
                    statusBadge.style.background = '#d97706';
                    summaryText.innerHTML = `<i class="fa-solid fa-crown" style="color:#d97706;"></i> Active subscription required. All calendar dates are locked until you subscribe to a plan.`;
                }
            } else if (provCalData && provCalData.isPermitExpired) {
                if (activeBookings.length > 0) {
                    statusBadge.textContent = 'Ongoing Booking Active';
                    statusBadge.style.background = '#2563eb';
                    summaryText.innerHTML = `<i class="fa-solid fa-calendar-check" style="color:#3b82f6;"></i> ${activeBookings.length} ongoing booking(s) scheduled. New booking acceptance is locked until permit approval.`;
                } else {
                    statusBadge.textContent = 'Calendar Locked';
                    statusBadge.style.background = '#ef4444';
                    summaryText.innerHTML = `<i class="fa-solid fa-lock" style="color:#ef4444;"></i> Business permit not approved by admin. New bookings are disabled.`;
                }
            } else if (isBlocked) {
                statusBadge.textContent = 'Blocked / Closed';
                statusBadge.style.background = '#64748b';
                summaryText.innerHTML = `Date is currently blocked from new bookings (${activeBookings.length} existing booking${activeBookings.length === 1 ? '' : 's'}).`;
            } else if (activeBookings.length >= maxAllowed) {
                statusBadge.textContent = 'Fully Booked';
                statusBadge.style.background = '#ef4444';
                summaryText.innerHTML = `Capacity reached: ${activeBookings.length} of ${maxAllowed} booking(s) filled.`;
            } else if (activeBookings.length > 0) {
                statusBadge.textContent = 'Partially Booked';
                statusBadge.style.background = '#f59e0b';
                summaryText.innerHTML = `${activeBookings.length} booking scheduled &bull; ${maxAllowed - activeBookings.length} slot(s) remaining.`;
            } else {
                statusBadge.textContent = 'Available';
                statusBadge.style.background = '#22c55e';
                summaryText.innerHTML = `0 bookings scheduled &bull; Capacity: ${maxAllowed} booking(s) allowed.`;
            }
        }

        // Toggle Block / Unblock Button
        if (toggleBlockBtn) {
            if (bookedCount > 0) {
                // Cannot block a date that already has active bookings
                toggleBlockBtn.disabled = true;
                toggleBlockBtn.style.opacity = '0.5';
                toggleBlockBtn.style.cursor = 'not-allowed';
                toggleBlockBtn.title = `Cannot block date: ${bookedCount} booking(s) already scheduled. Minimum capacity is ${bookedCount}.`;
                toggleBlockBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Block Date (${bookedCount} Booked)`;
                toggleBlockBtn.style.color = '#94a3b8';
                toggleBlockBtn.style.borderColor = '#cbd5e1';
            } else if (isBlocked) {
                toggleBlockBtn.disabled = isPast;
                toggleBlockBtn.style.opacity = isPast ? '0.5' : '1';
                toggleBlockBtn.style.cursor = isPast ? 'not-allowed' : 'pointer';
                toggleBlockBtn.title = '';
                toggleBlockBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Unblock Date (Set ${provCalData.defaultCapacity})`;
                toggleBlockBtn.style.color = '#15803d';
                toggleBlockBtn.style.borderColor = '#86efac';
            } else {
                toggleBlockBtn.disabled = isPast;
                toggleBlockBtn.style.opacity = isPast ? '0.5' : '1';
                toggleBlockBtn.style.cursor = isPast ? 'not-allowed' : 'pointer';
                toggleBlockBtn.title = '';
                toggleBlockBtn.innerHTML = `<i class="fa-solid fa-ban"></i> Block Date (Set 0)`;
                toggleBlockBtn.style.color = '#ef4444';
                toggleBlockBtn.style.borderColor = '#fecaca';
            }
        }

        // Reset to default button
        if (resetBtn) {
            resetBtn.style.display = override ? 'inline-flex' : 'none';
            if (override && bookedCount > provCalData.defaultCapacity) {
                resetBtn.title = `Default limit (${provCalData.defaultCapacity}) is lower than existing bookings (${bookedCount}).`;
            } else {
                resetBtn.title = '';
            }
        }

        // Disable controls for past dates or locked calendars
        const isLockedFromEdits = isPast || (provCalData && (!provCalData.isSubscriptionActive || provCalData.isPermitExpired));
        if (isLockedFromEdits) {
            if (capacityInput) capacityInput.disabled = true;
            if (saveDateCapBtn) {
                saveDateCapBtn.disabled = true;
                saveDateCapBtn.style.opacity = '0.5';
                saveDateCapBtn.style.cursor = 'not-allowed';
            }
            if (toggleBlockBtn) {
                toggleBlockBtn.disabled = true;
                toggleBlockBtn.style.opacity = '0.5';
                toggleBlockBtn.style.cursor = 'not-allowed';
            }
            if (resetBtn) {
                resetBtn.disabled = true;
                resetBtn.style.opacity = '0.5';
                resetBtn.style.cursor = 'not-allowed';
            }
            if (customCapNotice) {
                customCapNotice.style.display = 'block';
                if (!provCalData?.isSubscriptionActive) {
                    customCapNotice.innerHTML = '<i class="fa-solid fa-crown" style="margin-right:4px; color:#d97706;"></i> Subscription required. Calendar modifications are locked.';
                } else if (provCalData?.isPermitExpired) {
                    customCapNotice.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:4px; color:#ef4444;"></i> Business permit expired. Calendar modifications are locked.';
                } else {
                    customCapNotice.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:4px; color:#475569;"></i> This is a past date. Capacity modifications and new bookings are closed.';
                }
            }
        } else {
            if (capacityInput) capacityInput.disabled = false;
            if (saveDateCapBtn) {
                saveDateCapBtn.disabled = false;
                saveDateCapBtn.style.opacity = '1';
                saveDateCapBtn.style.cursor = 'pointer';
            }
            if (toggleBlockBtn) {
                toggleBlockBtn.disabled = false;
                toggleBlockBtn.style.opacity = '1';
                toggleBlockBtn.style.cursor = 'pointer';
            }
            if (resetBtn) {
                resetBtn.disabled = false;
                resetBtn.style.opacity = '1';
                resetBtn.style.cursor = 'pointer';
            }
            if (customCapNotice) {
                customCapNotice.style.display = 'none';
            }
        }

        // Render Bookings List
        if (bookingsList) {
            if (activeBookings.length === 0) {
                bookingsList.innerHTML = `
                    <div style="text-align:center; padding:32px 16px; background:#fff; border-radius:10px; border:1px dashed #cbd5e1; color:#94a3b8;">
                        <i class="fa-regular fa-calendar-check" style="font-size:2rem; color:#cbd5e1; margin-bottom:8px; display:block;"></i>
                        <strong style="color:#64748b; font-size:0.9rem; display:block;">No Bookings on this Date</strong>
                        <span style="font-size:0.78rem;">This date is free and open for customer bookings.</span>
                    </div>
                `;
            } else {
                bookingsList.innerHTML = activeBookings.map(b => {
                    const payInfo = getBookingPaymentInfo(b);
                    return `
                    <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:14px; box-shadow:0 1px 4px rgba(0,0,0,0.03); transition:0.2s;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px; border-bottom:1px solid #f1f5f9; padding-bottom:8px;">
                            <div>
                                <strong style="font-size:0.92rem; color:#0a192f; display:block;">${b.ClientName || 'SoundSphere Client'}</strong>
                                <div style="display:flex; align-items:center; gap:6px; margin-top:2px; flex-wrap:wrap;">
                                    <span style="font-size:0.72rem; font-weight:700; color:#2563eb; background:#eff6ff; padding:1px 6px; border-radius:4px; border:1px solid #bfdbfe;">${b.BookingReference || ('#BK-' + b.BookingID)}</span>
                                    <span style="font-size:0.72rem; color:#64748b;">Booking #${b.BookingID}</span>
                                </div>
                                <div style="font-size:0.75rem; color:#475569; margin-top:4px;">
                                    ${b.ClientPhone ? `<div>Phone: <a href="tel:${b.ClientPhone}" style="color:#2563eb; text-decoration:none; font-weight:600;">${b.ClientPhone}</a></div>` : ''}
                                    ${b.ClientEmail ? `<div>Email: <a href="mailto:${b.ClientEmail}" style="color:#64748b; text-decoration:none;">${b.ClientEmail}</a></div>` : ''}
                                </div>
                            </div>
                            <span class="status-badge status-${(b.BookingStatus || 'confirmed').toLowerCase()}" style="font-size:0.72rem; padding:2px 8px; flex-shrink:0;">${b.BookingStatus || 'Confirmed'}</span>
                        </div>
                        <div style="font-size:0.82rem; color:#1e293b; margin-bottom:4px;">
                            <span style="color:#64748b; font-weight:700; font-size:0.72rem; text-transform:uppercase; display:block;">Service Package</span>
                            <span style="font-weight:700; color:#0a192f;">${b.PackageName || 'Event Package'}</span>
                        </div>
                        <div style="font-size:0.78rem; color:#475569; display:flex; flex-direction:column; gap:3px; margin-top:6px;">
                            <div><strong style="color:#64748b; font-size:0.72rem; text-transform:uppercase;">Start Time:</strong> <span style="font-weight:700; color:#0a192f;">${formatTime12Hour(b.StartTime)}</span></div>
                            <div><strong style="color:#64748b; font-size:0.72rem; text-transform:uppercase;">Venue:</strong> ${b.VenueName || b.EventAddress || b.Location || 'Venue Location'}</div>
                        </div>
                        <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #f1f5f9; display:flex; justify-content:space-between; align-items:center;">
                            <div style="display:flex; flex-direction:column; gap:1px; line-height:1.25;">
                                <span style="font-size:0.88rem; font-weight:800; color:#10b981;">₱${payInfo.amtPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                ${payInfo.isPartial ? `
                                    <span style="font-size:0.74rem; color:#475569; font-weight:500;">Bal: ₱${payInfo.remBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    <span style="font-size:0.72rem; color:#d97706; font-weight:600;">Partial Payment</span>
                                ` : (payInfo.isFull ? `
                                    <span style="font-size:0.72rem; color:#16a34a; font-weight:600;">Full Payment</span>
                                ` : `
                                    <span style="font-size:0.72rem; color:#64748b; font-weight:500;">Unpaid</span>
                                `)}
                            </div>
                            <button type="button" onclick="window.viewBookingInManagement(${b.BookingID})" style="background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; font-size:0.75rem; padding:4px 10px; border-radius:6px; cursor:pointer; font-weight:700;">
                                View Booking
                            </button>
                        </div>
                    </div>
                    `;
                }).join('');
            }
        }
    };

    // Calendar Navigation Events
    const prevCalBtn = document.getElementById('prov-cal-btn-prev');
    if (prevCalBtn) {
        prevCalBtn.addEventListener('click', () => {
            provCalMonth--;
            if (provCalMonth < 0) {
                provCalMonth = 11;
                provCalYear--;
            }
            renderProviderCalendarGrid();
        });
    }

    const nextCalBtn = document.getElementById('prov-cal-btn-next');
    if (nextCalBtn) {
        nextCalBtn.addEventListener('click', () => {
            provCalMonth++;
            if (provCalMonth > 11) {
                provCalMonth = 0;
                provCalYear++;
            }
            renderProviderCalendarGrid();
        });
    }

    const todayCalBtn = document.getElementById('prov-cal-btn-today');
    if (todayCalBtn) {
        todayCalBtn.addEventListener('click', () => {
            const now = new Date();
            provCalMonth = now.getMonth();
            provCalYear = now.getFullYear();
            provCalSelectedDate = formatDateIsoStr(now.getFullYear(), now.getMonth(), now.getDate());
            renderProviderCalendarGrid();
        });
    }

    const refreshCalBtn = document.getElementById('prov-cal-btn-refresh');
    if (refreshCalBtn) {
        refreshCalBtn.addEventListener('click', async () => {
            refreshCalBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            await loadProviderCalendarSchedule();
            refreshCalBtn.innerHTML = '<i class="fa-solid fa-rotate"></i>';
            showToast('✓ Calendar schedule refreshed.', 'success');
        });
    }

    // Save Default Daily Capacity Handler
    const saveDefaultCapBtn = document.getElementById('btn-save-default-capacity');
    if (saveDefaultCapBtn) {
        saveDefaultCapBtn.addEventListener('click', async () => {
            if (provCalData && !provCalData.isSubscriptionActive) {
                showToast('Calendar is locked. An active subscription is required to update availability.', 'warning');
                return;
            }
            const input = document.getElementById('prov-default-daily-capacity-input');
            const val = parseInt(input.value, 10);
            if (isNaN(val) || val < 1) {
                showToast('Default limit must be at least 1 booking per day.', 'error');
                return;
            }

            try {
                saveDefaultCapBtn.disabled = true;
                saveDefaultCapBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const res = await fetch('/api/providers/calendar/default-capacity', {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ maxDailyBookings: val })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(data.message || `Default capacity updated to ${val} bookings/day.`, 'success');
                    provCalData.defaultCapacity = val;
                    renderProviderCalendarGrid();
                } else {
                    showToast(data.message || 'Failed to update default capacity.', 'error');
                }
            } catch (err) {
                showToast('Error saving default capacity.', 'error');
            } finally {
                saveDefaultCapBtn.disabled = false;
                saveDefaultCapBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save';
            }
        });
    }

    // Input Real-Time Validation: Prevent user from typing lower than active bookings count
    const dateCapInput = document.getElementById('prov-date-capacity-input');
    if (dateCapInput) {
        dateCapInput.addEventListener('input', () => {
            if (!provCalSelectedDate) return;
            const activeBookings = (provCalData.bookings || []).filter(b => {
                const sDate = b.ServiceStartDate ? b.ServiceStartDate.split('T')[0] : (b.EventDate ? b.EventDate.split('T')[0] : '');
                const eDate = b.ServiceEndDate ? b.ServiceEndDate.split('T')[0] : sDate;
                return (provCalSelectedDate >= sDate && provCalSelectedDate <= eDate);
            });
            const bookedCount = activeBookings.length;
            const val = parseInt(dateCapInput.value, 10);
            if (!isNaN(val) && val < bookedCount) {
                showToast(`Minimum capacity for this date is ${bookedCount} based on existing bookings.`, 'warning');
                dateCapInput.value = bookedCount;
            }
        });
    }

    // Save Specific Date Capacity Handler
    const saveDateCapBtn = document.getElementById('btn-save-date-capacity');
    if (saveDateCapBtn) {
        saveDateCapBtn.addEventListener('click', async () => {
            if (!provCalSelectedDate) return;
            if (provCalData && !provCalData.isSubscriptionActive) {
                showToast('Calendar is locked. An active subscription is required to update availability.', 'warning');
                return;
            }
            const input = document.getElementById('prov-date-capacity-input');
            const val = parseInt(input.value, 10);
            if (isNaN(val) || val < 0) {
                showToast('Please enter a valid capacity (0 to block, or 1+).', 'error');
                return;
            }

            const activeBookings = (provCalData.bookings || []).filter(b => {
                const sDate = b.ServiceStartDate ? b.ServiceStartDate.split('T')[0] : (b.EventDate ? b.EventDate.split('T')[0] : '');
                const eDate = b.ServiceEndDate ? b.ServiceEndDate.split('T')[0] : sDate;
                return (provCalSelectedDate >= sDate && provCalSelectedDate <= eDate);
            });
            const bookedCount = activeBookings.length;

            if (val < bookedCount) {
                showToast(`⚠️ Cannot lower capacity below ${bookedCount}. You already have ${bookedCount} booking(s) scheduled on this date.`, 'warning');
                input.value = bookedCount;
                return;
            }

            try {
                saveDateCapBtn.disabled = true;
                saveDateCapBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const res = await fetch('/api/providers/calendar/date-capacity', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ specificDate: provCalSelectedDate, maxBookings: val })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(data.message || `Capacity updated for ${provCalSelectedDate}.`, 'success');
                    const existingIdx = (provCalData.capacities || []).findIndex(c => c.SpecificDate === provCalSelectedDate);
                    if (existingIdx >= 0) {
                        provCalData.capacities[existingIdx].MaxBookings = val;
                    } else {
                        provCalData.capacities.push({ SpecificDate: provCalSelectedDate, MaxBookings: val });
                    }
                    renderProviderCalendarGrid();
                } else {
                    showToast(data.message || 'Failed to save date capacity.', 'error');
                }
            } catch (err) {
                showToast('Error saving date capacity.', 'error');
            } finally {
                saveDateCapBtn.disabled = false;
                saveDateCapBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Limit';
            }
        });
    }

    // Toggle 1-Click Block / Unblock Handler
    const toggleBlockBtn = document.getElementById('btn-toggle-block-date');
    if (toggleBlockBtn) {
        toggleBlockBtn.addEventListener('click', async () => {
            if (!provCalSelectedDate) return;
            if (provCalData && !provCalData.isSubscriptionActive) {
                showToast('Calendar is locked. An active subscription is required to update availability.', 'warning');
                return;
            }
            const activeBookings = (provCalData.bookings || []).filter(b => {
                const sDate = b.ServiceStartDate ? b.ServiceStartDate.split('T')[0] : (b.EventDate ? b.EventDate.split('T')[0] : '');
                const eDate = b.ServiceEndDate ? b.ServiceEndDate.split('T')[0] : sDate;
                return (provCalSelectedDate >= sDate && provCalSelectedDate <= eDate);
            });
            const bookedCount = activeBookings.length;

            const override = (provCalData.capacities || []).find(c => c.SpecificDate === provCalSelectedDate);
            const currentCap = override ? override.MaxBookings : provCalData.defaultCapacity;
            const newCap = (currentCap === 0) ? Math.max(provCalData.defaultCapacity, bookedCount) : 0;

            if (newCap === 0 && bookedCount > 0) {
                showToast(`⚠️ Cannot block this date: ${bookedCount} booking(s) are already scheduled. Minimum capacity is ${bookedCount}.`, 'warning');
                return;
            }

            const input = document.getElementById('prov-date-capacity-input');
            if (input) input.value = newCap;

            try {
                const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
                const res = await fetch('/api/providers/calendar/date-capacity', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ specificDate: provCalSelectedDate, maxBookings: newCap })
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(newCap === 0 ? `🚫 ${provCalSelectedDate} is now BLOCKED.` : `✅ ${provCalSelectedDate} unblocked (Capacity: ${newCap}).`, 'success');
                    const existingIdx = (provCalData.capacities || []).findIndex(c => c.SpecificDate === provCalSelectedDate);
                    if (existingIdx >= 0) {
                        provCalData.capacities[existingIdx].MaxBookings = newCap;
                    } else {
                        provCalData.capacities.push({ SpecificDate: provCalSelectedDate, MaxBookings: newCap });
                    }
                    renderProviderCalendarGrid();
                } else {
                    showToast(data.message || 'Failed to update date status.', 'error');
                }
            } catch (err) {
                showToast('Error updating date status.', 'error');
            }
        });
    }

    // Reset Specific Date to Default Capacity Handler
    const resetDateCapBtn = document.getElementById('btn-reset-date-capacity');
    if (resetDateCapBtn) {
        resetDateCapBtn.addEventListener('click', async () => {
            if (!provCalSelectedDate) return;
            if (provCalData && !provCalData.isSubscriptionActive) {
                showToast('Calendar is locked. An active subscription is required to update availability.', 'warning');
                return;
            }
            const activeBookings = (provCalData.bookings || []).filter(b => {
                const sDate = String(b.ServiceStartDate || b.EventDate || '').trim().split('T')[0];
                const eDate = String(b.ServiceEndDate || sDate).trim().split('T')[0];
                return (provCalSelectedDate >= sDate && provCalSelectedDate <= eDate);
            });
            const bookedCount = activeBookings.length;

            if (provCalData.defaultCapacity < bookedCount) {
                showToast(`⚠️ Cannot reset to default limit (${provCalData.defaultCapacity}): ${bookedCount} booking(s) are already scheduled on this date. Minimum capacity is ${bookedCount}.`, 'warning');
                return;
            }

            try {
                const headers = { 'Authorization': `Bearer ${token}` };
                const res = await fetch(`/api/providers/calendar/date-capacity/${provCalSelectedDate}`, {
                    method: 'DELETE',
                    headers
                });

                const data = await res.json();
                if (res.ok && data.success) {
                    showToast(`Custom override removed. Date now uses default limit (${provCalData.defaultCapacity}).`, 'success');
                    provCalData.capacities = (provCalData.capacities || []).filter(c => c.SpecificDate !== provCalSelectedDate);
                    renderProviderCalendarGrid();
                } else {
                    showToast(data.message || 'Failed to reset date limit.', 'error');
                }
            } catch (err) {
                showToast('Error resetting date limit.', 'error');
            }
        });
    }

    // Auto-refresh calendar on window focus and background poll when active
    window.addEventListener('focus', () => {
        const calView = document.getElementById('view-provider-calendar');
        if (calView && !calView.classList.contains('hidden')) {
            loadProviderCalendarSchedule();
        }
    });

    setInterval(() => {
        const calView = document.getElementById('view-provider-calendar');
        if (calView && !calView.classList.contains('hidden') && document.visibilityState === 'visible') {
            loadProviderCalendarSchedule();
        }
    }, 20000);
    // ------------------------------------------------------------------------
    // Business Permit & Compliance Management
    // ------------------------------------------------------------------------
    let selectedPermitFile = null;

    window.handlePermitFileSelect = (event) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Please select a valid image (JPG, PNG, WEBP) or PDF document.', 'error');
            event.target.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('Document size exceeds 10MB limit. Please upload a smaller file.', 'error');
            event.target.value = '';
            return;
        }

        selectedPermitFile = file;
        const previewStrip = document.getElementById('permit-file-preview-strip');
        const fileNameEl = document.getElementById('permit-file-name');
        if (previewStrip && fileNameEl) {
            fileNameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            previewStrip.classList.remove('hidden');
        }
    };

    window.clearSelectedPermitFile = () => {
        selectedPermitFile = null;
        const fileInput = document.getElementById('input-provider-renewal-file');
        if (fileInput) fileInput.value = '';
        const previewStrip = document.getElementById('permit-file-preview-strip');
        if (previewStrip) previewStrip.classList.add('hidden');
    };

    // Dropzone drag-and-drop
    const dropzone = document.getElementById('permit-upload-dropzone');
    if (dropzone) {
        dropzone.addEventListener('click', () => {
            const fileInput = document.getElementById('input-provider-renewal-file');
            if (fileInput) fileInput.click();
        });

        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#2563eb';
            dropzone.style.background = '#eff6ff';
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.style.borderColor = '#cbd5e1';
            dropzone.style.background = '#f8fafc';
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.borderColor = '#cbd5e1';
            dropzone.style.background = '#f8fafc';
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                const fileInput = document.getElementById('input-provider-renewal-file');
                if (fileInput) {
                    fileInput.files = e.dataTransfer.files;
                    window.handlePermitFileSelect({ target: fileInput });
                }
            }
        });
    }

    const loadProviderPermitStatus = async () => {
        try {
            const res = await fetch('/api/providers/permit-status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!data.success || !data.permit) {
                return;
            }

            const p = data.permit;
            const permitStatus = p.permitStatus || 'Not_Set';
            const daysRemaining = p.daysRemaining;
            const isRenewalPending = (p.PermitRenewalStatus === 'Pending_Review' || p.PermitRenewalStatus === 'Pending');
            const isApprovedAndValid = (p.PermitRenewalStatus === 'Approved' || permitStatus === 'Valid');
            const hasAdminNotice = !!p.PermitNoticeSentAt && !isApprovedAndValid;

            // AUTO POP-UP MODAL: If admin sent a compliance notice (or expired) and renewal is not pending and not already valid
            if ((hasAdminNotice || permitStatus === 'Expired') && !isRenewalPending && !isApprovedAndValid) {
                setTimeout(() => {
                    if (typeof window.openUploadPermitModal === 'function') {
                        window.openUploadPermitModal();
                    }
                }, 600);
            }

            // Overview Dashboard Alert Banner
            const banner = document.getElementById('provider-permit-alert-banner');
            const bannerTitle = document.getElementById('permit-alert-title');
            const bannerDesc = document.getElementById('permit-alert-desc');
            const bannerBtn = document.getElementById('permit-alert-btn');
            const bannerIcon = document.getElementById('permit-alert-icon');
            const bannerIconBox = document.getElementById('permit-alert-icon-box');

            if (banner) {
                if (isRenewalPending) {
                    banner.classList.remove('hidden');
                    banner.style.background = '#eff6ff';
                    banner.style.borderColor = '#bfdbfe';
                    if (bannerIconBox) { bannerIconBox.style.background = '#dbeafe'; bannerIconBox.style.color = '#2563eb'; }
                    if (bannerIcon) bannerIcon.className = 'fa-solid fa-hourglass-half';
                    if (bannerTitle) bannerTitle.textContent = 'Permit Submitted for Review';
                    if (bannerDesc) bannerDesc.textContent = 'Your business permit has been submitted and is currently being verified by the administrator.';
                    if (bannerBtn) {
                        bannerBtn.textContent = 'Re-upload Permit';
                        bannerBtn.style.background = '#2563eb';
                        bannerBtn.style.color = '#fff';
                    }
                } else if ((hasAdminNotice || permitStatus === 'Expired') && !isApprovedAndValid) {
                    banner.classList.remove('hidden');
                    banner.style.background = '#fef2f2';
                    banner.style.borderColor = '#fecaca';
                    if (bannerIconBox) { bannerIconBox.style.background = '#fee2e2'; bannerIconBox.style.color = '#dc2626'; }
                    if (bannerIcon) bannerIcon.className = 'fa-solid fa-triangle-exclamation';
                    if (bannerTitle) bannerTitle.textContent = 'Action Required: Submit Business Permit';
                    if (bannerDesc) bannerDesc.textContent = 'The administrator has issued a notice requesting your updated business permit with issued and expiration dates.';
                    if (bannerBtn) {
                        bannerBtn.textContent = 'Upload Permit Now';
                        bannerBtn.style.background = '#dc2626';
                        bannerBtn.style.color = '#fff';
                    }
                } else if (permitStatus === 'Expiring_Soon') {
                    banner.classList.remove('hidden');
                    banner.style.background = '#fffbeb';
                    banner.style.borderColor = '#fde68a';
                    if (bannerIconBox) { bannerIconBox.style.background = '#fef3c7'; bannerIconBox.style.color = '#d97706'; }
                    if (bannerIcon) bannerIcon.className = 'fa-solid fa-triangle-exclamation';
                    if (bannerTitle) bannerTitle.textContent = 'Business Permit Expiring Soon';
                    if (bannerDesc) bannerDesc.textContent = `Your registered business permit will expire in ${daysRemaining} day(s). Please submit your renewed permit.`;
                    if (bannerBtn) {
                        bannerBtn.textContent = 'Upload Permit';
                        bannerBtn.style.background = '#d97706';
                        bannerBtn.style.color = '#fff';
                    }
                } else {
                    banner.classList.add('hidden');
                }
            }

        } catch (err) {
            console.error('Error loading provider permit status:', err);
        }
    };

    window.submitProviderPermitRenewal = async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('input-provider-renewal-file');
        const file = selectedPermitFile || (fileInput && fileInput.files ? fileInput.files[0] : null);

        if (!file) {
            showToast('Please attach a copy of your renewed municipal permit (image or PDF).', 'error');
            return;
        }

        const expiryDateInput = document.getElementById('input-provider-renewal-expiry');
        const expiryDate = expiryDateInput ? expiryDateInput.value : '';

        if (!expiryDate) {
            showToast('Please select the new expiration date stated on your renewed permit.', 'error');
            if (expiryDateInput) expiryDateInput.focus();
            return;
        }

        const parsedDate = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate <= today) {
            showToast('The expiration date must be in the future.', 'error');
            if (expiryDateInput) expiryDateInput.focus();
            return;
        }

        const btnSubmit = document.getElementById('btn-submit-permit-renewal');
        const origBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Renewal...';
        }

        try {
            const formData = new FormData();
            formData.append('permitFile', file);
            formData.append('expiryDate', expiryDate);

            const issuedDateInput = document.getElementById('input-provider-renewal-issued');
            if (issuedDateInput && issuedDateInput.value) {
                formData.append('issuedDate', issuedDateInput.value);
            }

            const refNumberInput = document.getElementById('input-provider-renewal-number');
            if (refNumberInput && refNumberInput.value) {
                formData.append('permitNumber', refNumberInput.value.trim());
            }

            const res = await fetch('/api/providers/permit-renewal', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Permit renewal submitted! Our team will verify it shortly.', 'success');
                window.clearSelectedPermitFile();
                if (expiryDateInput) expiryDateInput.value = '';
                if (refNumberInput) refNumberInput.value = '';
                await loadProviderPermitStatus();
            } else {
                showToast(data.message || 'Failed to submit permit renewal.', 'error');
            }
        } catch (err) {
            console.error('Error submitting permit renewal:', err);
            showToast('Network error while submitting renewal. Please try again.', 'error');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = origBtnHtml;
            }
        }
    };

    const btnRefreshPermit = document.getElementById('btn-refresh-provider-permit');
    if (btnRefreshPermit) {
        btnRefreshPermit.addEventListener('click', () => {
            showToast('Refreshing permit status...', 'info');
            loadProviderPermitStatus();
        });
    }



    // Initial Data Fetch
    await loadDashboardData();
    await loadPackages();
    await loadProviderCalendarSchedule();
        await loadProviderPermitStatus();
    switchProviderView(window.location.hash);
});


    // -------------------------------------------------------------
    // Business Permit Upload Modal Logic
    // -------------------------------------------------------------
    let modalSelectedPermitFile = null;

    window.openUploadPermitModal = () => {
        const modal = document.getElementById('modal-provider-upload-permit');
        if (modal) {
            modal.classList.remove('hidden');
        }
    };

    window.closeUploadPermitModal = () => {
        const modal = document.getElementById('modal-provider-upload-permit');
        if (modal) modal.classList.add('hidden');
    };

    window.handleModalPermitFileSelect = (event) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Please select a valid image (JPG, PNG, WEBP) or PDF document.', 'error');
            event.target.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('Document size exceeds 10MB limit. Please upload a smaller file.', 'error');
            event.target.value = '';
            return;
        }

        modalSelectedPermitFile = file;
        const previewStrip = document.getElementById('modal-permit-preview-strip');
        const fileNameEl = document.getElementById('modal-permit-file-name');
        if (previewStrip && fileNameEl) {
            fileNameEl.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
            previewStrip.classList.remove('hidden');
        }
    };

    window.clearModalPermitFile = () => {
        modalSelectedPermitFile = null;
        const fileInput = document.getElementById('modal-input-permit-file');
        if (fileInput) fileInput.value = '';
        const previewStrip = document.getElementById('modal-permit-preview-strip');
        if (previewStrip) previewStrip.classList.add('hidden');
    };

    window.submitModalPermitUpload = async (event) => {
        if (event) event.preventDefault();
        const fileInput = document.getElementById('modal-input-permit-file');
        const file = modalSelectedPermitFile || (fileInput && fileInput.files ? fileInput.files[0] : null);

        const notify = (msg, type = 'success') => {
            if (typeof showToast === 'function') showToast(msg, type);
            else if (typeof window.showToast === 'function') window.showToast(msg, type);
            else alert(msg);
        };

        if (!file) {
            notify('Please attach a copy or photo of your business permit.', 'error');
            return;
        }

        const expiryDateInput = document.getElementById('modal-permit-expiry-date');
        const expiryDate = expiryDateInput ? expiryDateInput.value : '';

        if (!expiryDate) {
            notify('Please select the expiration date stated on your permit.', 'error');
            if (expiryDateInput) expiryDateInput.focus();
            return;
        }

        const parsedDate = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate <= today) {
            notify('The expiration date must be in the future.', 'error');
            if (expiryDateInput) expiryDateInput.focus();
            return;
        }

        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken)
            ? SoundSphereAPI.getAuthToken()
            : (localStorage.getItem('soundsphere_auth_token') || sessionStorage.getItem('soundsphere_auth_token') || '');

        if (!token) {
            notify('Authentication session expired. Please log in again.', 'error');
            return;
        }

        const issuedDateInput = document.getElementById('modal-permit-issued-date');
        const issuedDate = issuedDateInput ? issuedDateInput.value : '';

        const permitNumberInput = document.getElementById('modal-permit-number');
        const permitNumber = permitNumberInput ? permitNumberInput.value.trim() : '';

        const btnSubmit = document.getElementById('btn-submit-modal-permit');
        const origBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Permit...';
        }

        try {
            const formData = new FormData();
            formData.append('permitFile', file);
            formData.append('expiryDate', expiryDate);
            if (issuedDate) formData.append('issuedDate', issuedDate);
            if (permitNumber) formData.append('permitNumber', permitNumber);

            const res = await fetch('/api/providers/permit-renewal', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            let data = {};
            try {
                data = await res.json();
            } catch (jsonErr) {
                data = { success: false, message: `Server responded with HTTP ${res.status}` };
            }

            if (res.ok && data.success) {
                notify('✓ Business permit submitted! Our compliance team will review it shortly.', 'success');
                window.clearModalPermitFile();
                if (expiryDateInput) expiryDateInput.value = '';
                if (issuedDateInput) issuedDateInput.value = '';
                window.closeUploadPermitModal();
                if (typeof loadProviderPermitStatus === 'function') {
                    await loadProviderPermitStatus();
                }
            } else {
                notify(data.message || 'Failed to submit business permit.', 'error');
            }
        } catch (err) {
            console.error('Error submitting permit modal:', err);
            notify(err.message || 'Error submitting permit. Please try again.', 'error');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = origBtnHtml;
            }
        }
    };

    // Modal Dropzone wiring
    const initModalDropzone = () => {
        const modalDropzone = document.getElementById('modal-permit-dropzone');
        if (modalDropzone) {
            modalDropzone.onclick = () => {
                const fileInput = document.getElementById('modal-input-permit-file');
                if (fileInput) fileInput.click();
            };
            modalDropzone.ondragover = (e) => {
                e.preventDefault();
                modalDropzone.style.borderColor = '#2563eb';
                modalDropzone.style.background = '#eff6ff';
            };
            modalDropzone.ondragleave = () => {
                modalDropzone.style.borderColor = '#93c5fd';
                modalDropzone.style.background = '#f8fafc';
            };
            modalDropzone.ondrop = (e) => {
                e.preventDefault();
                modalDropzone.style.borderColor = '#93c5fd';
                modalDropzone.style.background = '#f8fafc';
                if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                    const fileInput = document.getElementById('modal-input-permit-file');
                    if (fileInput) {
                        fileInput.files = e.dataTransfer.files;
                        window.handleModalPermitFileSelect({ target: fileInput });
                    }
                }
            };
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initModalDropzone);
    } else {
        initModalDropzone();
    }
