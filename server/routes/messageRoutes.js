/**
 * SoundSphere - Messaging API Routes
 * Mount point: /api/messages
 */

const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// GET /api/messages/conversations - List conversations
router.get('/conversations', messageController.getConversations);

// POST /api/messages/conversations - Find or create 1-to-1 conversation
router.post('/conversations', messageController.startConversation);

// GET /api/messages/conversations/:conversationId - Get thread messages
router.get('/conversations/:conversationId', messageController.getMessages);

// POST /api/messages/send - Send new message
router.post('/send', messageController.sendMessage);

// GET /api/messages/unread-count - Get total unread messages count
router.get('/unread-count', messageController.getUnreadCount);

module.exports = router;
