const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { optionalVerifyToken } = require('../middleware/authMiddleware');

router.get('/my-wallet', optionalVerifyToken, walletController.getMyWallet);
router.post('/request-refund', optionalVerifyToken, walletController.requestRefundPayout);

module.exports = router;
