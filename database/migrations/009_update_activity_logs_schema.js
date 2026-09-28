const { connectDB } = require('../../server/config/db');

async function migrateActivityLogsSchema() {
    console.log("=== [Migration 009] Updating dbo.ActivityLogs Table Schema ===");
    let pool = await connectDB();

    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ActivityLogs (
                    LogID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    UserID INT NULL,
                    Action NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(MAX) NOT NULL,
                    EntityType NVARCHAR(50) NULL,
                    EntityID INT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
                PRINT 'Successfully created dbo.ActivityLogs table.';
            END
            ELSE
            BEGIN
                -- Ensure Description is NVARCHAR(MAX) to handle long event notes
                ALTER TABLE dbo.ActivityLogs ALTER COLUMN Description NVARCHAR(MAX) NOT NULL;
                PRINT 'Altered dbo.ActivityLogs.Description to NVARCHAR(MAX).';

                -- Ensure CreatedAt column exists
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ActivityLogs') AND name = 'CreatedAt')
                BEGIN
                    IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ActivityLogs') AND name = 'Timestamp')
                    BEGIN
                        ALTER TABLE dbo.ActivityLogs ADD CreatedAt DATETIME2 NULL;
                        EXEC('UPDATE dbo.ActivityLogs SET CreatedAt = Timestamp WHERE CreatedAt IS NULL;');
                    END
                    ELSE
                    BEGIN
                        ALTER TABLE dbo.ActivityLogs ADD CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE();
                    END
                    PRINT 'Ensured CreatedAt column on dbo.ActivityLogs.';
                END
                PRINT 'dbo.ActivityLogs schema verified.';
            END
        `);
        console.log("✅ Successfully verified and migrated dbo.ActivityLogs schema!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error running migration 009 (dbo.ActivityLogs):", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    migrateActivityLogsSchema();
}

module.exports = migrateActivityLogsSchema;
