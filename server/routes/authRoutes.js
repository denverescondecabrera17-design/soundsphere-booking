/**
 * SoundSphere - Auth Routes
 * Express API routes for authentication, OTP email verification, and token operations
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registration & OTP Endpoints
router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyOTP);
router.post('/resend-otp', authController.resendOTP);

// Login & Session Endpoints
router.post('/login', authController.login);
router.post('/logout', authController.logout);

// Password Recovery Endpoints
router.post('/forgot-password', authController.forgotPassword);
router.get('/verify-reset-token', authController.verifyResetToken);
router.post('/reset-password', authController.resetPassword);

// Social Login & Registration Endpoints
router.post('/social-login', authController.socialAuth);

// Real Google OAuth 2.0 Endpoints
router.get('/google', authController.initiateGoogleAuth);
router.get('/google/callback', authController.handleGoogleCallback);

module.exports = router;
