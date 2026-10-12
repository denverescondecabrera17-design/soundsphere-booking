const sql = require('mssql');

const remoteConfig = {
    server: 'db72897.public.databaseasp.net',
    database: 'db72897',
    user: 'db72897',
    password: 'o#7C?9Bb3Ei_',
    port: 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
    }
};

(async () => {
    try {
        const pool = await sql.connect(remoteConfig);
        console.log('Connected to MonsterASP db72897!');

        // Check if SS-2026-00028 already exists on MonsterASP
        const check = await pool.request()
            .input('Ref', 'SS-2026-00028')
            .query("SELECT BookingID FROM dbo.Bookings WHERE BookingReference = @Ref");

        let bookingId;
        if (check.recordset && check.recordset.length > 0) {
            bookingId = check.recordset[0].BookingID;
            console.log(`Booking SS-2026-00028 already exists with BookingID ${bookingId}. Updating status to Confirmed...`);
            await pool.request()
                .input('BookingID', bookingId)
                .input('ClientUserID', 36)
                .query(`
                    UPDATE dbo.Bookings 
                    SET BookingStatus = 'Confirmed',
                        PaymentStatus = 'Partial',
                        AmountPaid = 875.00,
                        RemainingBalance = 875.00,
                        ClientUserID = @ClientUserID
                    WHERE BookingID = @BookingID
                `);
        } else {
            console.log('Inserting SS-2026-00028 into MonsterASP dbo.Bookings...');
            const insertRes = await pool.request()
                .input('ClientUserID', sql.Int, 36)
                .input('ProviderID', sql.Int, 1)
                .input('PackageName', sql.NVarChar(150), 'Birthday Package')
                .input('EventDate', sql.NVarChar(50), '2026-10-25')
                .input('Location', sql.NVarChar(255), 'Private Event Venue, Nasugbu')
                .input('TotalAmount', sql.Decimal(18, 2), 1750.00)
                .input('BookingStatus', sql.NVarChar(20), 'Confirmed')
                .input('PaymentStatus', sql.NVarChar(20), 'Partial')
                .input('BookingReference', sql.NVarChar(50), 'SS-2026-00028')
                .input('PackageID', sql.Int, 17)
                .input('EventName', sql.NVarChar(150), 'Birthday Celebration')
                .input('EventType', sql.NVarChar(50), 'Birthday')
                .input('StartTime', sql.NVarChar(50), '08:00')
                .input('EndTime', sql.NVarChar(50), '22:00')
                .input('NumberOfDays', sql.Int, 1)
                .input('EventPlace', sql.NVarChar(150), 'Nasugbu')
                .input('VenueName', sql.NVarChar(150), 'Private Event Venue')
                .input('EventAddress', sql.NVarChar(255), 'Barangay 1, Nasugbu, Batangas')
                .input('PackagePrice', sql.Decimal(18, 2), 1000.00)
                .input('PaymentType', sql.NVarChar(50), 'downpayment')
                .input('AmountPaid', sql.Decimal(18, 2), 875.00)
                .input('RemainingBalance', sql.Decimal(18, 2), 875.00)
                .input('CommissionRate', sql.Decimal(5, 2), 5.00)
                .input('CommissionAmount', sql.Decimal(18, 2), 87.50)
                .input('ProviderEarnings', sql.Decimal(18, 2), 1662.50)
                .input('ServiceStartDate', sql.NVarChar(50), '2026-10-25')
                .input('ServiceEndDate', sql.NVarChar(50), '2026-10-25')
                .input('ServiceHireDays', sql.Int, 1)
                .input('TransportationFee', sql.Decimal(18, 2), 750.00)
                .input('DistanceKm', sql.Decimal(6, 2), 18.30)
                .input('EscrowStatus', sql.NVarChar(50), 'Held')
                .input('ClientName', sql.NVarChar(150), 'Denver Cabrera')
                .input('ClientPhone', sql.NVarChar(50), '+63 9516028992')
                .input('ClientEmail', sql.NVarChar(150), 'denverescondecabrera17@gmail.com')
                .query(`
                    INSERT INTO dbo.Bookings (
                        ClientUserID, ProviderID, PackageName, EventDate, Location, TotalAmount,
                        BookingStatus, PaymentStatus, BookingReference, PackageID, EventName, EventType,
                        StartTime, EndTime, NumberOfDays, EventPlace, VenueName, EventAddress,
                        PackagePrice, PaymentType, AmountPaid, RemainingBalance, CommissionRate,
                        CommissionAmount, ProviderEarnings, ServiceStartDate, ServiceEndDate,
                        ServiceHireDays, TransportationFee, DistanceKm, EscrowStatus, ClientName,
                        ClientPhone, ClientEmail, CreatedAt
                    ) VALUES (
                        @ClientUserID, @ProviderID, @PackageName, @EventDate, @Location, @TotalAmount,
                        @BookingStatus, @PaymentStatus, @BookingReference, @PackageID, @EventName, @EventType,
                        @StartTime, @EndTime, @NumberOfDays, @EventPlace, @VenueName, @EventAddress,
                        @PackagePrice, @PaymentType, @AmountPaid, @RemainingBalance, @CommissionRate,
                        @CommissionAmount, @ProviderEarnings, @ServiceStartDate, @ServiceEndDate,
                        @ServiceHireDays, @TransportationFee, @DistanceKm, @EscrowStatus, @ClientName,
                        @ClientPhone, @ClientEmail, GETDATE()
                    );
                    SELECT SCOPE_IDENTITY() AS BookingID;
                `);
            bookingId = insertRes.recordset[0].BookingID;
            console.log(`✓ Inserted Booking into MonsterASP with BookingID ${bookingId}`);
        }

        // Insert Payment into dbo.Payments on MonsterASP
        const payCheck = await pool.request()
            .input('BookingID', bookingId)
            .query("SELECT PaymentID FROM dbo.Payments WHERE BookingID = @BookingID");

        if (payCheck.recordset && payCheck.recordset.length > 0) {
            console.log('Payment already exists on MonsterASP for BookingID:', bookingId);
        } else {
            console.log('Inserting Payment into MonsterASP dbo.Payments...');
            await pool.request()
                .input('BookingID', bookingId)
                .input('Amount', 875.00)
                .input('PaymentMethod', 'QR PH')
                .input('PaymentStatus', 'Paid')
                .input('TransactionReference', 'pay_KARoNfFA8sr7Lp65aNkLgmgN')
                .query(`
                    INSERT INTO dbo.Payments (
                        BookingID, Amount, PaymentMethod, PaymentStatus,
                        TransactionReference, PaidAt, CreatedAt
                    ) VALUES (
                        @BookingID, @Amount, @PaymentMethod, @PaymentStatus,
                        @TransactionReference, GETDATE(), GETDATE()
                    )
                `);
            console.log('✓ Inserted Payment into MonsterASP dbo.Payments');
        }

        // Insert In-App Notification on MonsterASP for User 36
        await pool.request()
            .input('UserID', 36)
            .input('Title', 'Booking Confirmed!')
            .input('Message', 'Your booking for Birthday Package (Ref: SS-2026-00028) has been confirmed!')
            .input('RelatedID', bookingId)
            .query(`
                INSERT INTO dbo.Notifications (
                    UserID, NotificationType, Title, Message, RelatedID, RelatedType, IsRead, CreatedAt
                ) VALUES (
                    @UserID, 'booking_confirmed', @Title, @Message, @RelatedID, 'booking', 0, GETDATE()
                )
            `);
        console.log('✓ Inserted Notification into MonsterASP');

        process.exit(0);
    } catch (err) {
        console.error('Error syncing booking to MonsterASP:', err);
        process.exit(1);
    }
})();
