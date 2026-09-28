-- ============================================================================
-- SoundSphere SQL Server Complete Database DDL Schema
-- Server: Microsoft SQL Server (SSMS 21 / Docker / Localhost)
-- Database: SoundSphereDB
-- Description: Complete Relational Schema for SoundSphere Lights & Sounds Platform
-- ============================================================================

IF DB_ID('SoundSphereDB') IS NULL
BEGIN
    CREATE DATABASE SoundSphereDB;
END;
GO

USE SoundSphereDB;
GO

-- ============================================================================
-- 1. Roles Table
-- ============================================================================
IF OBJECT_ID('dbo.Roles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles (
        RoleID INT IDENTITY(1,1) PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL UNIQUE,
        Description NVARCHAR(255) NULL
    );

    INSERT INTO dbo.Roles (RoleName, Description) VALUES
    ('Administrator', 'Platform Superadmin'),
    ('Client', 'Standard client account'),
    ('ServiceProvider', 'Approved service provider');
END;
GO

-- ============================================================================
-- 2. Users Table
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
        ProfilePicture NVARCHAR(255) NULL,
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
GO

-- ============================================================================
-- 3. Clients Table (Client Profile Details)
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
        ProfilePicture NVARCHAR(255) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ============================================================================
-- 4. ServiceProviders Table (Business Profiles)
-- ============================================================================
IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ServiceProviders (
        ProviderID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        BusinessName NVARCHAR(255) NOT NULL,
        OwnerName NVARCHAR(150) NULL,
        BusinessAddress NVARCHAR(255) NULL,
        CoverageArea NVARCHAR(255) NULL,
        Description NVARCHAR(MAX) NULL,
        StartingPrice DECIMAL(18,2) NULL DEFAULT 0.00,
        ProfilePicture NVARCHAR(255) NULL,
        BannerImage NVARCHAR(255) NULL,
        VerificationStatus NVARCHAR(50) NOT NULL DEFAULT 'Approved',
        Rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
        ReviewsCount INT NOT NULL DEFAULT 0,
        Latitude DECIMAL(10,7) NULL,
        Longitude DECIMAL(10,7) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- Backward compatibility alias view for ProviderProfiles
IF OBJECT_ID('dbo.ProviderProfiles', 'V') IS NULL AND OBJECT_ID('dbo.ProviderProfiles', 'U') IS NULL
BEGIN
    EXEC('CREATE VIEW dbo.ProviderProfiles AS SELECT * FROM dbo.ServiceProviders;');
END;
GO

-- ============================================================================
-- 5. Admins Table
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
END;
GO

-- ============================================================================
-- 6. ProviderApplications Table
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
        ApplicationStatus NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
        SubmittedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ReviewedAt DATETIME2 NULL,
        RejectionReason NVARCHAR(500) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ============================================================================
-- 7. ServicePackages / Packages Table
-- ============================================================================
IF OBJECT_ID('dbo.Packages', 'U') IS NULL AND OBJECT_ID('dbo.ServicePackages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Packages (
        PackageID INT IDENTITY(1,1) PRIMARY KEY,
        ProviderID INT NOT NULL FOREIGN KEY REFERENCES dbo.ServiceProviders(ProviderID) ON DELETE CASCADE,
        PackageName NVARCHAR(150) NOT NULL,
        Category NVARCHAR(100) NOT NULL DEFAULT 'Concert Audio & Stage Lights',
        Price DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        Description NVARCHAR(MAX) NULL,
        Inclusions NVARCHAR(MAX) NULL,
        AdditionalDayPercentage DECIMAL(5,2) NOT NULL DEFAULT 20.00,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

IF OBJECT_ID('dbo.ServicePackages', 'V') IS NULL AND OBJECT_ID('dbo.ServicePackages', 'U') IS NULL
BEGIN
    EXEC('CREATE VIEW dbo.ServicePackages AS SELECT * FROM dbo.Packages;');
END;
GO

-- ============================================================================
-- 8. PackagePhotos Table
-- ============================================================================
IF OBJECT_ID('dbo.PackagePhotos', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PackagePhotos (
        PhotoID INT IDENTITY(1,1) PRIMARY KEY,
        PackageID INT NOT NULL,
        PhotoURL NVARCHAR(255) NOT NULL,
        DisplayOrder INT NOT NULL DEFAULT 1,
        UploadedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ============================================================================
-- 9. Bookings Table (With Full Multi-Day & Pricing Inclusions)
-- ============================================================================
IF OBJECT_ID('dbo.Bookings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bookings (
        BookingID INT IDENTITY(1,1) PRIMARY KEY,
        BookingReference NVARCHAR(50) NULL,
        ClientUserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        ProviderID INT NULL,
        PackageID INT NULL,
        PackageName NVARCHAR(150) NOT NULL,
        EventName NVARCHAR(150) NULL,
        EventType NVARCHAR(100) NULL,
        CustomEventType NVARCHAR(100) NULL,
        EventDate NVARCHAR(50) NOT NULL,
        EventTime NVARCHAR(50) NULL,
        ServiceStartDate NVARCHAR(50) NULL,
        ServiceEndDate NVARCHAR(50) NULL,
        ServiceHireDays INT NULL DEFAULT 1,
        StartTime NVARCHAR(50) NULL,
        EndTime NVARCHAR(50) NULL,
        NumberOfDays INT NULL DEFAULT 1,
        NumberOfHours INT NULL DEFAULT 0,
        EventPlace NVARCHAR(100) NULL,
        VenueName NVARCHAR(200) NULL,
        Location NVARCHAR(255) NOT NULL,
        CompleteAddress NVARCHAR(MAX) NULL,
        EventLatitude DECIMAL(10,7) NULL,
        EventLongitude DECIMAL(10,7) NULL,
        LocationNotes NVARCHAR(MAX) NULL,
        PackagePrice DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        AdditionalDayCharges DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        TransportationFee DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        DistanceKm DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        TotalAmount DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        AmountPaid DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        RemainingBalance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        PaymentType NVARCHAR(50) NOT NULL DEFAULT 'full',
        PaymentMethod NVARCHAR(50) NOT NULL DEFAULT 'Credit / Debit Card (PayMongo)',
        PaymentStatus NVARCHAR(50) NOT NULL DEFAULT 'Paid',
        BookingStatus NVARCHAR(50) NOT NULL DEFAULT 'Confirmed',
        TransactionReference NVARCHAR(100) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ============================================================================
-- 10. Reviews Table
-- ============================================================================
IF OBJECT_ID('dbo.Reviews', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reviews (
        ReviewID INT IDENTITY(1,1) PRIMARY KEY,
        BookingID INT NOT NULL,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        ProviderID INT NOT NULL,
        Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        ReviewText NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ============================================================================
-- 11. Messages Table
-- ============================================================================
IF OBJECT_ID('dbo.Messages', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Messages (
        MessageID INT IDENTITY(1,1) PRIMARY KEY,
        SenderID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        ReceiverID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID),
        Content NVARCHAR(MAX) NOT NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END;
GO

-- ============================================================================
-- 12. Notifications Table
-- ============================================================================
IF OBJECT_ID('dbo.Notifications', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications (
        NotificationID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT NOT NULL FOREIGN KEY REFERENCES dbo.Users(UserID) ON DELETE CASCADE,
        NotificationType NVARCHAR(100) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        RelatedID INT NULL,
        RelatedType NVARCHAR(100) NULL,
        IsRead BIT NOT NULL DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ReadAt DATETIME2 NULL
    );
END;
GO

-- ============================================================================
-- 13. Withdrawals Table (Provider Payouts)
-- ============================================================================
IF OBJECT_ID('dbo.Withdrawals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Withdrawals (
        WithdrawalID INT IDENTITY(1,1) PRIMARY KEY,
        ProviderID INT NOT NULL,
        Amount DECIMAL(18,2) NOT NULL,
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
END;
GO

-- ============================================================================
-- 14. ProviderReports Table (Client Incident Reports Against Providers)
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
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        ResolvedAt DATETIME2 NULL,
        ResolvedByAdminID INT NULL
    );
END;
GO

-- ============================================================================
-- 15. ActivityLogs Table (System Audit Trail)
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
END;
GO

-- ============================================================================
-- 16. PasswordResetTokens Table
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
END;
GO
