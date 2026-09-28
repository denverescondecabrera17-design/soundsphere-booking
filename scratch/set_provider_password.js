const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcrypt');
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function setTestPassword() {
    try {
        await connectDB();
        const pool = getPool();
        const hash = await bcrypt.hash('password123', 10);
        await pool.request()
            .input('Hash', hash)
            .input('Email', 'denvercabrera.apo@gmail.com')
            .query(`UPDATE Users SET PasswordHash = @Hash, EmailVerified = 1, IsActive = 1 WHERE Email = @Email`);
        console.log('Updated password hash for denvercabrera.apo@gmail.com to password123');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

setTestPassword();
