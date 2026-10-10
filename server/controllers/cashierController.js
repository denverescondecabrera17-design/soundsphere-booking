/**
 * SoundSphere - Cashier Controller
 * Handles Payout Disbursements (Withdrawals) and Income & Revenue Reports
 * (Daily, Weekly, Monthly, Yearly)
 */

const { connectDB, sql } = require('../config/db');
const paymongoService = require('../services/paymongoService');

// Helper to log activities
const logActivity = async (pool, userId, action, details, entityType = null, entityId = null) => {
    try {
        if (!pool) return;
        await pool.request()
            .input('UserID', userId || 1)
            .input('Action', action)
            .input('Details', details)
            .input('EntityType', entityType)
            .input('EntityID', entityId ? parseInt(entityId, 10) : null)
            .query(`
                IF OBJECT_ID('dbo.AuditLogs', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.AuditLogs (UserID, Action, Details, EntityType, EntityID, CreatedAt)
                    VALUES (@UserID, @Action, @Details, @EntityType, @EntityID, GETDATE());
                END
            `);
    } catch (e) {
        console.warn('[AuditLog Warning]:', e.message);
    }
};

/**
 * GET /api/cashier/summary
 * Cashier Dashboard Topline Metrics
 */
const getCashierSummary = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. Pending & Completed Withdrawals
        const wResult = await pool.request().query(`
            SELECT 
                COUNT(CASE WHEN Status = 'Pending' THEN 1 END) AS PendingCount,
                ISNULL(SUM(CASE WHEN Status = 'Pending' THEN Amount ELSE 0 END), 0) AS PendingAmount,
                COUNT(CASE WHEN Status = 'Approved' THEN 1 END) AS ApprovedCount,
                ISNULL(SUM(CASE WHEN Status = 'Approved' THEN Amount ELSE 0 END), 0) AS ApprovedAmount,
                ISNULL(SUM(CASE WHEN Status = 'Approved' AND CAST(ProcessedAt AS DATE) = CAST(GETDATE() AS DATE) THEN Amount ELSE 0 END), 0) AS TodayDisbursedAmount
            FROM dbo.Withdrawals;
        `);
        const wStats = wResult.recordset[0] || {};

        // 2. Booking & Revenue Stats
        const bResult = await pool.request().query(`
            SELECT
                ISNULL(SUM(CASE WHEN CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) THEN TotalAmount ELSE 0 END), 0) AS TodayGrossVolume,
                ISNULL(SUM(CASE WHEN CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) THEN ISNULL(CommissionAmount, TotalAmount * 0.05) ELSE 0 END), 0) AS TodayCommission,
                ISNULL(SUM(TotalAmount), 0) AS TotalGrossVolume,
                ISNULL(SUM(ISNULL(CommissionAmount, TotalAmount * 0.05)), 0) AS TotalCommission,
                COUNT(BookingID) AS TotalBookingsCount,
                COUNT(CASE WHEN CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) THEN 1 END) AS TodayBookingsCount
            FROM dbo.Bookings
            WHERE PaymentStatus = 'Paid' OR BookingStatus IN ('Confirmed', 'Completed', 'Approved');
        `);
        const bStats = bResult.recordset[0] || {};

        // 3. Subscription Revenue from dbo.SubscriptionPayments
        let totalSubscriptionIncome = 0;
        let todaySubscriptionIncome = 0;
        try {
            const subRes = await pool.request().query(`
                IF OBJECT_ID('dbo.SubscriptionPayments', 'U') IS NOT NULL
                BEGIN
                    SELECT 
                        ISNULL(SUM(CASE WHEN PaymentStatus = 'Paid' THEN Amount ELSE 0 END), 0) AS TotalSubIncome,
                        ISNULL(SUM(CASE WHEN PaymentStatus = 'Paid' AND CAST(PaymentDate AS DATE) = CAST(GETDATE() AS DATE) THEN Amount ELSE 0 END), 0) AS TodaySubIncome
                    FROM dbo.SubscriptionPayments;
                END
                ELSE
                BEGIN
                    SELECT 0 AS TotalSubIncome, 0 AS TodaySubIncome;
                END
            `);
            if (subRes.recordset && subRes.recordset[0]) {
                totalSubscriptionIncome = parseFloat(subRes.recordset[0].TotalSubIncome || 0);
                todaySubscriptionIncome = parseFloat(subRes.recordset[0].TodaySubIncome || 0);
            }
        } catch (subErr) {
            console.warn('Subscription revenue query notice:', subErr.message);
        }

        // 4. Pending Client Refund Requests from dbo.RefundRequests
        let pendingRefundsCount = 0;
        let pendingRefundsAmount = 0;
        try {
            const refCheck = await pool.request().query(`
                IF OBJECT_ID('dbo.RefundRequests', 'U') IS NOT NULL
                BEGIN
                    SELECT 
                        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) AS PendingCount,
                        ISNULL(SUM(CASE WHEN Status = 'Pending' THEN Amount ELSE 0 END), 0) AS PendingAmount
                    FROM dbo.RefundRequests;
                END
                ELSE
                BEGIN
                    SELECT 0 AS PendingCount, 0 AS PendingAmount;
                END
            `);
            if (refCheck.recordset && refCheck.recordset[0]) {
                pendingRefundsCount = parseInt(refCheck.recordset[0].PendingCount || 0, 10);
                pendingRefundsAmount = parseFloat(refCheck.recordset[0].PendingAmount || 0);
            }
        } catch (rErr) {
            console.warn('Refund requests summary query notice:', rErr.message);
        }

        // 5. Recent Cashier Transactions (Bookings, Withdrawals, Subscriptions, Client Refunds)
        const recentLedger = await pool.request().query(`
            SELECT TOP 10 * FROM (
                SELECT
                    'Withdrawal' AS Type,
                    w.WithdrawalID AS ID,
                    CONCAT('WDR-', w.WithdrawalID) AS Reference,
                    w.Amount,
                    w.Status,
                    COALESCE(w.ProcessedAt, w.RequestedAt) AS Date,
                    w.PayoutMethod AS Method,
                    ISNULL(sp.BusinessName, 'Provider') AS Recipient,
                    'Outflow' AS Flow
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (w.ProviderID = sp.ProviderID OR w.ProviderID = sp.UserID)
                UNION ALL
                SELECT
                    'Client Refund' AS Type,
                    rr.RefundRequestID AS ID,
                    CONCAT('REF-', rr.RefundRequestID) AS Reference,
                    rr.Amount AS Amount,
                    rr.Status AS Status,
                    COALESCE(rr.ProcessedAt, rr.RequestedAt) AS Date,
                    rr.PayoutMethod AS Method,
                    rr.ClientName AS Recipient,
                    'Outflow' AS Flow
                FROM dbo.RefundRequests rr
                UNION ALL
                SELECT
                    'Booking Payment' AS Type,
                    b.BookingID AS ID,
                    ISNULL(b.BookingReference, CONCAT('BK-', b.BookingID)) AS Reference,
                    b.TotalAmount AS Amount,
                    b.PaymentStatus AS Status,
                    b.CreatedAt AS Date,
                    'PayMongo / Online' AS Method,
                    b.PackageName AS Recipient,
                    'Inflow' AS Flow
                FROM dbo.Bookings b
                WHERE b.PaymentStatus = 'Paid' OR b.BookingStatus IN ('Confirmed', 'Completed')
                UNION ALL
                SELECT
                    'Subscription' AS Type,
                    spay.PaymentID AS ID,
                    CONCAT('SUB-', spay.PaymentID) AS Reference,
                    spay.Amount AS Amount,
                    spay.PaymentStatus AS Status,
                    spay.PaymentDate AS Date,
                    spay.PaymentMethod AS Method,
                    ISNULL(sp.BusinessName, 'Provider') AS Recipient,
                    'Inflow' AS Flow
                FROM dbo.SubscriptionPayments spay
                LEFT JOIN dbo.ServiceProviders sp ON spay.ProviderID = sp.ProviderID
                WHERE spay.PaymentStatus = 'Paid'
            ) AS CombinedTransactions
            ORDER BY Date DESC;
        `);

        return res.status(200).json({
            success: true,
            stats: {
                todayGrossVolume: parseFloat(bStats.TodayGrossVolume || 0) + todaySubscriptionIncome,
                todayCommission: parseFloat(bStats.TodayCommission || 0),
                todayDisbursed: parseFloat(wStats.TodayDisbursedAmount || 0),
                todaySubscriptionIncome,
                todayNetIncome: parseFloat(bStats.TodayCommission || 0) + todaySubscriptionIncome,
                pendingWithdrawalsCount: parseInt(wStats.PendingCount || 0, 10),
                pendingWithdrawalsAmount: parseFloat(wStats.PendingAmount || 0),
                pendingRefundsCount,
                pendingRefundsAmount,
                approvedWithdrawalsCount: parseInt(wStats.ApprovedCount || 0, 10),
                approvedWithdrawalsAmount: parseFloat(wStats.ApprovedAmount || 0),
                totalGrossVolume: parseFloat(bStats.TotalGrossVolume || 0) + totalSubscriptionIncome,
                totalPlatformCommission: parseFloat(bStats.TotalCommission || 0),
                totalSubscriptionIncome,
                totalNetPlatformIncome: parseFloat(bStats.TotalCommission || 0) + totalSubscriptionIncome,
                totalBookingsCount: parseInt(bStats.TotalBookingsCount || 0, 10)
            },
            recentTransactions: recentLedger.recordset || []
        });
    } catch (error) {
        console.error('Cashier Summary Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve cashier summary.', error: error.message });
    }
};

/**
 * GET /api/cashier/withdrawals/list
 * Retrieve all provider payout withdrawal requests with PayMongo verification
 */
const getCashierWithdrawals = async (req, res) => {
    try {
        const pool = await connectDB();
        const { status } = req.query;

        let query = `
            SELECT 
                w.WithdrawalID,
                w.ProviderID,
                w.BookingID,
                w.Amount,
                w.PayoutMethod,
                w.AccountName,
                w.AccountReference,
                w.Status,
                w.RequestedAt,
                w.ProcessedAt,
                w.AdminNotes,
                w.PayMongoPayoutID,
                ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                ISNULL(u.Email, u2.Email) AS ProviderEmail,
                u.Phone AS ProviderPhone,
                b.BookingReference,
                b.PackageName,
                b.TotalAmount AS BookingTotalAmount,
                b.AmountPaid AS BookingAmountPaid,
                b.PaymentStatus AS BookingPaymentStatus,
                COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(cClient.FirstName, ' ', cClient.LastName))), ''), uClient.Email, 'Client') AS ClientName,
                uClient.Email AS ClientEmail
            FROM dbo.Withdrawals w
            LEFT JOIN dbo.ServiceProviders sp ON (sp.ProviderID = w.ProviderID OR sp.UserID = w.ProviderID)
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users u2 ON w.ProviderID = u2.UserID
            LEFT JOIN dbo.Bookings b ON w.BookingID = b.BookingID
            LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
            LEFT JOIN dbo.Clients cClient ON uClient.UserID = cClient.UserID
        `;

        if (status && status !== 'All') {
            query += ` WHERE w.Status = @Status `;
        }
        query += ` ORDER BY w.RequestedAt DESC;`;

        const request = pool.request();
        if (status && status !== 'All') {
            request.input('Status', status);
        }

        const result = await request.query(query);
        const withdrawals = result.recordset || [];

        // Enrich each withdrawal with related PayMongo payments from dbo.Payments
        for (const w of withdrawals) {
            let payments = [];
            if (w.BookingID) {
                const pRes = await pool.request()
                    .input('BID', w.BookingID)
                    .query(`
                        SELECT PaymentID, BookingID, Amount, PaymentMethod, PaymentStatus, TransactionReference, PaidAt
                        FROM dbo.Payments
                        WHERE BookingID = @BID
                        ORDER BY PaidAt DESC;
                    `);
                payments = pRes.recordset || [];
            } else {
                const pRes = await pool.request()
                    .input('PID', w.ProviderID)
                    .query(`
                        SELECT TOP 5 p.PaymentID, p.BookingID, p.Amount, p.PaymentMethod, p.PaymentStatus, p.TransactionReference, p.PaidAt,
                               b.BookingReference, COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName
                        FROM dbo.Payments p
                        JOIN dbo.Bookings b ON p.BookingID = b.BookingID
                        LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
                        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                        WHERE (b.ProviderID = @PID OR b.ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @PID))
                          AND p.PaymentStatus = 'Paid'
                        ORDER BY p.PaidAt DESC;
                    `);
                payments = pRes.recordset || [];
            }

            w.paymongoPayments = payments;
            const totalPaidInPaymongo = payments.reduce((sum, p) => sum + parseFloat(p.Amount || 0), 0);
            w.totalPayMongoPaid = totalPaidInPaymongo;
            w.isPayMongoVerified = payments.length > 0 && payments.some(p => p.PaymentStatus === 'Paid');
            w.primaryPayMongoRef = payments[0]?.TransactionReference || (w.BookingReference ? `PM-${w.BookingReference}` : `PM-VERIFIED-${w.WithdrawalID}`);
            w.primaryPaymentMethod = payments[0]?.PaymentMethod || 'PayMongo Gateway';
        }

        return res.status(200).json({
            success: true,
            withdrawals
        });
    } catch (error) {
        console.error('Cashier Withdrawals Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve withdrawal requests.', error: error.message });
    }
};

/**
 * PUT /api/cashier/withdrawals/:id/approve
 * Cashier disburses and marks payout request as Paid & Approved
 */
const approveWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { referenceNumber, notes, paymentMethod } = req.body || {};
        const cashierUserId = req.user ? req.user.userId : 1;
        const pool = await connectDB();

        // 1. Fetch withdrawal details
        const wRes = await pool.request()
            .input('WID', id)
            .query(`
                SELECT w.*, 
                    COALESCE(sp.UserID, w.ProviderID) AS TargetUserID,
                    sp.BusinessName 
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (w.ProviderID = sp.ProviderID OR w.ProviderID = sp.UserID)
                WHERE w.WithdrawalID = @WID;
            `);

        if (!wRes.recordset || !wRes.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
        }

        const w = wRes.recordset[0];
        if (w.Status === 'Approved') {
            return res.status(400).json({ success: false, message: 'This withdrawal request has already been approved and disbursed.' });
        }

        const amt = parseFloat(w.Amount || 0);
        const providerUid = w.TargetUserID;
        const methodStr = paymentMethod || w.PayoutMethod || 'GCash / Bank Transfer';
        const accName = w.AccountName || 'Provider Account';
        const accNum = w.AccountReference || 'N/A';
        const finalRef = referenceNumber ? `Ref: ${referenceNumber}` : (w.AccountReference ? `Ref: ${w.AccountReference}` : '');
        const adminNotesCombined = [notes, finalRef].filter(Boolean).join(' | ') || 'Disbursed by Cashier';

        // 2. Mark status as Approved / Processed
        await pool.request()
            .input('WID', id)
            .input('Notes', adminNotesCombined)
            .input('Ref', referenceNumber || w.AccountReference)
            .query(`
                UPDATE dbo.Withdrawals 
                SET Status = 'Approved', 
                    ProcessedAt = GETDATE(), 
                    AdminNotes = @Notes,
                    AccountReference = COALESCE(@Ref, AccountReference)
                WHERE WithdrawalID = @WID;
            `);

        // 3. Send Notification to Service Provider
        if (providerUid) {
            await pool.request()
                .input('UID', providerUid)
                .input('Title', '💸 Payout Disbursed by Cashier')
                .input('Msg', `Your payout request #${id} for ₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been disbursed via ${methodStr} to ${accName} (${accNum}). ${finalRef}`)
                .input('WID', id)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                        VALUES (@UID, @Title, @Msg, 'Payment', @WID, 'Withdrawal');
                    END
                `);
        }

        await logActivity(pool, cashierUserId, 'Withdrawal Disbursed by Cashier', `Cashier released ₱${amt.toFixed(2)} via ${methodStr} to ${accName} (${accNum}). ${adminNotesCombined}`, 'Withdrawal', id);

        return res.status(200).json({
            success: true,
            message: `🎉 Payout #${id} of ₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} successfully disbursed to ${accName}!`
        });
    } catch (error) {
        console.error('Cashier Approve Withdrawal Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to disburse withdrawal.', error: error.message });
    }
};

/**
 * PUT /api/cashier/withdrawals/:id/reject
 * Cashier rejects provider payout request with reason
 */
const rejectWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        const cashierUserId = req.user ? req.user.userId : 1;
        const pool = await connectDB();

        // 1. Fetch withdrawal details
        const wRes = await pool.request()
            .input('WID', id)
            .query(`
                SELECT w.*, 
                    COALESCE(sp.UserID, w.ProviderID) AS TargetUserID,
                    sp.BusinessName 
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (w.ProviderID = sp.ProviderID OR w.ProviderID = sp.UserID)
                WHERE w.WithdrawalID = @WID;
            `);

        if (!wRes.recordset || !wRes.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
        }

        const w = wRes.recordset[0];
        const amt = parseFloat(w.Amount || 0);
        const providerUid = w.TargetUserID;
        const rejectReason = reason || 'Payout details could not be verified by Cashier.';

        // 2. Mark status as Rejected
        await pool.request()
            .input('WID', id)
            .input('Notes', `Rejected: ${rejectReason}`)
            .query(`
                UPDATE dbo.Withdrawals 
                SET Status = 'Rejected', 
                    ProcessedAt = GETDATE(), 
                    AdminNotes = @Notes
                WHERE WithdrawalID = @WID;
            `);

        // 3. Send Notification to Service Provider
        if (providerUid) {
            await pool.request()
                .input('UID', providerUid)
                .input('Title', '❌ Payout Request Rejected')
                .input('Msg', `Your payout request #${id} for ₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} was rejected. Reason: ${rejectReason}`)
                .input('WID', id)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                        VALUES (@UID, @Title, @Msg, 'Payment', @WID, 'Withdrawal');
                    END
                `);
        }

        await logActivity(pool, cashierUserId, 'Withdrawal Rejected by Cashier', `Cashier rejected payout #${id} of ₱${amt.toFixed(2)}. Reason: ${rejectReason}`, 'Withdrawal', id);

        return res.status(200).json({
            success: true,
            message: `Payout request #${id} has been marked as Rejected.`
        });
    } catch (error) {
        console.error('Cashier Reject Withdrawal Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reject withdrawal.', error: error.message });
    }
};

/**
 * GET /api/cashier/reports/income
 * Comprehensive Categorized Income Report (Daily, Weekly, Monthly, Yearly)
 * Query Parameters:
 *   - period: 'daily' | 'weekly' | 'monthly' | 'yearly' (default: 'daily')
 *   - date: 'YYYY-MM-DD' (for daily and weekly anchor)
 *   - month: 'YYYY-MM' (for monthly)
 *   - year: 'YYYY' (for yearly)
 */
const getIncomeReport = async (req, res) => {
    try {
        const pool = await connectDB();
        const period = (req.query.period || 'daily').toLowerCase();
        const selectedDateStr = req.query.date || new Date().toISOString().split('T')[0];
        const selectedMonthStr = req.query.month || selectedDateStr.substring(0, 7);
        const selectedYear = parseInt(req.query.year || selectedDateStr.substring(0, 4), 10);

        let startDate, endDate, periodTitle, filterLabel;

        const now = new Date(selectedDateStr);

        if (period === 'daily') {
            startDate = `${selectedDateStr} 00:00:00`;
            endDate = `${selectedDateStr} 23:59:59`;
            periodTitle = `Daily Income Statement`;
            filterLabel = new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        } else if (period === 'weekly') {
            // Find Monday of the selected date's week
            const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday...
            const diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
            const monday = new Date(now);
            monday.setDate(now.getDate() + diffToMon);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const monStr = monday.toISOString().split('T')[0];
            const sunStr = sunday.toISOString().split('T')[0];

            startDate = `${monStr} 00:00:00`;
            endDate = `${sunStr} 23:59:59`;
            periodTitle = `Weekly Income Statement`;
            filterLabel = `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else if (period === 'monthly') {
            const [y, m] = selectedMonthStr.split('-');
            const yearNum = parseInt(y, 10);
            const monthNum = parseInt(m, 10); // 1-12
            const lastDay = new Date(yearNum, monthNum, 0).getDate();

            startDate = `${y}-${String(monthNum).padStart(2, '0')}-01 00:00:00`;
            endDate = `${y}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
            
            const monthDate = new Date(yearNum, monthNum - 1, 1);
            periodTitle = `Monthly Income Statement`;
            filterLabel = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (period === 'yearly') {
            startDate = `${selectedYear}-01-01 00:00:00`;
            endDate = `${selectedYear}-12-31 23:59:59`;
            periodTitle = `Annual Financial Income Statement`;
            filterLabel = `Full Year ${selectedYear}`;
        } else {
            return res.status(400).json({ success: false, message: 'Invalid period parameter. Use daily, weekly, monthly, or yearly.' });
        }

        // 1. Fetch Paid Bookings in date range
        const bookingsRes = await pool.request()
            .input('Start', startDate)
            .input('End', endDate)
            .query(`
                SELECT 
                    b.BookingID,
                    ISNULL(b.BookingReference, CONCAT('BK-', b.BookingID)) AS Reference,
                    b.PackageName,
                    b.TotalAmount,
                    b.AmountPaid,
                    ISNULL(b.CommissionAmount, b.TotalAmount * 0.05) AS CommissionAmount,
                    ISNULL(b.ProviderEarnings, b.TotalAmount * 0.95) AS ProviderEarnings,
                    b.PaymentStatus,
                    b.BookingStatus,
                    b.EventDate,
                    b.CreatedAt,
                    COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(cClient.FirstName, ' ', cClient.LastName))), ''), uClient.Email, 'Client') AS ClientName,
                    uClient.Email AS ClientEmail,
                    ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName
                FROM dbo.Bookings b
                LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
                LEFT JOIN dbo.Clients cClient ON uClient.UserID = cClient.UserID
                LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
                WHERE (b.PaymentStatus = 'Paid' OR b.BookingStatus IN ('Confirmed', 'Completed', 'Approved'))
                  AND b.CreatedAt >= @Start AND b.CreatedAt <= @End
                ORDER BY b.CreatedAt ASC;
            `);

        // 2. Fetch Approved Withdrawals (Outflow) in date range
        const withdrawalsRes = await pool.request()
            .input('Start', startDate)
            .input('End', endDate)
            .query(`
                SELECT 
                    w.WithdrawalID,
                    CONCAT('WDR-', w.WithdrawalID) AS Reference,
                    w.Amount,
                    w.PayoutMethod,
                    w.AccountName,
                    w.AccountReference,
                    w.Status,
                    w.RequestedAt,
                    w.ProcessedAt,
                    w.AdminNotes,
                    ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                    u.Email AS ProviderEmail
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (sp.ProviderID = w.ProviderID OR sp.UserID = w.ProviderID)
                LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
                WHERE w.Status = 'Approved'
                  AND COALESCE(w.ProcessedAt, w.RequestedAt) >= @Start 
                  AND COALESCE(w.ProcessedAt, w.RequestedAt) <= @End
                ORDER BY COALESCE(w.ProcessedAt, w.RequestedAt) ASC;
            `);

        // 3. Fetch Subscriptions Revenue in date range from dbo.SubscriptionPayments
        let subscriptionsList = [];
        try {
            const subRes = await pool.request()
                .input('Start', startDate)
                .input('End', endDate)
                .query(`
                    IF OBJECT_ID('dbo.SubscriptionPayments', 'U') IS NOT NULL
                    BEGIN
                        SELECT 
                            spay.PaymentID AS SubscriptionID,
                            CONCAT('SUB-', spay.PaymentID) AS Reference,
                            spay.PlanName,
                            spay.Amount AS Price,
                            spay.PaymentMethod,
                            spay.PaymentStatus AS Status,
                            spay.PaymentDate AS CreatedAt,
                            ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName
                        FROM dbo.SubscriptionPayments spay
                        LEFT JOIN dbo.ServiceProviders sp ON spay.ProviderID = sp.ProviderID
                        WHERE spay.PaymentStatus = 'Paid' AND spay.Amount > 0
                          AND spay.PaymentDate >= @Start AND spay.PaymentDate <= @End
                        ORDER BY spay.PaymentDate ASC;
                    END
                `);
            subscriptionsList = subRes.recordset || [];
        } catch (e) {
            console.warn('Subscription query fallback notice:', e.message);
        }

        const bookings = bookingsRes.recordset || [];
        const withdrawals = withdrawalsRes.recordset || [];

        // Totals calculation
        const grossBookingRevenue = bookings.reduce((sum, b) => sum + parseFloat(b.TotalAmount || 0), 0);
        const totalCommissionIncome = bookings.reduce((sum, b) => sum + parseFloat(b.CommissionAmount || 0), 0);
        const totalDisbursedPayouts = withdrawals.reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);
        const totalSubscriptionRevenue = subscriptionsList.reduce((sum, s) => sum + parseFloat(s.Price || 0), 0);

        // Platform Net Cash Flow = Total Inflows (Commission + Subscriptions)
        const netPlatformIncome = totalCommissionIncome + totalSubscriptionRevenue;
        // Total Inflow into escrow & platform
        const totalInflowGross = grossBookingRevenue + totalSubscriptionRevenue;
        // Total Outflow
        const totalOutflow = totalDisbursedPayouts;
        // Net Cashier Inflow Surplus
        const netCashierSurplus = totalInflowGross - totalOutflow;

        // Categorized Breakdown Buckets (Time breakdown)
        let breakdownBuckets = [];

        if (period === 'daily') {
            // Hourly breakdown (00:00 to 23:00)
            const hoursMap = {};
            for (let h = 0; h < 24; h++) {
                const label = `${String(h).padStart(2, '0')}:00`;
                hoursMap[h] = { label, grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 };
            }
            bookings.forEach(b => {
                const h = new Date(b.CreatedAt).getHours();
                if (hoursMap[h]) {
                    hoursMap[h].grossVolume += parseFloat(b.TotalAmount || 0);
                    hoursMap[h].commission += parseFloat(b.CommissionAmount || 0);
                    hoursMap[h].transactionCount += 1;
                }
            });
            withdrawals.forEach(w => {
                const h = new Date(w.ProcessedAt || w.RequestedAt).getHours();
                if (hoursMap[h]) {
                    hoursMap[h].payouts += parseFloat(w.Amount || 0);
                    hoursMap[h].transactionCount += 1;
                }
            });
            subscriptionsList.forEach(s => {
                const h = new Date(s.CreatedAt).getHours();
                if (hoursMap[h]) {
                    hoursMap[h].grossVolume += parseFloat(s.Price || 0);
                    hoursMap[h].commission += parseFloat(s.Price || 0);
                    hoursMap[h].transactionCount += 1;
                }
            });
            breakdownBuckets = Object.values(hoursMap).filter(b => b.transactionCount > 0 || b.grossVolume > 0 || b.payouts > 0);
            if (breakdownBuckets.length === 0) {
                breakdownBuckets = [
                    { label: 'Morning (08:00 - 12:00)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 },
                    { label: 'Afternoon (12:00 - 17:00)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 },
                    { label: 'Evening (17:00 - 22:00)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 }
                ];
            }
        } else if (period === 'weekly') {
            // Day of week breakdown (Mon - Sun)
            const daysNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            const daysMap = {};
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(d.getDate() + i);
                const dStr = d.toISOString().split('T')[0];
                daysMap[dStr] = {
                    date: dStr,
                    label: `${daysNames[i]} (${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
                    grossVolume: 0,
                    commission: 0,
                    payouts: 0,
                    transactionCount: 0
                };
            }
            bookings.forEach(b => {
                const dStr = new Date(b.CreatedAt).toISOString().split('T')[0];
                if (daysMap[dStr]) {
                    daysMap[dStr].grossVolume += parseFloat(b.TotalAmount || 0);
                    daysMap[dStr].commission += parseFloat(b.CommissionAmount || 0);
                    daysMap[dStr].transactionCount += 1;
                }
            });
            withdrawals.forEach(w => {
                const dStr = new Date(w.ProcessedAt || w.RequestedAt).toISOString().split('T')[0];
                if (daysMap[dStr]) {
                    daysMap[dStr].payouts += parseFloat(w.Amount || 0);
                    daysMap[dStr].transactionCount += 1;
                }
            });
            subscriptionsList.forEach(s => {
                const dStr = new Date(s.CreatedAt).toISOString().split('T')[0];
                if (daysMap[dStr]) {
                    daysMap[dStr].grossVolume += parseFloat(s.Price || 0);
                    daysMap[dStr].commission += parseFloat(s.Price || 0);
                    daysMap[dStr].transactionCount += 1;
                }
            });
            breakdownBuckets = Object.values(daysMap);
        } else if (period === 'monthly') {
            const weeksMap = {
                1: { label: 'Week 1 (Days 1 - 7)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 },
                2: { label: 'Week 2 (Days 8 - 14)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 },
                3: { label: 'Week 3 (Days 15 - 21)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 },
                4: { label: 'Week 4 (Days 22 - 28)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 },
                5: { label: 'Week 5 (Days 29 - End)', grossVolume: 0, commission: 0, payouts: 0, transactionCount: 0 }
            };
            bookings.forEach(b => {
                const day = new Date(b.CreatedAt).getDate();
                const weekIdx = Math.min(5, Math.ceil(day / 7));
                if (weeksMap[weekIdx]) {
                    weeksMap[weekIdx].grossVolume += parseFloat(b.TotalAmount || 0);
                    weeksMap[weekIdx].commission += parseFloat(b.CommissionAmount || 0);
                    weeksMap[weekIdx].transactionCount += 1;
                }
            });
            withdrawals.forEach(wItem => {
                const day = new Date(wItem.ProcessedAt || wItem.RequestedAt).getDate();
                const weekIdx = Math.min(5, Math.ceil(day / 7));
                if (weeksMap[weekIdx]) {
                    weeksMap[weekIdx].payouts += parseFloat(wItem.Amount || 0);
                    weeksMap[weekIdx].transactionCount += 1;
                }
            });
            subscriptionsList.forEach(s => {
                const day = new Date(s.CreatedAt).getDate();
                const weekIdx = Math.min(5, Math.ceil(day / 7));
                if (weeksMap[weekIdx]) {
                    weeksMap[weekIdx].grossVolume += parseFloat(s.Price || 0);
                    weeksMap[weekIdx].commission += parseFloat(s.Price || 0);
                    weeksMap[weekIdx].transactionCount += 1;
                }
            });
            breakdownBuckets = Object.values(weeksMap);
        } else if (period === 'yearly') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const monthsMap = {};
            for (let m = 0; m < 12; m++) {
                monthsMap[m] = {
                    monthNumber: m + 1,
                    label: monthNames[m],
                    grossVolume: 0,
                    commission: 0,
                    payouts: 0,
                    netIncome: 0,
                    transactionCount: 0
                };
            }
            bookings.forEach(b => {
                const m = new Date(b.CreatedAt).getMonth();
                if (monthsMap[m]) {
                    monthsMap[m].grossVolume += parseFloat(b.TotalAmount || 0);
                    monthsMap[m].commission += parseFloat(b.CommissionAmount || 0);
                    monthsMap[m].netIncome += parseFloat(b.CommissionAmount || 0);
                    monthsMap[m].transactionCount += 1;
                }
            });
            withdrawals.forEach(w => {
                const m = new Date(w.ProcessedAt || w.RequestedAt).getMonth();
                if (monthsMap[m]) {
                    monthsMap[m].payouts += parseFloat(w.Amount || 0);
                    monthsMap[m].transactionCount += 1;
                }
            });
            subscriptionsList.forEach(s => {
                const m = new Date(s.CreatedAt).getMonth();
                if (monthsMap[m]) {
                    monthsMap[m].netIncome += parseFloat(s.Price || 0);
                    monthsMap[m].grossVolume += parseFloat(s.Price || 0);
                    monthsMap[m].commission += parseFloat(s.Price || 0);
                    monthsMap[m].transactionCount += 1;
                }
            });
            breakdownBuckets = Object.values(monthsMap);
        }

        // Consolidated Detailed Ledger (Combined and sorted)
        const detailedLedger = [
            ...bookings.map(b => ({
                id: b.BookingID,
                date: b.CreatedAt,
                reference: b.Reference,
                type: 'Booking Payment',
                category: 'Client Payment (Inflow)',
                party: `${b.ClientName} → ${b.ProviderName}`,
                itemDescription: b.PackageName,
                inflow: parseFloat(b.TotalAmount || 0),
                outflow: 0,
                commission: parseFloat(b.CommissionAmount || 0),
                providerCut: parseFloat(b.ProviderEarnings || 0),
                status: b.PaymentStatus || 'Paid',
                method: 'PayMongo / Online'
            })),
            ...withdrawals.map(w => ({
                id: w.WithdrawalID,
                date: w.ProcessedAt || w.RequestedAt,
                reference: w.Reference,
                type: 'Provider Payout',
                category: 'Disbursement (Outflow)',
                party: `${w.ProviderName} (${w.AccountName})`,
                itemDescription: `Withdrawal via ${w.PayoutMethod || 'GCash'}`,
                inflow: 0,
                outflow: parseFloat(w.Amount || 0),
                commission: 0,
                providerCut: 0,
                status: w.Status,
                method: w.PayoutMethod || 'GCash'
            })),
            ...subscriptionsList.map(s => ({
                id: s.SubscriptionID,
                date: s.CreatedAt,
                reference: s.Reference,
                type: 'Subscription Payment',
                category: 'Platform Revenue (Inflow)',
                party: s.ProviderName,
                itemDescription: `${s.PlanName} Plan Subscription`,
                inflow: parseFloat(s.Price || 0),
                outflow: 0,
                commission: parseFloat(s.Price || 0),
                providerCut: 0,
                status: s.Status || 'Paid',
                method: s.PaymentMethod || 'GCash'
            }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        return res.status(200).json({
            success: true,
            report: {
                period,
                periodTitle,
                filterLabel,
                startDate,
                endDate,
                generatedAt: new Date().toISOString(),
                summary: {
                    grossBookingRevenue: parseFloat(grossBookingRevenue.toFixed(2)),
                    totalCommissionIncome: parseFloat(totalCommissionIncome.toFixed(2)),
                    totalDisbursedPayouts: parseFloat(totalDisbursedPayouts.toFixed(2)),
                    totalSubscriptionRevenue: parseFloat(totalSubscriptionRevenue.toFixed(2)),
                    netPlatformIncome: parseFloat(netPlatformIncome.toFixed(2)),
                    totalInflowGross: parseFloat(totalInflowGross.toFixed(2)),
                    totalOutflow: parseFloat(totalOutflow.toFixed(2)),
                    netCashierSurplus: parseFloat(netCashierSurplus.toFixed(2)),
                    totalBookingsCount: bookings.length,
                    totalWithdrawalsCount: withdrawals.length,
                    totalTransactionsCount: detailedLedger.length
                },
                breakdownBuckets,
                detailedLedger
            }
        });
    } catch (error) {
        console.error('Get Income Report Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate income report.', error: error.message });
    }
};

/**
 * GET /api/cashier/subscriptions/overview
 * Overview of all provider subscription payments and active plans
 */
const getCashierSubscriptionsOverview = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. Subscription financial KPIs
        const kpiRes = await pool.request().query(`
            SELECT
                ISNULL((SELECT SUM(Amount) FROM dbo.SubscriptionPayments WHERE PaymentStatus = 'Paid'), 0) AS TotalSubscriptionRevenue,
                (SELECT COUNT(DISTINCT ProviderID) FROM dbo.ProviderSubscriptions WHERE Status = 'Active' AND EndDate >= GETDATE()) AS ActiveSubscriptionsCount,
                (SELECT COUNT(DISTINCT ProviderID) FROM dbo.ProviderSubscriptions WHERE Status = 'Active' AND EndDate >= GETDATE() AND PlanType IN ('monthly', 'Monthly')) AS MonthlyCount,
                (SELECT COUNT(DISTINCT ProviderID) FROM dbo.ProviderSubscriptions WHERE Status = 'Active' AND EndDate >= GETDATE() AND PlanType IN ('yearly', 'Yearly')) AS YearlyCount,
                (SELECT COUNT(PaymentID) FROM dbo.SubscriptionPayments WHERE PaymentStatus = 'Paid') AS TotalPaidTransactions;
        `);
        const kpis = kpiRes.recordset[0] || {};

        // 2. All subscription payments history
        const paymentsRes = await pool.request().query(`
            SELECT 
                p.PaymentID,
                CONCAT('SUB-', p.PaymentID) AS PaymentReference,
                p.SubscriptionID,
                p.ProviderID,
                ISNULL(sp.BusinessName, 'Service Provider') AS BusinessName,
                ISNULL(sp.OwnerName, u.Email) AS OwnerName,
                u.Email AS ProviderEmail,
                u.Phone AS ProviderPhone,
                p.PlanType,
                p.PlanName,
                p.Amount,
                p.Currency,
                p.PaymentMethod,
                p.PayMongoSessionID,
                p.PaymentStatus,
                p.PaymentDate,
                p.Notes
            FROM dbo.SubscriptionPayments p
            LEFT JOIN dbo.ServiceProviders sp ON p.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            ORDER BY p.PaymentDate DESC;
        `);

        // 3. List of Active Providers (for cashier payment form)
        const providersRes = await pool.request().query(`
            SELECT 
                sp.ProviderID, 
                sp.UserID, 
                sp.BusinessName, 
                sp.OwnerName,
                sp.CoverageArea, 
                sp.ContactNumber,
                u.Email, 
                u.Phone
            FROM dbo.ServiceProviders sp
            JOIN dbo.Users u ON sp.UserID = u.UserID
            ORDER BY sp.BusinessName ASC;
        `);

        return res.status(200).json({
            success: true,
            kpis: {
                totalRevenue: parseFloat(kpis.TotalSubscriptionRevenue || 0),
                activeCount: parseInt(kpis.ActiveSubscriptionsCount || 0, 10),
                monthlyCount: parseInt(kpis.MonthlyCount || 0, 10),
                yearlyCount: parseInt(kpis.YearlyCount || 0, 10),
                totalPaidTransactions: parseInt(kpis.TotalPaidTransactions || 0, 10)
            },
            payments: paymentsRes.recordset || [],
            providers: providersRes.recordset || []
        });
    } catch (error) {
        console.error('Get Cashier Subscriptions Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve subscription payments overview.', error: error.message });
    }
};

/**
 * POST /api/cashier/subscriptions/record-payment
 * Cashier collects/records direct subscription payment for a provider
 */
const recordCashierSubscriptionPayment = async (req, res) => {
    try {
        const { providerId, planType, amount, paymentMethod, referenceNumber, notes } = req.body || {};
        const cashierUserId = req.user ? req.user.userId : 1;
        const pool = await connectDB();

        if (!providerId) {
            return res.status(400).json({ success: false, message: 'Provider ID is required.' });
        }

        const provRes = await pool.request()
            .input('PID', providerId)
            .query("SELECT sp.*, u.Email FROM dbo.ServiceProviders sp JOIN dbo.Users u ON sp.UserID = u.UserID WHERE sp.ProviderID = @PID OR sp.UserID = @PID");

        if (provRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Service Provider not found.' });
        }

        const provider = provRes.recordset[0];
        const targetPlan = (planType || 'monthly').toLowerCase();
        let planName = 'Pro Monthly Plan';
        let durationDays = 30;
        let finalAmount = parseFloat(amount || 499);

        if (targetPlan === 'yearly' || targetPlan === 'annual') {
            planName = 'Pro Annual Plan';
            durationDays = 365;
            if (!amount) finalAmount = 4999;
        }

        const sessionRef = referenceNumber ? `CASHIER-${referenceNumber}` : `CASHIER-REC-${Date.now().toString().slice(-6)}`;
        const methodStr = paymentMethod || 'Over-The-Counter Cash';
        const notesStr = [notes, `Collected by Cashier. Ref: ${sessionRef}`].filter(Boolean).join(' | ');

        // 1. Insert or extend active subscription in dbo.ProviderSubscriptions
        const currentActive = await pool.request()
            .input('ProviderID', provider.ProviderID)
            .query("SELECT TOP 1 * FROM dbo.ProviderSubscriptions WHERE ProviderID = @ProviderID AND Status = 'Active' AND EndDate >= GETDATE() ORDER BY EndDate DESC");

        let baseDateQuery = 'GETDATE()';
        const reqInsert = pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('UserID', sql.Int, provider.UserID)
            .input('PlanType', sql.NVarChar(50), targetPlan)
            .input('PlanName', sql.NVarChar(100), planName)
            .input('Price', sql.Decimal(18, 2), finalAmount)
            .input('BillingCycle', sql.NVarChar(50), targetPlan)
            .input('DurationDays', sql.Int, durationDays)
            .input('SessionID', sql.NVarChar(150), sessionRef);

        if (currentActive.recordset.length > 0) {
            reqInsert.input('CurrentEndDate', sql.DateTime2, currentActive.recordset[0].EndDate);
            baseDateQuery = '@CurrentEndDate';
        }

        const insertSubRes = await reqInsert.query(`
            INSERT INTO dbo.ProviderSubscriptions (
                ProviderID,
                UserID,
                PlanType,
                PlanName,
                Price,
                BillingCycle,
                Status,
                StartDate,
                EndDate,
                HasUsedFreeTrial,
                PayMongoSessionID,
                CreatedAt,
                UpdatedAt
            )
            OUTPUT INSERTED.SubscriptionID
            VALUES (
                @ProviderID,
                @UserID,
                @PlanType,
                @PlanName,
                @Price,
                @BillingCycle,
                'Active',
                GETDATE(),
                DATEADD(DAY, @DurationDays, ${baseDateQuery}),
                1,
                @SessionID,
                GETDATE(),
                GETDATE()
            );
        `);

        const newSubId = insertSubRes.recordset[0].SubscriptionID;

        // 2. Record Payment in dbo.SubscriptionPayments
        const paymentRes = await pool.request()
            .input('SubscriptionID', sql.Int, newSubId)
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('PlanType', sql.NVarChar(50), targetPlan)
            .input('PlanName', sql.NVarChar(100), planName)
            .input('Amount', sql.Decimal(18, 2), finalAmount)
            .input('PaymentMethod', sql.NVarChar(50), methodStr)
            .input('SessionID', sql.NVarChar(150), sessionRef)
            .input('Notes', sql.NVarChar(500), notesStr)
            .query(`
                INSERT INTO dbo.SubscriptionPayments (
                    SubscriptionID,
                    ProviderID,
                    PlanType,
                    PlanName,
                    Amount,
                    Currency,
                    PaymentMethod,
                    PayMongoSessionID,
                    PaymentStatus,
                    PaymentDate,
                    Notes
                ) 
                OUTPUT INSERTED.PaymentID
                VALUES (
                    @SubscriptionID,
                    @ProviderID,
                    @PlanType,
                    @PlanName,
                    @Amount,
                    'PHP',
                    @PaymentMethod,
                    @SessionID,
                    'Paid',
                    GETDATE(),
                    @Notes
                );
            `);

        const newPaymentId = paymentRes.recordset[0].PaymentID;

        // 3. Send Notification to Service Provider
        await pool.request()
            .input('UID', provider.UserID)
            .input('Title', '👑 Subscription Activated by Cashier')
            .input('Msg', `Your ${planName} subscription payment of ₱${finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been received & activated by the Cashier via ${methodStr}! Ref: ${sessionRef}`)
            .input('PID', newPaymentId)
            .query(`
                IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                    VALUES (@UID, @Title, @Msg, 'Payment', @PID, 'Subscription');
                END
            `);

        await logActivity(pool, cashierUserId, 'Subscription Payment Collected by Cashier', `Cashier recorded ₱${finalAmount.toFixed(2)} subscription payment for ${provider.BusinessName} (${planName}) via ${methodStr}. Ref: ${sessionRef}`, 'SubscriptionPayment', newPaymentId);

        return res.status(200).json({
            success: true,
            message: `🎉 Subscription payment of ₱${finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} recorded for ${provider.BusinessName}! Plan is now Active.`,
            paymentId: newPaymentId
        });
    } catch (error) {
        console.error('Record Cashier Subscription Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to record subscription payment.', error: error.message });
    }
};

/**
 * GET /api/cashier/withdrawals/:id/paymongo-verify
 * Detailed PayMongo verification & live gateway check for a withdrawal request
 */
const verifyWithdrawalPayMongo = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await connectDB();

        const wRes = await pool.request()
            .input('WID', id)
            .query(`
                SELECT 
                    w.WithdrawalID,
                    w.ProviderID,
                    w.BookingID,
                    w.Amount AS RequestedAmount,
                    w.PayoutMethod,
                    w.AccountName,
                    w.AccountReference,
                    w.Status AS WithdrawalStatus,
                    w.RequestedAt,
                    w.ProcessedAt,
                    w.AdminNotes,
                    w.PayMongoPayoutID,
                    ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                    ISNULL(u.Email, u2.Email) AS ProviderEmail,
                    u.Phone AS ProviderPhone,
                    b.BookingReference,
                    b.PackageName,
                    b.TotalAmount AS BookingTotalAmount,
                    b.AmountPaid AS BookingAmountPaid,
                    b.PaymentStatus AS BookingPaymentStatus,
                    b.BookingStatus,
                    b.EventDate,
                    COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(cClient.FirstName, ' ', cClient.LastName))), ''), uClient.Email, 'Client') AS ClientName,
                    uClient.Email AS ClientEmail,
                    uClient.Phone AS ClientPhone
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (sp.ProviderID = w.ProviderID OR sp.UserID = w.ProviderID)
                LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
                LEFT JOIN dbo.Users u2 ON w.ProviderID = u2.UserID
                LEFT JOIN dbo.Bookings b ON w.BookingID = b.BookingID
                LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
                LEFT JOIN dbo.Clients cClient ON uClient.UserID = cClient.UserID
                WHERE w.WithdrawalID = @WID;
            `);

        if (!wRes.recordset || wRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Withdrawal request not found.' });
        }

        const withdrawal = wRes.recordset[0];

        // Fetch source client payments in dbo.Payments
        let payments = [];
        if (withdrawal.BookingID) {
            const pRes = await pool.request()
                .input('BID', withdrawal.BookingID)
                .query(`
                    SELECT PaymentID, BookingID, Amount, PaymentMethod, PaymentStatus, TransactionReference, PaidAt
                    FROM dbo.Payments
                    WHERE BookingID = @BID
                    ORDER BY PaidAt DESC;
                `);
            payments = pRes.recordset || [];
        } else {
            const pRes = await pool.request()
                .input('PID', withdrawal.ProviderID)
                .query(`
                    SELECT TOP 10 p.PaymentID, p.BookingID, p.Amount, p.PaymentMethod, p.PaymentStatus, p.TransactionReference, p.PaidAt,
                           b.BookingReference, COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName
                    FROM dbo.Payments p
                    JOIN dbo.Bookings b ON p.BookingID = b.BookingID
                    LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
                    LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                    WHERE (b.ProviderID = @PID OR b.ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @PID))
                      AND p.PaymentStatus = 'Paid'
                    ORDER BY p.PaidAt DESC;
                `);
            payments = pRes.recordset || [];
        }

        // Live check PayMongo API if session reference exists
        let liveGatewayCheck = { status: 'paid', mode: 'secured_database_verified' };
        const primaryRef = payments[0]?.TransactionReference;
        if (primaryRef && (primaryRef.startsWith('cs_') || primaryRef.startsWith('pi_'))) {
            try {
                const liveCheck = await paymongoService.getCheckoutSessionStatus(primaryRef);
                if (liveCheck) liveGatewayCheck = liveCheck;
            } catch (e) {
                console.warn('Live PayMongo check skipped:', e.message);
            }
        }

        const totalClientPaid = payments.reduce((sum, p) => sum + parseFloat(p.Amount || 0), 0);
        const isVerified = payments.length > 0 && payments.some(p => p.PaymentStatus === 'Paid');

        return res.status(200).json({
            success: true,
            withdrawal,
            verification: {
                isVerified,
                status: isVerified ? 'Verified & Paid via PayMongo' : 'Awaiting Payment Confirmation',
                gateway: 'PayMongo Gateway (Philippines)',
                totalClientPaid,
                requestedPayout: parseFloat(withdrawal.RequestedAmount || 0),
                coverageRatio: totalClientPaid > 0 ? ((totalClientPaid / Math.max(1, parseFloat(withdrawal.RequestedAmount || 1))) * 100).toFixed(1) + '%' : '100%',
                primaryReference: primaryRef || withdrawal.BookingReference || `PM-WDR-${withdrawal.WithdrawalID}`,
                paymentMethods: [...new Set(payments.map(p => p.PaymentMethod).filter(Boolean))],
                payments,
                liveGatewayCheck
            }
        });
    } catch (error) {
        console.error('Verify PayMongo Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to verify PayMongo payment.', error: error.message });
    }
};

/**
 * GET /api/cashier/revenue-summary
 * Full financial revenue analytics & per-service-provider revenue reports
 */
const getCashierRevenueSummary = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. Fetch all bookings with provider and client details
        const bResult = await pool.request().query(`
            SELECT DISTINCT
                b.BookingID,
                b.BookingReference,
                ISNULL(uClient.Email, 'Client') AS ClientName,
                ISNULL(uClient.Email, '') AS ClientEmail,
                b.PackageName,
                b.EventDate,
                b.TotalAmount,
                b.AmountPaid,
                b.CommissionRate,
                b.CommissionAmount,
                b.ProviderEarnings,
                b.BookingStatus,
                b.PaymentStatus,
                ISNULL(b.EscrowStatus, 'Held') AS EscrowStatus,
                b.CreatedAt,
                ISNULL(
                    COALESCE(sp1.BusinessName, sp2.BusinessName),
                    COALESCE(uProv1.Email, uProv2.Email)
                ) AS ProviderName,
                COALESCE(uProv1.Email, uProv2.Email) AS ProviderEmail
            FROM dbo.Bookings b
            LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
            LEFT JOIN dbo.ServiceProviders sp1 ON b.ProviderID = sp1.ProviderID
            LEFT JOIN dbo.Users uProv1 ON sp1.UserID = uProv1.UserID
            LEFT JOIN dbo.ServiceProviders sp2 ON b.ProviderID = sp2.UserID
            LEFT JOIN dbo.Users uProv2 ON sp2.UserID = uProv2.UserID
            ORDER BY b.CreatedAt DESC;
        `);

        const bookings = bResult.recordset || [];

        // Calculate KPI Metrics
        let totalGrossRevenue = 0;
        let totalCompletedRevenue = 0;
        let totalAdminCommission = 0;

        const providerMap = {};

        bookings.forEach((b, idx) => {
            const gross = parseFloat(b.TotalAmount || 0);
            const comm = parseFloat(b.CommissionAmount || (gross * 0.05) || 0);
            const net = parseFloat(b.ProviderEarnings || (gross * 0.95) || 0);
            const isCompleted = b.BookingStatus === 'Completed' || b.BookingStatus === 'Fulfilled';

            totalGrossRevenue += gross;
            if (isCompleted) {
                totalCompletedRevenue += gross;
            }
            totalAdminCommission += comm;

            const provKey = b.ProviderName || b.ProviderEmail || 'Service Provider';
            if (!providerMap[provKey]) {
                providerMap[provKey] = {
                    providerName: provKey,
                    providerEmail: b.ProviderEmail || '',
                    grossRevenue: 0,
                    netEarnings: 0,
                    adminCommission: 0,
                    completedRevenue: 0,
                    bookingsCount: 0,
                    bookings: []
                };
            }

            providerMap[provKey].grossRevenue += gross;
            providerMap[provKey].netEarnings += net;
            providerMap[provKey].adminCommission += comm;
            if (isCompleted) {
                providerMap[provKey].completedRevenue += gross;
            }
            providerMap[provKey].bookingsCount += 1;
            providerMap[provKey].bookings.push({
                bookingId: b.BookingID,
                bookingReference: b.BookingReference || `BK-${b.BookingID}`,
                clientName: b.ClientName || 'Client',
                packageName: b.PackageName || 'Event Service',
                eventDate: b.EventDate,
                grossAmount: gross,
                adminFee: comm,
                netPayout: net,
                paymentMethod: 'PayMongo GCash / Maya',
                status: b.BookingStatus || 'Confirmed',
                createdAt: b.CreatedAt
            });
        });

        const providerBreakdown = Object.values(providerMap);

        // 2. Fetch Provider Payout Requests
        const wResult = await pool.request().query(`
            SELECT 
                w.WithdrawalID,
                w.Amount,
                w.PayoutMethod,
                w.AccountName,
                w.AccountReference,
                w.Status,
                w.RequestedAt,
                w.ProcessedAt,
                w.AdminNotes,
                ISNULL(
                    COALESCE(sp.BusinessName, sp2.BusinessName),
                    COALESCE(u.Email, u2.Email)
                ) AS ProviderName,
                COALESCE(u.Email, u2.Email) AS ProviderEmail
            FROM dbo.Withdrawals w
            LEFT JOIN dbo.ServiceProviders sp ON w.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.ServiceProviders sp2 ON w.ProviderID = sp2.UserID
            LEFT JOIN dbo.Users u2 ON sp2.UserID = u2.UserID
            ORDER BY w.RequestedAt DESC;
        `);

        const payoutRequests = (wResult.recordset || []).map((w, idx) => ({
            withdrawalId: w.WithdrawalID,
            requestId: `#WD-${100 + (w.WithdrawalID || idx + 1)}`,
            providerName: w.ProviderName || 'Service Provider',
            providerEmail: w.ProviderEmail || '',
            amountRequested: parseFloat(w.Amount || 0),
            payoutChannel: w.PayoutMethod || 'GCash / Maya E-Wallet',
            accountHolderName: w.AccountName || 'Provider Account',
            receiverAccount: w.AccountReference || 'N/A',
            dateRequested: w.RequestedAt,
            status: w.Status,
            adminNotes: w.AdminNotes
        }));

        return res.status(200).json({
            success: true,
            stats: {
                grossRevenue: parseFloat(totalGrossRevenue.toFixed(2)),
                completedRevenue: parseFloat(totalCompletedRevenue.toFixed(2)),
                adminCommission: parseFloat(totalAdminCommission.toFixed(2))
            },
            providerBreakdown,
            payoutRequests
        });

    } catch (error) {
        console.error('Get Cashier Revenue Summary Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve revenue summary.', error: error.message });
    }
};

/**
 * GET /api/cashier/refund-requests
 * Retrieve all client refund payout requests
 */
const getClientRefundRequests = async (req, res) => {
    try {
        const walletService = require('../services/walletService');
        const requests = await walletService.getAllRefundRequestsForCashier();
        return res.status(200).json({ success: true, refundRequests: requests });
    } catch (error) {
        console.error('Get Client Refund Requests Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve refund requests.', error: error.message });
    }
};

/**
 * PUT /api/cashier/refund-requests/:id/approve
 * Cashier approves & marks manual client refund as disbursed
 */
const approveClientRefundRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { referenceNumber, notes } = req.body || {};
        const cashierUserId = req.user ? req.user.userId : 1;
        const walletService = require('../services/walletService');

        const result = await walletService.approveRefundPayout({
            refundRequestId: id,
            cashierUserId,
            referenceNumber,
            adminNotes: notes
        });

        return res.status(200).json({
            success: true,
            message: `🎉 Refund payout #${id} of ₱${parseFloat(result.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} successfully marked as disbursed!`,
            data: result
        });
    } catch (error) {
        console.error('Approve Client Refund Request Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * PUT /api/cashier/refund-requests/:id/reject
 * Cashier rejects client refund payout request (refunds amount back to client wallet)
 */
const rejectClientRefundRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body || {};
        const cashierUserId = req.user ? req.user.userId : 1;
        const walletService = require('../services/walletService');

        const result = await walletService.rejectRefundPayout({
            refundRequestId: id,
            cashierUserId,
            rejectReason: reason
        });

        return res.status(200).json({
            success: true,
            message: `Refund request #${id} rejected. ₱${parseFloat(result.refundedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} has been returned to the client's wallet.`,
            data: result
        });
    } catch (error) {
        console.error('Reject Client Refund Request Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getCashierSummary,
    getCashierWithdrawals,
    approveWithdrawalRequest,
    rejectWithdrawalRequest,
    getIncomeReport,
    getCashierSubscriptionsOverview,
    recordCashierSubscriptionPayment,
    verifyWithdrawalPayMongo,
    getCashierRevenueSummary,
    getClientRefundRequests,
    approveClientRefundRequest,
    rejectClientRefundRequest
};


