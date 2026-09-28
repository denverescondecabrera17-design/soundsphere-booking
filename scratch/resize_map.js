const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE CSS FILES
const cssFiles = [
    path.join(rootDir, 'client', 'css', 'booking.css'),
    path.join(rootDir, 'client', 'pages', 'css', 'booking.css'),
    path.join(rootDir, 'public', 'css', 'booking.css')
];

for (const f of cssFiles) {
    if (!fs.existsSync(f)) continue;
    let css = fs.readFileSync(f, 'utf-8');

    // Replace map-container-box height
    css = css.replace(
        /\.map-container-box\s*\{[\s\S]*?box-sizing:\s*border-box\s*!important;\s*\}/,
`.map-container-box {
    width: 100% !important;
    height: 580px !important;
    border-radius: 16px;
    border: 1.5px solid #cbd5e1;
    overflow: hidden;
    margin-top: 12px;
    background: #e2e8f0;
    box-sizing: border-box !important;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}`
    );

    // Update mobile media query to keep mobile friendly
    if (css.includes('@media (max-width: 640px)')) {
        css = css.replace(
            /@media\s*\(max-width:\s*640px\)\s*\{/,
`@media (max-width: 640px) {
    .map-container-box {
        height: 380px !important;
    }`
        );
    }

    fs.writeFileSync(f, css, 'utf-8');
    console.log('Updated CSS: ' + f);
}

// 2. UPDATE HTML FILES
const htmlFiles = [
    path.join(rootDir, 'client', 'booking.html'),
    path.join(rootDir, 'client', 'pages', 'booking.html'),
    path.join(rootDir, 'public', 'booking.html')
];

for (const f of htmlFiles) {
    if (!fs.existsSync(f)) continue;
    let html = fs.readFileSync(f, 'utf-8');

    html = html.replace(/id="booking-google-map"\s*class="map-container-box"\s*style="height:\s*420px;"/g, 'id="booking-google-map" class="map-container-box" style="height: 580px;"');

    fs.writeFileSync(f, html, 'utf-8');
    console.log('Updated HTML: ' + f);
}

console.log('Map enlargement completed successfully.');
