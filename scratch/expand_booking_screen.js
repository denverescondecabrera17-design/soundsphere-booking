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

    // Replace the restricted width container with full-width layout
    css = css.replace(
        /\.booking-page-container\s*\{[\s\S]*?box-sizing:\s*border-box\s*!important;\s*\}/,
`.booking-page-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 24px 48px 60px 48px !important;
    box-sizing: border-box !important;
}`
    );

    // Update breakpoints
    css = css.replace(
        /@media\s*\(max-width:\s*1024px\)\s*\{\s*\.booking-page-container\s*\{[^}]*\}/,
`@media (max-width: 1024px) {
    .booking-page-container {
        width: 100% !important;
        padding: 20px 24px 40px 24px !important;
    }`
    );

    css = css.replace(
        /@media\s*\(max-width:\s*640px\)\s*\{\s*\.booking-page-container\s*\{[^}]*\}/,
`@media (max-width: 640px) {
    .booking-page-container {
        width: 100% !important;
        padding: 16px 16px 36px 16px !important;
    }`
    );

    fs.writeFileSync(f, css, 'utf-8');
    console.log('Updated CSS: ' + f);
}

// 2. UPDATE HTML FILES NAVBAR PADDING TO 48px FOR PRECISE EDGE ALIGNMENT
const htmlFiles = [
    path.join(rootDir, 'client', 'booking.html'),
    path.join(rootDir, 'client', 'pages', 'booking.html'),
    path.join(rootDir, 'public', 'booking.html')
];

for (const f of htmlFiles) {
    if (!fs.existsSync(f)) continue;
    let html = fs.readFileSync(f, 'utf-8');

    // Align padding: 0 40px to padding: 0 48px
    html = html.replace(/padding:\s*0\s*40px;/g, 'padding: 0 48px;');

    fs.writeFileSync(f, html, 'utf-8');
    console.log('Updated HTML: ' + f);
}

console.log('Full screen booking layout applied successfully.');
