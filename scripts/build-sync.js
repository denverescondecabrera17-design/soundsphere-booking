const fs = require('fs');
const path = require('path');

function safeWriteFileSync(targetPath, content) {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    try {
        fs.writeFileSync(targetPath, content, 'utf8');
    } catch (e) {
        if (e.code === 'EBUSY') {
            try {
                fs.writeFileSync(targetPath, content, 'utf8');
            } catch (err) {
                console.warn(`[SYNC NOTICE] Skipped locked file ${targetPath}: ${err.message}`);
            }
        } else {
            throw e;
        }
    }
}

// 1. Sync provider dashboard.html
const srcHtml = path.join(__dirname, '../client/provider/dashboard.html');
const htmlTargets = [
    path.join(__dirname, '../client/pages/provider/dashboard.html'),
    path.join(__dirname, '../public/provider/dashboard.html'),
    path.join(__dirname, '../public/pages/provider/dashboard.html')
];
if (fs.existsSync(srcHtml)) {
    const htmlContent = fs.readFileSync(srcHtml, 'utf8');
    htmlTargets.forEach(target => {
        safeWriteFileSync(target, htmlContent);
        console.log(`Synced dashboard.html -> ${target}`);
    });
}

// 2. Sync provider-dashboard.js
const srcJs = path.join(__dirname, '../client/provider/js/provider-dashboard.js');
const jsTargets = [
    path.join(__dirname, '../client/pages/provider/js/provider-dashboard.js'),
    path.join(__dirname, '../public/provider/js/provider-dashboard.js'),
    path.join(__dirname, '../public/pages/provider/js/provider-dashboard.js')
];
if (fs.existsSync(srcJs)) {
    const jsContent = fs.readFileSync(srcJs, 'utf8');
    jsTargets.forEach(target => {
        safeWriteFileSync(target, jsContent);
        console.log(`Synced provider-dashboard.js -> ${target}`);
    });
}

// 3. Sync provider-detail.js
const srcDetailJs = path.join(__dirname, '../client/js/provider-detail.js');
const detailTargets = [
    path.join(__dirname, '../client/pages/provider-detail.js'),
    path.join(__dirname, '../public/js/provider-detail.js'),
    path.join(__dirname, '../public/pages/provider-detail.js')
];
if (fs.existsSync(srcDetailJs)) {
    const detailContent = fs.readFileSync(srcDetailJs, 'utf8');
    detailTargets.forEach(target => {
        safeWriteFileSync(target, detailContent);
        console.log(`Synced provider-detail.js -> ${target}`);
    });
}

// 3b. Sync booking.html, booking-confirmation.html, booking.js, booking.css, checkout-modal.js, checkout-modal.html
const syncFilesList = [
    { src: '../client/booking.html', targets: ['../public/booking.html', '../client/pages/booking.html'] },
    { src: '../client/booking-confirmation.html', targets: ['../public/booking-confirmation.html', '../client/pages/booking-confirmation.html'] },
    { src: '../client/js/booking.js', targets: ['../public/js/booking.js', '../client/pages/js/booking.js'] },
    { src: '../client/css/booking.css', targets: ['../public/css/booking.css', '../client/pages/css/booking.css'] },
    { src: '../client/js/checkout-modal.js', targets: ['../public/js/checkout-modal.js', '../client/pages/js/checkout-modal.js', '../public/pages/js/checkout-modal.js'] },
    { src: '../client/checkout-modal.html', targets: ['../public/checkout-modal.html', '../client/pages/checkout-modal.html'] },
    { src: '../client/css/login.css', targets: ['../public/css/login.css', '../client/pages/css/login.css', '../public/pages/css/login.css'] }
];

syncFilesList.forEach(item => {
    const fullSrc = path.join(__dirname, item.src);
    if (fs.existsSync(fullSrc)) {
        const content = fs.readFileSync(fullSrc, 'utf8');
        item.targets.forEach(relTarget => {
            const fullTarget = path.join(__dirname, relTarget);
            safeWriteFileSync(fullTarget, content);
            console.log(`Synced ${path.basename(item.src)} -> ${fullTarget}`);
        });
    }
});

// 4. Sync admin.css
const srcAdminCss = path.join(__dirname, '../client/admin/css/admin.css');
const adminCssTargets = [
    path.join(__dirname, '../public/admin/css/admin.css')
];
if (fs.existsSync(srcAdminCss)) {
    const adminCssContent = fs.readFileSync(srcAdminCss, 'utf8');
    adminCssTargets.forEach(target => {
        safeWriteFileSync(target, adminCssContent);
        console.log(`Synced admin.css -> ${target}`);
    });
}

// 5. Sync marketplace.js
const srcMktJs = path.join(__dirname, '../client/js/marketplace.js');
const mktTargets = [
    path.join(__dirname, '../client/pages/js/marketplace.js'),
    path.join(__dirname, '../public/js/marketplace.js'),
    path.join(__dirname, '../public/pages/js/marketplace.js')
];
if (fs.existsSync(srcMktJs)) {
    const mktContent = fs.readFileSync(srcMktJs, 'utf8');
    mktTargets.forEach(target => {
        safeWriteFileSync(target, mktContent);
        console.log(`Synced marketplace.js -> ${target}`);
    });
}

// 6. Sync marketplace.html
const srcMktHtml = path.join(__dirname, '../client/marketplace.html');
const mktHtmlTargets = [
    path.join(__dirname, '../client/pages/marketplace.html'),
    path.join(__dirname, '../public/marketplace.html'),
    path.join(__dirname, '../public/pages/marketplace.html')
];
if (fs.existsSync(srcMktHtml)) {
    const mktHtmlContent = fs.readFileSync(srcMktHtml, 'utf8');
    mktHtmlTargets.forEach(target => {
        safeWriteFileSync(target, mktHtmlContent);
        console.log(`Synced marketplace.html -> ${target}`);
    });
}

// 7. Sync app-platform.css
const srcAppCss = path.join(__dirname, '../client/css/app-platform.css');
const appCssTargets = [
    path.join(__dirname, '../client/pages/css/app-platform.css'),
    path.join(__dirname, '../public/css/app-platform.css'),
    path.join(__dirname, '../public/pages/css/app-platform.css')
];
if (fs.existsSync(srcAppCss)) {
    const appCssContent = fs.readFileSync(srcAppCss, 'utf8');
    appCssTargets.forEach(target => {
        safeWriteFileSync(target, appCssContent);
        console.log(`Synced app-platform.css -> ${target}`);
    });
}

// 8. Sync app-platform.js
const srcAppJs = path.join(__dirname, '../client/js/app-platform.js');
const appJsTargets = [
    path.join(__dirname, '../client/pages/js/app-platform.js'),
    path.join(__dirname, '../public/js/app-platform.js'),
    path.join(__dirname, '../public/pages/js/app-platform.js')
];
if (fs.existsSync(srcAppJs)) {
    const appJsContent = fs.readFileSync(srcAppJs, 'utf8');
    appJsTargets.forEach(target => {
        safeWriteFileSync(target, appJsContent);
        console.log(`Synced app-platform.js -> ${target}`);
    });
}

// 9. Sync provider-detail.css
const srcDetailCss = path.join(__dirname, '../client/css/provider-detail.css');
const detailCssTargets = [
    path.join(__dirname, '../client/pages/css/provider-detail.css'),
    path.join(__dirname, '../public/css/provider-detail.css'),
    path.join(__dirname, '../public/pages/css/provider-detail.css')
];
if (fs.existsSync(srcDetailCss)) {
    const detailCssContent = fs.readFileSync(srcDetailCss, 'utf8');
    detailCssTargets.forEach(target => {
        safeWriteFileSync(target, detailCssContent);
        console.log(`Synced provider-detail.css -> ${target}`);
    });
}

// 10. Sync provider-detail.html
const srcDetailHtml = path.join(__dirname, '../client/provider-detail.html');
const detailHtmlTargets = [
    path.join(__dirname, '../client/pages/provider-detail.html'),
    path.join(__dirname, '../public/provider-detail.html'),
    path.join(__dirname, '../public/pages/provider-detail.html')
];
if (fs.existsSync(srcDetailHtml)) {
    const detailHtmlContent = fs.readFileSync(srcDetailHtml, 'utf8');
    detailHtmlTargets.forEach(target => {
        safeWriteFileSync(target, detailHtmlContent);
        console.log(`Synced provider-detail.html -> ${target}`);
    });
}

// 11. Sync styles.css
const srcStylesCss = path.join(__dirname, '../client/css/styles.css');
const stylesCssTargets = [
    path.join(__dirname, '../client/pages/css/styles.css'),
    path.join(__dirname, '../public/css/styles.css'),
    path.join(__dirname, '../public/pages/css/styles.css')
];
if (fs.existsSync(srcStylesCss)) {
    const stylesCssContent = fs.readFileSync(srcStylesCss, 'utf8');
    stylesCssTargets.forEach(target => {
        safeWriteFileSync(target, stylesCssContent);
        console.log(`Synced styles.css -> ${target}`);
    });
}

// 12. Sync marketplace.css
const srcMktCss = path.join(__dirname, '../client/css/marketplace.css');
const mktCssTargets = [
    path.join(__dirname, '../client/pages/css/marketplace.css'),
    path.join(__dirname, '../public/css/marketplace.css'),
    path.join(__dirname, '../public/pages/css/marketplace.css')
];
if (fs.existsSync(srcMktCss)) {
    const mktCssContent = fs.readFileSync(srcMktCss, 'utf8');
    mktCssTargets.forEach(target => {
        safeWriteFileSync(target, mktCssContent);
        console.log(`Synced marketplace.css -> ${target}`);
    });
}

console.log("✅ All package photos feature files synchronized successfully!");
