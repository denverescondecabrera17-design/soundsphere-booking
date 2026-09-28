const { connectDB, getPool } = require('../server/config/db');

(async () => {
    await connectDB();
    const pool = getPool();

    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Withdrawals')
        BEGIN
            CREATE TABLE dbo.Withdrawals (
                WithdrawalID INT IDENTITY(1,1) PRIMARY KEY,
                ProviderID INT NOT NULL,
                Amount DECIMAL(18,2) NOT NULL,
                PayoutMethod NVARCHAR(50) NOT NULL,
                AccountName NVARCHAR(150) NULL,
                AccountReference NVARCHAR(100) NOT NULL,
                Status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
                RequestedAt DATETIME DEFAULT GETDATE(),
                ProcessedAt DATETIME NULL,
                AdminNotes NVARCHAR(500) NULL
            );
            PRINT 'dbo.Withdrawals table created successfully.';
        END
        ELSE
        BEGIN
            PRINT 'dbo.Withdrawals table already exists.';
        END
    `);

    console.log('dbo.Withdrawals setup completed.');
    process.exit(0);
})();
