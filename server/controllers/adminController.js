const { connectDB, sql } = require('../config/db');

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
                sp.CreatedAt AS ApprovedAt
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
        const limit = parseInt(req.query.limit, 10) || 200;

        let queryStr = `
            SELECT TOP (${limit})
                al.LogID,
                al.UserID,
                al.Action,
                al.Description,
                al.EntityType,
                al.EntityID,
                al.CreatedAt,
                COALESCE(adm.FullName, c.FirstName + ' ' + c.LastName, sp.BusinessName, u.Email, 'System Superadmin') AS ActorName,
                u.Email AS ActorEmail,
                COALESCE(r.RoleName, 'System') AS ActorRole
            FROM dbo.ActivityLogs al
            LEFT JOIN dbo.Users u ON al.UserID = u.UserID
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.Admins adm ON u.UserID = adm.UserID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            WHERE 1=1
        `;

        const request = pool.request();

        if (actionFilter && actionFilter !== 'all') {
            request.input('ActionFilter', sql.NVarChar(100), `%${actionFilter}%`);
            queryStr += ` AND al.Action LIKE @ActionFilter`;
        }

        if (search) {
            request.input('SearchTerm', sql.NVarChar(255), `%${search}%`);
            queryStr += ` AND (al.Action LIKE @SearchTerm OR al.Description LIKE @SearchTerm OR u.Email LIKE @SearchTerm OR adm.FullName LIKE @SearchTerm OR al.EntityType LIKE @SearchTerm)`;
        }

        queryStr += ` ORDER BY al.CreatedAt DESC;`;

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
                r.Reason,
                r.Description,
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
    logActivity
};
