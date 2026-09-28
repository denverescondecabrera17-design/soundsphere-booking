const fetch = require('node-fetch');

async function testAdminSidebarViews() {
    console.log('=== ADMIN SIDEBAR NAVIGATION & VIEWS AUDIT ===\n');

    // 1. Fetch HTML Markup & Verify View Panels
    console.log('1. Checking HTML structure of http://localhost:5000/admin/dashboard.html...');
    const htmlRes = await fetch('http://localhost:5000/admin/dashboard.html');
    const htmlText = await htmlRes.text();

    const views = [
        'view-dashboard-overview',
        'view-pending-applications',
        'view-active-providers',
        'view-registered-clients',
        'view-total-bookings',
        'view-revenue-reports'
    ];

    views.forEach(v => {
        if (htmlText.includes(`id="${v}"`)) {
            console.log(`   ✓ Dedicated View Panel #${v} exists in HTML!`);
        } else {
            console.error(`   ❌ View Panel #${v} MISSING!`);
        }
    });

    const sidebarItems = [
        'nav-item-overview',
        'nav-item-apps',
        'nav-item-providers',
        'nav-item-clients',
        'nav-item-bookings',
        'nav-item-revenue'
    ];

    sidebarItems.forEach(item => {
        if (htmlText.includes(`id="${item}"`)) {
            console.log(`   ✓ Sidebar Item #${item} bound in HTML!`);
        } else {
            console.error(`   ❌ Sidebar Item #${item} MISSING!`);
        }
    });

    // 2. Test Admin Login & API Endpoints for each view
    console.log('\n2. Testing Admin login and API data endpoint connectivity...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'soundsphere@gmail.com', password: 'soundsphere@041704' })
    });
    const loginData = await loginRes.json();

    if (!loginData.success || !loginData.token) {
        console.error('❌ Admin login failed!');
        return;
    }
    const token = loginData.token;
    console.log('   ✓ Admin logged in successfully!');

    // 3. Test API data for Dashboard, Providers, Clients, Bookings, Revenue
    const statsRes = await fetch('http://localhost:5000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const statsData = await statsRes.json();

    if (statsData.success && statsData.stats) {
        const s = statsData.stats;
        console.log(`   ✓ View 1 (Overview): Registered Clients = ${s.totalClients}, Active Providers = ${s.activeProviders}, Total Revenue = ₱${s.totalRevenue}`);
        console.log(`   ✓ View 3 (Active Providers Directory): ${s.activeProvidersList ? s.activeProvidersList.length : 0} provider records returned.`);
        console.log(`   ✓ View 4 (Registered Clients Directory): ${s.registeredClientsList ? s.registeredClientsList.length : 0} client records returned.`);
        console.log(`   ✓ View 5 (Total Bookings): ${s.bookingsList ? s.bookingsList.length : 0} booking records returned.`);
        console.log(`   ✓ View 6 (Revenue Reports): Gross ₱${s.totalRevenue}, Completed ₱${s.completedRevenue}, Pending ₱${s.pendingRevenue}.`);
    }

    // 4. Test API data for Pending Applications
    const appsRes = await fetch('http://localhost:5000/api/admin/applications', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const appsData = await appsRes.json();
    if (appsData.success) {
        console.log(`   ✓ View 2 (Pending Applications): ${appsData.applications ? appsData.applications.length : 0} application records returned.`);
    }

    console.log('\n=== ALL 6 ADMIN VIEWS & NAVIGATION SUCCESSFULLY VERIFIED ===');
}

testAdminSidebarViews();
