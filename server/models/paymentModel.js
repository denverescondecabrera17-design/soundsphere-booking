/**
 * SoundSphere - Payment Data Access Model
 * Manages SQL Server operations for Payments
 */

const { getPool, sql } = require('../config/db');

/**
 * Create a new Payment record in dbo.Payments
 */
const createPayment = async ({ bookingId, paymentMethod, amount, transactionReference, paymentStatus }, transaction = null) => {
    const request = transaction ? transaction.request() : getPool().request();

    const result = await request
        .input('BookingID', sql.Int, bookingId)
        .input('Amount', sql.Decimal(18, 2), amount || 0)
        .input('PaymentMethod', sql.NVarChar(50), paymentMethod || 'PayMongo')
        .input('PaymentStatus', sql.NVarChar(20), paymentStatus || 'Paid')
        .input('TransactionReference', sql.NVarChar(100), transactionReference || null)
        .query(`
            INSERT INTO dbo.Payments
            (BookingID, Amount, PaymentMethod, PaymentStatus, TransactionReference, PaidAt, CreatedAt)
            OUTPUT INSERTED.PaymentID, INSERTED.BookingID, INSERTED.Amount, INSERTED.PaymentMethod, INSERTED.PaymentStatus, INSERTED.CreatedAt
            VALUES
            (@BookingID, @Amount, @PaymentMethod, @PaymentStatus, @TransactionReference, GETDATE(), GETDATE());
        `);

    return result.recordset[0];
};

/**
 * Get Payments for a specific BookingID
 */
const getPaymentsByBookingId = async (bookingId) => {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
            SELECT * FROM dbo.Payments
            WHERE BookingID = @BookingID
            ORDER BY PaymentID ASC;
        `);

    return result.recordset;
};

module.exports = {
    createPayment,
    getPaymentsByBookingId
};
