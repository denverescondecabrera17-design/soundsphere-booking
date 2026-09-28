const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

const cssFiles = [
    path.join(rootDir, 'client', 'css', 'provider-detail.css'),
    path.join(rootDir, 'client', 'pages', 'css', 'provider-detail.css'),
    path.join(rootDir, 'public', 'css', 'provider-detail.css'),
    path.join(rootDir, 'public', 'pages', 'css', 'provider-detail.css')
];

const newPackageCardCss = `/* RESPONSIVE HORIZONTAL PACKAGE GRID - EXPANDED & PROMINENT */
.packages-side-by-side-grid,
.package-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 500px));
    gap: 24px;
    width: 100%;
    box-sizing: border-box;
    margin-bottom: 40px;
}

/* Tablet Layout */
@media (max-width: 1023px) {
    .packages-side-by-side-grid,
    .package-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 20px;
    }
}

/* Mobile Layout */
@media (max-width: 767px) {
    .packages-side-by-side-grid,
    .package-grid {
        grid-template-columns: 1fr;
        gap: 16px;
    }
}

/* PACKAGE CARD STYLING - BIGGER & MORE PROMINENT */
.package-card {
    background: #ffffff;
    border: 1.5px solid var(--border-color);
    border-radius: 16px;
    padding: 24px 26px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 5px 18px rgba(10, 25, 47, 0.06);
    transition: all 0.25s ease;
    position: relative;
    width: 100%;
    max-width: 520px;
    box-sizing: border-box;
}

.package-card:hover {
    border-color: var(--blue-accent);
    box-shadow: 0 10px 28px rgba(37, 99, 235, 0.15);
    transform: translateY(-3px);
}

.package-card.selected-active {
    border-color: var(--blue-accent);
    background: #ffffff;
    box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.2);
}

.pkg-header-badge {
    position: absolute;
    top: -12px;
    right: 20px;
    background: var(--navy-dark);
    color: #ffffff;
    font-size: 0.8rem;
    font-weight: 800;
    padding: 5px 14px;
    border-radius: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.pkg-card-title {
    font-size: 1.45rem;
    font-weight: 800;
    color: var(--navy-dark);
    margin-bottom: 10px;
    line-height: 1.3;
}

.pkg-card-price-row {
    display: flex;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-color);
}

.pkg-card-price {
    font-size: 1.95rem;
    font-weight: 900;
    color: var(--blue-accent);
    letter-spacing: -0.5px;
}

.pkg-card-duration {
    font-size: 0.98rem;
    color: var(--text-muted);
    font-weight: 700;
}

.pkg-description-text {
    font-size: 1.02rem;
    font-weight: 500;
    color: #475569;
    margin: 0 0 14px 0;
    line-height: 1.45;
}

.inclusions-list {
    list-style: none;
    padding: 0;
    margin: 0 0 16px 0;
    display: flex;
    flex-direction: column;
    gap: 9px;
    flex: 1;
}

.inclusions-list li {
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--navy-dark);
    display: flex;
    align-items: center;
    gap: 10px;
}

.inclusions-list li i {
    color: #059669;
    font-size: 1.05rem;
    font-weight: 900;
}

/* BOOK PACKAGE NOW BUTTON */
.btn-select-package {
    width: 100%;
    height: 48px;
    background: var(--blue-accent);
    color: #ffffff;
    border: none;
    border-radius: 12px;
    font-family: inherit;
    font-size: 1.08rem;
    font-weight: 800;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 16px;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.24);
}

.btn-select-package:hover {
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(37, 99, 235, 0.3);
}

.package-card.selected-active .btn-select-package {
    background: var(--navy-dark);
    color: #ffffff;
}`;

for (const f of cssFiles) {
    if (!fs.existsSync(f)) {
        console.log('File does not exist: ' + f);
        continue;
    }
    let css = fs.readFileSync(f, 'utf-8');
    const startToken = '/* RESPONSIVE HORIZONTAL PACKAGE GRID';
    const endToken = '/* FOOTER POSITIONING (FOOTER IS THE TRUE END OF PAGE) */';
    
    const sPos = css.indexOf(startToken);
    const ePos = css.indexOf(endToken);
    
    if (sPos !== -1 && ePos !== -1) {
        css = css.slice(0, sPos) + newPackageCardCss + '\n\n' + css.slice(ePos);
        fs.writeFileSync(f, css, 'utf-8');
        console.log('Successfully updated CSS: ' + f);
    } else {
        console.warn('Could not find tokens in ' + f + ' (sPos: ' + sPos + ', ePos: ' + ePos + ')');
    }
}

// UPDATE JS FILES (SCALE PACKAGE PHOTO TO 190px AND THUMBNAILS TO 46px FOR BIGGER DISPLAY)
const jsFiles = [
    path.join(rootDir, 'client', 'js', 'provider-detail.js'),
    path.join(rootDir, 'client', 'pages', 'js', 'provider-detail.js'),
    path.join(rootDir, 'public', 'js', 'provider-detail.js'),
    path.join(rootDir, 'public', 'pages', 'js', 'provider-detail.js'),
    path.join(rootDir, 'client', 'pages', 'provider-detail.js'),
    path.join(rootDir, 'public', 'pages', 'provider-detail.js')
];

for (const f of jsFiles) {
    if (!fs.existsSync(f)) continue;
    let js = fs.readFileSync(f, 'utf-8');
    
    // Replace height:145px or height:165px or height:195px with height:190px
    js = js.replace(/height:\s*(?:145|165|195)px;/g, 'height:190px;');
    // Replace thumbnail with 46px
    js = js.replace(/width:\s*(?:38|42|50)px;\s*height:\s*(?:38|42|50)px;/g, 'width:46px; height:46px;');
    // Also make the "Setup / Equipment Photos" title slightly bolder and clear
    js = js.replace(/font-size:0\.78rem;/g, 'font-size:0.84rem;');
    
    fs.writeFileSync(f, js, 'utf-8');
    console.log('Successfully updated JS: ' + f);
}

console.log('All package cards enlarged successfully.');
