const fs = require('fs');
const path = require('path');

// 1. Sync provider dashboard.html
const srcHtml = path.join(__dirname, '../client/provider/dashboard.html');
const htmlTargets = [
    path.join(__dirname, '../client/pages/provider/dashboard.html'),
    path.join(__dirname, '../public/provider/dashboard.html'),
    path.join(__dirname, '../public/pages/provider/dashboard.html')
];
const htmlContent = fs.readFileSync(srcHtml, 'utf8');

htmlTargets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, htmlContent, 'utf8');
    console.log(`Synced dashboard.html -> ${target}`);
});

// 2. Sync provider-dashboard.js
const srcJs = path.join(__dirname, '../client/provider/js/provider-dashboard.js');
const jsTargets = [
    path.join(__dirname, '../client/pages/provider/js/provider-dashboard.js'),
    path.join(__dirname, '../public/provider/js/provider-dashboard.js'),
    path.join(__dirname, '../public/pages/provider/js/provider-dashboard.js')
];
const jsContent = fs.readFileSync(srcJs, 'utf8');

jsTargets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, jsContent, 'utf8');
    console.log(`Synced provider-dashboard.js -> ${target}`);
});

// 3. Sync provider-detail.js
const srcDetailJs = path.join(__dirname, '../client/js/provider-detail.js');
const detailTargets = [
    path.join(__dirname, '../client/pages/provider-detail.js'),
    path.join(__dirname, '../public/js/provider-detail.js'),
    path.join(__dirname, '../public/pages/provider-detail.js')
];
const detailContent = fs.readFileSync(srcDetailJs, 'utf8');

detailTargets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, detailContent, 'utf8');
    console.log(`Synced provider-detail.js -> ${target}`);
});

// 4. Sync admin.css
const srcAdminCss = path.join(__dirname, '../client/admin/css/admin.css');
const adminCssTargets = [
    path.join(__dirname, '../public/admin/css/admin.css')
];
if (fs.existsSync(srcAdminCss)) {
    const adminCssContent = fs.readFileSync(srcAdminCss, 'utf8');
    adminCssTargets.forEach(target => {
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, adminCssContent, 'utf8');
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
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, mktContent, 'utf8');
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
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, mktHtmlContent, 'utf8');
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
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, appCssContent, 'utf8');
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
        const dir = path.dirname(target);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(target, appJsContent, 'utf8');
        console.log(`Synced app-platform.js -> ${target}`);
    });
}

console.log("✅ All package photos feature files synchronized successfully!");
