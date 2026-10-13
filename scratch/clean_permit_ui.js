const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const htmlFiles = [
    path.join(rootDir, 'public', 'provider', 'dashboard.html'),
    path.join(rootDir, 'public', 'pages', 'provider', 'dashboard.html'),
    path.join(rootDir, 'client', 'provider', 'dashboard.html'),
    path.join(rootDir, 'client', 'pages', 'provider', 'dashboard.html')
];

const jsFiles = [
    path.join(rootDir, 'public', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'public', 'pages', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'client', 'provider', 'js', 'provider-dashboard.js'),
    path.join(rootDir, 'client', 'pages', 'provider', 'js', 'provider-dashboard.js')
];

// 1. CLEAN HTML FILES
htmlFiles.forEach(f => {
    if (!fs.existsSync(f)) return;
    let content = fs.readFileSync(f, 'utf8');

    // Remove sidebar link
    const sidebarRegex = /\s*<a href="#permits-section" class="menu-item" id="nav-item-permits">[\s\S]*?<\/a>/;
    content = content.replace(sidebarRegex, '');

    // Remove View 10 panel between its start comment and </main>
    const v10StartMarker = '<!-- VIEW 10: BUSINESS PERMIT COMPLIANCE & RENEWAL -->';
    const v10StartIndex = content.indexOf(v10StartMarker);
    if (v10StartIndex !== -1) {
        const mainIndex = content.indexOf('</main>', v10StartIndex);
        if (mainIndex !== -1) {
            content = content.substring(0, v10StartIndex) + '\n            ' + content.substring(mainIndex);
        }
    }

    // Clean Modal UI: simple photo upload, issued date, expiry date, dismiss and submit buttons
    const modalPattern = /<!-- MODAL: UPLOAD BUSINESS PERMIT -->[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;
    const cleanModalHtml = `<!-- MODAL: UPLOAD BUSINESS PERMIT -->
    <div class="admin-modal-overlay hidden" id="modal-provider-upload-permit" role="dialog" aria-modal="true" style="z-index:999999;">
        <div class="admin-modal-card" style="max-width:540px; border-radius:16px; overflow:hidden; box-shadow:0 20px 45px rgba(0,0,0,0.25);">
            <div style="padding:20px 24px; background:linear-gradient(135deg, #0a192f 0%, #1e293b 100%); color:#ffffff; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #2563eb;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:#2563eb; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.15rem;">
                        <i class="fa-solid fa-file-shield"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#fff;">Business Permit Compliance</h3>
                        <p style="margin:2px 0 0 0; font-size:0.78rem; color:#94a3b8;">Administrator Notice: Submit your Business Permit</p>
                    </div>
                </div>
                <button type="button" onclick="closeUploadPermitModal()" style="background:none; border:none; color:#cbd5e1; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <form id="form-modal-permit-upload" onsubmit="submitModalPermitUpload(event)" style="padding:24px; display:flex; flex-direction:column; gap:16px;">
                <div style="padding:12px 14px; background:#eff6ff; border:1px solid #bfdbfe; border-radius:10px; font-size:0.84rem; color:#1e40af; display:flex; align-items:flex-start; gap:10px;">
                    <i class="fa-solid fa-circle-info" style="font-size:1.1rem; margin-top:2px; flex-shrink:0;"></i>
                    <span>The administrator has requested your business permit. Please upload a clear photo/copy of the permit and specify the issued and expiration dates below.</span>
                </div>

                <!-- 1. Photo of Permit -->
                <div>
                    <label style="display:block; font-size:0.84rem; font-weight:700; color:#0f172a; margin-bottom:6px;">Photo of Business Permit <span style="color:#ef4444;">*</span></label>
                    <div id="modal-permit-dropzone" style="border:2px dashed #93c5fd; border-radius:12px; padding:22px; text-align:center; background:#f8fafc; cursor:pointer; transition:all 0.2s ease;">
                        <i class="fa-solid fa-camera" style="font-size:2rem; color:#2563eb; margin-bottom:6px; display:block;"></i>
                        <p style="margin:0 0 4px 0; font-size:0.88rem; font-weight:700; color:#0a192f;">Click to browse or take/upload photo of permit</p>
                        <span style="font-size:0.75rem; color:#64748b;">Supports JPG, PNG, WEBP, or PDF (up to 10MB)</span>
                        <input type="file" id="modal-input-permit-file" accept="image/jpeg,image/png,image/webp,application/pdf" style="display:none;" onchange="handleModalPermitFileSelect(event)">
                    </div>
                    <div id="modal-permit-preview-strip" class="hidden" style="margin-top:10px; display:flex; align-items:center; justify-content:space-between; padding:10px 14px; background:#eff6ff; border-radius:8px; border:1px solid #bfdbfe;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-file-image" style="color:#2563eb; font-size:1.1rem;"></i>
                            <span id="modal-permit-file-name" style="font-size:0.84rem; font-weight:700; color:#1e40af;">filename.jpg</span>
                        </div>
                        <button type="button" onclick="clearModalPermitFile()" style="background:none; border:none; color:#e11d48; cursor:pointer; font-size:0.82rem; font-weight:700;"><i class="fa-solid fa-trash-can"></i> Remove</button>
                    </div>
                </div>

                <!-- 2. Issued Date & Expiration Date -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                    <div>
                        <label for="modal-permit-issued-date" style="display:block; font-size:0.82rem; font-weight:700; color:#334155; margin-bottom:6px;">Permit Issued Date <span style="color:#ef4444;">*</span></label>
                        <input type="date" id="modal-permit-issued-date" required style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; box-sizing:border-box;">
                    </div>
                    <div>
                        <label for="modal-permit-expiry-date" style="display:block; font-size:0.82rem; font-weight:700; color:#0f172a; margin-bottom:6px;">Permit Expiration Date <span style="color:#ef4444;">*</span></label>
                        <input type="date" id="modal-permit-expiry-date" required style="width:100%; padding:10px 14px; border:1.5px solid #2563eb; border-radius:8px; font-size:0.88rem; font-weight:600; box-sizing:border-box;">
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                    <button type="button" onclick="closeUploadPermitModal()" style="padding:10px 18px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-weight:600; font-size:0.86rem; color:#475569;">Dismiss</button>
                    <button type="submit" id="btn-submit-modal-permit" style="padding:10px 22px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; border:none; border-radius:8px; font-weight:800; font-size:0.88rem; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(37,99,235,0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Submit Permit
                    </button>
                </div>
            </form>
        </div>
    </div>`;

    if (modalPattern.test(content)) {
        content = content.replace(modalPattern, cleanModalHtml);
    }

    fs.writeFileSync(f, content, 'utf8');
    console.log('HTML updated:', f, '| Has view-provider-permits:', content.includes('id="view-provider-permits"'), '| Has nav-item-permits:', content.includes('id="nav-item-permits"'));
});

// 2. UPDATE JS FILES
jsFiles.forEach(f => {
    if (!fs.existsSync(f)) return;
    let js = fs.readFileSync(f, 'utf8');

    // Remove switchProviderView route for permits-section
    js = js.replace(/\s*else if \(cleanHash === 'permits-section' \|\| cleanHash === 'view-provider-permits'\) \{[\s\S]*?\}/g, '');
    js = js.replace(/ \|\| \(targetViewId === 'view-provider-permits' && href === '#permits-section'\)/g, '');

    // In handleNotificationClick: open modal if notification is about permit
    if (!js.includes("str.includes('permit') || str.includes('license')")) {
        const notifMatch = "else if (str.includes('subscription') || str.includes('plan')) {\n            window.location.hash = '#subscription-section';\n            switchProviderView('#subscription-section');\n        }";
        const notifMatchCrlf = "else if (str.includes('subscription') || str.includes('plan')) {\r\n            window.location.hash = '#subscription-section';\r\n            switchProviderView('#subscription-section');\r\n        }";
        const notifAddition = "\n        else if (str.includes('permit') || str.includes('license') || (relatedType && relatedType.toLowerCase().includes('permit'))) {\n            if (typeof window.openUploadPermitModal === 'function') window.openUploadPermitModal();\n        }";
        const notifAdditionCrlf = "\r\n        else if (str.includes('permit') || str.includes('license') || (relatedType && relatedType.toLowerCase().includes('permit'))) {\r\n            if (typeof window.openUploadPermitModal === 'function') window.openUploadPermitModal();\r\n        }";

        if (js.includes(notifMatchCrlf)) {
            js = js.replace(notifMatchCrlf, notifMatchCrlf + notifAdditionCrlf);
        } else if (js.includes(notifMatch)) {
            js = js.replace(notifMatch, notifMatch + notifAddition);
        }
    }

    // Replace loadProviderPermitStatus with clean logic that pops up when admin notice is present
    const loadStatusRegex = /const loadProviderPermitStatus = async \(\) => \{[\s\S]*?window\.submitProviderPermitRenewal = async/m;
    const cleanLoadStatusLogic = `const loadProviderPermitStatus = async () => {
        try {
            const res = await fetch('/api/providers/permit-status', {
                headers: { 'Authorization': \`Bearer \${token}\` }
            });
            const data = await res.json();
            if (!data.success || !data.permit) {
                return;
            }

            const p = data.permit;
            const permitStatus = p.permitStatus || 'Not_Set';
            const daysRemaining = p.daysRemaining;
            const isRenewalPending = (p.PermitRenewalStatus === 'Pending_Review' || p.PermitRenewalStatus === 'Pending');
            const hasAdminNotice = !!p.PermitNoticeSentAt;

            // AUTO POP-UP MODAL: If admin sent a compliance notice (or expired) and renewal is not pending
            if ((hasAdminNotice || permitStatus === 'Expired') && !isRenewalPending) {
                setTimeout(() => {
                    if (typeof window.openUploadPermitModal === 'function') {
                        window.openUploadPermitModal();
                    }
                }, 600);
            }

            // Overview Dashboard Alert Banner
            const banner = document.getElementById('provider-permit-alert-banner');
            const bannerTitle = document.getElementById('permit-alert-title');
            const bannerDesc = document.getElementById('permit-alert-desc');
            const bannerBtn = document.getElementById('permit-alert-btn');
            const bannerIcon = document.getElementById('permit-alert-icon');
            const bannerIconBox = document.getElementById('permit-alert-icon-box');

            if (banner) {
                if (isRenewalPending) {
                    banner.classList.remove('hidden');
                    banner.style.background = '#eff6ff';
                    banner.style.borderColor = '#bfdbfe';
                    if (bannerIconBox) { bannerIconBox.style.background = '#dbeafe'; bannerIconBox.style.color = '#2563eb'; }
                    if (bannerIcon) bannerIcon.className = 'fa-solid fa-hourglass-half';
                    if (bannerTitle) bannerTitle.textContent = 'Permit Submitted for Review';
                    if (bannerDesc) bannerDesc.textContent = 'Your business permit has been submitted and is currently being verified by the administrator.';
                    if (bannerBtn) {
                        bannerBtn.textContent = 'Re-upload Permit';
                        bannerBtn.style.background = '#2563eb';
                        bannerBtn.style.color = '#fff';
                    }
                } else if (hasAdminNotice || permitStatus === 'Expired') {
                    banner.classList.remove('hidden');
                    banner.style.background = '#fef2f2';
                    banner.style.borderColor = '#fecaca';
                    if (bannerIconBox) { bannerIconBox.style.background = '#fee2e2'; bannerIconBox.style.color = '#dc2626'; }
                    if (bannerIcon) bannerIcon.className = 'fa-solid fa-triangle-exclamation';
                    if (bannerTitle) bannerTitle.textContent = 'Action Required: Submit Business Permit';
                    if (bannerDesc) bannerDesc.textContent = 'The administrator has issued a notice requesting your updated business permit with issued and expiration dates.';
                    if (bannerBtn) {
                        bannerBtn.textContent = 'Upload Permit Now';
                        bannerBtn.style.background = '#dc2626';
                        bannerBtn.style.color = '#fff';
                    }
                } else if (permitStatus === 'Expiring_Soon') {
                    banner.classList.remove('hidden');
                    banner.style.background = '#fffbeb';
                    banner.style.borderColor = '#fde68a';
                    if (bannerIconBox) { bannerIconBox.style.background = '#fef3c7'; bannerIconBox.style.color = '#d97706'; }
                    if (bannerIcon) bannerIcon.className = 'fa-solid fa-triangle-exclamation';
                    if (bannerTitle) bannerTitle.textContent = 'Business Permit Expiring Soon';
                    if (bannerDesc) bannerDesc.textContent = \`Your registered business permit will expire in \${daysRemaining} day(s). Please submit your renewed permit.\`;
                    if (bannerBtn) {
                        bannerBtn.textContent = 'Upload Permit';
                        bannerBtn.style.background = '#d97706';
                        bannerBtn.style.color = '#fff';
                    }
                } else {
                    banner.classList.add('hidden');
                }
            }

        } catch (err) {
            console.error('Error loading provider permit status:', err);
        }
    };

    window.submitProviderPermitRenewal = async`;

    if (loadStatusRegex.test(js)) {
        js = js.replace(loadStatusRegex, cleanLoadStatusLogic);
    }

    // Modal submit logic: ensures issuedDate and expiryDate are sent
    const submitModalRegex = /window\.submitModalPermitUpload = async \(event\) => \{[\s\S]*?window\.clearModalPermitFile\(\);[\s\S]*?window\.closeUploadPermitModal\(\);[\s\S]*?loadProviderPermitStatus\(\);[\s\S]*?\};[\s\S]*?\};/m;
    const cleanSubmitModalLogic = `window.submitModalPermitUpload = async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('modal-input-permit-file');
        const file = modalSelectedPermitFile || (fileInput && fileInput.files ? fileInput.files[0] : null);

        if (!file) {
            showToast('Please attach a photo or document of your business permit.', 'error');
            return;
        }

        const issuedDateInput = document.getElementById('modal-permit-issued-date');
        const issuedDate = issuedDateInput ? issuedDateInput.value : '';
        if (!issuedDate) {
            showToast('Please select the permit issued date.', 'error');
            if (issuedDateInput) issuedDateInput.focus();
            return;
        }

        const expiryDateInput = document.getElementById('modal-permit-expiry-date');
        const expiryDate = expiryDateInput ? expiryDateInput.value : '';
        if (!expiryDate) {
            showToast('Please select the permit expiration date.', 'error');
            if (expiryDateInput) expiryDateInput.focus();
            return;
        }

        const parsedDate = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate <= today) {
            showToast('The expiration date must be in the future.', 'error');
            if (expiryDateInput) expiryDateInput.focus();
            return;
        }

        const btnSubmit = document.getElementById('btn-submit-modal-permit');
        const origBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Permit...';
        }

        try {
            const formData = new FormData();
            formData.append('permitFile', file);
            formData.append('issuedDate', issuedDate);
            formData.append('expiryDate', expiryDate);

            const res = await fetch('/api/providers/permit-renewal', {
                method: 'POST',
                headers: { 'Authorization': \`Bearer \${token}\` },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Business permit submitted! The administrator will review it.', 'success');
                window.clearModalPermitFile();
                if (issuedDateInput) issuedDateInput.value = '';
                if (expiryDateInput) expiryDateInput.value = '';
                window.closeUploadPermitModal();
                if (typeof loadProviderPermitStatus === 'function') {
                    await loadProviderPermitStatus();
                }
            } else {
                showToast(data.message || 'Failed to submit business permit.', 'error');
            }
        } catch (err) {
            console.error('Error submitting permit modal:', err);
            showToast('Network error while submitting permit. Please try again.', 'error');
        } finally {
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = origBtnHtml;
            }
        }
    };`;

    if (submitModalRegex.test(js)) {
        js = js.replace(submitModalRegex, cleanSubmitModalLogic);
    }

    fs.writeFileSync(f, js, 'utf8');
    console.log('JS updated:', f);
});
