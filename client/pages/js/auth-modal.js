/**
 * SoundSphere - Universal Authentication Redirect Helper
 * Directly redirects unauthenticated visitors to login/register without popup modal.
 */

window.openAuthModal = (initialTab = 'login', pendingBookingInfo = null) => {
    // Remove any leftover modal from DOM if present
    const existing = document.getElementById('modal-auth-login-container');
    if (existing) existing.remove();

    let returnUrl = '/marketplace.html';
    if (pendingBookingInfo) {
        sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBookingInfo));
        sessionStorage.setItem('soundsphere_selected_package', JSON.stringify(pendingBookingInfo));
        if (pendingBookingInfo.returnUrl) {
            returnUrl = pendingBookingInfo.returnUrl;
        } else if (pendingBookingInfo.providerId) {
            returnUrl = `/booking.html?package_id=${pendingBookingInfo.packageId || ''}&provider_id=${pendingBookingInfo.providerId}`;
        }
    }

    const target = initialTab === 'register' 
        ? `/register.html?returnUrl=${encodeURIComponent(returnUrl)}` 
        : `/login.html?returnUrl=${encodeURIComponent(returnUrl)}`;

    window.location.href = target;
};
