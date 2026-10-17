/**
 * SoundSphere - Automated Service Completion & Auto-Acceptance Service
 * Rules:
 * 1. Provider can only click Complete on or after the day of services (ServiceStartDate / EventDate).
 * 2. When provider clicks Complete, status becomes 'Awaiting Client Confirmation' and notifies client.
 * 3. Client can manually accept within 24 hours (1 day).
 * 4. If client doesn't accept within 1 day (1440 minutes), it is automatically accepted as 'Completed'.
 * 5. Once 'Completed', the provider can request a withdrawal to the Cashier.
 */

const { getPool, sql } = require('../config/db');
const notificationModel = require('../models/notificationModel');

/**
 * Scan database for bookings in 'Awaiting Client Confirmation' where at least 24 hours (1440 minutes)
 * have elapsed since CompletionRequestedAt, and automatically transition them to 'Completed'.
 * @returns {Promise<{checked: number, accepted: number, bookings: Array}>}
 */
const checkAndAutoAcceptCompletions = async () => {
    try {
        const pool = getPool();
        if (!pool) {
            return { checked: 0, accepted: 0, bookings: [] };
        }

        const queryResult = await pool.request().query(`
            SELECT 
                b.BookingID,
                b.BookingReference,
                b.ClientUserID,
                b.ProviderID,
                sp.UserID AS ProviderUserID,
                b.CompletionRequestedAt,
                b.TotalAmount,
                b.PackageName,
                COALESCE(b.ClientName, NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
            LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            WHERE b.BookingStatus = 'Awaiting Client Confirmation'
              AND b.CompletionRequestedAt IS NOT NULL
              AND DATEDIFF(MINUTE, b.CompletionRequestedAt, GETDATE()) >= 1440
              AND ISNULL(b.EscrowStatus, '') != 'Disputed'
              AND NOT EXISTS (
                  SELECT 1 FROM dbo.ProviderReports pr
                  WHERE pr.BookingID = b.BookingID AND pr.Status = 'Pending'
              );
        `);

        const overdueList = queryResult.recordset || [];
        if (overdueList.length === 0) {
            return { checked: 0, accepted: 0, bookings: [] };
        }

        const autoAccepted = [];

        for (const bk of overdueList) {
            try {
                await pool.request()
                    .input('BID', sql.Int, bk.BookingID)
                    .query(`
                        UPDATE dbo.Bookings
                        SET BookingStatus = 'Completed',
                            CompletionAcceptedAt = GETDATE(),
                            EscrowStatus = 'Released',
                            UpdatedAt = GETDATE()
                        WHERE BookingID = @BID 
                          AND BookingStatus = 'Awaiting Client Confirmation';
                    `);

                const ref = bk.BookingReference || `BK-${bk.BookingID}`;
                const providerUid = bk.ProviderUserID || bk.ProviderID;

                // Notify Service Provider
                if (providerUid) {
                    await notificationModel.createNotification({
                        userId: providerUid,
                        type: 'booking_auto_completed',
                        title: 'Booking Auto-Accepted (24-Hour Review Elapsed)',
                        message: `Booking ${ref} was automatically accepted as complete after the 24-hour client review window. You can now request your withdrawal to the Cashier.`,
                        relatedId: bk.BookingID,
                        relatedType: 'Booking'
                    });
                }

                // Notify Client
                if (bk.ClientUserID) {
                    await notificationModel.createNotification({
                        userId: bk.ClientUserID,
                        type: 'booking_auto_completed',
                        title: 'Booking Automatically Marked Completed',
                        message: `Booking ${ref} for ${bk.PackageName || 'event service'} was automatically completed following the 24-hour review period.`,
                        relatedId: bk.BookingID,
                        relatedType: 'Booking'
                    });
                }

                autoAccepted.push(bk.BookingID);
            } catch (err) {
                console.error(`[AUTO COMPLETION] Error processing booking #${bk.BookingID}:`, err.message);
            }
        }

        if (autoAccepted.length > 0) {
            console.log(`✅ [AUTO COMPLETION] Successfully auto-accepted ${autoAccepted.length} booking(s): [${autoAccepted.join(', ')}]`);
        }

        return { checked: overdueList.length, accepted: autoAccepted.length, bookings: autoAccepted };
    } catch (e) {
        console.error('Error in checkAndAutoAcceptCompletions:', e.message);
        return { checked: 0, accepted: 0, bookings: [] };
    }
};

/**
 * Start the recurring scheduler for auto-accepting completions
 * Runs every 15 minutes
 */
const startAutoCompletionScheduler = () => {
    console.log('🚀 [AUTO COMPLETION SCHEDULER] Registered 24-hour completion auto-acceptance scheduler (Runs every 15 mins).');

    // Initial check after 10 seconds of server boot
    setTimeout(() => {
        checkAndAutoAcceptCompletions().catch(err => {
            console.error('[AUTO COMPLETION SCHEDULER] Initial check error:', err.message);
        });
    }, 10000);

    // Periodic check every 15 minutes
    setInterval(() => {
        checkAndAutoAcceptCompletions().catch(err => {
            console.error('[AUTO COMPLETION SCHEDULER] Periodic check error:', err.message);
        });
    }, 15 * 60 * 1000);
};

module.exports = {
    checkAndAutoAcceptCompletions,
    startAutoCompletionScheduler
};
