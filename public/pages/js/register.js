/**
 * SoundSphere - Create Account UI Controller (Vanilla JS)
 * Handles Form Validation, Registration API integration, OTP timer initialization, and Country Code input masking
 */

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');

    const alertBanner = document.getElementById('alert-banner');
    const alertIcon = document.getElementById('alert-icon');
    const alertMessage = document.getElementById('alert-message');

    const toggleRegPasswordBtn = document.getElementById('toggle-reg-password');
    const regPasswordInput = document.getElementById('reg-password');
    const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    const regPhoneInput = document.getElementById('reg-phone');
    const regCountryCodeSelect = document.getElementById('reg-country-code');
    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    const registerSpinner = document.getElementById('register-spinner');

    // Phone Input: Restrict strictly to digits
    if (regPhoneInput) {
        regPhoneInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    // Alert Utilities
    window.showAlert = (message, type = 'error') => {
        if (!alertBanner || !alertMessage || !alertIcon) return;
        alertMessage.textContent = message;
        alertBanner.className = `alert-banner ${type}`;
        alertIcon.className = type === 'error' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-circle-check';
        alertBanner.classList.remove('hidden');
    };

    window.hideAlert = () => {
        if (alertBanner) alertBanner.classList.add('hidden');
    };

    const clearInputErrors = () => {
        document.querySelectorAll('.error-msg').forEach(el => el.textContent = '');
    };

    const setError = (elementId, message) => {
        const errorSpan = document.getElementById(elementId);
        if (errorSpan) errorSpan.textContent = message;
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const isValidPasswordFormat = (password) => {
        return /^(?=.*\d).{8,}$/.test(password);
    };

    // Function to guarantee blank inputs on initialization & pageshow
    const resetAndClearRegisterForm = () => {
        if (registerForm) {
            registerForm.reset();
        }
        const fieldsToClear = [
            'client-firstname',
            'client-middlename',
            'client-lastname',
            'reg-email',
            'reg-phone',
            'reg-password',
            'reg-confirm-password',
            'client-address'
        ];
        fieldsToClear.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.value = '';
                if (id.includes('password')) {
                    el.setAttribute('type', 'password');
                    el.setAttribute('autocomplete', 'new-password');
                } else {
                    el.setAttribute('autocomplete', 'off');
                }
            }
        });
        [toggleRegPasswordBtn, toggleConfirmPasswordBtn].forEach(btn => {
            if (btn) {
                const icon = btn.querySelector('i');
                if (icon) icon.className = 'fa-solid fa-eye-slash';
                btn.setAttribute('aria-label', 'Show password');
                btn.setAttribute('title', 'Show password');
            }
        });
    };

    resetAndClearRegisterForm();

    window.addEventListener('pageshow', () => {
        resetAndClearRegisterForm();
    });

    // Password Toggle Helper (Synchronized Eye / Eye-off state mapping)
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
                // Password is now VISIBLE -> Display OPEN EYE icon
                if (icon) icon.className = 'fa-solid fa-eye';
                toggleBtn.setAttribute('aria-label', 'Hide password');
                toggleBtn.setAttribute('title', 'Hide password');
            } else {
                // Password is now HIDDEN -> Display CLOSED / EYE-OFF icon
                if (icon) icon.className = 'fa-solid fa-eye-slash';
                toggleBtn.setAttribute('aria-label', 'Show password');
                toggleBtn.setAttribute('title', 'Show password');
            }
        });
    };

    setupPasswordToggle(toggleRegPasswordBtn, regPasswordInput);
    setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

    // Validation
    const validateRegisterForm = () => {
        clearInputErrors();
        hideAlert();
        let isValid = true;

        const firstName = document.getElementById('client-firstname').value.trim();
        const lastName = document.getElementById('client-lastname').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const rawPhone = regPhoneInput ? regPhoneInput.value.trim() : '';
        const password = document.getElementById('reg-password').value;
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (!firstName) { setError('error-client-firstname', 'First name is required.'); isValid = false; }
        if (!lastName) { setError('error-client-lastname', 'Last name is required.'); isValid = false; }
        if (!email) { setError('error-reg-email', 'Email address is required.'); isValid = false; }
        else if (!isValidEmail(email)) { setError('error-reg-email', 'Invalid email format.'); isValid = false; }
        
        if (!rawPhone) { 
            setError('error-reg-phone', 'Contact number is required.'); 
            isValid = false; 
        } else if (rawPhone.length < 7 || rawPhone.length > 11) {
            setError('error-reg-phone', 'Please enter a valid numeric contact number (7-11 digits).');
            isValid = false;
        }
        
        if (!password) { 
            setError('error-reg-password', 'Password is required.'); 
            isValid = false; 
        } else if (!isValidPasswordFormat(password)) { 
            setError('error-reg-password', 'Password must be at least 8 characters long and include at least one number.'); 
            isValid = false; 
        }

        if (!confirmPassword) { 
            setError('error-reg-confirm-password', 'Please confirm your password.'); 
            isValid = false; 
        } else if (password !== confirmPassword) { 
            setError('error-reg-confirm-password', 'Passwords do not match.'); 
            isValid = false; 
        }

        return isValid;
    };

    const setLoadingState = (isLoading) => {
        if (!btnRegisterSubmit) return;
        btnRegisterSubmit.disabled = isLoading;
        const btnText = btnRegisterSubmit.querySelector('.btn-text');
        const btnIcon = btnRegisterSubmit.querySelector('.btn-icon');
        if (isLoading) {
            if (btnText) btnText.textContent = 'Sending Verification Code...';
            if (btnIcon) btnIcon.classList.add('hidden');
            if (registerSpinner) registerSpinner.classList.remove('hidden');
        } else {
            if (btnText) btnText.textContent = 'Continue to Email Verification';
            if (btnIcon) btnIcon.classList.remove('hidden');
            if (registerSpinner) registerSpinner.classList.add('hidden');
        }
    };

    // REGISTER FORM SUBMISSION
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateRegisterForm()) return;

            const firstName = document.getElementById('client-firstname').value.trim();
            const middleNameInput = document.getElementById('client-middlename');
            const middleName = middleNameInput ? middleNameInput.value.trim() : '';
            const lastName = document.getElementById('client-lastname').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            
            const countryCode = regCountryCodeSelect ? regCountryCodeSelect.value : '+63';
            const rawPhone = regPhoneInput.value.trim();
            const fullPhone = `${countryCode} ${rawPhone}`;

            const password = document.getElementById('reg-password').value;
            const address = document.getElementById('client-address').value.trim();

            const payload = {
                role: 'Client',
                firstName,
                middleName,
                lastName,
                email,
                phone: fullPhone,
                password,
                address
            };

            try {
                setLoadingState(true);
                const response = await SoundSphereAPI.registerAPI(payload);

                const now = Date.now();
                const otpExpiryMs = now + 300 * 1000;
                const resendCooldownMs = now + 60 * 1000;

                sessionStorage.setItem('soundsphere_pending_email', email);
                sessionStorage.setItem('soundsphere_otp_expiry_timestamp', String(otpExpiryMs));
                sessionStorage.setItem('soundsphere_resend_cooldown_timestamp', String(resendCooldownMs));

                showAlert(`Registration successful! Verification code sent to ${email}. Redirecting...`, 'success');

                setTimeout(() => {
                    window.location.href = 'verify-otp.html';
                }, 1200);

            } catch (error) {
                setLoadingState(false);
                showAlert(error.message || 'Registration failed. Please try again.', 'error');
            }
        });
    }

    // Social Account Creation Handlers (Real Google OAuth 2.0)
    const btnGoogleReg = document.getElementById('btn-google-register');

    if (btnGoogleReg) {
        btnGoogleReg.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/api/auth/google';
        });
    }
});
