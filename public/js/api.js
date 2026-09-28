/**
 * SoundSphere - Global API Service Module (Vanilla JS ES6)
 * Handles all backend HTTP REST communications, JWT Token storage, and session management
 */

const SoundSphereAPI = (() => {
    // API Configuration
    const BASE_URL = '/api';

    const TOKEN_KEY = 'soundsphere_jwt_token';
    const USER_KEY = 'soundsphere_user_info';

    /**
     * Retrieve stored JWT token across all known key aliases
     * @returns {string}
     */
    const getAuthToken = () => {
        return localStorage.getItem(TOKEN_KEY) ||
               localStorage.getItem('soundsphere_token') ||
               localStorage.getItem('soundsphere_auth_token') ||
               localStorage.getItem('token') ||
               sessionStorage.getItem(TOKEN_KEY) ||
               sessionStorage.getItem('soundsphere_token') ||
               sessionStorage.getItem('soundsphere_auth_token') ||
               sessionStorage.getItem('token') || '';
    };

    /**
     * Retrieve authenticated user details across all known key aliases
     * @returns {object|null}
     */
    const getAuthUser = () => {
        const userStr = localStorage.getItem(USER_KEY) ||
                        localStorage.getItem('soundsphere_user') ||
                        localStorage.getItem('soundsphere_user_info') ||
                        sessionStorage.getItem(USER_KEY) ||
                        sessionStorage.getItem('soundsphere_user') ||
                        sessionStorage.getItem('soundsphere_user_info');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch (e) {
            return null;
        }
    };

    /**
     * Store Auth Token & User object in Storage (populating all token aliases)
     * @param {string} token 
     * @param {object} user 
     * @param {boolean} rememberMe 
     */
    const setAuthSession = (token, user, rememberMe = true) => {
        // Clear previous account cache to ensure clean session isolation
        localStorage.removeItem('soundsphere_profile_avatar');
        localStorage.removeItem('soundsphere_user_name');
        localStorage.removeItem('soundsphere_user_info');
        localStorage.removeItem('soundsphere_user');
        localStorage.removeItem('soundsphere_user_email');
        sessionStorage.removeItem('soundsphere_profile_avatar');
        sessionStorage.removeItem('soundsphere_user_name');
        sessionStorage.removeItem('soundsphere_user_info');
        sessionStorage.removeItem('soundsphere_user');
        sessionStorage.removeItem('soundsphere_user_email');

        const storage = rememberMe ? localStorage : sessionStorage;
        if (token) {
            storage.setItem(TOKEN_KEY, token);
            storage.setItem('soundsphere_jwt_token', token);
            storage.setItem('soundsphere_token', token);
            storage.setItem('soundsphere_auth_token', token);
            storage.setItem('token', token);
        }

        if (user) {
            const userJson = JSON.stringify(user);
            storage.setItem(USER_KEY, userJson);
            storage.setItem('soundsphere_user_info', userJson);
            storage.setItem('soundsphere_user', userJson);

            const displayName = user.personalName || user.clientName || user.name || `${user.ClientFirstName || user.firstName || ''} ${user.ClientLastName || user.lastName || ''}`.trim() || user.email || user.Email || 'Account';
            storage.setItem('soundsphere_user_name', displayName);
            storage.setItem('soundsphere_user_email', user.email || user.Email || '');
        }
    };

    /**
     * Helper to compute user display name consistently
     */
    const getUserDisplayName = (user) => {
        const activeUser = user || getAuthUser() || {};
        const nameFromStorage = localStorage.getItem('soundsphere_user_name');
        return activeUser.personalName ||
               activeUser.clientName ||
               activeUser.name ||
               (activeUser.firstName ? `${activeUser.firstName} ${activeUser.lastName || ''}`.trim() : '') ||
               (activeUser.ClientFirstName ? `${activeUser.ClientFirstName} ${activeUser.ClientLastName || ''}`.trim() : '') ||
               nameFromStorage ||
               activeUser.email ||
               activeUser.Email ||
               'User Account';
    };

    /**
     * Helper to compute user avatar initials consistently
     */
    const getUserInitials = (user) => {
        const name = getUserDisplayName(user);
        const parts = name.split(' ').filter(Boolean);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase() || 'UA';
    };

    /**
     * Clear Auth Tokens and User Session (Logout)
     */
    const clearAuthSession = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('soundsphere_jwt_token');
        localStorage.removeItem('soundsphere_token');
        localStorage.removeItem('soundsphere_auth_token');
        localStorage.removeItem('token');
        localStorage.removeItem('soundsphere_user_name');
        localStorage.removeItem('soundsphere_user_email');
        localStorage.removeItem('soundsphere_user_info');
        localStorage.removeItem('soundsphere_user');
        localStorage.removeItem('soundsphere_profile_avatar');
        sessionStorage.clear();
        localStorage.clear();
    };

    /**
     * Generic HTTP Request Wrapper
     * @param {string} endpoint 
     * @param {object} options 
     * @returns {Promise<object>}
     */
    const request = async (endpoint, options = {}) => {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = getAuthToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'An API error occurred.');
                error.status = response.status;
                error.data = data;
                error.requiresVerification = data.requiresVerification;
                error.devOtpCode = data.devOtpCode;
                throw error;
            }

            return data;
        } catch (err) {
            console.error(` API Request Failed [${endpoint}]:`, err.message);
            throw err;
        }
    };

    // Public API Methods
    return {
        getAuthToken,
        getAuthUser,
        getCurrentUser: getAuthUser,
        getUserDisplayName,
        getUserInitials,
        setAuthSession,
        clearAuthSession,

        // Authentication Methods
        registerAPI: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
        verifyOTPAPI: (email, otp) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
        resendOTPAPI: (email) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) }),
        loginAPI: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        
        /**
         * Perform full End-to-End Logout Function
         * Sends backend POST /api/auth/logout request, clears session tokens, and redirects to login page.
         */
        logoutAPI: async () => {
            try {
                await request('/auth/logout', { method: 'POST' });
            } catch (e) {
                console.warn('Backend logout API notice:', e.message);
            } finally {
                clearAuthSession();
                window.location.href = '/login.html?logout=true';
            }
        }
    };
})();

// Attach to window for global availability
window.SoundSphereAPI = SoundSphereAPI;

/**
 * SoundSphere - Reusable Toast Notification System
 * Replaces browser-native alert() and confirm() popups across the entire application.
 * Supports: 'success' (✓), 'error' (✕), 'warning' (⚠), 'info' (ℹ).
 */
window.showToast = (message, type = 'info', duration = 3500) => {
    let container = document.getElementById('soundsphere-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'soundsphere-toast-container';
        container.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 380px;
            width: 90vw;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.style.cssText = `
        pointer-events: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 18px;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 10px 30px rgba(10, 25, 47, 0.18);
        border: 1px solid #e2e8f0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 0.9rem;
        font-weight: 600;
        color: #0a192f;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;

    let iconBg = '#2563eb';
    let iconSymbol = 'ℹ';

    switch (type.toLowerCase()) {
        case 'success':
            iconBg = '#10b981';
            iconSymbol = '✓';
            toast.style.borderLeft = '4px solid #10b981';
            break;
        case 'error':
            iconBg = '#ef4444';
            iconSymbol = '✕';
            toast.style.borderLeft = '4px solid #ef4444';
            break;
        case 'warning':
            iconBg = '#f59e0b';
            iconSymbol = '⚠';
            toast.style.borderLeft = '4px solid #f59e0b';
            break;
        default:
            iconBg = '#2563eb';
            iconSymbol = 'ℹ';
            toast.style.borderLeft = '4px solid #2563eb';
            break;
    }

    toast.innerHTML = `
        <div style="width: 28px; height: 28px; border-radius: 50%; background: ${iconBg}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; flex-shrink: 0;">
            ${iconSymbol}
        </div>
        <div style="flex: 1; line-height: 1.35; word-break: break-word;">${message}</div>
        <button type="button" style="background: none; border: none; color: #94a3b8; font-size: 1.1rem; cursor: pointer; padding: 0 4px; line-height: 1;" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);

    // Trigger Slide-in Animation
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(0)';
        toast.style.opacity = '1';
    });

    // Auto Dismiss after duration
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

window.SoundSphereToast = {
    success: (msg, dur) => window.showToast(msg, 'success', dur),
    error: (msg, dur) => window.showToast(msg, 'error', dur),
    warning: (msg, dur) => window.showToast(msg, 'warning', dur),
    info: (msg, dur) => window.showToast(msg, 'info', dur)
};

/**
 * ZERO NATIVE DIALOG ENFORCEMENT OVERRIDES
 * Overrides window.alert(), window.confirm(), and window.prompt() globally.
 * Ensures zero browser popups ("localhost:5000 says") occur anywhere in SoundSphere.
 */
window.alert = function(msg) {
    if (typeof window.showToast === 'function') {
        window.showToast(msg || 'Notice', 'info', 3500);
    } else {
        console.log('[Native Alert Prevented]:', msg);
    }
};

window.confirm = function(msg) {
    console.log('[Native Confirm Prevented - Auto Approved]:', msg);
    return true;
};

window.prompt = function(msg, defaultText) {
    console.log('[Native Prompt Prevented]:', msg);
    return defaultText || '';
};

