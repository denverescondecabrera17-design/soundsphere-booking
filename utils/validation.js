/**
 * Input Validation Utility Functions
 */

/**
 * Validate email address format using standard regex
 * @param {string} email 
 * @returns {boolean}
 */
const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
};

/**
 * Validate password strength (at least 6 characters)
 * @param {string} password 
 * @returns {boolean}
 */
const isValidPassword = (password) => {
    return typeof password === 'string' && password.trim().length >= 6;
};

/**
 * Validate phone number format (digits, spaces, hyphens, plus sign; 7-15 chars)
 * @param {string} phone 
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,8}$/;
    return phoneRegex.test(phone.trim());
};

/**
 * Sanitize string inputs to prevent simple injection / XSS
 * @param {string} str 
 * @returns {string}
 */
const sanitizeInput = (str) => {
    if (typeof str !== 'string') return '';
    return str.trim();
};

module.exports = {
    isValidEmail,
    isValidPassword,
    isValidPhone,
    sanitizeInput
};
