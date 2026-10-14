const { connectDB } = require('../server/config/db');

(async () => {
    try {
        const pool = await connectDB();
        const updateRes = await pool.request().query(`
            UPDATE dbo.ProviderSubscriptions
            SET 
                PlanName = 'Monthly Plan',
                Price = 199.00,
                StartDate = GETDATE(),
                EndDate = DATEADD(DAY, 30, GETDATE()),
                Status = 'Active',
                UpdatedAt = GETDATE()
            WHERE SubscriptionID = 3;
        `);

        console.log('Update rows affected:', updateRes.rowsAffected);

        const checkRes = await pool.request().query(`
            SELECT 
                SubscriptionID,
                ProviderID,
                PlanName,
                Price,
                Status,
                StartDate,
                EndDate,
                DATEDIFF(DAY, GETDATE(), EndDate) AS DaysRemaining
            FROM dbo.ProviderSubscriptions
            WHERE SubscriptionID = 3;
        `);

        console.log('Updated Subscription:', checkRes.recordset[0]);
        process.exit(0);
    } catch (err) {
        console.error('Error updating subscription:', err);
        process.exit(1);
    }
})();
