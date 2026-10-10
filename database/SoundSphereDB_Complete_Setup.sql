-- ============================================================================
-- SoundSphere Lights & Sounds Booking System
-- Database Setup & Complete Relational Schema Script
-- DBMS: Microsoft SQL Server (SSMS 18 / 19 / 20 / 21, Azure SQL, LocalDB)
-- Database Name: SoundSphereDB
-- 
-- INSTRUCTIONS FOR SQL SERVER MANAGEMENT STUDIO (SSMS):
-- 1. Open SQL Server Management Studio (SSMS) and connect to your SQL Server instance.
-- 2. Open this file (File -> Open -> File... -> SoundSphereDB_Complete_Setup.sql).
-- 3. Click 'Execute' (or press F5).
-- 4. The script is completely idempotent: safe to run on fresh or existing databases!
-- ============================================================================

IF DB_ID('SoundSphereDB') IS NULL
BEGIN
    PRINT 'Creating database SoundSphereDB...';
    CREATE DATABASE SoundSphereDB;
END;
GO

USE SoundSphereDB;
GO

PRINT '=== INITIALIZING / MIGRATING SOUNDSPHEREDB SCHEMA ===';
GO

-- ============================================================================
-- 1. dbo.Roles Table
-- ============================================================================
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RoleID INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL
    );
    PRINT 'Created table: dbo.Roles';
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Administrator')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Administrator', 'Platform Superadmin');
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Client')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Client', 'Standard client account');
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'ServiceProvider')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('ServiceProvider', 'Approved service provider');
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = 'Cashier')
    INSERT INTO dbo.Roles (RoleName, Description) VALUES ('Cashier', 'Finance and Cashier Staff');
GO

-- ============================================================================
-- 2. dbo.Users Table
-- ============================================================================
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
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NULL
    );
    PRINT 'Created table: dbo.Users';
END;
GO

-- Migrations for dbo.Users columns
IF COL_LENGTH('dbo.Users', 'EmailVerified') IS NULL ALTER TABLE dbo.Users ADD EmailVerified BIT NOT NULL DEFAULT 0;
IF COL_LENGTH('dbo.Users', 'AccountStatus') IS NULL ALTER TABLE dbo.Users ADD AccountStatus NVARCHAR(20) NOT NULL DEFAULT 'Active';
IF COL_LENGTH('dbo.Users', 'ResetToken') IS NULL ALTER TABLE dbo.Users ADD ResetToken NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Users', 'ResetTokenExpiry') IS NULL ALTER TABLE dbo.Users ADD ResetTokenExpiry DATETIME2 NULL;
IF COL_LENGTH('dbo.Users', 'GoogleID') IS NULL ALTER TABLE dbo.Users ADD GoogleID NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Users', 'FacebookID') IS NULL ALTER TABLE dbo.Users ADD FacebookID NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Users', 'AuthProvider') IS NULL ALTER TABLE dbo.Users ADD AuthProvider NVARCHAR(50) NULL DEFAULT 'local';
IF COL_LENGTH('dbo.Users', 'ProfilePicture') IS NULL ALTER TABLE dbo.Users ADD ProfilePicture NVARCHAR(500) NULL;
GO

-- ============================================================================
-- 3. dbo.Clients Table
-- ============================================================================
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
    PRINT 'Created table: dbo.Clients';
END;
GO

-- ============================================================================
-- 4. dbo.ServiceProviders Table
-- ============================================================================
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
        MaxDailyBookings INT NOT NULL DEFAULT 1,
        PermitExpiryDate DATE NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.ServiceProviders';
END;
GO

-- Migrations for dbo.ServiceProviders
IF COL_LENGTH('dbo.ServiceProviders', 'OwnerFirstName') IS NULL ALTER TABLE dbo.ServiceProviders ADD OwnerFirstName NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.ServiceProviders', 'OwnerLastName') IS NULL ALTER TABLE dbo.ServiceProviders ADD OwnerLastName NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.ServiceProviders', 'ContactNumber') IS NULL ALTER TABLE dbo.ServiceProviders ADD ContactNumber NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.ServiceProviders', 'ProfilePicture') IS NULL ALTER TABLE dbo.ServiceProviders ADD ProfilePicture NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.ServiceProviders', 'MaxDailyBookings') IS NULL ALTER TABLE dbo.ServiceProviders ADD MaxDailyBookings INT NOT NULL DEFAULT 1;
IF COL_LENGTH('dbo.ServiceProviders', 'PermitExpiryDate') IS NULL ALTER TABLE dbo.ServiceProviders ADD PermitExpiryDate DATE NULL;
GO

-- ============================================================================
-- 5. dbo.Admins Table
-- ============================================================================
IF OBJECT_ID('dbo.Admins', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Admins (
        AdminID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        FullName NVARCHAR(150) NOT NULL,
        Department NVARCHAR(100) NULL DEFAULT 'System Administration',
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.Admins';
END;
GO

-- ============================================================================
-- 6. dbo.ProviderApplications Table
-- ============================================================================
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
        PermitIssuedDate DATE NULL,
        PermitExpiryDate DATE NULL,
        GovtID_Url NVARCHAR(MAX) NULL,
        GovtID_Back_Url NVARCHAR(MAX) NULL,
        BusinessPermit_Url NVARCHAR(MAX) NULL,
        ApplicationStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        SubmittedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ReviewedAt DATETIME2 NULL,
        RejectionReason NVARCHAR(500) NULL
    );
    PRINT 'Created table: dbo.ProviderApplications';
END;
GO

-- ============================================================================
-- 7. dbo.Packages & dbo.PackageImages Tables
-- ============================================================================
IF OBJECT_ID('dbo.Packages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Packages (
        PackageID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        PackageName NVARCHAR(255) NOT NULL,
        Category NVARCHAR(100) NOT NULL DEFAULT 'Sound & Lights',
        Price DECIMAL(18,2) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        Inclusions NVARCHAR(MAX) NULL,
        BannerUrl NVARCHAR(500) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.Packages';
END;
GO

IF OBJECT_ID('dbo.PackageImages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PackageImages (
        ImageID INT IDENTITY(1,1) PRIMARY KEY,
        PackageID INT NOT NULL FOREIGN KEY REFERENCES dbo.Packages(PackageID) ON DELETE CASCADE,
        ImageUrl NVARCHAR(500) NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.PackageImages';
END;
GO

-- ============================================================================
-- 8. dbo.Services Table
-- ============================================================================
IF OBJECT_ID('dbo.Services', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Services (
        ServiceID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        ServiceName NVARCHAR(255) NOT NULL,
        Category NVARCHAR(100) NOT NULL DEFAULT 'Concert Audio',
        Price DECIMAL(18,2) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.Services';
END;
GO

-- ============================================================================
-- 9. dbo.Bookings Table
-- ============================================================================
IF OBJECT_ID('dbo.Bookings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bookings (
        BookingID INT IDENTITY(1,1) PRIMARY KEY,
        ClientUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        ProviderID INT NULL,
        BookingReference NVARCHAR(50) NULL,
        PackageID INT NULL,
        PackageName NVARCHAR(150) NOT NULL,
        EventName NVARCHAR(150) NULL,
        EventType NVARCHAR(100) NULL,
        EventDate NVARCHAR(50) NOT NULL,
        EventTime NVARCHAR(50) NULL,
        StartTime NVARCHAR(50) NULL,
        EndTime NVARCHAR(50) NULL,
        NumberOfHours DECIMAL(5,2) NULL,
        NumberOfDays INT NULL DEFAULT 1,
        Location NVARCHAR(255) NOT NULL,
        EventPlace NVARCHAR(255) NULL,
        VenueName NVARCHAR(255) NULL,
        EventAddress NVARCHAR(255) NULL,
        EventLatitude DECIMAL(10,7) NULL,
        EventLongitude DECIMAL(10,7) NULL,
        LocationNotes NVARCHAR(500) NULL,
        PackagePrice DECIMAL(18,2) NULL DEFAULT 0.00,
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        PaymentType NVARCHAR(50) NULL DEFAULT 'Downpayment',
        AmountPaid DECIMAL(18,2) NULL DEFAULT 0.00,
        RemainingBalance DECIMAL(18,2) NULL DEFAULT 0.00,
        CommissionRate DECIMAL(5,2) NULL DEFAULT 10.00,
        CommissionAmount DECIMAL(18,2) NULL DEFAULT 0.00,
        ProviderEarnings DECIMAL(18,2) NULL DEFAULT 0.00,
        TransportationFee DECIMAL(18,2) NULL DEFAULT 0.00,
        DistanceKm DECIMAL(10,2) NULL DEFAULT 0.00,
        AdditionalDayCharges DECIMAL(18,2) NULL DEFAULT 0.00,
        ServiceHireDays INT NULL DEFAULT 1,
        ServiceStartDate NVARCHAR(50) NULL,
        ServiceEndDate NVARCHAR(50) NULL,
        EscrowStatus NVARCHAR(50) NULL DEFAULT 'Held In Escrow',
        BookingStatus NVARCHAR(20) NOT NULL DEFAULT 'Confirmed',
        PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Paid',
        ClientName NVARCHAR(150) NULL,
        ClientPhone NVARCHAR(50) NULL,
        ClientEmail NVARCHAR(255) NULL,
        BalanceReminderSentAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NULL
    );
    PRINT 'Created table: dbo.Bookings';
END;
GO

-- Booking table column checks
IF COL_LENGTH('dbo.Bookings', 'BookingReference') IS NULL ALTER TABLE dbo.Bookings ADD BookingReference NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'PackageID') IS NULL ALTER TABLE dbo.Bookings ADD PackageID INT NULL;
IF COL_LENGTH('dbo.Bookings', 'EventName') IS NULL ALTER TABLE dbo.Bookings ADD EventName NVARCHAR(150) NULL;
IF COL_LENGTH('dbo.Bookings', 'EventType') IS NULL ALTER TABLE dbo.Bookings ADD EventType NVARCHAR(100) NULL;
IF COL_LENGTH('dbo.Bookings', 'StartTime') IS NULL ALTER TABLE dbo.Bookings ADD StartTime NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'EndTime') IS NULL ALTER TABLE dbo.Bookings ADD EndTime NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'NumberOfHours') IS NULL ALTER TABLE dbo.Bookings ADD NumberOfHours DECIMAL(5,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'NumberOfDays') IS NULL ALTER TABLE dbo.Bookings ADD NumberOfDays INT NULL;
IF COL_LENGTH('dbo.Bookings', 'EventPlace') IS NULL ALTER TABLE dbo.Bookings ADD EventPlace NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Bookings', 'VenueName') IS NULL ALTER TABLE dbo.Bookings ADD VenueName NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Bookings', 'EventAddress') IS NULL ALTER TABLE dbo.Bookings ADD EventAddress NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Bookings', 'EventLatitude') IS NULL ALTER TABLE dbo.Bookings ADD EventLatitude DECIMAL(10,7) NULL;
IF COL_LENGTH('dbo.Bookings', 'EventLongitude') IS NULL ALTER TABLE dbo.Bookings ADD EventLongitude DECIMAL(10,7) NULL;
IF COL_LENGTH('dbo.Bookings', 'LocationNotes') IS NULL ALTER TABLE dbo.Bookings ADD LocationNotes NVARCHAR(500) NULL;
IF COL_LENGTH('dbo.Bookings', 'PackagePrice') IS NULL ALTER TABLE dbo.Bookings ADD PackagePrice DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'PaymentType') IS NULL ALTER TABLE dbo.Bookings ADD PaymentType NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'AmountPaid') IS NULL ALTER TABLE dbo.Bookings ADD AmountPaid DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'RemainingBalance') IS NULL ALTER TABLE dbo.Bookings ADD RemainingBalance DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'CommissionRate') IS NULL ALTER TABLE dbo.Bookings ADD CommissionRate DECIMAL(5,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'CommissionAmount') IS NULL ALTER TABLE dbo.Bookings ADD CommissionAmount DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'ProviderEarnings') IS NULL ALTER TABLE dbo.Bookings ADD ProviderEarnings DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'UpdatedAt') IS NULL ALTER TABLE dbo.Bookings ADD UpdatedAt DATETIME2 NULL;
IF COL_LENGTH('dbo.Bookings', 'ServiceStartDate') IS NULL ALTER TABLE dbo.Bookings ADD ServiceStartDate NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'ServiceEndDate') IS NULL ALTER TABLE dbo.Bookings ADD ServiceEndDate NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'ServiceHireDays') IS NULL ALTER TABLE dbo.Bookings ADD ServiceHireDays INT NULL;
IF COL_LENGTH('dbo.Bookings', 'AdditionalDayCharges') IS NULL ALTER TABLE dbo.Bookings ADD AdditionalDayCharges DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'TransportationFee') IS NULL ALTER TABLE dbo.Bookings ADD TransportationFee DECIMAL(18,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'DistanceKm') IS NULL ALTER TABLE dbo.Bookings ADD DistanceKm DECIMAL(10,2) NULL;
IF COL_LENGTH('dbo.Bookings', 'EscrowStatus') IS NULL ALTER TABLE dbo.Bookings ADD EscrowStatus NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'ClientName') IS NULL ALTER TABLE dbo.Bookings ADD ClientName NVARCHAR(150) NULL;
IF COL_LENGTH('dbo.Bookings', 'ClientPhone') IS NULL ALTER TABLE dbo.Bookings ADD ClientPhone NVARCHAR(50) NULL;
IF COL_LENGTH('dbo.Bookings', 'ClientEmail') IS NULL ALTER TABLE dbo.Bookings ADD ClientEmail NVARCHAR(255) NULL;
IF COL_LENGTH('dbo.Bookings', 'BalanceReminderSentAt') IS NULL ALTER TABLE dbo.Bookings ADD BalanceReminderSentAt DATETIME2 NULL;
GO

-- ============================================================================
-- 10. dbo.Payments Table
-- ============================================================================
IF OBJECT_ID('dbo.Payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Payments (
        PaymentID INT IDENTITY(1,1) PRIMARY KEY,
        BookingID INT NOT NULL FOREIGN KEY REFERENCES dbo.Bookings(BookingID) ON DELETE CASCADE,
        Amount DECIMAL(18,2) NOT NULL,
        PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'GCash',
        PaymentStatus NVARCHAR(20) NOT NULL DEFAULT 'Paid',
        TransactionReference NVARCHAR(100) NULL,
        PaidAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.Payments';
END;
GO

-- ============================================================================
-- 11. dbo.Reviews Table
-- ============================================================================
IF OBJECT_ID('dbo.Reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reviews (
        ReviewID INT IDENTITY(1,1) PRIMARY KEY,
        BookingID INT NULL FOREIGN KEY REFERENCES dbo.Bookings(BookingID) ON DELETE CASCADE,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        ProviderID INT NULL,
        Rating INT NOT NULL DEFAULT 5,
        ReviewText NVARCHAR(1000) NOT NULL,
        SubmittedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.Reviews';
END;
GO

-- ============================================================================
-- 12. dbo.Notifications Table
-- ============================================================================
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        NotificationType NVARCHAR(50) NOT NULL,
        Title NVARCHAR(150) NOT NULL,
        Message NVARCHAR(500) NOT NULL,
        RelatedID INT NULL,
        RelatedType NVARCHAR(50) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ReadAt DATETIME2 NULL
    );
    CREATE NONCLUSTERED INDEX IX_Notifications_User_Read ON dbo.Notifications (UserID, IsRead, CreatedAt DESC);
    PRINT 'Created table: dbo.Notifications';
END;
GO

-- ============================================================================
-- 13. dbo.ActivityLogs Table
-- ============================================================================
IF OBJECT_ID('dbo.ActivityLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ActivityLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NULL,
        Action NVARCHAR(100) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        EntityType NVARCHAR(50) NULL,
        EntityID INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.ActivityLogs';
END;
GO

-- ============================================================================
-- 14. Messaging Tables (Conversations, Participants, Messages)
-- ============================================================================
IF OBJECT_ID('dbo.Conversations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Conversations (
        ConversationID INT IDENTITY(1,1) PRIMARY KEY,
        User1ID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        User2ID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        BookingID INT NULL FOREIGN KEY REFERENCES dbo.Bookings(BookingID),
        ApplicationID INT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    CREATE NONCLUSTERED INDEX IX_Conversations_Users ON dbo.Conversations (User1ID, User2ID, UpdatedAt DESC);
    PRINT 'Created table: dbo.Conversations';
END;
GO

IF OBJECT_ID('dbo.ConversationParticipants', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ConversationParticipants (
        ParticipantID INT IDENTITY(1,1) PRIMARY KEY,
        ConversationID INT NOT NULL FOREIGN KEY REFERENCES dbo.Conversations(ConversationID) ON DELETE CASCADE,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        JoinedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        LastReadAt DATETIME2 NULL
    );
    CREATE NONCLUSTERED INDEX IX_ConversationParticipants_User ON dbo.ConversationParticipants (UserID, ConversationID);
    PRINT 'Created table: dbo.ConversationParticipants';
END;
GO

IF OBJECT_ID('dbo.Messages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Messages (
        MessageID INT IDENTITY(1,1) PRIMARY KEY,
        ConversationID INT NOT NULL FOREIGN KEY REFERENCES dbo.Conversations(ConversationID) ON DELETE CASCADE,
        SenderUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        ReceiverUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        BookingID INT NULL,
        MessageText NVARCHAR(MAX) NOT NULL,
        SentAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        IsRead BIT NOT NULL DEFAULT 0,
        ReadAt DATETIME2 NULL,
        IsDeleted BIT NOT NULL DEFAULT 0
    );
    CREATE NONCLUSTERED INDEX IX_Messages_Conversation ON dbo.Messages (ConversationID, SentAt ASC);
    CREATE NONCLUSTERED INDEX IX_Messages_Receiver_Unread ON dbo.Messages (ReceiverUserID, IsRead, ConversationID);
    PRINT 'Created table: dbo.Messages';
END;
GO

-- ============================================================================
-- 15. dbo.PasswordResetTokens Table
-- ============================================================================
IF OBJECT_ID('dbo.PasswordResetTokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResetTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        TokenHash NVARCHAR(255) NOT NULL UNIQUE,
        ExpiresAt DATETIME2 NOT NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UsedAt DATETIME2 NULL
    );
    PRINT 'Created table: dbo.PasswordResetTokens';
END;
GO

-- ============================================================================
-- 16. dbo.Withdrawals Table (Provider Payouts)
-- ============================================================================
IF OBJECT_ID('dbo.Withdrawals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Withdrawals (
        WithdrawalID INT IDENTITY(1,1) PRIMARY KEY,
        ProviderID INT NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        PayoutMethod NVARCHAR(50) NOT NULL DEFAULT 'GCash',
        AccountName NVARCHAR(150) NULL,
        AccountNumber NVARCHAR(100) NULL,
        AccountReference NVARCHAR(100) NOT NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
        RequestedAt DATETIME NULL DEFAULT GETDATE(),
        ProcessedAt DATETIME NULL,
        AdminNotes NVARCHAR(500) NULL,
        BookingID INT NULL,
        PayMongoPayoutID NVARCHAR(100) NULL,
        Notes NVARCHAR(MAX) NULL,
        ProcessedByAdminID INT NULL
    );
    PRINT 'Created table: dbo.Withdrawals';
END;
GO

-- ============================================================================
-- 17. dbo.ProviderReports Table
-- ============================================================================
IF OBJECT_ID('dbo.ProviderReports', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProviderReports (
        ReportID INT IDENTITY(1,1) PRIMARY KEY,
        ReporterUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        ProviderID INT NOT NULL,
        BookingID INT NULL,
        Reason NVARCHAR(150) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        AdminNotes NVARCHAR(MAX) NULL,
        ProofImage NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ResolvedAt DATETIME2 NULL,
        ResolvedByAdminID INT NULL
    );
    PRINT 'Created table: dbo.ProviderReports';
END;
GO

-- ============================================================================
-- 18. dbo.ProviderDateCapacity Table
-- ============================================================================
IF OBJECT_ID('dbo.ProviderDateCapacity', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProviderDateCapacity (
        CapacityID INT IDENTITY(1,1) PRIMARY KEY,
        ProviderID INT NOT NULL,
        SpecificDate NVARCHAR(50) NOT NULL,
        MaxBookings INT NOT NULL DEFAULT 1,
        Notes NVARCHAR(255) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT UQ_ProviderDate UNIQUE (ProviderID, SpecificDate)
    );
    PRINT 'Created table: dbo.ProviderDateCapacity';
END;
GO

-- ============================================================================
-- 19. dbo.OTPVerifications Table (Email Verification OTP)
-- ============================================================================
IF OBJECT_ID('dbo.OTPVerifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OTPVerifications (
        OtpID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        Email NVARCHAR(255) NOT NULL,
        OtpHash NVARCHAR(255) NOT NULL,
        ExpiresAt DATETIME2 NOT NULL,
        Attempts INT NOT NULL DEFAULT 0,
        IsUsed BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.OTPVerifications';
END;
GO

-- ============================================================================
-- 20. dbo.ProviderSubscriptions Table
-- ============================================================================
IF OBJECT_ID('dbo.ProviderSubscriptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProviderSubscriptions (
        SubscriptionID INT IDENTITY(1,1) PRIMARY KEY,
        ProviderID INT NOT NULL,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        PlanType NVARCHAR(50) NOT NULL DEFAULT 'free_trial',
        PlanName NVARCHAR(100) NOT NULL DEFAULT 'Free Trial (1st Month)',
        Price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        BillingCycle NVARCHAR(50) NOT NULL DEFAULT '30_days',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Active',
        StartDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        EndDate DATETIME2 NOT NULL,
        HasUsedFreeTrial BIT NOT NULL DEFAULT 0,
        PayMongoSessionID NVARCHAR(150) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.ProviderSubscriptions';
END;
GO

-- ============================================================================
-- 21. dbo.SubscriptionPayments Table
-- ============================================================================
IF OBJECT_ID('dbo.SubscriptionPayments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SubscriptionPayments (
        PaymentID INT IDENTITY(1,1) PRIMARY KEY,
        SubscriptionID INT NOT NULL,
        ProviderID INT NOT NULL,
        PlanType NVARCHAR(50) NOT NULL,
        PlanName NVARCHAR(100) NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
        Currency NVARCHAR(10) NOT NULL DEFAULT 'PHP',
        PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'PayMongo',
        PayMongoSessionID NVARCHAR(150) NULL,
        PayMongoPaymentID NVARCHAR(150) NULL,
        PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Paid',
        PaymentDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        Notes NVARCHAR(MAX) NULL
    );
    PRINT 'Created table: dbo.SubscriptionPayments';
END;
GO

-- ============================================================================
-- 22. dbo.TransportationFees Table
-- ============================================================================
IF OBJECT_ID('dbo.TransportationFees', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TransportationFees (
        FeeID INT IDENTITY(1,1) PRIMARY KEY,
        MinDistanceKm DECIMAL(18,2) NOT NULL,
        MaxDistanceKm DECIMAL(18,2) NOT NULL,
        ServiceFee DECIMAL(18,2) NOT NULL,
        IsActive BIT NULL DEFAULT 1,
        CreatedAt DATETIME NULL DEFAULT GETDATE()
    );

    INSERT INTO dbo.TransportationFees (MinDistanceKm, MaxDistanceKm, ServiceFee, IsActive) VALUES
    (0.00, 10.00, 500.00, 1),
    (10.01, 20.00, 750.00, 1),
    (20.01, 30.00, 1000.00, 1),
    (30.01, 40.00, 1250.00, 1),
    (40.01, 50.00, 1500.00, 1),
    (50.01, 999.00, 2000.00, 1);
    PRINT 'Created table: dbo.TransportationFees and seeded standard tiers';
END;
GO

-- ============================================================================
-- 23. dbo.ClientWallets Table
-- ============================================================================
IF OBJECT_ID('dbo.ClientWallets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ClientWallets (
        WalletID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        Balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.ClientWallets';
END;
GO

-- ============================================================================
-- 24. dbo.WalletTransactions Table
-- ============================================================================
IF OBJECT_ID('dbo.WalletTransactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WalletTransactions (
        TransactionID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        Amount DECIMAL(18,2) NOT NULL,
        TransactionType NVARCHAR(50) NOT NULL,
        Description NVARCHAR(500) NOT NULL,
        BalanceAfter DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        RelatedBookingID INT NULL,
        BookingReference NVARCHAR(50) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Created table: dbo.WalletTransactions';
END;
GO

-- ============================================================================
-- 25. dbo.RefundRequests Table (Cashier Manual Refund Processing)
-- ============================================================================
IF OBJECT_ID('dbo.RefundRequests', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.RefundRequests (
        RefundRequestID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        ClientName NVARCHAR(200) NOT NULL,
        ClientEmail NVARCHAR(150) NULL,
        ClientPhone NVARCHAR(50) NULL,
        Amount DECIMAL(18,2) NOT NULL,
        PayoutMethod NVARCHAR(50) NOT NULL,
        AccountName NVARCHAR(150) NOT NULL,
        AccountNumber NVARCHAR(100) NOT NULL,
        Status NVARCHAR(30) NOT NULL DEFAULT 'Pending',
        ReferenceNumber NVARCHAR(100) NULL,
        AdminNotes NVARCHAR(500) NULL,
        RequestedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ProcessedAt DATETIME2 NULL,
        ProcessedBy INT NULL
    );
    PRINT 'Created table: dbo.RefundRequests';
END;
GO

PRINT '=== SOUNDSPHEREDB SCHEMA SYNCHRONIZATION COMPLETE! ===';
GO
