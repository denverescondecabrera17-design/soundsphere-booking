const { connectDB } = require('../server/config/db');

async function testAdminWithdrawals() {
    try {
        const pool = await connectDB();
        const result = await pool.request().query(`
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
                u.Email AS ProviderEmail
            FROM dbo.Withdrawals w
            LEFT JOIN dbo.ServiceProviders sp ON w.ProviderID = sp.ProviderID OR w.ProviderID = sp.UserID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID OR w.ProviderID = u.UserID
            ORDER BY w.RequestedAt DESC;
        `);
        console.log("Withdrawals query success! Count:", result.recordset ? result.recordset.length : 0);
        if (result.recordset && result.recordset.length > 0) {
            console.log("Sample withdrawal row:", result.recordset[0]);
        }
    } catch (err) {
        console.error("Query failed:", err);
    } process.exit(0);
}

testAdminWithdrawals();
