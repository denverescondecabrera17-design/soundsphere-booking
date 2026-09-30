/**
 * SoundSphere - Profile & Avatar Controller (Vanilla JS ES6)
 * Handles profile picture selection, local Base64/DataURL preview, instant multi-avatar header updates,
 * backend REST submission, and multi-session persistence across refreshes and page navigation.
 */

// Global Function to Update All Avatars Across Pages & Views
window.updateAllProfileAvatars = (avatarUrl, name) => {
    const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : {};
    const displayName = name || localStorage.getItem('soundsphere_user_name') || activeUser.name || activeUser.email || 'User Account';
    const initials = displayName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'UA';

    let fullAvatarUrl = avatarUrl;
    if (avatarUrl && !avatarUrl.startsWith('http') && !avatarUrl.startsWith('data:')) {
        fullAvatarUrl = `http://localhost:5000/${avatarUrl.replace(/^\//, '')}`;
    }

    // 1. Profile Page Main Header Avatar (#profile-page-avatar)
    const profilePageAvatar = document.getElementById('profile-page-avatar');
    if (profilePageAvatar) {
        if (fullAvatarUrl) {
            profilePageAvatar.innerHTML = `<img src="${fullAvatarUrl}" alt="${displayName}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            profilePageAvatar.innerHTML = `<span id="profile-avatar-initials">${initials}</span>`;
        }
    }

    // 2. Top Navigation Bar User Avatar (#avatar-btn .avatar-img, .avatar-circle, #user-avatar-initials)
    const navAvatarContainers = document.querySelectorAll('#user-avatar-initials, .avatar-img, .avatar-circle');
    navAvatarContainers.forEach(container => {
        if (fullAvatarUrl) {
            container.innerHTML = `<img src="${fullAvatarUrl}" alt="${displayName}" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
        } else {
            container.textContent = initials;
        }
    });

    // 3. Display Name Labels Across Header and Profile
    const nameLabels = document.querySelectorAll('#user-display-name, #profile-user-fullname, .avatar-name, .user-name');
    nameLabels.forEach(label => {
        if (label) label.textContent = displayName;
    });

    // 4. Edit Profile Modal Avatar Preview & Fallback
    const avatarPreviewImg = document.getElementById('profile-avatar-preview-img');
    const avatarInitialsFallback = document.getElementById('profile-avatar-initials-fallback');
    if (avatarPreviewImg && avatarInitialsFallback) {
        if (fullAvatarUrl) {
            avatarPreviewImg.src = fullAvatarUrl;
            avatarPreviewImg.style.display = 'block';
            avatarInitialsFallback.style.display = 'none';
        } else {
            avatarPreviewImg.style.display = 'none';
            avatarInitialsFallback.textContent = initials;
            avatarInitialsFallback.style.display = 'flex';
        }
    }
};

// Global Function to Synchronize All Profile UI Elements Across Header, Settings Card, Modal Inputs, and Avatars
window.syncAllProfileUI = (userData = {}) => {
    const firstName = userData.firstName || userData.ClientFirstName || '';
    const middleName = userData.middleName || userData.ClientMiddleName || '';
    const lastName = userData.lastName || userData.ClientLastName || '';
    const personalName = userData.personalName || userData.clientName || `${firstName}${middleName ? ' ' + middleName : ''}${lastName ? ' ' + lastName : ''}`.trim() || userData.name || userData.email || userData.Email || 'User Account';
    const businessName = userData.businessName || userData.BusinessName || '';
    const email = userData.email || userData.Email || '';
    const phone = userData.phone || userData.Phone || '';
    const address = userData.address || userData.ClientAddress || '';
    const avatarUrl = userData.avatar || userData.ProfilePicture || null;
    const isApprovedProvider = Boolean(businessName || userData.role === 'ServiceProvider' || userData.RoleName === 'ServiceProvider');

    // 1. Profile Header Elements
    const elHeaderName = document.getElementById('profile-user-fullname');
    const elHeaderEmail = document.getElementById('profile-user-email');
    const elHeaderPhone = document.getElementById('profile-user-phone');
    const elHeaderAddress = document.getElementById('profile-user-address');

    if (elHeaderName) {
        if (businessName) {
            elHeaderName.innerHTML = `
                <div style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
                    <span style="font-size:1.4rem; font-weight:800; color:#0a192f;">${personalName}</span>
                    <span style="font-size:0.95rem; font-weight:700; color:#2563eb; display:flex; align-items:center; gap:6px;">
                        <i class="fa-solid fa-store" style="font-size:0.85rem;"></i> ${businessName}
                    </span>
                </div>
            `;
        } else {
            elHeaderName.textContent = personalName;
        }
    }
    if (elHeaderEmail) elHeaderEmail.textContent = email;
    if (elHeaderPhone) elHeaderPhone.textContent = phone;
    if (elHeaderAddress) elHeaderAddress.textContent = address;

    // 2. Account Settings Card Elements
    const elSettingsName = document.getElementById('settings-user-fullname');
    const elSettingsEmail = document.getElementById('settings-user-email');
    const elSettingsPhone = document.getElementById('settings-user-phone');
    const elSettingsAddress = document.getElementById('settings-user-address');
    const elSettingsUsername = document.getElementById('settings-user-username');

    if (elSettingsName) elSettingsName.textContent = personalName;
    if (elSettingsEmail) elSettingsEmail.textContent = email;
    if (elSettingsPhone) elSettingsPhone.textContent = phone;
    if (elSettingsAddress) elSettingsAddress.textContent = address;
    if (elSettingsUsername) elSettingsUsername.textContent = email;

    // Update Top Navigation Bar User Name & Dropdown Items
    const elUserDisplayName = document.getElementById('user-display-name');
    const elDropdownTitle = document.getElementById('dropdown-user-title');
    const elDropdownRole = document.getElementById('dropdown-user-role');
    const elProviderLink = document.getElementById('dropdown-provider-dashboard-link');

    if (elUserDisplayName) elUserDisplayName.textContent = personalName;
    if (elDropdownTitle) elDropdownTitle.textContent = personalName;
    if (elDropdownRole) {
        if (businessName) {
            elDropdownRole.innerHTML = `<span style="font-weight:700; color:#2563eb;"><i class="fa-solid fa-store" style="font-size:0.8rem;"></i> ${businessName}</span> • Approved Provider`;
        } else {
            elDropdownRole.textContent = 'Verified Client';
        }
    }
    if (elProviderLink) {
        if (isApprovedProvider) {
            elProviderLink.classList.remove('hidden');
        } else {
            elProviderLink.classList.add('hidden');
        }
    }

    // 3. Edit Profile Modal Form Inputs
    const inputFirstName = document.getElementById('profile-firstname');
    const inputMiddleName = document.getElementById('profile-middlename');
    const inputLastName = document.getElementById('profile-lastname');
    const inputEmail = document.getElementById('profile-email');
    const inputPhone = document.getElementById('profile-phone');
    const inputAddress = document.getElementById('profile-address');

    if (inputFirstName) inputFirstName.value = firstName;
    if (inputMiddleName) inputMiddleName.value = middleName;
    if (inputLastName) inputLastName.value = lastName;
    if (inputEmail) inputEmail.value = email;
    if (inputPhone) inputPhone.value = phone;
    if (inputAddress) inputAddress.value = address;

    // 4. Email Verified Tag
    const elVerifiedTag = document.getElementById('profile-email-verified-tag');
    if (elVerifiedTag) {
        const isVerified = userData.emailVerified === true || userData.EmailVerified === 1 || userData.EmailVerified === true || userData.EmailVerified === '1';
        if (isVerified) {
            elVerifiedTag.style.display = 'inline-flex';
            elVerifiedTag.className = 'email-verified-label-tag';
            elVerifiedTag.style.background = '';
            elVerifiedTag.style.color = '';
            elVerifiedTag.style.padding = '';
            elVerifiedTag.innerHTML = '<i class="fa-solid fa-check"></i> Verified';
        } else {
            elVerifiedTag.style.display = 'none';
            elVerifiedTag.innerHTML = '';
        }
    }

    // 5. Avatars Across DOM
    if (typeof window.updateAllProfileAvatars === 'function') {
        window.updateAllProfileAvatars(avatarUrl, personalName);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements for Profile Modal
    const profileModal = document.getElementById('profile-settings-modal');
    const profileCloseBtn = document.getElementById('profile-close-btn');
    const profileForm = document.getElementById('profile-settings-form');
    
    // Form Inputs
    const inputFirstName = document.getElementById('profile-firstname');
    const inputMiddleName = document.getElementById('profile-middlename');
    const inputLastName = document.getElementById('profile-lastname');
    const inputEmail = document.getElementById('profile-email');
    const inputPhone = document.getElementById('profile-phone');
    const inputAddress = document.getElementById('profile-address');
    
    // Avatar Upload Triggers
    const profilePictureInput = document.getElementById('profile-picture-input');
    const btnSelectImage = document.getElementById('btn-select-image');
    const btnChangeAvatar = document.getElementById('btn-change-avatar');
    const btnSaveProfile = document.getElementById('btn-save-profile');

    // Triggers across views
    const myAccountTriggers = document.querySelectorAll('.my-account-trigger, #my-account-btn');

    let selectedAvatarDataUrl = null;
    let selectedAvatarFile = null;

    // Retrieve Active User from API Module or LocalStorage
    const getActiveUser = () => {
        if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthUser) {
            return SoundSphereAPI.getAuthUser();
        }
        const storedStr = localStorage.getItem('soundsphere_user_info');
        try {
            return storedStr ? JSON.parse(storedStr) : null;
        } catch (e) {
            return null;
        }
    };

    // Load Saved Profile Avatar & Data on Page Load dynamically from backend API
    const loadProfileData = async () => {
        const user = getActiveUser() || {};
        const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;

        let liveProfile = null;
        if (user.userId || token) {
            try {
                const queryParam = user.userId ? `?userId=${user.userId}` : '';
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                const res = await fetch(`/api/users/profile${queryParam}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data.success && data.user) {
                        liveProfile = data.user;
                    }
                }
            } catch (err) {
                console.warn('Live profile fetch notice:', err.message);
            }
        }

        const profilePayload = liveProfile ? {
            userId: liveProfile.userId || liveProfile.UserID || user.userId,
            email: liveProfile.email || liveProfile.Email || user.email || '',
            phone: liveProfile.phone || liveProfile.Phone || user.phone || '',
            role: liveProfile.role || liveProfile.RoleName || user.role || 'Client',
            firstName: liveProfile.firstName || liveProfile.ClientFirstName || user.firstName || '',
            middleName: liveProfile.middleName || liveProfile.ClientMiddleName || user.middleName || '',
            lastName: liveProfile.lastName || liveProfile.ClientLastName || user.lastName || '',
            address: liveProfile.address || liveProfile.ClientAddress || user.address || '',
            personalName: liveProfile.personalName || liveProfile.name || user.personalName || user.name || '',
            clientName: liveProfile.clientName || liveProfile.name || user.clientName || user.name || '',
            name: liveProfile.name || user.name || '',
            businessName: liveProfile.businessName || liveProfile.BusinessName || user.businessName || '',
            avatar: liveProfile.profilePicture || liveProfile.avatar || liveProfile.ProfilePicture || user.avatar || user.profilePicture || null,
            profilePicture: liveProfile.profilePicture || liveProfile.avatar || liveProfile.ProfilePicture || user.avatar || user.profilePicture || null,
            emailVerified: liveProfile.emailVerified !== undefined ? liveProfile.emailVerified : user.emailVerified
        } : user;

        // Synchronize all Profile UI elements simultaneously
        if (typeof window.syncAllProfileUI === 'function') {
            window.syncAllProfileUI(profilePayload);
        }
    };

    window.loadProfileData = loadProfileData;

    // Automatically synchronize profile name and avatar across all pages on initial load
    loadProfileData();

    // Open Profile Modal
    const openProfileModal = () => {
        if (!profileModal) return;
        loadProfileData();
        profileModal.classList.remove('hidden');
    };

    // Close Profile Modal
    const closeProfileModal = () => {
        if (!profileModal) return;
        profileModal.classList.add('hidden');
    };

    // Attach Open Modal Event Listeners
    myAccountTriggers.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            openProfileModal();
        });
    });

    if (profileCloseBtn) profileCloseBtn.addEventListener('click', closeProfileModal);
    if (profileModal) {
        profileModal.addEventListener('click', (e) => {
            if (e.target === profileModal) closeProfileModal();
        });
    }

    // Trigger Hidden File Picker
    if (btnSelectImage && profilePictureInput) {
        btnSelectImage.addEventListener('click', () => profilePictureInput.click());
    }
    if (btnChangeAvatar && profilePictureInput) {
        btnChangeAvatar.addEventListener('click', () => profilePictureInput.click());
    }

    // Handle Profile Picture Selection & Instant Live Preview
    if (profilePictureInput) {
        profilePictureInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate File Size (Max 1 MB)
            if (file.size > 1 * 1024 * 1024) {
                showToast('⚠ Profile image file size must be less than 1 MB.', 'warning');
                profilePictureInput.value = '';
                return;
            }

            // Validate File Format
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                showToast('⚠ Invalid image format. Please select a .JPEG, .PNG, or .WEBP file.', 'warning');
                profilePictureInput.value = '';
                return;
            }

            selectedAvatarFile = file;

            // Read Image as DataURL & Update Avatars Live
            const reader = new FileReader();
            reader.onload = (event) => {
                selectedAvatarDataUrl = event.target.result;
                const firstName = inputFirstName ? inputFirstName.value.trim() : '';
                const lastName = inputLastName ? inputLastName.value.trim() : '';
                const displayName = `${firstName} ${lastName}`.trim() || 'User Account';

                // Immediately update headers and previews with live preview
                window.updateAllProfileAvatars(selectedAvatarDataUrl, displayName);
            };
            reader.readAsDataURL(file);
        });
    }

    // Save Profile Form Submission
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const firstName = inputFirstName ? inputFirstName.value.trim() : '';
            const middleName = inputMiddleName ? inputMiddleName.value.trim() : '';
            const lastName = inputLastName ? inputLastName.value.trim() : '';
            const email = inputEmail ? inputEmail.value.trim() : '';
            const phone = inputPhone ? inputPhone.value.trim() : '';
            const address = inputAddress ? inputAddress.value.trim() : '';
            const displayName = `${firstName} ${lastName}`.trim() || 'User Profile';

            const user = getActiveUser() || {};
            const userId = user.userId;

            try {
                if (btnSaveProfile) {
                    btnSaveProfile.disabled = true;
                    btnSaveProfile.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving...`;
                }

                // Construct FormData with all updated attributes including email
                const formData = new FormData();
                if (userId) formData.append('userId', userId);
                formData.append('email', email);
                formData.append('firstName', firstName);
                formData.append('middleName', middleName);
                formData.append('lastName', lastName);
                formData.append('phone', phone);
                formData.append('address', address);
                if (selectedAvatarFile) {
                    formData.append('avatarFile', selectedAvatarFile);
                }

                const token = (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.getAuthToken) ? SoundSphereAPI.getAuthToken() : null;
                const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

                const response = await fetch('/api/users/profile', {
                    method: 'POST',
                    headers,
                    body: formData
                });

                const resData = await response.json();

                if (!response.ok || !resData.success) {
                    showToast(`✕ ${resData.message || 'Failed to update profile settings.'}`, 'error');
                    return;
                }

                const updatedUser = resData.user;

                // Update Auth Session Data in Local Storage
                if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.setAuthSession) {
                    SoundSphereAPI.setAuthSession(token || 'demo_token', updatedUser, true);
                }

                // Immediately update all Profile UI elements simultaneously across Header, Settings Card, Inputs, and Avatars
                if (typeof window.syncAllProfileUI === 'function') {
                    window.syncAllProfileUI(updatedUser);
                }

                showToast('✓ Profile Information and Email Address Updated Successfully!', 'success');
                closeProfileModal();
            } catch (err) {
                console.warn('Backend profile save error:', err.message);
                showToast(`✕ Error saving profile: ${err.message}`, 'error');
            } finally {
                if (btnSaveProfile) {
                    btnSaveProfile.disabled = false;
                    btnSaveProfile.innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Save Changes`;
                }
            }
        });
    }

    // Initial Load of Profile Data & Avatar on Page Load
    loadProfileData();
});
