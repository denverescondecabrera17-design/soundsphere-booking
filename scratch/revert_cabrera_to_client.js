const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function revertCabreraToClient() {
    try {
        await connectDB();
        const pool = getPool();

        // Revert cabrera@gmail.com (UserID 2) back to Client (RoleID = 2)
        await pool.request()
            .input('Email', 'cabrera@gmail.com')
            .query(`UPDATE Users SET RoleID = 2 WHERE Email = @Email`);

        // Remove their ServiceProviders entry we added
        await pool.request()
            .input('UserID', 2)
            .query(`DELETE FROM ServiceProviders WHERE UserID = @UserID AND ProviderID != 1`);

        // Confirm final state
        const finalState = await pool.request().query(`
            SELECT u.UserID, u.Email, r.RoleName, sp.BusinessName, sp.VerificationStatus
            FROM Users u
            JOIN Roles r ON u.RoleID = r.RoleID
            LEFT JOIN ServiceProviders sp ON u.UserID = sp.UserID
        `);
        console.log('Final DB State:', JSON.stringify(finalState.recordset, null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

revertCabreraToClient();
