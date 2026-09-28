/**
 * SoundSphere - Messaging Data Access Model
 * Handles SQL Server database CRUD for Conversations, ConversationParticipants, and Real-Time Messages
 */

const { getPool, sql } = require('../config/db');
const notificationModel = require('./notificationModel');

/**
 * Find existing 1-to-1 conversation or create a new one inside a SQL transaction
 * @param {object} params
 * @param {number} params.user1Id
 * @param {number} params.user2Id
 * @param {number} [params.bookingId]
 * @param {number} [params.applicationId]
 * @returns {Promise<object>} Conversation object
 */
const findOrCreateConversation = async ({ user1Id, user2Id, bookingId = null, applicationId = null }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database pool not available.');

    const u1 = Math.min(parseInt(user1Id, 10), parseInt(user2Id, 10));
    const u2 = Math.max(parseInt(user1Id, 10), parseInt(user2Id, 10));

    // 1. Check if an existing 1-to-1 conversation exists between these two users
    const checkResult = await pool.request()
        .input('U1', sql.Int, u1)
        .input('U2', sql.Int, u2)
        .query(`
            SELECT TOP 1 ConversationID, User1ID, User2ID, BookingID, ApplicationID, CreatedAt, UpdatedAt
            FROM dbo.Conversations
            WHERE (User1ID = @U1 AND User2ID = @U2) OR (User1ID = @U2 AND User2ID = @U1)
            ORDER BY ConversationID ASC;
        `);

    if (checkResult.recordset.length > 0) {
        const conv = checkResult.recordset[0];
        // If bookingId is provided and conversation doesn't have it, update it
        if (bookingId && !conv.BookingID) {
            await pool.request()
                .input('ConvID', sql.Int, conv.ConversationID)
                .input('BookingID', sql.Int, bookingId)
                .query(`UPDATE dbo.Conversations SET BookingID = @BookingID, UpdatedAt = GETDATE() WHERE ConversationID = @ConvID`);
            conv.BookingID = bookingId;
        }
        return conv;
    }

    // 2. Create a new Conversation inside a SQL Transaction to prevent duplicates
    const transaction = new sql.Transaction(pool);
    try {
        await transaction.begin();

        const insertReq = new sql.Request(transaction);
        const insertRes = await insertReq
            .input('U1', sql.Int, u1)
            .input('U2', sql.Int, u2)
            .input('BookingID', sql.Int, bookingId)
            .input('ApplicationID', sql.Int, applicationId)
            .query(`
                INSERT INTO dbo.Conversations (User1ID, User2ID, BookingID, ApplicationID, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.ConversationID, INSERTED.User1ID, INSERTED.User2ID, INSERTED.BookingID, INSERTED.ApplicationID, INSERTED.CreatedAt, INSERTED.UpdatedAt
                VALUES (@U1, @U2, @BookingID, @ApplicationID, GETDATE(), GETDATE());
            `);

        const newConv = insertRes.recordset[0];

        // Insert Participants
        const partReq1 = new sql.Request(transaction);
        await partReq1
            .input('ConvID', sql.Int, newConv.ConversationID)
            .input('UserID', sql.Int, u1)
            .query(`INSERT INTO dbo.ConversationParticipants (ConversationID, UserID) VALUES (@ConvID, @UserID);`);

        const partReq2 = new sql.Request(transaction);
        await partReq2
            .input('ConvID', sql.Int, newConv.ConversationID)
            .input('UserID', sql.Int, u2)
            .query(`INSERT INTO dbo.ConversationParticipants (ConversationID, UserID) VALUES (@ConvID, @UserID);`);

        await transaction.commit();
        return newConv;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

/**
 * Fetch all Conversations for a User with partner details, last message, and unread counts
 * @param {number} userId 
 * @returns {Promise<Array>}
 */
const getUserConversations = async (userId) => {
    const pool = getPool();
    if (!pool) return [];

    const uid = parseInt(userId, 10);

    const result = await pool.request()
        .input('UserID', sql.Int, uid)
        .query(`
            SELECT 
                c.ConversationID,
                c.User1ID,
                c.User2ID,
                c.BookingID,
                c.UpdatedAt,
                partner.UserID AS PartnerUserID,
                partner.Email AS PartnerEmail,
                r.RoleName AS PartnerRole,
                COALESCE(
                    sp.BusinessName, 
                    pa.BusinessName, 
                    CASE WHEN cClient.FirstName IS NOT NULL THEN CONCAT(cClient.FirstName, ' ', cClient.LastName) ELSE NULL END,
                    adm.FullName,
                    partner.Email
                ) AS PartnerName,
                COALESCE(sp.ProfilePicture, partner.ProfilePicture, NULL) AS PartnerAvatar,
                lm.MessageID AS LastMessageID,
                lm.MessageText AS LastMessageText,
                lm.SentAt AS LastMessageSentAt,
                lm.SenderUserID AS LastMessageSenderID,
                (
                    SELECT COUNT(*)
                    FROM dbo.Messages mUnread
                    WHERE mUnread.ConversationID = c.ConversationID
                      AND mUnread.ReceiverUserID = @UserID
                      AND mUnread.IsRead = 0
                      AND mUnread.IsDeleted = 0
                ) AS UnreadCount
            FROM dbo.Conversations c
            CROSS APPLY (
                SELECT CASE WHEN c.User1ID = @UserID THEN c.User2ID ELSE c.User1ID END AS PartnerID
            ) p
            JOIN dbo.Users partner ON partner.UserID = p.PartnerID
            JOIN dbo.Roles r ON partner.RoleID = r.RoleID
            LEFT JOIN dbo.ServiceProviders sp ON partner.UserID = sp.UserID
            LEFT JOIN dbo.ProviderApplications pa ON partner.UserID = pa.UserID
            LEFT JOIN dbo.Clients cClient ON partner.UserID = cClient.UserID
            LEFT JOIN dbo.Admins adm ON partner.UserID = adm.UserID
            OUTER APPLY (
                SELECT TOP 1 MessageID, MessageText, SentAt, SenderUserID
                FROM dbo.Messages m
                WHERE m.ConversationID = c.ConversationID AND m.IsDeleted = 0
                ORDER BY m.MessageID DESC
            ) lm
            WHERE c.User1ID = @UserID OR c.User2ID = @UserID
            ORDER BY COALESCE(lm.SentAt, c.UpdatedAt) DESC;
        `);

    return result.recordset.map(row => ({
        conversationId: row.ConversationID,
        bookingId: row.BookingID,
        updatedAt: row.UpdatedAt,
        partner: {
            userId: row.PartnerUserID,
            name: row.PartnerName || row.PartnerEmail,
            email: row.PartnerEmail,
            role: row.PartnerRole,
            avatar: row.PartnerAvatar ? (row.PartnerAvatar.startsWith('http') || row.PartnerAvatar.startsWith('/') ? row.PartnerAvatar : '/' + row.PartnerAvatar) : null
        },
        lastMessage: row.LastMessageText ? {
            id: row.LastMessageID,
            text: row.LastMessageText,
            sentAt: row.LastMessageSentAt,
            senderId: row.LastMessageSenderID,
            isMine: row.LastMessageSenderID === uid
        } : null,
        unreadCount: row.UnreadCount || 0
    }));
};

/**
 * Get all messages for a conversation and mark unread messages as read
 * @param {object} params
 * @param {number} params.conversationId
 * @param {number} params.userId
 * @returns {Promise<Array>} List of messages
 */
const getConversationMessages = async ({ conversationId, userId }) => {
    const pool = getPool();
    if (!pool) return [];

    const cid = parseInt(conversationId, 10);
    const uid = parseInt(userId, 10);

    // 1. Verify user is a participant
    const partRes = await pool.request()
        .input('ConvID', sql.Int, cid)
        .input('UserID', sql.Int, uid)
        .query(`SELECT ConversationID FROM dbo.Conversations WHERE ConversationID = @ConvID AND (User1ID = @UserID OR User2ID = @UserID)`);

    if (partRes.recordset.length === 0) {
        throw new Error('Access denied. You are not a participant in this conversation.');
    }

    // 2. Mark unread messages sent to this user in this conversation as read
    await pool.request()
        .input('ConvID', sql.Int, cid)
        .input('UserID', sql.Int, uid)
        .query(`
            UPDATE dbo.Messages
            SET IsRead = 1, ReadAt = GETDATE()
            WHERE ConversationID = @ConvID AND ReceiverUserID = @UserID AND IsRead = 0;
        `);

    // 3. Fetch messages ordered by SentAt ASC
    const result = await pool.request()
        .input('ConvID', sql.Int, cid)
        .query(`
            SELECT 
                m.MessageID,
                m.ConversationID,
                m.SenderUserID,
                m.ReceiverUserID,
                m.BookingID,
                m.MessageText,
                m.SentAt,
                m.IsRead,
                m.ReadAt,
                m.IsDeleted,
                COALESCE(
                    sp.BusinessName, 
                    CASE WHEN cClient.FirstName IS NOT NULL THEN CONCAT(cClient.FirstName, ' ', cClient.LastName) ELSE NULL END,
                    adm.FullName,
                    sender.Email
                ) AS SenderName,
                COALESCE(sp.ProfilePicture, sender.ProfilePicture, NULL) AS SenderAvatar
            FROM dbo.Messages m
            JOIN dbo.Users sender ON m.SenderUserID = sender.UserID
            LEFT JOIN dbo.ServiceProviders sp ON sender.UserID = sp.UserID
            LEFT JOIN dbo.Clients cClient ON sender.UserID = cClient.UserID
            LEFT JOIN dbo.Admins adm ON sender.UserID = adm.UserID
            WHERE m.ConversationID = @ConvID AND m.IsDeleted = 0
            ORDER BY m.MessageID ASC;
        `);

    return result.recordset.map(row => ({
        messageId: row.MessageID,
        conversationId: row.ConversationID,
        senderId: row.SenderUserID,
        receiverId: row.ReceiverUserID,
        bookingId: row.BookingID,
        text: row.MessageText,
        sentAt: row.SentAt,
        isRead: Boolean(row.IsRead),
        readAt: row.ReadAt,
        senderName: row.SenderName,
        senderAvatar: row.SenderAvatar ? (row.SenderAvatar.startsWith('http') || row.SenderAvatar.startsWith('/') ? row.SenderAvatar : '/' + row.SenderAvatar) : null,
        isMine: row.SenderUserID === uid
    }));
};

/**
 * Save new message to database and trigger notification
 * @param {object} params
 * @param {number} params.conversationId
 * @param {number} params.senderUserId
 * @param {string} params.messageText
 * @param {number} [params.bookingId]
 * @returns {Promise<object>} Inserted message record
 */
const sendMessage = async ({ conversationId, senderUserId, messageText, bookingId = null }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database pool not available.');

    const cid = parseInt(conversationId, 10);
    const sid = parseInt(senderUserId, 10);
    const text = messageText.trim();

    if (!text) throw new Error('Message text cannot be empty.');

    // 1. Retrieve conversation record and verify sender is a participant
    const convRes = await pool.request()
        .input('ConvID', sql.Int, cid)
        .query(`SELECT ConversationID, User1ID, User2ID, BookingID FROM dbo.Conversations WHERE ConversationID = @ConvID`);

    if (convRes.recordset.length === 0) {
        throw new Error('Conversation not found.');
    }

    const conv = convRes.recordset[0];
    if (conv.User1ID !== sid && conv.User2ID !== sid) {
        throw new Error('Access denied. You are not a participant in this conversation.');
    }

    const receiverUserId = conv.User1ID === sid ? conv.User2ID : conv.User1ID;

    // 2. Insert message into dbo.Messages
    const insertRes = await pool.request()
        .input('ConvID', sql.Int, cid)
        .input('SenderID', sql.Int, sid)
        .input('ReceiverID', sql.Int, receiverUserId)
        .input('BookingID', sql.Int, bookingId || conv.BookingID || null)
        .input('MessageText', sql.NVarChar(sql.MAX), text)
        .query(`
            INSERT INTO dbo.Messages (ConversationID, SenderUserID, ReceiverUserID, BookingID, MessageText, SentAt, IsRead)
            OUTPUT INSERTED.MessageID, INSERTED.ConversationID, INSERTED.SenderUserID, INSERTED.ReceiverUserID, INSERTED.BookingID, INSERTED.MessageText, INSERTED.SentAt, INSERTED.IsRead
            VALUES (@ConvID, @SenderID, @ReceiverID, @BookingID, @MessageText, GETDATE(), 0);
        `);

    const newMsg = insertRes.recordset[0];

    // 3. Update Conversation UpdatedAt timestamp
    await pool.request()
        .input('ConvID', sql.Int, cid)
        .query(`UPDATE dbo.Conversations SET UpdatedAt = GETDATE() WHERE ConversationID = @ConvID`);

    // 4. Fetch sender name to create notification
    const senderRes = await pool.request()
        .input('SenderID', sql.Int, sid)
        .query(`
            SELECT COALESCE(
                sp.BusinessName, 
                CASE WHEN cClient.FirstName IS NOT NULL THEN CONCAT(cClient.FirstName, ' ', cClient.LastName) ELSE NULL END,
                adm.FullName,
                u.Email
            ) AS SenderName
            FROM dbo.Users u
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            LEFT JOIN dbo.Clients cClient ON u.UserID = cClient.UserID
            LEFT JOIN dbo.Admins adm ON u.UserID = adm.UserID
            WHERE u.UserID = @SenderID
        `);
    
    const senderName = senderRes.recordset[0]?.SenderName || 'SoundSphere User';

    // 5. Create real notification for receiver
    try {
        await notificationModel.createNotification({
            userId: receiverUserId,
            type: 'Message',
            title: `New message from ${senderName}`,
            message: text.length > 80 ? `${text.substring(0, 80)}...` : text,
            relatedId: cid,
            relatedType: 'Message'
        });
    } catch (notifErr) {
        console.warn('Failed to create message notification:', notifErr.message);
    }

    return {
        messageId: newMsg.MessageID,
        conversationId: newMsg.ConversationID,
        senderId: newMsg.SenderUserID,
        receiverId: newMsg.ReceiverUserID,
        bookingId: newMsg.BookingID,
        text: newMsg.MessageText,
        sentAt: newMsg.SentAt,
        isRead: false,
        senderName,
        isMine: true
    };
};

/**
 * Get total unread messages count for a user across all conversations
 * @param {number} userId 
 * @returns {Promise<number>}
 */
const getTotalUnreadMessagesCount = async (userId) => {
    const pool = getPool();
    if (!pool) return 0;

    const result = await pool.request()
        .input('UserID', sql.Int, parseInt(userId, 10))
        .query(`
            SELECT COUNT(*) AS TotalUnread
            FROM dbo.Messages
            WHERE ReceiverUserID = @UserID AND IsRead = 0 AND IsDeleted = 0;
        `);

    return result.recordset[0] ? result.recordset[0].TotalUnread : 0;
};

module.exports = {
    findOrCreateConversation,
    getUserConversations,
    getConversationMessages,
    sendMessage,
    getTotalUnreadMessagesCount
};
