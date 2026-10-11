const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { connectDB } = require('../server/config/db');

(async () => {
    const pool = await connectDB();
    const pkgRes = await pool.request().query('SELECT * FROM dbo.Packages;');
    console.log('ALL PACKAGES IN DB (' + pkgRes.recordset.length + '):', JSON.stringify(pkgRes.recordset.map(p => ({
        PackageID: p.PackageID,
        PackageName: p.PackageName,
        ProviderID: p.ProviderID || p.UserID,
        Price: p.Price,
        IsActive: p.IsActive,
        IsTrending: p.IsTrending,
        IsFlashDeal: p.IsFlashDeal
    })), null, 2));

    const provRes = await pool.request().query('SELECT * FROM dbo.ServiceProviders;');
    console.log('ALL PROVIDERS IN DB (' + provRes.recordset.length + '):', JSON.stringify(provRes.recordset.map(p => ({
        ProviderID: p.ProviderID,
        UserID: p.UserID,
        BusinessName: p.BusinessName,
        VerificationStatus: p.VerificationStatus,
        IsActive: p.IsActive
    })), null, 2));

    process.exit(0);
})();
