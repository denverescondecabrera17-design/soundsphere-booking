const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function checkServiceProvidersTable() {
    try {
        await connectDB();
        const pool = getPool();
        const res = await pool.request().query(`
            SELECT sp.*, u.Email, u.RoleID, r.RoleName
            FROM ServiceProviders sp
            LEFT JOIN Users u ON sp.UserID = u.UserID
            LEFT JOIN Roles r ON u.RoleID = r.RoleID
        `);
        console.log('Service Providers Table:', JSON.stringify(res.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('DB Error:', e);
        process.exit(1);
    }
}

checkServiceProvidersTable();
