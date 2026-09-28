const { connectDB } = require('../server/config/db');

async function checkTables() {
    let pool = await connectDB();
    try {
        const tables = await pool.request().query(`
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';
        `);
        console.log("Existing Tables in SoundSphereDB:");
        console.log(tables.recordset.map(t => t.TABLE_NAME));

        const users = await pool.request().query(`
            SELECT u.UserID, u.Email, u.RoleID, r.RoleName, u.AccountStatus 
            FROM dbo.Users u 
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID;
        `);
        console.log("\nUsers in dbo.Users table:");
        console.log(users.recordset);

        process.exit(0);
    } catch (err) {
        console.error("DB query error:", err.message);
        process.exit(1);
    }
}

checkTables();
