const bcrypt = require('bcrypt');
const { connectDB } = require('../server/config/db');

async function setPassword() {
    let pool = await connectDB();
    const hash = await bcrypt.hash('Password123!', 10);
    await pool.request()
        .input('Hash', hash)
        .query("UPDATE dbo.Users SET PasswordHash = @Hash, EmailVerified = 1, AccountStatus = 'Active' WHERE UserID = 13;");
    console.log("✅ Updated User 13 password hash successfully!");
    process.exit(0);
}

setPassword();
