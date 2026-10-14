const { connectDB } = require('../server/config/db');
(async () => {
    const pool = await connectDB();
    const res = await pool.request().query("SELECT GETDATE() AS SqlGetDate, SYSDATETIMEOFFSET() AS SysOffset, DATEDIFF(DAY, GETDATE(), '2026-11-17 15:59:23') AS Diff");
    console.log(res.recordset[0]);
    process.exit(0);
})();
