require('dotenv').config();
const { connectDB, getPool } = require('../server/config/db');

async function checkClients() {
    try {
        await connectDB();
        const pool = getPool();
        const res = await pool.request().query(`
            SELECT TOP 10 u.UserID, u.Email, r.RoleName, u.IsActive 
            FROM dbo.Users u
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID;
        `);
        console.log('--- Client Users in Database ---');
        console.log(res.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error fetching users:', err);
        process.exit(1);
    }
}

checkClients();
