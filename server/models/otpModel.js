/**
 * SoundSphere - OTP Data Access Model
 * Handles SQL Server operations for OTP hashing, verification, rate limiting, and account activation
 */

const { getPool, sql } = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Invalidate previous active OTPs and create a new hashed OTP record (5 minute expiration)
 * @param {object} params
 * @param {number} params.userId
 * @param {string} params.email
 * @param {string} params.plainOtp
 * @returns {Promise<object>}
 */
const saveOTPRecord = async ({ userId, email, plainOtp }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 1. Invalidate any existing unused OTP records for this email
        const invalidateReq = new sql.Request(transaction);
        await invalidateReq
            .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
            .query(`
                UPDATE dbo.OTPVerifications
                SET IsUsed = 1
                WHERE Email = @Email AND IsUsed = 0;
            `);

        // 2. Hash the 6-digit OTP using bcrypt
        const saltRounds = 10;
        const otpHash = await bcrypt.hash(plainOtp, saltRounds);

        // 3. Expiration = NOW() + 5 minutes
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // 4. Insert new OTP verification record
        const insertReq = new sql.Request(transaction);
        const insertRes = await insertReq
            .input('UserID', sql.Int, userId)
            .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
            .input('OtpHash', sql.NVarChar(255), otpHash)
            .input('ExpiresAt', sql.DateTime2, expiresAt)
            .query(`
                INSERT INTO dbo.OTPVerifications
                (UserID, Email, OtpHash, ExpiresAt, Attempts, IsUsed)
                OUTPUT INSERTED.OtpID, INSERTED.ExpiresAt
                VALUES
                (@UserID, @Email, @OtpHash, @ExpiresAt, 0, 0);
            `);

        await transaction.commit();

        return insertRes.recordset[0];
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Fetch the latest active (unused) OTP record for an email address
 * @param {string} email 
 * @returns {Promise<object|null>}
 */
const getLatestActiveOTPRecord = async (email) => {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.request()
        .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
        .query(`
            SELECT TOP 1 OtpID, UserID, Email, OtpHash, ExpiresAt, Attempts, IsUsed, CreatedAt
            FROM dbo.OTPVerifications
            WHERE Email = @Email AND IsUsed = 0
            ORDER BY OtpID DESC;
        `);

    return result.recordset[0] || null;
};

/**
 * Increment failed attempts counter for an OTP record
 * @param {number} otpId 
 * @returns {Promise<number>} Updated attempt count
 */
const incrementOTPAttempts = async (otpId) => {
    const pool = getPool();
    if (!pool) return 0;

    const result = await pool.request()
        .input('OtpID', sql.Int, otpId)
        .query(`
            UPDATE dbo.OTPVerifications
            SET Attempts = Attempts + 1
            OUTPUT INSERTED.Attempts
            WHERE OtpID = @OtpID;
        `);

    return result.recordset[0] ? result.recordset[0].Attempts : 0;
};

/**
 * Validate OTP and Activate Client Account within a SQL Transaction
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.inputOtp
 * @returns {Promise<{ success: boolean, message: string, user?: object }>}
 */
const verifyOTPAndActivateAccount = async ({ email, inputOtp }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database pool not available.');

    // 1. Fetch latest active OTP record
    const otpRecord = await getLatestActiveOTPRecord(email);

    if (!otpRecord) {
        return {
            success: false,
            message: 'No active verification code found. Please request a new code.'
        };
    }

    // 2. Check Expiration (5 minutes)
    const now = new Date();
    if (now > new Date(otpRecord.ExpiresAt)) {
        return {
            success: false,
            message: 'Your verification code has expired. Please request a new code.'
        };
    }

    // 3. Check Attempt Limit (Rate Limiting - max 5 attempts)
    if (otpRecord.Attempts >= 5) {
        return {
            success: false,
            message: 'Too many incorrect attempts. Please request a new verification code.'
        };
    }

    // 4. Verify bcrypt Hash
    const isMatch = await bcrypt.compare(inputOtp.trim(), otpRecord.OtpHash);

    if (!isMatch) {
        const attempts = await incrementOTPAttempts(otpRecord.OtpID);
        const remaining = 5 - attempts;
        return {
            success: false,
            message: remaining > 0 
                ? `Invalid verification code. ${remaining} attempt(s) remaining.` 
                : 'Invalid verification code. Attempts limit reached. Please request a new code.'
        };
    }

    // 5. OTP Match! Execute Activation Transaction
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // Mark OTP as used
        const markOtpReq = new sql.Request(transaction);
        await markOtpReq
            .input('OtpID', sql.Int, otpRecord.OtpID)
            .query('UPDATE dbo.OTPVerifications SET IsUsed = 1 WHERE OtpID = @OtpID');

        // Activate User Account (EmailVerified = 1, AccountStatus = 'Active')
        const activateUserReq = new sql.Request(transaction);
        const userRes = await activateUserReq
            .input('UserID', sql.Int, otpRecord.UserID)
            .query(`
                UPDATE dbo.Users
                SET EmailVerified = 1, AccountStatus = 'Active', IsActive = 1, UpdatedAt = GETDATE()
                OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.Phone, INSERTED.RoleID
                WHERE UserID = @UserID;
            `);

        // Fetch User & Role profile
        const profileReq = new sql.Request(transaction);
        const profileRes = await profileReq
            .input('UserID', sql.Int, otpRecord.UserID)
            .query(`
                SELECT u.UserID, u.Email, u.Phone, r.RoleName, c.FirstName, c.LastName
                FROM dbo.Users u
                INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE u.UserID = @UserID;
            `);

        await transaction.commit();

        const userProfile = profileRes.recordset[0];

        return {
            success: true,
            message: 'Email verified successfully! Welcome to SoundSphere.',
            user: {
                userId: userProfile.UserID,
                email: userProfile.Email,
                phone: userProfile.Phone,
                role: userProfile.RoleName,
                name: `${userProfile.FirstName} ${userProfile.LastName}`.trim()
            }
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Validate OTP without modifying user table (for Provider Application email verification)
 * @param {object} params
 * @param {string} params.email
 * @param {string} params.inputOtp
 * @returns {Promise<{ success: boolean, message: string }>}
 */
const verifyOTPOnly = async ({ email, inputOtp }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database pool not available.');

    const otpRecord = await getLatestActiveOTPRecord(email);

    if (!otpRecord) {
        return {
            success: false,
            message: 'No active verification code found for this email. Please request a new code.'
        };
    }

    const now = new Date();
    if (now > new Date(otpRecord.ExpiresAt)) {
        return {
            success: false,
            message: 'Your verification code has expired. Please request a new code.'
        };
    }

    if (otpRecord.Attempts >= 5) {
        return {
            success: false,
            message: 'Too many incorrect attempts. Please request a new verification code.'
        };
    }

    const isMatch = await bcrypt.compare(inputOtp.trim(), otpRecord.OtpHash);

    if (!isMatch) {
        const attempts = await incrementOTPAttempts(otpRecord.OtpID);
        const remaining = 5 - attempts;
        return {
            success: false,
            message: remaining > 0 
                ? `Invalid verification code. ${remaining} attempt(s) remaining.` 
                : 'Invalid verification code. Attempts limit reached. Please request a new code.'
        };
    }

    // Mark OTP as used
    await pool.request()
        .input('OtpID', sql.Int, otpRecord.OtpID)
        .query('UPDATE dbo.OTPVerifications SET IsUsed = 1 WHERE OtpID = @OtpID');

    return {
        success: true,
        message: 'Business email verified successfully.'
    };
};

module.exports = {
    saveOTPRecord,
    getLatestActiveOTPRecord,
    incrementOTPAttempts,
    verifyOTPAndActivateAccount,
    verifyOTPOnly
};
