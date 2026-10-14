const { connectDB } = require('../server/config/db');

(async () => {
    try {
        const pool = await connectDB();

        // 1. Delete the "Over-the-Counter Cash" record from dbo.SubscriptionPayments
        const delPayRes = await pool.request().query(`
            DELETE FROM dbo.SubscriptionPayments 
            WHERE PaymentMethod = 'Over-the-Counter Cash' 
               OR PayMongoSessionID LIKE 'CASHIER-CASH-TEST%'
               OR PaymentID = 3;
        `);
        console.log('Deleted SubscriptionPayments rows:', delPayRes.rowsAffected);

        // 2. Delete test subscription #3 from dbo.ProviderSubscriptions
        const delSubRes = await pool.request().query(`
            DELETE FROM dbo.ProviderSubscriptions 
            WHERE SubscriptionID = 3 
               OR PayMongoSessionID LIKE 'CASHIER-CASH-TEST%';
        `);
        console.log('Deleted ProviderSubscriptions rows:', delSubRes.rowsAffected);

        // 3. Ensure Subscription #2 is active with clean 30 days (Nov 13, 2026)
        const updateSub2 = await pool.request().query(`
            UPDATE dbo.ProviderSubscriptions
            SET 
                PlanName = 'Monthly Plan (₱199)',
                Price = 199.00,
                Status = 'Active',
                StartDate = GETDATE(),
                EndDate = DATEADD(DAY, 30, GETDATE()),
                UpdatedAt = GETDATE()
            WHERE SubscriptionID = 2;
        `);
        console.log('Updated Subscription #2 rows:', updateSub2.rowsAffected);

        // 4. Verify remaining subscriptions and payments
        const subs = await pool.request().query('SELECT * FROM dbo.ProviderSubscriptions WHERE ProviderID = 1');
        console.log('Current Provider Subscriptions:', subs.recordset);

        const payments = await pool.request().query('SELECT * FROM dbo.SubscriptionPayments WHERE ProviderID = 1');
        console.log('Current Subscription Payments:', payments.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Error removing over the counter cash:', err);
        process.exit(1);
    }
})();
