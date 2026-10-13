/**
 * SoundSphere - Notification API Controller
 * Handles GET /api/notifications, PUT /api/notifications/:id/read, PUT /api/notifications/read-all
 */

const notificationModel = require('../models/notificationModel');
const adminController = require('./adminController');

/**
 * GET /api/notifications
 * Retrieve user notifications list & unread count
 */
const getUserNotifications = async (req, res) => {
    try {
        const userRole = String(req.user?.roleName || req.user?.role || req.user?.RoleName || req.user?.Role || '').toLowerCase();
        const userRoleId = parseInt(req.user?.roleId || req.user?.RoleID, 10);
        const userEmail = String(req.user?.email || req.user?.Email || '').toLowerCase();

        if (userRole === 'admin' || userRole === 'administrator' || userRoleId === 1 || userEmail === 'soundsphere@gmail.com' || req.query.scope === 'admin') {
            return adminController.getAdminNotifications(req, res);
        }

        const userId = (req.user && (req.user.userId || req.user.id || req.user.UserID)) || req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Authentication token required.' });
        }

        const notifications = await notificationModel.getNotificationsByUserId(userId);
        const unreadCount = await notificationModel.getUnreadCountByUserId(userId);

        return res.status(200).json({
            success: true,
            unreadCount,
            notifications
        });
    } catch (error) {
        console.error('Error in getUserNotifications:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications.',
            error: error.message
        });
    }
};

/**
 * PUT /api/notifications/:id/read
 * Mark single notification as read
 */
const markNotificationRead = async (req, res) => {
    try {
        const notifIdStr = String(req.params.id || '');
        if (notifIdStr.startsWith('app-') || notifIdStr.startsWith('wd-') || notifIdStr.startsWith('rep-') || notifIdStr.startsWith('bk-')) {
            return res.status(200).json({ success: true, message: 'Notification marked as read.' });
        }

        const userId = (req.user && (req.user.userId || req.user.id || req.user.UserID)) || req.body.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Authentication token required.' });
        }
        const notificationId = parseInt(req.params.id, 10);

        if (!isNaN(notificationId)) {
            await notificationModel.markAsRead(notificationId, userId);
        }
        const unreadCount = await notificationModel.getUnreadCountByUserId(userId);

        return res.status(200).json({
            success: true,
            message: 'Notification marked as read.',
            unreadCount
        });
    } catch (error) {
        console.error('Error in markNotificationRead:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update notification status.',
            error: error.message
        });
    }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read for user
 */
const markAllNotificationsRead = async (req, res) => {
    try {
        const userRole = String(req.user?.roleName || req.user?.role || req.user?.RoleName || req.user?.Role || '').toLowerCase();
        const userRoleId = parseInt(req.user?.roleId || req.user?.RoleID, 10);
        const userEmail = String(req.user?.email || req.user?.Email || '').toLowerCase();

        if (userRole === 'admin' || userRole === 'administrator' || userRoleId === 1 || userEmail === 'soundsphere@gmail.com' || req.body?.scope === 'admin') {
            return adminController.markAllAdminNotificationsRead(req, res);
        }

        const userId = (req.user && (req.user.userId || req.user.id || req.user.UserID)) || req.body?.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Authentication token required.' });
        }

        await notificationModel.markAllAsRead(userId);

        return res.status(200).json({
            success: true,
            message: 'All notifications marked as read.',
            unreadCount: 0
        });
    } catch (error) {
        console.error('Error in markAllNotificationsRead:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read.',
            error: error.message
        });
    }
};

/**
 * POST or GET /api/notifications/check-reminders
 * Trigger automated check for upcoming balance due reminders (1 day before due date)
 */
const triggerBalanceReminders = async (req, res) => {
    try {
        const balanceReminderService = require('../services/balanceReminderService');
        const result = await balanceReminderService.checkAndSendBalanceDueReminders();
        return res.status(200).json({
            success: true,
            message: 'Balance reminder check completed.',
            data: result
        });
    } catch (error) {
        console.error('Error triggering balance reminders:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to execute balance reminder scan.',
            error: error.message
        });
    }
};

module.exports = {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    triggerBalanceReminders
};

