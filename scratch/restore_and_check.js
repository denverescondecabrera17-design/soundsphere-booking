const { connectDB } = require('../server/config/db');

async function restoreAndCheck() {
    console.log("=== Checking Database Schema & User 13 Profile Data ===");
    let pool = await connectDB();

    try {
        // 1. Ensure dbo.Clients table exists
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

        // 2. Ensure User 13 record exists in dbo.Clients
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.Clients WHERE UserID = 13)
            BEGIN
                INSERT INTO dbo.Clients (UserID, FirstName, MiddleName, LastName, FullName, Address)
                VALUES (13, 'Denver', 'Esconde', 'Cabrera', 'Denver Cabrera', 'Lian, Balayan, Nasugbu');
            END
        `);

        // 3. Ensure User 13 record exists in dbo.ServiceProviders
        await pool.request().query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.ServiceProviders WHERE UserID = 13)
            BEGIN
                INSERT INTO dbo.ServiceProviders (UserID, BusinessName, OwnerName, CoverageArea, Description, VerificationStatus)
                VALUES (13, 'CHiCHa Lights and Sounds', 'Denver Cabrera', 'Lian, Balayan, Nasugbu', 'Professional Lights & Sounds Service Provider.', 'Approved');
            END
            ELSE
            BEGIN
                UPDATE dbo.ServiceProviders
                SET BusinessName = 'CHiCHa Lights and Sounds',
                    OwnerName = 'Denver Cabrera',
                    CoverageArea = 'Lian, Balayan, Nasugbu',
                    VerificationStatus = 'Approved'
                WHERE UserID = 13;
            END
        `);

        console.log("✅ Verified and ensured dbo.Clients & dbo.ServiceProviders for User 13!");

        // 4. Query User 13 details
        const u13 = await pool.request().query(`
            SELECT u.UserID, u.Email, u.Phone, u.ProfilePicture, u.RoleID,
                   c.FirstName, c.LastName, c.FullName,
                   sp.BusinessName, sp.OwnerName, sp.CoverageArea, sp.VerificationStatus
            FROM dbo.Users u
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            WHERE u.UserID = 13;
        `);

        console.log("\nUser 13 Profile Data in DB:");
        console.log(JSON.stringify(u13.recordset[0], null, 2));

        process.exit(0);
    } catch (err) {
        console.error("Error in restoreAndCheck:", err.message);
        process.exit(1);
    }
}

restoreAndCheck();
