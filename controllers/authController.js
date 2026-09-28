/**
 * SoundSphere - Authentication Controller
 * Handles HTTP requests for User Registration, Login, and Logout
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { isValidEmail, isValidPassword, isValidPhone, sanitizeInput } = require('../utils/validation');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new Client account (Public signup registers as Client ONLY)
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { email, password, phone, firstName, lastName, address } = req.body;

        // 1. Strict Role Guard: Public visitors can ONLY register as Client
        if (req.body.role && req.body.role !== 'Client') {
            return res.status(400).json({
                success: false,
                message: 'Public registration is allowed for Client accounts only. Administrators and Service Providers cannot register directly.'
            });
        }

        // 2. Input Validation
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        if (!isValidPassword(password)) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        if (!phone || phone.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required.'
            });
        }

        if (!firstName || !lastName || firstName.trim() === '' || lastName.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'First Name and Last Name are required.'
            });
        }

        // 3. Check for existing Email in Users table
        const existingUser = await userModel.findUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email address already exists.'
            });
        }

        // 4. Hash Password using bcrypt (Salt factor 10)
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 5. Create Client Account in Database
        const newClient = await userModel.createClientUser({
            email,
            passwordHash,
            phone,
            firstName: sanitizeInput(firstName),
            lastName: sanitizeInput(lastName),
            address: sanitizeInput(address)
        });

        return res.status(201).json({
            success: true,
            message: 'Client account registered successfully. You can now log in.',
            data: newClient
        });

    } catch (error) {
        console.error('Error during registration:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while processing registration.'
        });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials & issue JWT token with role-based redirect target
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Input Presence Check
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // 2. Fetch User by Email
        const user = await userModel.findUserByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email address or password.'
            });
        }

        // 3. Check Account Status
        if (!user.IsActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // 4. Verify Password Hash using bcrypt
        const isMatch = await bcrypt.compare(password, user.PasswordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email address or password.'
            });
        }

        // 5. Determine Role Dashboard Redirection Path
        let redirectUrl = '/marketplace.html';
        const roleLower = (user.RoleName || '').toLowerCase();
        if (roleLower === 'administrator' || roleLower === 'admin') {
            redirectUrl = '/admin/dashboard.html';
        } else if (roleLower === 'serviceprovider' || roleLower === 'provider') {
            redirectUrl = '/provider/dashboard.html';
        }

        // 6. Generate Signed JWT Token
        const payload = {
            userId: user.UserID,
            email: user.Email,
            roleName: user.RoleName
        };

        const token = jwt.sign(
            payload,
            process.env.JWT_SECRET || 'SoundSphere_Secret_Key',
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        // 7. Return Authentication Response
        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: token,
            redirectUrl: redirectUrl,
            user: {
                userId: user.UserID,
                email: user.Email,
                phone: user.Phone,
                role: user.RoleName,
                name: user.RoleName === 'Administrator'
                    ? user.AdminFullName
                    : (user.RoleName === 'ServiceProvider' ? user.BusinessName : `${user.ClientFirstName} ${user.ClientLastName}`)
            }
        });

    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while processing login.'
        });
    }
};

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user & acknowledge token clearance
 * @access  Public / Protected
 */
const logout = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (error) {
        console.error('Error during logout:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred during logout.'
        });
    }
};

module.exports = {
    register,
    login,
    logout
};
