/**
 * SoundSphere - Secure 6-Digit OTP Generator Utility
 */

const crypto = require('crypto');

/**
 * Generate a cryptographically secure 6-digit numeric OTP string
 * @returns {string} 6-digit OTP code (e.g. "482915")
 */
const generate6DigitOTP = () => {
    // Generate random buffer for crypto security
    const buffer = crypto.randomBytes(4);
    const randomNumber = buffer.readUInt32BE(0);
    // Scale to range 100000 - 999999
    const otp = (100000 + (randomNumber % 900000)).toString();
    return otp;
};

module.exports = {
    generate6DigitOTP
};
