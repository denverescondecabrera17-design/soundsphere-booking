/**
 * SoundSphere - Client Dashboard Controller
 * Handles user profile display, Service Provider application submission, and live status banners
 */

document.addEventListener('DOMContentLoaded', async () => {
    const user = SoundSphereAPI.getAuthUser();
    const token = SoundSphereAPI.getAuthToken();

    // Display user profile info
    if (user && document.getElementById('display-user-name')) {
        document.getElementById('display-user-name').textContent = user.name || user.email;
    }

    const appStatusContainer = document.getElementById('application-status-container');
    const modalAppOverlay = document.getElementById('modal-app-overlay');
    const btnOpenAppModal = document.getElementById('btn-open-app-modal');
    const cardApplyProvider = document.getElementById('card-apply-provider');
    const btnCloseAppModal = document.getElementById('btn-close-app-modal');
    const formProviderApp = document.getElementById('form-provider-application');
    const btnLogout = document.getElementById('btn-logout');

    // Logout Handler
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            await SoundSphereAPI.logoutAPI();
            window.location.href = '/login.html';
        });
    }

    // Modal Visibility
    const openModal = () => modalAppOverlay.classList.remove('hidden');
    const closeModal = () => modalAppOverlay.classList.add('hidden');

    if (btnOpenAppModal) btnOpenAppModal.addEventListener('click', openModal);
    if (cardApplyProvider) cardApplyProvider.addEventListener('click', openModal);
    if (btnCloseAppModal) btnCloseAppModal.addEventListener('click', closeModal);

    // Fetch My Application Status
    const checkApplicationStatus = async () => {
        if (!token) return;
        try {
            const response = await fetch('/api/provider-applications/my-application', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (data.success && data.application) {
                const app = data.application;
                appStatusContainer.classList.remove('hidden');

                if (app.Status === 'Pending') {
                    appStatusContainer.innerHTML = `
                        <div class="app-status-banner app-status-pending">
                            <div>
                                <i class="fa-solid fa-hourglass-half" style="margin-right:8px;"></i>
                                Application Pending Review: <strong>${app.BusinessName}</strong> is currently under Administrator review.
                            </div>
                            <span style="font-size:0.8rem; opacity:0.9;">Submitted ${new Date(app.SubmittedAt).toLocaleDateString()}</span>
                        </div>
                    `;
                    if (btnOpenAppModal) btnOpenAppModal.disabled = true;
                    if (cardApplyProvider) cardApplyProvider.style.pointerEvents = 'none';
                } else if (app.Status === 'Approved') {
                    appStatusContainer.innerHTML = `
                        <div class="app-status-banner app-status-approved">
                            <div>
                                <i class="fa-solid fa-circle-check" style="margin-right:8px;"></i>
                                Application Approved! You are now a Service Provider for <strong>${app.BusinessName}</strong>.
                            </div>
                            <a href="/provider/dashboard.html" style="padding:6px 14px; background:#047857; color:#fff; border-radius:6px; font-size:0.82rem; text-decoration:none;">Go to Provider Dashboard &rarr;</a>
                        </div>
                    `;
                } else if (app.Status === 'Rejected') {
                    appStatusContainer.innerHTML = `
                        <div class="app-status-banner app-status-rejected">
                            <div>
                                <i class="fa-solid fa-triangle-exclamation" style="margin-right:8px;"></i>
                                Application Rejected: ${app.RejectionReason || 'Documents did not meet criteria.'}
                            </div>
                            <button onclick="document.getElementById('modal-app-overlay').classList.remove('hidden')" style="padding:6px 14px; background:#b91c1c; color:#fff; border:none; border-radius:6px; font-size:0.82rem; cursor:pointer;">Re-Apply</button>
                        </div>
                    `;
                }
            }
        } catch (err) {
            console.warn('Could not check application status:', err);
        }
    };

    await checkApplicationStatus();

    // Application Submission Handler
    if (formProviderApp) {
        formProviderApp.addEventListener('submit', async (e) => {
            e.preventDefault();

            const businessName = document.getElementById('app-business-name').value.trim();
            const ownerName = document.getElementById('app-owner-name').value.trim();
            const businessAddress = document.getElementById('app-business-address').value.trim();
            const coverageArea = document.getElementById('app-coverage-area').value.trim();
            const contactNumber = document.getElementById('app-contact-number').value.trim();

            const payload = {
                businessName,
                ownerName,
                businessAddress,
                coverageArea,
                contactNumber
            };

            try {
                const response = await fetch('/api/provider-applications', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    showToast(`✕ ${data.message || 'Submission failed.'}`, 'error');
                    return;
                }

                showToast(`✓ ${data.message || 'Application submitted successfully!'}`, 'success');
                closeModal();
                await checkApplicationStatus();

            } catch (error) {
                showToast('✕ Error submitting application: ' + error.message, 'error');
            }
        });
    }
});
