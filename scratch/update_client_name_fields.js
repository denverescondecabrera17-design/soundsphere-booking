const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 1. UPDATE HTML FILES
const htmlFiles = [
    path.join(rootDir, 'client', 'booking.html'),
    path.join(rootDir, 'client', 'pages', 'booking.html'),
    path.join(rootDir, 'public', 'booking.html')
];

const oldHtmlSection = `                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="booking-client-fullname">Full Name <span style="color:#ef4444;">*</span></label>
                                        <input type="text" id="booking-client-fullname" class="form-control" placeholder="e.g. Juan Dela Cruz" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="booking-client-phone">Cellphone Number <span style="color:#ef4444;">*</span></label>
                                        <input type="tel" id="booking-client-phone" class="form-control" placeholder="e.g. 09171234567" required>
                                    </div>
                                </div>

                                <div class="form-row-client-email">
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label for="booking-client-email">Email Address <span style="color:#ef4444;">*</span></label>
                                        <input type="email" id="booking-client-email" class="form-control" placeholder="e.g. juan@example.com" required>
                                    </div>
                                    <div class="form-group" style="margin-bottom:0;">
                                        <label for="booking-client-alt-phone">Optional Contact Number</label>
                                        <input type="tel" id="booking-client-alt-phone" class="form-control" placeholder="e.g. (043) 723 1234 (Optional)">
                                    </div>
                                </div>`;

const newHtmlSection = `                                <div class="form-row-client-name">
                                    <div class="form-group">
                                        <label for="booking-client-firstname">First Name <span style="color:#ef4444;">*</span></label>
                                        <input type="text" id="booking-client-firstname" class="form-control" placeholder="e.g. Juan" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="booking-client-mi">Middle Initial <span style="font-size:0.85rem; color:#64748b; font-weight:500;">(Optional)</span></label>
                                        <input type="text" id="booking-client-mi" class="form-control" placeholder="e.g. D." maxlength="5">
                                    </div>
                                    <div class="form-group">
                                        <label for="booking-client-lastname">Last Name <span style="color:#ef4444;">*</span></label>
                                        <input type="text" id="booking-client-lastname" class="form-control" placeholder="e.g. Dela Cruz" required>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="booking-client-phone">Cellphone Number <span style="color:#ef4444;">*</span></label>
                                        <input type="tel" id="booking-client-phone" class="form-control" placeholder="e.g. 09171234567" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="booking-client-alt-phone">Optional Contact Number</label>
                                        <input type="tel" id="booking-client-alt-phone" class="form-control" placeholder="e.g. (043) 723 1234 (Optional)">
                                    </div>
                                </div>

                                <div class="form-group" style="margin-bottom:0;">
                                    <label for="booking-client-email">Email Address <span style="color:#ef4444;">*</span></label>
                                    <input type="email" id="booking-client-email" class="form-control" placeholder="e.g. juan@example.com" required>
                                </div>`;

for (const f of htmlFiles) {
    if (!fs.existsSync(f)) continue;
    let html = fs.readFileSync(f, 'utf-8');
    if (html.includes('booking-client-fullname')) {
        // Normalize line endings for replacement
        const normHtml = html.replace(/\r\n/g, '\n');
        const normOld = oldHtmlSection.replace(/\r\n/g, '\n');
        if (normHtml.includes(normOld)) {
            html = normHtml.replace(normOld, newHtmlSection);
            fs.writeFileSync(f, html, 'utf-8');
            console.log('Updated HTML: ' + f);
        } else {
            console.warn('Could not find exact block in ' + f + ', using regex replacement');
            html = html.replace(/<div class="form-row">[\s\S]*?id="booking-client-fullname"[\s\S]*?<\/div>\s*<\/div>\s*<div class="form-row-client-email">[\s\S]*?id="booking-client-alt-phone"[\s\S]*?<\/div>\s*<\/div>/, newHtmlSection);
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

const clientNameCssRule = `
/* CLIENT NAME THREE-COLUMN ROW */
.form-row-client-name {
    display: grid !important;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.75fr) minmax(0, 1.2fr) !important;
    gap: 20px !important;
    margin-bottom: 24px !important;
    width: 100% !important;
}

@media (max-width: 640px) {
    .form-row-client-name {
        grid-template-columns: 1fr !important;
    }
}
`;

for (const f of cssFiles) {
    if (!fs.existsSync(f)) continue;
    let css = fs.readFileSync(f, 'utf-8');
    if (!css.includes('.form-row-client-name')) {
        css = css.replace('.form-row {', clientNameCssRule + '\n.form-row {');
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

    // Update DOM selector
    js = js.replace(
        "const clientFullnameInput = document.getElementById('booking-client-fullname');",
`const clientFirstNameInput = document.getElementById('booking-client-firstname');
    const clientMIInput = document.getElementById('booking-client-mi');
    const clientLastNameInput = document.getElementById('booking-client-lastname');`
    );

    // Update autoPopulateClientInfo
    const oldPopulate = `        if (clientFullnameInput && !clientFullnameInput.value) clientFullnameInput.value = fullName;
        if (clientEmailInput && !clientEmailInput.value) clientEmailInput.value = email;
        if (clientPhoneInput && !clientPhoneInput.value) clientPhoneInput.value = phone;`;

    const newPopulate = `        let fName = activeUser.firstName || activeUser.ClientFirstName || '';
        let lName = activeUser.lastName || activeUser.ClientLastName || '';
        let mInit = activeUser.middleInitial || activeUser.middleName || activeUser.ClientMiddleInitial || '';

        if (!fName && fullName) {
            const parts = fullName.trim().split(/\\s+/);
            if (parts.length === 1) {
                fName = parts[0];
            } else if (parts.length === 2) {
                fName = parts[0];
                lName = parts[1];
            } else if (parts.length >= 3) {
                fName = parts[0];
                if (parts[1].length <= 2) {
                    mInit = parts[1].replace(/\\./g, '');
                    lName = parts.slice(2).join(' ');
                } else {
                    lName = parts.slice(1).join(' ');
                }
            }
        }

        if (clientFirstNameInput && !clientFirstNameInput.value) clientFirstNameInput.value = fName;
        if (clientMIInput && !clientMIInput.value) clientMIInput.value = mInit;
        if (clientLastNameInput && !clientLastNameInput.value) clientLastNameInput.value = lName;
        if (clientEmailInput && !clientEmailInput.value) clientEmailInput.value = email;
        if (clientPhoneInput && !clientPhoneInput.value) clientPhoneInput.value = phone;`;

    js = js.replace(oldPopulate, newPopulate);

    // Update form submission extraction
    js = js.replace(
        "const clientFullname = clientFullnameInput ? clientFullnameInput.value.trim() : '';",
`const clientFirstName = clientFirstNameInput ? clientFirstNameInput.value.trim() : '';
            const clientMI = clientMIInput ? clientMIInput.value.trim() : '';
            const clientLastName = clientLastNameInput ? clientLastNameInput.value.trim() : '';
            const clientFullname = [clientFirstName, clientMI ? (clientMI.endsWith('.') ? clientMI : \`\${clientMI}.\`) : '', clientLastName].filter(Boolean).join(' ');`
    );

    // Update validation check
    js = js.replace(
        "if (!clientFullname || !clientPhone || !clientEmail || !eventName",
        "if (!clientFirstName || !clientLastName || !clientPhone || !clientEmail || !eventName"
    );

    fs.writeFileSync(f, js, 'utf-8');
    console.log('Updated JS: ' + f);
}

console.log('Client Name fields updated successfully!');
