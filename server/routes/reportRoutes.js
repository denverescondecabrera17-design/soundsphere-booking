/**
 * SoundSphere - Report Routes
 * API endpoints for client reports against service providers
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { optionalVerifyToken } = require('../middleware/authMiddleware');

// POST /api/reports/provider - Submit a report against a provider
router.post('/provider', optionalVerifyToken, reportController.createProviderReport);

// GET /api/reports/my-reports - View reports submitted by logged-in client
router.get('/my-reports', optionalVerifyToken, reportController.getMyReports);

module.exports = router;
