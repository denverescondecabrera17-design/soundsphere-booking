const { connectDB } = require('../server/config/db');

async function checkPricingSchema() {
    console.log("=== Checking Pricing & Transportation Database Schema ===");
    const pool = await connectDB();

    const pkgCols = await pool.request().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Packages'");
    console.log('Packages columns:', pkgCols.recordset.map(c => c.column_name));

    const spCols = await pool.request().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'ServiceProviders'");
    console.log('ServiceProviders columns:', spCols.recordset.map(c => c.column_name));

    const bkCols = await pool.request().query("SELECT column_name FROM information_schema.columns WHERE table_name = 'Bookings'");
    console.log('Bookings columns:', bkCols.recordset.map(c => c.column_name));

    const tfTable = await pool.request().query("SELECT OBJECT_ID('dbo.TransportationFees', 'U') AS TableID");
    console.log('TransportationFees Table exists:', tfTable.recordset[0].TableID !== null);

    process.exit(0);
}

checkPricingSchema();
