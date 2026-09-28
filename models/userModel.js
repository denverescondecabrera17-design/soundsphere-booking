/**
 * SoundSphere - User & Authentication Model
 * Data Access Layer using Microsoft SQL Server parameterized queries and transactions
 */

const { getPool, sql } = require('../config/db');

/**
 * Find user by email joining role and profile details
 * @param {string} email 
 * @returns {Promise<object|null>}
 */
const findUserByEmail = async (email) => {
    const pool = getPool();
    const result = await pool.request()
        .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
        .query(`
            SELECT 
                u.UserID,
                u.RoleID,
                r.RoleName,
                u.Email,
                u.PasswordHash,
                u.Phone,
                u.IsActive,
                u.CreatedAt,
                c.FirstName AS ClientFirstName,
                c.LastName AS ClientLastName,
                sp.BusinessName,
                a.FullName AS AdminFullName
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
            WHERE u.Email = @Email
        `);

    return result.recordset[0] || null;
};

/**
 * Find user by ID joining role and profile details
 * @param {number} userId 
 * @returns {Promise<object|null>}
 */
const findUserById = async (userId) => {
    const pool = getPool();
    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT 
                u.UserID,
                u.RoleID,
                r.RoleName,
                u.Email,
                u.Phone,
                u.IsActive,
                c.FirstName AS ClientFirstName,
                c.LastName AS ClientLastName,
                sp.BusinessName,
                sp.OwnerName,
                sp.CoverageArea,
                a.FullName AS AdminFullName
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
            WHERE u.UserID = @UserID
        `);

    return result.recordset[0] || null;
};

/**
 * Register a Client account ONLY (Public Users register as Client only)
 * @param {object} clientData 
 * @returns {Promise<object>}
 */
const createClientUser = async ({ email, passwordHash, phone, firstName, lastName, address }) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Get RoleID for 'Client'
        const roleReq = new sql.Request(transaction);
        const roleRes = await roleReq
            .input('RoleName', sql.NVarChar(50), 'Client')
            .query('SELECT RoleID FROM dbo.Roles WHERE RoleName = @RoleName');

        if (roleRes.recordset.length === 0) {
            throw new Error("Role 'Client' does not exist in database.");
        }
        const roleId = roleRes.recordset[0].RoleID;

        // 2. Insert into Users table
        const userReq = new sql.Request(transaction);
        const userRes = await userReq
            .input('RoleID', sql.Int, roleId)
            .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
            .input('PasswordHash', sql.NVarChar(255), passwordHash)
            .input('Phone', sql.NVarChar(20), phone.trim())
            .query(`
                INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone)
                OUTPUT INSERTED.UserID
                VALUES (@RoleID, @Email, @PasswordHash, @Phone);
            `);

        const newUserId = userRes.recordset[0].UserID;

        // 3. Insert into Clients profile table
        const clientReq = new sql.Request(transaction);
        await clientReq
            .input('UserID', sql.Int, newUserId)
            .input('FirstName', sql.NVarChar(100), firstName.trim())
            .input('LastName', sql.NVarChar(100), lastName.trim())
            .input('Address', sql.NVarChar(255), address ? address.trim() : null)
            .query(`
                INSERT INTO dbo.Clients (UserID, FirstName, LastName, Address)
                VALUES (@UserID, @FirstName, @LastName, @Address);
            `);

        await transaction.commit();

        return {
            userId: newUserId,
            email: email.trim().toLowerCase(),
            role: 'Client'
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Submit a Service Provider Application (Client only)
 * @param {object} applicationData 
 * @returns {Promise<object>}
 */
const submitProviderApplication = async ({
    userId, businessName, ownerName, businessAddress, coverageArea, contactNumber, govtIdUrl, businessPermitUrl, otherDocsUrl
}) => {
    const pool = getPool();
    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .input('BusinessName', sql.NVarChar(150), businessName.trim())
        .input('OwnerName', sql.NVarChar(150), ownerName.trim())
        .input('BusinessAddress', sql.NVarChar(255), businessAddress.trim())
        .input('CoverageArea', sql.NVarChar(255), coverageArea.trim())
        .input('ContactNumber', sql.NVarChar(20), contactNumber.trim())
        .input('GovtID_Url', sql.NVarChar(500), govtIdUrl.trim())
        .input('BusinessPermit_Url', sql.NVarChar(500), businessPermitUrl.trim())
        .input('OtherDocs_Url', sql.NVarChar(500), otherDocsUrl ? otherDocsUrl.trim() : null)
        .query(`
            INSERT INTO dbo.ProviderApplications
            (UserID, BusinessName, OwnerName, BusinessAddress, CoverageArea, ContactNumber, GovtID_Url, BusinessPermit_Url, OtherDocs_Url, Status)
            OUTPUT INSERTED.ApplicationID, INSERTED.Status
            VALUES
            (@UserID, @BusinessName, @OwnerName, @BusinessAddress, @CoverageArea, @ContactNumber, @GovtID_Url, @BusinessPermit_Url, @OtherDocs_Url, 'Pending');
        `);

    return result.recordset[0];
};

/**
 * Administrator Approval Transaction: Promote Client to Service Provider
 * Updates role in Users table and inserts record into ServiceProviders table
 * @param {number} applicationId 
 * @returns {Promise<object>}
 */
const approveProviderApplication = async (applicationId) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Fetch Application Details
        const appReq = new sql.Request(transaction);
        const appRes = await appReq
            .input('ApplicationID', sql.Int, applicationId)
            .query(`
                SELECT ApplicationID, UserID, BusinessName, OwnerName, BusinessAddress, CoverageArea, Status
                FROM dbo.ProviderApplications
                WHERE ApplicationID = @ApplicationID
            `);

        if (appRes.recordset.length === 0) {
            throw new Error('Application not found.');
        }

        const app = appRes.recordset[0];
        if (app.Status === 'Approved') {
            throw new Error('Application has already been approved.');
        }

        // 2. Fetch RoleID for 'ServiceProvider'
        const roleReq = new sql.Request(transaction);
        const roleRes = await roleReq
            .input('RoleName', sql.NVarChar(50), 'ServiceProvider')
            .query('SELECT RoleID FROM dbo.Roles WHERE RoleName = @RoleName');

        const spRoleId = roleRes.recordset[0].RoleID;

        // 3. Update Application Status to 'Approved'
        const updateAppReq = new sql.Request(transaction);
        await updateAppReq
            .input('ApplicationID', sql.Int, applicationId)
            .query(`
                UPDATE dbo.ProviderApplications
                SET Status = 'Approved', ReviewedAt = GETDATE()
                WHERE ApplicationID = @ApplicationID
            `);

        // 4. Promote User Role in Users table
        const updateUserReq = new sql.Request(transaction);
        await updateUserReq
            .input('UserID', sql.Int, app.UserID)
            .input('RoleID', sql.Int, spRoleId)
            .query(`
                UPDATE dbo.Users
                SET RoleID = @RoleID, UpdatedAt = GETDATE()
                WHERE UserID = @UserID
            `);

        // 5. Insert into ServiceProviders table using the same UserID
        const spReq = new sql.Request(transaction);
        await spReq
            .input('UserID', sql.Int, app.UserID)
            .input('ApplicationID', sql.Int, app.ApplicationID)
            .input('BusinessName', sql.NVarChar(150), app.BusinessName)
            .input('OwnerName', sql.NVarChar(150), app.OwnerName)
            .input('BusinessAddress', sql.NVarChar(255), app.BusinessAddress)
            .input('CoverageArea', sql.NVarChar(255), app.CoverageArea)
            .query(`
                INSERT INTO dbo.ServiceProviders
                (UserID, ApplicationID, BusinessName, OwnerName, BusinessAddress, CoverageArea)
                VALUES
                (@UserID, @ApplicationID, @BusinessName, @OwnerName, @BusinessAddress, @CoverageArea);
            `);

        await transaction.commit();

        return {
            userId: app.UserID,
            applicationId: app.ApplicationID,
            newRole: 'ServiceProvider',
            status: 'Approved'
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    findUserByEmail,
    findUserById,
    createClientUser,
    submitProviderApplication,
    approveProviderApplication
};
