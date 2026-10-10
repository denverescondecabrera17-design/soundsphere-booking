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
    { src: '../client/booking.html', targets: ['../public/booking.html', '../client/pages/booking.html', '../public/pages/booking.html'] },
    { src: '../client/booking-confirmation.html', targets: ['../public/booking-confirmation.html', '../client/pages/booking-confirmation.html', '../public/pages/booking-confirmation.html'] },
    { src: '../client/js/booking.js', targets: ['../public/js/booking.js', '../client/pages/js/booking.js'] },
    { src: '../client/css/booking.css', targets: ['../public/css/booking.css', '../client/pages/css/booking.css'] },
    { src: '../client/js/checkout-modal.js', targets: ['../public/js/checkout-modal.js', '../client/pages/js/checkout-modal.js', '../public/pages/js/checkout-modal.js'] },
    { src: '../client/checkout-modal.html', targets: ['../public/checkout-modal.html', '../client/pages/checkout-modal.html'] },
    { src: '../client/css/login.css', targets: ['../public/css/login.css', '../client/pages/css/login.css', '../public/pages/css/login.css'] },
    { src: '../client/js/login.js', targets: ['../public/js/login.js', '../client/pages/js/login.js', '../public/pages/js/login.js'] },
    { src: '../client/client-messages.html', targets: ['../public/client-messages.html', '../client/pages/client-messages.html', '../public/pages/client-messages.html'] },
    { src: '../client/css/client-messages.css', targets: ['../public/css/client-messages.css', '../client/pages/css/client-messages.css', '../public/pages/css/client-messages.css', '../client/client/css/client-messages.css', '../public/client/css/client-messages.css'] },
    { src: '../client/js/client-messages.js', targets: ['../public/js/client-messages.js', '../client/pages/js/client-messages.js', '../public/pages/js/client-messages.js'] },
    { src: '../client/client-bookings.html', targets: ['../public/client-bookings.html', '../client/pages/client-bookings.html', '../public/pages/client-bookings.html'] },
    { src: '../client/js/client-bookings.js', targets: ['../public/js/client-bookings.js', '../client/pages/js/client-bookings.js', '../public/pages/js/client-bookings.js'] },
    { src: '../client/css/booking-calendar-modal.css', targets: ['../public/css/booking-calendar-modal.css', '../client/pages/css/booking-calendar-modal.css', '../client/client/css/booking-calendar-modal.css', '../public/client/css/booking-calendar-modal.css'] },
    { src: '../client/js/booking-calendar-modal.js', targets: ['../public/js/booking-calendar-modal.js', '../client/pages/js/booking-calendar-modal.js'] },
    { src: '../client/client/dashboard.html', targets: ['../public/client/dashboard.html'] }
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
// 13. Sync profile-modal.js
const srcProfileJs = path.join(__dirname, '../client/js/profile-modal.js');
const profileJsTargets = [
    path.join(__dirname, '../client/pages/js/profile-modal.js'),
    path.join(__dirname, '../public/js/profile-modal.js'),
    path.join(__dirname, '../public/pages/js/profile-modal.js')
];
if (fs.existsSync(srcProfileJs)) {
    const profileJsContent = fs.readFileSync(srcProfileJs, 'utf8');
    profileJsTargets.forEach(target => {
        safeWriteFileSync(target, profileJsContent);
        console.log(`Synced profile-modal.js -> ${target}`);
    });
}

// 14. Sync client/dashboard.html
const srcClientDashHtml = path.join(__dirname, '../client/client/dashboard.html');
const clientDashHtmlTargets = [
    path.join(__dirname, '../public/client/dashboard.html')
];
if (fs.existsSync(srcClientDashHtml)) {
    const clientDashHtmlContent = fs.readFileSync(srcClientDashHtml, 'utf8');
    clientDashHtmlTargets.forEach(target => {
        safeWriteFileSync(target, clientDashHtmlContent);
        console.log(`Synced client/dashboard.html -> ${target}`);
    });
}

// 15. Sync CSS files to client/client/css and public/client/css
['marketplace.css', 'styles.css', 'app-platform.css', 'profile-modal.css'].forEach(file => {
    const src = path.join(__dirname, `../client/css/${file}`);
    if (fs.existsSync(src)) {
        const content = fs.readFileSync(src, 'utf8');
        [
            path.join(__dirname, `../client/client/css/${file}`),
            path.join(__dirname, `../public/client/css/${file}`)
        ].forEach(target => {
            safeWriteFileSync(target, content);
            console.log(`Synced ${file} -> ${target}`);
        });
    }
});

// 16. Sync Cashier Portal Files
const cashierSyncList = [
    { src: '../client/cashier/dashboard.html', targets: ['../public/cashier/dashboard.html', '../client/pages/cashier/dashboard.html'] },
    { src: '../client/cashier/css/cashier.css', targets: ['../public/cashier/css/cashier.css', '../client/pages/cashier/css/cashier.css'] },
    { src: '../client/cashier/js/cashier-dashboard.js', targets: ['../public/cashier/js/cashier-dashboard.js', '../client/pages/cashier/js/cashier-dashboard.js'] },
    { src: '../client/admin/dashboard.html', targets: ['../public/admin/dashboard.html'] }
];

cashierSyncList.forEach(item => {
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

console.log("✅ All files synchronized successfully!");
