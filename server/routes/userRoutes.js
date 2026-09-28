const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { optionalVerifyToken } = require('../middleware/authMiddleware');

// GET /api/users/profile
router.get('/profile', optionalVerifyToken, userController.getProfile);

// POST & PUT /api/users/profile (Handles multipart/form-data with avatarFile upload)
router.post('/profile', optionalVerifyToken, userController.uploadMiddleware, userController.updateProfile);
router.put('/profile', optionalVerifyToken, userController.uploadMiddleware, userController.updateProfile);
router.post('/profile/photo', optionalVerifyToken, userController.uploadMiddleware, userController.updateProfile);

// POST /api/users/change-password
router.post('/change-password', optionalVerifyToken, userController.changePassword);

module.exports = router;
