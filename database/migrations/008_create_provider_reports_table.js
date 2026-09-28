const { connectDB } = require('../../server/config/db');

async function migrateProviderReportsSchema() {
    console.log("=== [Migration 008] Creating / Verifying dbo.ProviderReports Table ===");
    let pool = await connectDB();

    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.ProviderReports', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ProviderReports (
                    ReportID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ReporterUserID INT NOT NULL,
                    ProviderID INT NOT NULL,
                    BookingID INT NULL,
                    Reason NVARCHAR(150) NOT NULL,
                    Description NVARCHAR(MAX) NOT NULL,
                    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                    AdminNotes NVARCHAR(MAX) NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    ResolvedAt DATETIME2 NULL,
                    ResolvedByAdminID INT NULL
                );
                PRINT 'Successfully created dbo.ProviderReports table.';
            END
            ELSE
            BEGIN
                -- Ensure all required columns exist in dbo.ProviderReports
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProviderReports') AND name = 'AdminNotes')
                BEGIN
                    ALTER TABLE dbo.ProviderReports ADD AdminNotes NVARCHAR(MAX) NULL;
                    PRINT 'Added AdminNotes column to dbo.ProviderReports.';
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProviderReports') AND name = 'ResolvedByAdminID')
                BEGIN
                    ALTER TABLE dbo.ProviderReports ADD ResolvedByAdminID INT NULL;
                    PRINT 'Added ResolvedByAdminID column to dbo.ProviderReports.';
                END
                PRINT 'dbo.ProviderReports table verified.';
            END
        `);
        console.log("✅ Successfully verified and migrated dbo.ProviderReports schema!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error running migration 008 (dbo.ProviderReports):", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    migrateProviderReportsSchema();
}

module.exports = migrateProviderReportsSchema;
