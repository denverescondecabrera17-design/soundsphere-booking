const { connectDB } = require('../server/config/db');

async function restoreFullSchema() {
    console.log("=== Restoring Full Database Schema (dbo.Clients, dbo.ServiceProviders, dbo.ProviderApplications, dbo.Admins) ===");
    let pool = await connectDB();

    try {
        // 1. Re-create dbo.Clients
        await pool.request().query(`
            IF OBJECT_ID('dbo.Clients', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Clients (
                    ClientID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    FirstName NVARCHAR(100) NULL,
                    MiddleName NVARCHAR(100) NULL,
                    LastName NVARCHAR(100) NULL,
                    FullName NVARCHAR(200) NULL,
                    Address NVARCHAR(255) NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Clients PRIMARY KEY CLUSTERED (ClientID ASC),
                    CONSTRAINT UQ_Clients_UserID UNIQUE (UserID),
                    CONSTRAINT FK_Clients_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // 2. Re-create dbo.ServiceProviders
        await pool.request().query(`
            IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ServiceProviders (
                    ProviderID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    BusinessName NVARCHAR(255) NOT NULL,
                    OwnerName NVARCHAR(150) NULL,
                    BusinessAddress NVARCHAR(255) NULL,
                    CoverageArea NVARCHAR(255) NULL,
                    Description NVARCHAR(MAX) NULL,
                    VerificationStatus NVARCHAR(50) DEFAULT 'Approved' NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_ServiceProviders PRIMARY KEY CLUSTERED (ProviderID ASC),
                    CONSTRAINT UQ_ServiceProviders_UserID UNIQUE (UserID),
                    CONSTRAINT FK_ServiceProviders_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // 3. Re-create dbo.ProviderApplications
        await pool.request().query(`
            IF OBJECT_ID('dbo.ProviderApplications', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.ProviderApplications (
                    ApplicationID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    BusinessName NVARCHAR(255) NOT NULL,
                    OwnerName NVARCHAR(150) NULL,
                    BusinessAddress NVARCHAR(255) NULL,
                    CoverageArea NVARCHAR(255) NULL,
                    ContactNumber NVARCHAR(20) NULL,
                    Status NVARCHAR(50) DEFAULT 'Approved' NOT NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_ProviderApplications PRIMARY KEY CLUSTERED (ApplicationID ASC),
                    CONSTRAINT FK_ProviderApplications_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // 4. Re-create dbo.Admins
        await pool.request().query(`
            IF OBJECT_ID('dbo.Admins', 'U') IS NULL
            BEGIN
                CREATE TABLE dbo.Admins (
                    AdminID INT IDENTITY(1,1) NOT NULL,
                    UserID INT NOT NULL,
                    FullName NVARCHAR(150) NOT NULL,
                    Department NVARCHAR(100) DEFAULT 'System Administration' NULL,
                    CreatedAt DATETIME2 DEFAULT GETDATE() NOT NULL,
                    CONSTRAINT PK_Admins PRIMARY KEY CLUSTERED (AdminID ASC),
                    CONSTRAINT UQ_Admins_UserID UNIQUE (UserID),
                    CONSTRAINT FK_Admins_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
                );
            END
        `);

        // 5. Seed/Restore User 13 (CHiCHa Lights and Sounds)
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.ServiceProviders WHERE UserID = 13)
            BEGIN
                INSERT INTO dbo.ServiceProviders (UserID, BusinessName, OwnerName, BusinessAddress, CoverageArea, Description, VerificationStatus)
                VALUES (13, 'CHiCHa Lights and Sounds', 'Denver Cabrera', 'Lian, Balayan, Nasugbu', 'Lian, Balayan, Nasugbu', 'Professional Lights & Sounds Service Provider.', 'Approved');
            END

            IF NOT EXISTS (SELECT 1 FROM dbo.Clients WHERE UserID = 13)
            BEGIN
                INSERT INTO dbo.Clients (UserID, FirstName, MiddleName, LastName, FullName, Address)
                VALUES (13, 'Denver', 'Esconde', 'Cabrera', 'Denver Cabrera', 'Lian, Balayan, Nasugbu');
            END
        `);

        // 6. Restore Client records for other existing users if missing
        const usersRes = await pool.request().query("SELECT UserID, Email FROM dbo.Users");
        for (const u of usersRes.recordset) {
            const uid = u.UserID;
            if (uid !== 13) {
                await pool.request().query(`
                    IF NOT EXISTS (SELECT 1 FROM dbo.Clients WHERE UserID = ${uid})
                    BEGIN
                        INSERT INTO dbo.Clients (UserID, FirstName, LastName, FullName)
                        VALUES (${uid}, 'Client', 'User', 'Client User');
                    END
                `);
            }
        }

        console.log("✅ All SQL Tables and Service Provider Profile Data Restored 100% Successfully!");
        process.exit(0);

    } catch (err) {
        console.error("❌ Error restoring schema:", err.message);
        process.exit(1);
    }
}

restoreFullSchema();
