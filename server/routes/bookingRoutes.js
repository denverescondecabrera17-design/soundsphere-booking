/**
 * SoundSphere - Booking & Review API Routes
 * Endpoints for Bookings, Packages, Maps Config, Payments, and Availability
 */

const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { mapsConfig } = require('../config/mapsConfig');
const { verifyToken, optionalVerifyToken } = require('../middleware/authMiddleware');

// Package lookup endpoints
router.get('/packages/:id', bookingController.getPackageById);

// Availability & Schedule endpoints
router.get('/transportation-fees', bookingController.getTransportationFees);
router.post('/check-availability', bookingController.checkAvailability);
router.get('/providers/:id/availability', bookingController.getProviderAvailability);

// Booking CRUD endpoints
router.post('/', verifyToken, bookingController.createBooking);
router.get('/my-bookings', optionalVerifyToken, bookingController.getMyBookings);
router.get('/client-bookings', optionalVerifyToken, bookingController.getMyBookings);
router.get('/provider-bookings', optionalVerifyToken, bookingController.getProviderBookings);

// ID lookup route dispatcher (Handles GET /api/packages/:id and GET /api/bookings/:id)
router.post('/:id/cancel', optionalVerifyToken, bookingController.cancelBooking);
router.get('/:id', (req, res, next) => {
    if (req.baseUrl && req.baseUrl.includes('packages')) {
        return bookingController.getPackageById(req, res, next);
    }
    return bookingController.getBookingDetails(req, res, next);
});

// Payment endpoints
router.post('/payments', verifyToken, bookingController.createPayment);
router.post('/paymongo/checkout', optionalVerifyToken, bookingController.createPayMongoCheckout);
router.post('/payments/paymongo/checkout', optionalVerifyToken, bookingController.createPayMongoCheckout);
router.get('/payments/:bookingId', bookingController.getPaymentsByBookingId);

// Review Endpoints
router.post('/reviews', verifyToken, bookingController.submitReview);

module.exports = router;
