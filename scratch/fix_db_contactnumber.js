const { connectDB } = require('../server/config/db');

async function fixDb() {
    console.log("=== Adding ContactNumber & ProfilePicture Columns to dbo.ServiceProviders in SQL Server ===");
    let pool = await connectDB();

    try {
        await pool.request().query(`
            IF OBJECT_ID('dbo.ServiceProviders', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'ContactNumber')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD ContactNumber NVARCHAR(50) NULL;
                END

                IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ServiceProviders') AND name = 'ProfilePicture')
                BEGIN
                    ALTER TABLE dbo.ServiceProviders ADD ProfilePicture NVARCHAR(500) NULL;
                END
            END
        `);
        console.log("✅ Successfully added missing columns to dbo.ServiceProviders in SoundSphereDB!");
        process.exit(0);
    } catch (err) {
        console.error("Error fixing DB columns:", err.message);
        process.exit(1);
    }
}

fixDb();
