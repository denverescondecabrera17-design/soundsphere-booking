/**
 * SoundSphere - Database Connection Pool & Auto-Migration Seeder
 * Technology: Microsoft SQL Server (SSMS 21) via 'mssql' package
 */

const sql = require('mssql');
const bcrypt = require('bcrypt');
require('dotenv').config();

const isAzure = (process.env.DB_SERVER && process.env.DB_SERVER.toLowerCase().includes('.database.windows.net'));
const isProduction = process.env.NODE_ENV === 'production';
const shouldEncrypt = process.env.DB_ENCRYPT !== undefined 
    ? process.env.DB_ENCRYPT === 'true' 
    : (isAzure || isProduction);

const trustCert = process.env.DB_TRUST_CERT !== undefined 
    ? process.env.DB_TRUST_CERT === 'true' 
    : (!isAzure);

const dbConfig = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    server: process.env.DB_SERVER || '127.0.0.1',
    database: process.env.DB_NAME || process.env.DB_DATABASE || 'SoundSphereDB',
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: shouldEncrypt,
        trustServerCertificate: trustCert,
        enableArithAbort: true
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

let pool = null;

/**
 * Auto-Migrate Database Schema & Seed Administrator
 */
const autoSeedDatabase = async (activePool) => {
    try {
        // 0. Ensure Core Database Schema Tables Exist
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Roles', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Roles (
                    RoleID INT IDENTITY(1,1) PRIMARY KEY,
                    RoleName NVARCHAR(50) NOT NULL UNIQUE,
                    Description NVARCHAR(255) NULL
                );
            END;

            IF OBJECT_ID('dbo.Users', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Users (
                    UserID INT IDENTITY(1,1) PRIMARY KEY,
                    RoleID INT NOT NULL FOREIGN KEY REFERENCES dbo.Roles(RoleID),
                    Email NVARCHAR(255) NOT NULL UNIQUE,
                    PasswordHash NVARCHAR(255) NULL,
                    Phone NVARCHAR(20) NULL,
                    ContactNumber NVARCHAR(20) NULL,
                    ProfilePicture NVARCHAR(500) NULL,
                    EmailVerified BIT NOT NULL DEFAULT 0,
                    IsActive BIT NOT NULL DEFAULT 1,
                    AccountStatus NVARCHAR(20) NOT NULL DEFAULT 'Active',
                    ResetToken NVARCHAR(255) NULL,
                    ResetTokenExpiry DATETIME2 NULL,
                    GoogleID NVARCHAR(255) NULL,
                    FacebookID NVARCHAR(255) NULL,
                    AuthProvider NVARCHAR(50) NULL DEFAULT 'local',
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
            END;

            IF OBJECT_ID('dbo.Clients', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Clients (
                    ClientID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
                    FirstName NVARCHAR(100) NULL,
                    MiddleName NVARCHAR(100) NULL,
                    LastName NVARCHAR(100) NULL,
                    FullName NVARCHAR(200) NULL,
                    Address NVARCHAR(255) NULL,
                    ProfilePicture NVARCHAR(500) NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
            END;

            IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ServiceProviders (
                    ProviderID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
                    BusinessName NVARCHAR(255) NOT NULL,
                    OwnerName NVARCHAR(150) NULL,
                    OwnerFirstName NVARCHAR(100) NULL,
                    OwnerLastName NVARCHAR(100) NULL,
                    ContactNumber NVARCHAR(50) NULL,
                    BusinessAddress NVARCHAR(255) NULL,
                    CoverageArea NVARCHAR(255) NULL,
                    Description NVARCHAR(MAX) NULL,
                    StartingPrice DECIMAL(18,2) NULL DEFAULT 0.00,
                    ProfilePicture NVARCHAR(500) NULL,
                    BannerImage NVARCHAR(500) NULL,
                    VerificationStatus NVARCHAR(50) NOT NULL DEFAULT 'Approved',
                    Rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
                    ReviewsCount INT NOT NULL DEFAULT 0,
                    Latitude DECIMAL(10,7) NULL,
                    Longitude DECIMAL(10,7) NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
            END;

            IF OBJECT_ID('dbo.Admins', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Admins (
                    AdminID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
                    FullName NVARCHAR(150) NOT NULL,
                    Department NVARCHAR(100) NULL DEFAULT 'System Administration',
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
                );
            END;

            IF OBJECT_ID('dbo.ProviderApplications', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ProviderApplications (
                    ApplicationID INT IDENTITY(1,1) PRIMARY KEY,
                    UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
                    BusinessName NVARCHAR(255) NOT NULL,
                    OwnerName NVARCHAR(150) NULL,
                    Category NVARCHAR(100) NULL,
                    BusinessAddress NVARCHAR(255) NULL,
                    CoverageArea NVARCHAR(255) NULL,
                    ContactNumber NVARCHAR(20) NULL,
                    Description NVARCHAR(MAX) NULL,
                    StartingPrice DECIMAL(18,2) NULL DEFAULT 0.00,
                    BusinessPermitDoc NVARCHAR(255) NULL,
                    GovtIDDoc NVARCHAR(255) NULL,
                    ProfilePicture NVARCHAR(500) NULL,
                    ApplicationStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                    Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                    SubmittedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    ReviewedAt DATETIME2 NULL,
                    RejectionReason NVARCHAR(500) NULL
                );
            END;
        `);

        // 1. Ensure Roles exist
        const rolesCheck = await activePool.request().query("SELECT RoleName FROM dbo.Roles");
        const existingRoles = rolesCheck.recordset.map(r => r.RoleName);

        if (!existingRoles.includes('Administrator')) {
            await activePool.request().query("INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Administrator', 'Platform Superadmin')");
        }
        if (!existingRoles.includes('Client')) {
            await activePool.request().query("INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Client', 'Standard client account')");
        }
        if (!existingRoles.includes('ServiceProvider')) {
            await activePool.request().query("INSERT INTO dbo.Roles (RoleName, Description) VALUES ('ServiceProvider', 'Approved service provider')");
        }

        // 2. Auto-Migrate dbo.Users for EmailVerified & AccountStatus columns
        const emailVerifiedCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'EmailVerified'
        `);
        if (emailVerifiedCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD EmailVerified BIT NOT NULL DEFAULT 0");
        }

        const accountStatusCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'AccountStatus'
        `);
        if (accountStatusCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD AccountStatus NVARCHAR(20) NOT NULL DEFAULT 'Active'");
        }

        const resetTokenCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ResetToken'
        `);
        if (resetTokenCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD ResetToken NVARCHAR(255) NULL");
        }

        const resetTokenExpiryCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'ResetTokenExpiry'
        `);
        if (resetTokenExpiryCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD ResetTokenExpiry DATETIME2 NULL");
        }

        const googleIdCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'GoogleID'
        `);
        if (googleIdCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD GoogleID NVARCHAR(255) NULL");
        }

        const facebookIdCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'FacebookID'
        `);
        if (facebookIdCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD FacebookID NVARCHAR(255) NULL");
        }

        const authProviderCheck = await activePool.request().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Users' AND COLUMN_NAME = 'AuthProvider'
        `);
        if (authProviderCheck.recordset.length === 0) {
            await activePool.request().query("ALTER TABLE dbo.Users ADD AuthProvider NVARCHAR(50) NULL DEFAULT 'local'");
        }

        // Auto-Migrate dbo.PasswordResetTokens Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.PasswordResetTokens', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.PasswordResetTokens (
                    Id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    UserId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
                    TokenHash NVARCHAR(255) NOT NULL UNIQUE,
                    ExpiresAt DATETIME2 NOT NULL,
                    CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                    UsedAt DATETIME2 NULL
                );
            END;
        `);

        // Auto-Migrate dbo.Bookings Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Bookings', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Bookings (
                    BookingID INT IDENTITY(1,1) NOT NULL,
                    ClientUserID INT NOT NULL,
                    ProviderID INT NULL,
                    PackageName NVARCHAR(150) NOT NULL,
                    EventDate NVARCHAR(50) NOT NULL,
                    EventTime NVARCHAR(50) NULL,
                    Location NVARCHAR(255) NOT NULL,
                    TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
                    BookingStatus NVARCHAR(20) DEFAULT 'Confirmed' NOT NULL,
                    PaymentStatus NVARCHAR(20) DEFAULT 'Paid' NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Bookings PRIMARY KEY CLUSTERED (BookingID ASC),
                    CONSTRAINT FK_Bookings_Users FOREIGN KEY (ClientUserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // Auto-Migrate dbo.Reviews Table
        await activePool.request().query(`
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

        // Auto-Migrate dbo.Notifications Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Notifications (
                    NotificationID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    NotificationType NVARCHAR(100) NOT NULL,
                    Title NVARCHAR(255) NOT NULL,
                    Message NVARCHAR(MAX) NOT NULL,
                    RelatedID INT NULL,
                    RelatedType NVARCHAR(100) NULL,
                    IsRead BIT DEFAULT 0 NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    ReadAt DATETIME2 NULL,
                    CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (NotificationID ASC),
                    CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END

            IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Notifications') AND name = 'ReadAt')
                BEGIN
                    ALTER TABLE dbo.Notifications ADD ReadAt DATETIME2 NULL;
                END

                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Notifications_User_Read' AND object_id = OBJECT_ID('dbo.Notifications'))
                BEGIN
                    CREATE NONCLUSTERED INDEX IX_Notifications_User_Read ON dbo.Notifications (UserID, IsRead, CreatedAt DESC);
                END
            END
        `);

        // Auto-Migrate dbo.ActivityLogs Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ActivityLogs (
                    LogID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NULL,
                    Action NVARCHAR(100) NOT NULL,
                    Description NVARCHAR(500) NOT NULL,
                    EntityType NVARCHAR(50) NULL,
                    EntityID INT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_ActivityLogs PRIMARY KEY CLUSTERED (LogID ASC)
                );
            END
        `);

        // Auto-Migrate dbo.Payments Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Payments', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Payments (
                    PaymentID INT IDENTITY(1,1) NOT NULL,
                    BookingID INT NOT NULL,
                    Amount DECIMAL(18,2) NOT NULL,
                    PaymentMethod NVARCHAR(50) DEFAULT 'GCash' NOT NULL,
                    PaymentStatus NVARCHAR(20) DEFAULT 'Paid' NOT NULL,
                    TransactionReference NVARCHAR(100) NULL,
                    PaidAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Payments PRIMARY KEY CLUSTERED (PaymentID ASC),
                    CONSTRAINT FK_Payments_Bookings FOREIGN KEY (BookingID) REFERENCES dbo.Bookings(BookingID) ON DELETE CASCADE
                );
            END
        `);

        // Auto-Migrate dbo.Packages Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Packages', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Packages (
                    PackageID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    PackageName NVARCHAR(255) NOT NULL,
                    Category NVARCHAR(100) DEFAULT 'Sound & Lights' NOT NULL,
                    Price DECIMAL(18,2) NOT NULL,
                    Description NVARCHAR(MAX) NULL,
                    Inclusions NVARCHAR(MAX) NULL,
                    BannerUrl NVARCHAR(500) NULL,
                    IsActive BIT DEFAULT 1 NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Packages PRIMARY KEY CLUSTERED (PackageID ASC),
                    CONSTRAINT FK_Packages_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // Auto-Migrate dbo.Services Table
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Services', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Services (
                    ServiceID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    ServiceName NVARCHAR(255) NOT NULL,
                    Category NVARCHAR(100) DEFAULT 'Concert Audio' NOT NULL,
                    Price DECIMAL(18,2) NOT NULL,
                    Description NVARCHAR(MAX) NULL,
                    IsActive BIT DEFAULT 1 NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Services PRIMARY KEY CLUSTERED (ServiceID ASC),
                    CONSTRAINT FK_Services_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // Auto-Migrate Messaging Tables (Conversations, ConversationParticipants, Messages)
        await activePool.request().query(`
            IF OBJECT_ID('dbo.Conversations', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Conversations (
                    ConversationID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    User1ID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
                    User2ID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
                    BookingID INT NULL FOREIGN KEY REFERENCES dbo.Bookings(BookingID),
                    ApplicationID INT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    UpdatedAt DATETIME2 DEFAULT GETDATE() NOT NULL
                );

                CREATE NONCLUSTERED INDEX IX_Conversations_Users ON dbo.Conversations (User1ID, User2ID, UpdatedAt DESC);
            END;

            IF OBJECT_ID('dbo.ConversationParticipants', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ConversationParticipants (
                    ParticipantID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ConversationID INT NOT NULL FOREIGN KEY REFERENCES dbo.Conversations(ConversationID) ON DELETE CASCADE,
                    UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
                    JoinedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    LastReadAt DATETIME2 NULL
                );

                CREATE NONCLUSTERED INDEX IX_ConversationParticipants_User ON dbo.ConversationParticipants (UserID, ConversationID);
            END;

            IF OBJECT_ID('dbo.Messages', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Messages (
                    MessageID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ConversationID INT NOT NULL FOREIGN KEY REFERENCES dbo.Conversations(ConversationID) ON DELETE CASCADE,
                    SenderUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
                    ReceiverUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
                    BookingID INT NULL,
                    MessageText NVARCHAR(MAX) NOT NULL,
                    SentAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    IsRead BIT DEFAULT 0 NOT NULL,
                    ReadAt DATETIME2 NULL,
                    IsDeleted BIT DEFAULT 0 NOT NULL
                );

                CREATE NONCLUSTERED INDEX IX_Messages_Conversation ON dbo.Messages (ConversationID, SentAt ASC);
                CREATE NONCLUSTERED INDEX IX_Messages_Receiver_Unread ON dbo.Messages (ReceiverUserID, IsRead, ConversationID);
            END;
        `);

        // Seed default real packages if Packages table is empty
        const pkgCountRes = await activePool.request().query("SELECT COUNT(*) AS cnt FROM dbo.Packages");
        if (pkgCountRes.recordset[0].cnt === 0) {
            const provUsers = await activePool.request().query(`
                SELECT u.UserID, COALESCE(sp.BusinessName, pa.BusinessName, 'SoundSphere Service Provider') AS BusinessName
                FROM dbo.Users u
                LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
                LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID
                LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
                WHERE (r.RoleName = 'ServiceProvider' OR u.RoleID = 3 OR sp.VerificationStatus = 'Approved') AND u.AccountStatus = 'Active'
            `);

            for (const prov of provUsers.recordset) {
                await activePool.request()
                    .input('UserID', sql.Int, prov.UserID)
                    .input('PackageName', sql.NVarChar(255), `${prov.BusinessName} Stage Package`)
                    .input('Category', sql.NVarChar(100), 'Concert Audio & Stage Lights')
                    .input('Price', sql.Decimal(18, 2), 15000.00)
                    .input('Description', sql.NVarChar(sql.MAX), 'Full Concert Line Array Audio & 3D Moving Lights Setup with Professional Operator')
                    .input('Inclusions', sql.NVarChar(sql.MAX), '4x Line Array Speakers, 2x Subwoofers, 12x Stage Par Cans, 2x Wireless Microphones')
                    .query(`
                        INSERT INTO dbo.Packages (UserID, PackageName, Category, Price, Description, Inclusions)
                        VALUES (@UserID, @PackageName, @Category, @Price, @Description, @Inclusions)
                    `);
            }
        }

        // Database-Level Duplicate Application Protection Index & ServiceProviders Column Fixes
        await activePool.request().query(`
            IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'OwnerFirstName')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD OwnerFirstName NVARCHAR(100) NULL;
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'OwnerLastName')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD OwnerLastName NVARCHAR(100) NULL;
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'ContactNumber')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD ContactNumber NVARCHAR(50) NULL;
                END
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'ProfilePicture')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD ProfilePicture NVARCHAR(500) NULL;
                END
            END

            IF OBJECT_ID('dbo.ProviderApplications', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ProviderApplications') AND name = 'ProfilePicture')
                BEGIN
                    ALTER TABLE dbo.ProviderApplications ADD ProfilePicture NVARCHAR(500) NULL;
                END
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_ProviderApplications_ActiveUser' AND object_id = OBJECT_ID('dbo.ProviderApplications'))
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX UX_ProviderApplications_ActiveUser
                    ON dbo.ProviderApplications (UserID)
                    WHERE Status IN ('Pending', 'Approved');
                END
            END

            -- Automatic Deduplication Guard for dbo.Services & dbo.Packages
            IF OBJECT_ID('dbo.Services', 'U') IS NOT NULL
            BEGIN
                WITH CTE AS (
                    SELECT ServiceID, UserID, ServiceName, Price,
                           ROW_NUMBER() OVER (PARTITION BY UserID, LOWER(RTRIM(LTRIM(ServiceName))), Price ORDER BY ServiceID ASC) AS RowNum
                    FROM dbo.Services
                )
                DELETE FROM CTE WHERE RowNum > 1;
            END;

            IF OBJECT_ID('dbo.Packages', 'U') IS NOT NULL
            BEGIN
                WITH CTE AS (
                    SELECT PackageID, UserID, PackageName, Price,
                           ROW_NUMBER() OVER (PARTITION BY UserID, LOWER(RTRIM(LTRIM(PackageName))), Price ORDER BY PackageID ASC) AS RowNum
                    FROM dbo.Packages
                )
                DELETE FROM CTE WHERE RowNum > 1;
            END;

            IF OBJECT_ID('dbo.PackageImages', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.PackageImages (
                    ImageID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    PackageID INT NOT NULL,
                    ImageUrl NVARCHAR(500) NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT FK_PackageImages_Packages FOREIGN KEY (PackageID) REFERENCES dbo.Packages(PackageID) ON DELETE CASCADE
                );
            END;

            -- Auto-Migrate dbo.Withdrawals Table
            IF OBJECT_ID('dbo.Withdrawals', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Withdrawals (
                    WithdrawalID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ProviderID INT NULL,
                    ProviderUserID INT NULL,
                    Amount DECIMAL(18,2) NOT NULL,
                    WithdrawalMethod NVARCHAR(50) DEFAULT 'GCash' NOT NULL,
                    PayoutMethod NVARCHAR(50) DEFAULT 'GCash' NOT NULL,
                    AccountName NVARCHAR(150) NOT NULL,
                    AccountNumber NVARCHAR(100) NOT NULL,
                    AccountReference NVARCHAR(100) NULL,
                    MobileNumber NVARCHAR(50) NULL,
                    Status NVARCHAR(50) DEFAULT 'Pending' NOT NULL,
                    RequestedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    ProcessedAt DATETIME2 NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL
                );
            END;

            -- Auto-Migrate dbo.ProviderReports Table
            IF OBJECT_ID('dbo.ProviderReports', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ProviderReports (
                    ReportID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
                    ReporterUserID INT NOT NULL,
                    ProviderID INT NOT NULL,
                    BookingID INT NULL,
                    Reason NVARCHAR(150) NOT NULL,
                    Description NVARCHAR(MAX) NOT NULL,
                    ProofImage NVARCHAR(MAX) NULL,
                    Status NVARCHAR(50) DEFAULT 'Pending' NOT NULL,
                    AdminNotes NVARCHAR(MAX) NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    ResolvedAt DATETIME2 NULL,
                    ResolvedByAdminID INT NULL
                );
            END;

            IF OBJECT_ID('dbo.ProviderReports', 'U') IS NOT NULL AND COL_LENGTH('dbo.ProviderReports', 'ProofImage') IS NULL
            BEGIN
                ALTER TABLE dbo.ProviderReports ADD ProofImage NVARCHAR(MAX) NULL;
            END;

            -- Ensure dbo.ActivityLogs Description can hold up to NVARCHAR(MAX)
            IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NOT NULL
            BEGIN
                ALTER TABLE dbo.ActivityLogs ALTER COLUMN Description NVARCHAR(MAX) NOT NULL;
            END;
        `);

        // 3. Ensure Default Admin Account Exists with Updated Credentials
        const adminEmail = 'soundsphere@gmail.com';
        const adminPasswordHash = await bcrypt.hash('soundsphere@041704', 10);

        const roleRes = await activePool.request().query("SELECT RoleID FROM dbo.Roles WHERE RoleName = 'Administrator'");
        const adminRoleId = roleRes.recordset.length > 0 ? roleRes.recordset[0].RoleID : 1;

        const adminCheck = await activePool.request()
            .input('Email', sql.NVarChar(255), adminEmail)
            .input('RoleID', sql.Int, adminRoleId)
            .query("SELECT UserID FROM dbo.Users WHERE Email = @Email OR Email = 'admin@soundsphere.com' OR RoleID = @RoleID");

        if (adminCheck.recordset.length === 0) {
            const insertUserRes = await activePool.request()
                .input('RoleID', sql.Int, adminRoleId)
                .input('Email', sql.NVarChar(255), adminEmail)
                .input('PasswordHash', sql.NVarChar(255), adminPasswordHash)
                .input('Phone', sql.NVarChar(20), '09000000000')
                .input('EmailVerified', sql.Bit, 1)
                .input('IsActive', sql.Bit, 1)
                .input('AccountStatus', sql.NVarChar(20), 'Active')
                .query(`
                    INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, EmailVerified, IsActive, AccountStatus)
                    OUTPUT INSERTED.UserID
                    VALUES (@RoleID, @Email, @PasswordHash, @Phone, @EmailVerified, @IsActive, @AccountStatus)
                `);

            const adminUserId = insertUserRes.recordset[0].UserID;
            await activePool.request()
                .input('UserID', sql.Int, adminUserId)
                .input('FullName', sql.NVarChar(150), 'SoundSphere Administrator')
                .query("INSERT INTO dbo.Admins (UserID, FullName) VALUES (@UserID, @FullName)");

            console.log(' Admin account automatically created: soundsphere@gmail.com');
        } else {
            // Update existing Admin account Email, PasswordHash, EmailVerified flag
            const adminUserId = adminCheck.recordset[0].UserID;
            await activePool.request()
                .input('UserID', sql.Int, adminUserId)
                .input('Email', sql.NVarChar(255), adminEmail)
                .input('PasswordHash', sql.NVarChar(255), adminPasswordHash)
                .query("UPDATE dbo.Users SET Email = @Email, PasswordHash = @PasswordHash, EmailVerified = 1, IsActive = 1, AccountStatus = 'Active' WHERE UserID = @UserID");

            console.log(' Admin account credentials updated: soundsphere@gmail.com');
        }

        // 4. Ensure Default Service Provider Test Account Exists
        const provEmail = 'provider@soundsphere.com';
        const provPasswordHash = await bcrypt.hash('Provider@123', 10);
        const provRoleRes = await activePool.request().query("SELECT RoleID FROM dbo.Roles WHERE RoleName = 'ServiceProvider'");
        const provRoleId = provRoleRes.recordset.length > 0 ? provRoleRes.recordset[0].RoleID : 2;

        const provCheck = await activePool.request()
            .input('Email', sql.NVarChar(255), provEmail)
            .query("SELECT UserID FROM dbo.Users WHERE Email = @Email");

        if (provCheck.recordset.length === 0) {
            const insertProvRes = await activePool.request()
                .input('RoleID', sql.Int, provRoleId)
                .input('Email', sql.NVarChar(255), provEmail)
                .input('PasswordHash', sql.NVarChar(255), provPasswordHash)
                .input('Phone', sql.NVarChar(20), '09171234567')
                .input('EmailVerified', sql.Bit, 1)
                .input('IsActive', sql.Bit, 1)
                .input('AccountStatus', sql.NVarChar(20), 'Active')
                .query(`
                    INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, EmailVerified, IsActive, AccountStatus)
                    OUTPUT INSERTED.UserID
                    VALUES (@RoleID, @Email, @PasswordHash, @Phone, @EmailVerified, @IsActive, @AccountStatus)
                `);

            const provUserId = insertProvRes.recordset[0].UserID;
            await activePool.request()
                .input('UserID', sql.Int, provUserId)
                .input('BusinessName', sql.NVarChar(255), 'SoundSphere Pro Audio & Lighting')
                .input('Category', sql.NVarChar(100), 'Sound & Lights')
                .input('VerificationStatus', sql.NVarChar(50), 'Approved')
                .query(`
                    IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.ServiceProviders (UserID, BusinessName, ServiceCategory, VerificationStatus)
                        VALUES (@UserID, @BusinessName, @Category, @VerificationStatus);
                    END
                `);
            console.log(' Service Provider test account created: provider@soundsphere.com');
        }

        // 5. Ensure Default Client Test Account Exists
        const clientEmail = 'client@soundsphere.com';
        const clientPasswordHash = await bcrypt.hash('Client@123', 10);
        const clientRoleRes = await activePool.request().query("SELECT RoleID FROM dbo.Roles WHERE RoleName = 'Client'");
        const clientRoleId = clientRoleRes.recordset.length > 0 ? clientRoleRes.recordset[0].RoleID : 3;

        const clientCheck = await activePool.request()
            .input('Email', sql.NVarChar(255), clientEmail)
            .query("SELECT UserID FROM dbo.Users WHERE Email = @Email");

        if (clientCheck.recordset.length === 0) {
            const insertClientRes = await activePool.request()
                .input('RoleID', sql.Int, clientRoleId)
                .input('Email', sql.NVarChar(255), clientEmail)
                .input('PasswordHash', sql.NVarChar(255), clientPasswordHash)
                .input('Phone', sql.NVarChar(20), '09181234567')
                .input('EmailVerified', sql.Bit, 1)
                .input('IsActive', sql.Bit, 1)
                .input('AccountStatus', sql.NVarChar(20), 'Active')
                .query(`
                    INSERT INTO dbo.Users (RoleID, Email, PasswordHash, Phone, EmailVerified, IsActive, AccountStatus)
                    OUTPUT INSERTED.UserID
                    VALUES (@RoleID, @Email, @PasswordHash, @Phone, @EmailVerified, @IsActive, @AccountStatus)
                `);

            const clientUserId = insertClientRes.recordset[0].UserID;
            await activePool.request()
                .input('UserID', sql.Int, clientUserId)
                .input('FirstName', sql.NVarChar(100), 'Denver')
                .input('LastName', sql.NVarChar(100), 'Cabrera')
                .query(`
                    IF OBJECT_ID('dbo.Clients', 'U') IS NOT NULL
                    BEGIN
                        INSERT INTO dbo.Clients (UserID, FirstName, LastName)
                        VALUES (@UserID, @FirstName, @LastName);
                    END
                `);
            console.log(' Client test account created: client@soundsphere.com');
        }
    } catch (err) {
        console.warn(' Auto-seed check notice:', err.message);
    }
};

/**
 * Initialize connection pool to Microsoft SQL Server
 */
const connectDB = async () => {
    try {
        if (!pool) {
            try {
                pool = await sql.connect(dbConfig);
            } catch (err) {
                console.warn(`Primary DB host (${dbConfig.server}) failed:`, err.message);
                if (!process.env.DB_SERVER || process.env.DB_SERVER === '127.0.0.1' || process.env.DB_SERVER === 'localhost') {
                    console.warn('Attempting 127.0.0.1 fallback...');
                    const fallbackConfig = { ...dbConfig, server: '127.0.0.1' };
                    pool = await sql.connect(fallbackConfig);
                } else {
                    throw err;
                }
            }
            console.log(' Microsoft SQL Server connected successfully:', dbConfig.database);
            await autoSeedDatabase(pool);
        }
        return pool;
    } catch (error) {
        console.error(' Database connection error:', error.message);
        if (process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.RENDER_SERVICE_ID) {
            console.error(' ⚠️ RENDER PRODUCTION NOTICE: Make sure DB_SERVER, DB_USER, DB_PASSWORD, DB_NAME, and DB_ENCRYPT=true are configured under Environment Variables in your Render Dashboard.');
        }
        return null;
    }
};

const getPool = () => {
    if (!pool || !pool.connected) {
        return null;
    }
    return pool;
};

const getOrConnectPool = async () => {
    if (pool && pool.connected) {
        return pool;
    }
    return await connectDB();
};

module.exports = {
    sql,
    connectDB,
    getPool,
    getOrConnectPool
};
