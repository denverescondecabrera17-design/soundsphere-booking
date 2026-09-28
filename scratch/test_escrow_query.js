const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function testEscrowQuery() {
    try {
        await connectDB();
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT DISTINCT
                b.BookingID,
                b.BookingReference,
                ISNULL(uClient.Email, 'Client') AS ClientName,
                ISNULL(uClient.Email, '') AS ClientEmail,
                b.PackageName,
                b.TotalAmount,
                ISNULL(b.EscrowStatus, 'Held') AS EscrowStatus,
                ISNULL(
                    COALESCE(sp1.BusinessName, sp2.BusinessName),
                    COALESCE(uProv1.Email, uProv2.Email)
                ) AS ProviderName,
                COALESCE(uProv1.Email, uProv2.Email) AS ProviderEmail
            FROM dbo.Bookings b
            LEFT JOIN dbo.Users uClient ON b.ClientUserID = uClient.UserID
            LEFT JOIN dbo.ServiceProviders sp1 ON b.ProviderID = sp1.ProviderID
            LEFT JOIN dbo.Users uProv1 ON sp1.UserID = uProv1.UserID
            LEFT JOIN dbo.ServiceProviders sp2 ON b.ProviderID = sp2.UserID
            LEFT JOIN dbo.Users uProv2 ON sp2.UserID = uProv2.UserID
            ORDER BY b.BookingID DESC;
        `);
        console.log(`Total rows: ${result.recordset.length}`);
        console.log(JSON.stringify(result.recordset.slice(0, 5), null, 2));
        process.exit(0);
    } catch (e) {
        console.error('Query Error:', e.message);
        process.exit(1);
    }
}

testEscrowQuery();
