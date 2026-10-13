const path = require('path');
const { connectDB } = require(path.join(__dirname, '../server/config/db'));

async function test() {
    const pool = await connectDB();
    try {
        const query = `
            SELECT 
                sp.ProviderID,
                sp.UserID,
                sp.BusinessName,
                COALESCE(NULLIF(sp.OwnerName, ''), CONCAT(sp.OwnerFirstName, ' ', sp.OwnerLastName), u.Email) AS OwnerName,
                u.Email AS ProviderEmail,
                COALESCE(sp.ContactNumber, pa.ContactNumber, u.Phone, 'N/A') AS ContactNumber,
                sp.PermitExpiryDate,
                sp.PermitNoticeSentAt,
                sp.PermitRenewalDoc,
                sp.PermitRenewalExpiryDate,
                sp.PermitRenewalSubmittedAt,
                sp.PermitRenewalStatus,
                sp.PermitRenewalNotes,
                pa.BusinessPermit_Url,
                sp.VerificationStatus,
                u.AccountStatus,
                (SELECT COUNT(*) FROM dbo.Bookings b WHERE (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)) AS TotalBookings
            FROM dbo.ServiceProviders sp
            JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.ProviderApplications pa ON sp.ApplicationID = pa.ApplicationID
        `;
        const result = await pool.request().query(query);
        console.log('Query succeeded, rows:', result.recordset.length);
    } catch (err) {
        console.error('SQL Query Error:', err);
    }
    process.exit(0);
}

test();
