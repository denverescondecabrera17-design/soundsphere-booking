/**
 * SoundSphere - Notification Data Access Model
 * Manages SQL Server operations for user notifications
 */

const { getPool, sql } = require('../config/db');

/**
 * Create a new notification for a user
 */
const createNotification = async ({ userId, type, title, message, relatedId, relatedType }) => {
    try {
        const pool = getPool();
        if (!pool) return null;

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .input('NotificationType', sql.NVarChar(50), type || 'System')
            .input('Title', sql.NVarChar(150), title)
            .input('Message', sql.NVarChar(500), message)
            .input('RelatedID', sql.Int, relatedId || null)
            .input('RelatedType', sql.NVarChar(50), relatedType || null)
            .query(`
                INSERT INTO dbo.Notifications (UserID, NotificationType, Title, Message, RelatedID, RelatedType, IsRead, CreatedAt)
                OUTPUT INSERTED.NotificationID, INSERTED.UserID, INSERTED.NotificationType, INSERTED.Title, INSERTED.Message, INSERTED.RelatedID, INSERTED.RelatedType, INSERTED.IsRead, INSERTED.CreatedAt
                VALUES (@UserID, @NotificationType, @Title, @Message, @RelatedID, @RelatedType, 0, GETDATE());
            `);

        return result.recordset[0] || null;
    } catch (err) {
        console.error('Error creating notification:', err.message);
        return null;
    }
};

/**
 * Create a notification for all Administrator users
 */
const notifyAllAdmins = async ({ type, title, message, relatedId, relatedType }) => {
    try {
        const pool = getPool();
        if (!pool) return;

        const adminsRes = await pool.request().query(`
            SELECT u.UserID 
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
            WHERE r.RoleName = 'Administrator' OR r.RoleName = 'Admin';
        `);

        const admins = adminsRes.recordset || [];
        for (const admin of admins) {
            await createNotification({
                userId: admin.UserID,
                type,
                title,
                message,
                relatedId,
                relatedType
            });
        }
    } catch (err) {
        console.error('Error notifying admins:', err.message);
    }
};

/**
 * Get all notifications for a specific User ID ordered by newest first
 */
const getNotificationsByUserId = async (userId) => {
    try {
        const pool = getPool();
        if (!pool) return [];

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT 
                    NotificationID,
                    UserID,
                    NotificationType,
                    Title,
                    Message,
                    RelatedID,
                    RelatedType,
                    IsRead,
                    CreatedAt
                FROM dbo.Notifications
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC;
            `);

        return result.recordset || [];
    } catch (err) {
        console.error('Error retrieving notifications:', err.message);
        return [];
    }
};

/**
 * Get unread notifications count for a specific User ID
 */
const getUnreadCountByUserId = async (userId) => {
    try {
        const pool = getPool();
        if (!pool) return 0;

        const result = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT COUNT(*) AS UnreadCount
                FROM dbo.Notifications
                WHERE UserID = @UserID AND IsRead = 0;
            `);

        return result.recordset[0]?.UnreadCount || 0;
    } catch (err) {
        console.error('Error counting unread notifications:', err.message);
        return 0;
    }
};

/**
 * Mark a single notification as read
 */
const markAsRead = async (notificationId, userId) => {
    try {
        const pool = getPool();
        if (!pool) return false;

        await pool.request()
            .input('NotificationID', sql.Int, notificationId)
            .input('UserID', sql.Int, userId)
            .query(`
                UPDATE dbo.Notifications
                SET IsRead = 1, ReadAt = GETDATE()
                WHERE NotificationID = @NotificationID AND UserID = @UserID;
            `);

        return true;
    } catch (err) {
        console.error('Error marking notification as read:', err.message);
        return false;
    }
};

/**
 * Mark all notifications as read for a user
 */
const markAllAsRead = async (userId) => {
    try {
        const pool = getPool();
        if (!pool) return false;

        await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                UPDATE dbo.Notifications
                SET IsRead = 1, ReadAt = GETDATE()
                WHERE UserID = @UserID AND IsRead = 0;
            `);

        return true;
    } catch (err) {
        console.error('Error marking all notifications as read:', err.message);
        return false;
    }
};

module.exports = {
    createNotification,
    notifyAllAdmins,
    getNotificationsByUserId,
    getUnreadCountByUserId,
    markAsRead,
    markAllAsRead
};
