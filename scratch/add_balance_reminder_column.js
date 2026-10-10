const { connectDB } = require('../server/config/db');

async function migrate() {
    const pool = await connectDB();
    await pool.request().query(`
        IF OBJECT_ID('dbo.Bookings', 'U') IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('dbo.Bookings') AND name = 'BalanceReminderSentAt')
            BEGIN
                ALTER TABLE dbo.Bookings ADD BalanceReminderSentAt DATETIME2 NULL;
                PRINT 'Added column BalanceReminderSentAt to dbo.Bookings';
            END
            ELSE
            BEGIN
                PRINT 'Column BalanceReminderSentAt already exists in dbo.Bookings';
            END
        END
    `);
    console.log('Migration completed successfully.');
    process.exit(0);
}

migrate();
