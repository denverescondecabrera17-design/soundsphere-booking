/**
 * SoundSphere - Clean Dummy Subscriptions & Payments Script
 * Purges existing test/dummy subscription records so providers can start fresh.
 */

const { connectDB } = require('../server/config/db');

async function cleanDummySubscriptions() {
    console.log("=== Purging Dummy Subscriptions & Payments Data ===");
    try {
        const pool = await connectDB();
        if (!pool) {
            throw new Error('Database pool initialization failed.');
        }

        const delPayments = await pool.request().query("DELETE FROM dbo.SubscriptionPayments");
        console.log(` Deleted ${delPayments.rowsAffected[0]} dummy rows from dbo.SubscriptionPayments.`);

        const delSubs = await pool.request().query("DELETE FROM dbo.ProviderSubscriptions");
        console.log(` Deleted ${delSubs.rowsAffected[0]} dummy rows from dbo.ProviderSubscriptions.`);

        // Reset identity seeds to 0 if needed
        await pool.request().query(`
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'SubscriptionPayments')
                DBCC CHECKIDENT ('dbo.SubscriptionPayments', RESEED, 0);
            IF EXISTS (SELECT * FROM sys.tables WHERE name = 'ProviderSubscriptions')
                DBCC CHECKIDENT ('dbo.ProviderSubscriptions', RESEED, 0);
        `);

        console.log(" Cleaned and reset Provider Subscriptions & Payments tables successfully!");
        process.exit(0);
    } catch (err) {
        console.error(" Error purging dummy subscriptions:", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    cleanDummySubscriptions();
}

module.exports = { cleanDummySubscriptions };
