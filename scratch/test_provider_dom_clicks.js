const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

async function testProviderDashboardDOM() {
    console.log('--- TESTING SERVICE PROVIDER DASHBOARD DOM & INTERACTIVITY ---');

    const htmlPath = path.join(__dirname, '..', 'client', 'provider', 'dashboard.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    const jsPath = path.join(__dirname, '..', 'client', 'provider', 'js', 'provider.js');
    const jsContent = fs.readFileSync(jsPath, 'utf8');

    const dom = new JSDOM(htmlContent, {
        url: 'http://localhost:5000/provider/dashboard.html',
        runScripts: 'dangerously',
        resources: 'usable'
    });

    const window = dom.window;
    const document = window.document;

    // Set mock user in localStorage so auth guard passes
    window.localStorage.setItem('soundsphere_jwt_token', 'mock_test_token_123');
    window.localStorage.setItem('soundsphere_user_info', JSON.stringify({
        userId: 13,
        email: 'denvercabrera.apo@gmail.com',
        name: 'Pro Audio & Stage Lights',
        role: 'ServiceProvider'
    }));

    // Inject provider.js script into window
    try {
        const scriptEl = document.createElement('script');
        scriptEl.textContent = jsContent;
        document.body.appendChild(scriptEl);
        console.log('✓ provider.js injected successfully.');
    } catch (e) {
        console.error('❌ Failed to parse/inject provider.js:', e);
        return;
    }

    // Trigger DOMContentLoaded
    const event = new window.Event('DOMContentLoaded');
    document.dispatchEvent(event);

    console.log('\n--- TESTING CLICK HANDLERS ---');

    // Helper click function
    const testClick = (id, desc) => {
        const el = document.getElementById(id);
        if (!el) {
            console.error(`❌ [${desc}] Element #${id} NOT FOUND in DOM!`);
            return false;
        }

        try {
            const clickEvt = new window.MouseEvent('click', { bubbles: true, cancelable: true });
            el.dispatchEvent(clickEvt);
            console.log(`✓ [${desc}] Click dispatched to #${id}.`);
            return true;
        } catch (err) {
            console.error(`❌ [${desc}] Error clicking #${id}:`, err);
            return false;
        }
    };

    // Test 1: Provider Profile Dropdown Button
    testClick('providerProfileButton', 'Profile Dropdown Trigger');
    const dropdown = document.getElementById('providerProfileDropdown');
    const isDropdownVisible = dropdown && dropdown.style.display !== 'none' && !dropdown.classList.contains('hidden');
    console.log(`  └─ Dropdown visible after click? ${isDropdownVisible ? 'YES ✓' : 'NO ❌'}`);

    // Test 2: Sidebar My Services
    testClick('nav-services', 'Sidebar Link: My Services');
    const tabServices = document.getElementById('tab-services-view');
    const isServicesVisible = tabServices && tabServices.style.display !== 'none' && !tabServices.classList.contains('hidden');
    console.log(`  └─ Tab #tab-services-view visible after click? ${isServicesVisible ? 'YES ✓' : 'NO ❌'}`);

    // Test 3: Sidebar Service Packages
    testClick('nav-packages', 'Sidebar Link: Service Packages');
    const tabPackages = document.getElementById('tab-packages-view');
    const isPackagesVisible = tabPackages && tabPackages.style.display !== 'none' && !tabPackages.classList.contains('hidden');
    console.log(`  └─ Tab #tab-packages-view visible after click? ${isPackagesVisible ? 'YES ✓' : 'NO ❌'}`);

    // Test 4: Header Messages Link
    testClick('top-btn-messages', 'Header Messages Link');
    const tabMessages = document.getElementById('tab-messages-view');
    const isMessagesVisible = tabMessages && tabMessages.style.display !== 'none' && !tabMessages.classList.contains('hidden');
    console.log(`  └─ Tab #tab-messages-view visible after click? ${isMessagesVisible ? 'YES ✓' : 'NO ❌'}`);

    // Test 5: Notification Bell Button
    testClick('btn-notification-bell', 'Header Notification Bell');
    const notifPanel = document.getElementById('notification-panel');
    const isNotifVisible = notifPanel && notifPanel.style.display !== 'none' && !notifPanel.classList.contains('hidden');
    console.log(`  └─ Panel #notification-panel visible after click? ${isNotifVisible ? 'YES ✓' : 'NO ❌'}`);

    // Test 6: Sidebar Dashboard
    testClick('nav-dashboard', 'Sidebar Link: Dashboard');
    const tabDashboard = document.getElementById('tab-dashboard-view');
    const isDashboardVisible = tabDashboard && tabDashboard.style.display !== 'none' && !tabDashboard.classList.contains('hidden');
    console.log(`  └─ Tab #tab-dashboard-view visible after click? ${isDashboardVisible ? 'YES ✓' : 'NO ❌'}`);

    console.log('\n--- DOM TEST FINISHED ---');
}

testProviderDashboardDOM();
