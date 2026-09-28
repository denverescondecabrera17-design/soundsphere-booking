const { connectDB } = require('../server/config/db');

async function debugWithdrawalDuplicates() {
    try {
        const pool = await connectDB();
        
        console.log("--- Withdrawals Table ---");
        const wRes = await pool.request().query("SELECT * FROM dbo.Withdrawals");
        console.log(wRes.recordset);

        console.log("\n--- ServiceProviders Table ---");
        const spRes = await pool.request().query("SELECT ProviderID, UserID, BusinessName FROM dbo.ServiceProviders");
        console.log(spRes.recordset);

        console.log("\n--- Users Table ---");
        const uRes = await pool.request().query("SELECT UserID, Email FROM dbo.Users");
        console.log(uRes.recordset);

        console.log("\n--- Fixed Clean Join Output for Withdrawals ---");
        const fixedRes = await pool.request().query(`
            SELECT 
                w.WithdrawalID,
                w.ProviderID,
                w.Amount,
                w.PayoutMethod,
                w.AccountName,
                w.AccountReference,
                w.Status,
                w.RequestedAt,
                w.ProcessedAt,
                w.AdminNotes,
                ISNULL(sp.BusinessName, 'Service Provider') AS ProviderName,
                ISNULL(u.Email, u2.Email) AS ProviderEmail
            FROM dbo.Withdrawals w
            LEFT JOIN dbo.ServiceProviders sp ON sp.ProviderID = w.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users u2 ON w.ProviderID = u2.UserID
            ORDER BY w.RequestedAt DESC;
        `);
        console.log(fixedRes.recordset);

    } catch (err) {
        console.error("Debug error:", err);
    }
    process.exit(0);
}

debugWithdrawalDuplicates();
