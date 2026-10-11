const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const appRes = await pool.request().query("SELECT ApplicationID, UserID, BusinessName, Status, SubmittedAt FROM dbo.ProviderApplications;");
    console.log("APPLICATIONS:", JSON.stringify(appRes.recordset, null, 2));

    const userRes = await pool.request().query("SELECT UserID, Email, Role, FullName FROM dbo.Users WHERE Role IN ('provider', 'ServiceProvider');");
    console.log("PROVIDER USERS:", JSON.stringify(userRes.recordset, null, 2));

    process.exit(0);
})();
