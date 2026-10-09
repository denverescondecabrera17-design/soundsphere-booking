/**
 * SoundSphere - Provider Application & Admin Approval Controller
 */

const providerAppModel = require('../models/providerAppModel');
const notificationModel = require('../models/notificationModel');
const otpModel = require('../models/otpModel');
const { generate6DigitOTP } = require('../utils/otpGenerator');
const emailService = require('../services/emailService');
const { sanitizeInput } = require('../utils/validation');

/**
 * Send OTP to Business Email for Provider Registration
 * POST /api/provider-applications/send-otp
 */
const sendApplicationOTP = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 1);
        let { email, businessName, ownerName } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({ success: false, message: 'Please provide a valid Business Email.' });
        }

        email = sanitizeInput(email).trim().toLowerCase();
        businessName = sanitizeInput(businessName || 'Your Business');
        ownerName = sanitizeInput(ownerName || 'Applicant');

        // Basic email syntax validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email address format.' });
        }

        // Generate 6-digit OTP
        const otpCode = generate6DigitOTP();

        // Save hashed OTP in database (5-minute expiration)
        await otpModel.saveOTPRecord({
            userId: userId || 1,
            email: email,
            plainOtp: otpCode
        });

        // Dispatch email via Nodemailer / Gmail SMTP
        try {
            await emailService.sendProviderAppOTPEmail({
                toEmail: email,
                applicantName: ownerName,
                businessName: businessName,
                otpCode: otpCode
            });
        } catch (emailErr) {
            console.error('Failed to send OTP email:', emailErr.message);
            return res.status(500).json({
                success: false,
                message: 'Failed to dispatch verification email. Please ensure your email address is correct.'
            });
        }

        return res.status(200).json({
            success: true,
            message: `Verification code successfully sent to ${email}. Please check your inbox or spam folder.`
        });
    } catch (error) {
        console.error(' Send Application OTP Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while sending verification code.'
        });
    }
};

/**
 * Verify OTP for Provider Application
 * POST /api/provider-applications/verify-otp
 */
const verifyApplicationOTP = async (req, res) => {
    try {
        let { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and 6-digit verification code are required.' });
        }

        email = sanitizeInput(email).trim().toLowerCase();
        otp = sanitizeInput(otp).trim();

        if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({ success: false, message: 'Verification code must be 6 numeric digits.' });
        }

        const result = await otpModel.verifyOTPOnly({
            email,
            inputOtp: otp
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error(' Verify Application OTP Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error while verifying code.'
        });
    }
};

/**
 * Submit Service Provider Application (Client Role)
 * POST /api/provider-applications
 */
const submitApplication = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || req.query.userId);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User ID required.' });
        }
        let { businessName, ownerName, businessAddress, coverageArea, contactNumber, govtIdUrl, govtIdBackUrl, businessPermitUrl, permitIssuedDate, permitExpiryDate, otherDocsUrl } = req.body;

        businessName = sanitizeInput(businessName);
        ownerName = sanitizeInput(ownerName);
        businessAddress = sanitizeInput(businessAddress);
        coverageArea = sanitizeInput(coverageArea);
        contactNumber = sanitizeInput(contactNumber);

        if (!businessName || !ownerName || !businessAddress || !coverageArea || !contactNumber) {
            return res.status(400).json({
                success: false,
                message: 'All application fields (Business Name, Owner Name, Business Address, Coverage Area, Contact Number) are required.'
            });
        }

        // Check if user already has an active (Pending or Approved) application
        const existingApp = await providerAppModel.findActiveApplicationByUserId(userId);

        if (existingApp) {
            const statusUpper = (existingApp.Status || '').toUpperCase();
            if (statusUpper === 'PENDING') {
                return res.status(400).json({
                    success: false,
                    duplicate: true,
                    message: 'You already have a pending Service Provider application currently under review by the Administrator.',
                    application: existingApp
                });
            } else if (statusUpper === 'APPROVED') {
                return res.status(400).json({
                    success: false,
                    duplicate: true,
                    message: 'Your application has already been approved! You are an active Service Provider.',
                    application: existingApp
                });
            }
        }

        const newApp = await providerAppModel.createApplication({
            userId,
            businessName,
            ownerName,
            businessAddress,
            coverageArea,
            contactNumber,
            govtIdUrl,
            govtIdBackUrl,
            businessPermitUrl,
            permitIssuedDate,
            permitExpiryDate,
            otherDocsUrl
        });

        // Trigger Notifications
        await notificationModel.createNotification({
            userId: userId,
            type: 'Application',
            title: 'Service Provider Application Submitted',
            message: 'Your application to become a SoundSphere Service Provider has been successfully submitted and is now waiting for administrator approval.',
            relatedId: newApp.ApplicationID,
            relatedType: 'Application'
        });


        return res.status(201).json({
            success: true,
            message: 'Service Provider Application submitted successfully! The Administrator will review your application.',
            application: newApp
        });

    } catch (error) {
        console.error(' Submit Application Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while submitting your application.',
            error: error.message
        });
    }
};

/**
 * Get My Application Status (Client Role)
 * GET /api/provider-applications/my-application
 */
const getMyApplication = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.query.userId || req.body.userId);
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User ID required.' });
        }
        const application = await providerAppModel.findApplicationByUserId(userId);

        return res.status(200).json({
            success: true,
            application
        });
    } catch (error) {
        console.error(' Get Application Error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching application status.'
        });
    }
};

/**
 * Admin: Get All Pending Applications
 * GET /api/admin/applications
 */
const getPendingApplications = async (req, res) => {
    try {
        const applications = await providerAppModel.getPendingApplications();
        return res.status(200).json({
            success: true,
            applications
        });
    } catch (error) {
        console.error(' Get Pending Applications Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch pending applications.'
        });
    }
};

const adminController = require('./adminController');
const { connectDB } = require('../config/db');

/**
 * Admin: Approve Application & Promote User Role to ServiceProvider
 * POST /api/admin/applications/:id/approve
 */
const approveApplication = async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id, 10);
        if (!applicationId) {
            return res.status(400).json({ success: false, message: 'Invalid Application ID.' });
        }

        const result = await providerAppModel.approveApplication(applicationId);

        if (result.success && result.application) {
            await notificationModel.createNotification({
                userId: result.application.UserID,
                type: 'Application',
                title: 'Service Provider Application Approved',
                message: 'Congratulations! Your application has been approved. You are now an approved SoundSphere Service Provider.',
                relatedId: applicationId,
                relatedType: 'Application'
            });

            try {
                const pool = await connectDB();
                await adminController.logActivity(
                    pool,
                    req.user?.userId || null,
                    'Service Provider Approved',
                    `"${result.application.BusinessName}" promoted to active provider`,
                    'ProviderApplication',
                    applicationId
                );
            } catch (logErr) {
                console.warn('Activity log notice:', logErr.message);
            }
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error(' Approve Application Error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to approve application.'
        });
    }
};

/**
 * Admin: Reject Application
 * POST /api/admin/applications/:id/reject
 */
const rejectApplication = async (req, res) => {
    try {
        const applicationId = parseInt(req.params.id, 10);
        const { reason } = req.body;

        if (!applicationId) {
            return res.status(400).json({ success: false, message: 'Invalid Application ID.' });
        }

        const result = await providerAppModel.rejectApplication(applicationId, reason);

        if (result.success && result.application) {
            await notificationModel.createNotification({
                userId: result.application.UserID,
                type: 'Application',
                title: 'Service Provider Application Rejected',
                message: `Your Service Provider application was not approved. Reason: ${reason || 'Incomplete business details.'}`,
                relatedId: applicationId,
                relatedType: 'Application'
            });

            try {
                const pool = await connectDB();
                await adminController.logActivity(
                    pool,
                    req.user?.userId || null,
                    'Provider Application Rejected',
                    `Application #${applicationId} rejected: ${reason || 'Incomplete details.'}`,
                    'ProviderApplication',
                    applicationId
                );
            } catch (logErr) {
                console.warn('Activity log notice:', logErr.message);
            }
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error(' Reject Application Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reject application.'
        });
    }
};

module.exports = {
    sendApplicationOTP,
    verifyApplicationOTP,
    submitApplication,
    getMyApplication,
    getPendingApplications,
    approveApplication,
    rejectApplication
};
