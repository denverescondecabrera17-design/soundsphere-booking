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
        const subs = await remotePool.request().query('SELECT * FROM dbo.ProviderSubscriptions WHERE ProviderID = 1');
        console.log('Remote Subscriptions:', subs.recordset);

        const payments = await remotePool.request().query('SELECT * FROM dbo.SubscriptionPayments WHERE ProviderID = 1');
        console.log('Remote Subscription Payments:', payments.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Remote DB error:', err);
        process.exit(1);
    }
})();
