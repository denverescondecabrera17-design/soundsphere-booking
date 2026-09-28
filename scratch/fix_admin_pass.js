const bcrypt = require('bcrypt');
const { connectDB } = require('../server/config/db');

async function fixAdminPass() {
    let pool = await connectDB();
    const hash = await bcrypt.hash('Admin123!', 10);

    const res = await pool.request()
        .input('Hash', hash)
        .query(`
            UPDATE dbo.Users 
            SET PasswordHash = @Hash 
            WHERE Email = 'soundsphere@gmail.com';
        `);
    console.log('✓ Admin password for soundsphere@gmail.com updated to Admin123!');
}
fixAdminPass();
