/**
 * SoundSphere - Migration 010: Create Provider Subscriptions & Payments Tables
 * Manages provider subscription plans: Free Trial (₱0 for 1st month), Monthly (₱199), Yearly (₱1,990)
 * Integrates with PayMongo payment records and Admin monitoring.
 */

const { connectDB } = require('../../server/config/db');

async function migrateSubscriptionsSchema() {
    console.log("=== [Migration 010] Creating / Verifying Provider Subscriptions & Payments Schema ===");
    let pool;
    try {
        pool = await connectDB();
        if (!pool) {
            throw new Error('Failed to connect to Microsoft SQL Server pool.');
        }

        // 1. Create dbo.ProviderSubscriptions Table
        await pool.request().query(`
            IF OBJECT_ID('dbo.ProviderSubscriptions', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ProviderSubscriptions (
                    SubscriptionID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ProviderID INT NOT NULL,
                    UserID INT NOT NULL,
                    PlanType NVARCHAR(50) NOT NULL DEFAULT 'free_trial', -- 'free_trial', 'monthly', 'yearly'
                    PlanName NVARCHAR(100) NOT NULL DEFAULT 'Free Trial (1st Month)',
                    Price DECIMAL(18, 2) NOT NULL DEFAULT 0.00,
                    BillingCycle NVARCHAR(50) NOT NULL DEFAULT '30_days', -- '30_days', 'monthly', 'yearly'
                    Status NVARCHAR(50) NOT NULL DEFAULT 'Active', -- 'Active', 'Expired', 'Cancelled'
                    StartDate DATETIME2 NOT NULL DEFAULT GETDATE(),
                    EndDate DATETIME2 NOT NULL,
                    HasUsedFreeTrial BIT NOT NULL DEFAULT 0,
                    PayMongoSessionID NVARCHAR(150) NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
                PRINT 'Successfully created dbo.ProviderSubscriptions table.';
            END
            ELSE
            BEGIN
                PRINT 'dbo.ProviderSubscriptions table already exists.';
            END;

            -- Create Index for fast lookup by ProviderID and UserID
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_ProviderSubscriptions_Provider' AND object_id = OBJECT_ID('dbo.ProviderSubscriptions'))
            BEGIN
                CREATE NONCLUSTERED INDEX IX_ProviderSubscriptions_Provider ON dbo.ProviderSubscriptions (ProviderID, Status);
                PRINT 'Created IX_ProviderSubscriptions_Provider index.';
            END;
        `);

        // 2. Create dbo.SubscriptionPayments Table
        await pool.request().query(`
            IF OBJECT_ID('dbo.SubscriptionPayments', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.SubscriptionPayments (
                    PaymentID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    SubscriptionID INT NOT NULL FOREIGN KEY REFERENCES dbo.ProviderSubscriptions(SubscriptionID) ON DELETE CASCADE,
                    ProviderID INT NOT NULL,
                    PlanType NVARCHAR(50) NOT NULL,
                    PlanName NVARCHAR(100) NOT NULL,
                    Amount DECIMAL(18, 2) NOT NULL,
                    Currency NVARCHAR(10) NOT NULL DEFAULT 'PHP',
                    PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'PayMongo',
                    PayMongoSessionID NVARCHAR(150) NULL,
                    PayMongoPaymentID NVARCHAR(150) NULL,
                    PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Paid', -- 'Paid', 'Pending', 'Failed'
                    PaymentDate DATETIME2 NOT NULL DEFAULT GETDATE(),
                    Notes NVARCHAR(MAX) NULL
                );
                PRINT 'Successfully created dbo.SubscriptionPayments table.';
            END
            ELSE
            BEGIN
                PRINT 'dbo.SubscriptionPayments table already exists.';
            END;

            -- Create Index for fast lookup in admin monitoring
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_SubscriptionPayments_Date' AND object_id = OBJECT_ID('dbo.SubscriptionPayments'))
            BEGIN
                CREATE NONCLUSTERED INDEX IX_SubscriptionPayments_Date ON dbo.SubscriptionPayments (PaymentDate DESC, PaymentStatus);
                PRINT 'Created IX_SubscriptionPayments_Date index.';
            END;
        `);

        console.log("✅ Successfully verified and executed Migration 010 (Provider Subscriptions & Payments)!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error executing Migration 010:", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    migrateSubscriptionsSchema();
}

module.exports = { migrateSubscriptionsSchema };
