/**
 * SoundSphere - OTP Verification Controller (Vanilla JS)
 * Handles auto-focus input movement, masked email rendering, persistent 5-minute countdown across refreshes, resend cooldown, and API verification
 */

document.addEventListener('DOMContentLoaded', () => {
    const maskedEmailSpan = document.getElementById('masked-email');
    const otpForm = document.getElementById('otp-form');
    const otpInputs = Array.from(document.querySelectorAll('.otp-digit-input'));
    const btnVerifyOtp = document.getElementById('btn-verify-otp');
    const otpSpinner = document.getElementById('otp-spinner');
    const btnResendOtp = document.getElementById('btn-resend-otp');
    const timerBadge = document.getElementById('timer-badge');
    const errorOtpSpan = document.getElementById('error-otp');

    const alertBanner = document.getElementById('alert-banner');
    const alertIcon = document.getElementById('alert-icon');
    const alertMessage = document.getElementById('alert-message');

    // Retrieve pending verification email
    const pendingEmail = sessionStorage.getItem('soundsphere_pending_email');

    // If no pending email found in session, redirect to login page
    if (!pendingEmail) {
        window.location.href = 'login.html';
        return;
    }

    // Mask Email (e.g. dendenescondecabrera17@gmail.com -> d***7@gmail.com)
    const maskEmail = (emailStr) => {
        if (!emailStr || typeof emailStr !== 'string') return '';
        const parts = emailStr.split('@');
        if (parts.length !== 2) return emailStr;
        const name = parts[0];
        const domain = parts[1];
        if (name.length <= 2) {
            return `${name[0]}***@${domain}`;
        }
        return `${name[0]}***${name[name.length - 1]}@${domain}`;
    };

    if (maskedEmailSpan) {
        maskedEmailSpan.textContent = maskEmail(pendingEmail);
    }

    // Alert Utilities
    const showAlert = (message, type = 'error') => {
        alertMessage.textContent = message;
        alertBanner.className = `alert-banner ${type}`;
        alertIcon.className = type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check';
        alertBanner.classList.remove('hidden');
    };

    const hideAlert = () => {
        alertBanner.classList.add('hidden');
    };

    // Robust Auto-Focus & Input Behaviors for 6 Digit Boxes
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            const rawVal = e.target.value;
            const digitsOnly = rawVal.replace(/\D/g, '');

            if (digitsOnly.length > 0) {
                const lastDigit = digitsOnly[digitsOnly.length - 1];
                e.target.value = lastDigit;
                e.target.classList.add('filled');

                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else {
                e.target.value = '';
                e.target.classList.remove('filled');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                if (!input.value && index > 0) {
                    otpInputs[index - 1].focus();
                    otpInputs[index - 1].value = '';
                    otpInputs[index - 1].classList.remove('filled');
                } else {
                    input.value = '';
                    input.classList.remove('filled');
                }
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text').trim();
            const cleanDigits = pastedData.replace(/\D/g, '');
            if (cleanDigits.length >= 6) {
                cleanDigits.slice(0, 6).split('').forEach((char, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = char;
                        otpInputs[i].classList.add('filled');
                    }
                });
                otpInputs[5].focus();
            }
        });
    });

    /**
     * PERSISTENT TIMER MANAGEMENT ACROSS REFRESHES
     * Preserves exact countdown timestamp in sessionStorage
     */
    let timerInterval = null;

    const getOrSetExpiryTimestamp = () => {
        let expiryTs = sessionStorage.getItem('soundsphere_otp_expiry_timestamp');
        const now = Date.now();
        if (!expiryTs) {
            expiryTs = String(now + 300 * 1000);
            sessionStorage.setItem('soundsphere_otp_expiry_timestamp', expiryTs);
        }
        return parseInt(expiryTs, 10);
    };

    const getOrSetCooldownTimestamp = () => {
        let cooldownTs = sessionStorage.getItem('soundsphere_resend_cooldown_timestamp');
        const now = Date.now();
        if (!cooldownTs) {
            cooldownTs = String(now + 60 * 1000);
            sessionStorage.setItem('soundsphere_resend_cooldown_timestamp', cooldownTs);
        }
        return parseInt(cooldownTs, 10);
    };

    const startTimer = () => {
        clearInterval(timerInterval);

        const updateDisplay = () => {
            const now = Date.now();
            const expiryTs = getOrSetExpiryTimestamp();
            const cooldownTs = getOrSetCooldownTimestamp();

            const timeRemaining = Math.max(0, Math.floor((expiryTs - now) / 1000));
            const cooldownRemaining = Math.max(0, Math.floor((cooldownTs - now) / 1000));

            // Resend Button Cooldown State
            if (cooldownRemaining > 0) {
                btnResendOtp.disabled = true;
                btnResendOtp.textContent = `Resend in ${cooldownRemaining}s`;
            } else {
                btnResendOtp.disabled = false;
                btnResendOtp.textContent = 'Resend OTP';
            }

            // Expiry Badge State
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timerBadge.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                timerBadge.textContent = '00:00 (Expired)';
                showAlert('Verification code has expired. Please click Resend OTP to get a new code.', 'error');
            }
        };

        updateDisplay();
        timerInterval = setInterval(updateDisplay, 1000);
    };

    startTimer();

    const resetTimerTimestamps = () => {
        const now = Date.now();
        sessionStorage.setItem('soundsphere_otp_expiry_timestamp', String(now + 300 * 1000));
        sessionStorage.setItem('soundsphere_resend_cooldown_timestamp', String(now + 60 * 1000));
        startTimer();
    };

    const getEnteredOTP = () => {
        return otpInputs.map(input => input.value).join('');
    };

    const setLoadingState = (isLoading) => {
        btnVerifyOtp.disabled = isLoading;
        const btnText = btnVerifyOtp.querySelector('.btn-text');
        const btnIcon = btnVerifyOtp.querySelector('.btn-icon');
        if (isLoading) {
            btnText.textContent = 'Verifying Code...';
            btnIcon.classList.add('hidden');
            otpSpinner.classList.remove('hidden');
        } else {
            btnText.textContent = 'Verify Email & Activate Account';
            btnIcon.classList.remove('hidden');
            otpSpinner.classList.add('hidden');
        }
    };

    // FORM SUBMISSION (Verify OTP)
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideAlert();
        errorOtpSpan.textContent = '';

        const otpCode = getEnteredOTP();

        if (otpCode.length !== 6) {
            errorOtpSpan.textContent = 'Please enter all 6 digits of the verification code.';
            return;
        }

        try {
            setLoadingState(true);

            const response = await SoundSphereAPI.verifyOTPAPI(pendingEmail, otpCode);

            // Store Auth Session (JWT + User info)
            SoundSphereAPI.setAuthSession(response.token, response.user, true);

            showAlert('Email verified successfully! Redirecting to your Client Dashboard...', 'success');

            setTimeout(() => {
                sessionStorage.removeItem('soundsphere_otp_expiry_timestamp');
                sessionStorage.removeItem('soundsphere_resend_cooldown_timestamp');
                window.location.href = response.redirectUrl || '/client/dashboard.html';
            }, 1000);

        } catch (error) {
            setLoadingState(false);
            showAlert(error.message || 'Invalid verification code. Please try again.', 'error');
        }
    });

    // RESEND OTP BUTTON
    btnResendOtp.addEventListener('click', async () => {
        hideAlert();
        try {
            btnResendOtp.disabled = true;
            btnResendOtp.textContent = 'Sending...';

            const response = await SoundSphereAPI.resendOTPAPI(pendingEmail);

            showAlert(response.message, 'success');

            // Reset 6-digit input boxes
            otpInputs.forEach(input => {
                input.value = '';
                input.classList.remove('filled');
            });
            otpInputs[0].focus();

            // Reset Timer Timestamps
            resetTimerTimestamps();

        } catch (error) {
            showAlert(error.message || 'Failed to resend verification code.', 'error');
            btnResendOtp.disabled = false;
            btnResendOtp.textContent = 'Resend OTP';
        }
    });
});
