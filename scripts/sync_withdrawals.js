const sql = require('mssql');

(async () => {
    const pool = new sql.ConnectionPool({
        user: 'db72897',
        password: 'o#7C?9Bb3Ei_',
        server: 'db72897.public.databaseasp.net',
        database: 'db72897',
        port: 1433,
        options: { encrypt: false, trustServerCertificate: true }
    });
    await pool.connect();
    console.log('Connected to MonsterASP.');

    try {
        await pool.request().query('ALTER TABLE dbo.Withdrawals ALTER COLUMN AccountNumber NVARCHAR(100) NULL;');
        console.log('Altered AccountNumber to NULL in MonsterASP.');
    } catch (e) {
        console.log('Notice altering AccountNumber:', e.message);
    }

    const wRows = [
        { WithdrawalID: 2, ProviderID: 1, Amount: 14962.50, PayoutMethod: 'GCash / Maya E-Wallet', AccountName: 'DENVER CABRERA', AccountReference: '09516028992', Status: 'Approved', RequestedAt: '2026-09-07T11:41:26.477Z', ProcessedAt: '2026-09-10T15:34:02.773Z' },
        { WithdrawalID: 3, ProviderID: 1, Amount: 14962.50, PayoutMethod: 'GCash / Maya E-Wallet', AccountName: 'DENVER CABRERA', AccountReference: '09516028992', Status: 'Rejected', RequestedAt: '2026-09-07T11:41:26.490Z', ProcessedAt: '2026-09-07T11:42:54.727Z', AdminNotes: 'Duplicate submission of WD-2' },
        { WithdrawalID: 4, ProviderID: 1, Amount: 479.75, PayoutMethod: 'GCash / Maya E-Wallet', AccountName: 'jenny de jesus', AccountReference: '09955819060', Status: 'Approved', RequestedAt: '2026-09-10T16:18:14.937Z', ProcessedAt: '2026-09-10T20:43:20.113Z', BookingID: 22 },
        { WithdrawalID: 5, ProviderID: 1, Amount: 486.40, PayoutMethod: 'GCash / Maya E-Wallet', AccountName: 'denver cabrera', AccountReference: '09516028992', Status: 'Approved', RequestedAt: '2026-10-09T11:22:16.710Z', ProcessedAt: '2026-10-11T14:34:52.623Z', AdminNotes: 'Cashier confirmed manual payout sent | Ref: 09516028992', BookingID: 25 }
    ];

    for (const w of wRows) {
        try {
            const processedStr = w.ProcessedAt ? `'${w.ProcessedAt}'` : 'NULL';
            const notesStr = w.AdminNotes ? `'${w.AdminNotes.replace(/'/g, "''")}'` : 'NULL';
            const bIdStr = w.BookingID ? `${w.BookingID}` : 'NULL';
            await pool.request().query(`
                SET IDENTITY_INSERT dbo.Withdrawals ON;
                IF NOT EXISTS (SELECT 1 FROM dbo.Withdrawals WHERE WithdrawalID = ${w.WithdrawalID})
                BEGIN
                    INSERT INTO dbo.Withdrawals (WithdrawalID, ProviderID, Amount, PayoutMethod, AccountName, AccountReference, Status, RequestedAt, ProcessedAt, AdminNotes, BookingID)
                    VALUES (${w.WithdrawalID}, ${w.ProviderID}, ${w.Amount}, '${w.PayoutMethod}', '${w.AccountName}', '${w.AccountReference}', '${w.Status}', '${w.RequestedAt}', ${processedStr}, ${notesStr}, ${bIdStr});
                END;
                SET IDENTITY_INSERT dbo.Withdrawals OFF;
            `);
            console.log(`✅ Inserted withdrawal #${w.WithdrawalID}`);
        } catch (err) {
            console.error(`Error on withdrawal #${w.WithdrawalID}:`, err.message);
        }
    }

    const res = await pool.request().query('SELECT COUNT(*) AS c FROM dbo.Withdrawals');
    console.log(`🎉 Total withdrawals in MonsterASP: ${res.recordset[0].c}`);

    await pool.close();
    process.exit(0);
})();
