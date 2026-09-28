const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function updateProviderUserRoles() {
    try {
        await connectDB();
        const pool = getPool();
        // Update Users who have a ServiceProvider profile to RoleID = 3 (ServiceProvider)
        const updateRes = await pool.request().query(`
            UPDATE u
            SET u.RoleID = 3
            FROM dbo.Users u
            INNER JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            WHERE u.RoleID != 3
        `);
        console.log('Updated users with ServiceProvider profile to RoleID = 3 (ServiceProvider):', updateRes.rowsAffected);

        // Also update cabrera@gmail.com if needed
        const provider1 = await pool.request().query(`
            SELECT u.UserID, u.Email, r.RoleName, sp.BusinessName, sp.VerificationStatus
            FROM dbo.Users u
            INNER JOIN dbo.Roles r ON u.RoleID = r.RoleID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
        `);
        console.log('Updated Users List:', JSON.stringify(provider1.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error updating provider user roles:', e);
        process.exit(1);
    }
}

updateProviderUserRoles();
