const { connectDB } = require('../server/config/db');

async function addColumns() {
    const pool = await connectDB();
    if (!pool) {
        console.error('Failed to connect to DB');
        process.exit(1);
    }

    await pool.request().query(`
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='ClientName')
        BEGIN
            ALTER TABLE dbo.Bookings ADD ClientName NVARCHAR(150) NULL;
        END

        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='ClientPhone')
        BEGIN
            ALTER TABLE dbo.Bookings ADD ClientPhone NVARCHAR(50) NULL;
        END

        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='ClientEmail')
        BEGIN
            ALTER TABLE dbo.Bookings ADD ClientEmail NVARCHAR(150) NULL;
        END
    `);

    // Backfill existing bookings with client names from Clients/Users table
    await pool.request().query(`
        UPDATE b
        SET b.ClientName = ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email),
            b.ClientPhone = u.Phone,
            b.ClientEmail = u.Email
        FROM dbo.Bookings b
        LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
        LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
        WHERE b.ClientName IS NULL;
    `);

    console.log('Columns added and backfilled successfully');
    process.exit(0);
}

addColumns();
