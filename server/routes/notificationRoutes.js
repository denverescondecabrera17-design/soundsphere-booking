/**
 * SoundSphere - Notification API Routes
 * Endpoints for Notification management and status updates
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, notificationController.getUserNotifications);
router.put('/read-all', verifyToken, notificationController.markAllNotificationsRead);
router.put('/:id/read', verifyToken, notificationController.markNotificationRead);
router.get('/check-reminders', notificationController.triggerBalanceReminders);
router.post('/check-reminders', notificationController.triggerBalanceReminders);

module.exports = router;
