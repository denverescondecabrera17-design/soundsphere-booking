/**
 * SoundSphere - Administrator Operations Routes
 */

const express = require('express');
const router = express.Router();
const providerAppController = require('../controllers/providerAppController');
const adminController = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// All Admin routes require valid JWT & Administrator Role
router.use(verifyToken, authorizeRoles('Administrator'));

// Admin Dashboard Stats & Audit Logs Endpoint
router.get('/stats', adminController.getAdminStats);

// Admin Profile Endpoints
router.get('/profile', adminController.getAdminProfile);
router.put('/profile', adminController.updateAdminProfile);

// Admin Multi-Entity Live Search Endpoint
router.get('/search', adminController.searchAdminEntities);

// Admin Provider Status Management Endpoints
router.post('/providers/:id/suspend', adminController.suspendProvider);
router.post('/providers/:id/reactivate', adminController.reactivateProvider);

// Admin Business Permit Monitoring & Renewal Endpoints
router.get('/permits', adminController.getAdminPermits);
router.post('/permits/:id/send-notice', adminController.sendPermitNotice);
router.post('/permits/:id/review', adminController.reviewPermitRenewal);
router.post('/permits/:id/review-renewal', adminController.reviewPermitRenewal);

// Admin Applications Review & Approval Endpoints
router.get('/applications', providerAppController.getPendingApplications);
router.post('/applications/:id/approve', providerAppController.approveApplication);
router.post('/applications/:id/reject', providerAppController.rejectApplication);

// Admin Escrow & Provider Payout Release Endpoints
router.get('/escrow/list', adminController.getEscrowList);
router.put('/escrow/:id/release', adminController.releaseEscrowPayout);
router.get('/withdrawals/list', adminController.getAdminWithdrawals);
router.put('/withdrawals/:id/approve', adminController.approveWithdrawalRequest);
router.get('/payments/overview', adminController.getPaymentsOverview);

// Admin Audit Trail Endpoint
router.get('/audit-logs', adminController.getAdminAuditLogs);

// Admin Client Reports Against Service Providers Endpoints
router.get('/reports', adminController.getAdminClientReports);
router.put('/reports/:id/status', adminController.updateReportStatus);

// Admin Real-Time Operational Notifications Endpoints
router.get('/notifications', adminController.getAdminNotifications);
router.put('/notifications/read-all', adminController.markAllAdminNotificationsRead);
router.put('/notifications/:id/read', adminController.markAdminNotificationRead);

// Admin Detailed Booking Overview Endpoint
router.get('/bookings/:id', adminController.getAdminBookingDetails);

module.exports = router;


