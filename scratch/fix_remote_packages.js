const sql = require('mssql');

const remoteConfig = {
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
};

(async () => {
    try {
        const pool = await sql.connect(remoteConfig);
        console.log('Connected to MonsterASP db72897!');

        const cols = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Packages'");
        console.log('Columns in Packages:', cols.recordset.map(c => c.COLUMN_NAME));

        const hasCol = cols.recordset.some(c => c.COLUMN_NAME === 'AdditionalDayPercentage');
        if (!hasCol) {
            console.log('Adding AdditionalDayPercentage to dbo.Packages...');
            await pool.request().query("ALTER TABLE dbo.Packages ADD AdditionalDayPercentage DECIMAL(5,2) DEFAULT 20.00");
            await pool.request().query("UPDATE dbo.Packages SET AdditionalDayPercentage = 20.00 WHERE AdditionalDayPercentage IS NULL");
            console.log('Successfully added AdditionalDayPercentage column!');
        } else {
            console.log('AdditionalDayPercentage already exists.');
        }

        // Check PackageImages table
        const imgTable = await pool.request().query("SELECT OBJECT_ID('dbo.PackageImages', 'U') AS id");
        console.log('PackageImages table exists:', imgTable.recordset[0].id != null);

        // Test querying Package 17
        const pkg = await pool.request().query("SELECT PackageID, PackageName, Price, AdditionalDayPercentage FROM dbo.Packages WHERE PackageID = 17");
        console.log('Package 17:', pkg.recordset);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
