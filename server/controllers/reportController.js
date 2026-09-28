/**
 * SoundSphere - Report Controller
 * Handles client reports against service providers and reporting history
 */

const { connectDB, sql } = require('../config/db');

/**
 * Helper: Log Activity into dbo.ActivityLogs
 */
const logActivity = async (pool, userId, action, description, entityType = null, entityId = null) => {
    try {
        await pool.request()
            .input('UserID', sql.Int, userId || null)
            .input('Action', sql.NVarChar(100), action)
            .input('Description', sql.NVarChar(sql.MAX), description)
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
        console.warn('Report activity logging notice:', e.message);
    }
};

/**
 * POST /api/reports/provider
 * Client submits a report/complaint against a service provider
 */
const createProviderReport = async (req, res) => {
    try {
        const reporterUserId = req.user?.userId || req.user?.id || req.user?.UserID || req.body.userId;
        const { providerId, bookingId, reason, description, proofImage } = req.body;

        if (!reporterUserId) {
            return res.status(401).json({
                success: false,
                message: 'You must be logged in to submit a report against a service provider.'
            });
        }

        if (!providerId) {
            return res.status(400).json({
                success: false,
                message: 'Service Provider ID is required.'
            });
        }

        if (!reason || !reason.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please select a reason for reporting this service provider.'
            });
        }

        if (!description || !description.trim() || description.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a detailed description of the incident (at least 10 characters).'
            });
        }

        const pool = await connectDB();

        // 1. Verify reporter user exists
        const reporterRes = await pool.request()
            .input('ReporterID', sql.Int, parseInt(reporterUserId, 10))
            .query("SELECT UserID, Email FROM dbo.Users WHERE UserID = @ReporterID");

        if (!reporterRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Reporter user account not found.' });
        }
        const reporterEmail = reporterRes.recordset[0].Email;

        // 2. Find target Service Provider (by ProviderID or UserID)
        const provRes = await pool.request()
            .input('PID', sql.Int, parseInt(providerId, 10))
            .query(`
                SELECT sp.ProviderID, sp.UserID, sp.BusinessName, sp.OwnerName
                FROM dbo.ServiceProviders sp
                WHERE sp.ProviderID = @PID OR sp.UserID = @PID;
            `);

        let targetProviderId = parseInt(providerId, 10);
        let targetProviderUserId = null;
        let targetBusinessName = 'Service Provider';

        if (provRes.recordset.length > 0) {
            const prov = provRes.recordset[0];
            targetProviderId = prov.ProviderID;
            targetProviderUserId = prov.UserID;
            targetBusinessName = prov.BusinessName || prov.OwnerName || 'Service Provider';

            // 3. Prevent Self-Reporting
            if (parseInt(reporterUserId, 10) === parseInt(targetProviderUserId, 10)) {
                return res.status(400).json({
                    success: false,
                    message: 'You cannot report your own service provider account.'
                });
            }
        }

        // 4. Insert into dbo.ProviderReports
        const insertRes = await pool.request()
            .input('ReporterUserID', sql.Int, parseInt(reporterUserId, 10))
            .input('ProviderID', sql.Int, targetProviderId)
            .input('BookingID', sql.Int, bookingId ? parseInt(bookingId, 10) : null)
            .input('Reason', sql.NVarChar(150), reason.trim())
            .input('Description', sql.NVarChar(sql.MAX), description.trim())
            .input('ProofImage', sql.NVarChar(sql.MAX), proofImage ? proofImage.trim() : null)
            .query(`
                INSERT INTO dbo.ProviderReports (ReporterUserID, ProviderID, BookingID, Reason, Description, ProofImage, Status, CreatedAt)
                OUTPUT INSERTED.ReportID, INSERTED.CreatedAt
                VALUES (@ReporterUserID, @ProviderID, @BookingID, @Reason, @Description, @ProofImage, 'Pending', GETDATE());
            `);

        const newReport = insertRes.recordset[0];
        const reportId = newReport.ReportID;

        // 5. Create Audit Trail Log
        await logActivity(
            pool,
            parseInt(reporterUserId, 10),
            'Client Report Filed',
            `Client (${reporterEmail}) filed Report #${reportId} against "${targetBusinessName}" for: ${reason.trim()}.`,
            'ProviderReport',
            reportId
        );

        // 6. Notify Administrators about the newly filed report
        try {
            const adminUsersRes = await pool.request().query(`
                SELECT u.UserID 
                FROM dbo.Users u 
                JOIN dbo.Roles r ON u.RoleID = r.RoleID 
                WHERE r.RoleName = 'Administrator';
            `);

            for (const admin of adminUsersRes.recordset) {
                await pool.request()
                    .input('AdminUID', sql.Int, admin.UserID)
                    .input('Title', sql.NVarChar(255), `⚠️ New Client Report: ${targetBusinessName}`)
                    .input('Message', sql.NVarChar(sql.MAX), `Client filed Report #${reportId} regarding "${reason.trim()}". Action may be required.`)
                    .input('ReportID', sql.Int, reportId)
                    .query(`
                        IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                        BEGIN
                            INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                            VALUES (@AdminUID, @Title, @Message, 'Report', @ReportID, 'ProviderReport');
                        END
                    `);
            }
        } catch (ne) {
            console.warn('Report notification to admin notice:', ne.message);
        }

        return res.status(201).json({
            success: true,
            message: 'Your report has been submitted to SoundSphere Administration for review. Thank you for helping keep our platform safe and reliable.',
            reportId,
            createdAt: newReport.CreatedAt
        });

    } catch (error) {
        console.error('Create Provider Report Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to submit report. Please try again later.',
            error: error.message
        });
    }
};

/**
 * GET /api/reports/my-reports
 * Returns reports submitted by the logged-in user
 */
const getMyReports = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized session.' });
        }

        const pool = await connectDB();
        const result = await pool.request()
            .input('UserID', sql.Int, parseInt(userId, 10))
            .query(`
                SELECT 
                    r.ReportID,
                    r.ProviderID,
                    sp.BusinessName AS ProviderBusinessName,
                    sp.OwnerName AS ProviderOwnerName,
                    r.BookingID,
                    r.Reason,
                    r.Description,
                    r.Status,
                    r.AdminNotes,
                    r.CreatedAt,
                    r.ResolvedAt
                FROM dbo.ProviderReports r
                LEFT JOIN dbo.ServiceProviders sp ON r.ProviderID = sp.ProviderID
                WHERE r.ReporterUserID = @UserID
                ORDER BY r.CreatedAt DESC;
            `);

        return res.status(200).json({
            success: true,
            reports: result.recordset || []
        });
    } catch (error) {
        console.error('Get My Reports Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch reports.' });
    }
};

module.exports = {
    createProviderReport,
    getMyReports,
    logActivity
};
