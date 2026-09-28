const { connectDB, getPool } = require('../server/config/db');

(async () => {
    await connectDB();
    const pool = getPool();

    // 1. Add column if missing
    await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Bookings' AND COLUMN_NAME='EscrowStatus')
        BEGIN
            ALTER TABLE dbo.Bookings ADD EscrowStatus NVARCHAR(30) NOT NULL DEFAULT 'Held';
        END
    `);

    // 2. Update existing rows
    await pool.request().query(`
        UPDATE dbo.Bookings 
        SET EscrowStatus = CASE 
            WHEN BookingStatus = 'Completed' THEN 'Pending Release'
            ELSE 'Held'
        END
        WHERE EscrowStatus IS NULL OR EscrowStatus = 'Held';
    `);

    console.log('Escrow column migration finished successfully.');
    process.exit(0);
})();
