const path = require('path');
const fs = require('fs');
const multer = require('multer');
const providerModel = require('../models/providerModel');
const { getPool, connectDB, sql } = require('../config/db');

// Ensure Upload Directories Exist for Service Provider Photos
const uploadDirPublic = path.join(__dirname, '../../public/uploads/avatars');
const uploadDirClient = path.join(__dirname, '../../client/uploads/avatars');
[uploadDirPublic, uploadDirClient].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDirPublic),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const uniqueName = `provider-avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid image file type. Only JPG, PNG, and WebP are allowed.'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter
});

// Ensure Upload Directories Exist for Package Photos
const uploadPackageDirPublic = path.join(__dirname, '../../public/uploads/packages');
const uploadPackageDirClient = path.join(__dirname, '../../client/uploads/packages');
[uploadPackageDirPublic, uploadPackageDirClient].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const packageStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadPackageDirPublic),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        const uniqueName = `package-photo-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        cb(null, uniqueName);
    }
});

const uploadPackagePhotos = multer({
    storage: packageStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image limit
    fileFilter
});

/**
 * GET /api/providers
 * Returns all active, approved service providers matching optional filters
 */
const getProviders = async (req, res) => {
    try {
        const { category, location, date, search } = req.query;

        const providers = await providerModel.getAllApprovedProviders({
            category,
            location,
            date,
            search
        });

        return res.status(200).json({
            success: true,
            count: providers.length,
            data: providers
        });
    } catch (error) {
        console.error('API Error in getProviders:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving service providers.',
            error: error.message
        });
    }
};

/**
 * GET /api/providers/:id
 * Returns single provider profile details by ID
 */
const getProviderById = async (req, res) => {
    try {
        const { id } = req.params;
        const provider = await providerModel.getProviderById(id);

        if (!provider) {
            return res.status(404).json({
                success: false,
                message: 'Service provider not found.'
            });
        }

        return res.status(200).json({
            success: true,
            data: provider
        });
    } catch (error) {
        console.error('API Error in getProviderById:', error);
        return res.status(500).json({
            success: false,
            message: 'An internal server error occurred while retrieving service provider details.',
            error: error.message
        });
    }
};

// ------------------------------------------------------------------------
// Services CRUD Controllers
// ------------------------------------------------------------------------
const getProviderServices = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        const services = await providerModel.getServicesByProviderId(userId);
        return res.status(200).json({ success: true, data: services });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const createProviderService = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.body.userId || 13);
        const service = await providerModel.createService({ ...req.body, userId });
        return res.status(201).json({ success: true, data: service, message: 'Service created successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const updateProviderService = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.body.userId || 13);
        const service = await providerModel.updateService(id, userId, req.body);
        return res.status(200).json({ success: true, data: service, message: 'Service updated successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProviderService = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        await providerModel.deleteService(id, userId);
        return res.status(200).json({ success: true, message: 'Service deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

// ------------------------------------------------------------------------
// Service Packages CRUD Controllers
// ------------------------------------------------------------------------
const getProviderPackages = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        const packages = await providerModel.getPackagesByProviderId(userId);
        return res.status(200).json({ success: true, data: packages });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const createProviderPackage = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.body.userId || 13);
        const packageData = await providerModel.createPackage({ ...req.body, userId });

        // Save Uploaded Setup / Inclusion Photos
        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => {
                const urlPath = `uploads/packages/${file.filename}`;
                try {
                    const clientDest = path.join(uploadPackageDirClient, file.filename);
                    fs.copyFileSync(file.path, clientDest);
                } catch (e) {
                    console.warn('Copy package photo notice:', e.message);
                }
                return urlPath;
            });
            await providerModel.addPackageImages(packageData.PackageID, imageUrls);
        }

        const freshPackage = await providerModel.getPackageById(packageData.PackageID, userId);
        return res.status(201).json({ success: true, data: freshPackage || packageData, message: 'Package offer created successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const updateProviderPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.body.userId || 13);
        const packageData = await providerModel.updatePackage(id, userId, req.body);

        // Save Uploaded Setup / Inclusion Photos
        if (req.files && req.files.length > 0) {
            const imageUrls = req.files.map(file => {
                const urlPath = `uploads/packages/${file.filename}`;
                try {
                    const clientDest = path.join(uploadPackageDirClient, file.filename);
                    fs.copyFileSync(file.path, clientDest);
                } catch (e) {
                    console.warn('Copy package photo notice:', e.message);
                }
                return urlPath;
            });
            await providerModel.addPackageImages(id, imageUrls);
        }

        const freshPackage = await providerModel.getPackageById(id, userId);
        return res.status(200).json({ success: true, data: freshPackage || packageData, message: 'Package offer updated successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProviderPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        await providerModel.deletePackage(id, userId);
        return res.status(200).json({ success: true, message: 'Package deleted successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const deletePackagePhoto = async (req, res) => {
    try {
        const { imageId } = req.params;
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        await providerModel.deletePackagePhotoById(imageId, userId);
        return res.status(200).json({ success: true, message: 'Package photo removed successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};



// ------------------------------------------------------------------------
// Authenticated Service Provider Portal Controller Functions
// ------------------------------------------------------------------------

/**
 * GET /api/providers/me
 * Retrieves current authenticated provider profile details
 */
const getProviderProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : req.query.userId;
        if (!userId) {
            return res.status(401).json({ success: false, isApprovedProvider: false, message: 'Authentication required.' });
        }

        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        const result = await pool.request()
            .input('UserID', userId)
            .query(`
                SELECT 
                    u.UserID,
                    u.Email,
                    u.Phone,
                    u.RoleID,
                    u.ProfilePicture AS UserProfilePicture,
                    sp.ProfilePicture AS ProviderProfilePicture,
                    u.AccountStatus,
                    u.CreatedAt AS UserCreatedAt,
                    r.RoleName,
                    sp.ProviderID,
                    sp.BusinessName,
                    sp.OwnerName,
                    sp.BusinessAddress,
                    sp.CoverageArea,
                    u.Phone AS ContactNumber,
                    sp.VerificationStatus,
                    pa.Status AS ApplicationStatus,
                    sp.CreatedAt AS ProviderApprovedAt
                FROM dbo.Users u
                LEFT JOIN dbo.Roles r ON u.RoleID = r.RoleID
                LEFT JOIN dbo.ServiceProviders sp ON u.UserID = sp.UserID
                LEFT JOIN dbo.ProviderApplications pa ON u.UserID = pa.UserID
                WHERE u.UserID = @UserID;
            `);

        if (!result.recordset || result.recordset.length === 0) {
            return res.status(404).json({ success: false, isApprovedProvider: false, message: 'User account record not found.' });
        }

        const p = result.recordset[0];
        
        // Authorization Guard Check: Must have ServiceProvider role (RoleID 3) and an approved provider record
        const isServiceProviderRole = (p.RoleID == 3 || p.RoleName === 'ServiceProvider');
        const isApprovedProvider = Boolean(isServiceProviderRole && (p.VerificationStatus === 'Approved' || p.ApplicationStatus === 'Approved'));

        if (!isApprovedProvider) {
            return res.status(403).json({
                success: false,
                isApprovedProvider: false,
                role: p.RoleName,
                applicationStatus: p.ApplicationStatus || 'None',
                message: 'Access denied. You must apply as a service provider and be approved by the admin to access the provider portal.'
            });
        }

        return res.status(200).json({
            success: true,
            isApprovedProvider: true,
            profile: {
                userId: p.UserID,
                providerId: p.ProviderID,
                email: p.Email,
                phone: p.Phone || p.ContactNumber,
                role: p.RoleName || 'ServiceProvider',
                accountStatus: p.AccountStatus || 'Active',
                businessName: p.BusinessName || 'Service Provider Business',
                ownerName: p.OwnerName || 'Service Provider Owner',
                businessAddress: p.BusinessAddress || 'Batangas',
                coverageArea: p.CoverageArea || 'Batangas',
                contactNumber: p.ContactNumber || p.Phone,
                verificationStatus: p.VerificationStatus || 'Approved',
                profilePicture: p.ProviderProfilePicture || null,
                avatar: p.ProviderProfilePicture || null,
                clientProfilePicture: p.UserProfilePicture || null,
                approvedAt: p.ProviderApprovedAt
            }
        });
    } catch (err) {
        console.error('Error fetching provider profile:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/providers/me
 * Updates business profile details & provider logo photo in SQL Server
 */
const updateProviderProfile = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : req.body.userId;
        const { businessName, ownerName, firstName, lastName, businessAddress, coverageArea, contactNumber, phone } = req.body;

        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        let providerProfilePicture = undefined;
        if (req.file) {
            providerProfilePicture = `uploads/avatars/${req.file.filename}`;
            try {
                const clientDest = path.join(uploadDirClient, req.file.filename);
                fs.copyFileSync(req.file.path, clientDest);
            } catch (e) {
                console.warn('Copy provider avatar notice:', e.message);
            }
        }

        // Update Users table phone if provided (Does NOT update Users.ProfilePicture!)
        if (phone || contactNumber) {
            await pool.request()
                .input('UserID', userId)
                .input('Phone', phone || contactNumber)
                .query(`UPDATE dbo.Users SET Phone = @Phone WHERE UserID = @UserID;`);
        }

        // Update Clients table if names provided
        if (firstName || lastName) {
            const cleanFullName = `${firstName || ''} ${lastName || ''}`.trim();
            await pool.request()
                .input('UserID', userId)
                .input('FirstName', firstName || '')
                .input('LastName', lastName || '')
                .input('FullName', cleanFullName || null)
                .query(`
                    UPDATE dbo.Clients 
                    SET FirstName = COALESCE(NULLIF(@FirstName, ''), FirstName),
                        LastName = COALESCE(NULLIF(@LastName, ''), LastName),
                        FullName = COALESCE(NULLIF(@FullName, ''), FullName)
                    WHERE UserID = @UserID;
                `);
        }

        // Update ServiceProviders table ProfilePicture & Details (DOES NOT TOUCH Users.ProfilePicture!)
        const spCheck = await pool.request()
            .input('UserID', userId)
            .query(`SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UserID;`);

        if (spCheck.recordset && spCheck.recordset.length > 0) {
            const computedOwnerName = ownerName || `${firstName || ''} ${lastName || ''}`.trim();
            let updateSql = `
                UPDATE dbo.ServiceProviders 
                SET BusinessName = COALESCE(NULLIF(@BusinessName, ''), BusinessName),
                    BusinessAddress = COALESCE(NULLIF(@BusinessAddress, ''), BusinessAddress),
                    CoverageArea = COALESCE(NULLIF(@CoverageArea, ''), CoverageArea),
                    OwnerName = COALESCE(NULLIF(@OwnerName, ''), OwnerName),
                    ContactNumber = COALESCE(NULLIF(@ContactNumber, ''), ContactNumber)
            `;
            if (providerProfilePicture !== undefined) {
                updateSql += `, ProfilePicture = @ProfilePicture`;
            }
            updateSql += ` WHERE UserID = @UserID;`;

            const reqSp = pool.request()
                .input('UserID', userId)
                .input('BusinessName', businessName || '')
                .input('OwnerName', computedOwnerName || '')
                .input('BusinessAddress', businessAddress || '')
                .input('CoverageArea', coverageArea || '')
                .input('ContactNumber', contactNumber || phone || '');

            if (providerProfilePicture !== undefined) {
                reqSp.input('ProfilePicture', providerProfilePicture);
            }

            await reqSp.query(updateSql);
        }

        // Update ProviderApplications table if exists
        const paCheck = await pool.request()
            .input('UserID', userId)
            .query(`SELECT ApplicationID FROM dbo.ProviderApplications WHERE UserID = @UserID;`);

        if (paCheck.recordset && paCheck.recordset.length > 0) {
            await pool.request()
                .input('UserID', userId)
                .input('BusinessName', businessName)
                .input('OwnerName', ownerName)
                .input('BusinessAddress', businessAddress)
                .input('CoverageArea', coverageArea)
                .input('ContactNumber', contactNumber || phone)
                .query(`
                    UPDATE dbo.ProviderApplications 
                    SET BusinessName = COALESCE(@BusinessName, BusinessName),
                        OwnerName = COALESCE(@OwnerName, OwnerName),
                        BusinessAddress = COALESCE(@BusinessAddress, BusinessAddress),
                        CoverageArea = COALESCE(@CoverageArea, CoverageArea),
                        ContactNumber = COALESCE(@ContactNumber, ContactNumber)
                    WHERE UserID = @UserID;
                `);
        }

        return res.status(200).json({ success: true, message: 'Business profile updated successfully in SQL Server.' });
    } catch (err) {
        console.error('Error updating provider profile:', err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/providers/dashboard-stats
 * Real stats for provider dashboard
 */
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        // Total Services
        let totalServices = 0;
        try {
            const svcRes = await pool.request().input('UID', userId).query(`SELECT COUNT(*) AS cnt FROM dbo.Services WHERE UserID = @UID OR ProviderUserID = @UID;`);
            totalServices = svcRes.recordset[0].cnt || 0;
        } catch (e) {
            totalServices = 0;
        }

        // Total Bookings & Earnings
        let allBookings = [];
        try {
            const bkRes = await pool.request().input('UID', userId).query(`
                SELECT 
                    b.BookingID,
                    b.BookingReference,
                    b.ClientUserID,
                    b.ProviderID,
                    ISNULL(NULLIF(b.PackageName, ''), ISNULL(b.EventName, 'Event Service Package')) AS PackageName,
                    b.EventName,
                    b.EventType,
                    b.EventDate,
                    b.ServiceStartDate,
                    b.ServiceEndDate,
                    b.ServiceHireDays,
                    ISNULL(b.Location, 'Batangas') AS Location,
                    b.TotalAmount,
                    b.BookingStatus,
                    b.PaymentStatus,
                    b.CreatedAt,
                    ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), ISNULL(u.Email, 'Client Account')) AS ClientName,
                    u.Phone AS ClientPhone,
                    u.Email AS ClientEmail,
                    u.ProfilePicture AS ClientAvatar,
                    (
                        SELECT TOP 1 w.Status 
                        FROM dbo.Withdrawals w 
                        WHERE w.BookingID = b.BookingID
                        ORDER BY w.RequestedAt DESC
                    ) AS WithdrawalStatus
                FROM dbo.Bookings b
                LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
                LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE b.ProviderID = @UID OR sp.UserID = @UID
                ORDER BY b.CreatedAt DESC;
            `);
            allBookings = bkRes.recordset || [];
        } catch (e) {
            allBookings = [];
        }

        const upcomingBookings = allBookings.filter(b => b.BookingStatus === 'Confirmed' || b.BookingStatus === 'Pending');
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysEvents = upcomingBookings.filter(b => String(b.EventDate).startsWith(todayStr));

        // Monthly Earnings
        const monthlyEarnings = allBookings
            .filter(b => b.BookingStatus === 'Completed' || b.BookingStatus === 'Confirmed')
            .reduce((sum, b) => sum + parseFloat(b.TotalAmount || 0), 0);

        // Client Reviews
        let reviewsList = [];
        try {
            const revRes = await pool.request().input('UID', userId).query(`
                SELECT r.ReviewID, r.Rating, r.ReviewText AS Comment, r.SubmittedAt AS CreatedAt,
                ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), ISNULL(u.Email, 'Client')) AS ClientName
                FROM dbo.Reviews r
                LEFT JOIN dbo.Users u ON r.UserID = u.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE r.ProviderID = @UID 
                   OR r.ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID)
                   OR r.BookingID IN (SELECT BookingID FROM dbo.Bookings WHERE ProviderID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID))
                ORDER BY r.SubmittedAt DESC;
            `);
            reviewsList = revRes.recordset || [];
        } catch (e) {
            reviewsList = [];
        }

        return res.status(200).json({
            success: true,
            stats: {
                totalServices,
                upcomingBookingsCount: upcomingBookings.length,
                todaysEventsCount: todaysEvents.length,
                monthlyEarnings,
                upcomingBookings,
                allBookings,
                reviewsList
            }
        });
    } catch (err) {
        console.error('Error fetching provider dashboard stats:', err);
        return res.status(200).json({
            success: true,
            stats: {
                totalServices: 0,
                upcomingBookingsCount: 0,
                todaysEventsCount: 0,
                monthlyEarnings: 0,
                upcomingBookings: [],
                allBookings: [],
                reviewsList: []
            }
        });
    }
};

/**
 * GET /api/providers/my-bookings
 * Bookings for logged-in provider
 */
const getProviderBookings = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        try {
            const result = await pool.request().input('UID', userId).query(`
                SELECT 
                    b.BookingID,
                    b.BookingReference,
                    b.ClientUserID,
                    b.ProviderID,
                    ISNULL(NULLIF(b.PackageName, ''), ISNULL(b.EventName, 'Event Service Package')) AS PackageName,
                    b.EventName,
                    b.EventType,
                    b.EventDate,
                    b.ServiceStartDate,
                    b.ServiceEndDate,
                    b.ServiceHireDays,
                    ISNULL(b.Location, 'Batangas') AS Location,
                    b.TotalAmount,
                    b.BookingStatus,
                    b.PaymentStatus,
                    b.CreatedAt,
                    ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), ISNULL(u.Email, 'Client Account')) AS ClientName,
                    u.Phone AS ClientPhone,
                    u.Email AS ClientEmail,
                    u.ProfilePicture AS ClientAvatar,
                    (
                        SELECT TOP 1 w.Status 
                        FROM dbo.Withdrawals w 
                        WHERE w.BookingID = b.BookingID
                        ORDER BY w.RequestedAt DESC
                    ) AS WithdrawalStatus
                FROM dbo.Bookings b
                LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
                LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE b.ProviderID = @UID OR sp.UserID = @UID
                ORDER BY b.CreatedAt DESC;
            `);
            return res.status(200).json({ success: true, data: result.recordset || [] });
        } catch (e) {
            return res.status(200).json({ success: true, data: [] });
        }
    } catch (err) {
        return res.status(200).json({ success: true, data: [] });
    }
};

/**
 * PUT /api/providers/my-bookings/:id/accept
 */
const acceptBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        await pool.request()
            .input('BID', id)
            .input('UID', userId)
            .query(`
                UPDATE dbo.Bookings 
                SET BookingStatus = 'Confirmed', UpdatedAt = GETDATE() 
                WHERE BookingID = @BID AND (ProviderID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID));
            `);

        return res.status(200).json({ success: true, message: `Booking #${id} accepted successfully.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/providers/my-bookings/:id/complete
 */
const completeBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        await pool.request()
            .input('BID', id)
            .input('UID', userId)
            .query(`
                UPDATE dbo.Bookings 
                SET BookingStatus = 'Completed', UpdatedAt = GETDATE() 
                WHERE BookingID = @BID AND (ProviderID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID));
            `);

        return res.status(200).json({ success: true, message: `Booking #${id} marked as completed.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/providers/my-bookings/:id/cancel
 */
const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        await pool.request()
            .input('BID', id)
            .input('UID', userId)
            .query(`
                UPDATE dbo.Bookings 
                SET BookingStatus = 'Cancelled', UpdatedAt = GETDATE() 
                WHERE BookingID = @BID AND (ProviderID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID));
            `);

        return res.status(200).json({ success: true, message: `Booking #${id} cancelled successfully.` });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/providers/reviews/my-reviews
 */
const getProviderReviewsList = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        const result = await pool.request().input('UID', userId).query(`
            SELECT 
                r.ReviewID,
                r.Rating,
                r.ReviewText AS Comment,
                r.SubmittedAt AS CreatedAt,
                COALESCE(c.FirstName + ' ' + c.LastName, u.Email, 'Verified Client') AS ClientName
            FROM dbo.Reviews r
            LEFT JOIN dbo.Users u ON r.UserID = u.UserID
            LEFT JOIN dbo.Clients c ON r.UserID = c.UserID
            WHERE r.ProviderID = @UID 
               OR r.ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID)
               OR r.BookingID IN (SELECT BookingID FROM dbo.Bookings WHERE ProviderID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID))
            ORDER BY r.SubmittedAt DESC;
        `);

        const reviews = result.recordset || [];
        const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.Rating, 0) / reviews.length).toFixed(1) : 0;

        return res.status(200).json({ success: true, count: reviews.length, averageRating: avgRating, reviews });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/providers/withdrawals/list
 * Retrieve total earnings, available balance, total withdrawn, and withdrawal history
 */
const getProviderWithdrawals = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.query.userId || 13);
        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        // 1. Fetch provider ID
        let providerId = userId;
        const provRes = await pool.request().input('UID', userId).query(`SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID;`);
        if (provRes.recordset && provRes.recordset[0]) {
            providerId = provRes.recordset[0].ProviderID;
        }

        // 2. Total Gross & Collected Earnings from confirmed / completed bookings
        const bkRes = await pool.request()
            .input('UID', userId)
            .input('PID', providerId)
            .query(`
                SELECT 
                    b.BookingID,
                    b.TotalAmount,
                    b.AmountPaid,
                    b.CommissionRate,
                    b.CommissionAmount,
                    b.ProviderEarnings,
                    b.PaymentStatus,
                    b.BookingStatus
                FROM dbo.Bookings b
                WHERE (b.ProviderID = @PID OR b.ProviderID = @UID)
                  AND b.BookingStatus IN ('Confirmed', 'Completed');
            `);

        const bookingsList = bkRes.recordset || [];
        
        let totalContractEarnings = 0;
        let totalCollectedEarnings = 0;

        bookingsList.forEach(b => {
            const tot = parseFloat(b.TotalAmount || 0);
            const paid = parseFloat(b.AmountPaid || 0);
            const commRate = parseFloat(b.CommissionRate || 5) / 100;

            const contractNet = tot * (1 - commRate);
            const isFullPaid = (b.PaymentStatus === 'Paid' || b.BookingStatus === 'Completed');
            const collectedNet = (isFullPaid ? tot : paid) * (1 - commRate);

            totalContractEarnings += contractNet;
            totalCollectedEarnings += collectedNet;
        });

        // 3. Withdrawal History & Total Withdrawn from dbo.Withdrawals
        const wRes = await pool.request()
            .input('PID', providerId)
            .input('UID', userId)
            .query(`
                SELECT 
                    w.WithdrawalID,
                    w.ProviderID,
                    w.Amount,
                    w.PayoutMethod,
                    w.AccountName,
                    w.AccountReference,
                    w.Status,
                    w.RequestedAt,
                    w.ProcessedAt,
                    w.AdminNotes
                FROM dbo.Withdrawals w
                WHERE w.ProviderID = @PID OR w.ProviderID = @UID
                ORDER BY w.RequestedAt DESC;
            `);

        const withdrawals = wRes.recordset || [];

        // Sum of all approved & pending withdrawal amounts
        const totalWithdrawn = withdrawals
            .filter(w => w.Status === 'Approved' || w.Status === 'Completed')
            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);

        const pendingWithdrawals = withdrawals
            .filter(w => w.Status === 'Pending')
            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);

        const availableBalance = Math.max(0, totalCollectedEarnings - totalWithdrawn - pendingWithdrawals);

        return res.status(200).json({
            success: true,
            availableBalance: parseFloat(availableBalance.toFixed(2)),
            totalEarnings: parseFloat(totalContractEarnings.toFixed(2)),
            collectedEarnings: parseFloat(totalCollectedEarnings.toFixed(2)),
            totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
            pendingWithdrawals: parseFloat(pendingWithdrawals.toFixed(2)),
            withdrawals
        });
    } catch (err) {
        console.error('Error fetching provider withdrawals:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve withdrawal records.',
            error: err.message
        });
    }
};

/**
 * POST /api/providers/withdrawals/create
 * Submit new payout withdrawal request
 */
const createWithdrawalRequest = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        const { amount, bookingId, payoutMethod, accountName, accountReference } = req.body;

        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid withdrawal amount.' });
        }

        if (!accountReference || !accountReference.trim()) {
            return res.status(400).json({ success: false, message: 'Account reference/number is required.' });
        }

        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        // Fetch provider ID
        let providerId = userId;
        const provRes = await pool.request().input('UID', userId).query(`SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID;`);
        if (provRes.recordset && provRes.recordset[0]) {
            providerId = provRes.recordset[0].ProviderID;
        }

        // If this payout is requested directly for a specific booking (#BK-X)
        if (bookingId) {
            const bCheck = await pool.request()
                .input('BID', parseInt(bookingId, 10))
                .input('PID', providerId)
                .input('UID', userId)
                .query(`
                    SELECT BookingID, TotalAmount, AmountPaid, PaymentStatus, BookingStatus
                    FROM dbo.Bookings
                    WHERE BookingID = @BID AND (ProviderID = @PID OR ProviderID = @UID);
                `);
            const targetBk = bCheck.recordset && bCheck.recordset[0];
            if (!targetBk) {
                return res.status(400).json({ success: false, message: 'Specified booking was not found.' });
            }
            const bkTotal = parseFloat(targetBk.TotalAmount || 0);
            const bkPaid = parseFloat(targetBk.AmountPaid || 0);
            const isFull = (targetBk.PaymentStatus === 'Paid' || targetBk.BookingStatus === 'Completed');
            const bkAllowedNet = (isFull ? bkTotal : bkPaid) * 0.95;

            if (numericAmount > (bkAllowedNet + 0.50)) {
                return res.status(400).json({
                    success: false,
                    message: `Requested payout ₱${numericAmount.toFixed(2)} exceeds booking net earnings of ₱${bkAllowedNet.toFixed(2)}.`
                });
            }
        } else {
            // General wallet balance check
            const bkRes = await pool.request()
                .input('UID', userId)
                .input('PID', providerId)
                .query(`
                    SELECT b.TotalAmount, b.AmountPaid, b.CommissionRate, b.PaymentStatus, b.BookingStatus
                    FROM dbo.Bookings b
                    WHERE (b.ProviderID = @PID OR b.ProviderID = @UID)
                      AND b.BookingStatus IN ('Confirmed', 'Completed');
                `);

            let totalCollected = 0;
            (bkRes.recordset || []).forEach(b => {
                const tot = parseFloat(b.TotalAmount || 0);
                const paid = parseFloat(b.AmountPaid || 0);
                const commRate = parseFloat(b.CommissionRate || 5) / 100;
                const isFullPaid = (b.PaymentStatus === 'Paid' || b.BookingStatus === 'Completed');
                totalCollected += (isFullPaid ? tot : paid) * (1 - commRate);
            });

            const wRes = await pool.request()
                .input('PID', providerId)
                .input('UID', userId)
                .query(`
                    SELECT ISNULL(SUM(w.Amount), 0) AS TotalPendingOrApproved
                    FROM dbo.Withdrawals w
                    WHERE (w.ProviderID = @PID OR w.ProviderID = @UID)
                      AND w.Status IN ('Pending', 'Approved', 'Completed');
                `);

            const totalPendingOrApproved = parseFloat(wRes.recordset[0]?.TotalPendingOrApproved || 0);
            const currentAvailable = Math.max(0, totalCollected - totalPendingOrApproved);

            if (numericAmount > currentAvailable) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient balance. Available balance is ₱${currentAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
                });
            }
        }

        // Insert new withdrawal request into dbo.Withdrawals
        const methodStr = payoutMethod || 'GCash / Maya E-Wallet';
        const nameStr = accountName ? accountName.trim() : 'Provider Payout Account';
        const refStr = accountReference.trim();

        const insertRes = await pool.request()
            .input('PID', providerId)
            .input('BID', bookingId ? parseInt(bookingId, 10) : null)
            .input('Amount', sql.Decimal(18, 2), numericAmount)
            .input('PayoutMethod', sql.NVarChar(50), methodStr)
            .input('AccountName', sql.NVarChar(150), nameStr)
            .input('AccountReference', sql.NVarChar(100), refStr)
            .query(`
                INSERT INTO dbo.Withdrawals
                (ProviderID, BookingID, Amount, PayoutMethod, AccountName, AccountReference, Status, RequestedAt)
                OUTPUT INSERTED.*
                VALUES
                (@PID, @BID, @Amount, @PayoutMethod, @AccountName, @AccountReference, 'Pending', GETDATE());
            `);

        const newWithdrawal = insertRes.recordset[0];

        return res.status(201).json({
            success: true,
            message: `🎉 Payout request of ₱${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} submitted successfully! Awaiting Administrator payout approval.`,
            withdrawal: newWithdrawal
        });
    } catch (err) {
        console.error('Create Withdrawal Request Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to process withdrawal request.',
            error: err.message
        });
    }
};

module.exports = {
    getProviders,
    getProviderById,
    getProviderServices,
    createProviderService,
    updateProviderService,
    deleteProviderService,
    getProviderPackages,
    createProviderPackage,
    updateProviderPackage,
    deleteProviderPackage,
    getProviderWithdrawals,
    createWithdrawalRequest,
    getProviderProfile,
    updateProviderProfile,
    getDashboardStats,
    getProviderBookings,
    acceptBooking,
    completeBooking,
    cancelBooking,
    getProviderReviewsList,
    upload,
    uploadPackagePhotos,
    deletePackagePhoto
};

