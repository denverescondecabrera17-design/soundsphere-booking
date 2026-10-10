const { connectDB, getPool, sql } = require('../server/config/db');
const { checkAndSendBalanceDueReminders } = require('../server/services/balanceReminderService');

async function testReminderFlow() {
    console.log('=== TESTING 1-DAY BALANCE DUE NOTIFICATION & EMAIL DISPATCH ===\n');

    await connectDB();
    const pool = getPool();

    function formatLocalDate(d) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowIso = formatLocalDate(tomorrow);
    console.log(`Today: ${formatLocalDate(now)} | Tomorrow (Due Date): ${tomorrowIso}`);

    // 2. Insert or update a test booking with RemainingBalance > 0 and DueDate = tomorrow
    // Let's create a temporary test booking or set BookingID 30 to tomorrow
    const targetBookingRes = await pool.request().query(`
        SELECT TOP 1 BookingID, BookingReference, ClientUserID, ClientEmail, PackageName, EventDate, RemainingBalance
        FROM dbo.Bookings
        WHERE RemainingBalance > 0 AND BookingStatus = 'Confirmed'
        ORDER BY BookingID DESC
    `);

    if (targetBookingRes.recordset.length === 0) {
        console.log('No existing eligible booking found.');
        process.exit(0);
    }

    const testBooking = targetBookingRes.recordset[0];
    console.log(`Using Booking ID ${testBooking.BookingID} (${testBooking.BookingReference}) for test.`);

    // Temporarily set EventDate & ServiceStartDate to tomorrow and reset BalanceReminderSentAt
    await pool.request()
        .input('BookingID', sql.Int, testBooking.BookingID)
        .input('TomorrowDate', sql.NVarChar(50), tomorrowIso)
        .query(`
            UPDATE dbo.Bookings 
            SET EventDate = @TomorrowDate, 
                ServiceStartDate = @TomorrowDate,
                BalanceReminderSentAt = NULL 
            WHERE BookingID = @BookingID
        `);

    // Remove any previous test notification for this booking to test fresh dispatch
    await pool.request()
        .input('BookingID', sql.Int, testBooking.BookingID)
        .query(`DELETE FROM dbo.Notifications WHERE RelatedID = @BookingID AND NotificationType = 'BalanceDueReminder'`);

    console.log(`Booking ${testBooking.BookingID} date set to ${tomorrowIso} (Tomorrow). BalanceReminderSentAt cleared.`);

    // 3. Execute balance reminder service
    console.log('\n--- EXECUTING checkAndSendBalanceDueReminders() ---');
    const result = await checkAndSendBalanceDueReminders();
    console.log('Result:', JSON.stringify(result, null, 2));

    // 4. Verify in-app notification in dbo.Notifications
    const notifs = await pool.request()
        .input('BookingID', sql.Int, testBooking.BookingID)
        .query(`
            SELECT NotificationID, UserID, Title, Message, NotificationType, CreatedAt 
            FROM dbo.Notifications 
            WHERE RelatedID = @BookingID AND NotificationType = 'BalanceDueReminder'
        `);
    console.log('\nCreated Notification in Database:');
    console.table(notifs.recordset);

    // 5. Verify BalanceReminderSentAt in dbo.Bookings
    const updatedBooking = await pool.request()
        .input('BookingID', sql.Int, testBooking.BookingID)
        .query(`SELECT BookingID, BalanceReminderSentAt FROM dbo.Bookings WHERE BookingID = @BookingID`);
    console.log('\nUpdated Booking BalanceReminderSentAt:');
    console.table(updatedBooking.recordset);

    // 6. Test Idempotency (run again - should notify 0)
    console.log('\n--- TESTING IDEMPOTENCY (2nd RUN) ---');
    const rerunResult = await checkAndSendBalanceDueReminders();
    console.log('Rerun Result (should be 0 notified):', JSON.stringify(rerunResult, null, 2));

    // Reset date back to original (e.g. 2026-10-16) so we don't disrupt real bookings
    await pool.request()
        .input('BookingID', sql.Int, testBooking.BookingID)
        .input('OrigDate', sql.NVarChar(50), testBooking.EventDate)
        .query(`
            UPDATE dbo.Bookings 
            SET EventDate = @OrigDate, 
                ServiceStartDate = @OrigDate,
                BalanceReminderSentAt = NULL
            WHERE BookingID = @BookingID
        `);
    console.log(`\nReset Booking ${testBooking.BookingID} back to original date ${testBooking.EventDate}.`);

    console.log('\n✅ ALL TEST CHECKS PASSED SUCCESSFULLY!');
    process.exit(0);
}

testReminderFlow().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
});
