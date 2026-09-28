/**
 * SoundSphere - Reset Password UI Controller
 * Validates cryptographically secure reset token and updates password in database
 */

document.addEventListener('DOMContentLoaded', async () => {
    const resetForm = document.getElementById('reset-password-form');
    const alertBanner = document.getElementById('alert-banner');
    const alertIcon = document.getElementById('alert-icon');
    const alertMessage = document.getElementById('alert-message');
    const btnResetSubmit = document.getElementById('btn-reset-submit');
    const resetSpinner = document.getElementById('reset-spinner');

    const toggleNewPasswordBtn = document.getElementById('toggle-new-password');
    const newPasswordInput = document.getElementById('new-password');
    const toggleConfirmNewPasswordBtn = document.getElementById('toggle-confirm-new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token') ? urlParams.get('token').trim() : '';

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

    // Password Eye Visibility Toggle Helper
    const setupPasswordToggle = (toggleBtn, passwordInput) => {
        if (!toggleBtn || !passwordInput) return;
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isCurrentlyPassword = passwordInput.getAttribute('type') === 'password';
            const newType = isCurrentlyPassword ? 'text' : 'password';
            passwordInput.setAttribute('type', newType);

            const icon = toggleBtn.querySelector('i');
            if (isCurrentlyPassword) {
                if (icon) icon.className = 'fa-solid fa-eye';
                toggleBtn.setAttribute('aria-label', 'Hide password');
                toggleBtn.setAttribute('title', 'Hide password');
            } else {
                if (icon) icon.className = 'fa-solid fa-eye-slash';
                toggleBtn.setAttribute('aria-label', 'Show password');
                toggleBtn.setAttribute('title', 'Show password');
            }
        });
    };

    setupPasswordToggle(toggleNewPasswordBtn, newPasswordInput);
    setupPasswordToggle(toggleConfirmNewPasswordBtn, confirmNewPasswordInput);

    const showInvalidTokenState = (message) => {
        showAlert(message, 'error');
        if (resetForm) {
            resetForm.innerHTML = `
                <div style="text-align: center; padding: 20px 0;">
                    <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 24px;">Please request a new password reset link to update your credentials.</p>
                    <a href="/forgot-password.html" class="btn-submit" style="display: inline-flex; text-decoration: none; align-items: center; justify-content: center;">
                        <span>Request New Reset Link</span>
                        <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                    </a>
                </div>
            `;
        }
    };

    // Verify token on load
    if (!token) {
        showInvalidTokenState('This password reset link is invalid or has expired. Please request a new password reset link.');
        return;
    }

    try {
        const verifyRes = await fetch(`/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`);
        const verifyData = await verifyRes.json();

        if (!verifyRes.ok || !verifyData.valid) {
            showInvalidTokenState(verifyData.message || 'This password reset link is invalid or has expired. Please request a new password reset link.');
            return;
        }
    } catch (err) {
        showInvalidTokenState('Unable to verify password reset token. Please request a new link.');
        return;
    }

    let isOtpStep = false;
    let pendingNewPassword = '';

    const setLoading = (isLoading, buttonText = 'Reset Password') => {
        if (!btnResetSubmit) return;
        btnResetSubmit.disabled = isLoading;
        const btnText = btnResetSubmit.querySelector('.btn-text');
        const btnIcon = btnResetSubmit.querySelector('.btn-icon');
        if (isLoading) {
            if (btnText) btnText.textContent = 'Processing...';
            if (btnIcon) btnIcon.classList.add('hidden');
            if (resetSpinner) resetSpinner.classList.remove('hidden');
        } else {
            if (btnText) btnText.textContent = buttonText;
            if (btnIcon) btnIcon.classList.remove('hidden');
            if (resetSpinner) resetSpinner.classList.add('hidden');
        }
    };

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            if (!isOtpStep) {
                // Step 1: User enters new password and requests Email OTP
                const newPassword = newPasswordInput ? newPasswordInput.value : '';
                const confirmPassword = confirmNewPasswordInput ? confirmNewPasswordInput.value : '';

                let isValid = true;

                if (!newPassword) {
                    document.getElementById('error-new-password').textContent = 'New password is required.';
                    isValid = false;
                } else if (newPassword.length < 8 || !/\d/.test(newPassword)) {
                    document.getElementById('error-new-password').textContent = 'Password must be at least 8 characters long and include at least one number.';
                    isValid = false;
                }

                if (newPassword !== confirmPassword) {
                    document.getElementById('error-confirm-new-password').textContent = 'Passwords do not match.';
                    isValid = false;
                }

                if (!isValid) return;

                pendingNewPassword = newPassword;

                try {
                    setLoading(true, 'Send OTP Code');
                    const response = await fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, newPassword: pendingNewPassword })
                    });

                    const data = await response.json();
                    setLoading(false, 'Confirm & Change Password');

                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to request password reset OTP.');
                    }

                    if (data.requiresOTP) {
                        isOtpStep = true;
                        showAlert(data.message, 'success');

                        // Transform Form UI to Email OTP Verification Step
                        resetForm.innerHTML = `
                            <div class="form-header">
                                <h2>Email OTP Verification</h2>
                                <p>We sent a 6-digit verification code to <strong>${data.email || 'your Gmail inbox'}</strong>. Enter the code below to confirm your password change.</p>
                            </div>

                            <div class="form-group">
                                <label for="reset-otp-input">6-Digit Verification Code <span class="required">*</span></label>
                                <div class="input-icon-wrapper">
                                    <i class="fa-solid fa-key input-icon"></i>
                                    <input type="text" id="reset-otp-input" name="reset_otp" placeholder="Enter 6-digit OTP" maxlength="6" autocomplete="off" required style="font-size: 1.2rem; letter-spacing: 4px; font-weight: 700; text-align: center;">
                                </div>
                                <span class="error-msg" id="error-reset-otp"></span>
                            </div>

                            <button type="submit" class="btn-submit" id="btn-reset-submit">
                                <span class="btn-text">Confirm & Change Password</span>
                                <i class="fa-solid fa-arrow-right btn-icon"></i>
                                <div class="spinner hidden" id="reset-spinner"></div>
                            </button>
                        `;

                        // Re-bind phone/digit restriction on OTP input
                        const otpInputEl = document.getElementById('reset-otp-input');
                        if (otpInputEl) {
                            otpInputEl.focus();
                            otpInputEl.addEventListener('input', (ev) => {
                                ev.target.value = ev.target.value.replace(/\D/g, '');
                            });
                        }
                    }

                } catch (err) {
                    setLoading(false, 'Reset Password');
                    showAlert(err.message || 'An error occurred while sending OTP code.', 'error');
                }

            } else {
                // Step 2: User enters the 6-digit Email OTP and confirms password change
                const otpInputEl = document.getElementById('reset-otp-input');
                const otpCode = otpInputEl ? otpInputEl.value.trim() : '';

                if (!otpCode || otpCode.length !== 6) {
                    const errEl = document.getElementById('error-reset-otp');
                    if (errEl) errEl.textContent = 'Please enter the complete 6-digit OTP verification code.';
                    return;
                }

                try {
                    setLoading(true, 'Verifying OTP...');
                    const response = await fetch('/api/auth/reset-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ token, newPassword: pendingNewPassword, otpCode })
                    });

                    const data = await response.json();
                    setLoading(false, 'Confirm & Change Password');

                    if (!response.ok) {
                        throw new Error(data.message || 'Failed to verify OTP code.');
                    }

                    // Render Success Card
                    resetForm.innerHTML = `
                        <div style="text-align: center; padding: 20px 0;">
                            <div style="width: 60px; height: 60px; background-color: #dcfce7; color: #15803d; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px; margin: 0 auto 20px auto;">
                                <i class="fa-solid fa-check"></i>
                            </div>
                            <h3 style="color: #0a192f; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px;">Your password has been reset successfully.</h3>
                            <p style="color: #64748b; font-size: 0.95rem; margin-bottom: 24px;">You can now log in to SoundSphere using your new password.</p>
                            <a href="/login.html" class="btn-submit" style="display: inline-flex; text-decoration: none; align-items: center; justify-content: center;">
                                <span>Back to Login</span>
                                <i class="fa-solid fa-arrow-right" style="margin-left: 8px;"></i>
                            </a>
                        </div>
                    `;

                } catch (err) {
                    setLoading(false, 'Confirm & Change Password');
                    showAlert(err.message || 'Invalid OTP code. Please try again.', 'error');
                }
            }
        });
    }
});
