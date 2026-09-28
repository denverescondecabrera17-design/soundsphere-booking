/**
 * SoundSphere - Forgot Password UI Controller
 * Handles email verification request and redirects to reset-password.html with reset code
 */

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-password-form');
    const alertBanner = document.getElementById('alert-banner');
    const alertIcon = document.getElementById('alert-icon');
    const alertMessage = document.getElementById('alert-message');
    const btnForgotSubmit = document.getElementById('btn-forgot-submit');
    const forgotSpinner = document.getElementById('forgot-spinner');

    const showAlert = (message, type = 'error') => {
        if (!alertBanner || !alertMessage || !alertIcon) return;
        alertMessage.textContent = message;
        alertBanner.className = `alert-banner ${type}`;
        alertIcon.className = type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check';
        alertBanner.classList.remove('hidden');
    };

    const clearErrors = () => {
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    };

    const setLoading = (isLoading) => {
        if (!btnForgotSubmit) return;
        btnForgotSubmit.disabled = isLoading;
        const btnText = btnForgotSubmit.querySelector('.btn-text');
        const btnIcon = btnForgotSubmit.querySelector('.btn-icon');
        if (isLoading) {
            if (btnText) btnText.textContent = 'Sending Request...';
            if (btnIcon) btnIcon.classList.add('hidden');
            if (forgotSpinner) forgotSpinner.classList.remove('hidden');
        } else {
            if (btnText) btnText.textContent = 'Send Reset Link';
            if (btnIcon) btnIcon.classList.remove('hidden');
            if (forgotSpinner) forgotSpinner.classList.add('hidden');
        }
    };

    if (forgotForm) {
        forgotForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            const emailInput = document.getElementById('forgot-email');
            const email = emailInput ? emailInput.value.trim() : '';

            if (!email) {
                document.getElementById('error-forgot-email').textContent = 'Please enter your email address.';
                return;
            }

            try {
                setLoading(true);
                const response = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();
                setLoading(false);

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to process password reset request.');
                }

                if (emailInput) emailInput.value = '';
                showAlert(data.message || 'Password reset link sent! Please check your Gmail inbox and Spam folder.', 'success');

            } catch (err) {
                setLoading(false);
                showAlert(err.message || 'An error occurred. Please try again.', 'error');
            }
        });
    }
});
