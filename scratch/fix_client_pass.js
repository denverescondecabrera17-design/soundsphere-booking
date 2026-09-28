const bcrypt = require('bcrypt');
const { connectDB } = require('../server/config/db');

async function fixClientPass() {
    let pool = await connectDB();
    const hash = await bcrypt.hash('Client123!', 10);

    const res = await pool.request()
        .input('Hash', hash)
        .query(`
            UPDATE dbo.Users 
            SET PasswordHash = @Hash 
            WHERE Email = 'denverescondecabrera17@gmail.com';
        `);
    console.log('✓ Client password for denverescondecabrera17@gmail.com updated to Client123!');
}
fixClientPass();
