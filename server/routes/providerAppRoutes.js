/**
 * SoundSphere - Service Provider Application Routes (Client Role)
 */

const express = require('express');
const router = express.Router();
const providerAppController = require('../controllers/providerAppController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Client Endpoints for Provider Application
router.post('/', verifyToken, authorizeRoles('Client'), providerAppController.submitApplication);
router.get('/my-application', verifyToken, providerAppController.getMyApplication);

module.exports = router;
