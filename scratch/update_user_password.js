const bcrypt = require('bcrypt');
const { connectDB } = require('../server/config/db');

async function updatePassword() {
    const pool = await connectDB();
    const hash = await bcrypt.hash('Provider123!', 10);
    await pool.request()
        .input('Hash', hash)
        .query("UPDATE dbo.Users SET PasswordHash = @Hash WHERE Email = 'denvercabrera.apo@gmail.com'");
    console.log('✓ Password hash updated for denvercabrera.apo@gmail.com');
}

updatePassword();
