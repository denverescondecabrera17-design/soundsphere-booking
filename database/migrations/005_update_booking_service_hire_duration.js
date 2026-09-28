const { connectDB } = require('../../server/config/db');

async function updateBookingSchema() {
    console.log("=== Updating dbo.Bookings Schema for Service Start Date, End Date & Hire Duration ===");
    let pool = await connectDB();

    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.Bookings', 'U') IS NOT NULL
            BEGIN
                -- Add ServiceStartDate if not exists
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'ServiceStartDate')
                BEGIN
                    ALTER TABLE dbo.Bookings ADD ServiceStartDate NVARCHAR(50) NULL;
                    EXEC('UPDATE dbo.Bookings SET ServiceStartDate = EventDate WHERE ServiceStartDate IS NULL;');
                END

                -- Add ServiceEndDate if not exists
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'ServiceEndDate')
                BEGIN
                    ALTER TABLE dbo.Bookings ADD ServiceEndDate NVARCHAR(50) NULL;
                    EXEC('UPDATE dbo.Bookings SET ServiceEndDate = EventDate WHERE ServiceEndDate IS NULL;');
                END

                -- Add ServiceHireDays if not exists
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'ServiceHireDays')
                BEGIN
                    ALTER TABLE dbo.Bookings ADD ServiceHireDays INT NULL;
                    EXEC('UPDATE dbo.Bookings SET ServiceHireDays = ISNULL(NumberOfDays, 1) WHERE ServiceHireDays IS NULL;');
                END
            END
        `);
        console.log("✅ Successfully updated dbo.Bookings table with ServiceStartDate, ServiceEndDate, and ServiceHireDays!");
        process.exit(0);
    } catch (err) {
        console.error("Error updating dbo.Bookings schema:", err.message);
        process.exit(1);
    }
}

updateBookingSchema();
