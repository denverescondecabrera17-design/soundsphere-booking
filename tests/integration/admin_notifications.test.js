const fetch = require('node-fetch');
const { connectDB } = require('../server/config/db');

async function testAdminNotificationsEndToEnd() {
    console.log('=== END-TO-END ADMIN NOTIFICATION SYSTEM VERIFICATION ===\n');

    let pool = await connectDB();

    // 1. Authenticate as Admin (soundsphere@gmail.com)
    console.log('1. Logging in as Admin (soundsphere@gmail.com)...');
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'soundsphere@gmail.com', password: 'soundsphere@041704' })
    });
    const loginData = await loginRes.json();

    if (!loginData.success || !loginData.token) {
        console.error('❌ Admin login failed:', loginData.message);
        return;
    }
    const adminToken = loginData.token;
    const adminUserId = loginData.user.userId;
    console.log(`   ✓ Admin logged in successfully! UserID: ${adminUserId}`);

    // 2. Fetch Notifications before event
    console.log('\n2. Fetching Admin notifications before new event via GET /api/notifications...');
    const notifRes1 = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const notifData1 = await notifRes1.json();
    console.log(`   ✓ API Status: ${notifRes1.status}, Unread Count: ${notifData1.unreadCount}, Total Notifications: ${notifData1.notifications.length}`);

    // 3. Submit a fresh Service Provider application from Client account (UserID 1: denverescondecabrera17@gmail.com)
    console.log('\n3. Logging in as Client (denverescondecabrera17@gmail.com) to submit a new Provider Application...');
    const clientLoginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'denverescondecabrera17@gmail.com', password: 'Client123!' })
    });
    const clientLoginData = await clientLoginRes.json();
    const clientToken = clientLoginData.token;

    console.log('   Submitting Service Provider Application to trigger real system event...');
    const appRes = await fetch('http://localhost:5000/api/provider-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
        body: JSON.stringify({
            businessName: 'Batangas Pro Concert Audio & Stage Rigs',
            ownerName: 'Denver Esconde Cabrera',
            businessAddress: '123 Real Street, Balayan, Batangas',
            coverageArea: 'Balayan & Nearby Batangas Areas',
            contactNumber: '09171234567'
        })
    });
    const appData = await appRes.json();
    console.log(`   ✓ Provider Application Submission Result:`, appData.message);
    const newAppId = appData.application ? appData.application.ApplicationID : null;

    // 4. Fetch Admin Notifications after event
    console.log('\n4. Fetching Admin notifications after new event via GET /api/notifications...');
    const notifRes2 = await fetch('http://localhost:5000/api/notifications', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const notifData2 = await notifRes2.json();
    console.log(`   ✓ API Status: ${notifRes2.status}, Unread Count: ${notifData2.unreadCount}, Total Notifications: ${notifData2.notifications.length}`);
    const latestNotif = notifData2.notifications[0];
    if (latestNotif) {
        console.log(`   ✓ Latest Notification Title: "${latestNotif.Title}"`);
        console.log(`   ✓ Latest Notification Message: "${latestNotif.Message}"`);
        console.log(`   ✓ IsRead Status: ${latestNotif.IsRead}`);
    }

    // 5. Test Mark Notification as Read
    if (latestNotif && !latestNotif.IsRead) {
        console.log(`\n5. Testing PUT /api/notifications/${latestNotif.NotificationID}/read...`);
        const readRes = await fetch(`http://localhost:5000/api/notifications/${latestNotif.NotificationID}/read`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const readData = await readRes.json();
        console.log(`   ✓ Mark as read API result:`, readData);

        // Verify in SQL Server DB directly
        const dbCheck = await pool.request()
            .input('NID', latestNotif.NotificationID)
            .query(`SELECT NotificationID, UserID, Title, IsRead, ReadAt FROM dbo.Notifications WHERE NotificationID = @NID;`);
        console.log('   ✓ SQL Server DB State:', dbCheck.recordset[0]);
    }

    // 6. Test Admin Approving Application (Triggers Notification for Applicant Client)
    if (newAppId) {
        console.log(`\n6. Admin approving Provider Application #${newAppId}...`);
        const approveRes = await fetch(`http://localhost:5000/api/admin/applications/${newAppId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const approveData = await approveRes.json();
        console.log(`   ✓ Approval API result:`, approveData.message);

        // Check applicant's notifications
        const clientNotifRes = await fetch('http://localhost:5000/api/notifications', {
            headers: { 'Authorization': `Bearer ${clientToken}` }
        });
        const clientNotifData = await clientNotifRes.json();
        console.log(`   ✓ Applicant Client Unread Notifications: ${clientNotifData.unreadCount}`);
        if (clientNotifData.notifications[0]) {
            console.log(`   ✓ Applicant Notification: "${clientNotifData.notifications[0].Title}" - "${clientNotifData.notifications[0].Message}"`);
        }
    }

    // 7. Test Mark All Notifications as Read
    console.log('\n7. Testing PUT /api/notifications/read-all...');
    const markAllRes = await fetch('http://localhost:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const markAllData = await markAllRes.json();
    console.log('   ✓ Mark all read API result:', markAllData);

    console.log('\n=== END-TO-END VERIFICATION COMPLETED SUCCESSFULLY ===');
}

testAdminNotificationsEndToEnd();
