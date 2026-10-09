/**
 * SoundSphere - Service Provider Application Data Access Model
 * Manages SQL Server operations for provider applications and approval promotion
 */

const { getPool, sql } = require('../config/db');

/**
 * Find existing active application (Pending or Approved) submitted by a specific UserID
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
const findActiveApplicationByUserId = async (userId) => {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT TOP 1 
                ApplicationID,
                UserID,
                BusinessName,
                OwnerName,
                BusinessAddress,
                CoverageArea,
                ContactNumber,
                GovtID_Url,
                GovtID_Back_Url,
                BusinessPermit_Url,
                PermitIssuedDate,
                PermitExpiryDate,
                OtherDocs_Url,
                Status,
                RejectionReason,
                SubmittedAt,
                ReviewedAt
            FROM dbo.ProviderApplications
            WHERE UserID = @UserID AND Status IN ('Pending', 'Approved')
            ORDER BY ApplicationID DESC;
        `);

    return result.recordset[0] || null;
};

/**
 * Find latest application submitted by UserID (for status query)
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
const findApplicationByUserId = async (userId) => {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT TOP 1 
                ApplicationID,
                UserID,
                BusinessName,
                OwnerName,
                BusinessAddress,
                CoverageArea,
                ContactNumber,
                GovtID_Url,
                GovtID_Back_Url,
                BusinessPermit_Url,
                PermitIssuedDate,
                PermitExpiryDate,
                OtherDocs_Url,
                Status,
                RejectionReason,
                SubmittedAt,
                ReviewedAt
            FROM dbo.ProviderApplications
            WHERE UserID = @UserID
            ORDER BY ApplicationID DESC;
        `);

    return result.recordset[0] || null;
};

/**
 * Submit a new Service Provider Application for a Client
 * @param {object} params
 * @returns {Promise<object>} Created application record
 */
const createApplication = async ({ userId, businessName, ownerName, businessAddress, coverageArea, contactNumber, govtIdUrl, govtIdBackUrl, businessPermitUrl, permitIssuedDate, permitExpiryDate, otherDocsUrl }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('BusinessName', sql.NVarChar(150), businessName.trim())
        .input('OwnerName', sql.NVarChar(150), ownerName.trim())
        .input('BusinessAddress', sql.NVarChar(255), businessAddress.trim())
        .input('CoverageArea', sql.NVarChar(255), coverageArea.trim())
        .input('ContactNumber', sql.NVarChar(20), contactNumber.trim())
        .input('GovtID_Url', sql.NVarChar(sql.MAX), govtIdUrl || 'uploaded_govt_id_front.png')
        .input('GovtID_Back_Url', sql.NVarChar(sql.MAX), govtIdBackUrl || 'uploaded_govt_id_back.png')
        .input('BusinessPermit_Url', sql.NVarChar(sql.MAX), businessPermitUrl || 'uploaded_permit.png')
        .input('PermitIssuedDate', sql.Date, permitIssuedDate ? new Date(permitIssuedDate) : null)
        .input('PermitExpiryDate', sql.Date, permitExpiryDate ? new Date(permitExpiryDate) : null)
        .input('OtherDocs_Url', sql.NVarChar(500), otherDocsUrl || null)
        .query(`
            INSERT INTO dbo.ProviderApplications
            (UserID, BusinessName, OwnerName, BusinessAddress, CoverageArea, ContactNumber, GovtID_Url, GovtID_Back_Url, BusinessPermit_Url, PermitIssuedDate, PermitExpiryDate, OtherDocs_Url, Status)
            OUTPUT INSERTED.ApplicationID, INSERTED.UserID, INSERTED.BusinessName, INSERTED.Status, INSERTED.SubmittedAt
            VALUES
            (@UserID, @BusinessName, @OwnerName, @BusinessAddress, @CoverageArea, @ContactNumber, @GovtID_Url, @GovtID_Back_Url, @BusinessPermit_Url, @PermitIssuedDate, @PermitExpiryDate, @OtherDocs_Url, 'Pending');
        `);

    return result.recordset[0];
};

/**
 * Get all pending applications for Administrator review
 * @returns {Promise<Array>}
 */
const getPendingApplications = async () => {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.request().query(`
        SELECT 
            pa.ApplicationID,
            pa.UserID,
            u.Email AS ApplicantEmail,
            ISNULL(NULLIF(c.FirstName + ' ' + c.LastName, ' '), pa.OwnerName) AS ApplicantName,
            pa.BusinessName,
            pa.OwnerName,
            pa.BusinessAddress,
            pa.CoverageArea,
            pa.ContactNumber,
            pa.GovtID_Url,
            pa.GovtID_Back_Url,
            pa.BusinessPermit_Url,
            pa.PermitIssuedDate,
            pa.PermitExpiryDate,
            pa.Status,
            pa.SubmittedAt
        FROM dbo.ProviderApplications pa
        INNER JOIN dbo.Users u ON pa.UserID = u.UserID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        WHERE pa.Status = 'Pending'
        ORDER BY pa.SubmittedAt ASC;
    `);

    return result.recordset;
};

/**
 * Approve Service Provider Application & Promote User Role in DB
 * Promotes User RoleID from Client to ServiceProvider in-place (no duplicate user account created)
 * @param {number} applicationId 
 * @returns {Promise<object>}
 */
const approveApplication = async (applicationId) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Fetch application details
        const appReq = new sql.Request(transaction);
        const appRes = await appReq
            .input('ApplicationID', sql.Int, applicationId)
            .query("SELECT ApplicationID, UserID, BusinessName, OwnerName, BusinessAddress, CoverageArea, Status FROM dbo.ProviderApplications WHERE ApplicationID = @ApplicationID");

        if (!appRes.recordset.length) {
            throw new Error('Application record not found.');
        }

        const app = appRes.recordset[0];

        if (app.Status === 'Approved') {
            await transaction.rollback();
            return {
                success: true,
                message: `Application #${applicationId} is already approved.`,
                application: app
            };
        }

        // 2. Fetch ServiceProvider Role ID
        const roleReq = new sql.Request(transaction);
        const roleRes = await roleReq.query("SELECT RoleID FROM dbo.Roles WHERE RoleName = 'ServiceProvider'");
        const providerRoleId = roleRes.recordset[0]?.RoleID || 3;

        // 3. Update Application Status to 'Approved' for all applications submitted by this user
        const updateAppReq = new sql.Request(transaction);
        await updateAppReq
            .input('ApplicationID', sql.Int, applicationId)
            .input('UserID', sql.Int, app.UserID)
            .query("UPDATE dbo.ProviderApplications SET Status = 'Approved', ReviewedAt = GETDATE() WHERE ApplicationID = @ApplicationID OR UserID = @UserID");

        // 4. Promote User RoleID in dbo.Users in-place
        const promoteUserReq = new sql.Request(transaction);
        await promoteUserReq
            .input('UserID', sql.Int, app.UserID)
            .input('RoleID', sql.Int, providerRoleId)
            .query("UPDATE dbo.Users SET RoleID = @RoleID, UpdatedAt = GETDATE() WHERE UserID = @UserID");

        // 5. Create record in dbo.ServiceProviders
        const ownerParts = (app.OwnerName || 'Service Provider').trim().split(' ');
        const ownerFirstName = ownerParts[0] || 'Service';
        const ownerLastName = ownerParts.slice(1).join(' ') || 'Provider';

        const createProvReq = new sql.Request(transaction);
        await createProvReq
            .input('UserID', sql.Int, app.UserID)
            .input('ApplicationID', sql.Int, app.ApplicationID)
            .input('BusinessName', sql.NVarChar(150), app.BusinessName)
            .input('OwnerName', sql.NVarChar(150), app.OwnerName)
            .input('OwnerFirstName', sql.NVarChar(100), ownerFirstName)
            .input('OwnerLastName', sql.NVarChar(100), ownerLastName)
            .input('BusinessAddress', sql.NVarChar(255), app.BusinessAddress)
            .input('CoverageArea', sql.NVarChar(255), app.CoverageArea)
            .query(`
                IF NOT EXISTS (SELECT * FROM dbo.ServiceProviders WHERE UserID = @UserID)
                BEGIN
                    INSERT INTO dbo.ServiceProviders (UserID, ApplicationID, BusinessName, OwnerName, OwnerFirstName, OwnerLastName, BusinessAddress, CoverageArea, VerificationStatus)
                    VALUES (@UserID, @ApplicationID, @BusinessName, @OwnerName, @OwnerFirstName, @OwnerLastName, @BusinessAddress, @CoverageArea, 'Approved');
                END
                ELSE
                BEGIN
                    UPDATE dbo.ServiceProviders
                    SET BusinessName = @BusinessName, OwnerName = @OwnerName, OwnerFirstName = @OwnerFirstName, OwnerLastName = @OwnerLastName, BusinessAddress = @BusinessAddress, CoverageArea = @CoverageArea, VerificationStatus = 'Approved'
                    WHERE UserID = @UserID;
                END
            `);

        await transaction.commit();

        return {
            success: true,
            application: app,
            message: `Application #${applicationId} approved. User #${app.UserID} promoted to Service Provider.`
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Reject Service Provider Application
 * @param {number} applicationId 
 * @param {string} reason 
 * @returns {Promise<object>}
 */
const rejectApplication = async (applicationId, reason) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const appRes = await pool.request()
        .input('ApplicationID', sql.Int, applicationId)
        .query("SELECT ApplicationID, UserID, BusinessName, OwnerName FROM dbo.ProviderApplications WHERE ApplicationID = @ApplicationID");

    const app = appRes.recordset[0] || null;

    await pool.request()
        .input('ApplicationID', sql.Int, applicationId)
        .input('Reason', sql.NVarChar(500), reason || 'Application documents did not meet requirements.')
        .query(`
            UPDATE dbo.ProviderApplications
            SET Status = 'Rejected', RejectionReason = @Reason, ReviewedAt = GETDATE()
            WHERE ApplicationID = @ApplicationID 
               OR UserID = (SELECT UserID FROM dbo.ProviderApplications WHERE ApplicationID = @ApplicationID);
        `);

    return {
        success: true,
        application: app,
        message: `Application #${applicationId} has been rejected.`
    };
};

module.exports = {
    findActiveApplicationByUserId,
    findApplicationByUserId,
    createApplication,
    getPendingApplications,
    approveApplication,
    rejectApplication
};
