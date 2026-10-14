/**
 * SoundSphere - Client Wallet & Refund Management Service
 * Handles automated refund credits on cancellations,
 * wallet balance tracking, and manual Cashier disbursement workflows.
 */

const { connectDB, sql } = require('../config/db');

/**
 * Automatically credit refund to a client's wallet upon cancellation
 */
const creditWalletForRefund = async ({ userId, amount, bookingId, bookingReference, reason }) => {
    try {
        const refundAmt = parseFloat(amount || 0);
        if (refundAmt <= 0) return { credited: false, message: 'No paid amount to refund' };

        const pool = await connectDB();
        const clientUid = parseInt(userId, 10);

        // 1. Ensure Client Wallet exists
        const wCheck = await pool.request()
            .input('UID', sql.Int, clientUid)
            .query(`SELECT Balance FROM dbo.ClientWallets WHERE UserID = @UID;`);

        let newBalance = refundAmt;
        if (wCheck.recordset.length === 0) {
            await pool.request()
                .input('UID', sql.Int, clientUid)
                .input('Bal', sql.Decimal(18, 2), refundAmt)
                .query(`
                    INSERT INTO dbo.ClientWallets (UserID, Balance, CreatedAt, UpdatedAt)
                    VALUES (@UID, @Bal, GETDATE(), GETDATE());
                `);
        } else {
            const currentBal = parseFloat(wCheck.recordset[0].Balance || 0);
            newBalance = currentBal + refundAmt;
            await pool.request()
                .input('UID', sql.Int, clientUid)
                .input('Amt', sql.Decimal(18, 2), refundAmt)
                .query(`
                    UPDATE dbo.ClientWallets 
                    SET Balance = Balance + @Amt, UpdatedAt = GETDATE()
                    WHERE UserID = @UID;
                `);
        }

        // 2. Log in dbo.WalletTransactions
        const desc = reason || `Automated refund for cancelled booking (Ref: ${bookingReference || `#${bookingId}`})`;
        await pool.request()
            .input('UID', sql.Int, clientUid)
            .input('Amt', sql.Decimal(18, 2), refundAmt)
            .input('Type', sql.NVarChar(50), 'REFUND_CREDIT')
            .input('Desc', sql.NVarChar(500), desc)
            .input('BalAfter', sql.Decimal(18, 2), newBalance)
            .input('BID', sql.Int, bookingId || null)
            .input('BRef', sql.NVarChar(50), bookingReference || null)
            .query(`
                INSERT INTO dbo.WalletTransactions (UserID, Amount, TransactionType, Description, BalanceAfter, RelatedBookingID, BookingReference, CreatedAt)
                VALUES (@UID, @Amt, @Type, @Desc, @BalAfter, @BID, @BRef, GETDATE());
            `);

        // 3. Notify Client in dbo.Notifications
        await pool.request()
            .input('UID', sql.Int, clientUid)
            .input('Title', sql.NVarChar(150), '🎉 Refund Credited to Your Wallet')
            .input('Msg', sql.NVarChar(500), `A refund of ₱${refundAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been automatically added to your SoundSphere Wallet from cancelled booking ${bookingReference || `#${bookingId}`}. You can request a payout to your GCash/Bank anytime!`)
            .input('BID', sql.Int, bookingId || null)
            .query(`
                IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                    VALUES (@UID, @Title, @Msg, 'Payment', @BID, 'Booking', GETDATE());
                END
            `);

        console.log(`✓ [WALLET REFUND] Credited ₱${refundAmt} to UserID: ${clientUid} (New Balance: ₱${newBalance})`);
        return { credited: true, refundAmount: refundAmt, newBalance };
    } catch (err) {
        console.error('Wallet Credit Error:', err);
        return { credited: false, error: err.message };
    }
};

/**
 * Get Client Wallet Details, Transactions, and Pending Requests
 */
const getWalletDetails = async (userId) => {
    const pool = await connectDB();
    const uid = parseInt(userId, 10);

    // 1. Get or Create Wallet Record
    let wRes = await pool.request()
        .input('UID', sql.Int, uid)
        .query(`SELECT Balance, UpdatedAt FROM dbo.ClientWallets WHERE UserID = @UID;`);

    let balance = 0.00;
    if (wRes.recordset.length === 0) {
        await pool.request()
            .input('UID', sql.Int, uid)
            .query(`INSERT INTO dbo.ClientWallets (UserID, Balance, CreatedAt, UpdatedAt) VALUES (@UID, 0.00, GETDATE(), GETDATE());`);
    } else {
        balance = parseFloat(wRes.recordset[0].Balance || 0);
    }

    // 2. Transactions
    const txRes = await pool.request()
        .input('UID', sql.Int, uid)
        .query(`
            SELECT TransactionID, Amount, TransactionType, Description, BalanceAfter, RelatedBookingID, BookingReference, CreatedAt
            FROM dbo.WalletTransactions
            WHERE UserID = @UID
            ORDER BY CreatedAt DESC;
        `);

    // 3. Refund Requests
    const reqRes = await pool.request()
        .input('UID', sql.Int, uid)
        .query(`
            SELECT RefundRequestID, Amount, PayoutMethod, AccountName, AccountNumber, Status, ReferenceNumber, AdminNotes, RequestedAt, ProcessedAt
            FROM dbo.RefundRequests
            WHERE UserID = @UID
            ORDER BY RequestedAt DESC;
        `);

    // Calculate pending payout amount
    const pendingRequests = reqRes.recordset.filter(r => r.Status === 'Pending');
    const pendingAmount = pendingRequests.reduce((sum, r) => sum + parseFloat(r.Amount || 0), 0);

    // Retrieve client's original payment method from recent cancelled booking if available
    let originalPaymentMethod = null;
    try {
        const lastBkRes = await pool.request()
            .input('UID', sql.Int, uid)
            .query(`
                SELECT TOP 1 p.PaymentMethod
                FROM dbo.Bookings b
                LEFT JOIN dbo.Payments p ON p.BookingID = b.BookingID
                WHERE b.ClientUserID = @UID AND b.BookingStatus = 'Cancelled' AND p.PaymentMethod IS NOT NULL
                ORDER BY b.UpdatedAt DESC;
            `);
        if (lastBkRes.recordset.length > 0 && lastBkRes.recordset[0].PaymentMethod) {
            originalPaymentMethod = lastBkRes.recordset[0].PaymentMethod;
        }
    } catch (bkErr) {
        // Fallback silently if Payments table query not found
    }

    return {
        balance,
        pendingAmount,
        originalPaymentMethod,
        transactions: txRes.recordset || [],
        refundRequests: reqRes.recordset || []
    };
};

/**
 * Client Requests a Refund Payout to Cashier
 */
const requestRefundPayout = async ({ userId, amount, payoutMethod, accountName, accountNumber, notes, clientName, clientEmail, clientPhone }) => {
    const pool = await connectDB();
    const uid = parseInt(userId, 10);
    const reqAmount = parseFloat(amount || 0);

    if (reqAmount <= 0) {
        throw new Error('Please enter a valid refund amount.');
    }

    // Check balance
    const wRes = await pool.request()
        .input('UID', sql.Int, uid)
        .query(`SELECT Balance FROM dbo.ClientWallets WHERE UserID = @UID;`);

    const currentBal = wRes.recordset[0] ? parseFloat(wRes.recordset[0].Balance || 0) : 0;
    if (currentBal < reqAmount) {
        throw new Error(`Insufficient wallet balance. Available balance: ₱${currentBal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    }

    // 1. Deduct from wallet balance
    const newBal = currentBal - reqAmount;
    await pool.request()
        .input('UID', sql.Int, uid)
        .input('Amt', sql.Decimal(18, 2), reqAmount)
        .query(`
            UPDATE dbo.ClientWallets
            SET Balance = Balance - @Amt, UpdatedAt = GETDATE()
            WHERE UserID = @UID;
        `);

    // Find the user's account name and latest cancelled booking for link
    let bookingId = null;
    let bookingRef = null;
    let userAccountName = clientName || 'Verified Client';
    let userAccountEmail = clientEmail || null;
    let userAccountPhone = clientPhone || null;

    try {
        const uRes = await pool.request()
            .input('UID', sql.Int, uid)
            .query(`
                SELECT u.Email, u.Phone, COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'User') AS AccountName
                FROM dbo.Users u
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE u.UserID = @UID;
            `);
        if (uRes.recordset && uRes.recordset.length > 0) {
            userAccountName = uRes.recordset[0].AccountName || userAccountName;
            userAccountEmail = uRes.recordset[0].Email || userAccountEmail;
            userAccountPhone = uRes.recordset[0].Phone || userAccountPhone;
        }

        const bkQuery = await pool.request()
            .input('UID', sql.Int, uid)
            .query(`
                SELECT TOP 1 bk.BookingID, bk.BookingReference
                FROM dbo.Bookings bk
                WHERE bk.ClientUserID = @UID AND bk.BookingStatus = 'Cancelled'
                ORDER BY bk.UpdatedAt DESC, bk.BookingID DESC;
            `);

        if (bkQuery.recordset && bkQuery.recordset.length > 0) {
            bookingId = bkQuery.recordset[0].BookingID;
            bookingRef = bkQuery.recordset[0].BookingReference;
        }
    } catch (bkErr) {
        console.warn('Booking lookup for refund notice:', bkErr.message);
    }

    // 2. Insert into dbo.RefundRequests
    const insertReq = await pool.request()
        .input('UID', sql.Int, uid)
        .input('CName', sql.NVarChar(200), userAccountName || 'Verified Client')
        .input('CEmail', sql.NVarChar(150), userAccountEmail || null)
        .input('CPhone', sql.NVarChar(50), userAccountPhone || null)
        .input('BID', sql.Int, bookingId)
        .input('BRef', sql.NVarChar(50), bookingRef)
        .input('Amt', sql.Decimal(18, 2), reqAmount)
        .input('PMethod', sql.NVarChar(50), payoutMethod || 'GCash')
        .input('AName', sql.NVarChar(150), accountName)
        .input('ANum', sql.NVarChar(100), accountNumber)
        .input('Notes', sql.NVarChar(500), notes || null)
        .query(`
            INSERT INTO dbo.RefundRequests (UserID, ClientName, ClientEmail, ClientPhone, BookingID, BookingReference, Amount, PayoutMethod, AccountName, AccountNumber, Status, AdminNotes, RequestedAt)
            OUTPUT INSERTED.RefundRequestID
            VALUES (@UID, @CName, @CEmail, @CPhone, @BID, @BRef, @Amt, @PMethod, @AName, @ANum, 'Pending', @Notes, GETDATE());
        `);

    const reqId = insertReq.recordset[0].RefundRequestID;

    // 3. Log in dbo.WalletTransactions
    await pool.request()
        .input('UID', sql.Int, uid)
        .input('Amt', sql.Decimal(18, 2), -reqAmount)
        .input('Type', sql.NVarChar(50), 'REFUND_PAYOUT_REQUEST')
        .input('Desc', sql.NVarChar(500), `Payout request #${reqId} via ${payoutMethod} to ${accountName} (${accountNumber}) - Sent to Cashier`)
        .input('BalAfter', sql.Decimal(18, 2), newBal)
        .query(`
            INSERT INTO dbo.WalletTransactions (UserID, Amount, TransactionType, Description, BalanceAfter, CreatedAt)
            VALUES (@UID, @Amt, @Type, @Desc, @BalAfter, GETDATE());
        `);

    // 4. Client Notification
    await pool.request()
        .input('UID', sql.Int, uid)
        .input('Title', sql.NVarChar(150), '🔄 Refund Request Submitted to Cashier')
        .input('Msg', sql.NVarChar(500), `Your payout request #${reqId} for ₱${reqAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} via ${payoutMethod} has been submitted. The Cashier will manually disburse the payment to your account.`)
        .input('RID', sql.Int, reqId)
        .query(`
            IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
            BEGIN
                INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                VALUES (@UID, @Title, @Msg, 'Payment', @RID, 'RefundRequest', GETDATE());
            END
        `);

    return {
        success: true,
        refundRequestId: reqId,
        amount: reqAmount,
        newBalance: newBal,
        payoutMethod,
        accountName,
        accountNumber
    };
};

/**
 * Cashier Approves & Manually Disburses a Client Refund
 */
const approveRefundPayout = async ({ refundRequestId, cashierUserId, referenceNumber, adminNotes }) => {
    const pool = await connectDB();
    const rId = parseInt(refundRequestId, 10);

    const checkRes = await pool.request()
        .input('RID', sql.Int, rId)
        .query(`SELECT * FROM dbo.RefundRequests WHERE RefundRequestID = @RID;`);

    if (checkRes.recordset.length === 0) throw new Error('Refund request not found.');
    const reqData = checkRes.recordset[0];

    if (reqData.Status === 'Approved') throw new Error('Refund request has already been approved and disbursed.');

    const refNo = referenceNumber || `REF-CASHIER-${Date.now().toString().slice(-6)}`;
    const sanitizedNotes = adminNotes ? adminNotes.replace(/\s*outside system by cashier\s*/gi, '').trim() : '';
    const finalNotes = sanitizedNotes || `Manually disbursed via ${reqData.PayoutMethod}`;

    // 1. Update status in dbo.RefundRequests
    await pool.request()
        .input('RID', sql.Int, rId)
        .input('RefNo', sql.NVarChar(100), refNo)
        .input('Notes', sql.NVarChar(500), finalNotes)
        .input('CID', sql.Int, cashierUserId || 1)
        .query(`
            UPDATE dbo.RefundRequests
            SET Status = 'Approved',
                ReferenceNumber = @RefNo,
                AdminNotes = @Notes,
                ProcessedAt = GETDATE(),
                ProcessedBy = @CID
            WHERE RefundRequestID = @RID;
        `);

    // 2. Update linked Booking and Payments to 'Refunded' if BookingID exists
    let bookingRef = reqData.BookingReference || null;
    let packageName = null;
    let providerName = null;

    if (reqData.BookingID) {
        try {
            await pool.request()
                .input('BID', sql.Int, reqData.BookingID)
                .query(`
                    UPDATE dbo.Bookings
                    SET PaymentStatus = 'Refunded',
                        RemainingBalance = 0,
                        UpdatedAt = GETDATE()
                    WHERE BookingID = @BID;

                    IF OBJECT_ID('dbo.Payments', 'U') IS NOT NULL
                    BEGIN
                        UPDATE dbo.Payments
                        SET PaymentStatus = 'Refunded'
                        WHERE BookingID = @BID;
                    END
                `);

            const bkRes = await pool.request()
                .input('BID', sql.Int, reqData.BookingID)
                .query(`
                    SELECT bk.BookingReference, bk.PackageName, bk.EventName, sp.BusinessName
                    FROM dbo.Bookings bk
                    LEFT JOIN dbo.ServiceProviders sp ON bk.ProviderID = sp.ProviderID
                    WHERE bk.BookingID = @BID;
                `);

            if (bkRes.recordset && bkRes.recordset.length > 0) {
                const bRow = bkRes.recordset[0];
                bookingRef = bRow.BookingReference || bookingRef;
                packageName = bRow.PackageName || bRow.EventName || null;
                providerName = bRow.BusinessName || null;
            }
        } catch (bkErr) {
            console.warn('[approveRefundPayout] Booking status update warning:', bkErr.message);
        }
    }

    // 3. Resolve Client Email & Name
    let clientEmail = reqData.ClientEmail || null;
    let clientName = reqData.ClientName || 'Client';

    if (!clientEmail && reqData.UserID) {
        try {
            const uRes = await pool.request()
                .input('UID', sql.Int, reqData.UserID)
                .query(`SELECT Email, FirstName, LastName FROM dbo.Users WHERE UserID = @UID;`);
            if (uRes.recordset && uRes.recordset.length > 0) {
                clientEmail = uRes.recordset[0].Email || null;
                if (!clientName || clientName === 'Client') {
                    const fn = uRes.recordset[0].FirstName || '';
                    const ln = uRes.recordset[0].LastName || '';
                    clientName = `${fn} ${ln}`.trim() || clientName;
                }
            }
        } catch (uErr) {
            console.warn('[approveRefundPayout] User lookup warning:', uErr.message);
        }
    }

    // 4. In-App Notification to Client
    const amtStr = parseFloat(reqData.Amount).toLocaleString('en-US', { minimumFractionDigits: 2 });
    await pool.request()
        .input('UID', sql.Int, reqData.UserID)
        .input('Title', sql.NVarChar(150), '💸 Refund Sent & Marked as Refunded')
        .input('Msg', sql.NVarChar(500), `Your refund payout of ₱${amtStr} has been transferred via ${reqData.PayoutMethod} to ${reqData.AccountName} (${reqData.AccountNumber}) and marked as Refunded.`)
        .input('RID', sql.Int, rId)
        .query(`
            IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
            BEGIN
                INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                VALUES (@UID, @Title, @Msg, 'Payment', @RID, 'RefundRequest', GETDATE());
            END
        `);

    // 5. Send Real Email Notice to Client
    if (clientEmail && clientEmail.includes('@')) {
        try {
            const emailService = require('./emailService');
            await emailService.sendRefundProcessedClientEmail({
                toEmail: clientEmail,
                clientName,
                refundRequestId: rId,
                bookingReference: bookingRef,
                packageName,
                providerName,
                amount: reqData.Amount,
                payoutMethod: reqData.PayoutMethod,
                accountName: reqData.AccountName,
                accountNumber: reqData.AccountNumber,
                referenceNumber: refNo,
                notes: finalNotes
            });
        } catch (emailErr) {
            console.warn('[approveRefundPayout] Refund notification email warning:', emailErr.message);
        }
    }

    return {
        success: true,
        refundRequestId: rId,
        amount: reqData.Amount,
        referenceNumber: refNo,
        payoutMethod: reqData.PayoutMethod,
        accountName: reqData.AccountName,
        accountNumber: reqData.AccountNumber,
        clientEmail,
        bookingReference: bookingRef
    };
};

/**
 * Cashier Rejects a Client Refund Payout (Rolls funds back to Client Wallet)
 */
const rejectRefundPayout = async ({ refundRequestId, cashierUserId, rejectReason }) => {
    const pool = await connectDB();
    const rId = parseInt(refundRequestId, 10);

    const checkRes = await pool.request()
        .input('RID', sql.Int, rId)
        .query(`SELECT * FROM dbo.RefundRequests WHERE RefundRequestID = @RID;`);

    if (checkRes.recordset.length === 0) throw new Error('Refund request not found.');
    const reqData = checkRes.recordset[0];

    if (reqData.Status !== 'Pending') throw new Error(`Cannot reject request with status '${reqData.Status}'.`);

    const reason = rejectReason || 'Refund account information could not be verified by Cashier.';
    const refundAmt = parseFloat(reqData.Amount);

    // 1. Update status
    await pool.request()
        .input('RID', sql.Int, rId)
        .input('Reason', sql.NVarChar(500), reason)
        .input('CID', sql.Int, cashierUserId || 1)
        .query(`
            UPDATE dbo.RefundRequests
            SET Status = 'Rejected',
                AdminNotes = @Reason,
                ProcessedAt = GETDATE(),
                ProcessedBy = @CID
            WHERE RefundRequestID = @RID;
        `);

    // 2. Refund balance back to Client Wallet
    await pool.request()
        .input('UID', sql.Int, reqData.UserID)
        .input('Amt', sql.Decimal(18, 2), refundAmt)
        .query(`
            UPDATE dbo.ClientWallets
            SET Balance = Balance + @Amt, UpdatedAt = GETDATE()
            WHERE UserID = @UID;
        `);

    // 3. Log transaction rollback
    const wCheck = await pool.request()
        .input('UID', sql.Int, reqData.UserID)
        .query(`SELECT Balance FROM dbo.ClientWallets WHERE UserID = @UID;`);
    const newBal = wCheck.recordset[0] ? parseFloat(wCheck.recordset[0].Balance) : refundAmt;

    await pool.request()
        .input('UID', sql.Int, reqData.UserID)
        .input('Amt', sql.Decimal(18, 2), refundAmt)
        .input('Type', sql.NVarChar(50), 'REFUND_PAYOUT_REJECTED')
        .input('Desc', sql.NVarChar(500), `Payout request #${rId} rejected: ${reason}. Funds returned to wallet.`)
        .input('BalAfter', sql.Decimal(18, 2), newBal)
        .query(`
            INSERT INTO dbo.WalletTransactions (UserID, Amount, TransactionType, Description, BalanceAfter, CreatedAt)
            VALUES (@UID, @Amt, @Type, @Desc, @BalAfter, GETDATE());
        `);

    // 4. Notify Client
    const amtStr = refundAmt.toLocaleString('en-US', { minimumFractionDigits: 2 });
    await pool.request()
        .input('UID', sql.Int, reqData.UserID)
        .input('Title', sql.NVarChar(150), '⚠️ Refund Request Rejected (Funds Returned)')
        .input('Msg', sql.NVarChar(500), `Your refund request #${rId} for ₱${amtStr} was rejected by the Cashier. Reason: ${reason}. The ₱${amtStr} has been returned to your wallet balance.`)
        .input('RID', sql.Int, rId)
        .query(`
            IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
            BEGIN
                INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                VALUES (@UID, @Title, @Msg, 'Payment', @RID, 'RefundRequest', GETDATE());
            END
        `);

    return {
        success: true,
        refundRequestId: rId,
        refundedAmount: refundAmt,
        newBalance: newBal
    };
};

/**
 * Get All Client Refund Requests for Cashier
 */
const getAllRefundRequestsForCashier = async () => {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT 
            rr.RefundRequestID,
            rr.UserID,
            COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), NULLIF(LTRIM(RTRIM(rr.ClientName)), ''), u.Email, 'User') AS ClientName,
            COALESCE(u.Email, rr.ClientEmail, 'No Email') AS ClientEmail,
            COALESCE(u.Phone, rr.ClientPhone) AS ClientPhone,
            rr.Amount,
            rr.PayoutMethod,
            rr.AccountName,
            rr.AccountNumber,
            rr.Status,
            rr.ReferenceNumber,
            rr.AdminNotes,
            rr.RequestedAt,
            rr.ProcessedAt,
            u.Email AS UserEmail,
            b.BookingID,
            ISNULL(b.BookingReference, rr.BookingReference) AS BookingReference,
            b.PackageName,
            b.EventName,
            b.EventType,
            b.EventDate,
            b.ServiceStartDate,
            b.ServiceEndDate,
            b.StartTime,
            b.EndTime,
            b.EventPlace,
            b.VenueName,
            b.EventAddress,
            b.Location,
            b.TotalAmount AS BookingTotalAmount,
            b.AmountPaid AS BookingAmountPaid,
            b.BookingStatus,
            b.PaymentStatus AS BookingPaymentStatus,
            b.ClientName AS BookingClientName,
            b.ClientPhone AS BookingClientPhone,
            b.ClientEmail AS BookingClientEmail,
            ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName
        FROM dbo.RefundRequests rr
        LEFT JOIN dbo.Users u ON rr.UserID = u.UserID
        LEFT JOIN dbo.Clients c ON rr.UserID = c.UserID
        OUTER APPLY (
            SELECT TOP 1 bk.*
            FROM dbo.Bookings bk
            WHERE (bk.BookingID = rr.BookingID OR (rr.BookingID IS NULL AND bk.ClientUserID = rr.UserID AND bk.BookingStatus = 'Cancelled'))
            ORDER BY bk.UpdatedAt DESC, bk.BookingID DESC
        ) b
        LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
        ORDER BY 
            CASE WHEN rr.Status = 'Pending' THEN 0 ELSE 1 END,
            rr.RequestedAt DESC;
    `);

    return res.recordset || [];
};

module.exports = {
    creditWalletForRefund,
    getWalletDetails,
    requestRefundPayout,
    approveRefundPayout,
    rejectRefundPayout,
    getAllRefundRequestsForCashier
};
