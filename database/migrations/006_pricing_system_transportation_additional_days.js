const { connectDB } = require('../../server/config/db');

async function migratePricingAndTransportationSchema() {
    console.log("=== Updating SQL Server Database for Dynamic Pricing & Transportation Fees ===");
    let pool = await connectDB();

    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.Packages', 'U') IS NOT NULL
            BEGIN
                -- Add AdditionalDayPercentage column to Packages table if missing
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Packages') AND name = 'AdditionalDayPercentage')
                BEGIN
                    ALTER TABLE dbo.Packages ADD AdditionalDayPercentage DECIMAL(5,2) DEFAULT 20.00;
                    EXEC('UPDATE dbo.Packages SET AdditionalDayPercentage = 20.00 WHERE AdditionalDayPercentage IS NULL;');
                    PRINT 'Added AdditionalDayPercentage column to dbo.Packages';
                END
            END

            IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NOT NULL
            BEGIN
                -- Add Latitude column to ServiceProviders table if missing
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'Latitude')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD Latitude DECIMAL(10,7) NULL;
                    PRINT 'Added Latitude column to dbo.ServiceProviders';
                END

                -- Add Longitude column to ServiceProviders table if missing
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'Longitude')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD Longitude DECIMAL(10,7) NULL;
                    PRINT 'Added Longitude column to dbo.ServiceProviders';
                END
            END

            IF OBJECT_ID('dbo.Bookings', 'U') IS NOT NULL
            BEGIN
                -- Add AdditionalDayCharges column to Bookings table if missing
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'AdditionalDayCharges')
                BEGIN
                    ALTER TABLE dbo.Bookings ADD AdditionalDayCharges DECIMAL(18,2) DEFAULT 0.00;
                    PRINT 'Added AdditionalDayCharges column to dbo.Bookings';
                END

                -- Add TransportationFee column to Bookings table if missing
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'TransportationFee')
                BEGIN
                    ALTER TABLE dbo.Bookings ADD TransportationFee DECIMAL(18,2) DEFAULT 0.00;
                    PRINT 'Added TransportationFee column to dbo.Bookings';
                END

                -- Add DistanceKm column to Bookings table if missing
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'DistanceKm')
                BEGIN
                    ALTER TABLE dbo.Bookings ADD DistanceKm DECIMAL(10,2) DEFAULT 0.00;
                    PRINT 'Added DistanceKm column to dbo.Bookings';
                END
            END

            -- Create dbo.TransportationFees table if missing
            IF OBJECT_ID('dbo.TransportationFees', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.TransportationFees (
                    FeeID INT IDENTITY(1,1) PRIMARY KEY,
                    MinDistanceKm DECIMAL(10,2) NOT NULL,
                    MaxDistanceKm DECIMAL(10,2) NOT NULL,
                    ServiceFee DECIMAL(18,2) NOT NULL,
                    IsActive BIT DEFAULT 1,
                    CreatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'Created dbo.TransportationFees table';

                -- Populate standard default distance-based fee tiers
                INSERT INTO dbo.TransportationFees (MinDistanceKm, MaxDistanceKm, ServiceFee, IsActive)
                VALUES 
                (0.00, 10.00, 500.00, 1),
                (10.01, 20.00, 750.00, 1),
                (20.01, 30.00, 1000.00, 1),
                (30.01, 40.00, 1250.00, 1),
                (40.01, 50.00, 1500.00, 1),
                (50.01, 999.00, 2000.00, 1);

                PRINT 'Seeded default distance fee tiers in dbo.TransportationFees';
            END
        `);

        console.log("✅ Dynamic Pricing & Transportation Fees Database Migration Completed Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error executing migration 006:", err.message);
        process.exit(1);
    }
}

migratePricingAndTransportationSchema();
