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

console.log("✅ All Unified Service Package module files synchronized successfully!");
