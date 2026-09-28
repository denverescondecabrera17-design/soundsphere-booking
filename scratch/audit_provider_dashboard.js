const fs = require('fs');
const path = require('path');

function auditProviderFiles() {
    console.log('=== SOUNDSPHERE PROVIDER PORTAL AUDIT ===\n');

    const htmlPath = path.join(__dirname, '..', 'client', 'provider', 'dashboard.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const jsPath = path.join(__dirname, '..', 'client', 'provider', 'js', 'provider.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    // 1. Check Script Tags in HTML
    console.log('1. Checking Script Tags in client/provider/dashboard.html:');
    const scriptRegex = /<script\s+[^>]*src=["']([^"']+)["']/g;
    let match;
    let missingScripts = [];

    while ((match = scriptRegex.exec(htmlContent)) !== null) {
        const src = match[1];
        let diskPath = '';
        if (src.startsWith('/')) {
            diskPath = path.join(__dirname, '..', 'client', src);
        } else if (src.startsWith('../')) {
            diskPath = path.join(__dirname, '..', 'client', src.replace('../', ''));
        } else {
            diskPath = path.join(__dirname, '..', 'client', 'provider', src);
        }
        
        // Clean query strings
        diskPath = diskPath.split('?')[0];

        const exists = fs.existsSync(diskPath) || fs.existsSync(diskPath.replace(/\\client\\/, '\\public\\'));
        console.log(`   - Script: "${src}" -> Disk: "${diskPath}" | Exists? ${exists ? 'YES ✓' : 'NO ❌'}`);
        if (!exists) missingScripts.push(src);
    }

    // 2. Check Interactive Element IDs in HTML vs JS
    console.log('\n2. Checking Interactive Element IDs in HTML vs JS:');
    const requiredIDs = [
        'providerProfileButton',
        'providerProfileDropdown',
        'nav-dashboard',
        'nav-services',
        'nav-packages',
        'nav-bookings',
        'nav-calendar',
        'nav-withdrawal',
        'nav-reviews',
        'top-btn-messages',
        'btn-notification-bell',
        'notification-panel',
        'modal-business-profile',
        'modal-account-settings',
        'modal-add-service',
        'modal-add-package',
        'modal-notification-history'
    ];

    requiredIDs.forEach(id => {
        const inHTML = htmlContent.includes(`id="${id}"`);
        const inJS = jsContent.includes(`'${id}'`) || jsContent.includes(`"${id}"`);
        console.log(`   - ID: "${id}" -> in HTML? ${inHTML ? 'YES ✓' : 'NO ❌'} | in JS? ${inJS ? 'YES ✓' : 'NO ❌'}`);
    });

    // 3. Check for syntax errors in JS by compiling via Function constructor
    console.log('\n3. Checking JavaScript Syntax Validity:');
    try {
        new Function(jsContent);
        console.log('   ✓ provider.js compiled without syntax errors!');
    } catch (e) {
        console.error('   ❌ provider.js syntax error:', e.message);
    }

    console.log('\n=== AUDIT FINISHED ===');
}

auditProviderFiles();
