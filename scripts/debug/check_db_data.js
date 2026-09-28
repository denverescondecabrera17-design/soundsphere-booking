const { connectDB } = require('../server/config/db');

async function checkData() {
    try {
        const pool = await connectDB();
        const users = await pool.request().query("SELECT UserID, Email, RoleID, AccountStatus FROM dbo.Users");
        console.log("USERS:", users.recordset);

        const apps = await pool.request().query("SELECT * FROM dbo.ProviderApplications");
        console.log("APPLICATIONS:", apps.recordset);

        const bookings = await pool.request().query("SELECT * FROM dbo.Bookings");
        console.log("BOOKINGS:", bookings.recordset);

        process.exit(0);
    } catch (e) {
        console.error("Check Error:", e);
        process.exit(1);
    }
}

checkData();
