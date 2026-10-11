/**
 * SoundSphere - Export Local Database Data to Azure SQL
 * Reads all data from local SoundSphereDB and generates a ready-to-run
 * SQL script (database/sync_localhost_data_to_azure.sql) that can be
 * executed in SSMS or Azure Query Editor.
 */

const fs = require('fs');
const path = require('path');
const { getOrConnectPool } = require('../server/config/db');

const escapeSql = (val) => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (val instanceof Date) return `'${val.toISOString()}'`;
    return `'${String(val).replace(/'/g, "''")}'`;
};

const tablesToExport = [
    { name: 'Roles', pkey: 'RoleID', hasIdentity: true },
    { name: 'Users', pkey: 'UserID', hasIdentity: true },
    { name: 'Clients', pkey: 'ClientID', hasIdentity: true },
    { name: 'ServiceProviders', pkey: 'ProviderID', hasIdentity: true },
    { name: 'Packages', pkey: 'PackageID', hasIdentity: true },
    { name: 'PackageImages', pkey: 'ImageID', hasIdentity: true },
    { name: 'ProviderDateCapacity', pkey: 'CapacityID', hasIdentity: true },
    { name: 'Bookings', pkey: 'BookingID', hasIdentity: true },
    { name: 'Payments', pkey: 'PaymentID', hasIdentity: true },
    { name: 'ClientWallets', pkey: 'WalletID', hasIdentity: true },
    { name: 'WalletTransactions', pkey: 'TransactionID', hasIdentity: true },
    { name: 'Withdrawals', pkey: 'WithdrawalID', hasIdentity: true },
    { name: 'RefundRequests', pkey: 'RefundRequestID', hasIdentity: true },
    { name: 'Reviews', pkey: 'ReviewID', hasIdentity: true },
    { name: 'ProviderSubscriptions', pkey: 'SubscriptionID', hasIdentity: true },
    { name: 'SubscriptionPayments', pkey: 'PaymentID', hasIdentity: true },
    { name: 'TransportationFees', pkey: 'FeeID', hasIdentity: true },
    { name: 'Conversations', pkey: 'ConversationID', hasIdentity: true },
    { name: 'ConversationParticipants', pkey: 'ParticipantID', hasIdentity: true },
    { name: 'Messages', pkey: 'MessageID', hasIdentity: true },
    { name: 'Notifications', pkey: 'NotificationID', hasIdentity: true }
];

(async () => {
    console.log('🔄 Connecting to local SoundSphereDB...');
    let pool;
    try {
        pool = await getOrConnectPool();
    } catch (e) {
        console.error('❌ Failed to connect to local DB:', e.message);
        process.exit(1);
    }

    const sqlLines = [];
    sqlLines.push('-- ========================================================');
    sqlLines.push('-- SoundSphere - Sync Localhost Data to Azure SQL Database');
    sqlLines.push(`-- Generated: ${new Date().toISOString()}`);
    sqlLines.push('-- ========================================================\n');
    sqlLines.push('SET NOCOUNT ON;\n');

    let totalRecords = 0;

    for (const t of tablesToExport) {
        try {
            // Check if table exists
            const chk = await pool.request().query(`
                SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = '${t.name}'
            `);
            if (chk.recordset.length === 0) continue;

            const res = await pool.request().query(`SELECT * FROM dbo.[${t.name}] ORDER BY [${t.pkey}] ASC`);
            const rows = res.recordset || [];
            if (rows.length === 0) continue;

            totalRecords += rows.length;
            console.log(`📦 Exporting dbo.[${t.name}]: ${rows.length} record(s)...`);

            sqlLines.push(`-- --------------------------------------------------------`);
            sqlLines.push(`-- Table: dbo.[${t.name}] (${rows.length} records)`);
            sqlLines.push(`-- --------------------------------------------------------`);
            if (t.hasIdentity) sqlLines.push(`SET IDENTITY_INSERT dbo.[${t.name}] ON;`);

            const columns = Object.keys(rows[0]);
            const colList = columns.map(c => `[${c}]`).join(', ');

            for (const r of rows) {
                const valList = columns.map(c => escapeSql(r[c])).join(', ');
                const pVal = escapeSql(r[t.pkey]);
                
                sqlLines.push(`
IF NOT EXISTS (SELECT 1 FROM dbo.[${t.name}] WHERE [${t.pkey}] = ${pVal})
BEGIN
    INSERT INTO dbo.[${t.name}] (${colList})
    VALUES (${valList});
END;`);
            }

            if (t.hasIdentity) sqlLines.push(`SET IDENTITY_INSERT dbo.[${t.name}] OFF;\n`);
            else sqlLines.push('\n');
        } catch (tableErr) {
            console.warn(`⚠️ Notice for table ${t.name}:`, tableErr.message);
        }
    }

    sqlLines.push('\nPRINT \'✅ SoundSphere local data successfully synced to Azure SQL!\';');

    const outPath = path.resolve(__dirname, '../database/sync_localhost_data_to_azure.sql');
    fs.writeFileSync(outPath, sqlLines.join('\n'), 'utf8');

    console.log(`\n🎉 Generated SQL export with ${totalRecords} records across tables!`);
    console.log(`📁 File written to: ${outPath}`);
    process.exit(0);
})();
