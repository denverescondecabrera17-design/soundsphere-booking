const { connectDB } = require('../server/config/db');

async function setupWalletSchema() {
    console.log('--- SETTING UP CLIENT WALLET & REFUND SCHEMA ---');
    const pool = await connectDB();
    if (!pool) {
        console.error('Cannot connect to DB');
        process.exit(1);
    }

    try {
        // 1. dbo.ClientWallets table
        await pool.request().query(`
            IF OBJECT_ID('dbo.ClientWallets', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ClientWallets (
                    WalletID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL UNIQUE,
                    Balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT FK_ClientWallets_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
                PRINT 'Created dbo.ClientWallets table';
            END
        `);

        // 2. dbo.WalletTransactions table
        await pool.request().query(`
            IF OBJECT_ID('dbo.WalletTransactions', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.WalletTransactions (
                    TransactionID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    Amount DECIMAL(18,2) NOT NULL,
                    TransactionType NVARCHAR(50) NOT NULL, -- 'REFUND_CREDIT', 'REFUND_PAYOUT_REQUEST', 'REFUND_PAYOUT_APPROVED', 'REFUND_PAYOUT_REJECTED'
                    Description NVARCHAR(500) NOT NULL,
                    BalanceAfter DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    RelatedBookingID INT NULL,
                    BookingReference NVARCHAR(50) NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    CONSTRAINT FK_WalletTransactions_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
                PRINT 'Created dbo.WalletTransactions table';
            END
        `);

        // 3. dbo.RefundRequests table (for Cashier to review and manually disburse)
        await pool.request().query(`
            IF OBJECT_ID('dbo.RefundRequests', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.RefundRequests (
                    RefundRequestID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL,
                    ClientName NVARCHAR(200) NOT NULL,
                    ClientEmail NVARCHAR(150) NULL,
                    ClientPhone NVARCHAR(50) NULL,
                    Amount DECIMAL(18,2) NOT NULL,
                    PayoutMethod NVARCHAR(50) NOT NULL, -- 'GCash', 'Maya', 'Bank Transfer'
                    AccountName NVARCHAR(150) NOT NULL,
                    AccountNumber NVARCHAR(100) NOT NULL,
                    Status NVARCHAR(30) NOT NULL DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected'
                    ReferenceNumber NVARCHAR(100) NULL, -- Cashier's payment reference
                    AdminNotes NVARCHAR(500) NULL,
                    RequestedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    ProcessedAt DATETIME2 NULL,
                    ProcessedBy INT NULL,
                    CONSTRAINT FK_RefundRequests_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
                PRINT 'Created dbo.RefundRequests table';
            END
        `);

        // 4. Ensure UserID 1 has a ClientWallet and check if cancelled booking 32 needs refund credit
        const walletCheck = await pool.request()
            .input('UID', 1)
            .query(`SELECT * FROM dbo.ClientWallets WHERE UserID = @UID;`);

        if (walletCheck.recordset.length === 0) {
            await pool.request()
                .input('UID', 1)
                .input('Bal', 378.00) // Initial refund for cancelled booking SS-2026-00018
                .query(`
                    INSERT INTO dbo.ClientWallets (UserID, Balance, CreatedAt, UpdatedAt)
                    VALUES (@UID, @Bal, GETDATE(), GETDATE());
                `);

            await pool.request()
                .input('UID', 1)
                .input('Amt', 378.00)
                .input('Type', 'REFUND_CREDIT')
                .input('Desc', 'Automatic refund for cancelled booking (Ref: SS-2026-00018)')
                .input('BalAfter', 378.00)
                .input('BID', 32)
                .input('BRef', 'SS-2026-00018')
                .query(`
                    INSERT INTO dbo.WalletTransactions (UserID, Amount, TransactionType, Description, BalanceAfter, RelatedBookingID, BookingReference, CreatedAt)
                    VALUES (@UID, @Amt, @Type, @Desc, @BalAfter, @BID, @BRef, GETDATE());
                `);
            console.log('Initialized UserID 1 wallet with ₱378.00 from cancelled booking SS-2026-00018');
        }

        console.log('✓ Wallet and Refund schema successfully configured!');
    } catch (err) {
        console.error('Schema setup error:', err);
    }
    process.exit(0);
}

setupWalletSchema();
