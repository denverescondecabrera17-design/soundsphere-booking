/**
 * SoundSphere - Automated Balance Due Reminder Service
 * Scans active bookings with outstanding balances and dispatches:
 * 1. Real-time In-App Notification (dbo.Notifications) 1 day before due date
 * 2. Real Gmail Email Notification via Nodemailer 1 day before due date
 */

const { getPool, sql } = require('../config/db');
const notificationModel = require('../models/notificationModel');
const emailService = require('./emailService');

/**
 * Scan database for bookings whose event/service starts tomorrow (1 day before due date)
 * and have a remaining balance > 0, then notify and email them.
 * @returns {Promise<{checked: number, notified: number, details: Array}>}
 */
const checkAndSendBalanceDueReminders = async () => {
    try {
        const pool = getPool();
        if (!pool) {
            console.log('⚠️ [BALANCE REMINDER] Database pool not yet connected. Skipping check.');
            return { checked: 0, notified: 0, details: [] };
        }

        // Query eligible bookings with remaining balance
        const queryResult = await pool.request().query(`
            SELECT 
                b.BookingID,
                b.BookingReference,
                b.ClientUserID,
                COALESCE(b.ClientName, NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName,
                COALESCE(b.ClientEmail, u.Email) AS ClientEmail,
                b.PackageName,
                b.EventDate,
                b.ServiceStartDate,
                b.ServiceEndDate,
                b.TotalAmount,
                b.AmountPaid,
                b.RemainingBalance,
                b.PaymentStatus,
                b.BookingStatus,
                b.BalanceReminderSentAt
            FROM dbo.Bookings b
            LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            WHERE b.RemainingBalance > 0
              AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
              AND ISNULL(b.PaymentStatus, '') != 'Paid'
              AND b.BalanceReminderSentAt IS NULL
        `);

        const eligibleBookings = queryResult.recordset || [];
        console.log(`🔍 [BALANCE REMINDER] Found ${eligibleBookings.length} booking(s) with remaining balance.`);

        const now = new Date();
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

        let notifiedCount = 0;
        const details = [];

        for (const b of eligibleBookings) {
            const dueDateRaw = b.ServiceStartDate || b.EventDate;
            if (!dueDateRaw) continue;

            const match = String(dueDateRaw).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!match) continue;

            const targetYear = parseInt(match[1], 10);
            const targetMonth = parseInt(match[2], 10) - 1;
            const targetDay = parseInt(match[3], 10);
            const targetMidnight = new Date(targetYear, targetMonth, targetDay).getTime();

            // Calculate day difference (targetDate - today)
            const diffDays = Math.round((targetMidnight - todayMidnight) / (1000 * 60 * 60 * 24));

            // Exactly 1 day before the due date (due date is tomorrow)
            if (diffDays === 1) {
                const bookingRef = b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`;

                // Double check if in-app notification was already sent to avoid duplicate
                const notifCheck = await pool.request()
                    .input('BookingID', sql.Int, b.BookingID)
                    .input('NotificationType', sql.NVarChar(50), 'BalanceDueReminder')
                    .query(`
                        SELECT COUNT(*) AS cnt 
                        FROM dbo.Notifications 
                        WHERE RelatedID = @BookingID 
                          AND NotificationType = @NotificationType
                    `);

                if (notifCheck.recordset[0].cnt > 0) {
                    // Mark sent in Bookings table to optimize future queries
                    await pool.request()
                        .input('BookingID', sql.Int, b.BookingID)
                        .query(`UPDATE dbo.Bookings SET BalanceReminderSentAt = GETDATE() WHERE BookingID = @BookingID`);
                    continue;
                }

                const formattedBalance = parseFloat(b.RemainingBalance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
                const clientName = b.ClientName || 'Client';
                const clientEmail = b.ClientEmail;

                console.log(`🔔 [BALANCE REMINDER] Dispatching 1-day reminder for Booking ${bookingRef} (Due: ${dueDateRaw}, Balance: ₱${formattedBalance})`);

                // 1. Create In-App Notification in dbo.Notifications
                await notificationModel.createNotification({
                    userId: b.ClientUserID,
                    type: 'BalanceDueReminder',
                    title: 'Payment Reminder: Remaining Balance Due Tomorrow',
                    message: `Your booking for "${b.PackageName || 'Event Package'}" (Ref: ${bookingRef}) is scheduled for tomorrow, ${dueDateRaw}. You have an outstanding remaining balance of ₱${formattedBalance}. Please settle your balance.`,
                    relatedId: b.BookingID,
                    relatedType: 'booking'
                });

                // 2. Dispatch Real Email via Gmail SMTP
                let emailSent = false;
                if (clientEmail && clientEmail.includes('@')) {
                    try {
                        await emailService.sendBalanceDueReminderEmail({
                            toEmail: clientEmail,
                            clientName: clientName,
                            bookingReference: bookingRef,
                            packageName: b.PackageName,
                            dueDate: dueDateRaw,
                            remainingBalance: b.RemainingBalance,
                            totalAmount: b.TotalAmount,
                            amountPaid: b.AmountPaid
                        });
                        emailSent = true;
                    } catch (emailErr) {
                        console.error(`⚠️ [BALANCE REMINDER] Email dispatch error for Booking ${bookingRef}:`, emailErr.message);
                    }
                } else {
                    console.warn(`⚠️ [BALANCE REMINDER] No valid client email for Booking ${bookingRef}`);
                }

                // 3. Mark as sent in dbo.Bookings
                await pool.request()
                    .input('BookingID', sql.Int, b.BookingID)
                    .query(`UPDATE dbo.Bookings SET BalanceReminderSentAt = GETDATE() WHERE BookingID = @BookingID`);

                notifiedCount++;
                details.push({
                    bookingId: b.BookingID,
                    bookingRef,
                    dueDate: dueDateRaw,
                    remainingBalance: b.RemainingBalance,
                    clientEmail,
                    isOverdue: false,
                    emailSent
                });
            } else if (diffDays < 0) {
                // Payment is Overdue (Event / Service start date has passed)
                const daysOverdue = Math.abs(diffDays);
                const bookingRef = b.BookingReference || `SS-2026-${String(b.BookingID).padStart(5, '0')}`;

                // Double check if overdue notification was already sent to avoid duplicates
                const notifCheck = await pool.request()
                    .input('BookingID', sql.Int, b.BookingID)
                    .input('NotificationType', sql.NVarChar(50), 'OverduePaymentReminder')
                    .query(`
                        SELECT COUNT(*) AS cnt 
                        FROM dbo.Notifications 
                        WHERE RelatedID = @BookingID 
                          AND NotificationType = @NotificationType
                    `);

                if (notifCheck.recordset[0].cnt > 0) {
                    continue;
                }

                const formattedBalance = parseFloat(b.RemainingBalance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 });
                const clientName = b.ClientName || 'Client';
                const clientEmail = b.ClientEmail;

                console.log(`🚨 [OVERDUE PAYMENT] Dispatching overdue notice for Booking ${bookingRef} (Due: ${dueDateRaw}, ${daysOverdue} days past due, Balance: ₱${formattedBalance})`);

                // 1. Create In-App Notification in dbo.Notifications
                await notificationModel.createNotification({
                    userId: b.ClientUserID,
                    type: 'OverduePaymentReminder',
                    title: '⚠️ Urgent: Payment Overdue',
                    message: `Your booking for "${b.PackageName || 'Event Package'}" (Ref: ${bookingRef}) was due on ${dueDateRaw} (${daysOverdue} day${daysOverdue === 1 ? '' : 's'} ago). You have an overdue balance of ₱${formattedBalance}. Please settle this payment immediately.`,
                    relatedId: b.BookingID,
                    relatedType: 'booking'
                });

                // 2. Dispatch Real Email via Gmail SMTP
                let emailSent = false;
                if (clientEmail && clientEmail.includes('@')) {
                    try {
                        await emailService.sendBalanceDueReminderEmail({
                            toEmail: clientEmail,
                            clientName: clientName,
                            bookingReference: bookingRef,
                            packageName: b.PackageName,
                            dueDate: dueDateRaw,
                            remainingBalance: b.RemainingBalance,
                            totalAmount: b.TotalAmount,
                            amountPaid: b.AmountPaid,
                            isOverdue: true,
                            daysOverdue: daysOverdue
                        });
                        emailSent = true;
                    } catch (emailErr) {
                        console.error(`⚠️ [OVERDUE PAYMENT] Email dispatch error for Booking ${bookingRef}:`, emailErr.message);
                    }
                } else {
                    console.warn(`⚠️ [OVERDUE PAYMENT] No valid client email for Booking ${bookingRef}`);
                }

                notifiedCount++;
                details.push({
                    bookingId: b.BookingID,
                    bookingRef,
                    dueDate: dueDateRaw,
                    remainingBalance: b.RemainingBalance,
                    clientEmail,
                    isOverdue: true,
                    daysOverdue,
                    emailSent
                });
            }
        }

        console.log(`✅ [BALANCE REMINDER] Scan complete. Notified: ${notifiedCount} / Checked: ${eligibleBookings.length}`);
        return { checked: eligibleBookings.length, notified: notifiedCount, details };
    } catch (err) {
        console.error('❌ [BALANCE REMINDER] Service execution error:', err.message);
        return { error: err.message };
    }
};

/**
 * Start the hourly recurring background scheduler
 */
let schedulerInterval = null;

const startBalanceReminderScheduler = () => {
    // Initial run 10 seconds after server boot to allow full pool connection
    setTimeout(() => {
        console.log('⏰ [BALANCE REMINDER SCHEDULER] Running initial balance reminder check...');
        checkAndSendBalanceDueReminders().catch(err => {
            console.error('Initial balance reminder error:', err.message);
        });
    }, 10000);

    // Run periodically every 1 hour (3600000 ms)
    if (!schedulerInterval) {
        schedulerInterval = setInterval(() => {
            console.log('⏰ [BALANCE REMINDER SCHEDULER] Running scheduled hourly balance reminder check...');
            checkAndSendBalanceDueReminders().catch(err => {
                console.error('Scheduled balance reminder error:', err.message);
            });
        }, 60 * 60 * 1000);
        console.log('🚀 [BALANCE REMINDER SCHEDULER] Automated 1-day balance due reminder service registered (Runs every hour).');
    }

    return schedulerInterval;
};

module.exports = {
    checkAndSendBalanceDueReminders,
    startBalanceReminderScheduler
};
