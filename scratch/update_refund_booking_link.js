const { connectDB } = require('../server/config/db');

async function run() {
    try {
        const pool = await connectDB();
        await pool.request().query(`
            UPDATE rr
            SET rr.ClientName = COALESCE(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'User'),
                rr.ClientEmail = u.Email,
                rr.ClientPhone = COALESCE(u.Phone, rr.ClientPhone)
            FROM dbo.RefundRequests rr
            LEFT JOIN dbo.Users u ON rr.UserID = u.UserID
            LEFT JOIN dbo.Clients c ON rr.UserID = c.UserID;
        `);
        console.log('Restored account names in dbo.RefundRequests.');

        const check = await pool.request().query(`
            SELECT RefundRequestID, UserID, ClientName, ClientEmail, ClientPhone, BookingID, BookingReference 
            FROM dbo.RefundRequests;
        `);
        console.log(check.recordset);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
