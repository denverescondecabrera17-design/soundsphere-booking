const path = require('path');
const { connectDB } = require(path.join(__dirname, '../server/config/db'));

async function migrate() {
    const pool = await connectDB();
    try {
        await pool.request().query(`
            IF COL_LENGTH('dbo.ServiceProviders', 'PermitIssuedDate') IS NULL 
                ALTER TABLE dbo.ServiceProviders ADD PermitIssuedDate DATE NULL;
            IF COL_LENGTH('dbo.ServiceProviders', 'PermitRenewalIssuedDate') IS NULL 
                ALTER TABLE dbo.ServiceProviders ADD PermitRenewalIssuedDate DATE NULL;
            IF COL_LENGTH('dbo.ServiceProviders', 'PermitNumber') IS NULL 
                ALTER TABLE dbo.ServiceProviders ADD PermitNumber NVARCHAR(100) NULL;
        `);
        console.log('Permit columns migration completed successfully');
    } catch (err) {
        console.error('Migration error:', err);
    }
    process.exit(0);
}

migrate();
