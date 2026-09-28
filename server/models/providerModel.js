/**
 * SoundSphere - Service Provider Model
 * DBMS: Microsoft SQL Server (SSMS)
 * Handles provider queries, filtering, and marketplace data retrieval
 */

const { getPool, connectDB } = require('../config/db');

/**
 * Get All Approved & Active Service Providers directly from SQL Server Database
 * @param {Object} filters - { category, location, date, search }
 */
const getAllApprovedProviders = async (filters = {}) => {
    let allProviders = [];

    try {
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        const query = `
            SELECT 
                u.UserID,
                COALESCE(sp.BusinessName, pa.BusinessName, NULLIF(LTRIM(RTRIM(COALESCE(c.FirstName, '') + ' ' + COALESCE(c.LastName, ''))), ''), u.Email) AS BusinessName,
                COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(c.FirstName, '') + ' ' + COALESCE(c.LastName, ''))), ''), sp.OwnerName, pa.OwnerName, 'Service Provider') AS OwnerName,
                u.Email,
                COALESCE(u.Phone, pa.ContactNumber) AS Phone,
                sp.ProfilePicture AS ProviderProfilePicture,
                u.ProfilePicture AS UserProfilePicture,
                COALESCE(sp.CoverageArea, pa.CoverageArea, c.Address, 'Batangas') AS CoverageArea,
                COALESCE(sp.Description, 'Professional Lights & Sounds Service Provider.') AS Description,
                COALESCE(sp.BusinessAddress, pa.BusinessAddress, c.Address) AS BusinessAddress,
                COALESCE(sp.VerificationStatus, pa.Status, 'Approved') AS VerificationStatus
            FROM dbo.Users u
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
            LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID
            LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
            WHERE (r.RoleName = 'ServiceProvider' OR u.RoleID = 3 OR sp.VerificationStatus = 'Approved' OR pa.Status = 'Approved') 
              AND ISNULL(r.RoleName, '') != 'Admin'
              AND ISNULL(u.RoleID, 0) != 1
              AND u.AccountStatus = 'Active'
        `;

        const result = await pool.request().query(query);

        // Fetch real packages & photos from dbo.Packages & dbo.PackageImages
        let packagesMap = {};
        try {
            const pkgRes = await pool.request().query(`
                SELECT 
                    p.*,
                    pi.ImageID,
                    pi.ImageUrl
                FROM dbo.Packages p
                LEFT JOIN dbo.PackageImages pi ON p.PackageID = pi.PackageID
                WHERE p.IsActive = 1
                ORDER BY p.PackageID DESC, pi.ImageID ASC
            `);

            const packageObjMap = {};
            (pkgRes.recordset || []).forEach(row => {
                const uid = row.UserID;
                const pid = row.PackageID;
                if (!packagesMap[uid]) packagesMap[uid] = {};

                if (!packagesMap[uid][pid]) {
                    packagesMap[uid][pid] = {
                        id: row.PackageID,
                        PackageID: row.PackageID,
                        name: row.PackageName,
                        title: row.PackageName,
                        price: parseFloat(row.Price || 0),
                        category: row.Category || 'Concert Audio & Stage Lights',
                        description: row.Description || '',
                        inclusions: row.Inclusions ? row.Inclusions.split(',').map(s => s.trim()) : [],
                        isActive: row.IsActive,
                        images: []
                    };
                }

                if (row.ImageID && row.ImageUrl) {
                    packagesMap[uid][pid].images.push({
                        id: row.ImageID,
                        url: row.ImageUrl
                    });
                }
            });

            Object.keys(packagesMap).forEach(uid => {
                packagesMap[uid] = Object.values(packagesMap[uid]);
            });
        } catch (pkgErr) {
            console.warn('Query dbo.Packages notice:', pkgErr.message);
        }

        // Fetch real client reviews from dbo.Reviews
        let reviewsMap = {};
        try {
            const revRes = await pool.request().query(`
                SELECT 
                    r.ReviewID,
                    r.ProviderID,
                    r.UserID,
                    r.BookingID,
                    r.Rating,
                    r.ReviewText,
                    r.SubmittedAt,
                    COALESCE(NULLIF(LTRIM(RTRIM(COALESCE(c.FirstName, '') + ' ' + COALESCE(c.LastName, ''))), ''), u.Email, 'Verified Client') AS ClientName,
                    b.PackageName,
                    b.EventDate
                FROM dbo.Reviews r
                LEFT JOIN dbo.Users u ON r.UserID = u.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                LEFT JOIN dbo.Bookings b ON r.BookingID = b.BookingID
                ORDER BY r.SubmittedAt DESC
            `);

            (revRes.recordset || []).forEach(row => {
                const pid = row.ProviderID;
                if (!reviewsMap[pid]) reviewsMap[pid] = [];
                reviewsMap[pid].push({
                    reviewId: row.ReviewID,
                    rating: row.Rating || 5,
                    comment: row.ReviewText || '',
                    clientName: row.ClientName || 'Verified Client',
                    packageName: row.PackageName || 'Audio-Visual Rental',
                    eventDate: row.EventDate ? new Date(row.EventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent Event',
                    submittedAt: row.SubmittedAt
                });
            });
        } catch (revErr) {
            console.warn('Query dbo.Reviews notice:', revErr.message);
        }

        allProviders = (result.recordset || []).map(p => {
            const provPkgs = packagesMap[p.UserID] || [];
            const provReviews = reviewsMap[p.UserID] || [];

            let avgRating = 5.0;
            if (provReviews.length > 0) {
                const sum = provReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
                avgRating = parseFloat((sum / provReviews.length).toFixed(1));
            }

            let startingPrice = 15000;
            if (provPkgs.length > 0) {
                startingPrice = Math.min(...provPkgs.map(k => k.price));
            }

            const categories = [...new Set(provPkgs.map(k => k.category))];

            let firstSetupPhoto = null;
            for (const pkg of provPkgs) {
                if (pkg.images && pkg.images.length > 0 && pkg.images[0].url) {
                    firstSetupPhoto = pkg.images[0].url;
                    break;
                }
            }
            const bannerUrl = firstSetupPhoto || p.ProviderProfilePicture || p.UserProfilePicture || null;

            return {
                id: p.UserID,
                userId: p.UserID,
                name: p.BusinessName || 'SoundSphere Service Provider',
                businessName: p.BusinessName || 'SoundSphere Service Provider',
                ownerName: p.OwnerName || 'Provider Owner',
                email: p.Email || '',
                phone: p.Phone || '',
                profilePicture: p.ProviderProfilePicture || null,
                avatar: p.ProviderProfilePicture || null,
                userProfilePicture: p.UserProfilePicture || null,
                description: p.Description || 'Professional Lights & Sounds Service Provider.',
                businessAddress: p.BusinessAddress || '',
                verificationStatus: p.VerificationStatus || 'Approved',
                verified: (p.VerificationStatus === 'Approved' || p.VerificationStatus === 'Active'),
                rating: avgRating,
                reviewsCount: provReviews.length,
                reviews: provReviews,
                banner: bannerUrl,
                coverageArea: p.CoverageArea || "Batangas",
                coverageRadiusKm: 30,
                startingPrice: startingPrice,
                categories: categories.length > 0 ? categories : ["Concert Audio & Stage Lights"],
                packages: provPkgs,
            };
        });
    } catch (dbErr) {
        console.warn('DB query for ServiceProviders:', dbErr.message);
        allProviders = [];
    }

    // Apply Category Filtering
    if (filters.category && filters.category !== 'All' && filters.category !== 'all') {
        allProviders = allProviders.filter(p => p.categories.includes(filters.category));
    }

    // Apply Universal Search Filtering (Place, Events, Inclusions/Equipment, Business Name, Categories, Package Details)
    if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const rawTerms = q.split(/\s+/).filter(Boolean);

        allProviders = allProviders.filter(p => {
            const searchableText = [
                p.name || '',
                p.businessName || '',
                p.ownerName || '',
                p.coverageArea || '',
                p.businessAddress || '',
                p.description || '',
                (p.categories || []).join(' '),
                (p.packages || []).map(pkg => `${pkg.name || ''} ${pkg.title || ''} ${pkg.PackageName || ''} ${pkg.category || ''} ${pkg.description || ''} ${Array.isArray(pkg.inclusions) ? pkg.inclusions.join(' ') : (pkg.inclusions || '')}`).join(' ')
            ].join(' ').toLowerCase();

            const cleanSearchableText = searchableText.replace(/[\s\-_,.:;()]/g, '');

            return rawTerms.every(term => {
                const cleanTerm = term.replace(/[\s\-_,.:;()]/g, '');
                const singularTerm = term.endsWith('s') && term.length > 3 ? term.slice(0, -1) : term;
                const cleanSingular = cleanTerm.endsWith('s') && cleanTerm.length > 3 ? cleanTerm.slice(0, -1) : cleanTerm;

                return searchableText.includes(term) ||
                       searchableText.includes(singularTerm) ||
                       cleanSearchableText.includes(cleanTerm) ||
                       cleanSearchableText.includes(cleanSingular);
            });
        });
    }

    // Apply Location Filtering
    if (filters.location) {
        const loc = filters.location.toLowerCase();
        allProviders = allProviders.filter(p => p.coverageArea.toLowerCase().includes(loc));
    }

    return allProviders;
};

/**
 * Get Provider Details By ID
 * @param {Number} providerId 
 */
const getProviderById = async (providerId) => {
    const all = await getAllApprovedProviders();
    const pid = parseInt(providerId, 10);
    return all.find(p => p.id === pid || p.userId === pid) || null;
};

// ------------------------------------------------------------------------
// Services CRUD Model Functions (dbo.Services)
// ------------------------------------------------------------------------
const getServicesByProviderId = async (userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    try {
        const result = await pool.request()
            .input('UserID', parseInt(userId, 10))
            .query(`SELECT * FROM dbo.Services WHERE UserID = @UserID OR ProviderUserID = @UserID ORDER BY ServiceID DESC`);
        return result.recordset || [];
    } catch (e) {
        return [];
    }
};

const createService = async (serviceData) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const name = serviceData.serviceName || serviceData.name;
    const cat = serviceData.category || 'Sound Systems';
    const desc = serviceData.description || name;
    const price = parseFloat(serviceData.price || 0);

    try {
        const result = await pool.request()
            .input('UserID', parseInt(serviceData.userId, 10))
            .input('ServiceName', name)
            .input('Category', cat)
            .input('Description', desc)
            .input('Price', price)
            .query(`
                INSERT INTO dbo.Services (UserID, ServiceName, Category, Description, Price)
                OUTPUT INSERTED.*
                VALUES (@UserID, @ServiceName, @Category, @Description, @Price)
            `);
        return result.recordset[0];
    } catch (err) {
        // Fallback for ProviderUserID column
        const result = await pool.request()
            .input('ProviderUserID', parseInt(serviceData.userId, 10))
            .input('ServiceName', name)
            .input('Category', cat)
            .input('Description', desc)
            .input('Price', price)
            .query(`
                INSERT INTO dbo.Services (ProviderUserID, ServiceName, Category, Description, Price)
                OUTPUT INSERTED.*
                VALUES (@ProviderUserID, @ServiceName, @Category, @Description, @Price)
            `);
        return result.recordset[0];
    }
};

const updateService = async (serviceId, userId, serviceData) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const name = serviceData.serviceName || serviceData.name;
    const cat = serviceData.category || 'Sound Systems';
    const price = parseFloat(serviceData.price || 0);

    const result = await pool.request()
        .input('ServiceID', parseInt(serviceId, 10))
        .input('UserID', parseInt(userId, 10))
        .input('ServiceName', name)
        .input('Category', cat)
        .input('Price', price)
        .query(`
            UPDATE dbo.Services
            SET ServiceName = @ServiceName, Category = @Category, Price = @Price
            OUTPUT INSERTED.*
            WHERE ServiceID = @ServiceID AND (UserID = @UserID OR ProviderUserID = @UserID)
        `);
    return result.recordset[0];
};

const deleteService = async (serviceId, userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const result = await pool.request()
        .input('ServiceID', parseInt(serviceId, 10))
        .input('UserID', parseInt(userId, 10))
        .query(`DELETE FROM dbo.Services WHERE ServiceID = @ServiceID AND (UserID = @UserID OR ProviderUserID = @UserID)`);
    return result.rowsAffected[0] > 0;
};

// ------------------------------------------------------------------------
// Service Packages CRUD Model Functions (dbo.Packages)
// ------------------------------------------------------------------------
const getPackagesByProviderId = async (userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    try {
        const result = await pool.request()
            .input('UserID', parseInt(userId, 10))
            .query(`
                SELECT 
                    p.*,
                    pi.ImageID,
                    pi.ImageUrl
                FROM dbo.Packages p
                LEFT JOIN dbo.PackageImages pi ON p.PackageID = pi.PackageID
                WHERE p.UserID = @UserID
                ORDER BY p.PackageID DESC, pi.ImageID ASC
            `);

        const pkgsMap = {};
        (result.recordset || []).forEach(row => {
            const pid = row.PackageID;
            if (!pkgsMap[pid]) {
                pkgsMap[pid] = {
                    PackageID: row.PackageID,
                    UserID: row.UserID,
                    PackageName: row.PackageName,
                    Category: row.Category,
                    Price: row.Price,
                    Description: row.Description,
                    Inclusions: row.Inclusions,
                    AdditionalDayPercentage: row.AdditionalDayPercentage != null ? parseFloat(row.AdditionalDayPercentage) : 20.0,
                    IsActive: row.IsActive,
                    CreatedAt: row.CreatedAt,
                    images: []
                };
            }
            if (row.ImageID && row.ImageUrl) {
                pkgsMap[pid].images.push({
                    id: row.ImageID,
                    url: row.ImageUrl
                });
            }
        });

        return Object.values(pkgsMap);
    } catch (e) {
        console.warn('Error getPackagesByProviderId:', e.message);
        return [];
    }
};

const getPackageById = async (packageId, userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    try {
        const result = await pool.request()
            .input('PackageID', parseInt(packageId, 10))
            .input('UserID', parseInt(userId, 10))
            .query(`
                SELECT 
                    p.*,
                    pi.ImageID,
                    pi.ImageUrl
                FROM dbo.Packages p
                LEFT JOIN dbo.PackageImages pi ON p.PackageID = pi.PackageID
                WHERE p.PackageID = @PackageID AND p.UserID = @UserID
                ORDER BY pi.ImageID ASC
            `);

        if (!result.recordset || result.recordset.length === 0) return null;

        const first = result.recordset[0];
        const pkgObj = {
            PackageID: first.PackageID,
            UserID: first.UserID,
            PackageName: first.PackageName,
            Category: first.Category,
            Price: first.Price,
            Description: first.Description,
            Inclusions: first.Inclusions,
            AdditionalDayPercentage: first.AdditionalDayPercentage != null ? parseFloat(first.AdditionalDayPercentage) : 20.0,
            IsActive: first.IsActive,
            CreatedAt: first.CreatedAt,
            images: []
        };

        result.recordset.forEach(row => {
            if (row.ImageID && row.ImageUrl) {
                pkgObj.images.push({
                    id: row.ImageID,
                    url: row.ImageUrl
                });
            }
        });

        return pkgObj;
    } catch (e) {
        return null;
    }
};

const addPackageImages = async (packageId, imageUrls = []) => {
    if (!imageUrls || imageUrls.length === 0) return;
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }

    for (const url of imageUrls) {
        await pool.request()
            .input('PackageID', parseInt(packageId, 10))
            .input('ImageUrl', url)
            .query(`INSERT INTO dbo.PackageImages (PackageID, ImageUrl) VALUES (@PackageID, @ImageUrl);`);
    }
};

const deletePackagePhotoById = async (imageId, userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const result = await pool.request()
        .input('ImageID', parseInt(imageId, 10))
        .input('UserID', parseInt(userId, 10))
        .query(`
            DELETE pi 
            FROM dbo.PackageImages pi
            JOIN dbo.Packages p ON pi.PackageID = p.PackageID
            WHERE pi.ImageID = @ImageID AND p.UserID = @UserID;
        `);
    return result.rowsAffected[0] > 0;
};

const createPackage = async (packageData) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const name = packageData.packageName || packageData.name || packageData.PackageName || 'Unnamed Package Offer';
    const cat = packageData.category || packageData.Category || 'Concert Audio & Stage Lights';
    const desc = packageData.description || packageData.Description || name;
    const price = parseFloat(packageData.price || packageData.Price || 0);
    const inc = packageData.inclusions || packageData.Inclusions || desc;
    const addDayPct = parseFloat(packageData.additionalDayPercentage || packageData.AdditionalDayPercentage || 20.0);

    const result = await pool.request()
        .input('UserID', parseInt(packageData.userId, 10))
        .input('PackageName', name)
        .input('Category', cat)
        .input('Description', desc)
        .input('Price', price)
        .input('Inclusions', inc)
        .input('AdditionalDayPercentage', addDayPct)
        .query(`
            INSERT INTO dbo.Packages (UserID, PackageName, Category, Description, Price, Inclusions, AdditionalDayPercentage, IsActive)
            OUTPUT INSERTED.*
            VALUES (@UserID, @PackageName, @Category, @Description, @Price, @Inclusions, @AdditionalDayPercentage, 1)
        `);
    return result.recordset[0];
};

const updatePackage = async (packageId, userId, packageData) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const name = packageData.packageName || packageData.name || packageData.PackageName || 'Unnamed Package Offer';
    const cat = packageData.category || packageData.Category || 'Concert Audio & Stage Lights';
    const desc = packageData.description || packageData.Description || name;
    const price = parseFloat(packageData.price || packageData.Price || 0);
    const inc = packageData.inclusions || packageData.Inclusions || desc;
    const addDayPct = parseFloat(packageData.additionalDayPercentage || packageData.AdditionalDayPercentage || 20.0);

    const result = await pool.request()
        .input('PackageID', parseInt(packageId, 10))
        .input('UserID', parseInt(userId, 10))
        .input('PackageName', name)
        .input('Category', cat)
        .input('Description', desc)
        .input('Price', price)
        .input('Inclusions', inc)
        .input('AdditionalDayPercentage', addDayPct)
        .input('IsActive', packageData.isActive === false || packageData.isActive === 0 ? 0 : 1)
        .query(`
            UPDATE dbo.Packages
            SET PackageName = @PackageName,
                Category = @Category,
                Description = @Description,
                Price = @Price,
                Inclusions = @Inclusions,
                AdditionalDayPercentage = @AdditionalDayPercentage,
                IsActive = @IsActive
            OUTPUT INSERTED.*
            WHERE PackageID = @PackageID AND UserID = @UserID
        `);
    return result.recordset[0];
};

const deletePackage = async (packageId, userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const result = await pool.request()
        .input('PackageID', parseInt(packageId, 10))
        .input('UserID', parseInt(userId, 10))
        .query(`DELETE FROM dbo.Packages WHERE PackageID = @PackageID AND UserID = @UserID`);
    return result.rowsAffected[0] > 0;
};

// ------------------------------------------------------------------------
// Withdrawals Model Functions (dbo.Withdrawals)
// ------------------------------------------------------------------------
const getWithdrawalsByProviderId = async (userId) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const result = await pool.request()
        .input('UserID', parseInt(userId, 10))
        .query(`SELECT * FROM dbo.Withdrawals WHERE ProviderUserID = @UserID ORDER BY RequestedAt DESC`);
    return result.recordset || [];
};

const createWithdrawalRequest = async (withdrawalData) => {
    let pool = null;
    try { pool = getPool(); } catch (e) { pool = await connectDB(); }
    const result = await pool.request()
        .input('ProviderUserID', parseInt(withdrawalData.userId, 10))
        .input('Amount', parseFloat(withdrawalData.amount || 0))
        .input('Method', withdrawalData.method || 'GCash')
        .input('AccountName', withdrawalData.accountName)
        .input('AccountNumber', withdrawalData.accountNumber)
        .query(`
            INSERT INTO dbo.Withdrawals (ProviderUserID, Amount, Method, AccountName, AccountNumber, Status, RequestedAt)
            OUTPUT INSERTED.*
            VALUES (@ProviderUserID, @Amount, @Method, @AccountName, @AccountNumber, 'Pending', GETDATE())
        `);
    return result.recordset[0];
};

module.exports = {
    getAllApprovedProviders,
    getProviderById,
    getServicesByProviderId,
    createService,
    updateService,
    deleteService,
    getPackagesByProviderId,
    getPackageById,
    createPackage,
    updatePackage,
    deletePackage,
    addPackageImages,
    deletePackagePhotoById,
    getWithdrawalsByProviderId,
    createWithdrawalRequest
};
