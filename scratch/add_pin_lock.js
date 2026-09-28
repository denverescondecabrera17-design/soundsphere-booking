const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE HTML FILES
const htmlFiles = [
    path.join(rootDir, 'client', 'booking.html'),
    path.join(rootDir, 'client', 'pages', 'booking.html'),
    path.join(rootDir, 'public', 'booking.html')
];

const oldMapCoordsHtml = `                                    <div style="font-size:0.82rem; color:#64748b; margin-top:4px;">
                                        📍 Lat: <span id="display-lat">13.9782</span> | Lng: <span id="display-lng">120.6272</span>
                                    </div>`;

const newMapLockBarHtml = `                                    <div style="display:flex; align-items:center; justify-content:space-between; margin-top:10px; flex-wrap:wrap; gap:10px;">
                                        <div style="font-size:0.88rem; color:#475569; font-weight:600; display:flex; align-items:center; gap:6px;">
                                            <i class="fa-solid fa-location-dot" style="color:#ef4444;"></i>
                                            <span>Lat: <strong id="display-lat" style="color:#0f172a;">13.9782</strong> | Lng: <strong id="display-lng" style="color:#0f172a;">120.6272</strong></span>
                                            <span id="pin-lock-status-badge" style="display:none; margin-left:8px; padding:3px 10px; border-radius:12px; background:#dcfce7; color:#15803d; font-size:0.78rem; font-weight:800; border:1px solid #bbf7d0;">
                                                <i class="fa-solid fa-lock"></i> PIN LOCKED
                                            </span>
                                        </div>

                                        <button type="button" id="btn-toggle-pin-lock" class="btn-pin-lock" title="Click to lock pinned location so accidental map clicks or movements will not change it">
                                            <i class="fa-solid fa-lock-open" id="pin-lock-icon"></i>
                                            <span id="pin-lock-label">Lock Pinned Location</span>
                                        </button>
                                    </div>`;

for (const f of htmlFiles) {
    if (!fs.existsSync(f)) continue;
    let html = fs.readFileSync(f, 'utf-8');
    if (!html.includes('btn-toggle-pin-lock')) {
        const normHtml = html.replace(/\r\n/g, '\n');
        const normOld = oldMapCoordsHtml.replace(/\r\n/g, '\n');
        if (normHtml.includes(normOld)) {
            html = normHtml.replace(normOld, newMapLockBarHtml);
            fs.writeFileSync(f, html, 'utf-8');
            console.log('Updated HTML: ' + f);
        } else {
            // Regex fallback
            html = html.replace(/<div style="font-size:0\.82rem; color:#64748b; margin-top:4px;">[\s\S]*?<\/div>/, newMapLockBarHtml);
            fs.writeFileSync(f, html, 'utf-8');
            console.log('Regex updated HTML: ' + f);
        }
    }
}

// 2. UPDATE CSS FILES
const cssFiles = [
    path.join(rootDir, 'client', 'css', 'booking.css'),
    path.join(rootDir, 'client', 'pages', 'css', 'booking.css'),
    path.join(rootDir, 'public', 'css', 'booking.css')
];

const pinLockCss = `
/* PIN LOCK BUTTON STYLES */
.btn-pin-lock {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 7px 16px;
    border-radius: 10px;
    font-family: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1.5px solid #2563eb;
    background: #eff6ff;
    color: #2563eb;
    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.12);
}

.btn-pin-lock:hover {
    background: #dbeafe;
    transform: translateY(-1px);
}

.btn-pin-lock.locked {
    background: #10b981 !important;
    color: #ffffff !important;
    border-color: #059669 !important;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25) !important;
}

.btn-pin-lock.locked:hover {
    background: #059669 !important;
}
`;

for (const f of cssFiles) {
    if (!fs.existsSync(f)) continue;
    let css = fs.readFileSync(f, 'utf-8');
    if (!css.includes('.btn-pin-lock')) {
        css += '\n' + pinLockCss;
        fs.writeFileSync(f, css, 'utf-8');
        console.log('Updated CSS: ' + f);
    }
}

// 3. UPDATE JS FILES
const jsFiles = [
    path.join(rootDir, 'client', 'js', 'booking.js'),
    path.join(rootDir, 'client', 'pages', 'js', 'booking.js'),
    path.join(rootDir, 'public', 'js', 'booking.js')
];

for (const f of jsFiles) {
    if (!fs.existsSync(f)) continue;
    let js = fs.readFileSync(f, 'utf-8');

    if (!js.includes('isPinLocked')) {
        // 1. Declare isPinLocked and UI toggle helper inside initGoogleMap or global scope of init
        const anchor = "const initGoogleMap = async () => {";
        const lockSetupCode = `const initGoogleMap = async () => {
        let isPinLocked = false;
        const btnTogglePinLock = document.getElementById('btn-toggle-pin-lock');
        const pinLockIcon = document.getElementById('pin-lock-icon');
        const pinLockLabel = document.getElementById('pin-lock-label');
        const pinLockBadge = document.getElementById('pin-lock-status-badge');

        const updatePinLockUI = () => {
            if (!btnTogglePinLock) return;
            if (isPinLocked) {
                btnTogglePinLock.classList.add('locked');
                if (pinLockIcon) pinLockIcon.className = 'fa-solid fa-lock';
                if (pinLockLabel) pinLockLabel.textContent = 'Pin Locked (Click to Unlock)';
                if (pinLockBadge) pinLockBadge.style.display = 'inline-flex';
            } else {
                btnTogglePinLock.classList.remove('locked');
                if (pinLockIcon) pinLockIcon.className = 'fa-solid fa-lock-open';
                if (pinLockLabel) pinLockLabel.textContent = 'Lock Pinned Location';
                if (pinLockBadge) pinLockBadge.style.display = 'none';
            }
        };

        if (btnTogglePinLock) {
            btnTogglePinLock.addEventListener('click', (e) => {
                e.preventDefault();
                isPinLocked = !isPinLocked;
                updatePinLockUI();

                if (isPinLocked) {
                    if (typeof window.showToast === 'function') {
                        window.showToast('🔒 Location pin is now locked! Map touches and clicks will not change your venue.', 'success');
                    }
                } else {
                    if (typeof window.showToast === 'function') {
                        window.showToast('🔓 Location pin unlocked. You can now click or drag to adjust your venue.', 'info');
                    }
                }
            });
        }`;

        js = js.replace(anchor, lockSetupCode);

        // 2. Leaflet selectPlaceOnMap check
        js = js.replace(
            "const selectPlaceOnMap = (lat, lng, displayName = null) => {",
            `const selectPlaceOnMap = (lat, lng, displayName = null, force = false) => {
                    if (isPinLocked && !force) {
                        if (typeof window.showToast === 'function') {
                            window.showToast('🔒 Location pin is locked. Click "Pin Locked" below to unlock.', 'info');
                        }
                        return;
                    }`
        );

        // 3. Leaflet map click check
        js = js.replace(
            "leafletMap.on('click', (e) => {",
            `leafletMap.on('click', (e) => {
                    if (isPinLocked) {
                        if (typeof window.showToast === 'function') {
                            window.showToast('🔒 Location pin is locked. Click "Pin Locked" below to unlock if you want to move it.', 'info');
                        }
                        return;
                    }`
        );

        // 4. Leaflet marker dragend check
        js = js.replace(
            "leafletMarker.on('dragend', (e) => {",
            `leafletMarker.on('dragend', (e) => {
                    if (isPinLocked) return;`
        );

        // 5. Place select change check
        js = js.replace(
            "if (placeSelect) {\n                    placeSelect.addEventListener('change', () => {",
            `if (placeSelect) {\n                    placeSelect.addEventListener('change', () => {\n                        if (isPinLocked) return;`
        );

        // 6. Search map button check
        js = js.replace(
            "btnSearchMap.addEventListener('click', async () => {\n                        const q = mapSearchInput.value.trim();",
            `btnSearchMap.addEventListener('click', async () => {\n                        if (isPinLocked) {\n                            if (typeof window.showToast === 'function') window.showToast('🔒 Location pin is locked. Please unlock it below first.', 'warning');\n                            return;\n                        }\n                        const q = mapSearchInput.value.trim();`
        );

        fs.writeFileSync(f, js, 'utf-8');
        console.log('Updated JS: ' + f);
    }
}

console.log('Pin lock functionality added successfully!');
