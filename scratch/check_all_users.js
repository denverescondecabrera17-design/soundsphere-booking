const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function checkAllUsers() {
    try {
        await connectDB();
        const pool = getPool();
        const res = await pool.request().query(`
            SELECT u.UserID, u.Email, r.RoleName, u.RoleID, c.FirstName, c.LastName
            FROM Users u
            INNER JOIN Roles r ON u.RoleID = r.RoleID
            LEFT JOIN Clients c ON u.UserID = c.UserID
        `);
        console.log('All Users in DB:', JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('DB Error:', e);
        process.exit(1);
    }
}

checkAllUsers();
