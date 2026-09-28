/**
 * Authentication Routes
 * API Endpoint mappings for Authentication Module
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// @route   POST /api/auth/register
// @desc    Register new user account (Client or Service Provider)
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user credentials & issue JWT token
router.post('/login', authController.login);

// @route   POST /api/auth/logout
// @desc    User logout acknowledgement
router.post('/logout', authController.logout);

module.exports = router;
