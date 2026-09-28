/**
 * SoundSphere - Sign In & Registration UI Controller
 * Handles Tab Navigation, Input Validation, Registration API calls, Country Phone Formatting, and Form Auto-Reset
 */

document.addEventListener('DOMContentLoaded', () => {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    const alertBanner = document.getElementById('alert-banner');
    const alertIcon = document.getElementById('alert-icon');
    const alertMessage = document.getElementById('alert-message');

    const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
    const loginPasswordInput = document.getElementById('login-password');
    const toggleRegPasswordBtn = document.getElementById('toggle-reg-password');
    const regPasswordInput = document.getElementById('reg-password');
    const toggleConfirmPasswordBtn = document.getElementById('toggle-confirm-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    const regPhoneInput = document.getElementById('reg-phone');
    const regCountryCodeSelect = document.getElementById('reg-country-code');

    const btnLoginSubmit = document.getElementById('btn-login-submit');
    const loginSpinner = document.getElementById('login-spinner');
    const btnRegisterSubmit = document.getElementById('btn-register-submit');
    const registerSpinner = document.getElementById('register-spinner');

    // Phone Input: Restrict Strictly to Digits Base on Country Code Selection
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

    // Form Auto-Reset Helper
    const resetAllFormsAndInputs = () => {
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        document.querySelectorAll('input').forEach(input => {
            if (input.type !== 'checkbox' && input.type !== 'radio' && input.type !== 'submit' && input.type !== 'button') {
                input.value = '';
            }
        });
        clearInputErrors();
        hideAlert();
    };

    // Initial load reset
    resetAllFormsAndInputs();

    // Check for query parameters (OAuth callback token, logout status, or OAuth errors)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    const userParam = urlParams.get('user');
    const authErrorParam = urlParams.get('auth_error');

    if (tokenParam && userParam) {
        try {
            const userObj = JSON.parse(decodeURIComponent(userParam));
            if (typeof SoundSphereAPI !== 'undefined' && SoundSphereAPI.setAuthSession) {
                SoundSphereAPI.setAuthSession(tokenParam, userObj, true);
            } else {
                localStorage.setItem('soundsphere_auth_token', tokenParam);
                localStorage.setItem('soundsphere_user', JSON.stringify(userObj));
            }
            showAlert(`Welcome back, ${userObj.name || userObj.email}! Logging you in via Google...`, 'success');
            setTimeout(() => {
                const redirectTarget = (userObj.role === 'Admin') ? '/admin/dashboard.html' :
                                       (userObj.role === 'Provider') ? '/client/dashboard.html' : '/marketplace.html';
                window.location.href = redirectTarget;
            }, 800);
            return;
        } catch (e) {
            console.error('Failed to parse Google OAuth user response:', e);
            showAlert('Authentication successful, but session parsing failed. Please sign in.', 'error');
        }
    } else if (authErrorParam) {
        showAlert(decodeURIComponent(authErrorParam), 'error');
    } else if (urlParams.get('logout') === 'true') {
        localStorage.clear();
        sessionStorage.clear();
        resetAllFormsAndInputs();
        showAlert('You have been logged out successfully. All form fields cleared.', 'success');
    }

    // Google OAuth Handler
    const handleGoogleAuthRedirect = (e) => {
        if (e) e.preventDefault();
        window.location.href = '/api/auth/google';
    };

    const btnGoogleLogin = document.getElementById('btn-google-login');
    if (btnGoogleLogin) {
        btnGoogleLogin.addEventListener('click', handleGoogleAuthRedirect);
    }

    const btnGoogleRegister = document.getElementById('btn-google-register');
    if (btnGoogleRegister) {
        btnGoogleRegister.addEventListener('click', handleGoogleAuthRedirect);
    }

    // Tab Navigation Handlers
    if (tabLogin) {
        tabLogin.addEventListener('click', (e) => {
            e.preventDefault();
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            clearInputErrors();
            hideAlert();
        });
    }

    if (tabRegister) {
        tabRegister.addEventListener('click', (e) => {
            e.preventDefault();
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            registerForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            clearInputErrors();
            hideAlert();
        });
    }

    // Password Toggle Helper
    const setupPasswordToggle = (toggleBtn, passwordInput) => {
        if (!toggleBtn || !passwordInput) return;
        toggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            const icon = toggleBtn.querySelector('i');
            if (icon) {
                icon.className = type === 'password' ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
            }
        });
    };

    setupPasswordToggle(toggleLoginPasswordBtn, loginPasswordInput);
    setupPasswordToggle(toggleRegPasswordBtn, regPasswordInput);
    setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

    // Client-Side Validation
    const validateLoginForm = () => {
        clearInputErrors();
        hideAlert();
        let isValid = true;

        const emailInput = document.getElementById('login-email');
        const passInput = document.getElementById('login-password');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passInput ? passInput.value : '';

        if (!email) {
            setError('error-login-email', 'Email address is required.');
            isValid = false;
        } else if (!isValidEmail(email)) {
            setError('error-login-email', 'Invalid email format.');
            isValid = false;
        }

        if (!password) {
            setError('error-login-password', 'Password is required.');
            isValid = false;
        }

        return isValid;
    };

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

    const setLoadingState = (formType, isLoading) => {
        if (formType === 'login' && btnLoginSubmit) {
            btnLoginSubmit.disabled = isLoading;
            const btnText = btnLoginSubmit.querySelector('.btn-text');
            const btnIcon = btnLoginSubmit.querySelector('.btn-icon');
            if (isLoading) {
                btnText.textContent = 'Signing in...';
                btnIcon.classList.add('hidden');
                if (loginSpinner) loginSpinner.classList.remove('hidden');
            } else {
                btnText.textContent = 'Sign In';
                btnIcon.classList.remove('hidden');
                if (loginSpinner) loginSpinner.classList.add('hidden');
            }
        } else if (formType === 'register' && btnRegisterSubmit) {
            btnRegisterSubmit.disabled = isLoading;
            const btnText = btnRegisterSubmit.querySelector('.btn-text');
            const btnIcon = btnRegisterSubmit.querySelector('.btn-icon');
            if (isLoading) {
                btnText.textContent = 'Sending Verification Code...';
                btnIcon.classList.add('hidden');
                if (registerSpinner) registerSpinner.classList.remove('hidden');
            } else {
                btnText.textContent = 'Continue to Email Verification';
                btnIcon.classList.remove('hidden');
                if (registerSpinner) registerSpinner.classList.add('hidden');
            }
        }
    };

    // LOGIN SUBMISSION
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateLoginForm()) return;

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('remember-me').checked;

            try {
                setLoadingState('login', true);
                const response = await SoundSphereAPI.loginAPI(email, password);

                SoundSphereAPI.setAuthSession(response.token, response.user, rememberMe);

                showAlert(`Welcome back, ${response.user.name || response.user.email}! Redirecting...`, 'success');

                setTimeout(() => {
                    resetAllFormsAndInputs();
                    window.location.href = response.redirectUrl;
                }, 800);

            } catch (error) {
                setLoadingState('login', false);

                if (error.requiresVerification) {
                    const now = Date.now();
                    sessionStorage.setItem('soundsphere_pending_email', email);
                    sessionStorage.setItem('soundsphere_otp_expiry_timestamp', String(now + 300 * 1000));
                    sessionStorage.setItem('soundsphere_resend_cooldown_timestamp', String(now + 60 * 1000));
                    showAlert('Your email is not verified yet. Redirecting to OTP Verification...', 'error');
                    setTimeout(() => {
                        window.location.href = 'verify-otp.html';
                    }, 1200);
                } else {
                    showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
                }
            }
        });
    }

    // REGISTER SUBMISSION
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
                setLoadingState('register', true);
                const response = await SoundSphereAPI.registerAPI(payload);

                showAlert('🎉 Account created successfully! Logging you in...', 'success');

                setTimeout(async () => {
                    try {
                        const loginRes = await SoundSphereAPI.loginAPI(email, password);
                        SoundSphereAPI.setAuthSession(loginRes.token, loginRes.user, true);
                        window.location.href = loginRes.redirectUrl || 'marketplace.html';
                    } catch (loginErr) {
                        if (tabLogin) tabLogin.click();
                        const loginEmailInp = document.getElementById('login-email');
                        const loginPwInp = document.getElementById('login-password');
                        if (loginEmailInp) loginEmailInp.value = email;
                        if (loginPwInp) loginPwInp.value = password;
                        showAlert('Account created! Please click Sign In to continue.', 'success');
                    }
                }, 1000);

            } catch (error) {
                setLoadingState('register', false);
                showAlert(error.message || 'Registration failed. Please try again.', 'error');
            }
        });
    }
});
