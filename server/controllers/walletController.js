/**
 * SoundSphere - Wallet & Client Refund Controller
 */

const walletService = require('../services/walletService');

/**
 * GET /api/wallet/my-wallet
 */
const getMyWallet = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.query.userId || 1);
        const data = await walletService.getWalletDetails(userId);
        return res.status(200).json({ success: true, data });
    } catch (err) {
        console.error('Get My Wallet Error:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * POST /api/wallet/request-refund
 */
const requestRefundPayout = async (req, res) => {
    try {
        const user = req.user || {};
        const userId = user.userId || user.id || user.UserID || req.body.userId || 1;
        const { amount, payoutMethod, accountName, accountNumber, notes, clientName, clientEmail, clientPhone } = req.body;

        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, message: 'Please specify a valid amount.' });
        }
        if (!accountName || !accountNumber) {
            return res.status(400).json({ success: false, message: 'Account Name and Account Number are required.' });
        }

        const result = await walletService.requestRefundPayout({
            userId,
            amount,
            payoutMethod: payoutMethod || 'GCash',
            accountName,
            accountNumber,
            notes,
            clientName: clientName || user.fullName || user.email || 'Verified Client',
            clientEmail: clientEmail || user.email || null,
            clientPhone: clientPhone || user.phone || null
        });

        return res.status(200).json({
            success: true,
            message: `Refund payout request for ₱${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} has been sent to the Cashier.`,
            data: result
        });
    } catch (err) {
        console.error('Request Refund Payout Error:', err);
        return res.status(400).json({ success: false, message: err.message });
    }
};

module.exports = {
    getMyWallet,
    requestRefundPayout
};
