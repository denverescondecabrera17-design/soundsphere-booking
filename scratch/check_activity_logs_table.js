const { connectDB } = require('../server/config/db');

async function checkActivityLogsTable() {
    let pool = await connectDB();
    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ActivityLogs (
                    LogID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NULL,
                    Action NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(500) NOT NULL,
                    EntityType NVARCHAR(50) NULL,
                    EntityID INT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
                PRINT 'Created dbo.ActivityLogs table';
            END
        `);
        console.log('✓ dbo.ActivityLogs table is ready in SQL Server.');
    } catch (e) {
        console.error('Error verifying ActivityLogs table:', e.message);
    }
}
checkActivityLogsTable();
