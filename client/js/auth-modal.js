/**
 * SoundSphere - Universal Client Authentication Modal Component
 * Displays "Login to Book Your Event" directly on top of the Client Marketplace Interface.
 */

window.openAuthModal = (initialTab = 'login', pendingBookingInfo = null) => {
    if (pendingBookingInfo) {
        sessionStorage.setItem('soundsphere_pending_booking', JSON.stringify(pendingBookingInfo));
    }

    let authModal = document.getElementById('modal-auth-login-container');
    if (!authModal) {
        authModal = document.createElement('div');
        authModal.id = 'modal-auth-login-container';
        authModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(10, 25, 47, 0.65);
            backdrop-filter: blur(6px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        `;

        authModal.innerHTML = `
            <div style="background: #ffffff; width: 100%; max-width: 480px; border-radius: 20px; box-shadow: 0 24px 60px rgba(10, 25, 47, 0.3); border: 1px solid #cbd5e1; overflow: hidden; position: relative; animation: modalFadeIn 0.25s ease-out;">
                <!-- Header Bar -->
                <div style="background: linear-gradient(135deg, #0a192f 0%, #1e3e62 100%); color: #ffffff; padding: 24px 28px; position: relative;">
                    <button type="button" id="btn-close-auth-modal" style="position: absolute; top: 18px; right: 18px; background: rgba(255,255,255,0.15); color: #ffffff; border: none; border-radius: 50%; width: 32px; height: 32px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s;">✕</button>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                        <i class="fa-solid fa-lock" style="color: #93c5fd; font-size: 1.4rem;"></i>
                        <h3 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #ffffff;">Login to Book Your Event</h3>
                    </div>
                    <p style="margin: 0; font-size: 0.88rem; color: #cbd5e1; line-height: 1.4;">Sign in or create an account to select audio-visual packages & confirm your booking date.</p>
                </div>

                <!-- Auth Navigation Tabs -->
                <div style="display: flex; border-bottom: 1px solid #e2e8f0; background: #f8fafc;">
                    <button type="button" id="tab-auth-login" style="flex: 1; padding: 14px; border: none; background: transparent; font-weight: 800; font-size: 0.95rem; color: #2563eb; border-bottom: 3px solid #2563eb; cursor: pointer; transition: all 0.2s;">Login</button>
                    <button type="button" id="tab-auth-register" style="flex: 1; padding: 14px; border: none; background: transparent; font-weight: 700; font-size: 0.95rem; color: #64748b; border-bottom: 3px solid transparent; cursor: pointer; transition: all 0.2s;">Create Account</button>
                </div>

                <!-- Form Area -->
                <div style="padding: 24px 28px; max-height: 75vh; overflow-y: auto;">
                    <!-- Alert Message -->
                    <div id="auth-modal-alert" style="display: none; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; margin-bottom: 16px;"></div>

                    <!-- LOGIN FORM -->
                    <form id="auth-modal-login-form" autocomplete="off" style="display: flex; flex-direction: column; gap: 14px;">
                        <div>
                            <label style="display: block; font-size: 0.85rem; font-weight: 700; color: #0a192f; margin-bottom: 4px;">Email Address <span style="color:#ef4444;">*</span></label>
                            <input type="email" id="modal-login-email" required placeholder="name@example.com" style="width: 100%; height: 44px; padding: 0 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem; outline: none; box-sizing: border-box;">
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                                <label style="font-size: 0.85rem; font-weight: 700; color: #0a192f;">Password <span style="color:#ef4444;">*</span></label>
                                <a href="/forgot-password.html" style="font-size: 0.82rem; color: #2563eb; font-weight: 700; text-decoration: none;">Forgot Password?</a>
                            </div>
                            <div style="position: relative;">
                                <input type="password" id="modal-login-password" required placeholder="Enter password" style="width: 100%; height: 44px; padding: 0 40px 0 14px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.92rem; outline: none; box-sizing: border-box;">
                                <button type="button" id="modal-toggle-login-pw" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b; cursor: pointer; font-size: 1rem;"><i class="fa-solid fa-eye-slash"></i></button>
                            </div>
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 2px;">
                            <input type="checkbox" id="modal-remember-me" checked style="width: 16px; height: 16px; cursor: pointer;">
                            <label for="modal-remember-me" style="font-size: 0.85rem; color: #475569; font-weight: 600; cursor: pointer;">Stay signed in</label>
                        </div>

                        <button type="submit" id="modal-btn-login-submit" style="height: 46px; background: linear-gradient(135deg, #0a192f, #1e3e62); color: #ffffff; border: none; border-radius: 8px; font-size: 1.0rem; font-weight: 700; cursor: pointer; margin-top: 6px; box-shadow: 0 4px 12px rgba(10, 25, 47, 0.2); transition: all 0.2s;">
                            Login & Continue Booking →
                        </button>

                        <div style="display: flex; align-items: center; text-align: center; margin: 10px 0;">
                            <div style="flex: 1; border-bottom: 1px solid #e2e8f0;"></div>
                            <span style="padding: 0 10px; color: #94a3b8; font-size: 0.75rem; font-weight: 700;">OR</span>
                            <div style="flex: 1; border-bottom: 1px solid #e2e8f0;"></div>
                        </div>

                        <button type="button" onclick="window.location.href='/api/auth/google';" style="height: 42px; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; font-weight: 700; color: #1e293b; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <i class="fa-brands fa-google" style="color: #ea4335;"></i> Continue with Google
                        </button>
                    </form>

                    <!-- REGISTER FORM -->
                    <form id="auth-modal-register-form" autocomplete="off" style="display: none; flex-direction: column; gap: 12px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0a192f; margin-bottom: 4px;">First Name <span style="color:#ef4444;">*</span></label>
                                <input type="text" id="modal-reg-firstname" required placeholder="Juan" style="width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                            </div>
                            <div>
                                <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0a192f; margin-bottom: 4px;">Last Name <span style="color:#ef4444;">*</span></label>
                                <input type="text" id="modal-reg-lastname" required placeholder="Dela Cruz" style="width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                            </div>
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0a192f; margin-bottom: 4px;">Email Address <span style="color:#ef4444;">*</span></label>
                            <input type="email" id="modal-reg-email" required placeholder="juan@example.com" style="width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0a192f; margin-bottom: 4px;">Contact Phone <span style="color:#ef4444;">*</span></label>
                            <input type="tel" id="modal-reg-phone" required placeholder="09171234567" style="width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                        </div>

                        <div>
                            <label style="display: block; font-size: 0.82rem; font-weight: 700; color: #0a192f; margin-bottom: 4px;">Password <span style="color:#ef4444;">*</span></label>
                            <input type="password" id="modal-reg-password" required placeholder="8+ characters" style="width: 100%; height: 40px; padding: 0 12px; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.88rem; outline: none; box-sizing: border-box;">
                        </div>

                        <button type="submit" id="modal-btn-register-submit" style="height: 44px; background: linear-gradient(135deg, #0a192f, #1e3e62); color: #ffffff; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 4px; box-shadow: 0 4px 12px rgba(10, 25, 47, 0.2);">
                            Create Account & Continue →
                        </button>
                    </form>
                </div>
            </div>
        `;
        document.body.appendChild(authModal);

        // Bind Close Event
        const closeBtn = document.getElementById('btn-close-auth-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => authModal.classList.add('hidden'));
        }
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) authModal.classList.add('hidden');
        });

        // Bind Tab Switchers
        const tabLogin = document.getElementById('tab-auth-login');
        const tabReg = document.getElementById('tab-auth-register');
        const formLogin = document.getElementById('auth-modal-login-form');
        const formReg = document.getElementById('auth-modal-register-form');

        const switchTab = (tab) => {
            if (tab === 'login') {
                tabLogin.style.color = '#2563eb';
                tabLogin.style.borderBottomColor = '#2563eb';
                tabReg.style.color = '#64748b';
                tabReg.style.borderBottomColor = 'transparent';
                formLogin.style.display = 'flex';
                formReg.style.display = 'none';
            } else {
                tabReg.style.color = '#2563eb';
                tabReg.style.borderBottomColor = '#2563eb';
                tabLogin.style.color = '#64748b';
                tabLogin.style.borderBottomColor = 'transparent';
                formReg.style.display = 'flex';
                formLogin.style.display = 'none';
            }
        };

        if (tabLogin) tabLogin.addEventListener('click', () => switchTab('login'));
        if (tabReg) tabReg.addEventListener('click', () => switchTab('register'));

        // Toggle Password Visibility
        const pwInput = document.getElementById('modal-login-password');
        const toggleBtn = document.getElementById('modal-toggle-login-pw');
        if (toggleBtn && pwInput) {
            toggleBtn.addEventListener('click', () => {
                const type = pwInput.type === 'password' ? 'text' : 'password';
                pwInput.type = type;
                toggleBtn.innerHTML = type === 'password' ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
            });
        }

        // Handle Login Submission
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('auth-modal-alert');
            const submitBtn = document.getElementById('modal-btn-login-submit');

            const email = document.getElementById('modal-login-email').value.trim();
            const password = document.getElementById('modal-login-password').value;
            const rememberMe = document.getElementById('modal-remember-me').checked;

            alertBox.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    if (typeof SoundSphereAPI !== 'undefined') {
                        SoundSphereAPI.setAuthSession(data.token, data.user, rememberMe);
                    } else {
                        localStorage.setItem('soundsphere_jwt_token', data.token);
                        localStorage.setItem('soundsphere_user_info', JSON.stringify(data.user));
                    }

                    alertBox.style.display = 'block';
                    alertBox.style.background = '#ecfdf5';
                    alertBox.style.color = '#065f46';
                    alertBox.style.border = '1px solid #6ee7b7';
                    alertBox.textContent = ' Login successful! Redirecting to booking...';

                    setTimeout(() => {
                        authModal.classList.add('hidden');
                        const pendingBookingStr = sessionStorage.getItem('soundsphere_pending_booking');
                        if (pendingBookingStr) {
                            try {
                                const pending = JSON.parse(pendingBookingStr);
                                if (pending.returnUrl) {
                                    window.location.href = pending.returnUrl;
                                    return;
                                }
                            } catch(e){}
                        }
                        window.location.reload();
                    }, 600);
                } else {
                    throw new Error(data.message || 'Invalid email or password.');
                }
            } catch (err) {
                alertBox.style.display = 'block';
                alertBox.style.background = '#fef2f2';
                alertBox.style.color = '#991b1b';
                alertBox.style.border = '1px solid #fca5a5';
                alertBox.textContent = `❌ ${err.message}`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Login & Continue Booking →';
            }
        });

        // Handle Register Submission
        formReg.addEventListener('submit', async (e) => {
            e.preventDefault();
            const alertBox = document.getElementById('auth-modal-alert');
            const submitBtn = document.getElementById('modal-btn-register-submit');

            const firstName = document.getElementById('modal-reg-firstname').value.trim();
            const lastName = document.getElementById('modal-reg-lastname').value.trim();
            const email = document.getElementById('modal-reg-email').value.trim();
            const phone = document.getElementById('modal-reg-phone').value.trim();
            const password = document.getElementById('modal-reg-password').value;

            alertBox.style.display = 'none';
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registering...';

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        firstName,
                        lastName,
                        email,
                        phone,
                        password,
                        role: 'EventClient'
                    })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    alertBox.style.display = 'block';
                    alertBox.style.background = '#ecfdf5';
                    alertBox.style.color = '#065f46';
                    alertBox.style.border = '1px solid #6ee7b7';
                    alertBox.textContent = ' Account created! Please check your email for verification code.';

                    setTimeout(() => {
                        switchTab('login');
                        document.getElementById('modal-login-email').value = email;
                    }, 1200);
                } else {
                    throw new Error(data.message || 'Registration failed.');
                }
            } catch (err) {
                alertBox.style.display = 'block';
                alertBox.style.background = '#fef2f2';
                alertBox.style.color = '#991b1b';
                alertBox.style.border = '1px solid #fca5a5';
                alertBox.textContent = `❌ ${err.message}`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Create Account & Continue →';
            }
        });
    }

    // Open Modal
    authModal.classList.remove('hidden');
    const tabLogin = document.getElementById('tab-auth-login');
    const tabReg = document.getElementById('tab-auth-register');
    if (initialTab === 'register' && tabReg) {
        tabReg.click();
    } else if (tabLogin) {
        tabLogin.click();
    }
};
