const { connectDB } = require('../server/config/db');

async function cleanDuplicateApplications() {
    try {
        console.log('Connecting to SQL Server DB...');
        const pool = await connectDB();

        // Find and delete duplicate provider applications for each UserID keeping only the lowest ApplicationID
        const query = `
            WITH CTE AS (
                SELECT 
                    ApplicationID,
                    UserID,
                    Status,
                    ROW_NUMBER() OVER (
                        PARTITION BY UserID 
                        ORDER BY ApplicationID ASC
                    ) AS RowNum
                FROM dbo.ProviderApplications
                WHERE Status IN ('Pending', 'Approved')
            )
            DELETE FROM dbo.ProviderApplications
            WHERE ApplicationID IN (
                SELECT ApplicationID 
                FROM CTE 
                WHERE RowNum > 1
            );
        `;

        const result = await pool.request().query(query);
        console.log(`✅ Duplicate Provider Applications cleaned! Rows affected: ${result.rowsAffected[0] || 0}`);

        // Execute DB index migration
        await pool.request().query(`
            IF OBJECT_ID('dbo.ProviderApplications', 'U') IS NOT NULL
            BEGIN
                IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UX_ProviderApplications_ActiveUser' AND object_id = OBJECT_ID('dbo.ProviderApplications'))
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX UX_ProviderApplications_ActiveUser
                    ON dbo.ProviderApplications (UserID)
                    WHERE Status IN ('Pending', 'Approved');
                END
            END
        `);
        console.log('✅ Created UX_ProviderApplications_ActiveUser unique index in SQL Server.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Clean Duplicate Applications Error:', err);
        process.exit(1);
    }
}

cleanDuplicateApplications();
