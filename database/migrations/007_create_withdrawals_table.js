const { connectDB } = require('../../server/config/db');

async function migrateWithdrawalsSchema() {
    console.log("=== [Migration 007] Creating / Verifying dbo.Withdrawals Table ===");
    let pool = await connectDB();

    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.Withdrawals', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Withdrawals (
                    WithdrawalID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ProviderID INT NOT NULL,
                    Amount DECIMAL(18, 2) NOT NULL,
                    PayoutChannel NVARCHAR(50) NOT NULL DEFAULT 'GCash',
                    AccountName NVARCHAR(150) NOT NULL,
                    AccountNumber NVARCHAR(100) NOT NULL,
                    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                    Notes NVARCHAR(MAX) NULL,
                    PayMongoPayoutID NVARCHAR(100) NULL,
                    RequestedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    ProcessedAt DATETIME2 NULL,
                    ProcessedByAdminID INT NULL
                );
                PRINT 'Successfully created dbo.Withdrawals table.';
            END
            ELSE
            BEGIN
                -- Ensure all required columns exist in dbo.Withdrawals
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Withdrawals') AND name = 'PayMongoPayoutID')
                BEGIN
                    ALTER TABLE dbo.Withdrawals ADD PayMongoPayoutID NVARCHAR(100) NULL;
                    PRINT 'Added PayMongoPayoutID column to dbo.Withdrawals.';
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Withdrawals') AND name = 'Notes')
                BEGIN
                    ALTER TABLE dbo.Withdrawals ADD Notes NVARCHAR(MAX) NULL;
                    PRINT 'Added Notes column to dbo.Withdrawals.';
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Withdrawals') AND name = 'ProcessedByAdminID')
                BEGIN
                    ALTER TABLE dbo.Withdrawals ADD ProcessedByAdminID INT NULL;
                    PRINT 'Added ProcessedByAdminID column to dbo.Withdrawals.';
                END
                PRINT 'dbo.Withdrawals table verified.';
            END
        `);
        console.log("✅ Successfully verified and migrated dbo.Withdrawals schema!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error running migration 007 (dbo.Withdrawals):", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    migrateWithdrawalsSchema();
}

module.exports = migrateWithdrawalsSchema;
