const { getOrConnectPool } = require('../server/config/db');

(async () => {
    const pool = await getOrConnectPool();
    const tables = [
        'Users', 'Roles', 'Clients', 'ServiceProviders', 'Admins', 
        'ProviderApplications', 'Packages', 'PackageImages', 'Services', 
        'Bookings', 'Payments', 'Reviews', 'Notifications', 'ActivityLogs', 
        'Conversations', 'ConversationParticipants', 'Messages', 
        'PasswordResetTokens', 'Withdrawals', 'ProviderReports', 
        'ProviderDateCapacity', 'OTPVerifications', 'ProviderSubscriptions', 
        'SubscriptionPayments', 'TransportationFees', 'ClientWallets', 
        'WalletTransactions', 'RefundRequests'
    ];
    
    for (const t of tables) {
        const cols = await pool.request().query(`
            SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = '${t}'
            ORDER BY ORDINAL_POSITION
        `);
        console.log(`\n-- ==============================================`);
        console.log(`-- Table: dbo.${t}`);
        console.log(`-- ==============================================`);
        console.log(cols.recordset.map(c => `  ${c.COLUMN_NAME} ${c.DATA_TYPE}${c.CHARACTER_MAXIMUM_LENGTH && c.CHARACTER_MAXIMUM_LENGTH > 0 ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : ''} ${c.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}${c.COLUMN_DEFAULT ? ` DEFAULT ${c.COLUMN_DEFAULT}` : ''}`).join(',\n'));
    }
    process.exit(0);
})();
