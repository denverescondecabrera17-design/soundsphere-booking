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
        const agApp = await remotePool.request().query("SELECT * FROM dbo.ProviderApplications WHERE UserID = 40 OR BusinessName LIKE '%AG%'");
        if (agApp.recordset.length > 0) {
            for (const [k, v] of Object.entries(agApp.recordset[0])) {
                console.log(`${k}:`, typeof v === 'string' && v.length > 80 ? v.substring(0, 80) + '...' : v);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
