/**
 * SoundSphere - Validation Utility Functions
 */

/**
 * Validate Email Format
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validate Password Strength: Must be at least 8 characters long AND contain at least one number (digit 0-9)
 * @param {string} password
 * @returns {boolean}
 */
const isValidPassword = (password) => {
    if (!password || typeof password !== 'string') return false;
    // Minimum 8 characters long, contains at least 1 digit
    const passwordRegex = /^(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
};

/**
 * Sanitize text input to prevent basic HTML injection
 * @param {string} str
 * @returns {string}
 */
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/[<>]/g, '');
};

module.exports = {
    isValidEmail,
    isValidPassword,
    sanitizeInput
};
