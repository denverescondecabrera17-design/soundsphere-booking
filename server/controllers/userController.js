/**
 * SoundSphere - User Profile & Avatar Controller
 * Handles GET /api/users/profile and POST /api/users/profile with multer avatar file uploads
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const userModel = require('../models/userModel');

// Ensure Upload Directories Exist
const uploadDirPublic = path.join(__dirname, '../../public/uploads/avatars');
const uploadDirClient = path.join(__dirname, '../../client/uploads/avatars');
[uploadDirPublic, uploadDirClient].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDirPublic);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});

// File Filter (Max 2 MB, .jpeg, .jpg, .png, .webp)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image file type. Only JPG, PNG, and WebP are allowed.'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB safety limit
    fileFilter
});

/**
 * GET /api/users/profile
 * Retrieves user profile details by userId query or decoded token
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User ID not provided.'
            });
        }

        const profile = await userModel.getUserProfileByUserId(userId);

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: 'User profile not found.'
            });
        }

        const firstName = profile.ClientFirstName || profile.OwnerFirstName || '';
        const middleName = profile.ClientMiddleName || '';
        const lastName = profile.ClientLastName || profile.OwnerLastName || '';
        const clientFullName = `${firstName}${middleName ? ' ' + middleName : ''}${lastName ? ' ' + lastName : ''}`.trim() || profile.AdminFullName || profile.Email;

        return res.status(200).json({
            success: true,
            user: {
                userId: profile.UserID,
                email: profile.Email,
                phone: profile.Phone || '',
                role: profile.RoleName,
                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                personalName: clientFullName,
                clientName: clientFullName,
                name: clientFullName,
                ownerName: clientFullName || profile.OwnerName || '',
                address: profile.ClientAddress || profile.BusinessAddress || '',
                businessName: profile.BusinessName || '',
                businessAddress: profile.BusinessAddress || '',
                coverageArea: profile.CoverageArea || '',
                isApprovedProvider: Boolean(profile.BusinessName || profile.RoleName === 'ServiceProvider'),
                avatar: profile.ProfilePicture || null,
                profilePicture: profile.ProfilePicture || null,
                emailVerified: profile.EmailVerified === true || profile.EmailVerified === 1 || true
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile details.',
            error: error.message
        });
    }
};

/**
 * POST /api/users/profile
 * Updates user profile details & avatar photo
 */
const updateProfile = async (req, res) => {
    try {
        const { userId, email, firstName, middleName, lastName, phone, address, businessName, businessAddress, coverageArea } = req.body;
        const targetUserId = userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required to update profile settings.'
            });
        }

        // Email format validation if email is provided
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid email address format. Please enter a valid email.'
                });
            }
        }

        let profilePicture = undefined;
        if (req.file) {
            profilePicture = `uploads/avatars/${req.file.filename}`;
            try {
                const clientDest = path.join(uploadDirClient, req.file.filename);
                fs.copyFileSync(req.file.path, clientDest);
            } catch (e) {
                console.warn('Copy avatar to client uploads notice:', e.message);
            }
        }

        const updatedProfile = await userModel.updateUserProfile(targetUserId, {
            email,
            firstName,
            middleName,
            lastName,
            phone,
            address,
            businessName,
            businessAddress,
            coverageArea,
            profilePicture
        });

        const outFirstName = updatedProfile.ClientFirstName || updatedProfile.OwnerFirstName || '';
        const outMiddleName = updatedProfile.ClientMiddleName || '';
        const outLastName = updatedProfile.ClientLastName || updatedProfile.OwnerLastName || '';
        const clientFullName = `${outFirstName}${outMiddleName ? ' ' + outMiddleName : ''}${outLastName ? ' ' + outLastName : ''}`.trim() || updatedProfile.AdminFullName || updatedProfile.Email;

        return res.status(200).json({
            success: true,
            message: 'Your profile settings have been updated successfully!',
            user: {
                userId: updatedProfile.UserID,
                email: updatedProfile.Email,
                phone: updatedProfile.Phone || '',
                role: updatedProfile.RoleName,
                firstName: outFirstName,
                middleName: outMiddleName,
                lastName: outLastName,
                personalName: clientFullName,
                clientName: clientFullName,
                name: clientFullName,
                address: updatedProfile.ClientAddress || updatedProfile.BusinessAddress || '',
                businessName: updatedProfile.BusinessName || '',
                businessAddress: updatedProfile.BusinessAddress || '',
                coverageArea: updatedProfile.CoverageArea || '',
                isApprovedProvider: Boolean(updatedProfile.BusinessName || updatedProfile.RoleName === 'ServiceProvider'),
                avatar: updatedProfile.ProfilePicture || null,
                profilePicture: updatedProfile.ProfilePicture || null,
                emailVerified: updatedProfile.EmailVerified
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error.message);
        if (error.message.includes('Email already in use')) {
            return res.status(400).json({
                success: false,
                message: 'Email already in use. Please use another email address.'
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Failed to save profile changes.',
            error: error.message
        });
    }
};

const bcrypt = require('bcrypt');

/**
 * POST /api/users/change-password
 * Allows authenticated user to update their password from Security & Preferences
 */
const changePassword = async (req, res) => {
    try {
        const { userId, currentPassword, newPassword } = req.body;

        if (!userId || !currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'UserId, current password, and new password are required.'
            });
        }

        if (newPassword.length < 8 || !/\d/.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 8 characters long and include at least one number.'
            });
        }

        const user = await userModel.getUserProfileByUserId(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User account not found.'
            });
        }

        if (user.PasswordHash) {
            const isMatch = await bcrypt.compare(currentPassword, user.PasswordHash);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    message: 'Current password is incorrect. Please try again.'
                });
            }
        }

        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        await userModel.updateUserPassword(userId, newPasswordHash);

        return res.status(200).json({
            success: true,
            message: 'Your password has been changed successfully!'
        });
    } catch (error) {
        console.error('Error changing password:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to change password. Please try again later.'
        });
    }
};

module.exports = {
    uploadMiddleware: upload.single('avatarFile'),
    getProfile,
    updateProfile,
    changePassword
};
