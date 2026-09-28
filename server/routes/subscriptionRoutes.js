/**
 * SoundSphere - Service Provider Subscriptions & Admin Monitoring Routes
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// ==========================================
// 1. Service Provider Subscription Endpoints
// ==========================================
// Requires valid JWT with ServiceProvider role
router.get('/my-subscription', verifyToken, authorizeRoles('ServiceProvider'), subscriptionController.getMySubscription);
router.get('/me', verifyToken, authorizeRoles('ServiceProvider'), subscriptionController.getMySubscription);
router.post('/free-trial', verifyToken, authorizeRoles('ServiceProvider'), subscriptionController.activateFreeTrial);
router.post('/checkout', verifyToken, authorizeRoles('ServiceProvider'), subscriptionController.createSubscriptionCheckout);
router.post('/confirm', verifyToken, authorizeRoles('ServiceProvider'), subscriptionController.confirmSubscriptionPayment);
router.post('/confirm-payment', verifyToken, authorizeRoles('ServiceProvider'), subscriptionController.confirmSubscriptionPayment);

// ==========================================
// 2. Administrator Direct Monitoring Endpoint
// ==========================================
// Requires valid JWT with Administrator role
router.get('/admin/overview', verifyToken, authorizeRoles('Administrator'), subscriptionController.getAdminSubscriptionsOverview);

module.exports = router;
