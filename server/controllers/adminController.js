const { connectDB, sql } = require('../config/db');
const notificationModel = require('../models/notificationModel');
const walletService = require('../services/walletService');

/**
 * Helper: Log Activity into dbo.ActivityLogs
 */
const logActivity = async (pool, userId, action, description, entityType = null, entityId = null) => {
    try {
        await pool.request()
            .input('UserID', sql.Int, userId || null)
            .input('Action', sql.NVarChar(100), action)
            .input('Description', sql.NVarChar(500), description)
            .input('EntityType', sql.NVarChar(50), entityType || null)
            .input('EntityID', sql.Int, entityId || null)
            .query(`
                IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.ActivityLogs (UserID, Action, Description, EntityType, EntityID)
                    VALUES (@UserID, @Action, @Description, @EntityType, @EntityID);
                END
            `);
    } catch (e) {
        console.warn('Activity logging notice:', e.message);
    }
};

/**
 * GET /api/admin/stats
 * Calculate exact platform metrics directly from SQL Server DB tables.
 */
const getAdminStats = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. Total Clients (Users with RoleID = 2 or RoleName = 'Client')
        const clientRes = await pool.request().query(`
            SELECT COUNT(*) AS totalClients 
            FROM dbo.Users u
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
            WHERE r.RoleName = 'Client' OR u.RoleID = 2;
        `);
        const totalClients = clientRes.recordset[0]?.totalClients || 0;

        // 2. Active Service Providers (Users with RoleID = 3 or RoleName = 'ServiceProvider')
        const providerRes = await pool.request().query(`
            SELECT COUNT(*) AS activeProviders 
            FROM dbo.Users u
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
            WHERE (r.RoleName = 'ServiceProvider' OR u.RoleID = 3)
              AND u.AccountStatus = 'Active';
        `);
        const activeProviders = providerRes.recordset[0]?.activeProviders || 0;

        // 3. Pending Applications
        const pendingAppRes = await pool.request().query(`
            SELECT COUNT(*) AS pendingApps 
            FROM dbo.ProviderApplications 
            WHERE Status = 'Pending';
        `);
        const pendingApplications = pendingAppRes.recordset[0]?.pendingApps || 0;

        // 4. Total Bookings
        const bookingRes = await pool.request().query(`
            SELECT COUNT(*) AS totalBookings 
            FROM dbo.Bookings;
        `);
        const totalBookings = bookingRes.recordset[0]?.totalBookings || 0;

        // 5. Total Revenue & Revenue Breakdown
        const revRes = await pool.request().query(`
            SELECT 
                ISNULL(SUM(CASE WHEN PaymentStatus = 'Paid' OR BookingStatus IN ('Confirmed', 'Completed') THEN TotalAmount ELSE 0 END), 0) AS totalRevenue,
                ISNULL(SUM(CASE WHEN BookingStatus = 'Completed' THEN TotalAmount ELSE 0 END), 0) AS completedRevenue,
                ISNULL(SUM(CASE WHEN PaymentStatus = 'Pending' OR BookingStatus = 'Pending' THEN TotalAmount ELSE 0 END), 0) AS pendingRevenue
            FROM dbo.Bookings;
        `);
        const totalRevenue = parseFloat(revRes.recordset[0]?.totalRevenue || 0);
        const completedRevenue = parseFloat(revRes.recordset[0]?.completedRevenue || 0);
        const pendingRevenue = parseFloat(revRes.recordset[0]?.pendingRevenue || 0);

        // 6. Active Service Providers List
        const activeProvidersListRes = await pool.request().query(`
            SELECT 
                sp.ProviderID,
                sp.UserID, 
                ISNULL(NULLIF(sp.OwnerName, ''), ISNULL(NULLIF(sp.OwnerFirstName + ' ' + ISNULL(sp.OwnerLastName, ''), ''), ISNULL(pa.OwnerName, u.Email))) AS OwnerName, 
                ISNULL(sp.BusinessName, 'SoundSphere Service Provider') AS BusinessName, 
                ISNULL(NULLIF(sp.CoverageArea, ''), ISNULL(pa.CoverageArea, 'Batangas')) AS CoverageArea, 
                ISNULL(pa.ContactNumber, ISNULL(u.Phone, 'N/A')) AS ContactNumber,
                ISNULL(u.AccountStatus, 'Active') AS AccountStatus,
                sp.CreatedAt AS ApprovedAt,
                sp.PermitExpiryDate,
                sp.PermitNoticeSentAt,
                sp.PermitRenewalDoc,
                sp.PermitRenewalExpiryDate,
                sp.PermitRenewalSubmittedAt,
                sp.PermitRenewalStatus,
                sp.PermitRenewalNotes,
                pa.BusinessPermit_Url,
                u.Email AS ProviderEmail
            FROM dbo.ServiceProviders sp
            JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.ProviderApplications pa ON sp.ApplicationID = pa.ApplicationID;
        `);
        const activeProvidersList = activeProvidersListRes.recordset || [];

        // 7. Registered Clients List
        const registeredClientsListRes = await pool.request().query(`
            SELECT 
                c.ClientID,
                u.UserID,
                u.Email,
                c.FirstName + ' ' + c.LastName AS FullName,
                u.Phone,
                c.Address,
                ISNULL(u.AccountStatus, 'Active') AS AccountStatus,
                u.CreatedAt AS RegistrationDate,
                (SELECT COUNT(*) FROM dbo.Bookings b WHERE b.ClientUserID = u.UserID) AS BookingCount
            FROM dbo.Users u
            JOIN dbo.Clients c ON u.UserID = c.UserID
            WHERE u.RoleID = 2 OR u.RoleID IN (SELECT RoleID FROM dbo.Roles WHERE RoleName = 'Client');
        `);
        const registeredClientsList = registeredClientsListRes.recordset || [];

        // 8. Bookings List
        const bookingsListRes = await pool.request().query(`
            SELECT 
                b.BookingID,
                b.ClientUserID,
                COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName,
                u.Email AS ClientEmail,
                b.ProviderID,
                ISNULL(sp.BusinessName, 'SoundSphere Service Provider') AS ProviderName,
                b.PackageName,
                b.EventDate,
                b.EventTime,
                b.Location,
                b.TotalAmount,
                b.BookingStatus,
                b.PaymentStatus,
                b.CreatedAt
            FROM dbo.Bookings b
            JOIN dbo.Users u ON b.ClientUserID = u.UserID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            ORDER BY b.CreatedAt DESC;
        `);
        const bookingsList = bookingsListRes.recordset || [];

        // 9. Activity Logs Feed
        let activityLogs = [];
        try {
            const logsRes = await pool.request().query(`
                SELECT TOP 15
                    LogID,
                    UserID,
                    Action,
                    Description,
                    EntityType,
                    EntityID,
                    CreatedAt
                FROM dbo.ActivityLogs
                ORDER BY LogID DESC;
            `);
            activityLogs = logsRes.recordset || [];
        } catch (e) {
            activityLogs = [];
        }

        return res.status(200).json({
            success: true,
            stats: {
                totalClients,
                activeProviders,
                pendingApplications,
                totalBookings,
                totalRevenue,
                completedRevenue,
                pendingRevenue,
                activeProvidersList,
                registeredClientsList,
                bookingsList,
                activityLogs
            }
        });
    } catch (error) {
        console.error('Get Admin Stats Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin dashboard stats.',
            error: error.message
        });
    }
};

/**
 * GET /api/admin/search?q=...
 * Search across Users, Clients, Service Providers, Applications, and Bookings.
 */
const searchAdminEntities = async (req, res) => {
    try {
        const queryStr = (req.query.q || '').trim();
        if (!queryStr) {
            return res.status(200).json({ success: true, results: { clients: [], providers: [], applications: [], bookings: [] } });
        }

        const pool = await connectDB();
        const searchPattern = `%${queryStr}%`;

        // Search Clients
        const clientsRes = await pool.request()
            .input('Pattern', sql.NVarChar(255), searchPattern)
            .query(`
                SELECT c.ClientID, u.UserID, u.Email, c.FirstName + ' ' + c.LastName AS FullName, u.Phone, c.Address
                FROM dbo.Users u
                JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE u.Email LIKE @Pattern OR c.FirstName LIKE @Pattern OR c.LastName LIKE @Pattern OR u.Phone LIKE @Pattern;
            `);

        // Search Service Providers
        const providersRes = await pool.request()
            .input('Pattern', sql.NVarChar(255), searchPattern)
            .query(`
                SELECT sp.ProviderID, sp.UserID, sp.BusinessName, sp.OwnerName, sp.CoverageArea, sp.BusinessAddress
                FROM dbo.ServiceProviders sp
                WHERE sp.BusinessName LIKE @Pattern OR sp.OwnerName LIKE @Pattern OR sp.CoverageArea LIKE @Pattern;
            `);

        // Search Applications
        const appsRes = await pool.request()
            .input('Pattern', sql.NVarChar(255), searchPattern)
            .query(`
                SELECT pa.ApplicationID, pa.UserID, pa.BusinessName, pa.OwnerName, pa.ContactNumber, pa.Status
                FROM dbo.ProviderApplications pa
                WHERE pa.BusinessName LIKE @Pattern OR pa.OwnerName LIKE @Pattern OR pa.ContactNumber LIKE @Pattern;
            `);

        // Search Bookings
        const bookingsRes = await pool.request()
            .input('Pattern', sql.NVarChar(255), searchPattern)
            .query(`
                SELECT b.BookingID, b.PackageName, b.Location, b.TotalAmount, b.BookingStatus, b.PaymentStatus
                FROM dbo.Bookings b
                WHERE b.PackageName LIKE @Pattern OR b.Location LIKE @Pattern OR CAST(b.BookingID AS VARCHAR) LIKE @Pattern;
            `);

        return res.status(200).json({
            success: true,
            results: {
                clients: clientsRes.recordset || [],
                providers: providersRes.recordset || [],
                applications: appsRes.recordset || [],
                bookings: bookingsRes.recordset || []
            }
        });
    } catch (error) {
        console.error('Search Admin Entities Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to execute search query.',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/providers/:id/suspend
 */
const suspendProvider = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        if (!providerId) return res.status(400).json({ success: false, message: 'Invalid Provider ID.' });

        const pool = await connectDB();
        const provRes = await pool.request().input('ProviderID', sql.Int, providerId).query("SELECT ProviderID, UserID, BusinessName FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID");
        if (!provRes.recordset.length) return res.status(404).json({ success: false, message: 'Provider not found.' });

        const prov = provRes.recordset[0];

        await pool.request()
            .input('UserID', sql.Int, prov.UserID)
            .query("UPDATE dbo.Users SET AccountStatus = 'Suspended', IsActive = 0 WHERE UserID = @UserID;");

        await logActivity(pool, req.user?.userId || null, 'Provider Suspended', `Service Provider "${prov.BusinessName}" suspended by Administrator.`, 'ServiceProvider', providerId);

        return res.status(200).json({
            success: true,
            message: `Service Provider "${prov.BusinessName}" has been suspended.`
        });
    } catch (error) {
        console.error('Suspend Provider Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to suspend service provider.' });
    }
};

/**
 * POST /api/admin/providers/:id/reactivate
 */
const reactivateProvider = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        if (!providerId) return res.status(400).json({ success: false, message: 'Invalid Provider ID.' });

        const pool = await connectDB();
        const provRes = await pool.request().input('ProviderID', sql.Int, providerId).query("SELECT ProviderID, UserID, BusinessName FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID");
        if (!provRes.recordset.length) return res.status(404).json({ success: false, message: 'Provider not found.' });

        const prov = provRes.recordset[0];

        await pool.request()
            .input('UserID', sql.Int, prov.UserID)
            .query("UPDATE dbo.Users SET AccountStatus = 'Active', IsActive = 1 WHERE UserID = @UserID;");

        await logActivity(pool, req.user?.userId || null, 'Provider Reactivated', `Service Provider "${prov.BusinessName}" reactivated by Administrator.`, 'ServiceProvider', providerId);

        return res.status(200).json({
            success: true,
            message: `Service Provider "${prov.BusinessName}" has been reactivated.`
        });
    } catch (error) {
        console.error('Reactivate Provider Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to reactivate service provider.' });
    }
};

/**
 * GET /api/admin/profile
 * Retrieves profile information for the authenticated administrator.
 */
const getAdminProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' });
        }

        const pool = await connectDB();
        const userRes = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT 
                    u.UserID,
                    u.Email,
                    u.Phone,
                    u.AccountStatus,
                    u.CreatedAt,
                    r.RoleName,
                    a.AdminID,
                    a.FullName AS AdminFullName,
                    a.Department
                FROM dbo.Users u
                LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
                LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
                WHERE u.UserID = @UserID;
            `);

        if (!userRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Administrator profile not found.' });
        }

        const u = userRes.recordset[0];
        const profile = {
            userId: u.UserID,
            email: u.Email,
            phone: u.Phone || 'N/A',
            fullName: u.AdminFullName || 'System Administrator',
            role: u.RoleName || 'Administrator',
            accountStatus: u.AccountStatus || 'Active',
            department: u.Department || 'System Operations'
        };

        return res.status(200).json({
            success: true,
            profile
        });
    } catch (error) {
        console.error('Get Admin Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve administrator profile.' });
    }
};

/**
 * PUT /api/admin/profile
 * Updates profile details for the authenticated administrator.
 */
const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id;
        const { fullName, phone } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' });
        }

        if (!fullName || !fullName.trim()) {
            return res.status(400).json({ success: false, message: 'Full name is required.' });
        }

        const pool = await connectDB();

        // Update Users Table (Phone)
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('Phone', sql.NVarChar(20), phone || null)
            .query("UPDATE dbo.Users SET Phone = @Phone, UpdatedAt = GETDATE() WHERE UserID = @UserID;");

        // Update Admins Table (FullName)
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('FullName', sql.NVarChar(150), fullName.trim())
            .query(`
                IF EXISTS (SELECT * FROM dbo.Admins WHERE UserID = @UserID)
                BEGIN
                    UPDATE dbo.Admins SET FullName = @FullName WHERE UserID = @UserID;
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.Admins (UserID, FullName, Department)
                    VALUES (@UserID, @FullName, 'System Operations');
                END
            `);

        await logActivity(pool, userId, 'Admin Profile Updated', `Administrator updated profile details (${fullName.trim()}).`, 'User', userId);

        return res.status(200).json({
            success: true,
            message: 'Administrator profile updated successfully.',
            profile: {
                userId,
                fullName: fullName.trim(),
                phone: phone || 'N/A'
            }
        });
    } catch (error) {
        console.error('Update Admin Profile Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update administrator profile.' });
    }
};

/**
 * GET /api/admin/escrow/list
 * Retrieve all client payments held in escrow and provider payout release statuses
 */
const getEscrowList = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
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
            -- Case 1: ProviderID stores ServiceProviders.ProviderID
            LEFT JOIN dbo.ServiceProviders sp1 ON b.ProviderID = sp1.ProviderID
            LEFT JOIN dbo.Users uProv1 ON sp1.UserID = uProv1.UserID
            -- Case 2: ProviderID stores Users.UserID directly
            LEFT JOIN dbo.ServiceProviders sp2 ON b.ProviderID = sp2.UserID
            LEFT JOIN dbo.Users uProv2 ON sp2.UserID = uProv2.UserID
            ORDER BY b.CreatedAt DESC;
        `);

        const escrowItems = result.recordset || [];
        const totalHeldInEscrow = escrowItems
            .filter(i => (i.EscrowStatus || 'Held') === 'Held' || (i.EscrowStatus || '') === 'Pending Release')
            .reduce((sum, i) => sum + parseFloat(i.AmountPaid || 0), 0);

        const totalReleasedPayouts = escrowItems
            .filter(i => i.EscrowStatus === 'Released')
            .reduce((sum, i) => sum + parseFloat(i.ProviderEarnings || (i.AmountPaid * 0.95) || 0), 0);

        const totalPlatformCommission = escrowItems
            .filter(i => i.EscrowStatus === 'Released')
            .reduce((sum, i) => sum + parseFloat(i.CommissionAmount || (i.AmountPaid * 0.05) || 0), 0);

        return res.status(200).json({
            success: true,
            totalHeldInEscrow: parseFloat(totalHeldInEscrow.toFixed(2)),
            totalReleasedPayouts: parseFloat(totalReleasedPayouts.toFixed(2)),
            totalPlatformCommission: parseFloat(totalPlatformCommission.toFixed(2)),
            escrowItems
        });
    } catch (error) {
        console.error('Get Escrow List Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve escrow records.', error: error.message });
    }
};

/**
 * PUT /api/admin/escrow/:id/release
 * Admin releases held client funds to the service provider via PayMongo
 */
const releaseEscrowPayout = async (req, res) => {
    try {
        const { id } = req.params;
        const adminUserId = req.user ? req.user.userId : 1;
        const pool = await connectDB();

        // 1. Fetch booking details
        const bkRes = await pool.request().input('BID', id).query(`
            SELECT b.*, 
                COALESCE(sp1.UserID, sp2.UserID) AS ProviderUserID 
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp1 ON b.ProviderID = sp1.ProviderID
            LEFT JOIN dbo.ServiceProviders sp2 ON b.ProviderID = sp2.UserID
            WHERE b.BookingID = @BID;
        `);

        if (!bkRes.recordset || !bkRes.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Booking record not found.' });
        }

        const bk = bkRes.recordset[0];
        const netPayout = parseFloat(bk.ProviderEarnings || (bk.TotalAmount * 0.95) || 0);
        const refCode = bk.BookingReference || `#BK-${bk.BookingID}`;

        // 2. Update EscrowStatus to Released
        await pool.request()
            .input('BID', id)
            .query(`UPDATE dbo.Bookings SET EscrowStatus = 'Released', UpdatedAt = GETDATE() WHERE BookingID = @BID;`);

        // 3. Create Notification for Service Provider
        await pool.request()
            .input('UID', bk.ProviderUserID || bk.ProviderID)
            .input('BID', id)
            .input('Title', '🎉 Payment Released by Admin')
            .input('Msg', `Admin has released your payout of ₱${netPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })} via PayMongo for Booking ${refCode}!`)
            .query(`
                IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                    VALUES (@UID, @Title, @Msg, 'Payment', @BID, 'Booking');
                END
            `);

        await logActivity(pool, adminUserId, 'Escrow Payout Released', `Admin released ₱${netPayout.toFixed(2)} payout via PayMongo to provider for Booking ${refCode}.`, 'Booking', id);

        return res.status(200).json({
            success: true,
            message: `🎉 Escrow payment of ₱${netPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })} released to Service Provider for Booking ${refCode}!`,
            releasedAmount: netPayout
        });
    } catch (error) {
        console.error('Release Escrow Payout Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to release escrow payout.', error: error.message });
    }
};

/**
 * GET /api/admin/withdrawals/list
 * Retrieve all provider payout withdrawal requests
 */
const getAdminWithdrawals = async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
            SELECT 
                w.WithdrawalID,
                w.ProviderID,
                w.Amount,
                w.PayoutMethod,
                w.AccountName,
                w.AccountReference,
                w.Status,
                w.RequestedAt,
                w.ProcessedAt,
                w.AdminNotes,
                ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                ISNULL(u.Email, u2.Email) AS ProviderEmail
            FROM dbo.Withdrawals w
            LEFT JOIN dbo.ServiceProviders sp ON sp.ProviderID = w.ProviderID OR (sp.ProviderID IS NULL AND sp.UserID = w.ProviderID)
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users u2 ON w.ProviderID = u2.UserID
            ORDER BY w.RequestedAt DESC;
        `);

        return res.status(200).json({
            success: true,
            withdrawals: result.recordset || []
        });
    } catch (error) {
        console.error('Get Admin Withdrawals Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve withdrawal requests.', error: error.message });
    }
};

/**
 * PUT /api/admin/withdrawals/:id/approve
 * Admin approves and processes provider manual payout request
 */
const approveWithdrawalRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminUserId = req.user ? req.user.userId : 1;
        const pool = await connectDB();

        // 1. Fetch withdrawal details
        const wRes = await pool.request()
            .input('WID', id)
            .query(`
                SELECT w.*, sp.UserID AS ProviderUserID, sp.BusinessName 
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (w.ProviderID = sp.ProviderID OR w.ProviderID = sp.UserID)
                WHERE w.WithdrawalID = @WID;
            `);

        if (!wRes.recordset || !wRes.recordset[0]) {
            return res.status(404).json({ success: false, message: 'Withdrawal request record not found.' });
        }

        const w = wRes.recordset[0];
        const amt = parseFloat(w.Amount || 0);
        const providerUid = w.ProviderUserID || w.ProviderID;
        const methodStr = w.PayoutMethod || 'GCash / Bank Transfer';
        const accName = w.AccountName || 'Provider Account';
        const accRef = w.AccountReference || 'N/A';

        // 2. Mark status as Approved / Processed
        await pool.request()
            .input('WID', id)
            .query(`
                UPDATE dbo.Withdrawals 
                SET Status = 'Approved', ProcessedAt = GETDATE() 
                WHERE WithdrawalID = @WID;
            `);

        // 3. Send Notification to Service Provider
        if (providerUid) {
            await pool.request()
                .input('UID', providerUid)
                .input('Title', '💸 Payout Sent by Admin')
                .input('Msg', `Admin has manually sent your payout request #${id} of ₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} via ${methodStr} to ${accName} (${accRef})!`)
                .input('WID', id)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                        VALUES (@UID, @Title, @Msg, 'Payment', @WID, 'Withdrawal');
                    END
                `);
        }

        await logActivity(pool, adminUserId, 'Withdrawal Approved & Sent', `Admin manually transferred ₱${amt.toFixed(2)} via ${methodStr} to ${accName} (${accRef}) for Withdrawal #${id}.`, 'Withdrawal', id);

        return res.status(200).json({
            success: true,
            message: `🎉 Payout request #${id} marked as Paid & Sent to ${accName} (${accRef})!`
        });
    } catch (error) {
        console.error('Approve Withdrawal Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to approve withdrawal request.', error: error.message });
    }
};

/**
 * GET /api/admin/payments/overview
 * Retrieve all client payments made via PayMongo and provider withdrawal requests
 */
const getPaymentsOverview = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. All client payments made through PayMongo
        const paymentsRes = await pool.request().query(`
            SELECT 
                p.PaymentID,
                p.BookingID,
                ISNULL(b.BookingReference, CONCAT('SS-2026-', RIGHT('00000' + CAST(b.BookingID AS VARCHAR(10)), 5))) AS BookingReference,
                b.PackageName,
                b.TotalAmount AS BookingTotal,
                COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName,
                u.Email AS ClientEmail,
                u.Phone AS ClientPhone,
                ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                p.Amount,
                p.PaymentMethod,
                p.PaymentStatus,
                p.TransactionReference,
                p.PaidAt,
                p.CreatedAt
            FROM dbo.Payments p
            JOIN dbo.Bookings b ON p.BookingID = b.BookingID
            JOIN dbo.Users u ON b.ClientUserID = u.UserID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            ORDER BY p.PaidAt DESC, p.PaymentID DESC;
        `);

        // 2. All provider withdrawal requests
        const withdrawalsRes = await pool.request().query(`
            SELECT 
                w.WithdrawalID,
                w.ProviderID,
                w.Amount,
                w.PayoutMethod,
                w.AccountName,
                w.AccountReference,
                w.Status,
                w.RequestedAt,
                w.ProcessedAt,
                w.AdminNotes,
                ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                ISNULL(u.Email, u2.Email) AS ProviderEmail
            FROM dbo.Withdrawals w
            LEFT JOIN dbo.ServiceProviders sp ON sp.ProviderID = w.ProviderID OR (sp.ProviderID IS NULL AND sp.UserID = w.ProviderID)
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users u2 ON w.ProviderID = u2.UserID
            ORDER BY w.RequestedAt DESC;
        `);

        const payments = paymentsRes.recordset || [];
        const withdrawals = withdrawalsRes.recordset || [];

        const totalClientPayments = payments
            .filter(p => p.PaymentStatus === 'Paid')
            .reduce((sum, p) => sum + (parseFloat(p.Amount) || 0), 0);

        const totalPaidOut = withdrawals
            .filter(w => w.Status === 'Approved' || w.Status === 'Processed')
            .reduce((sum, w) => sum + (parseFloat(w.Amount) || 0), 0);

        const totalPendingWithdrawals = withdrawals
            .filter(w => w.Status === 'Pending')
            .reduce((sum, w) => sum + (parseFloat(w.Amount) || 0), 0);

        const availableBalance = Math.max(0, totalClientPayments - totalPaidOut);

        return res.status(200).json({
            success: true,
            paymongoConfig: {
                publicKey: process.env.PAYMONGO_PUBLIC_KEY || 'pk_test_***',
                hasSecretKey: !!process.env.PAYMONGO_SECRET_KEY,
                dashboardUrl: 'https://dashboard.paymongo.com'
            },
            totalClientPayments,
            totalPaidOut,
            totalPendingWithdrawals,
            availableBalance,
            payments,
            withdrawals
        });
    } catch (error) {
        console.error('Get Payments Overview Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve payments overview.', error: error.message });
    }
};

/**
 * GET /api/admin/audit-logs
 * Retrieves full audit trail history with actor identity, action type, description, and entity metadata
 */
const getAdminAuditLogs = async (req, res) => {
    try {
        const pool = await connectDB();
        const actionFilter = req.query.action;
        const search = (req.query.search || '').trim();
        const limit = parseInt(req.query.limit, 10) || 500;

        let queryStr = `
            WITH UnifiedAuditLogs AS (
                -- 1. Explicit ActivityLogs entries
                SELECT
                    al.LogID AS RawLogID,
                    'LOG-' + CAST(al.LogID AS VARCHAR(30)) AS DisplayID,
                    al.UserID,
                    al.Action,
                    al.Description,
                    al.EntityType,
                    al.EntityID,
                    al.CreatedAt,
                    COALESCE(adm.FullName, c.FirstName + ' ' + c.LastName, sp.BusinessName, u.Email, 'SoundSphere Administrator') AS ActorName,
                    u.Email AS ActorEmail,
                    COALESCE(r.RoleName, 'Administrator') AS ActorRole,
                    'Activity' AS SourceCategory
                FROM dbo.ActivityLogs al
                LEFT JOIN dbo.Users u ON al.UserID = u.UserID
                LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
                LEFT JOIN dbo.Admins adm ON u.UserID = adm.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID

                UNION ALL

                -- 2. Financial Payments from dbo.Payments & dbo.Bookings
                SELECT
                    p.PaymentID AS RawLogID,
                    'TXN-' + CAST(1000 + p.PaymentID AS VARCHAR(30)) AS DisplayID,
                    b.ClientUserID AS UserID,
                    'Payment ' + COALESCE(p.PaymentStatus, 'Verified') AS Action,
                    'Client payment of ₱' + 
                        CONVERT(VARCHAR(50), CAST(p.Amount AS DECIMAL(18,2)), 1) + 
                        ' via ' + COALESCE(p.PaymentMethod, 'PayMongo GCash') + 
                        ' for Booking #' + CAST(p.BookingID AS VARCHAR(30)) + ' (' + COALESCE(b.PackageName, 'Event Service') + 
                        ' - ' + COALESCE(spPay.BusinessName, 'Provider') + '). Status: ' + COALESCE(p.PaymentStatus, 'Paid & Confirmed') AS Description,
                    'Payment' AS EntityType,
                    p.PaymentID AS EntityID,
                    COALESCE(p.PaidAt, p.CreatedAt, b.CreatedAt) AS CreatedAt,
                    COALESCE(cPay.FirstName + ' ' + cPay.LastName, b.ClientName, uClient.Email, 'Client Payer') AS ActorName,
                    uClient.Email AS ActorEmail,
                    'Client' AS ActorRole,
                    'Payment' AS SourceCategory
                FROM dbo.Payments p
                LEFT JOIN dbo.Bookings b ON p.BookingID = b.BookingID
                LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
                LEFT JOIN dbo.Clients cPay ON b.ClientUserID = cPay.UserID
                LEFT JOIN dbo.ServiceProviders spPay ON b.ProviderID = spPay.ProviderID

                UNION ALL

                -- 3. Bookings from dbo.Bookings
                SELECT
                    b.BookingID AS RawLogID,
                    'BK-' + CAST(b.BookingID AS VARCHAR(30)) AS DisplayID,
                    b.ClientUserID AS UserID,
                    'Booking ' + COALESCE(b.BookingStatus, 'Created') AS Action,
                    'Booking reservation #' + COALESCE(b.BookingReference, 'BK-' + CAST(b.BookingID AS VARCHAR(30))) + 
                        ' for "' + COALESCE(b.PackageName, 'Package') + '" with ' + COALESCE(spBk.BusinessName, 'Service Provider') + 
                        '. Total: ₱' + CONVERT(VARCHAR(50), CAST(b.TotalAmount AS DECIMAL(18,2)), 1) + 
                        '. Event Date: ' + CONVERT(VARCHAR(30), b.EventDate, 107) + 
                        '. Status: ' + COALESCE(b.BookingStatus, 'Pending') AS Description,
                    'Booking' AS EntityType,
                    b.BookingID AS EntityID,
                    b.CreatedAt,
                    COALESCE(cBk.FirstName + ' ' + cBk.LastName, b.ClientName, uBk.Email, 'Client') AS ActorName,
                    uBk.Email AS ActorEmail,
                    'Client' AS ActorRole,
                    'Booking' AS SourceCategory
                FROM dbo.Bookings b
                LEFT JOIN dbo.Users uBk ON b.ClientUserID = uBk.UserID
                LEFT JOIN dbo.Clients cBk ON b.ClientUserID = cBk.UserID
                LEFT JOIN dbo.ServiceProviders spBk ON b.ProviderID = spBk.ProviderID

                UNION ALL

                -- 4. Withdrawals & Payouts from dbo.Withdrawals
                SELECT
                    w.WithdrawalID AS RawLogID,
                    'WD-' + CAST(100 + w.WithdrawalID AS VARCHAR(30)) AS DisplayID,
                    spWd.UserID AS UserID,
                    'Payout ' + COALESCE(w.Status, 'Requested') AS Action,
                    'Provider ' + COALESCE(spWd.BusinessName, w.AccountName, 'Provider') + 
                        ' payout request for ₱' + CONVERT(VARCHAR(50), CAST(w.Amount AS DECIMAL(18,2)), 1) + 
                        ' via ' + COALESCE(w.PayoutMethod, 'GCash') + 
                        ' to ' + COALESCE(w.AccountName, 'Provider') + ' (' + COALESCE(w.AccountReference, 'N/A') + 
                        '). Status: ' + COALESCE(w.Status, 'Pending') AS Description,
                    'Withdrawal' AS EntityType,
                    w.WithdrawalID AS EntityID,
                    COALESCE(w.ProcessedAt, w.RequestedAt) AS CreatedAt,
                    COALESCE(spWd.BusinessName, spWd.OwnerName, uWd.Email, 'Service Provider') AS ActorName,
                    uWd.Email AS ActorEmail,
                    'Service Provider' AS ActorRole,
                    'Withdrawal' AS SourceCategory
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders spWd ON w.ProviderID = spWd.ProviderID
                LEFT JOIN dbo.Users uWd ON spWd.UserID = uWd.UserID

                UNION ALL

                -- 5. Subscriptions from dbo.ProviderSubscriptions
                SELECT
                    sub.SubscriptionID AS RawLogID,
                    'SUB-' + CAST(sub.SubscriptionID AS VARCHAR(30)) AS DisplayID,
                    sub.UserID,
                    'Subscription ' + COALESCE(sub.Status, 'Active') AS Action,
                    'Service Provider ' + COALESCE(spSub.BusinessName, 'Provider') + 
                        ' enrolled in ' + COALESCE(sub.PlanName, sub.PlanType, 'Provider') + 
                        ' plan (₱' + CONVERT(VARCHAR(50), CAST(sub.Price AS DECIMAL(18,2)), 1) + 
                        '). Status: ' + COALESCE(sub.Status, 'Active') AS Description,
                    'Subscription' AS EntityType,
                    sub.SubscriptionID AS EntityID,
                    COALESCE(sub.CreatedAt, sub.StartDate) AS CreatedAt,
                    COALESCE(spSub.BusinessName, spSub.OwnerName, uSub.Email, 'Service Provider') AS ActorName,
                    uSub.Email AS ActorEmail,
                    'Service Provider' AS ActorRole,
                    'Subscription' AS SourceCategory
                FROM dbo.ProviderSubscriptions sub
                LEFT JOIN dbo.Users uSub ON sub.UserID = uSub.UserID
                LEFT JOIN dbo.ServiceProviders spSub ON (sub.ProviderID = spSub.ProviderID OR sub.UserID = spSub.UserID)

                UNION ALL

                -- 6. Applications from dbo.ProviderApplications
                SELECT
                    pa.ApplicationID AS RawLogID,
                    'APP-' + CAST(pa.ApplicationID AS VARCHAR(30)) AS DisplayID,
                    pa.UserID,
                    'Application ' + COALESCE(pa.Status, 'Submitted') AS Action,
                    'Service Provider application for "' + COALESCE(pa.BusinessName, 'Business') + 
                        '" submitted by ' + COALESCE(pa.OwnerName, 'Applicant') + 
                        '. Status: ' + COALESCE(pa.Status, 'Pending') AS Description,
                    'ProviderApplication' AS EntityType,
                    pa.ApplicationID AS EntityID,
                    COALESCE(pa.SubmittedAt, pa.ReviewedAt) AS CreatedAt,
                    COALESCE(pa.OwnerName, uApp.Email, 'Applicant') AS ActorName,
                    uApp.Email AS ActorEmail,
                    'Applicant' AS ActorRole,
                    'Application' AS SourceCategory
                FROM dbo.ProviderApplications pa
                LEFT JOIN dbo.Users uApp ON pa.UserID = uApp.UserID

                UNION ALL

                -- 7. Client Reports from dbo.ProviderReports
                SELECT
                    pr.ReportID AS RawLogID,
                    'REP-' + CAST(pr.ReportID AS VARCHAR(30)) AS DisplayID,
                    pr.ReporterUserID AS UserID,
                    'Client Report Filed' AS Action,
                    'Client filed Incident Report #' + CAST(pr.ReportID AS VARCHAR(30)) + 
                        ' against "' + COALESCE(spRep.BusinessName, 'Provider') + 
                        '" for: ' + COALESCE(pr.Reason, 'Incident') + '. Status: ' + COALESCE(pr.Status, 'Pending') AS Description,
                    'ProviderReport' AS EntityType,
                    pr.ReportID AS EntityID,
                    pr.CreatedAt,
                    COALESCE(cRep.FirstName + ' ' + cRep.LastName, uRep.Email, 'Client') AS ActorName,
                    uRep.Email AS ActorEmail,
                    'Client' AS ActorRole,
                    'Report' AS SourceCategory
                FROM dbo.ProviderReports pr
                LEFT JOIN dbo.Users uRep ON pr.ReporterUserID = uRep.UserID
                LEFT JOIN dbo.Clients cRep ON pr.ReporterUserID = cRep.UserID
                LEFT JOIN dbo.ServiceProviders spRep ON pr.ProviderID = spRep.ProviderID
            )
            SELECT TOP (${limit})
                u.RawLogID,
                u.DisplayID,
                u.DisplayID AS LogID,
                u.UserID,
                u.Action,
                u.Description,
                u.EntityType,
                u.EntityID,
                u.CreatedAt,
                u.ActorName,
                u.ActorEmail,
                u.ActorRole,
                u.SourceCategory
            FROM UnifiedAuditLogs u
            WHERE 1=1
        `;

        const request = pool.request();

        if (actionFilter && actionFilter !== 'all') {
            request.input('ActionFilter', sql.NVarChar(100), `%${actionFilter}%`);
            queryStr += ` AND (u.Action LIKE @ActionFilter OR u.SourceCategory LIKE @ActionFilter OR u.EntityType LIKE @ActionFilter)`;
        }

        if (search) {
            request.input('SearchTerm', sql.NVarChar(255), `%${search}%`);
            queryStr += ` AND (u.Action LIKE @SearchTerm OR u.Description LIKE @SearchTerm OR u.ActorEmail LIKE @SearchTerm OR u.ActorName LIKE @SearchTerm OR u.EntityType LIKE @SearchTerm OR u.DisplayID LIKE @SearchTerm)`;
        }

        queryStr += ` ORDER BY u.CreatedAt DESC;`;

        const result = await request.query(queryStr);

        return res.status(200).json({
            success: true,
            totalLogs: result.recordset ? result.recordset.length : 0,
            auditLogs: result.recordset || []
        });
    } catch (error) {
        console.error('Get Admin Audit Logs Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve system audit trail logs.',
            error: error.message
        });
    }
};

/**
 * GET /api/admin/reports
 * Retrieves all client reports filed against service providers with complete details
 */
const getAdminClientReports = async (req, res) => {
    try {
        const pool = await connectDB();

        const result = await pool.request().query(`
            SELECT 
                r.ReportID,
                r.ReporterUserID,
                uClient.Email AS ReporterEmail,
                COALESCE(c.FirstName + ' ' + c.LastName, uClient.Email) AS ReporterName,
                uClient.Phone AS ReporterPhone,
                r.ProviderID,
                sp.BusinessName AS ProviderBusinessName,
                sp.OwnerName AS ProviderOwnerName,
                sp.ContactNumber AS ProviderPhone,
                uProv.Email AS ProviderEmail,
                uProv.AccountStatus AS ProviderAccountStatus,
                r.BookingID,
                b.BookingReference,
                b.PackageName AS BookingPackageName,
                b.TotalAmount AS BookingTotalAmount,
                b.AmountPaid AS BookingAmountPaid,
                b.BookingStatus,
                b.PaymentStatus AS BookingPaymentStatus,
                b.EventDate AS BookingEventDate,
                r.Reason,
                r.Description,
                r.ProofImage,
                r.Status,
                r.AdminNotes,
                r.CreatedAt,
                r.ResolvedAt,
                r.ResolvedByAdminID,
                adminUser.Email AS ResolvedByEmail
            FROM dbo.ProviderReports r
            LEFT JOIN dbo.Users uClient ON r.ReporterUserID = uClient.UserID
            LEFT JOIN dbo.Clients c ON uClient.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users uProv ON sp.UserID = uProv.UserID
            LEFT JOIN dbo.Bookings b ON r.BookingID = b.BookingID
            LEFT JOIN dbo.Users adminUser ON r.ResolvedByAdminID = adminUser.UserID
            ORDER BY r.CreatedAt DESC;
        `);

        const reports = result.recordset || [];
        const stats = {
            total: reports.length,
            pending: reports.filter(r => r.Status === 'Pending' || r.Status === 'Under Review').length,
            resolved: reports.filter(r => r.Status === 'Resolved').length,
            dismissed: reports.filter(r => r.Status === 'Dismissed').length,
            suspendedProviders: reports.filter(r => r.ProviderAccountStatus === 'Suspended').length
        };

        return res.status(200).json({
            success: true,
            stats,
            reports
        });
    } catch (error) {
        console.error('Get Admin Client Reports Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve client reports.',
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/reports/:id/status
 * Update report status (Resolved / Dismissed / Under Review) with optional admin notes and optional provider suspension
 */
const updateReportStatus = async (req, res) => {
    try {
        const reportId = parseInt(req.params.id, 10);
        const { status, adminNotes, suspendProvider } = req.body;
        const adminUserId = req.user ? (req.user.userId || req.user.id) : 1;

        if (!reportId) {
            return res.status(400).json({ success: false, message: 'Invalid Report ID.' });
        }

        const validStatuses = ['Pending', 'Under Review', 'Resolved', 'Dismissed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: `Status must be one of: ${validStatuses.join(', ')}` });
        }

        const pool = await connectDB();

        // 1. Fetch current report details
        const rRes = await pool.request()
            .input('ReportID', sql.Int, reportId)
            .query(`
                SELECT r.*, sp.UserID AS ProviderUserID, sp.BusinessName, uClient.Email AS ReporterEmail
                FROM dbo.ProviderReports r
                LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
                LEFT JOIN dbo.Users uClient ON r.ReporterUserID = uClient.UserID
                WHERE r.ReportID = @ReportID;
            `);

        if (!rRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Report record not found.' });
        }

        const currentReport = rRes.recordset[0];
        const newStatus = status || currentReport.Status;
        const notes = adminNotes !== undefined ? adminNotes : currentReport.AdminNotes;
        const isResolving = newStatus === 'Resolved' || newStatus === 'Dismissed';

        // 2. Update dbo.ProviderReports
        await pool.request()
            .input('ReportID', sql.Int, reportId)
            .input('Status', sql.NVarChar(50), newStatus)
            .input('AdminNotes', sql.NVarChar(sql.MAX), notes)
            .input('AdminUID', sql.Int, adminUserId)
            .query(`
                UPDATE dbo.ProviderReports
                SET Status = @Status,
                    AdminNotes = @AdminNotes,
                    ResolvedAt = ${isResolving ? 'GETDATE()' : 'NULL'},
                    ResolvedByAdminID = ${isResolving ? '@AdminUID' : 'NULL'}
                WHERE ReportID = @ReportID;
            `);

        let suspensionMessage = '';

        // 3. Optionally suspend the reported provider
        if (suspendProvider && currentReport.ProviderUserID) {
            await pool.request()
                .input('ProvUID', sql.Int, currentReport.ProviderUserID)
                .query("UPDATE dbo.Users SET AccountStatus = 'Suspended', IsActive = 0 WHERE UserID = @ProvUID;");

            await logActivity(
                pool,
                adminUserId,
                'Provider Suspended via Report',
                `Service Provider "${currentReport.BusinessName}" suspended following Client Report #${reportId}. Reason: ${currentReport.Reason}`,
                'ServiceProvider',
                currentReport.ProviderID
            );

            // Notify Provider
            try {
                await pool.request()
                    .input('UID', sql.Int, currentReport.ProviderUserID)
                    .input('Title', sql.NVarChar(255), '🚫 Account Suspended')
                    .input('Message', sql.NVarChar(sql.MAX), `Your service provider account has been suspended by administration due to a verified client complaint (Report #${reportId}).`)
                    .input('ReportID', sql.Int, reportId)
                    .query(`
                        IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                        BEGIN
                            INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                            VALUES (@UID, @Title, @Message, 'Account', @ReportID, 'ProviderReport');
                        END
                    `);
            } catch (ne) {
                console.warn('Provider suspension notification notice:', ne.message);
            }

            suspensionMessage = ` Provider "${currentReport.BusinessName}" has also been suspended.`;
        }

        // 4. Log Audit Trail
        await logActivity(
            pool,
            adminUserId,
            `Report ${newStatus}`,
            `Admin updated Report #${reportId} against "${currentReport.BusinessName}" to "${newStatus}". Notes: ${notes || 'None'}.${suspensionMessage}`,
            'ProviderReport',
            reportId
        );

        // 5. Notify Reporter Client
        if (currentReport.ReporterUserID) {
            try {
                const clientMsg = newStatus === 'Resolved'
                    ? `Your report regarding "${currentReport.BusinessName}" has been resolved by SoundSphere Administration. Thank you for your feedback.`
                    : (newStatus === 'Dismissed'
                        ? `Your report regarding "${currentReport.BusinessName}" was reviewed and dismissed by Administration.`
                        : `Your report regarding "${currentReport.BusinessName}" is now under review by Administration.`);

                await pool.request()
                    .input('UID', sql.Int, currentReport.ReporterUserID)
                    .input('Title', sql.NVarChar(255), `📋 Report #${reportId} Status: ${newStatus}`)
                    .input('Message', sql.NVarChar(sql.MAX), clientMsg)
                    .input('ReportID', sql.Int, reportId)
                    .query(`
                        IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                        BEGIN
                            INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                            VALUES (@UID, @Title, @Message, 'Report', @ReportID, 'ProviderReport');
                        END
                    `);
            } catch (ne) {
                console.warn('Client notification notice:', ne.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Report #${reportId} has been marked as "${newStatus}".${suspensionMessage}`,
            reportId,
            status: newStatus
        });
    } catch (error) {
        console.error('Update Report Status Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update report status.',
            error: error.message
        });
    }
};

/**
 * POST /api/admin/reports/:id/warn
 * Warn Service Provider regarding client incident report
 */
const warnReportProvider = async (req, res) => {
    try {
        const reportId = parseInt(req.params.id, 10);
        const { adminNotes, warningMessage } = req.body;
        const adminUserId = req.user ? (req.user.userId || req.user.id) : 1;

        if (!reportId) {
            return res.status(400).json({ success: false, message: 'Invalid Report ID.' });
        }

        const pool = await connectDB();
        const rRes = await pool.request()
            .input('ReportID', sql.Int, reportId)
            .query(`
                SELECT r.*, sp.UserID AS ProviderUserID, sp.BusinessName, uClient.Email AS ReporterEmail
                FROM dbo.ProviderReports r
                LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
                LEFT JOIN dbo.Users uClient ON r.ReporterUserID = uClient.UserID
                WHERE r.ReportID = @ReportID;
            `);

        if (!rRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Report record not found.' });
        }

        const currentReport = rRes.recordset[0];
        const defaultWarning = `SoundSphere Administration has issued an official violation warning regarding Client Incident Report #${reportId} (${currentReport.Reason}). Please uphold professional standards and platform policies. Continued violations may lead to account penalties or suspension.`;
        const finalWarning = (warningMessage && warningMessage.trim()) ? warningMessage.trim() : defaultWarning;

        // 1. Notify Provider in dbo.Notifications
        if (currentReport.ProviderUserID) {
            await pool.request()
                .input('UID', sql.Int, currentReport.ProviderUserID)
                .input('Title', sql.NVarChar(255), '⚠️ Official Platform Violation Warning')
                .input('Message', sql.NVarChar(sql.MAX), finalWarning)
                .input('ReportID', sql.Int, reportId)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                        VALUES (@UID, @Title, @Message, 'Account', @ReportID, 'ProviderReport', GETDATE());
                    END
                `);
        }

        // 2. Append to Admin Notes
        const noteStamp = `[Official Warning Issued on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}]`;
        const updatedNotes = adminNotes ? `${adminNotes} ${noteStamp}`.trim() : `${currentReport.AdminNotes || ''} ${noteStamp}`.trim();

        await pool.request()
            .input('ReportID', sql.Int, reportId)
            .input('AdminNotes', sql.NVarChar(sql.MAX), updatedNotes)
            .query(`
                UPDATE dbo.ProviderReports
                SET AdminNotes = @AdminNotes,
                    Status = CASE WHEN Status = 'Pending' THEN 'Under Review' ELSE Status END
                WHERE ReportID = @ReportID;
            `);

        // 3. Log Activity in Audit Trail
        await logActivity(
            pool,
            adminUserId,
            'Provider Warning Issued',
            `Admin issued an official warning to Service Provider "${currentReport.BusinessName}" for Report #${reportId}. Reason: ${currentReport.Reason}`,
            'ProviderReport',
            reportId
        );

        return res.status(200).json({
            success: true,
            message: `Official warning has been issued to "${currentReport.BusinessName}".`,
            reportId
        });
    } catch (error) {
        console.error('Warn Report Provider Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to issue provider warning.', error: error.message });
    }
};

/**
 * POST /api/admin/reports/:id/refund
 * Issue Full Refund to client for an incident report
 */
const refundReportBooking = async (req, res) => {
    try {
        const reportId = parseInt(req.params.id, 10);
        const { adminNotes, refundAmount: reqRefundAmt } = req.body;
        const adminUserId = req.user ? (req.user.userId || req.user.id) : 1;

        if (!reportId) {
            return res.status(400).json({ success: false, message: 'Invalid Report ID.' });
        }

        const pool = await connectDB();
        const rRes = await pool.request()
            .input('ReportID', sql.Int, reportId)
            .query(`
                SELECT r.*, sp.UserID AS ProviderUserID, sp.BusinessName, uClient.Email AS ReporterEmail
                FROM dbo.ProviderReports r
                LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
                LEFT JOIN dbo.Users uClient ON r.ReporterUserID = uClient.UserID
                WHERE r.ReportID = @ReportID;
            `);

        if (!rRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Report record not found.' });
        }

        const currentReport = rRes.recordset[0];

        // Locate booking if any
        let booking = null;
        if (currentReport.BookingID) {
            const bkRes = await pool.request()
                .input('BID', sql.Int, currentReport.BookingID)
                .query(`SELECT * FROM dbo.Bookings WHERE BookingID = @BID;`);
            if (bkRes.recordset.length) booking = bkRes.recordset[0];
        }

        if (!booking && currentReport.ReporterUserID) {
            const bkFallback = await pool.request()
                .input('ClientUID', sql.Int, currentReport.ReporterUserID)
                .input('PID', sql.Int, currentReport.ProviderID)
                .query(`
                    SELECT TOP 1 * FROM dbo.Bookings 
                    WHERE ClientUserID = @ClientUID AND (ProviderID = @PID)
                    ORDER BY BookingID DESC;
                `);
            if (bkFallback.recordset.length) booking = bkFallback.recordset[0];
        }

        // Verify client did not accept completion (accepted completions are non-refundable)
        if (booking && (booking.CompletionAcceptedAt || (booking.BookingStatus === 'Completed' && booking.EscrowStatus === 'Released'))) {
            return res.status(400).json({
                success: false,
                message: `Refund cannot be processed: Service completion has already been accepted${booking.CompletionAcceptedAt ? ` on ${new Date(booking.CompletionAcceptedAt).toLocaleString('en-US')}` : ''}, releasing escrow payout to the service provider. In accordance with platform policy, once completion is accepted, the booking cannot be refunded.`
            });
        }

        let amountToRefund = parseFloat(reqRefundAmt || 0);
        if (amountToRefund <= 0 && booking) {
            amountToRefund = parseFloat(booking.AmountPaid || booking.TotalAmount || 0);
        }

        if (amountToRefund <= 0) {
            return res.status(400).json({
                success: false,
                message: 'No refund amount could be automatically determined. Please enter a valid refund amount.'
            });
        }

        // Credit refund to client wallet using walletService
        const refundReason = `Full refund granted by Administration for Incident Report #${reportId} against "${currentReport.BusinessName}"`;
        await walletService.creditWalletForRefund({
            userId: currentReport.ReporterUserID,
            amount: amountToRefund,
            bookingId: booking ? booking.BookingID : null,
            bookingReference: booking ? booking.BookingReference : null,
            reason: refundReason
        });

        // Update booking status if exists
        if (booking) {
            await pool.request()
                .input('BID', sql.Int, booking.BookingID)
                .query(`
                    UPDATE dbo.Bookings 
                    SET PaymentStatus = 'Refunded', BookingStatus = 'Cancelled', EscrowStatus = 'Refunded', RemainingBalance = 0, UpdatedAt = GETDATE()
                    WHERE BookingID = @BID;
                `);
        }

        // Update Report to Resolved
        const noteStamp = `[Full Refund of ₱${amountToRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited to client wallet on ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}]`;
        const updatedNotes = adminNotes ? `${adminNotes} ${noteStamp}`.trim() : `${currentReport.AdminNotes || ''} ${noteStamp}`.trim();

        await pool.request()
            .input('ReportID', sql.Int, reportId)
            .input('AdminNotes', sql.NVarChar(sql.MAX), updatedNotes)
            .input('AdminUID', sql.Int, adminUserId)
            .query(`
                UPDATE dbo.ProviderReports
                SET Status = 'Resolved',
                    ResolvedAt = GETDATE(),
                    ResolvedByAdminID = @AdminUID,
                    AdminNotes = @AdminNotes
                WHERE ReportID = @ReportID;
            `);

        // Notify client
        if (currentReport.ReporterUserID) {
            await pool.request()
                .input('UID', sql.Int, currentReport.ReporterUserID)
                .input('Title', sql.NVarChar(255), '🎉 Full Refund Approved')
                .input('Message', sql.NVarChar(sql.MAX), `SoundSphere Administration has approved a full refund of ₱${amountToRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })} following dispute resolution (Report #${reportId}). The funds have been credited to your SoundSphere wallet balance.`)
                .input('ReportID', sql.Int, reportId)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                        VALUES (@UID, @Title, @Message, 'Payment', @ReportID, 'ProviderReport', GETDATE());
                    END
                `);
        }

        // Notify provider
        if (currentReport.ProviderUserID) {
            await pool.request()
                .input('UID', sql.Int, currentReport.ProviderUserID)
                .input('Title', sql.NVarChar(255), 'ℹ️ Dispute Resolved - Client Refund Issued')
                .input('Message', sql.NVarChar(sql.MAX), `SoundSphere Administration has issued a full refund of ₱${amountToRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })} to the client for Incident Report #${reportId}. The dispute is now marked as resolved.`)
                .input('ReportID', sql.Int, reportId)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                        VALUES (@UID, @Title, @Message, 'Report', @ReportID, 'ProviderReport', GETDATE());
                    END
                `);
        }

        // Log Audit Trail
        await logActivity(
            pool,
            adminUserId,
            'Dispute Full Refund Issued',
            `Admin granted full refund of ₱${amountToRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })} to Client (${currentReport.ReporterEmail}) for Report #${reportId} against "${currentReport.BusinessName}".`,
            'ProviderReport',
            reportId
        );

        return res.status(200).json({
            success: true,
            message: `Full refund of ₱${amountToRefund.toLocaleString('en-US', { minimumFractionDigits: 2 })} credited to client wallet. Report marked as Resolved.`,
            reportId,
            refundAmount: amountToRefund
        });
    } catch (error) {
        console.error('Refund Report Booking Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process refund.', error: error.message });
    }
};

/**
 * POST /api/admin/reports/:id/resolve
 * Mark client report as Resolved
 */
const resolveReport = async (req, res) => {
    try {
        const reportId = parseInt(req.params.id, 10);
        const { adminNotes } = req.body;
        const adminUserId = req.user ? (req.user.userId || req.user.id) : 1;

        if (!reportId) {
            return res.status(400).json({ success: false, message: 'Invalid Report ID.' });
        }

        const pool = await connectDB();
        const rRes = await pool.request()
            .input('ReportID', sql.Int, reportId)
            .query(`
                SELECT r.*, sp.UserID AS ProviderUserID, sp.BusinessName, uClient.Email AS ReporterEmail
                FROM dbo.ProviderReports r
                LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
                LEFT JOIN dbo.Users uClient ON r.ReporterUserID = uClient.UserID
                WHERE r.ReportID = @ReportID;
            `);

        if (!rRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Report record not found.' });
        }

        const currentReport = rRes.recordset[0];
        const notes = adminNotes !== undefined ? adminNotes : currentReport.AdminNotes;

        await pool.request()
            .input('ReportID', sql.Int, reportId)
            .input('AdminNotes', sql.NVarChar(sql.MAX), notes)
            .input('AdminUID', sql.Int, adminUserId)
            .query(`
                UPDATE dbo.ProviderReports
                SET Status = 'Resolved',
                    ResolvedAt = GETDATE(),
                    ResolvedByAdminID = @AdminUID,
                    AdminNotes = @AdminNotes
                WHERE ReportID = @ReportID;
            `);

        // Notify Client
        if (currentReport.ReporterUserID) {
            await pool.request()
                .input('UID', sql.Int, currentReport.ReporterUserID)
                .input('Title', sql.NVarChar(255), `📋 Report #${reportId} Resolved`)
                .input('Message', sql.NVarChar(sql.MAX), `Your incident report regarding "${currentReport.BusinessName}" has been resolved by SoundSphere Administration. Thank you for your feedback.`)
                .input('ReportID', sql.Int, reportId)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType, CreatedAt)
                        VALUES (@UID, @Title, @Message, 'Report', @ReportID, 'ProviderReport', GETDATE());
                    END
                `);
        }

        // Log Audit Trail
        await logActivity(
            pool,
            adminUserId,
            'Report Resolved',
            `Admin resolved Client Report #${reportId} against "${currentReport.BusinessName}". Notes: ${notes || 'None'}`,
            'ProviderReport',
            reportId
        );

        return res.status(200).json({
            success: true,
            message: `Report #${reportId} has been marked as Resolved.`,
            reportId,
            status: 'Resolved'
        });
    } catch (error) {
        console.error('Resolve Report Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to resolve report.', error: error.message });
    }
};

/**
 * GET /api/admin/notifications
 * Retrieves real-time administrative operational notifications
 */
const getAdminNotifications = async (req, res) => {
    try {
        const pool = await connectDB();
        const adminUserId = req.user?.userId || req.user?.id || 38;

        // 1. Fetch persistent notifications targeted for Admin from dbo.Notifications
        let notifications = [];
        try {
            const notifRes = await pool.request()
                .input('AdminUID', sql.Int, adminUserId)
                .query(`
                    SELECT 
                        n.NotificationID,
                        n.NotificationType,
                        n.Title,
                        n.Message,
                        n.RelatedID,
                        n.RelatedType,
                        n.IsRead,
                        n.CreatedAt
                    FROM dbo.Notifications n
                    WHERE n.UserID = @AdminUID 
                       OR n.UserID IN (SELECT UserID FROM dbo.Users WHERE RoleID = 1 OR Email = 'soundsphere@gmail.com')
                       OR n.NotificationType IN ('AdminAlert', 'SystemAlert', 'AdminNotice')
                    ORDER BY n.CreatedAt DESC;
                `);
            notifications = notifRes.recordset || [];
        } catch (e) {
            console.warn('Persistent admin notifications fetch notice:', e.message);
        }

        // 2. Fetch pending provider applications
        try {
            const appsRes = await pool.request().query(`
                SELECT 
                    pa.ApplicationID,
                    pa.BusinessName,
                    COALESCE(pa.OwnerName, u.Email) AS ApplicantName,
                    pa.CoverageArea,
                    pa.SubmittedAt,
                    pa.Status
                FROM dbo.ProviderApplications pa
                LEFT JOIN dbo.Users u ON pa.UserID = u.UserID
                WHERE pa.Status = 'Pending'
                ORDER BY pa.SubmittedAt DESC;
            `);

            for (const app of (appsRes.recordset || [])) {
                const alreadyExists = notifications.some(n => n.NotificationType === 'Application' && String(n.RelatedID) === String(app.ApplicationID));
                if (!alreadyExists) {
                    notifications.push({
                        NotificationID: `app-${app.ApplicationID}`,
                        NotificationType: 'Application',
                        Title: `New Provider Application: ${app.BusinessName}`,
                        Message: `${app.ApplicantName || 'Applicant'} applied for "${app.BusinessName}" (${app.CoverageArea || 'Batangas'}). Click to review credentials in full screen.`,
                        RelatedID: app.ApplicationID,
                        RelatedType: 'Application',
                        IsRead: false,
                        CreatedAt: app.SubmittedAt
                    });
                }
            }
        } catch (e) {
            console.warn('Admin applications notification fetch notice:', e.message);
        }

        // 3. Fetch pending withdrawal requests
        try {
            const wdRes = await pool.request().query(`
                SELECT 
                    w.WithdrawalID,
                    w.Amount,
                    w.PayoutMethod,
                    w.Status,
                    w.RequestedAt,
                    ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName
                FROM dbo.Withdrawals w
                LEFT JOIN dbo.ServiceProviders sp ON (w.ProviderID = sp.ProviderID OR w.ProviderID = sp.UserID)
                WHERE w.Status = 'Pending'
                ORDER BY w.RequestedAt DESC;
            `);

            for (const wd of (wdRes.recordset || [])) {
                const alreadyExists = notifications.some(n => n.NotificationType === 'Withdrawal' && String(n.RelatedID) === String(wd.WithdrawalID));
                if (!alreadyExists) {
                    const amt = parseFloat(wd.Amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                    notifications.push({
                        NotificationID: `wd-${wd.WithdrawalID}`,
                        NotificationType: 'Withdrawal',
                        Title: `Pending Payout Request: ₱${amt}`,
                        Message: `${wd.ProviderName} requested a payout of ₱${amt} via ${wd.PayoutMethod || 'GCash'}. Action required.`,
                        RelatedID: wd.WithdrawalID,
                        RelatedType: 'Withdrawal',
                        IsRead: false,
                        CreatedAt: wd.RequestedAt
                    });
                }
            }
        } catch (e) {
            console.warn('Admin withdrawals notification fetch notice:', e.message);
        }

        // 4. Fetch pending client reports / disputes
        try {
            const repRes = await pool.request().query(`
                SELECT 
                    r.ReportID,
                    r.Reason,
                    r.Status,
                    r.CreatedAt,
                    ISNULL(sp.BusinessName, 'Provider') AS ProviderName
                FROM dbo.ProviderReports r
                LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
                WHERE r.Status IN ('Pending', 'Under Review')
                ORDER BY r.CreatedAt DESC;
            `);

            for (const rep of (repRes.recordset || [])) {
                const alreadyExists = notifications.some(n => n.NotificationType === 'Report' && String(n.RelatedID) === String(rep.ReportID));
                if (!alreadyExists) {
                    notifications.push({
                        NotificationID: `rep-${rep.ReportID}`,
                        NotificationType: 'Report',
                        Title: `Dispute Filed: Report #${rep.ReportID}`,
                        Message: `Client complaint against ${rep.ProviderName}: "${rep.Reason || 'Dispute'}". Investigation required.`,
                        RelatedID: rep.ReportID,
                        RelatedType: 'Report',
                        IsRead: false,
                        CreatedAt: rep.CreatedAt
                    });
                }
            }
        } catch (e) {
            console.warn('Admin reports notification fetch notice:', e.message);
        }

        // 5. Fetch recent bookings (last 10)
        try {
            const bkRes = await pool.request().query(`
                SELECT TOP 10
                    b.BookingID,
                    b.BookingReference,
                    b.TotalAmount,
                    b.BookingStatus,
                    b.CreatedAt,
                    b.PackageName,
                    ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                    COALESCE(b.ClientName, u.Email, 'Client') AS ClientName
                FROM dbo.Bookings b
                LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
                LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
                ORDER BY b.CreatedAt DESC;
            `);

            for (const bk of (bkRes.recordset || [])) {
                const alreadyExists = notifications.some(n => n.NotificationType === 'Booking' && String(n.RelatedID) === String(bk.BookingID));
                if (!alreadyExists) {
                    const total = parseFloat(bk.TotalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
                    notifications.push({
                        NotificationID: `bk-${bk.BookingID}`,
                        NotificationType: 'Booking',
                        Title: `Booking ${bk.BookingStatus || 'Confirmed'}: #${bk.BookingReference || bk.BookingID}`,
                        Message: `${bk.ClientName} booked "${bk.PackageName || 'Package'}" with ${bk.ProviderName} (Total: ₱${total}).`,
                        RelatedID: bk.BookingID,
                        RelatedType: 'Booking',
                        IsRead: true,
                        CreatedAt: bk.CreatedAt
                    });
                }
            }
        } catch (e) {
            console.warn('Admin bookings notification fetch notice:', e.message);
        }

        // Sort all notifications by CreatedAt DESC
        notifications.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));

        // Sanitize any broken legacy characters like '??' or '?750'
        notifications = notifications.map(n => ({
            ...n,
            Title: String(n.Title || '').replace(/^\?\?\s*/, '📢 ').replace(/\?(\d)/g, '₱$1'),
            Message: String(n.Message || '').replace(/\?\?\s*/g, '📢 ').replace(/\?(\d)/g, '₱$1')
        }));

        const unreadCount = notifications.filter(n => !n.IsRead).length;

        return res.status(200).json({
            success: true,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error('Get Admin Notifications Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin notifications.',
            error: error.message
        });
    }
};

/**
 * PUT /api/admin/notifications/:id/read
 * Mark an administrative notification as read
 */
const markAdminNotificationRead = async (req, res) => {
    try {
        const notifId = req.params.id;
        const pool = await connectDB();
        const numericId = parseInt(notifId, 10);

        if (!isNaN(numericId)) {
            await pool.request()
                .input('NID', sql.Int, numericId)
                .query(`
                    IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                    BEGIN
                        UPDATE dbo.Notifications
                        SET IsRead = 1, ReadAt = GETDATE()
                        WHERE NotificationID = @NID;
                    END
                `);
        }

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.'
        });
    } catch (error) {
        console.error('Mark Admin Notification Read Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark notification read.' });
    }
};

/**
 * PUT /api/admin/notifications/read-all
 * Mark all admin notifications as read
 */
const markAllAdminNotificationsRead = async (req, res) => {
    try {
        const adminUserId = req.user?.userId || req.user?.id || 38;
        const pool = await connectDB();

        await pool.request()
            .input('AdminUID', sql.Int, adminUserId)
            .query(`
                IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                BEGIN
                    UPDATE dbo.Notifications
                    SET IsRead = 1, ReadAt = GETDATE()
                    WHERE UserID = @AdminUID
                       OR UserID IN (SELECT UserID FROM dbo.Users WHERE RoleID = 1);
                END
            `);

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.'
        });
    } catch (error) {
        console.error('Mark All Admin Notifications Read Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to mark all notifications read.' });
    }
};

/**
 * GET /api/admin/bookings/:id
 * Retrieve comprehensive booking details for administrator modal
 */
const getAdminBookingDetails = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id || id === 'undefined' || id === 'null') {
            return res.status(400).json({ success: false, message: 'Valid Booking ID or Reference is required.' });
        }

        const pool = await connectDB();
        const cleanId = String(id).trim().replace(/^#/, '');
        const isNum = !isNaN(parseInt(cleanId, 10));
        const numId = isNum ? parseInt(cleanId, 10) : -1;

        const queryStr = `
            SELECT 
                b.*,
                sp.BusinessName AS ProviderName,
                sp.OwnerName AS ProviderOwnerName,
                sp.CoverageArea AS ProviderCoverage,
                uProv.Email AS ProviderEmail,
                uProv.Phone AS ProviderPhone,
                COALESCE(b.ClientName, uClient.Email, 'Client') AS DisplayClientName,
                COALESCE(b.ClientEmail, uClient.Email) AS DisplayClientEmail,
                COALESCE(b.ClientPhone, uClient.Phone) AS DisplayClientPhone
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users uProv ON sp.UserID = uProv.UserID
            LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
            WHERE b.BookingID = @ID 
               OR b.BookingReference = @Ref
               OR b.BookingReference = @RawRef;
        `;

        const result = await pool.request()
            .input('ID', sql.Int, numId)
            .input('Ref', sql.NVarChar(50), cleanId)
            .input('RawRef', sql.NVarChar(50), String(id).trim())
            .query(queryStr);

        if (!result.recordset || !result.recordset.length) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        return res.status(200).json({
            success: true,
            booking: result.recordset[0]
        });
    } catch (error) {
        console.error('Get Admin Booking Details Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve booking details.', error: error.message });
    }
};

/**
 * GET /api/admin/permits
 * List all providers with their business permit status, expiration, and renewal info
 */
const getAdminPermits = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. Check existing columns to prevent "Invalid column name" errors on unmigrated databases
        const colCheck = await pool.request().query(`
            SELECT TABLE_NAME, COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME IN ('ServiceProviders', 'ProviderApplications')
        `);
        const existingCols = new Set(colCheck.recordset.map(c => `${c.TABLE_NAME}.${c.COLUMN_NAME}`.toLowerCase()));
        const hasSpCol = (col) => existingCols.has(`serviceproviders.${col}`.toLowerCase());
        const hasPaCol = (col) => existingCols.has(`providerapplications.${col}`.toLowerCase());

        const spExp = hasSpCol('PermitExpiryDate') ? "TRY_CAST(NULLIF(sp.PermitExpiryDate, '') AS DATE)" : "NULL";
        const spRenewExp = hasSpCol('PermitRenewalExpiryDate') ? "TRY_CAST(NULLIF(sp.PermitRenewalExpiryDate, '') AS DATE)" : "NULL";
        const paExp = hasPaCol('PermitExpiryDate') ? "TRY_CAST(NULLIF(pa.PermitExpiryDate, '') AS DATE)" : "NULL";

        const spIssued = hasSpCol('PermitIssuedDate') ? "TRY_CAST(NULLIF(sp.PermitIssuedDate, '') AS DATE)" : "NULL";
        const spRenewIssued = hasSpCol('PermitRenewalIssuedDate') ? "TRY_CAST(NULLIF(sp.PermitRenewalIssuedDate, '') AS DATE)" : "NULL";
        const paIssued = hasPaCol('PermitIssuedDate') ? "TRY_CAST(NULLIF(pa.PermitIssuedDate, '') AS DATE)" : "NULL";

        const spNotice = hasSpCol('PermitNoticeSentAt') ? "sp.PermitNoticeSentAt" : "NULL AS PermitNoticeSentAt";
        const spRenewDoc = hasSpCol('PermitRenewalDoc') ? "sp.PermitRenewalDoc" : "NULL AS PermitRenewalDoc";
        const spRenewSub = hasSpCol('PermitRenewalSubmittedAt') ? "sp.PermitRenewalSubmittedAt" : "NULL AS PermitRenewalSubmittedAt";
        const spRenewStat = hasSpCol('PermitRenewalStatus') ? "sp.PermitRenewalStatus" : "NULL AS PermitRenewalStatus";
        const spRenewNotes = hasSpCol('PermitRenewalNotes') ? "sp.PermitRenewalNotes" : "NULL AS PermitRenewalNotes";
        const paPermitUrl = hasPaCol('BusinessPermit_Url') ? "pa.BusinessPermit_Url" : (hasPaCol('BusinessPermitDoc') ? "pa.BusinessPermitDoc" : "NULL");
        const paContact = hasPaCol('ContactNumber') ? "pa.ContactNumber" : "NULL";

        const query = `
            SELECT 
                sp.ProviderID,
                sp.UserID,
                sp.BusinessName,
                COALESCE(NULLIF(sp.OwnerName, ''), CONCAT(sp.OwnerFirstName, ' ', sp.OwnerLastName), u.Email) AS OwnerName,
                u.Email AS ProviderEmail,
                COALESCE(sp.ContactNumber, ${paContact}, u.Phone, 'N/A') AS ContactNumber,
                ${hasSpCol('ProfilePicture') ? 'sp.ProfilePicture' : 'NULL'} AS Avatar,
                COALESCE(${spExp}, ${spRenewExp}, ${paExp}) AS PermitExpiryDate,
                COALESCE(${spIssued}, ${spRenewIssued}, ${paIssued}) AS PermitIssuedDate,
                ${spNotice === 'NULL AS PermitNoticeSentAt' ? 'NULL AS PermitNoticeSentAt' : 'sp.PermitNoticeSentAt'},
                ${spRenewDoc === 'NULL AS PermitRenewalDoc' ? 'NULL AS PermitRenewalDoc' : 'sp.PermitRenewalDoc AS PermitRenewalDoc'},
                ${spRenewExp} AS PermitRenewalExpiryDate,
                ${spRenewSub === 'NULL AS PermitRenewalSubmittedAt' ? 'NULL AS PermitRenewalSubmittedAt' : 'sp.PermitRenewalSubmittedAt'},
                ${spRenewStat === 'NULL AS PermitRenewalStatus' ? 'NULL AS PermitRenewalStatus' : 'sp.PermitRenewalStatus'},
                ${spRenewNotes === 'NULL AS PermitRenewalNotes' ? 'NULL AS PermitRenewalNotes' : 'sp.PermitRenewalNotes'},
                COALESCE(${hasSpCol('PermitRenewalDoc') ? 'sp.PermitRenewalDoc' : 'NULL'}, ${paPermitUrl}) AS BusinessPermit_Url,
                sp.VerificationStatus,
                u.AccountStatus,
                (SELECT COUNT(*) FROM dbo.Bookings b WHERE (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)) AS TotalBookings
            FROM dbo.ServiceProviders sp
            JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.ProviderApplications pa ON (sp.ApplicationID = pa.ApplicationID OR sp.UserID = pa.UserID)
            ORDER BY 
                CASE 
                    WHEN ${hasSpCol('PermitRenewalStatus') ? "sp.PermitRenewalStatus" : "'None'"} = 'Pending_Review' THEN 1
                    WHEN COALESCE(${spExp}, ${spRenewExp}, ${paExp}) IS NOT NULL 
                         AND COALESCE(${spExp}, ${spRenewExp}, ${paExp}) < CAST(GETDATE() AS DATE) THEN 2
                    WHEN COALESCE(${spExp}, ${spRenewExp}, ${paExp}) IS NOT NULL 
                         AND COALESCE(${spExp}, ${spRenewExp}, ${paExp}) <= DATEADD(day, 30, CAST(GETDATE() AS DATE)) THEN 3
                    ELSE 4
                END ASC,
                COALESCE(${spExp}, ${spRenewExp}, ${paExp}) ASC;
        `;
        const result = await pool.request().query(query);
        const providers = result.recordset || [];
        const today = new Date();

        let validCount = 0;
        let expiringSoonCount = 0;
        let expiredCount = 0;
        let renewalPendingCount = 0;

        const mapped = providers.map(p => {
            let permitStatus = 'Not_Set';
            let daysRemaining = null;
            let isExpired = false;
            let isExpiringSoon = false;

            const effectiveExpiry = p.PermitExpiryDate || p.PermitRenewalExpiryDate;

            if (effectiveExpiry) {
                const exp = new Date(effectiveExpiry);
                if (!isNaN(exp.getTime())) {
                    const utcExp = Date.UTC(exp.getFullYear(), exp.getMonth(), exp.getDate());
                    const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
                    daysRemaining = Math.floor((utcExp - utcToday) / (1000 * 60 * 60 * 24));
                    if (daysRemaining < 0) {
                        permitStatus = 'Expired';
                        isExpired = true;
                        expiredCount++;
                    } else if (daysRemaining <= 30) {
                        permitStatus = 'Expiring_Soon';
                        isExpiringSoon = true;
                        expiringSoonCount++;
                    } else {
                        permitStatus = 'Valid';
                        validCount++;
                    }
                }
            }

            if (p.PermitRenewalStatus === 'Pending_Review') {
                renewalPendingCount++;
            }

            const isRenewalPending = (p.PermitRenewalStatus === 'Pending_Review' || p.PermitRenewalStatus === 'Pending');
            const compStatus = isRenewalPending ? 'Renewal_Pending' : permitStatus;

            return {
                ...p,
                Avatar: p.Avatar || null,
                Email: p.ProviderEmail || p.Email,
                Phone: p.ContactNumber || p.Phone,
                PermitExpirationDate: effectiveExpiry,
                RenewalPermitExpiryDate: p.PermitRenewalExpiryDate,
                PermitIssuedDate: p.PermitIssuedDate,
                ComplianceStatus: compStatus,
                DaysRemaining: daysRemaining,
                PermitFile: p.BusinessPermit_Url || p.PermitRenewalDoc,
                RenewalPermitFile: p.PermitRenewalDoc,
                RenewalPermitStatus: isRenewalPending ? 'Pending' : p.PermitRenewalStatus,
                RenewalSubmittedAt: p.PermitRenewalSubmittedAt,
                RenewalRejectionReason: p.PermitRenewalNotes,
                LastNoticeSentAt: p.PermitNoticeSentAt,
                permitStatus,
                daysRemaining,
                isExpired,
                isExpiringSoon,
                isBookingDisabled: isExpired
            };
        });

        return res.status(200).json({
            success: true,
            summary: {
                total: mapped.length,
                valid: validCount,
                expiringSoon: expiringSoonCount,
                expired: expiredCount,
                renewalPending: renewalPendingCount
            },
            providers: mapped
        });
    } catch (error) {
        console.error('Get Admin Permits Error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve provider permits list.',
            error: error.message 
        });
    }
};

/**
 * POST /api/admin/permits/:id/send-notice
 * Send official permit renewal notice (in-app + email) to provider
 */
const sendPermitNotice = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        if (!providerId) return res.status(400).json({ success: false, message: 'Invalid Provider ID.' });

        const pool = await connectDB();
        const provRes = await pool.request()
            .input('ProviderID', sql.Int, providerId)
            .query(`
                SELECT sp.ProviderID, sp.UserID, sp.BusinessName,
                       COALESCE(sp.PermitExpiryDate, sp.PermitRenewalExpiryDate, pa.PermitExpiryDate) AS PermitExpiryDate,
                       COALESCE(NULLIF(sp.OwnerName, ''), CONCAT(sp.OwnerFirstName, ' ', sp.OwnerLastName), u.Email) AS OwnerName,
                       u.Email
                FROM dbo.ServiceProviders sp
                JOIN dbo.Users u ON sp.UserID = u.UserID
                LEFT JOIN dbo.ProviderApplications pa ON (sp.ApplicationID = pa.ApplicationID OR sp.UserID = pa.UserID)
                WHERE sp.ProviderID = @ProviderID;
            `);

        if (!provRes.recordset || !provRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Provider not found.' });
        }

        const prov = provRes.recordset[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let isExpired = false;
        let daysRemaining = null;

        if (prov.PermitExpiryDate) {
            const exp = new Date(prov.PermitExpiryDate);
            exp.setHours(0, 0, 0, 0);
            daysRemaining = Math.round((exp - today) / (1000 * 60 * 60 * 24));
            isExpired = daysRemaining < 0;
        } else {
            isExpired = true;
        }

        // Update PermitNoticeSentAt
        await pool.request()
            .input('ProviderID', sql.Int, providerId)
            .query('UPDATE dbo.ServiceProviders SET PermitNoticeSentAt = GETDATE() WHERE ProviderID = @ProviderID;');

        // Create In-App Notification
        const notifTitle = isExpired ? 'Business Permit Expired - Renewal Required' : 'Notice: Business Permit Expiring Soon';
        const notifMsg = isExpired
            ? `Your business permit has expired. As per platform policy, you cannot accept new bookings until a renewed permit is submitted. Please upload your renewed permit in your Provider Dashboard.`
            : `Your business permit will expire in ${daysRemaining} days. Please upload your renewed permit soon to avoid booking disruption.`;

        await pool.request()
            .input('UID', sql.Int, prov.UserID)
            .input('Title', sql.NVarChar(200), notifTitle)
            .input('Msg', sql.NVarChar(500), notifMsg)
            .input('Type', sql.NVarChar(50), 'PermitCompliance')
            .input('RelID', sql.Int, providerId)
            .input('RelType', sql.NVarChar(50), 'ProviderPermit')
            .query(`
                IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                BEGIN
                    INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                    VALUES (@UID, @Title, @Msg, @Type, @RelID, @RelType);
                END
            `);

        // Send Real Email Notice
        const emailService = require('../services/emailService');
        let emailSent = false;
        try {
            if (typeof emailService.sendPermitRenewalNoticeEmail === 'function') {
                await emailService.sendPermitRenewalNoticeEmail({
                    toEmail: prov.Email,
                    providerName: prov.OwnerName,
                    businessName: prov.BusinessName,
                    expiryDate: prov.PermitExpiryDate,
                    isExpired,
                    daysRemaining
                });
                emailSent = true;
            }
        } catch (emErr) {
            console.warn('Permit email notice error:', emErr.message);
        }

        // Log Activity Audit Trail
        try {
            await logActivity(
                pool,
                req.user?.userId || null,
                'Business Permit Notice Sent',
                `Sent renewal notice to "${prov.BusinessName}" (${prov.Email})`,
                'ServiceProvider',
                providerId
            );
        } catch (logErr) {
            console.warn('Log activity error:', logErr.message);
        }

        return res.status(200).json({
            success: true,
            message: `Notice successfully sent to ${prov.BusinessName} (${prov.Email}).${emailSent ? ' Official email notification dispatched.' : ''}`
        });
    } catch (error) {
        console.error('Send Permit Notice Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send permit renewal notice.', error: error.message });
    }
};

/**
 * Helper: Parse permit date from ISO or formatted date strings safely
 */
const parseSafePermitDate = (val) => {
    if (!val) return null;
    if (val instanceof Date && !isNaN(val.getTime())) return val;
    if (typeof val === 'string') {
        const trimmed = val.trim();
        // Check DD/MM/YYYY or DD-MM-YYYY
        const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
        if (dmyMatch) {
            const day = parseInt(dmyMatch[1], 10);
            const month = parseInt(dmyMatch[2], 10) - 1;
            const year = parseInt(dmyMatch[3], 10);
            const d = new Date(year, month, day);
            if (!isNaN(d.getTime())) return d;
        }
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
};

/**
 * POST /api/admin/permits/:id/review
 * Approve or Reject submitted renewal permit
 */
const reviewPermitRenewal = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        const { action, rejectionReason, newExpiryDate, expirationDate } = req.body;

        if (!providerId || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, message: 'Invalid Provider ID or review action.' });
        }

        const pool = await connectDB();
        const provRes = await pool.request()
            .input('ProviderID', sql.Int, providerId)
            .query(`
                SELECT sp.ProviderID, sp.UserID, sp.BusinessName, sp.PermitRenewalExpiryDate, sp.PermitRenewalDoc,
                       u.Email
                FROM dbo.ServiceProviders sp
                JOIN dbo.Users u ON sp.UserID = u.UserID
                WHERE sp.ProviderID = @ProviderID;
            `);

        if (!provRes.recordset || !provRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Provider not found.' });
        }

        const prov = provRes.recordset[0];

        if (action === 'approve') {
            const rawExpiry = newExpiryDate || expirationDate || prov.PermitRenewalExpiryDate;
            const parsedExpiry = parseSafePermitDate(rawExpiry);
            if (!parsedExpiry) {
                return res.status(400).json({ success: false, message: 'A valid permit expiration date is required to approve renewal.' });
            }

            await pool.request()
                .input('ProviderID', sql.Int, providerId)
                .input('PermitExpiryDate', sql.Date, parsedExpiry)
                .query(`
                    UPDATE dbo.ServiceProviders
                    SET PermitExpiryDate = @PermitExpiryDate,
                        PermitRenewalStatus = 'Approved',
                        PermitRenewalNotes = NULL,
                        PermitStatus = 'Active',
                        PermitNoticeSentAt = NULL
                    WHERE ProviderID = @ProviderID;

                    -- Sync linked provider application if present
                    UPDATE pa
                    SET pa.PermitExpiryDate = @PermitExpiryDate
                    FROM dbo.ProviderApplications pa
                    JOIN dbo.ServiceProviders sp ON (sp.ApplicationID = pa.ApplicationID OR sp.UserID = pa.UserID)
                    WHERE sp.ProviderID = @ProviderID;
                `);

            // Safe notification dispatch
            try {
                if (notificationModel && typeof notificationModel.createNotification === 'function') {
                    await notificationModel.createNotification({
                        userId: prov.UserID,
                        type: 'PermitCompliance',
                        title: 'Business Permit Renewal Approved',
                        message: `Congratulations! Your renewed business permit has been approved. Your expiration date is updated to ${parsedExpiry.toLocaleDateString()}. New booking reception is fully active.`,
                        relatedId: providerId,
                        relatedType: 'ProviderPermit'
                    });
                }
            } catch (notifErr) {
                console.warn('Permit approval notification dispatch notice:', notifErr.message);
            }

            // Safe activity logging
            try {
                await logActivity(
                    pool,
                    req.user?.userId || null,
                    'Permit Renewal Approved',
                    `Approved permit renewal for "${prov.BusinessName}". Valid until ${parsedExpiry.toLocaleDateString()}`,
                    'ServiceProvider',
                    providerId
                );
            } catch (logErr) {
                console.warn('Permit approval logActivity notice:', logErr.message);
            }

            return res.status(200).json({
                success: true,
                message: `Permit renewal approved for ${prov.BusinessName}. Booking reception has been fully restored.`
            });
        } else {
            // Reject
            await pool.request()
                .input('ProviderID', sql.Int, providerId)
                .input('Notes', sql.NVarChar(500), rejectionReason || 'Submitted document does not meet compliance standards.')
                .query(`
                    UPDATE dbo.ServiceProviders
                    SET PermitRenewalStatus = 'Rejected',
                        PermitRenewalNotes = @Notes
                    WHERE ProviderID = @ProviderID;
                `);

            // Safe notification dispatch
            try {
                if (notificationModel && typeof notificationModel.createNotification === 'function') {
                    await notificationModel.createNotification({
                        userId: prov.UserID,
                        type: 'PermitCompliance',
                        title: 'Business Permit Renewal Rejected',
                        message: `Your business permit renewal was not approved. Reason: ${rejectionReason || 'Document verification failed.'}. Please re-upload a valid document.`,
                        relatedId: providerId,
                        relatedType: 'ProviderPermit'
                    });
                }
            } catch (notifErr) {
                console.warn('Permit rejection notification dispatch notice:', notifErr.message);
            }

            // Safe activity logging
            try {
                await logActivity(
                    pool,
                    req.user?.userId || null,
                    'Permit Renewal Rejected',
                    `Rejected permit renewal for "${prov.BusinessName}". Reason: ${rejectionReason || 'Invalid document'}`,
                    'ServiceProvider',
                    providerId
                );
            } catch (logErr) {
                console.warn('Permit rejection logActivity notice:', logErr.message);
            }

            return res.status(200).json({
                success: true,
                message: `Permit renewal for ${prov.BusinessName} rejected.`
            });
        }
    } catch (error) {
        console.error('Review Permit Renewal Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process permit review: ' + error.message, error: error.message });
    }
};

/**
 * PUT /api/admin/permits/:id/expiry
 * Update or set the permit expiration and issued date for a provider
 */
const updatePermitExpiry = async (req, res) => {
    try {
        const pool = await connectDB();
        const providerId = parseInt(req.params.id || req.params.providerId, 10);
        const expiryDate = req.body.expiryDate || req.body.permitExpiryDate;
        const issuedDate = req.body.issuedDate || req.body.permitIssuedDate;

        if (!expiryDate) {
            return res.status(400).json({ success: false, message: 'Permit expiration date is required.' });
        }

        const parsedExp = new Date(expiryDate);
        let parsedIssued = issuedDate ? new Date(issuedDate) : null;

        await pool.request()
            .input('ProviderID', sql.Int, providerId)
            .input('Exp', sql.Date, parsedExp)
            .input('Issued', sql.Date, parsedIssued)
            .query(`
                UPDATE dbo.ServiceProviders
                SET PermitExpiryDate = @Exp,
                    PermitIssuedDate = COALESCE(@Issued, PermitIssuedDate)
                WHERE ProviderID = @ProviderID;

                -- Also sync linked application
                UPDATE pa
                SET pa.PermitExpiryDate = @Exp,
                    pa.PermitIssuedDate = COALESCE(@Issued, pa.PermitIssuedDate)
                FROM dbo.ProviderApplications pa
                JOIN dbo.ServiceProviders sp ON (sp.ApplicationID = pa.ApplicationID OR sp.UserID = pa.UserID)
                WHERE sp.ProviderID = @ProviderID;
            `);

        await logActivity(
            pool,
            req.user?.userId || null,
            'Permit Expiration Updated',
            `Set permit expiration to ${parsedExp.toLocaleDateString()} for Provider #${providerId}`,
            'ServiceProvider',
            providerId
        );

        return res.status(200).json({
            success: true,
            message: 'Permit expiration date successfully updated.'
        });
    } catch (err) {
        console.error('Update Permit Expiry Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getAdminStats,
    searchAdminEntities,
    suspendProvider,
    reactivateProvider,
    getAdminProfile,
    updateAdminProfile,
    getEscrowList,
    releaseEscrowPayout,
    getAdminWithdrawals,
    approveWithdrawalRequest,
    getPaymentsOverview,
    getAdminAuditLogs,
    getAdminClientReports,
    updateReportStatus,
    warnReportProvider,
    refundReportBooking,
    resolveReport,
    getAdminNotifications,
    markAdminNotificationRead,
    markAllAdminNotificationsRead,
    getAdminBookingDetails,
    getAdminPermits,
    sendPermitNotice,
    reviewPermitRenewal,
    updatePermitExpiry,
    logActivity
};
