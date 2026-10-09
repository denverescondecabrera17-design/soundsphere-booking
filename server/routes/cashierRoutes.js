/**
 * SoundSphere - Cashier Routes
 * Manages provider withdrawal disbursements and income reporting
 */

const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');
const cashierController = require('../controllers/cashierController');

// All Cashier routes require valid JWT & Cashier or Admin Role
router.use(verifyToken, authorizeRoles('Cashier', 'Administrator', 'Admin'));

// Summary KPIs
router.get('/summary', cashierController.getCashierSummary);

// Withdrawal Payout Management
router.get('/withdrawals/list', cashierController.getCashierWithdrawals);
router.get('/withdrawals/:id/paymongo-verify', cashierController.verifyWithdrawalPayMongo);
router.put('/withdrawals/:id/approve', cashierController.approveWithdrawalRequest);
router.put('/withdrawals/:id/reject', cashierController.rejectWithdrawalRequest);

// Income Reports (Daily, Weekly, Monthly, Yearly)
router.get('/reports/income', cashierController.getIncomeReport);

// Revenue Reports & Financial Analytics
router.get('/revenue-summary', cashierController.getCashierRevenueSummary);

// Subscription Payments Management
router.get('/subscriptions/overview', cashierController.getCashierSubscriptionsOverview);
router.post('/subscriptions/record-payment', cashierController.recordCashierSubscriptionPayment);

module.exports = router;
