const { getPool, connectDB } = require('../server/config/db');

async function seedProviderData() {
    console.log('=== SEEDING REAL SERVICE PROVIDER DATA IN SQL SERVER ===\n');

    let pool;
    try {
        pool = await connectDB();
    } catch (e) {
        console.error('Failed to connect to database:', e.message);
        return;
    }

    // 1. Find or verify Provider User Account
    const userRes = await pool.request().query(`
        SELECT u.UserID, u.Email, u.RoleID, r.RoleName, sp.ProviderID, sp.BusinessName
        FROM dbo.Users u
        LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        WHERE u.Email = 'denvercabrera.apo@gmail.com' OR r.RoleName = 'ServiceProvider' OR u.RoleID = 3;
    `);

    let providerUser = userRes.recordset && userRes.recordset.length > 0 ? userRes.recordset[0] : null;

    if (!providerUser) {
        console.log('No existing provider user found. Finding any active user...');
        const anyUserRes = await pool.request().query(`SELECT TOP 1 UserID, Email FROM dbo.Users;`);
        if (anyUserRes.recordset.length > 0) {
            providerUser = anyUserRes.recordset[0];
        } else {
            console.error('No users found in database!');
            return;
        }
    }

    const providerUserId = providerUser.UserID;
    console.log(`✓ Target Provider UserID: ${providerUserId} (${providerUser.Email})`);

    // Ensure Provider record exists in dbo.ServiceProviders
    let providerId = providerUser.ProviderID;
    if (!providerId) {
        console.log('Creating entry in dbo.ServiceProviders...');
        try {
            const spIns = await pool.request()
                .input('UserID', providerUserId)
                .input('BusinessName', 'Pro Audio & Stage Lights')
                .input('CoverageArea', 'Batangas City & Cavite')
                .query(`
                    INSERT INTO dbo.ServiceProviders (UserID, BusinessName, CoverageArea, VerificationStatus, IsActive, CreatedAt)
                    OUTPUT INSERTED.ProviderID
                    VALUES (@UserID, @BusinessName, @CoverageArea, 'Approved', 1, GETDATE());
                `);
            providerId = spIns.recordset[0].ProviderID;
        } catch (e) {
            console.warn('Notice creating ServiceProviders:', e.message);
        }
    }
    console.log(`✓ Target ProviderID: ${providerId}`);

    // Update Provider Business Name across tables
    try {
        await pool.request()
            .input('UserID', providerUserId)
            .query(`
                UPDATE dbo.ServiceProviders SET BusinessName = 'Pro Audio & Stage Lights', VerificationStatus = 'Approved' WHERE UserID = @UserID;
                UPDATE dbo.ProviderApplications SET BusinessName = 'Pro Audio & Stage Lights' WHERE UserID = @UserID;
            `);
    } catch (e) { console.warn('Notice updating BusinessName:', e.message); }

    // 2. Clean out existing test records for this Provider
    console.log('\n2. Cleaning existing test records for Provider...');
    try { await pool.request().input('UserID', providerUserId).query(`DELETE FROM dbo.Packages WHERE UserID = @UserID;`); } catch (e) {}
    try { await pool.request().input('UserID', providerUserId).query(`DELETE FROM dbo.Services WHERE ProviderUserID = @UserID OR UserID = @UserID;`); } catch (e) {}
    try { await pool.request().input('UserID', providerUserId).query(`DELETE FROM dbo.Withdrawals WHERE ProviderUserID = @UserID OR UserID = @UserID;`); } catch (e) {}
    try { await pool.request().input('UserID', providerUserId).query(`DELETE FROM dbo.Notifications WHERE UserID = @UserID;`); } catch (e) {}
    if (providerId) {
        try { await pool.request().input('ProviderID', providerId).query(`DELETE FROM dbo.Reviews WHERE ProviderID = @ProviderID;`); } catch (e) {}
        try { await pool.request().input('ProviderID', providerId).query(`DELETE FROM dbo.Bookings WHERE ProviderID = @ProviderID;`); } catch (e) {}
    }
    console.log('✓ Cleaned old test data.');

    // 3. Seed Service Packages (dbo.Packages)
    console.log('\n3. Inserting Service Packages...');
    const packages = [
        {
            name: 'Pro Concert Audio Package',
            category: 'Concert Audio',
            price: 25000.00,
            description: 'Complete high-power line array sound system for major concerts, festivals, and outdoor live shows.',
            inclusions: '12x Line Array Speakers, 4x Dual 18 Subwoofers, 32-Channel Digital Mixer, 6x Stage Monitors, 4x Wireless Mics, Sound Engineer'
        },
        {
            name: 'Wedding & Debut Deluxe Lighting & Sound',
            category: 'Lighting & Sound',
            price: 18500.00,
            description: 'Premium ambient lighting setup with crystal-clear acoustics tailored for grand weddings and debuts.',
            inclusions: '4x Powered Active Speakers, 2x Powered Subwoofers, 8x Beam Moving Heads, 12x LED Par Lights, Heavy Fog Machine, DMX Controller'
        },
        {
            name: 'Corporate Seminar & Acoustic Set',
            category: 'General Audio',
            price: 12000.00,
            description: 'Professional PA setup for corporate conferences, product launches, and intimate acoustic performances.',
            inclusions: '4x Full Range PA Speakers, 4x Lapel & Handheld Mics, 4K Projector & 100-inch Motorized Screen, Audio Technician'
        }
    ];

    for (const pkg of packages) {
        try {
            await pool.request()
                .input('UserID', providerUserId)
                .input('PackageName', pkg.name)
                .input('Category', pkg.category)
                .input('Price', pkg.price)
                .input('Description', pkg.description)
                .input('Inclusions', pkg.inclusions)
                .query(`
                    INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions, IsActive, CreatedAt)
                    VALUES (@UserID, @PackageName, @Category, @Price, @Description, @Inclusions, 1, GETDATE());
                `);
            console.log(`   + Added Package: "${pkg.name}" (₱${pkg.price})`);
        } catch (e) {
            console.warn(`   - Notice adding package ${pkg.name}:`, e.message);
        }
    }

    // 4. Seed Services (dbo.Services if table exists)
    console.log('\n4. Inserting Services...');
    const services = [
        { name: 'Full Stage Sound System Rental', category: 'Concert Audio', price: 15000.00, description: 'Standalone sound system rental with crew.' },
        { name: 'Intelligent Lighting & Trussing Rig', category: 'Lighting & Sound', price: 10000.00, description: 'Computer-controlled stage lighting trusses.' },
        { name: 'Dry Ice Low Fog & Sparkular Effects', category: 'Effects', price: 5000.00, description: 'Cold sparkular fountains and heavy low fog for first dance.' }
    ];

    for (const srv of services) {
        try {
            await pool.request()
                .input('ProviderUserID', providerUserId)
                .input('ServiceName', srv.name)
                .input('Category', srv.category)
                .input('Price', srv.price)
                .input('Description', srv.description)
                .query(`
                    INSERT INTO dbo.Services (ProviderUserID, ServiceName, Category, Price, Description, IsAvailable, CreatedAt)
                    VALUES (@ProviderUserID, @ServiceName, @Category, @Price, @Description, 1, GETDATE());
                `);
            console.log(`   + Added Service: "${srv.name}" (₱${srv.price})`);
        } catch (e) {
            console.warn(`   - Services table notice:`, e.message);
        }
    }

    // 5. Seed Bookings (dbo.Bookings)
    console.log('\n5. Inserting Bookings...');
    const todayStr = new Date().toISOString().split('T')[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeekStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const lastWeekStr = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Find a client UserID to attach bookings to
    const clientRes = await pool.request().query(`SELECT TOP 1 UserID FROM dbo.Users WHERE UserID <> ${providerUserId};`);
    const clientUserId = clientRes.recordset.length > 0 ? clientRes.recordset[0].UserID : 8;

    const bookings = [
        {
            packageName: 'Wedding & Debut Deluxe Lighting & Sound',
            eventDate: todayStr,
            eventTime: '04:00 PM - 10:00 PM',
            location: 'Montemaria Grand Hall, Batangas City',
            totalAmount: 18500.00,
            status: 'Confirmed',
            paymentStatus: 'Paid'
        },
        {
            packageName: 'Pro Concert Audio Package',
            eventDate: tomorrowStr,
            eventTime: '06:00 PM - 11:00 PM',
            location: 'Batangas Provincial Coliseum, Batangas',
            totalAmount: 25000.00,
            status: 'Confirmed',
            paymentStatus: 'Paid'
        },
        {
            packageName: 'Corporate Seminar & Acoustic Set',
            eventDate: nextWeekStr,
            eventTime: '09:00 AM - 04:00 PM',
            location: 'LIMA Park Hotel, Malvar, Batangas',
            totalAmount: 12000.00,
            status: 'Pending',
            paymentStatus: 'Unpaid'
        },
        {
            packageName: 'Pro Concert Audio Package',
            eventDate: lastWeekStr,
            eventTime: '05:00 PM - 11:30 PM',
            location: 'Lipa City Amphitheater, Lipa City',
            totalAmount: 25000.00,
            status: 'Completed',
            paymentStatus: 'Paid'
        }
    ];

    let insertedBookingIDs = [];

    for (const bk of bookings) {
        try {
            const bkIns = await pool.request()
                .input('ClientUserID', clientUserId)
                .input('ProviderID', providerId)
                .input('PackageName', bk.packageName)
                .input('EventDate', bk.eventDate)
                .input('EventTime', bk.eventTime)
                .input('Location', bk.location)
                .input('TotalAmount', bk.totalAmount)
                .input('BookingStatus', bk.status)
                .input('PaymentStatus', bk.paymentStatus)
                .query(`
                    INSERT INTO dbo.Bookings
                    (ClientUserID, ProviderID, PackageName, EventDate, EventTime, Location, TotalAmount, BookingStatus, PaymentStatus, CreatedAt)
                    OUTPUT INSERTED.BookingID
                    VALUES
                    (@ClientUserID, @ProviderID, @PackageName, @EventDate, @EventTime, @Location, @TotalAmount, @BookingStatus, @PaymentStatus, GETDATE());
                `);
            const bId = bkIns.recordset[0].BookingID;
            insertedBookingIDs.push(bId);
            console.log(`   + Added Booking #${bId}: "${bk.packageName}" (${bk.status})`);
        } catch (e) {
            console.warn(`   - Notice inserting booking:`, e.message);
        }
    }

    // 6. Seed Reviews (dbo.Reviews)
    console.log('\n6. Inserting Reviews...');
    if (insertedBookingIDs.length > 0) {
        try {
            await pool.request()
                .input('BookingID', insertedBookingIDs[3] || insertedBookingIDs[0])
                .input('UserID', clientUserId)
                .input('ProviderID', providerId)
                .input('Rating', 5)
                .input('ReviewText', 'Stunning sound clarity and unbelievable lighting setup for our grand event! The team was punctual and extremely accommodating.')
                .query(`
                    INSERT INTO dbo.Reviews (BookingID, UserID, ProviderID, Rating, ReviewText, SubmittedAt)
                    VALUES (@BookingID, @UserID, @ProviderID, @Rating, @ReviewText, GETDATE());
                `);
            console.log('   + Added 5-Star Review from Client.');
        } catch (e) {
            console.warn('   - Review notice:', e.message);
        }
    }

    // 7. Seed Notifications (dbo.Notifications)
    console.log('\n7. Inserting Notifications...');
    const notifs = [
        { title: 'New Booking Request', message: 'Sarah Jenkins requested Corporate Seminar & Acoustic Set for ' + nextWeekStr + '.', type: 'Booking' },
        { title: 'Payment Confirmed', message: 'Payment of ₱18,500.00 confirmed for Grand Wedding Reception.', type: 'Payment' }
    ];

    for (const n of notifs) {
        try {
            await pool.request()
                .input('UserID', providerUserId)
                .input('Type', n.type)
                .input('Title', n.title)
                .input('Message', n.message)
                .query(`
                    INSERT INTO dbo.Notifications (UserID, Type, Title, Message, IsRead, CreatedAt)
                    VALUES (@UserID, @Type, @Title, @Message, 0, GETDATE());
                `);
            console.log(`   + Added Notification: "${n.title}"`);
        } catch (e) {
            console.warn('   - Notification notice:', e.message);
        }
    }

    // 8. Seed Withdrawals (dbo.Withdrawals if table exists)
    console.log('\n8. Inserting Completed Payout / Withdrawal Record...');
    try {
        await pool.request()
            .input('ProviderUserID', providerUserId)
            .input('Amount', 25000.00)
            .input('Method', 'GCash')
            .input('AccountName', 'Pro Audio & Stage Lights')
            .input('AccountNumber', '09171234567')
            .query(`
                INSERT INTO dbo.Withdrawals (ProviderUserID, Amount, Method, AccountName, AccountNumber, Status, RequestedAt)
                VALUES (@ProviderUserID, @Amount, @Method, @AccountName, @AccountNumber, 'Approved', DATEADD(day, -3, GETDATE()));
            `);
        console.log('   + Added Approved Withdrawal record (₱25,000.00).');
    } catch (e) {
        console.warn('   - Withdrawal notice:', e.message);
    }

    console.log('\n=== DATA SEEDING COMPLETED SUCCESSFULLY ===');
}

seedProviderData();
