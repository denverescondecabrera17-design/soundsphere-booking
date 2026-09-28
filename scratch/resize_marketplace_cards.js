const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. CSS FILES TO UPDATE
const cssFiles = [
    path.join(rootDir, 'client', 'css', 'marketplace.css'),
    path.join(rootDir, 'client', 'pages', 'css', 'marketplace.css'),
    path.join(rootDir, 'public', 'css', 'marketplace.css'),
    path.join(rootDir, 'public', 'pages', 'css', 'marketplace.css'),
    path.join(rootDir, 'client', 'css', 'app-platform.css'),
    path.join(rootDir, 'client', 'pages', 'css', 'app-platform.css'),
    path.join(rootDir, 'public', 'css', 'app-platform.css'),
    path.join(rootDir, 'public', 'pages', 'css', 'app-platform.css')
];

for (const f of cssFiles) {
    if (!fs.existsSync(f)) continue;
    let css = fs.readFileSync(f, 'utf-8');

    // Update .shopee-offer-card max-width
    css = css.replace(/max-width:\s*360px;/g, 'max-width: 520px;');

    // Update .providers-responsive-grid
    css = css.replace(
        /minmax\(280px,\s*340px\)/g,
        'minmax(360px, 500px)'
    );

    // Update .providers-grid minmax
    css = css.replace(
        /\.providers-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(auto-fill,\s*minmax\([^)]+\)\);/g,
        (match) => match.replace(/minmax\([^)]+\)/, 'minmax(360px, 500px)')
    );

    fs.writeFileSync(f, css, 'utf-8');
    console.log('Updated CSS: ' + f);
}

// 2. JS FILES TO UPDATE
const jsFiles = [
    path.join(rootDir, 'client', 'js', 'marketplace.js'),
    path.join(rootDir, 'client', 'pages', 'js', 'marketplace.js'),
    path.join(rootDir, 'public', 'js', 'marketplace.js'),
    path.join(rootDir, 'public', 'pages', 'js', 'marketplace.js'),
    path.join(rootDir, 'client', 'js', 'app-platform.js'),
    path.join(rootDir, 'client', 'pages', 'js', 'app-platform.js'),
    path.join(rootDir, 'public', 'js', 'app-platform.js'),
    path.join(rootDir, 'public', 'pages', 'js', 'app-platform.js')
];

for (const f of jsFiles) {
    if (!fs.existsSync(f)) continue;
    let js = fs.readFileSync(f, 'utf-8');

    // 1. Update shopee-offer-card inline style max-width from 360px to 520px and border-radius to 16px
    js = js.replace(/max-width:360px;\s*width:100%;/g, 'max-width:520px; width:100%; border-radius:16px;');

    // 2. Update offer-card-image-wrap height from 200px to 240px
    js = js.replace(/height:200px;/g, 'height:240px;');

    // 3. Update category & available badge font size & padding
    js = js.replace(/padding:4px 12px;\s*border-radius:16px;\s*font-size:0\.78rem;/g, 'padding:5px 14px; border-radius:16px; font-size:0.84rem;');

    // 4. Update thumbnails from 38px to 44px
    js = js.replace(/width:38px;\s*height:38px;/g, 'width:44px; height:44px;');

    // 5. Update card body padding from 18px 20px 14px 20px to 22px 24px 16px 24px
    js = js.replace(/padding:18px 20px 14px 20px;/g, 'padding:22px 24px 16px 24px;');

    // 6. Update title font size from 1.15rem to 1.35rem
    js = js.replace(/font-size:1\.15rem;\s*font-weight:800;/g, 'font-size:1.35rem; font-weight:800;');

    // 7. Update price font size from 1.45rem to 1.75rem, / Event font size from 0.85rem to 0.95rem
    js = js.replace(/font-size:1\.45rem;\s*font-weight:900;/g, 'font-size:1.75rem; font-weight:900;');
    js = js.replace(/font-size:0\.85rem;\s*color:#475569;/g, 'font-size:0.95rem; color:#475569;');

    // 8. Update star rating badge font size from 0.85rem to 0.95rem
    js = js.replace(/font-size:0\.85rem;\s*font-weight:800;\s*color:#d97706;/g, 'font-size:0.95rem; font-weight:800; color:#d97706;');

    // 9. Update inclusions font size from 0.9rem to 0.98rem and padding from 10px 14px to 12px 16px
    js = js.replace(/padding:10px 14px;\s*border-radius:10px;/g, 'padding:12px 16px; border-radius:12px;');
    js = js.replace(/font-size:0\.78rem;\s*color:#334155;/g, 'font-size:0.84rem; color:#334155;');
    js = js.replace(/font-size:0\.9rem;\s*color:#0f172a;/g, 'font-size:0.98rem; color:#0f172a;');
    js = js.replace(/font-size:0\.85rem;\s*font-weight:900;/g, 'font-size:0.95rem; font-weight:900;');

    // 10. Update provider avatar from 36px to 42px and name from 0.95rem to 1.05rem, location from 0.82rem to 0.9rem
    js = js.replace(/width:36px;\s*height:36px;/g, 'width:42px; height:42px;');
    js = js.replace(/font-size:0\.95rem;\s*font-weight:800;\s*color:#0a192f;/g, 'font-size:1.05rem; font-weight:800; color:#0a192f;');
    js = js.replace(/font-size:0\.82rem;\s*color:#475569;/g, 'font-size:0.9rem; color:#475569;');

    // 11. Update action buttons from height:40px to height:46px and font size to 0.98rem
    js = js.replace(/padding:0 20px 20px 20px;/g, 'padding:0 24px 24px 24px;');
    js = js.replace(/height:40px;/g, 'height:46px;');
    js = js.replace(/font-size:0\.9rem;/g, 'font-size:0.98rem;');
    js = js.replace(/font-size:0\.92rem;/g, 'font-size:1.0rem;');
    js = js.replace(/border-radius:8px;/g, 'border-radius:10px;');

    fs.writeFileSync(f, js, 'utf-8');
    console.log('Updated JS: ' + f);
}

console.log('Marketplace cards enlargement complete!');
