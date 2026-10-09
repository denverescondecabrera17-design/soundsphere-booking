const { connectDB } = require('../server/config/db');

async function testLookup() {
    const pool = await connectDB();
    const res = await pool.request().query(`
        SELECT u.UserID, u.Email, sp.ProviderID, pa.ApplicationID
        FROM dbo.Users u
        LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID;
    `);
    console.table(res.recordset);
    process.exit(0);
}

testLookup();
