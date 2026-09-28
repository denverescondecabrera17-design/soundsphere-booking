/**
 * SoundSphere - Notification API Controller
 * Handles GET /api/notifications, PUT /api/notifications/:id/read, PUT /api/notifications/read-all
 */

const notificationModel = require('../models/notificationModel');

/**
 * GET /api/notifications
 * Retrieve user notifications list & unread count
 */
const getUserNotifications = async (req, res) => {
    try {
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
        const userId = (req.user && (req.user.userId || req.user.id || req.user.UserID)) || req.body.userId;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Authentication token required.' });
        }
        const notificationId = parseInt(req.params.id, 10);

        await notificationModel.markAsRead(notificationId, userId);
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
        const userId = (req.user && (req.user.userId || req.user.id || req.user.UserID)) || req.body.userId;
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

module.exports = {
    getUserNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
