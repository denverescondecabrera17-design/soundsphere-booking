const sql = require('mssql');
const { connectDB } = require('../server/config/db');

(async () => {
    try {
        console.log('1. Cleaning Localhost DB...');
        const localPool = await connectDB();
        await localPool.request().query(`
            UPDATE dbo.ProviderSubscriptions
            SET PlanName = 'Monthly Plan'
            WHERE PlanName LIKE '%Monthly%';

            UPDATE dbo.ProviderSubscriptions
            SET PlanName = 'Yearly Plan'
            WHERE PlanName LIKE '%Yearly%' OR PlanName LIKE '%Annual%';

            UPDATE dbo.SubscriptionPayments
            SET PlanName = 'Monthly Plan'
            WHERE PlanName LIKE '%Monthly%';

            UPDATE dbo.SubscriptionPayments
            SET PlanName = 'Yearly Plan'
            WHERE PlanName LIKE '%Yearly%' OR PlanName LIKE '%Annual%';
        `);
        console.log('✅ Localhost DB updated.');

        console.log('2. Cleaning Remote MonsterASP DB...');
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

        await remotePool.request().query(`
            UPDATE dbo.ProviderSubscriptions
            SET PlanName = 'Monthly Plan'
            WHERE PlanName LIKE '%Monthly%';

            UPDATE dbo.ProviderSubscriptions
            SET PlanName = 'Yearly Plan'
            WHERE PlanName LIKE '%Yearly%' OR PlanName LIKE '%Annual%';

            UPDATE dbo.SubscriptionPayments
            SET PlanName = 'Monthly Plan'
            WHERE PlanName LIKE '%Monthly%';

            UPDATE dbo.SubscriptionPayments
            SET PlanName = 'Yearly Plan'
            WHERE PlanName LIKE '%Yearly%' OR PlanName LIKE '%Annual%';
        `);
        console.log('✅ Remote MonsterASP DB updated.');

        const checkLocal = await localPool.request().query('SELECT SubscriptionID, PlanName FROM dbo.ProviderSubscriptions WHERE ProviderID = 1');
        console.log('Local Subscriptions now:', checkLocal.recordset);

        const checkRemote = await remotePool.request().query('SELECT SubscriptionID, PlanName FROM dbo.ProviderSubscriptions WHERE ProviderID = 1');
        console.log('Remote Subscriptions now:', checkRemote.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Error cleaning plan names:', err);
        process.exit(1);
    }
})();
