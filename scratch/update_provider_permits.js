const fs = require('fs');
const path = require('path');

const htmlFiles = [
    'public/provider/dashboard.html',
    'public/pages/provider/dashboard.html',
    'client/provider/dashboard.html',
    'client/pages/provider/dashboard.html'
];

const jsFiles = [
    'public/provider/js/provider-dashboard.js',
    'public/pages/provider/js/provider-dashboard.js',
    'client/provider/js/provider-dashboard.js',
    'client/pages/provider/js/provider-dashboard.js'
];

// 1. Update HTML files
htmlFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) return;
    let html = fs.readFileSync(fullPath, 'utf8');

    // A. Add sidebar menu item if not present
    if (!html.includes('id="nav-item-permits"')) {
        const needle = `<a href="#profile-section" class="menu-item" id="nav-item-profile">\n                    <i class="fa-solid fa-id-card"></i> Business Profile\n                </a>`;
        const needleCrlf = `<a href="#profile-section" class="menu-item" id="nav-item-profile">\r\n                    <i class="fa-solid fa-id-card"></i> Business Profile\r\n                </a>`;
        const addition = `\n                <a href="#permits-section" class="menu-item" id="nav-item-permits">\n                    <i class="fa-solid fa-file-shield"></i> Business Permit\n                    <span id="badge-provider-permit-sidebar" class="badge" style="display:none;"></span>\n                </a>`;
        const additionCrlf = `\r\n                <a href="#permits-section" class="menu-item" id="nav-item-permits">\r\n                    <i class="fa-solid fa-file-shield"></i> Business Permit\r\n                    <span id="badge-provider-permit-sidebar" class="badge" style="display:none;"></span>\r\n                </a>`;

        if (html.includes(needleCrlf)) {
            html = html.replace(needleCrlf, needleCrlf + additionCrlf);
        } else if (html.includes(needle)) {
            html = html.replace(needle, needle + addition);
        }
    }

    // B. Make permit-alert-btn a clickable button that triggers openUploadPermitModal()
    html = html.replace(
        /<a href="#permits-section" id="permit-alert-btn"[^>]*>[\s\S]*?<\/a>/,
        `<button type="button" id="permit-alert-btn" onclick="openUploadPermitModal()" style="border:none; cursor:pointer; text-decoration:none; padding:9px 20px; border-radius:8px; font-weight:800; font-size:0.86rem; white-space:nowrap; display:inline-flex; align-items:center; gap:6px; background:#2563eb; color:#fff;">\n                            <i class="fa-solid fa-arrow-up-from-bracket"></i> Upload Permit\n                        </button>`
    );

    // C. Update in-page form to include Issued Date
    if (!html.includes('id="input-provider-renewal-issued"')) {
        const oldExpiryInputRegex = /<!-- Expiry Date Input -->[\s\S]*?<div>[\s\S]*?<label for="input-provider-renewal-expiry"[^>]*>[\s\S]*?<\/div>/;
        const newDatesHtml = `<!-- Dates Grid: Issued Date & Expiry Date -->
                                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                                    <div>
                                        <label for="input-provider-renewal-issued" style="display:block; font-size:0.82rem; font-weight:700; color:#334155; margin-bottom:6px;">Permit Issued Date</label>
                                        <input type="date" id="input-provider-renewal-issued" class="form-control" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; box-sizing:border-box;">
                                    </div>
                                    <div>
                                        <label for="input-provider-renewal-expiry" style="display:block; font-size:0.82rem; font-weight:700; color:#0f172a; margin-bottom:6px;">Permit Expiration Date <span style="color:#ef4444;">*</span></label>
                                        <input type="date" id="input-provider-renewal-expiry" class="form-control" required style="width:100%; padding:10px 14px; border:1.5px solid #2563eb; border-radius:8px; font-size:0.88rem; font-weight:600; box-sizing:border-box;">
                                    </div>
                                </div>
                                <span style="font-size:0.75rem; color:#64748b; margin-top:-8px; display:block;">Our compliance team will verify these dates from your uploaded document.</span>`;

        html = html.replace(oldExpiryInputRegex, newDatesHtml);
    }

    // D. Add Modal dialog for Upload Business Permit before scripts
    if (!html.includes('id="modal-provider-upload-permit"')) {
        const modalHtml = `
    <!-- MODAL: UPLOAD BUSINESS PERMIT -->
    <div class="admin-modal-overlay hidden" id="modal-provider-upload-permit" role="dialog" aria-modal="true" style="z-index:999999;">
        <div class="admin-modal-card" style="max-width:620px;">
            <div style="padding:20px 24px; background:linear-gradient(135deg, #0a192f 0%, #1e293b 100%); color:#ffffff; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #2563eb;">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="width:40px; height:40px; border-radius:10px; background:#2563eb; display:flex; align-items:center; justify-content:center; color:#fff; font-size:1.15rem;">
                        <i class="fa-solid fa-file-shield"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; font-size:1.15rem; font-weight:800; color:#fff;">Upload Business Permit</h3>
                        <p style="margin:2px 0 0 0; font-size:0.78rem; color:#94a3b8;">Submit your municipal/Mayor's permit for compliance</p>
                    </div>
                </div>
                <button type="button" onclick="closeUploadPermitModal()" style="background:none; border:none; color:#cbd5e1; font-size:1.5rem; cursor:pointer;">&times;</button>
            </div>
            
            <form id="form-modal-permit-upload" onsubmit="submitModalPermitUpload(event)" style="padding:24px; display:flex; flex-direction:column; gap:16px;">
                <!-- Drag & Drop Zone -->
                <div>
                    <label style="display:block; font-size:0.82rem; font-weight:700; color:#334155; margin-bottom:6px;">Business Permit Document / Photo <span style="color:#ef4444;">*</span></label>
                    <div id="modal-permit-dropzone" style="border:2px dashed #cbd5e1; border-radius:12px; padding:22px; text-align:center; background:#f8fafc; cursor:pointer; transition:all 0.2s ease;">
                        <i class="fa-solid fa-file-arrow-up" style="font-size:2rem; color:#2563eb; margin-bottom:6px; display:block;"></i>
                        <p style="margin:0 0 4px 0; font-size:0.86rem; font-weight:700; color:#0a192f;">Click to browse or drag &amp; drop permit photo here</p>
                        <span style="font-size:0.74rem; color:#64748b;">Supports JPG, PNG, WEBP, or PDF (up to 10MB)</span>
                        <input type="file" id="modal-input-permit-file" accept="image/jpeg,image/png,image/webp,application/pdf" style="display:none;" onchange="handleModalPermitFileSelect(event)">
                    </div>
                    <div id="modal-permit-preview-strip" class="hidden" style="margin-top:10px; display:flex; align-items:center; justify-content:space-between; padding:8px 14px; background:#eff6ff; border-radius:8px; border:1px solid #bfdbfe;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <i class="fa-solid fa-file-check" style="color:#2563eb;"></i>
                            <span id="modal-permit-file-name" style="font-size:0.82rem; font-weight:700; color:#1e40af;">filename.jpg</span>
                        </div>
                        <button type="button" onclick="clearModalPermitFile()" style="background:none; border:none; color:#e11d48; cursor:pointer; font-size:0.82rem; font-weight:700;"><i class="fa-solid fa-trash-can"></i> Remove</button>
                    </div>
                </div>

                <!-- Permit Number Input -->
                <div>
                    <label for="modal-permit-number" style="display:block; font-size:0.82rem; font-weight:700; color:#334155; margin-bottom:6px;">Permit / License Number (Optional)</label>
                    <input type="text" id="modal-permit-number" placeholder="e.g. BP-2026-09823" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; box-sizing:border-box;">
                </div>

                <!-- Two Dates Grid: Issued Date & Expiration Date -->
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                    <div>
                        <label for="modal-permit-issued-date" style="display:block; font-size:0.82rem; font-weight:700; color:#334155; margin-bottom:6px;">Permit Issued Date</label>
                        <input type="date" id="modal-permit-issued-date" style="width:100%; padding:10px 14px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.88rem; box-sizing:border-box;">
                    </div>
                    <div>
                        <label for="modal-permit-expiry-date" style="display:block; font-size:0.82rem; font-weight:700; color:#0f172a; margin-bottom:6px;">Permit Expiration Date <span style="color:#ef4444;">*</span></label>
                        <input type="date" id="modal-permit-expiry-date" required style="width:100%; padding:10px 14px; border:1.5px solid #2563eb; border-radius:8px; font-size:0.88rem; font-weight:600; box-sizing:border-box;">
                    </div>
                </div>

                <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
                    <button type="button" onclick="closeUploadPermitModal()" style="padding:10px 18px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; cursor:pointer; font-weight:600; font-size:0.86rem; color:#475569;">Cancel</button>
                    <button type="submit" id="btn-submit-modal-permit" style="padding:10px 22px; background:linear-gradient(135deg, #2563eb, #1d4ed8); color:#fff; border:none; border-radius:8px; font-weight:800; font-size:0.88rem; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(37,99,235,0.3);">
                        <i class="fa-solid fa-cloud-arrow-up"></i> Submit Permit
                    </button>
                </div>
            </form>
        </div>
    </div>
`;
        html = html.replace(/<style>/, modalHtml + '\n    <style>');
    }

    fs.writeFileSync(fullPath, html, 'utf8');
    console.log('Updated HTML file:', relPath);
});

// 2. Update JS files
jsFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, '..', relPath);
    if (!fs.existsSync(fullPath)) return;
    let js = fs.readFileSync(fullPath, 'utf8');

    // A. Add permits-section routing in switchProviderView
    if (!js.includes("targetViewId = 'view-provider-permits'")) {
        const needle = "else if (cleanHash === 'subscription-section' || cleanHash === 'view-provider-subscription' || cleanHash === 'plans-selection-grid') {\n            targetViewId = 'view-provider-subscription';\n            loadProviderSubscriptionData();\n        }";
        const needleCrlf = "else if (cleanHash === 'subscription-section' || cleanHash === 'view-provider-subscription' || cleanHash === 'plans-selection-grid') {\r\n            targetViewId = 'view-provider-subscription';\r\n            loadProviderSubscriptionData();\r\n        }";
        const addition = "\n        else if (cleanHash === 'permits-section' || cleanHash === 'view-provider-permits') {\n            targetViewId = 'view-provider-permits';\n            loadProviderPermitStatus();\n        }";
        const additionCrlf = "\r\n        else if (cleanHash === 'permits-section' || cleanHash === 'view-provider-permits') {\r\n            targetViewId = 'view-provider-permits';\r\n            loadProviderPermitStatus();\r\n        }";

        if (js.includes(needleCrlf)) {
            js = js.replace(needleCrlf, needleCrlf + additionCrlf);
        } else if (js.includes(needle)) {
            js = js.replace(needle, needle + addition);
        }
    }

    // B. Include issuedDate in submitProviderPermitRenewal
    if (!js.includes("formData.append('issuedDate', issuedDateInput.value)")) {
        const needleExpiry = "formData.append('expiryDate', expiryDate);";
        const additionIssued = "formData.append('expiryDate', expiryDate);\n\n            const issuedDateInput = document.getElementById('input-provider-renewal-issued');\n            if (issuedDateInput && issuedDateInput.value) {\n                formData.append('issuedDate', issuedDateInput.value);\n            }";
        js = js.replace(needleExpiry, additionIssued);
    }

    // C. Add modal functions if not present
    if (!js.includes('window.openUploadPermitModal')) {
        const modalFunctions = `
    // -------------------------------------------------------------
    // Business Permit Upload Modal Logic
    // -------------------------------------------------------------
    let modalSelectedPermitFile = null;

    window.openUploadPermitModal = () => {
        const modal = document.getElementById('modal-provider-upload-permit');
        if (modal) {
            modal.classList.remove('hidden');
        } else if (typeof switchProviderView === 'function') {
            switchProviderView('#permits-section');
        }
    };

    window.closeUploadPermitModal = () => {
        const modal = document.getElementById('modal-provider-upload-permit');
        if (modal) modal.classList.add('hidden');
    };

    window.handleModalPermitFileSelect = (event) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (!file) return;

        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.type)) {
            showToast('Please select a valid image (JPG, PNG, WEBP) or PDF document.', 'error');
            event.target.value = '';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showToast('Document size exceeds 10MB limit. Please upload a smaller file.', 'error');
            event.target.value = '';
            return;
        }

        modalSelectedPermitFile = file;
        const previewStrip = document.getElementById('modal-permit-preview-strip');
        const fileNameEl = document.getElementById('modal-permit-file-name');
        if (previewStrip && fileNameEl) {
            fileNameEl.textContent = \`\${file.name} (\${(file.size / 1024).toFixed(1)} KB)\`;
            previewStrip.classList.remove('hidden');
        }
    };

    window.clearModalPermitFile = () => {
        modalSelectedPermitFile = null;
        const fileInput = document.getElementById('modal-input-permit-file');
        if (fileInput) fileInput.value = '';
        const previewStrip = document.getElementById('modal-permit-preview-strip');
        if (previewStrip) previewStrip.classList.add('hidden');
    };

    window.submitModalPermitUpload = async (event) => {
        event.preventDefault();
        const fileInput = document.getElementById('modal-input-permit-file');
        const file = modalSelectedPermitFile || (fileInput && fileInput.files ? fileInput.files[0] : null);

        if (!file) {
            showToast('Please attach a copy or photo of your business permit.', 'error');
            return;
        }

        const expiryDateInput = document.getElementById('modal-permit-expiry-date');
        const expiryDate = expiryDateInput ? expiryDateInput.value : '';

        if (!expiryDate) {
            showToast('Please select the expiration date stated on your permit.', 'error');
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

        const issuedDateInput = document.getElementById('modal-permit-issued-date');
        const issuedDate = issuedDateInput ? issuedDateInput.value : '';

        const permitNumberInput = document.getElementById('modal-permit-number');
        const permitNumber = permitNumberInput ? permitNumberInput.value.trim() : '';

        const btnSubmit = document.getElementById('btn-submit-modal-permit');
        const origBtnHtml = btnSubmit ? btnSubmit.innerHTML : '';
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting Permit...';
        }

        try {
            const formData = new FormData();
            formData.append('permitFile', file);
            formData.append('expiryDate', expiryDate);
            if (issuedDate) formData.append('issuedDate', issuedDate);
            if (permitNumber) formData.append('permitNumber', permitNumber);

            const res = await fetch('/api/providers/permit-renewal', {
                method: 'POST',
                headers: { 'Authorization': \`Bearer \${token}\` },
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('✓ Business permit submitted! Our compliance team will review it shortly.', 'success');
                window.clearModalPermitFile();
                if (expiryDateInput) expiryDateInput.value = '';
                if (issuedDateInput) issuedDateInput.value = '';
                if (permitNumberInput) permitNumberInput.value = '';
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
    };

    // Modal Dropzone wiring
    const modalDropzone = document.getElementById('modal-permit-dropzone');
    if (modalDropzone) {
        modalDropzone.addEventListener('click', () => {
            const fileInput = document.getElementById('modal-input-permit-file');
            if (fileInput) fileInput.click();
        });

        modalDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            modalDropzone.style.borderColor = '#2563eb';
            modalDropzone.style.background = '#eff6ff';
        });

        modalDropzone.addEventListener('dragleave', () => {
            modalDropzone.style.borderColor = '#cbd5e1';
            modalDropzone.style.background = '#f8fafc';
        });

        modalDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            modalDropzone.style.borderColor = '#cbd5e1';
            modalDropzone.style.background = '#f8fafc';
            if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
                const fileInput = document.getElementById('modal-input-permit-file');
                if (fileInput) {
                    fileInput.files = e.dataTransfer.files;
                    window.handleModalPermitFileSelect({ target: fileInput });
                }
            }
        });
    }
`;
        js = js + '\n' + modalFunctions;
    }

    fs.writeFileSync(fullPath, js, 'utf8');
    console.log('Updated JS file:', relPath);
});
