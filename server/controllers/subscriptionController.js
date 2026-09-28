/**
 * SoundSphere - Service Provider Subscription Controller
 * Supports:
 * 1. Free Trial (1st month, 30 days, ₱0)
 * 2. Monthly Subscription (₱199 / 30 days)
 * 3. Yearly Subscription (₱1,990 / 365 days)
 * 4. PayMongo Payment Gateway Integration
 * 5. Direct Admin Monitoring & Real-Time Financial Tracking
 */

const { connectDB } = require('../config/db');
const sql = require('mssql');
const paymongoService = require('../services/paymongoService');

// Helper to resolve ProviderID from UserID
async function getProviderByUserId(pool, userId) {
    const res = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT TOP 1 ProviderID, UserID, BusinessName, OwnerName 
            FROM dbo.ServiceProviders 
            WHERE UserID = @UserID
        `);
    return res.recordset[0] || null;
}

/**
 * GET /api/subscriptions/my-subscription
 * Get current provider's active subscription status, trial eligibility, and payment history
 */
exports.getMySubscription = async (req, res) => {
    try {
        const pool = await connectDB();
        const userId = req.user.userId;
        const provider = await getProviderByUserId(pool, userId);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.'
            });
        }

        // 1. Fetch current / latest subscription
        const subRes = await pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .query(`
                SELECT TOP 1 
                    SubscriptionID,
                    ProviderID,
                    UserID,
                    PlanType,
                    PlanName,
                    Price,
                    BillingCycle,
                    Status,
                    StartDate,
                    EndDate,
                    HasUsedFreeTrial,
                    PayMongoSessionID,
                    CreatedAt,
                    CASE 
                        WHEN EndDate >= GETDATE() AND Status = 'Active' THEN 1 
                        ELSE 0 
                    END AS IsActive,
                    DATEDIFF(DAY, GETDATE(), EndDate) AS DaysRemaining
                FROM dbo.ProviderSubscriptions
                WHERE ProviderID = @ProviderID
                ORDER BY EndDate DESC, SubscriptionID DESC
            `);

        const currentSubscription = subRes.recordset[0] || null;

        // 2. Check if provider has ever claimed the 1st month free trial
        const trialCheckRes = await pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT TOP 1 HasUsedFreeTrial 
                FROM dbo.ProviderSubscriptions 
                WHERE (ProviderID = @ProviderID OR UserID = @UserID) 
                  AND (HasUsedFreeTrial = 1 OR PlanType = 'free_trial')
            `);
        const hasUsedFreeTrial = trialCheckRes.recordset.length > 0;

        // 3. Fetch payment history
        const paymentsRes = await pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .query(`
                SELECT 
                    PaymentID,
                    SubscriptionID,
                    PlanType,
                    PlanName,
                    Amount,
                    Currency,
                    PaymentMethod,
                    PayMongoSessionID,
                    PaymentStatus,
                    PaymentDate,
                    Notes
                FROM dbo.SubscriptionPayments
                WHERE ProviderID = @ProviderID
                ORDER BY PaymentDate DESC
            `);

        return res.status(200).json({
            success: true,
            provider: {
                providerId: provider.ProviderID,
                businessName: provider.BusinessName,
                ownerName: provider.OwnerName
            },
            subscription: currentSubscription,
            hasUsedFreeTrial,
            payments: paymentsRes.recordset || []
        });
    } catch (err) {
        console.error('Error fetching provider subscription:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subscription information.'
        });
    }
};

/**
 * POST /api/subscriptions/free-trial
 * Activate the complimentary 1st month (30 days) Free Trial at ₱0.00
 */
exports.activateFreeTrial = async (req, res) => {
    try {
        const pool = await connectDB();
        const userId = req.user.userId;
        const provider = await getProviderByUserId(pool, userId);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.'
            });
        }

        // Verify provider hasn't already used the free trial
        const checkRes = await pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT TOP 1 SubscriptionID 
                FROM dbo.ProviderSubscriptions 
                WHERE (ProviderID = @ProviderID OR UserID = @UserID) 
                  AND (HasUsedFreeTrial = 1 OR PlanType = 'free_trial')
            `);

        if (checkRes.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'The 1st Month Free Trial has already been claimed for this provider account.'
            });
        }

        // Create 30-day Free Trial Subscription
        const insertRes = await pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('UserID', sql.Int, userId)
            .query(`
                INSERT INTO dbo.ProviderSubscriptions (
                    ProviderID,
                    UserID,
                    PlanType,
                    PlanName,
                    Price,
                    BillingCycle,
                    Status,
                    StartDate,
                    EndDate,
                    HasUsedFreeTrial,
                    CreatedAt,
                    UpdatedAt
                )
                OUTPUT INSERTED.SubscriptionID
                VALUES (
                    @ProviderID,
                    @UserID,
                    'free_trial',
                    'Free Trial (1st Month)',
                    0.00,
                    '30_days',
                    'Active',
                    GETDATE(),
                    DATEADD(DAY, 30, GETDATE()),
                    1,
                    GETDATE(),
                    GETDATE()
                );
            `);

        const newSubId = insertRes.recordset[0].SubscriptionID;

        return res.status(200).json({
            success: true,
            message: '🎉 1st Month Free Trial activated successfully! Enjoy 30 days of full platform access.',
            subscriptionId: newSubId
        });
    } catch (err) {
        console.error('Error activating free trial:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to activate free trial. Please try again.'
        });
    }
};

/**
 * POST /api/subscriptions/checkout
 * Initialize PayMongo Checkout Session for Monthly (₱199) or Yearly (₱1,990) subscription
 */
exports.createSubscriptionCheckout = async (req, res) => {
    try {
        const pool = await connectDB();
        const userId = req.user.userId;
        const provider = await getProviderByUserId(pool, userId);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.'
            });
        }

        const planTypeInput = (req.body.planType || '').toLowerCase().trim();
        if (!planTypeInput || (planTypeInput !== 'monthly' && planTypeInput !== 'yearly')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid plan type selected. Must be "monthly" or "yearly".'
            });
        }

        const isYearly = planTypeInput === 'yearly';
        const targetPlan = isYearly ? 'yearly' : 'monthly';
        const price = isYearly ? 1990.00 : 199.00;
        const planName = isYearly 
            ? 'SoundSphere Provider Yearly Subscription (₱1,990 / Year)' 
            : 'SoundSphere Provider Monthly Subscription (₱199 / Month)';
        const reference = `SUB-${provider.ProviderID}-${Date.now()}`;

        // Get Host base URL for callbacks
        const originHost = `${req.protocol}://${req.get('host')}`;

        // Create Checkout Session via PayMongo Service
        const sessionResult = await paymongoService.createCheckoutSession({
            amount: price,
            packageName: planName,
            bookingReference: reference,
            paymentType: 'full',
            paymentMethod: 'all',
            clientEmail: req.user.email || '',
            clientName: provider.BusinessName || provider.OwnerName || 'Service Provider',
            originHost
        });

        if (!sessionResult || !sessionResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to initialize PayMongo checkout session.'
            });
        }

        // Custom redirect URL for subscription confirmation
        let finalCheckoutUrl = sessionResult.checkoutUrl;
        if (sessionResult.mode === 'paymongo_sandbox_simulated') {
            finalCheckoutUrl = `${originHost}/provider/dashboard.html?subscription_status=success&session_id=${encodeURIComponent(sessionResult.sessionId)}&plan=${targetPlan}&amount=${price}&simulated=1`;
        }

        return res.status(200).json({
            success: true,
            checkoutUrl: finalCheckoutUrl,
            sessionId: sessionResult.sessionId,
            reference,
            amount: price,
            planType: targetPlan,
            planName
        });
    } catch (err) {
        console.error('Error creating subscription checkout:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to create subscription checkout session.'
        });
    }
};

/**
 * POST /api/subscriptions/confirm
 * Verify PayMongo session and activate/renew subscription in database
 */
exports.confirmSubscriptionPayment = async (req, res) => {
    try {
        const pool = await connectDB();
        const userId = req.user.userId;
        const provider = await getProviderByUserId(pool, userId);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Provider profile not found.'
            });
        }

        const { sessionId, planType } = req.body;
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Missing PayMongo session ID.'
            });
        }

        const targetPlan = (planType === 'yearly') ? 'yearly' : 'monthly';
        const price = (targetPlan === 'yearly') ? 1990.00 : 199.00;
        const durationDays = (targetPlan === 'yearly') ? 365 : 30;
        const planName = (targetPlan === 'yearly') 
            ? 'Yearly Plan (₱1,990)' 
            : 'Monthly Plan (₱199)';

        // 1. Idempotency check: Ensure session hasn't already been processed
        const existingPayment = await pool.request()
            .input('SessionID', sql.NVarChar(150), sessionId)
            .query(`SELECT PaymentID FROM dbo.SubscriptionPayments WHERE PayMongoSessionID = @SessionID`);

        if (existingPayment.recordset.length > 0) {
            return res.status(200).json({
                success: true,
                message: 'Subscription payment already verified and active.'
            });
        }

        // 2. Verify payment status from PayMongo
        const verifyRes = await paymongoService.getCheckoutSessionStatus(sessionId);
        if (!verifyRes || !verifyRes.success) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed with PayMongo.'
            });
        }

        // 3. Check for existing active subscription to extend, or start from now
        const currentActive = await pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .query(`
                SELECT TOP 1 EndDate 
                FROM dbo.ProviderSubscriptions 
                WHERE ProviderID = @ProviderID 
                  AND Status = 'Active' 
                  AND EndDate > GETDATE()
                ORDER BY EndDate DESC
            `);

        let baseDateQuery = 'GETDATE()';
        if (currentActive.recordset.length > 0 && currentActive.recordset[0].EndDate) {
            // Extend from current active expiration date!
            baseDateQuery = '@CurrentEndDate';
        }

        const reqInsert = pool.request()
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('UserID', sql.Int, userId)
            .input('PlanType', sql.NVarChar(50), targetPlan)
            .input('PlanName', sql.NVarChar(100), planName)
            .input('Price', sql.Decimal(18, 2), price)
            .input('BillingCycle', sql.NVarChar(50), targetPlan)
            .input('DurationDays', sql.Int, durationDays)
            .input('SessionID', sql.NVarChar(150), sessionId);

        if (currentActive.recordset.length > 0) {
            reqInsert.input('CurrentEndDate', sql.DateTime2, currentActive.recordset[0].EndDate);
        }

        const insertSubRes = await reqInsert.query(`
            INSERT INTO dbo.ProviderSubscriptions (
                ProviderID,
                UserID,
                PlanType,
                PlanName,
                Price,
                BillingCycle,
                Status,
                StartDate,
                EndDate,
                HasUsedFreeTrial,
                PayMongoSessionID,
                CreatedAt,
                UpdatedAt
            )
            OUTPUT INSERTED.SubscriptionID
            VALUES (
                @ProviderID,
                @UserID,
                @PlanType,
                @PlanName,
                @Price,
                @BillingCycle,
                'Active',
                GETDATE(),
                DATEADD(DAY, @DurationDays, ${baseDateQuery}),
                1,
                @SessionID,
                GETDATE(),
                GETDATE()
            );
        `);

        const newSubId = insertSubRes.recordset[0].SubscriptionID;

        // 4. Record Payment in dbo.SubscriptionPayments
        await pool.request()
            .input('SubscriptionID', sql.Int, newSubId)
            .input('ProviderID', sql.Int, provider.ProviderID)
            .input('PlanType', sql.NVarChar(50), targetPlan)
            .input('PlanName', sql.NVarChar(100), planName)
            .input('Amount', sql.Decimal(18, 2), price)
            .input('SessionID', sql.NVarChar(150), sessionId)
            .query(`
                INSERT INTO dbo.SubscriptionPayments (
                    SubscriptionID,
                    ProviderID,
                    PlanType,
                    PlanName,
                    Amount,
                    Currency,
                    PaymentMethod,
                    PayMongoSessionID,
                    PaymentStatus,
                    PaymentDate,
                    Notes
                ) VALUES (
                    @SubscriptionID,
                    @ProviderID,
                    @PlanType,
                    @PlanName,
                    @Amount,
                    'PHP',
                    'PayMongo',
                    @SessionID,
                    'Paid',
                    GETDATE(),
                    'Successful subscription checkout payment via PayMongo'
                );
            `);

        return res.status(200).json({
            success: true,
            message: `✨ ${planName} successfully activated! Payment verified with PayMongo.`,
            subscriptionId: newSubId
        });
    } catch (err) {
        console.error('Error confirming subscription payment:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to confirm subscription payment.'
        });
    }
};

/**
 * GET /api/subscriptions/admin/overview
 * Admin Monitoring: Comprehensive overview of all provider subscriptions, financial metrics, and payment records
 */
exports.getAdminSubscriptionsOverview = async (req, res) => {
    try {
        const pool = await connectDB();

        // 1. Financial & Subscription KPI Summary (Distinct Provider Accounts)
        const kpiRes = await pool.request().query(`
            SELECT
                -- Total Revenue collected directly from paid subscriptions
                ISNULL((SELECT SUM(Amount) FROM dbo.SubscriptionPayments WHERE PaymentStatus = 'Paid'), 0) AS TotalSubscriptionRevenue,
                
                -- Distinct Active provider accounts currently running a plan
                (
                    SELECT COUNT(DISTINCT ProviderID) 
                    FROM dbo.ProviderSubscriptions 
                    WHERE Status = 'Active' AND EndDate >= GETDATE()
                ) AS ActiveSubscriptionsCount,
                
                -- Distinct Free Trial provider accounts currently active
                (
                    SELECT COUNT(DISTINCT ProviderID) 
                    FROM dbo.ProviderSubscriptions 
                    WHERE Status = 'Active' AND EndDate >= GETDATE() AND PlanType IN ('free_trial', 'FreeTrial')
                ) AS FreeTrialCount,
                
                -- Distinct Monthly paying subscribers currently active
                (
                    SELECT COUNT(DISTINCT ProviderID) 
                    FROM dbo.ProviderSubscriptions 
                    WHERE Status = 'Active' AND EndDate >= GETDATE() AND PlanType IN ('monthly', 'Monthly')
                ) AS MonthlySubscribersCount,
                
                -- Distinct Yearly paying subscribers currently active
                (
                    SELECT COUNT(DISTINCT ProviderID) 
                    FROM dbo.ProviderSubscriptions 
                    WHERE Status = 'Active' AND EndDate >= GETDATE() AND PlanType IN ('yearly', 'Yearly')
                ) AS YearlySubscribersCount,
                
                -- Expired provider accounts
                (
                    SELECT COUNT(DISTINCT ProviderID) 
                    FROM dbo.ProviderSubscriptions 
                    WHERE ProviderID NOT IN (
                        SELECT ProviderID FROM dbo.ProviderSubscriptions WHERE Status = 'Active' AND EndDate >= GETDATE()
                    )
                ) AS ExpiredSubscriptionsCount;
        `);

        const kpis = kpiRes.recordset[0] || {
            TotalSubscriptionRevenue: 0,
            ActiveSubscriptionsCount: 0,
            FreeTrialCount: 0,
            MonthlySubscribersCount: 0,
            YearlySubscribersCount: 0,
            ExpiredSubscriptionsCount: 0
        };

        // 2. Deduplicated Latest Provider Subscriptions Directory (1 row per Provider Account)
        const listRes = await pool.request().query(`
            WITH LatestSubscriptions AS (
                SELECT 
                    ps.SubscriptionID,
                    ps.ProviderID,
                    ps.UserID,
                    ps.PlanType,
                    ps.PlanName,
                    ps.Price,
                    ps.BillingCycle,
                    ps.Status,
                    ps.StartDate,
                    ps.EndDate,
                    ps.PayMongoSessionID,
                    ps.CreatedAt,
                    ROW_NUMBER() OVER (
                        PARTITION BY ps.ProviderID 
                        ORDER BY 
                            CASE WHEN ps.Status = 'Active' AND ps.EndDate >= GETDATE() THEN 1 ELSE 2 END,
                            ps.EndDate DESC, 
                            ps.SubscriptionID DESC
                    ) AS RowNum
                FROM dbo.ProviderSubscriptions ps
            )
            SELECT 
                sub.SubscriptionID,
                sub.ProviderID,
                sub.UserID,
                ISNULL(sp.BusinessName, 'Provider #' + CAST(sub.ProviderID AS NVARCHAR)) AS BusinessName,
                ISNULL(sp.OwnerName, u.Email) AS OwnerName,
                u.Email,
                u.Phone,
                sub.PlanType,
                sub.PlanName,
                sub.Price,
                sub.BillingCycle,
                sub.Status,
                sub.StartDate,
                sub.EndDate,
                sub.PayMongoSessionID,
                sub.PayMongoSessionID AS PayMongoPaymentID,
                sub.CreatedAt,
                CASE 
                    WHEN sub.EndDate >= GETDATE() AND sub.Status = 'Active' THEN 'active'
                    ELSE 'expired'
                END AS SubscriptionStatus,
                CASE 
                    WHEN sub.EndDate >= GETDATE() AND sub.Status = 'Active' THEN 'Active'
                    ELSE 'Expired'
                END AS CurrentStatus,
                DATEDIFF(DAY, GETDATE(), sub.EndDate) AS DaysRemaining
            FROM LatestSubscriptions sub
            JOIN dbo.ServiceProviders sp ON sub.ProviderID = sp.ProviderID
            JOIN dbo.Users u ON sub.UserID = u.UserID
            WHERE sub.RowNum = 1
            ORDER BY sub.CreatedAt DESC;
        `);

        // 3. Recent Payment Transactions
        const paymentsRes = await pool.request().query(`
            SELECT TOP 50
                p.PaymentID,
                p.SubscriptionID,
                p.ProviderID,
                ISNULL(sp.BusinessName, 'Provider #' + CAST(p.ProviderID AS NVARCHAR)) AS BusinessName,
                p.PlanType,
                p.PlanName,
                p.Amount,
                p.Currency,
                p.PaymentMethod,
                p.PayMongoSessionID,
                p.PaymentStatus,
                p.PaymentDate,
                p.Notes
            FROM dbo.SubscriptionPayments p
            LEFT JOIN dbo.ServiceProviders sp ON p.ProviderID = sp.ProviderID
            WHERE p.Amount > 0
            ORDER BY p.PaymentDate DESC;
        `);

        const overviewObj = {
            totalSubscriptionRevenue: parseFloat(kpis.TotalSubscriptionRevenue) || 0,
            activeSubscriptions: parseInt(kpis.ActiveSubscriptionsCount) || 0,
            freeTrialSubscriptions: parseInt(kpis.FreeTrialCount) || 0,
            monthlySubscribers: parseInt(kpis.MonthlySubscribersCount) || 0,
            yearlySubscribers: parseInt(kpis.YearlySubscribersCount) || 0,
            paidSubscribers: (parseInt(kpis.MonthlySubscribersCount) || 0) + (parseInt(kpis.YearlySubscribersCount) || 0),
            expiredSubscriptions: parseInt(kpis.ExpiredSubscriptionsCount) || 0
        };

        return res.status(200).json({
            success: true,
            overview: overviewObj,
            kpis: overviewObj,
            subscriptions: listRes.recordset || [],
            payments: paymentsRes.recordset || []
        });
    } catch (err) {
        console.error('Error fetching admin subscriptions overview:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve admin subscription metrics.'
        });
    }
};
