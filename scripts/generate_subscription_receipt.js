/**
 * SoundSphere - Generate Subscription Payment Receipt Script
 * Inserts an active subscription and payment receipt into SQL Database for testing.
 */

const { connectDB } = require('../server/config/db');

async function generateSubscriptionReceipt() {
    console.log("=== Generating Subscription Payment Receipt in Database ===");
    try {
        const pool = await connectDB();
        if (!pool) throw new Error('DB connection failed.');

        // Get Provider 1
        const provRes = await pool.request().query("SELECT TOP 1 ProviderID, UserID, BusinessName FROM dbo.ServiceProviders ORDER BY ProviderID ASC");
        if (provRes.recordset.length === 0) {
            console.log("No provider found in database.");
            process.exit(1);
        }

        const provider = provRes.recordset[0];
        const sessionId = `cs_sub_${Date.now()}`;
        const refNo = `SUB-${provider.ProviderID}-${Date.now()}`;

        // Create Monthly Subscription Record
        const subInsert = await pool.request()
            .input('ProviderID', provider.ProviderID)
            .input('UserID', provider.UserID)
            .input('PlanType', 'monthly')
            .input('PlanName', 'Monthly Plan (₱199)')
            .input('Price', 199.00)
            .input('BillingCycle', 'monthly')
            .input('Status', 'Active')
            .input('SessionID', sessionId)
            .query(`
                INSERT INTO dbo.ProviderSubscriptions (
                    ProviderID, UserID, PlanType, PlanName, Price, BillingCycle, Status, StartDate, EndDate, HasUsedFreeTrial, PayMongoSessionID, CreatedAt, UpdatedAt
                )
                OUTPUT INSERTED.SubscriptionID
                VALUES (
                    @ProviderID, @UserID, @PlanType, @PlanName, @Price, @BillingCycle, @Status, GETDATE(), DATEADD(DAY, 30, GETDATE()), 1, @SessionID, GETDATE(), GETDATE()
                )
            `);

        const subId = subInsert.recordset[0].SubscriptionID;

        // Create Payment Receipt Record
        const payInsert = await pool.request()
            .input('SubscriptionID', subId)
            .input('ProviderID', provider.ProviderID)
            .input('PlanType', 'monthly')
            .input('PlanName', 'Monthly Plan (₱199)')
            .input('Amount', 199.00)
            .input('Currency', 'PHP')
            .input('PaymentMethod', 'PayMongo (GCash / Maya / Card)')
            .input('SessionID', sessionId)
            .input('Notes', `Official Subscription Payment Receipt for ${provider.BusinessName}`)
            .query(`
                INSERT INTO dbo.SubscriptionPayments (
                    SubscriptionID, ProviderID, PlanType, PlanName, Amount, Currency, PaymentMethod, PayMongoSessionID, PaymentStatus, PaymentDate, Notes
                )
                OUTPUT INSERTED.PaymentID
                VALUES (
                    @SubscriptionID, @ProviderID, @PlanType, @PlanName, @Amount, @Currency, @PaymentMethod, @SessionID, 'Paid', GETDATE(), @Notes
                )
            `);

        const paymentId = payInsert.recordset[0].PaymentID;

        console.log(` Created Subscription Receipt #${paymentId} (Invoice INV-SUB-${String(paymentId).padStart(5, '0')}) for ${provider.BusinessName}!`);
        console.log(` Reference ID: ${sessionId}`);
        process.exit(0);
    } catch (err) {
        console.error(" Error generating subscription receipt:", err.message);
        process.exit(1);
    }
}

if (require.main === module) {
    generateSubscriptionReceipt();
}

module.exports = { generateSubscriptionReceipt };
