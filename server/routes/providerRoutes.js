/**
 * SoundSphere - Service Provider Express API Routes
 * Mount point: /api/providers
 */

const express = require('express');
const router = express.Router();
const providerController = require('../controllers/providerController');

// GET /api/providers (Supports ?category=...&location=...&search=...&date=...)
router.get('/', providerController.getProviders);

// Authenticated Service Provider Profile & Dashboard Stats Routes
router.get('/me', providerController.getProviderProfile);
router.put('/me', providerController.upload.single('avatarFile'), providerController.updateProviderProfile);
router.post('/me', providerController.upload.single('avatarFile'), providerController.updateProviderProfile);
router.get('/dashboard-stats', providerController.getDashboardStats);

// Services CRUD Routes
router.get('/services/list', providerController.getProviderServices);
router.post('/services/create', providerController.createProviderService);
router.put('/services/:id', providerController.updateProviderService);
router.delete('/services/:id', providerController.deleteProviderService);

// Packages CRUD Routes
router.get('/packages/list', providerController.getProviderPackages);
router.post('/packages/create', providerController.uploadPackagePhotos.array('packagePhotos', 10), providerController.createProviderPackage);
router.put('/packages/:id', providerController.uploadPackagePhotos.array('packagePhotos', 10), providerController.updateProviderPackage);
router.delete('/packages/photos/:imageId', providerController.deletePackagePhoto);
router.delete('/packages/:id', providerController.deleteProviderPackage);

// Bookings Routes
router.get('/my-bookings', providerController.getProviderBookings);
router.put('/my-bookings/:id/accept', providerController.acceptBooking);
router.put('/my-bookings/:id/complete', providerController.completeBooking);
router.put('/my-bookings/:id/cancel', providerController.cancelBooking);

// Withdrawals Routes
router.get('/withdrawals/list', providerController.getProviderWithdrawals);
router.post('/withdrawals/create', providerController.createWithdrawalRequest);

// Reviews Routes
router.get('/reviews/my-reviews', providerController.getProviderReviewsList);

// GET /api/providers/:id
router.get('/:id', providerController.getProviderById);

module.exports = router;
