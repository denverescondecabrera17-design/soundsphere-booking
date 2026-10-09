const { sql, connectDB } = require('../server/config/db');

async function setupCapacity() {
    try {
        const pool = await connectDB();
        console.log('Connected to DB');

        // Check columns of ServiceProviders
        const provCols = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ServiceProviders'
        `);
        const colNames = provCols.recordset.map(r => r.COLUMN_NAME);
        console.log('ServiceProviders columns:', colNames);

        if (!colNames.includes('MaxDailyBookings')) {
            console.log('Adding MaxDailyBookings to ServiceProviders...');
            await pool.request().query(`
                ALTER TABLE dbo.ServiceProviders ADD MaxDailyBookings INT DEFAULT 1 WITH VALUES;
            `);
            console.log('MaxDailyBookings added.');
        } else {
            console.log('MaxDailyBookings already exists in ServiceProviders.');
        }

        // Check if ProviderDateCapacity table exists
        const tableCheck = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ProviderDateCapacity'
        `);

        if (tableCheck.recordset.length === 0) {
            console.log('Creating ProviderDateCapacity table...');
            await pool.request().query(`
                CREATE TABLE dbo.ProviderDateCapacity (
                    CapacityID INT IDENTITY(1,1) PRIMARY KEY,
                    ProviderID INT NOT NULL,
                    SpecificDate NVARCHAR(50) NOT NULL, -- Stored as YYYY-MM-DD string or DATE
                    MaxBookings INT NOT NULL DEFAULT 1, -- 0 = Blocked/Closed, >0 = specific limit
                    Notes NVARCHAR(255) NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE(),
                    UpdatedAt DATETIME2 DEFAULT GETDATE(),
                    CONSTRAINT UQ_ProviderDate UNIQUE (ProviderID, SpecificDate)
                );
            `);
            console.log('ProviderDateCapacity table created.');
        } else {
            console.log('ProviderDateCapacity table already exists.');
        }

        console.log('Setup finished successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Setup error:', err);
        process.exit(1);
    }
}

setupCapacity();
