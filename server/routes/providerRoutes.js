/**
 * SoundSphere - Service Provider Express API Routes
 * Mount point: /api/providers
 */

const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');
const bookingController = require('../controllers/bookingController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// GET /api/providers (Public endpoint, supports ?category=...&location=...&search=...&date=...)
router.get('/', providerController.getProviders);

// Authenticated Service Provider Profile & Dashboard Stats Routes
router.get('/me', verifyToken, providerController.getProviderProfile);
router.put('/me', verifyToken, providerController.upload.single('avatarFile'), providerController.updateProviderProfile);
router.post('/me', verifyToken, providerController.upload.single('avatarFile'), providerController.updateProviderProfile);
router.get('/dashboard-stats', verifyToken, providerController.getDashboardStats);

// Services CRUD Routes
router.get('/services/list', verifyToken, providerController.getProviderServices);
router.post('/services/create', verifyToken, providerController.createProviderService);
router.put('/services/:id', verifyToken, providerController.updateProviderService);
router.delete('/services/:id', verifyToken, providerController.deleteProviderService);

// Packages CRUD Routes
router.get('/packages/list', verifyToken, providerController.getProviderPackages);
router.post('/packages/create', verifyToken, providerController.uploadPackagePhotos.array('packagePhotos', 10), providerController.createProviderPackage);
router.put('/packages/:id', verifyToken, providerController.uploadPackagePhotos.array('packagePhotos', 10), providerController.updateProviderPackage);
router.delete('/packages/photos/:imageId', verifyToken, providerController.deletePackagePhoto);
router.delete('/packages/:id', verifyToken, providerController.deleteProviderPackage);

// Bookings Routes
router.get('/my-bookings', verifyToken, providerController.getProviderBookings);
router.put('/my-bookings/:id/accept', verifyToken, providerController.acceptBooking);
router.put('/my-bookings/:id/complete', verifyToken, providerController.completeBooking);
router.put('/my-bookings/:id/cancel', verifyToken, providerController.cancelBooking);

// Withdrawals Routes
router.get('/withdrawals/list', verifyToken, providerController.getProviderWithdrawals);
router.post('/withdrawals/create', verifyToken, providerController.createWithdrawalRequest);

// Reviews Routes
router.get('/reviews/my-reviews', verifyToken, providerController.getProviderReviewsList);

// Availability & Capacity Management Routes (Authenticated for Provider Dashboard)
router.get('/calendar/schedule', verifyToken, bookingController.getProviderCalendarSchedule);
router.put('/calendar/default-capacity', verifyToken, bookingController.saveDefaultDailyCapacity);
router.post('/calendar/date-capacity', verifyToken, bookingController.saveDateCapacityOverride);
router.delete('/calendar/date-capacity/:date', verifyToken, bookingController.deleteDateCapacityOverride);
router.post('/calendar/batch-capacity', verifyToken, bookingController.saveBatchDateCapacity);
router.delete('/calendar/batch-capacity', verifyToken, bookingController.clearBatchDateCapacity);

// Availability Route (Public)
router.get('/:id/availability', bookingController.getProviderAvailability);

// GET /api/providers/:id (Public)
router.get('/:id', providerController.getProviderById);

module.exports = router;
