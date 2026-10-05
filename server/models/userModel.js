/**
 * SoundSphere - User Data Access Model
 * Database operations for User accounts, Client profiles, and credentials
 */

const { getPool, getOrConnectPool, sql } = require('../config/db');

/**
 * Ensure dbo.Clients and dbo.Users schema columns exist
 */
const ensureSchemaUpToDate = async (pool) => {
    try {
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Clients]') AND name = 'MiddleName')
            BEGIN
                ALTER TABLE dbo.Clients ADD MiddleName NVARCHAR(100) NULL;
            END;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'ProfilePicture')
            BEGIN
                ALTER TABLE dbo.Users ADD ProfilePicture NVARCHAR(500) NULL;
            END;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'GoogleID')
            BEGIN
                ALTER TABLE dbo.Users ADD GoogleID NVARCHAR(255) NULL;
            END;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'FacebookID')
            BEGIN
                ALTER TABLE dbo.Users ADD FacebookID NVARCHAR(255) NULL;
            END;
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND name = 'AuthProvider')
            BEGIN
                ALTER TABLE dbo.Users ADD AuthProvider NVARCHAR(50) NULL;
            END;
        `);
    } catch (err) {
        console.warn('Schema check warning:', err.message);
    }
};

/**
 * Find User by Email Address
 * @param {string} email
 * @returns {Promise<object|null>}
 */
const findUserByEmail = async (email) => {
    try {
        let pool = getPool();
        if (!pool) {
            pool = await getOrConnectPool();
        }
        if (!pool) return null;

        await ensureSchemaUpToDate(pool);

        let query = `
            SELECT 
                u.UserID,
                u.RoleID,
                r.RoleName,
                u.Email,
                u.PasswordHash,
                u.Phone,
                u.ProfilePicture,
                u.EmailVerified,
                u.IsActive,
                u.AccountStatus,
                u.CreatedAt,
                c.FirstName AS ClientFirstName,
                c.MiddleName AS ClientMiddleName,
                c.LastName AS ClientLastName,
                c.Address AS ClientAddress,
                sp.BusinessName,
                a.FullName AS AdminFullName
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
            WHERE u.Email = @Email
        `;

        const result = await pool.request()
            .input('Email', sql.NVarChar(255), (email || '').trim().toLowerCase())
            .query(query);

        return result.recordset[0] || null;
    } catch (err) {
        console.warn('findUserByEmail database notice:', err.message);
        return null;
    }
};

/**
 * Get User Profile Details by User ID
 * @param {number} userId 
 */
const getUserProfileByUserId = async (userId) => {
    const pool = getPool();
    if (!pool) return null;

    await ensureSchemaUpToDate(pool);

    const query = `
        SELECT 
            u.UserID,
            u.RoleID,
            r.RoleName,
            u.Email,
            u.Phone,
            u.ProfilePicture,
            u.EmailVerified,
            u.IsActive,
            u.AccountStatus,
            c.FirstName AS ClientFirstName,
            c.MiddleName AS ClientMiddleName,
            c.LastName AS ClientLastName,
            c.Address AS ClientAddress,
            sp.BusinessName,
            sp.BusinessAddress,
            sp.CoverageArea,
            sp.OwnerName,
            a.FullName AS AdminFullName
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
        WHERE u.UserID = @UserID
    `;

    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(query);

    return result.recordset[0] || null;
};

/**
 * Update User Profile, Email Address & Avatar Picture
 */
const updateUserProfile = async (userId, { email, firstName, middleName, lastName, phone, address, profilePicture, businessName, businessAddress, coverageArea } = {}) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not initialized.');

    await ensureSchemaUpToDate(pool);

    // 1. Check if email is being updated and validate duplicate email address in dbo.Users
    if (email && email.trim()) {
        const cleanEmail = email.trim().toLowerCase();
        
        const dupCheck = await pool.request()
            .input('Email', sql.NVarChar(255), cleanEmail)
            .input('UserID', sql.Int, userId)
            .query("SELECT UserID FROM dbo.Users WHERE Email = @Email AND UserID != @UserID");

        if (dupCheck.recordset.length > 0) {
            throw new Error('Email already in use. Please use another email address.');
        }

        // Check existing user email
        const currUserRes = await pool.request()
            .input('UserID', sql.Int, userId)
            .query("SELECT Email FROM dbo.Users WHERE UserID = @UserID");

        const currentEmail = currUserRes.recordset[0]?.Email;

        if (currentEmail && currentEmail.toLowerCase() !== cleanEmail) {
            await pool.request()
                .input('Email', sql.NVarChar(255), cleanEmail)
                .input('UserID', sql.Int, userId)
                .query("UPDATE dbo.Users SET Email = @Email, EmailVerified = 1 WHERE UserID = @UserID");
        }
    }

    // 2. Update Phone & ProfilePicture in dbo.Users
    let reqUser = pool.request()
        .input('UserID', sql.Int, userId);

    let userUpdateFields = [];
    if (phone !== undefined && phone !== null && phone.trim() !== '') {
        reqUser.input('Phone', sql.NVarChar(20), phone.trim());
        userUpdateFields.push("Phone = @Phone");
    }
    if (profilePicture !== undefined && profilePicture !== null) {
        reqUser.input('ProfilePicture', sql.NVarChar(500), profilePicture);
        userUpdateFields.push("ProfilePicture = @ProfilePicture");
    }

    if (userUpdateFields.length > 0) {
        await reqUser.query(`UPDATE dbo.Users SET ${userUpdateFields.join(', ')} WHERE UserID = @UserID`);
    }

    // 3. Update or Insert dbo.Clients
    const cleanFirstName = firstName ? firstName.trim() : null;
    const cleanMiddleName = middleName ? middleName.trim() : null;
    const cleanLastName = lastName ? lastName.trim() : null;
    const cleanAddress = address ? address.trim() : null;
    const cleanFullName = `${cleanFirstName || ''}${cleanMiddleName ? ' ' + cleanMiddleName : ''}${cleanLastName ? ' ' + cleanLastName : ''}`.trim();

    await pool.request()
        .input('UserID', sql.Int, userId)
        .input('FirstName', sql.NVarChar(100), cleanFirstName)
        .input('MiddleName', sql.NVarChar(100), cleanMiddleName)
        .input('LastName', sql.NVarChar(100), cleanLastName)
        .input('FullName', sql.NVarChar(200), cleanFullName || null)
        .input('Address', sql.NVarChar(255), cleanAddress)
        .query(`
            IF EXISTS (SELECT 1 FROM dbo.Clients WHERE UserID = @UserID)
            BEGIN
                UPDATE dbo.Clients 
                SET FirstName = COALESCE(NULLIF(@FirstName, ''), FirstName),
                    MiddleName = COALESCE(NULLIF(@MiddleName, ''), MiddleName),
                    LastName = COALESCE(NULLIF(@LastName, ''), LastName),
                    FullName = COALESCE(NULLIF(@FullName, ''), FullName),
                    Address = COALESCE(NULLIF(@Address, ''), Address)
                WHERE UserID = @UserID
            END
            ELSE
            BEGIN
                INSERT INTO dbo.Clients (UserID, FirstName, MiddleName, LastName, FullName, Address)
                VALUES (@UserID, @FirstName, @MiddleName, @LastName, @FullName, @Address)
            END
        `);

    // 4. Update dbo.ServiceProviders if business profile parameters exist
    if (businessName || businessAddress || coverageArea) {
        const ownerFullName = cleanFullName || `${firstName || ''} ${lastName || ''}`.trim();
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('BusinessName', sql.NVarChar(150), businessName ? businessName.trim() : '')
            .input('BusinessAddress', sql.NVarChar(255), businessAddress ? businessAddress.trim() : '')
            .input('CoverageArea', sql.NVarChar(255), coverageArea ? coverageArea.trim() : '')
            .input('OwnerName', sql.NVarChar(150), ownerFullName)
            .query(`
                IF EXISTS (SELECT 1 FROM dbo.ServiceProviders WHERE UserID = @UserID)
                BEGIN
                    UPDATE dbo.ServiceProviders 
                    SET BusinessName = COALESCE(NULLIF(@BusinessName, ''), BusinessName),
                        BusinessAddress = COALESCE(NULLIF(@BusinessAddress, ''), BusinessAddress),
                        CoverageArea = COALESCE(NULLIF(@CoverageArea, ''), CoverageArea),
                        OwnerName = COALESCE(NULLIF(@OwnerName, ''), OwnerName)
                    WHERE UserID = @UserID
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.ServiceProviders (UserID, BusinessName, BusinessAddress, CoverageArea, OwnerName)
                    VALUES (@UserID, @BusinessName, @BusinessAddress, @CoverageArea, @OwnerName)
                END

                IF EXISTS (SELECT 1 FROM dbo.ProviderApplications WHERE UserID = @UserID)
                BEGIN
                    UPDATE dbo.ProviderApplications
                    SET BusinessName = COALESCE(NULLIF(@BusinessName, ''), BusinessName),
                        BusinessAddress = COALESCE(NULLIF(@BusinessAddress, ''), BusinessAddress),
                        CoverageArea = COALESCE(NULLIF(@CoverageArea, ''), CoverageArea),
                        OwnerName = COALESCE(NULLIF(@OwnerName, ''), OwnerName)
                    WHERE UserID = @UserID
                END
            `);
    }

    return await getUserProfileByUserId(userId);
};

/**
 * Create a new Client user account
 */
const createClientUser = async ({ email, passwordHash, phone, firstName, middleName, lastName, address }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not initialized.');

    await ensureSchemaUpToDate(pool);

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const roleReq = new sql.Request(transaction);
        const roleResult = await roleReq.query("SELECT RoleID FROM dbo.Roles WHERE RoleName = 'Client'");

        if (!roleResult.recordset.length) {
            throw new Error("System Role 'Client' not found in database.");
        }

        const clientRoleId = roleResult.recordset[0].RoleID;

        const userReq = new sql.Request(transaction);
        const userResult = await userReq
            .input('RoleID', sql.Int, clientRoleId)
            .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
            .input('PasswordHash', sql.NVarChar(255), passwordHash)
            .input('Phone', sql.NVarChar(20), phone.trim())
            .input('EmailVerified', sql.Bit, 1)
            .input('IsActive', sql.Bit, 1)
            .input('AccountStatus', sql.NVarChar(20), 'Active')
            .query(`
                INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, EmailVerified, IsActive, AccountStatus)
                OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.RoleID, INSERTED.CreatedAt
                VALUES (@RoleID, @Email, @PasswordHash, @Phone, @EmailVerified, @IsActive, @AccountStatus);
            `);

        const newUserId = userResult.recordset[0].UserID;

        const clientReq = new sql.Request(transaction);
        await clientReq
            .input('UserID', sql.Int, newUserId)
            .input('FirstName', sql.NVarChar(100), firstName.trim())
            .input('MiddleName', sql.NVarChar(100), middleName ? middleName.trim() : null)
            .input('LastName', sql.NVarChar(100), lastName.trim())
            .input('Address', sql.NVarChar(255), address ? address.trim() : null)
            .query(`
                INSERT INTO dbo.Clients (UserID, FirstName, MiddleName, LastName, Address)
                VALUES (@UserID, @FirstName, @MiddleName, @LastName, @Address);
            `);

        await transaction.commit();

        return {
            userId: newUserId,
            email: email.trim().toLowerCase(),
            role: 'Client',
            name: `${firstName} ${lastName}`.trim()
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Store Password Reset Token and Expiry for User
 */
const setResetToken = async (email, token, expiry) => {
    const pool = getPool();
    await pool.request()
        .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
        .input('ResetToken', sql.NVarChar(255), token)
        .input('ResetTokenExpiry', sql.DateTime2, expiry)
        .query(`
            UPDATE dbo.Users 
            SET ResetToken = @ResetToken, ResetTokenExpiry = @ResetTokenExpiry 
            WHERE LOWER(Email) = LOWER(@Email)
        `);
};

/**
 * Find User by Reset Token (if token matches and not expired)
 */
const findUserByResetToken = async (token) => {
    const pool = getPool();
    const result = await pool.request()
        .input('ResetToken', sql.NVarChar(255), token)
        .query(`
            SELECT UserID, Email, ResetTokenExpiry 
            FROM dbo.Users 
            WHERE ResetToken = @ResetToken AND ResetTokenExpiry > GETDATE()
        `);
    return result.recordset[0] || null;
};

/**
 * Update Password and Clear Reset Token
 */
const updatePasswordAndClearResetToken = async (userId, newPasswordHash) => {
    const pool = getPool();
    await pool.request()
        .input('UserID', sql.Int, userId)
        .input('PasswordHash', sql.NVarChar(255), newPasswordHash)
        .query(`
            UPDATE dbo.Users 
            SET PasswordHash = @PasswordHash, ResetToken = NULL, ResetTokenExpiry = NULL 
            WHERE UserID = @UserID
        `);
};

/**
 * Store Cryptographically Hashed Password Reset Token for User (5 Minutes Expiration)
 */
const createPasswordResetToken = async (userId, tokenHash, expiresAt) => {
    const pool = getPool();
    // Invalidate existing active tokens for this user
    await pool.request()
        .input('UserId', sql.Int, userId)
        .query("UPDATE dbo.PasswordResetTokens SET UsedAt = SYSUTCDATETIME() WHERE UserId = @UserId AND UsedAt IS NULL");

    // Insert new hashed token with exact 5-minute UTC expiration in SQL Server
    await pool.request()
        .input('UserId', sql.Int, userId)
        .input('TokenHash', sql.NVarChar(255), tokenHash)
        .query(`
            INSERT INTO dbo.PasswordResetTokens (UserId, TokenHash, ExpiresAt, CreatedAt)
            VALUES (@UserId, @TokenHash, DATEADD(minute, 5, SYSUTCDATETIME()), SYSUTCDATETIME())
        `);
};

const findPasswordResetToken = async (tokenHash) => {
    const pool = getPool();
    const result = await pool.request()
        .input('TokenHash', sql.NVarChar(255), tokenHash)
        .query(`
            SELECT 
                t.Id, 
                t.UserId, 
                t.ExpiresAt, 
                t.UsedAt, 
                u.Email,
                CASE WHEN t.ExpiresAt > SYSUTCDATETIME() THEN 0 ELSE 1 END AS IsExpired
            FROM dbo.PasswordResetTokens t
            INNER JOIN dbo.Users u ON t.UserId = u.UserID
            WHERE t.TokenHash = @TokenHash
        `);

    const record = result.recordset[0];
    if (!record) {
        console.warn(`[Token Check] Token hash NOT found in database.`);
        return null;
    }

    if (record.UsedAt !== null) {
        console.warn(`[Token Check] Token ID ${record.Id} was already used or invalidated.`);
        return null;
    }

    if (record.IsExpired === 1) {
        console.warn(`[Token Check] Token ID ${record.Id} expired.`);
        return null; // Expired
    }

    return record;
};

/**
 * Consume Password Reset Token and Update User Password
 */
const consumePasswordResetToken = async (tokenId, userId, newPasswordHash) => {
    const pool = getPool();
    // Update PasswordHash in dbo.Users
    await pool.request()
        .input('UserID', sql.Int, userId)
        .input('PasswordHash', sql.NVarChar(255), newPasswordHash)
        .query(`
            UPDATE dbo.Users 
            SET PasswordHash = @PasswordHash 
            WHERE UserID = @UserID
        `);

    // Invalidate all tokens for this user
    await pool.request()
        .input('UserId', sql.Int, userId)
        .query("UPDATE dbo.PasswordResetTokens SET UsedAt = GETDATE() WHERE UserId = @UserId");
};

/**
 * Link Google or Facebook Provider ID to an existing User
 */
const linkSocialProvider = async (userId, provider, providerId) => {
    const pool = getPool();
    const column = provider === 'Google' ? 'GoogleID' : 'FacebookID';
    await pool.request()
        .input('UserID', sql.Int, userId)
        .input('ProviderID', sql.NVarChar(255), providerId)
        .input('AuthProvider', sql.NVarChar(50), provider)
        .query(`
            UPDATE dbo.Users 
            SET ${column} = @ProviderID, AuthProvider = @AuthProvider 
            WHERE UserID = @UserID
        `);
};

/**
 * Update User Password Hash directly
 */
const updateUserPassword = async (userId, newPasswordHash) => {
    const pool = getPool();
    await pool.request()
        .input('UserID', sql.Int, userId)
        .input('PasswordHash', sql.NVarChar(255), newPasswordHash)
        .query(`
            UPDATE dbo.Users 
            SET PasswordHash = @PasswordHash 
            WHERE UserID = @UserID
        `);
};

/**
 * Find User by Google Subject ID (OIDC Sub)
 */
const findUserByGoogleId = async (googleId) => {
    const pool = getPool();
    if (!pool || !googleId) return null;
    await ensureSchemaUpToDate(pool);

    const query = `
        SELECT 
            u.UserID,
            u.RoleID,
            r.RoleName,
            u.Email,
            u.PasswordHash,
            u.Phone,
            u.ProfilePicture,
            u.EmailVerified,
            u.IsActive,
            u.AccountStatus,
            u.CreatedAt,
            c.FirstName AS ClientFirstName,
            c.MiddleName AS ClientMiddleName,
            c.LastName AS ClientLastName,
            c.Address AS ClientAddress,
            sp.BusinessName,
            a.FullName AS AdminFullName
        FROM dbo.Users u
        INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.Admins a ON u.UserID = a.UserID
        WHERE u.GoogleID = @GoogleID
    `;

    const result = await pool.request()
        .input('GoogleID', sql.NVarChar(255), googleId)
        .query(query);

    return result.recordset[0] || null;
};

module.exports = {
    findUserByEmail,
    findUserByGoogleId,
    getUserProfileByUserId,
    updateUserProfile,
    createClientUser,
    setResetToken,
    findUserByResetToken,
    updatePasswordAndClearResetToken,
    linkSocialProvider,
    updateUserPassword,
    createPasswordResetToken,
    findPasswordResetToken,
    consumePasswordResetToken
};
