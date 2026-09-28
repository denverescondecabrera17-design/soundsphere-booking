const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SoundSphereDB',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function migrateAllTables() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server DB.');

        // 1. Ensure dbo.ServiceProviders columns
        const spCols = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'ServiceProviders'
        `);
        const existingSpCols = spCols.recordset.map(c => c.COLUMN_NAME);

        if (!existingSpCols.includes('ApplicationID')) await pool.request().query("ALTER TABLE dbo.ServiceProviders ADD ApplicationID INT NULL");
        if (!existingSpCols.includes('OwnerFirstName')) await pool.request().query("ALTER TABLE dbo.ServiceProviders ADD OwnerFirstName NVARCHAR(100) NULL");
        if (!existingSpCols.includes('OwnerLastName')) await pool.request().query("ALTER TABLE dbo.ServiceProviders ADD OwnerLastName NVARCHAR(100) NULL");
        if (!existingSpCols.includes('OwnerName')) await pool.request().query("ALTER TABLE dbo.ServiceProviders ADD OwnerName NVARCHAR(150) NULL");
        if (!existingSpCols.includes('CoverageArea')) await pool.request().query("ALTER TABLE dbo.ServiceProviders ADD CoverageArea NVARCHAR(255) NULL");

        // 2. Ensure dbo.Clients columns
        const clientCols = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clients'
        `);
        const existingClientCols = clientCols.recordset.map(c => c.COLUMN_NAME);
        if (!existingClientCols.includes('MiddleName')) await pool.request().query("ALTER TABLE dbo.Clients ADD MiddleName NVARCHAR(100) NULL");

        // 3. Ensure dbo.Users columns
        const userCols = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Users'
        `);
        const existingUserCols = userCols.recordset.map(c => c.COLUMN_NAME);
        if (!existingUserCols.includes('ProfilePicture')) await pool.request().query("ALTER TABLE dbo.Users ADD ProfilePicture NVARCHAR(500) NULL");

        // 4. Ensure dbo.Bookings table exists & has all module columns
        await pool.request().query(`
            IF OBJECT_ID('dbo.Bookings', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Bookings (
                    BookingID INT IDENTITY(1,1) NOT NULL,
                    BookingReference NVARCHAR(50) NULL,
                    ClientUserID INT NOT NULL,
                    ProviderID INT NULL,
                    PackageID INT NULL,
                    PackageName NVARCHAR(150) NOT NULL,
                    EventName NVARCHAR(200) NULL,
                    EventType NVARCHAR(100) NULL,
                    EventDate NVARCHAR(50) NOT NULL,
                    StartTime NVARCHAR(50) NULL,
                    EndTime NVARCHAR(50) NULL,
                    NumberOfHours DECIMAL(10,2) NOT NULL DEFAULT 0.00,
                    NumberOfDays INT NOT NULL DEFAULT 1,
                    EventPlace NVARCHAR(100) NULL,
                    VenueName NVARCHAR(200) NULL,
                    EventAddress NVARCHAR(500) NULL,
                    EventLatitude DECIMAL(10,7) NULL,
                    EventLongitude DECIMAL(10,7) NULL,
                    LocationNotes NVARCHAR(500) NULL,
                    Location NVARCHAR(255) NULL,
                    PackagePrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    PaymentType NVARCHAR(30) NOT NULL DEFAULT 'downpayment',
                    AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    RemainingBalance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    CommissionRate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
                    CommissionAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    ProviderEarnings DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    BookingStatus NVARCHAR(30) DEFAULT 'Pending' NOT NULL,
                    PaymentStatus NVARCHAR(30) DEFAULT 'Pending' NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    UpdatedAt DATETIME2 NULL,
                    CONSTRAINT PK_Bookings PRIMARY KEY CLUSTERED (BookingID ASC),
                    CONSTRAINT FK_Bookings_Users FOREIGN KEY (ClientUserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);
        console.log('✅ Checked/Created dbo.Bookings table');

        // Alter Bookings table if columns missing
        const bkCols = await pool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Bookings'
        `);
        const existingBkCols = bkCols.recordset.map(c => c.COLUMN_NAME);

        const addBkCols = [
            { name: 'BookingReference', type: 'NVARCHAR(50) NULL' },
            { name: 'PackageID', type: 'INT NULL' },
            { name: 'EventName', type: 'NVARCHAR(200) NULL' },
            { name: 'EventType', type: 'NVARCHAR(100) NULL' },
            { name: 'StartTime', type: 'NVARCHAR(50) NULL' },
            { name: 'EndTime', type: 'NVARCHAR(50) NULL' },
            { name: 'NumberOfHours', type: 'DECIMAL(10,2) NOT NULL DEFAULT 0.00' },
            { name: 'NumberOfDays', type: 'INT NOT NULL DEFAULT 1' },
            { name: 'EventPlace', type: 'NVARCHAR(100) NULL' },
            { name: 'VenueName', type: 'NVARCHAR(200) NULL' },
            { name: 'EventAddress', type: 'NVARCHAR(500) NULL' },
            { name: 'EventLatitude', type: 'DECIMAL(10,7) NULL' },
            { name: 'EventLongitude', type: 'DECIMAL(10,7) NULL' },
            { name: 'LocationNotes', type: 'NVARCHAR(500) NULL' },
            { name: 'PackagePrice', type: 'DECIMAL(18,2) NOT NULL DEFAULT 0.00' },
            { name: 'PaymentType', type: "NVARCHAR(30) NOT NULL DEFAULT 'downpayment'" },
            { name: 'AmountPaid', type: 'DECIMAL(18,2) NOT NULL DEFAULT 0.00' },
            { name: 'RemainingBalance', type: 'DECIMAL(18,2) NOT NULL DEFAULT 0.00' },
            { name: 'CommissionRate', type: 'DECIMAL(5,2) NOT NULL DEFAULT 5.00' },
            { name: 'CommissionAmount', type: 'DECIMAL(18,2) NOT NULL DEFAULT 0.00' },
            { name: 'ProviderEarnings', type: 'DECIMAL(18,2) NOT NULL DEFAULT 0.00' },
            { name: 'UpdatedAt', type: 'DATETIME2 NULL' }
        ];

        for (const col of addBkCols) {
            if (!existingBkCols.includes(col.name)) {
                await pool.request().query(`ALTER TABLE dbo.Bookings ADD ${col.name} ${col.type}`);
                console.log(`✅ Added ${col.name} to dbo.Bookings`);
            }
        }

        // 5. Ensure dbo.Payments table exists
        await pool.request().query(`
            IF OBJECT_ID('dbo.Payments', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Payments (
                    PaymentID INT IDENTITY(1,1) NOT NULL,
                    BookingID INT NOT NULL,
                    ClientUserID INT NOT NULL,
                    ProviderID INT NOT NULL,
                    PackageID INT NULL,
                    PaymentType NVARCHAR(30) NOT NULL DEFAULT 'downpayment',
                    Amount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    TransactionReference NVARCHAR(100) NULL,
                    PaymentStatus NVARCHAR(30) NOT NULL DEFAULT 'Pending',
                    PaymentDate DATETIME2 NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Payments PRIMARY KEY CLUSTERED (PaymentID ASC),
                    CONSTRAINT FK_Payments_Bookings FOREIGN KEY (BookingID) REFERENCES dbo.Bookings(BookingID) ON DELETE CASCADE
                );
            END
        `);
        console.log('✅ Checked/Created dbo.Payments table');

        // 6. Ensure dbo.Reviews table exists
        await pool.request().query(`
            IF OBJECT_ID('dbo.Reviews', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Reviews (
                    ReviewID INT IDENTITY(1,1) NOT NULL,
                    BookingID INT NOT NULL,
                    UserID INT NOT NULL,
                    ProviderID INT NULL,
                    Rating INT NOT NULL DEFAULT 5,
                    ReviewText NVARCHAR(1000) NOT NULL,
                    SubmittedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Reviews PRIMARY KEY CLUSTERED (ReviewID ASC),
                    CONSTRAINT FK_Reviews_Bookings FOREIGN KEY (BookingID) REFERENCES dbo.Bookings(BookingID) ON DELETE CASCADE,
                    CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
                );
            END
        `);

        // 7. Ensure dbo.Notifications table exists
        await pool.request().query(`
            IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Notifications (
                    NotificationID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    NotificationType NVARCHAR(50) NOT NULL,
                    Title NVARCHAR(150) NOT NULL,
                    Message NVARCHAR(500) NOT NULL,
                    RelatedID INT NULL,
                    RelatedType NVARCHAR(50) NULL,
                    IsRead BIT DEFAULT 0 NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (NotificationID ASC),
                    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);
        console.log('✅ Checked/Created dbo.Notifications table');

        console.log('🎉 Database Schema Migration Completed Successfully!');
        await pool.close();
    } catch (err) {
        console.error('Migration error:', err.message);
    }
}

migrateAllTables();
