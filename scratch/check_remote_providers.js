const sql = require('mssql');

(async () => {
    try {
        const remotePool = await sql.connect({
            server: 'db72897.public.databaseasp.net',
            database: 'db72897',
            user: 'db72897',
            password: 'o#7C?9Bb3Ei_',
            port: 1433,
            options: { encrypt: false, trustServerCertificate: true, enableArithAbort: true }
        });

        const providers = await remotePool.request().query("SELECT ProviderID, UserID, BusinessName, OwnerName, ProfilePicture, VerificationStatus FROM dbo.ServiceProviders");
        console.log('Remote Providers:', providers.recordset);

        const users = await remotePool.request().query("SELECT UserID, Email, ProfilePicture, RoleID FROM dbo.Users");
        console.log('Remote Users:', users.recordset);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
