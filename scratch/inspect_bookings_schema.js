const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB, getPool } = require(path.join(__dirname, '../server/config/db'));

async function inspectBookings() {
    try {
        await connectDB();
        const pool = getPool();

        // Check column names in Bookings table
        const colRes = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'Bookings'
            ORDER BY ORDINAL_POSITION
        `);
        console.log('Bookings columns:', colRes.recordset.map(r => r.COLUMN_NAME).join(', '));

        // Check a sample booking to see what ProviderID contains
        const sample = await pool.request().query(`
            SELECT TOP 3 BookingID, ProviderID, ClientUserID, PackageName FROM dbo.Bookings
        `);
        console.log('Sample bookings:', JSON.stringify(sample.recordset, null, 2));

        // Check what values are in ServiceProviders
        const sp = await pool.request().query(`
            SELECT ProviderID, UserID, BusinessName FROM dbo.ServiceProviders
        `);
        console.log('ServiceProviders:', JSON.stringify(sp.recordset, null, 2));

        process.exit(0);
    } catch (e) {
        console.error('Error:', e.message);
        process.exit(1);
    }
}

inspectBookings();
