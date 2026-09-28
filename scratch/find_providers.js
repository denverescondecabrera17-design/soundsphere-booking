const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function checkProviderUser() {
    try {
        await connectDB();
        const pool = getPool();
        const res = await pool.request().query(`
            SELECT u.UserID, u.Email, r.RoleName
            FROM Users u
            INNER JOIN Roles r ON u.RoleID = r.RoleID
            WHERE r.RoleName LIKE '%Provider%'
        `);
        console.log('Providers in DB:', res.recordset);
        process.exit(0);
    } catch (e) {
        console.error('DB Error:', e);
        process.exit(1);
    }
}

checkProviderUser();
