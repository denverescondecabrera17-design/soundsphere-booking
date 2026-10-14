const sql = require('mssql');

(async () => {
    try {
        const remotePool = await sql.connect({
            server: 'db72897.public.databaseasp.net',
            database: 'db72897',
            user: 'db72897',
            password: 'o#7C?9Bb3Ei_',
            port: 1433,
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        });

        console.log('Connected to Remote MonsterASP DB.');

        // 1. Delete the "Over-the-Counter Cash" record from dbo.SubscriptionPayments
        const delPayRes = await remotePool.request().query(`
            DELETE FROM dbo.SubscriptionPayments 
            WHERE PaymentMethod = 'Over-the-Counter Cash' 
               OR PayMongoSessionID LIKE 'CASHIER-CASH-TEST%'
               OR PaymentID = 3;
        `);
        console.log('Deleted Remote SubscriptionPayments rows:', delPayRes.rowsAffected);

        // 2. Delete test subscription #3 from dbo.ProviderSubscriptions
        const delSubRes = await remotePool.request().query(`
            DELETE FROM dbo.ProviderSubscriptions 
            WHERE SubscriptionID = 3 
               OR PayMongoSessionID LIKE 'CASHIER-CASH-TEST%';
        `);
        console.log('Deleted Remote ProviderSubscriptions rows:', delSubRes.rowsAffected);

        // 3. Ensure Subscription #2 is active with clean 30 days (Nov 13, 2026)
        const updateSub2 = await remotePool.request().query(`
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
        console.log('Updated Remote Subscription #2 rows:', updateSub2.rowsAffected);

        // 4. Verify remaining subscriptions and payments
        const subs = await remotePool.request().query('SELECT * FROM dbo.ProviderSubscriptions WHERE ProviderID = 1');
        console.log('Current Remote Provider Subscriptions:', subs.recordset);

        const payments = await remotePool.request().query('SELECT * FROM dbo.SubscriptionPayments WHERE ProviderID = 1');
        console.log('Current Remote Subscription Payments:', payments.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Remote DB error:', err);
        process.exit(1);
    }
})();
