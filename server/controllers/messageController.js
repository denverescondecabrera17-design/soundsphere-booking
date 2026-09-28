/**
 * SoundSphere - Messaging API Controller
 * Handles conversation listing, creation, message retrieval, and sending
 */

const messageModel = require('../models/messageModel');
const { getPool, sql } = require('../config/db');

/**
 * GET /api/messages/conversations
 * Retrieve all conversations for the authenticated user
 */
const getConversations = async (req, res) => {
    try {
        const userId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User ID required.'
            });
        }

        const conversations = await messageModel.getUserConversations(userId);

        return res.status(200).json({
            success: true,
            conversations
        });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve conversations.',
            error: error.message
        });
    }
};

/**
 * POST /api/messages/conversations
 * Find existing or create a new 1-to-1 conversation
 */
const startConversation = async (req, res) => {
    try {
        const authUserId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null) || req.body.userId;
        let { recipientUserId, providerId, bookingId, applicationId } = req.body;

        if (!authUserId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User ID required.'
            });
        }

        // If providerId was passed instead of recipientUserId, resolve UserID from dbo.ServiceProviders
        if (!recipientUserId && providerId) {
            const pool = getPool();
            const pId = parseInt(providerId, 10);

            // Check ServiceProviders by ProviderID or UserID
            const provRes = await pool.request()
                .input('PID', sql.Int, pId)
                .query(`
                    SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @PID OR UserID = @PID
                    UNION
                    SELECT UserID FROM dbo.Packages WHERE UserID = @PID
                `);

            if (provRes.recordset.length > 0) {
                recipientUserId = provRes.recordset[0].UserID;
            } else {
                recipientUserId = pId; // Fallback assume providerId is UserID
            }
        }

        if (!recipientUserId) {
            return res.status(400).json({
                success: false,
                message: 'Recipient user ID or Provider ID is required.'
            });
        }

        if (parseInt(authUserId, 10) === parseInt(recipientUserId, 10)) {
            return res.status(400).json({
                success: false,
                message: 'You cannot start a conversation with yourself.'
            });
        }

        const conversation = await messageModel.findOrCreateConversation({
            user1Id: authUserId,
            user2Id: recipientUserId,
            bookingId,
            applicationId
        });

        return res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Error starting conversation:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to start conversation.',
            error: error.message
        });
    }
};

/**
 * GET /api/messages/conversations/:conversationId
 * Get all messages for a specific conversation and mark as read
 */
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User ID required.'
            });
        }

        const messages = await messageModel.getConversationMessages({
            conversationId,
            userId
        });

        return res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(error.message.includes('Access denied') ? 403 : 500).json({
            success: false,
            message: error.message || 'Failed to retrieve messages.'
        });
    }
};

/**
 * POST /api/messages/send
 * Send a message in a conversation
 */
const sendMessage = async (req, res) => {
    try {
        const { conversationId, messageText, bookingId } = req.body;
        const senderUserId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null) || req.body.userId;

        if (!senderUserId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User ID required.'
            });
        }

        if (!conversationId || !messageText) {
            return res.status(400).json({
                success: false,
                message: 'Conversation ID and message text are required.'
            });
        }

        const message = await messageModel.sendMessage({
            conversationId,
            senderUserId,
            messageText,
            bookingId
        });

        // Emit Socket.IO real-time event if available on req.app
        const io = req.app.get('io');
        if (io) {
            io.to(`conversation_${conversationId}`).emit('new_message', message);
            io.to(`user_${message.receiverId}`).emit('new_message_notification', message);
        }

        return res.status(201).json({
            success: true,
            message
        });
    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(error.message.includes('Access denied') ? 403 : 500).json({
            success: false,
            message: error.message || 'Failed to send message.'
        });
    }
};

/**
 * GET /api/messages/unread-count
 * Get total unread messages count for authenticated user
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized. User ID required.'
            });
        }

        const unreadCount = await messageModel.getTotalUnreadMessagesCount(userId);

        return res.status(200).json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve unread message count.'
        });
    }
};

module.exports = {
    getConversations,
    startConversation,
    getMessages,
    sendMessage,
    getUnreadCount
};
