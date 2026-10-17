const path = require('path');
const fs = require('fs');
const multer = require('multer');
const providerModel = require('../models/providerModel');
const notificationModel = require('../models/notificationModel');
const { checkAndAutoAcceptCompletions } = require('../services/autoCompletionService');
const { getPool, connectDB, sql } = require('../config/db');

// Ensure Upload Directories Exist for Service Provider Photos (Safe for serverless / Vercel)
const uploadDirPublic = path.join(__dirname, '../../public/uploads/avatars');
const uploadDirClient = path.join(__dirname, '../../client/uploads/avatars');
try {
    [uploadDirPublic, uploadDirClient].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
} catch (e) {
    // Read-only filesystem notice on serverless
}

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.'));
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter
});

// Ensure Upload Directories Exist for Package Photos
const uploadPackageDirPublic = path.join(__dirname, '../../public/uploads/packages');
const uploadPackageDirClient = path.join(__dirname, '../../client/uploads/packages');
try {
    [uploadPackageDirPublic, uploadPackageDirClient].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
} catch (e) {
    // Read-only filesystem notice on serverless
}

const packageStorage = multer.memoryStorage();

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
        const includeArchived = req.query.archived === 'true' || req.query.isArchived === 'true';
        const packages = includeArchived 
            ? await providerModel.getArchivedPackagesByProviderId(userId)
            : await providerModel.getPackagesByProviderId(userId);
        return res.status(200).json({ success: true, data: packages });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const getArchivedPackages = async (req, res) => {
    try {
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        const packages = await providerModel.getArchivedPackagesByProviderId(userId);
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
                const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
                try {
                    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
                    const uniqueName = `package-photo-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
                    if (!fs.existsSync(uploadPackageDirPublic)) fs.mkdirSync(uploadPackageDirPublic, { recursive: true });
                    if (!fs.existsSync(uploadPackageDirClient)) fs.mkdirSync(uploadPackageDirClient, { recursive: true });
                    fs.writeFileSync(path.join(uploadPackageDirPublic, uniqueName), file.buffer);
                    fs.writeFileSync(path.join(uploadPackageDirClient, uniqueName), file.buffer);
                } catch (e) {
                    // Safe for read-only filesystem
                }
                return dataUrl;
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
                const dataUrl = `data:${file.mimetype || 'image/jpeg'};base64,${file.buffer.toString('base64')}`;
                try {
                    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
                    const uniqueName = `package-photo-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
                    if (!fs.existsSync(uploadPackageDirPublic)) fs.mkdirSync(uploadPackageDirPublic, { recursive: true });
                    if (!fs.existsSync(uploadPackageDirClient)) fs.mkdirSync(uploadPackageDirClient, { recursive: true });
                    fs.writeFileSync(path.join(uploadPackageDirPublic, uniqueName), file.buffer);
                    fs.writeFileSync(path.join(uploadPackageDirClient, uniqueName), file.buffer);
                } catch (e) {
                    // Safe for read-only filesystem
                }
                return dataUrl;
            });
            await providerModel.addPackageImages(id, imageUrls);
        }

        const freshPackage = await providerModel.getPackageById(id, userId);
        return res.status(200).json({ success: true, data: freshPackage || packageData, message: 'Package offer updated successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const archiveProviderPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.body.userId || req.query.userId || 13);
        await providerModel.archivePackage(id, userId);
        return res.status(200).json({ success: true, message: 'Package moved to archive successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const restoreProviderPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.body.userId || req.query.userId || 13);
        await providerModel.restorePackage(id, userId);
        return res.status(200).json({ success: true, message: 'Package restored from archive successfully' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProviderPackagePermanently = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        await providerModel.deletePackagePermanently(id, userId);
        return res.status(200).json({ success: true, message: 'Package permanently deleted' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};

const deleteProviderPackage = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user.userId : (req.query.userId || 13);
        const isPermanent = req.query.permanent === 'true' || req.body?.permanent === true;
        if (isPermanent) {
            await providerModel.deletePackagePermanently(id, userId);
            return res.status(200).json({ success: true, message: 'Package permanently deleted' });
        } else {
            await providerModel.archivePackage(id, userId);
            return res.status(200).json({ success: true, message: 'Package moved to archive successfully' });
        }
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
        if (req.file && req.file.buffer) {
            providerProfilePicture = `data:${req.file.mimetype || 'image/jpeg'};base64,${req.file.buffer.toString('base64')}`;
            try {
                const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
                const uniqueName = `provider-avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
                if (!fs.existsSync(uploadDirPublic)) fs.mkdirSync(uploadDirPublic, { recursive: true });
                if (!fs.existsSync(uploadDirClient)) fs.mkdirSync(uploadDirClient, { recursive: true });
                fs.writeFileSync(path.join(uploadDirPublic, uniqueName), req.file.buffer);
                fs.writeFileSync(path.join(uploadDirClient, uniqueName), req.file.buffer);
            } catch (e) {
                // Safe for read-only filesystem
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

        let providerId = userId;
        try {
            const provRes = await pool.request().input('UID', userId).query(`SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID;`);
            if (provRes.recordset && provRes.recordset[0]) {
                providerId = provRes.recordset[0].ProviderID;
            }
        } catch (e) {}



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
                    b.StartTime,
                    b.EndTime,
                    b.ServiceStartDate,
                    b.ServiceEndDate,
                    b.ServiceHireDays,
                    b.EventPlace,
                    b.VenueName,
                    b.EventAddress,
                    b.EventLatitude,
                    b.EventLongitude,
                    b.LocationNotes,
                    ISNULL(b.Location, 'Batangas') AS Location,
                    b.PackagePrice,
                    b.AdditionalDayCharges,
                    b.TransportationFee,
                    b.DistanceKm,
                    b.TotalAmount,
                    b.AmountPaid,
                    b.RemainingBalance,
                    b.CommissionRate,
                    b.CommissionAmount,
                    b.ProviderEarnings,
                    b.PaymentType,
                    b.BookingStatus,
                    b.PaymentStatus,
                    b.CreatedAt,
                    COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client Account') AS ClientName,
                    COALESCE(NULLIF(b.ClientPhone, ''), u.Phone) AS ClientPhone,
                    COALESCE(NULLIF(b.ClientEmail, ''), u.Email) AS ClientEmail,
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
                WHERE (b.ProviderID = @UID OR sp.UserID = @UID)
                  AND (ISNULL(b.PaymentStatus, '') IN ('Paid', 'Partial') OR ISNULL(b.AmountPaid, 0) > 0)
                  AND ISNULL(b.BookingStatus, '') != 'Pending'
                ORDER BY b.CreatedAt DESC;
            `);
            allBookings = bkRes.recordset || [];
        } catch (e) {
            allBookings = [];
        }

        // Manila Timezone Formatting (UTC+8)
        const nowManilaStr = new Intl.DateTimeFormat('en-CA', { 
            timeZone: 'Asia/Manila', 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        }).format(new Date());

        const getBookingDateStr = (dateVal) => {
            if (!dateVal) return null;
            if (typeof dateVal === 'string') {
                const clean = dateVal.trim().split('T')[0];
                if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
            }
            const d = new Date(dateVal);
            if (!isNaN(d.getTime())) {
                return new Intl.DateTimeFormat('en-CA', { 
                    timeZone: 'Asia/Manila', 
                    year: 'numeric', 
                    month: '2-digit', 
                    day: '2-digit' 
                }).format(d);
            }
            return null;
        };

        // Active bookings (excluding cancelled, rejected, refunded, or unpaid pending)
        const activeBookings = allBookings.filter(b => {
            const st = (b.BookingStatus || '').toLowerCase();
            const pSt = (b.PaymentStatus || '').toLowerCase();
            const paid = parseFloat(b.AmountPaid || 0);
            return st !== 'cancelled' && st !== 'rejected' && st !== 'pending' && pSt !== 'pending' && pSt !== 'refunded' && paid > 0;
        });

        // 1. TODAY'S SCHEDULE: Non-cancelled, paid bookings on today's Manila date
        const todaysEvents = activeBookings.filter(b => {
            const bDate = getBookingDateStr(b.ServiceStartDate || b.EventDate);
            return bDate === nowManilaStr;
        });

        // 2. UPCOMING BOOKINGS: Future confirmed/paid bookings strictly AFTER today
        const upcomingBookings = activeBookings.filter(b => {
            const bDate = getBookingDateStr(b.ServiceStartDate || b.EventDate);
            const isConfirmed = (b.BookingStatus === 'Confirmed' || b.BookingStatus === 'Awaiting Client Confirmation');
            return bDate && bDate > nowManilaStr && isConfirmed;
        });

        // 3. AVAILABLE WALLET BALANCE & EARNINGS:
        // Funds strictly move to provider wallet once service is confirmed COMPLETED by the client!
        let totalContractEarnings = 0;
        let totalCompletedEarnings = 0;
        let totalHeldInEscrow = 0;

        allBookings.forEach(b => {
            const st = b.BookingStatus || '';
            const pSt = (b.PaymentStatus || '').toLowerCase();
            if (st !== 'Cancelled' && st !== 'Rejected' && pSt !== 'refunded') {
                const tot = parseFloat(b.TotalAmount || 0);
                const paid = parseFloat(b.AmountPaid || 0);
                const commRate = parseFloat(b.CommissionRate || 5) / 100;
                const isFullPaid = (pSt === 'paid' || st === 'Completed');
                const netAmount = (isFullPaid ? tot : paid) * (1 - commRate);

                totalContractEarnings += tot * (1 - commRate);

                if (st === 'Completed' || b.EscrowStatus === 'Released') {
                    totalCompletedEarnings += netAmount;
                } else if (st === 'Confirmed' || st === 'Awaiting Client Confirmation') {
                    totalHeldInEscrow += netAmount;
                }
            }
        });

        let totalWithdrawn = 0;
        let pendingWithdrawals = 0;
        try {
            const wRes = await pool.request()
                .input('PID', providerId)
                .input('UID', userId)
                .query(`SELECT Amount, Status FROM dbo.Withdrawals WHERE ProviderID = @PID OR ProviderID = @UID;`);
            const withdrawals = wRes.recordset || [];
            totalWithdrawn = withdrawals
                .filter(w => w.Status === 'Approved' || w.Status === 'Completed')
                .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);
            pendingWithdrawals = withdrawals
                .filter(w => w.Status === 'Pending')
                .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);
        } catch (e) {
            totalWithdrawn = 0;
            pendingWithdrawals = 0;
        }

        const availableBalance = Math.max(0, totalCompletedEarnings - totalWithdrawn - pendingWithdrawals);

        // Client Reviews
        let reviewsList = [];
        try {
            const revRes = await pool.request().input('UID', userId).query(`
                SELECT r.ReviewID, r.BookingID, r.Rating, r.ReviewText AS Comment, r.SubmittedAt AS CreatedAt,
                COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName,
                COALESCE(b.PackageName, 'Custom Package') AS PackageName,
                b.EventDate
                FROM dbo.Reviews r
                LEFT JOIN dbo.Users u ON r.UserID = u.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                LEFT JOIN dbo.Bookings b ON r.BookingID = b.BookingID
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
                upcomingBookingsCount: upcomingBookings.length,
                todaysEventsCount: todaysEvents.length,
                availableBalance: parseFloat(availableBalance.toFixed(2)),
                heldInEscrow: parseFloat(totalHeldInEscrow.toFixed(2)),
                completedEarnings: parseFloat(totalCompletedEarnings.toFixed(2)),
                totalEarnings: parseFloat(totalContractEarnings.toFixed(2)),
                collectedEarnings: parseFloat(totalCompletedEarnings.toFixed(2)),
                totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
                pendingWithdrawals: parseFloat(pendingWithdrawals.toFixed(2)),
                monthlyEarnings: parseFloat(availableBalance.toFixed(2)),
                upcomingBookings,
                todaysEvents,
                allBookings,
                reviewsList
            }
        });
    } catch (err) {
        console.error('Error fetching provider dashboard stats:', err);
        return res.status(200).json({
            success: true,
            stats: {
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

        // Proactively process any completions past the 24-hour window
        try {
            await checkAndAutoAcceptCompletions();
        } catch (e) { }

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
                    b.StartTime,
                    b.EndTime,
                    b.ServiceStartDate,
                    b.ServiceEndDate,
                    b.ServiceHireDays,
                    b.EventPlace,
                    b.VenueName,
                    b.EventAddress,
                    b.EventLatitude,
                    b.EventLongitude,
                    b.LocationNotes,
                    ISNULL(b.Location, 'Batangas') AS Location,
                    b.PackagePrice,
                    b.AdditionalDayCharges,
                    b.TransportationFee,
                    b.DistanceKm,
                    b.TotalAmount,
                    b.AmountPaid,
                    b.RemainingBalance,
                    b.CommissionRate,
                    b.CommissionAmount,
                    b.ProviderEarnings,
                    b.PaymentType,
                    b.BookingStatus,
                    b.PaymentStatus,
                    b.CompletionRequestedAt,
                    b.CompletionAcceptedAt,
                    b.CreatedAt,
                    COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client Account') AS ClientName,
                    COALESCE(NULLIF(b.ClientPhone, ''), u.Phone) AS ClientPhone,
                    COALESCE(NULLIF(b.ClientEmail, ''), u.Email) AS ClientEmail,
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
                WHERE (b.ProviderID = @UID OR sp.UserID = @UID)
                  AND (ISNULL(b.PaymentStatus, '') IN ('Paid', 'Partial') OR ISNULL(b.AmountPaid, 0) > 0)
                  AND ISNULL(b.BookingStatus, '') != 'Pending'
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

        // Check Business Permit Validity Guard
        const permitCheck = await pool.request()
            .input('UID', userId)
            .query("SELECT PermitExpiryDate, BusinessName, PermitRenewalStatus, PermitStatus FROM dbo.ServiceProviders WHERE UserID = @UID OR ProviderID = @UID;");
        if (permitCheck.recordset && permitCheck.recordset[0]) {
            const provRow = permitCheck.recordset[0];
            let isExpired = false;
            let expiryDateStr = '';
            if (provRow.PermitExpiryDate) {
                const expiry = new Date(provRow.PermitExpiryDate);
                expiryDateStr = expiry.toLocaleDateString();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (expiry < today && provRow.PermitRenewalStatus !== 'Approved') {
                    isExpired = true;
                }
            } else if (provRow.PermitStatus === 'Expired' && provRow.PermitRenewalStatus !== 'Approved') {
                isExpired = true;
            }

            if (isExpired) {
                return res.status(403).json({
                    success: false,
                    isPermitExpired: true,
                    message: `Cannot accept new bookings. Your business permit expired${expiryDateStr ? ' on ' + expiryDateStr : ''}. All calendar bookings are locked until a renewed business permit is approved by the administrator.`
                });
            }
        }

        // Check Active Subscription Guard
        const subCheck = await pool.request()
            .input('UID', userId)
            .query(`
                SELECT TOP 1 SubscriptionID, PlanType, PlanName, Status, EndDate
                FROM dbo.ProviderSubscriptions
                WHERE (ProviderID = @UID OR UserID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID))
                  AND Status = 'Active'
                  AND EndDate >= GETDATE()
                ORDER BY EndDate DESC, SubscriptionID DESC;
            `);

        if (!subCheck.recordset || subCheck.recordset.length === 0) {
            return res.status(403).json({
                success: false,
                isSubscriptionActive: false,
                message: 'Cannot accept bookings. You do not have an active subscription. All calendar bookings are locked until you subscribe to a plan.'
            });
        }

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
        if (!pool) return res.status(500).json({ success: false, message: 'Database pool unavailable.' });

        // Fetch booking record
        const bkRes = await pool.request()
            .input('BID', id)
            .query(`
                SELECT b.*, 
                       sp.BusinessName, sp.ProviderID AS SpProviderID, sp.UserID AS SpUserID
                FROM dbo.Bookings b
                LEFT JOIN dbo.ServiceProviders sp ON (b.ProviderID = sp.ProviderID OR b.ProviderID = sp.UserID)
                WHERE b.BookingID = @BID;
            `);
        
        const booking = bkRes.recordset[0];
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        // Validate provider ownership
        const isOwner = (booking.ProviderID == userId || booking.SpUserID == userId || booking.SpProviderID == userId);
        if (!isOwner) {
            return res.status(403).json({ success: false, message: 'Unauthorized to mark this booking as complete.' });
        }

        // Enforce: Complete button is only available on or after the day of services!
        const rawDate = booking.ServiceStartDate || booking.EventDate;
        if (rawDate) {
            const now = new Date();
            const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const eventDate = new Date(rawDate);
            const eventMidnight = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()).getTime();

            if (todayMidnight < eventMidnight) {
                const dateFormatted = eventDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
                return res.status(400).json({
                    success: false,
                    message: `The Complete button will only be available on the day of services (${dateFormatted}).`
                });
            }
        }

        // Mark as Awaiting Client Confirmation and set CompletionRequestedAt
        await pool.request()
            .input('BID', id)
            .query(`
                UPDATE dbo.Bookings 
                SET BookingStatus = 'Awaiting Client Confirmation',
                    CompletionRequestedAt = GETDATE(),
                    UpdatedAt = GETDATE() 
                WHERE BookingID = @BID;
            `);

        // Send Notification to Client
        if (booking.ClientUserID) {
            const ref = booking.BookingReference || `BK-${booking.BookingID}`;
            const providerName = booking.BusinessName || 'Service Provider';
            await notificationModel.createNotification({
                userId: booking.ClientUserID,
                type: 'service_completed_pending',
                title: 'Service Completed - Confirmation Needed',
                message: `${providerName} marked booking ${ref} as completed. Please confirm and accept completion within 24 hours (or it will auto-accept).`,
                relatedId: booking.BookingID,
                relatedType: 'Booking'
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: `Booking #${id} marked as complete! A notification has been sent to the client to confirm within 24 hours.` 
        });
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

        // Fetch booking info before cancellation
        const bkRes = await pool.request()
            .input('BID', id)
            .query(`SELECT BookingID, ClientUserID, AmountPaid, BookingReference, PackageName, BookingStatus FROM dbo.Bookings WHERE BookingID = @BID;`);
        
        const booking = bkRes.recordset[0];
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        await pool.request()
            .input('BID', id)
            .input('UID', userId)
            .query(`
                UPDATE dbo.Bookings 
                SET BookingStatus = 'Cancelled', UpdatedAt = GETDATE() 
                WHERE BookingID = @BID AND (ProviderID = @UID OR ProviderID IN (SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID));
            `);

        // Automatically credit refund to client wallet if booking had payment
        const refundAmt = parseFloat(booking.AmountPaid || 0);
        if (refundAmt > 0 && booking.ClientUserID && booking.BookingStatus !== 'Cancelled') {
            try {
                const walletService = require('../services/walletService');
                await walletService.creditWalletForRefund({
                    userId: booking.ClientUserID,
                    amount: refundAmt,
                    bookingId: booking.BookingID,
                    bookingReference: booking.BookingReference,
                    reason: `Automatic refund for booking cancelled by service provider (${booking.PackageName || 'Event Service'})`
                });

                // Update booking payment status to Refunded and clear remaining balance
                await pool.request()
                    .input('BID', id)
                    .query(`
                        UPDATE dbo.Bookings 
                        SET PaymentStatus = 'Refunded', RemainingBalance = 0, UpdatedAt = GETDATE()
                        WHERE BookingID = @BID;
                    `);
            } catch (wErr) {
                console.error('Wallet refund on provider cancel notice:', wErr);
            }
        }

        return res.status(200).json({ 
            success: true, 
            message: `Booking #${id} cancelled successfully.${refundAmt > 0 ? ` ₱${refundAmt.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been automatically refunded to the client's wallet.` : ''}` 
        });
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
                r.BookingID,
                r.Rating,
                r.ReviewText AS Comment,
                r.SubmittedAt AS CreatedAt,
                COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Verified Client') AS ClientName,
                COALESCE(b.PackageName, 'Custom Package') AS PackageName,
                b.EventDate
            FROM dbo.Reviews r
            LEFT JOIN dbo.Users u ON r.UserID = u.UserID
            LEFT JOIN dbo.Clients c ON r.UserID = c.UserID
            LEFT JOIN dbo.Bookings b ON r.BookingID = b.BookingID
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
 * DELETE /api/providers/reviews/:id
 * Delete a review associated with the provider
 */
const deleteProviderReview = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.query.userId || 13);
        const reviewId = parseInt(req.params.id, 10);

        if (!reviewId || isNaN(reviewId)) {
            return res.status(400).json({ success: false, message: 'Invalid review ID.' });
        }

        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        let providerId = userId;
        const provRes = await pool.request().input('UID', userId).query(`SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UID;`);
        if (provRes.recordset && provRes.recordset[0]) {
            providerId = provRes.recordset[0].ProviderID;
        }

        const delRes = await pool.request()
            .input('RID', reviewId)
            .input('UID', userId)
            .input('PID', providerId)
            .query(`
                DELETE FROM dbo.Reviews
                WHERE ReviewID = @RID
                  AND (
                      ProviderID = @UID 
                      OR ProviderID = @PID
                      OR BookingID IN (SELECT BookingID FROM dbo.Bookings WHERE ProviderID = @UID OR ProviderID = @PID)
                  );
            `);

        if (delRes.rowsAffected && delRes.rowsAffected[0] > 0) {
            return res.status(200).json({ success: true, message: 'Review successfully deleted.' });
        } else {
            return res.status(404).json({ success: false, message: 'Review not found or unauthorized to delete.' });
        }
    } catch (err) {
        console.error('Error deleting provider review:', err);
        return res.status(500).json({ success: false, message: 'Failed to delete review: ' + err.message });
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

        // 2. Withdrawal History & Total Withdrawn from dbo.Withdrawals
        const wRes = await pool.request()
            .input('PID', providerId)
            .input('UID', userId)
            .query(`
                SELECT 
                    w.WithdrawalID,
                    w.ProviderID,
                    w.BookingID,
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

        const totalWithdrawn = withdrawals
            .filter(w => w.Status === 'Approved' || w.Status === 'Completed')
            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);

        const pendingWithdrawals = withdrawals
            .filter(w => w.Status === 'Pending')
            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);

        // General (unlinked) approved and pending withdrawal amounts
        let remainingGeneralApproved = withdrawals
            .filter(w => !w.BookingID && (w.Status === 'Approved' || w.Status === 'Completed'))
            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);

        let remainingGeneralPending = withdrawals
            .filter(w => !w.BookingID && w.Status === 'Pending')
            .reduce((sum, w) => sum + parseFloat(w.Amount || 0), 0);

        // Direct booking withdrawals map
        const directBookingWd = {};
        withdrawals.forEach(w => {
            if (w.BookingID && !directBookingWd[w.BookingID]) {
                directBookingWd[w.BookingID] = w;
            }
        });

        // 3. Fetch all bookings for this provider in chronological order
        const bkRes = await pool.request()
            .input('UID', userId)
            .input('PID', providerId)
            .query(`
                SELECT 
                    b.BookingID,
                    b.BookingReference,
                    b.PackageName,
                    b.EventDate,
                    b.ServiceStartDate,
                    b.TotalAmount,
                    b.AmountPaid,
                    b.CommissionRate,
                    b.CommissionAmount,
                    b.ProviderEarnings,
                    b.PaymentStatus,
                    b.BookingStatus,
                    b.EscrowStatus,
                    b.CreatedAt,
                    b.CompletionAcceptedAt,
                    COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), 'Client') AS ClientName
                FROM dbo.Bookings b
                WHERE (b.ProviderID = @PID OR b.ProviderID = @UID)
                  AND b.BookingStatus NOT IN ('Cancelled', 'Rejected')
                ORDER BY b.CreatedAt ASC, b.BookingID ASC;
            `);

        const allBookings = bkRes.recordset || [];

        let totalCompletedEarnings = 0;
        let totalHeldInEscrow = 0;
        let totalContractEarnings = 0;

        const completedBookings = [];
        const undisbursedCompletedBookings = [];
        const disbursedCompletedBookings = [];
        const escrowBookings = [];

        allBookings.forEach(b => {
            const tot = parseFloat(b.TotalAmount || 0);
            const paid = parseFloat(b.AmountPaid || 0);
            const commRate = parseFloat(b.CommissionRate || 5) / 100;
            const pSt = (b.PaymentStatus || '').toLowerCase();
            const isFullPaid = (pSt === 'paid' || b.BookingStatus === 'Completed');
            const gross = isFullPaid ? tot : paid;
            const commFee = gross * commRate;
            const netAmount = gross - commFee;

            totalContractEarnings += tot * (1 - commRate);

            const directWd = directBookingWd[b.BookingID];
            const directStatus = directWd ? (directWd.Status || '').toLowerCase() : null;

            const bookingItem = {
                ...b,
                grossAmount: parseFloat(gross.toFixed(2)),
                commissionFee: parseFloat(commFee.toFixed(2)),
                netEarnings: parseFloat(netAmount.toFixed(2)),
                CashierWithdrawalStatus: directWd ? directWd.Status : null,
                CashierWithdrawalID: directWd ? directWd.WithdrawalID : null
            };

            const isCompleted = (b.BookingStatus === 'Completed' || b.EscrowStatus === 'Released');

            if (isCompleted) {
                totalCompletedEarnings += netAmount;
                completedBookings.push(bookingItem);

                // Determine if already disbursed directly or covered by general approved lump sum
                if (directStatus === 'approved' || directStatus === 'completed') {
                    disbursedCompletedBookings.push(bookingItem);
                } else if (remainingGeneralApproved >= (netAmount - 0.50)) {
                    remainingGeneralApproved -= netAmount;
                    bookingItem.CashierWithdrawalStatus = 'Approved';
                    disbursedCompletedBookings.push(bookingItem);
                } else if (directStatus === 'pending') {
                    bookingItem.CashierWithdrawalStatus = 'Pending';
                    undisbursedCompletedBookings.push(bookingItem);
                } else if (remainingGeneralPending >= (netAmount - 0.50)) {
                    remainingGeneralPending -= netAmount;
                    bookingItem.CashierWithdrawalStatus = 'Pending';
                    undisbursedCompletedBookings.push(bookingItem);
                } else {
                    undisbursedCompletedBookings.push(bookingItem);
                }
            } else if (b.BookingStatus === 'Confirmed' || b.BookingStatus === 'Awaiting Client Confirmation') {
                totalHeldInEscrow += netAmount;
                escrowBookings.push(bookingItem);
            }
        });

        // Sort undisbursed list newest to oldest for display
        undisbursedCompletedBookings.sort((a, b) => b.BookingID - a.BookingID);
        completedBookings.sort((a, b) => b.BookingID - a.BookingID);

        const availableBalance = Math.max(0, totalCompletedEarnings - totalWithdrawn - pendingWithdrawals);

        return res.status(200).json({
            success: true,
            availableBalance: parseFloat(availableBalance.toFixed(2)),
            heldInEscrow: parseFloat(totalHeldInEscrow.toFixed(2)),
            completedEarnings: parseFloat(totalCompletedEarnings.toFixed(2)),
            totalEarnings: parseFloat(totalContractEarnings.toFixed(2)),
            totalWithdrawn: parseFloat(totalWithdrawn.toFixed(2)),
            pendingWithdrawals: parseFloat(pendingWithdrawals.toFixed(2)),
            completedBookings,
            undisbursedCompletedBookings,
            disbursedCompletedBookings,
            escrowBookings,
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
 * Submit new payout withdrawal request to Cashier
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
                    SELECT BookingID, TotalAmount, AmountPaid, PaymentStatus, BookingStatus, EscrowStatus
                    FROM dbo.Bookings
                    WHERE BookingID = @BID AND (ProviderID = @PID OR ProviderID = @UID);
                `);
            const targetBk = bCheck.recordset && bCheck.recordset[0];
            if (!targetBk) {
                return res.status(400).json({ success: false, message: 'Specified booking was not found.' });
            }

            // Must be confirmed completed by client
            if (targetBk.BookingStatus !== 'Completed' && targetBk.EscrowStatus !== 'Released') {
                return res.status(400).json({
                    success: false,
                    message: 'Payment for this booking is still held in escrow. The client must first confirm that the service is completed before funds can be withdrawn.'
                });
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
        }

        // Check general available balance strictly from completed services
        const bkRes = await pool.request()
            .input('UID', userId)
            .input('PID', providerId)
            .query(`
                SELECT b.TotalAmount, b.AmountPaid, b.CommissionRate, b.PaymentStatus, b.BookingStatus, b.EscrowStatus
                FROM dbo.Bookings b
                WHERE (b.ProviderID = @PID OR b.ProviderID = @UID)
                  AND (b.BookingStatus = 'Completed' OR b.EscrowStatus = 'Released');
            `);

        let totalCompleted = 0;
        (bkRes.recordset || []).forEach(b => {
            const tot = parseFloat(b.TotalAmount || 0);
            const commRate = parseFloat(b.CommissionRate || 5) / 100;
            totalCompleted += tot * (1 - commRate);
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
        const currentAvailable = Math.max(0, totalCompleted - totalPendingOrApproved);

        if (numericAmount > (currentAvailable + 0.05)) {
            return res.status(400).json({
                success: false,
                message: `Insufficient wallet balance. You can only withdraw from completed services confirmed by clients. Current available balance is ₱${currentAvailable.toLocaleString('en-US', { minimumFractionDigits: 2 })}.`
            });
        }

        // Insert new withdrawal request into dbo.Withdrawals for Cashier review
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
            message: `🎉 Withdrawal request of ₱${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} submitted successfully! It has been routed to the Cashier for disbursement approval.`,
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

/**
 * GET /api/providers/permit-status
 * Get the current provider's permit compliance status
 */
const getProviderPermitStatus = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : null;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        const provRes = await pool.request()
            .input('UID', sql.Int, userId)
            .query(`
                SELECT 
                    sp.ProviderID,
                    sp.UserID,
                    sp.BusinessName,
                    sp.PermitExpiryDate,
                    sp.PermitIssuedDate,
                    sp.PermitNumber,
                    sp.PermitStatus,
                    sp.PermitNoticeSentAt,
                    sp.PermitRenewalDoc,
                    sp.PermitRenewalExpiryDate,
                    sp.PermitRenewalIssuedDate,
                    sp.PermitRenewalSubmittedAt,
                    sp.PermitRenewalStatus,
                    sp.PermitRenewalNotes,
                    pa.BusinessPermit_Url
                FROM dbo.ServiceProviders sp
                LEFT JOIN dbo.ProviderApplications pa ON sp.ApplicationID = pa.ApplicationID
                WHERE sp.UserID = @UID OR sp.ProviderID = @UID;
            `);

        if (!provRes.recordset || !provRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Provider profile not found.' });
        }

        const prov = provRes.recordset[0];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let permitStatus = 'Not_Set';
        let daysRemaining = null;
        let isExpired = false;
        let isExpiringSoon = false;

        if (prov.PermitExpiryDate) {
            const exp = new Date(prov.PermitExpiryDate);
            exp.setHours(0, 0, 0, 0);
            daysRemaining = Math.round((exp - today) / (1000 * 60 * 60 * 24));
            if (daysRemaining < 0) {
                permitStatus = 'Expired';
                isExpired = true;
            } else if (daysRemaining <= 30) {
                permitStatus = 'Expiring_Soon';
                isExpiringSoon = true;
            } else {
                permitStatus = 'Valid';
            }
        }

        return res.status(200).json({
            success: true,
            permit: {
                ...prov,
                permitStatus,
                daysRemaining,
                isExpired,
                isExpiringSoon,
                isBookingDisabled: isExpired
            }
        });
    } catch (error) {
        console.error('Get Provider Permit Status Error:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * POST /api/providers/permit-renewal
 * Service provider submits a renewed business permit document and expiration date
 */
const submitPermitRenewal = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : null;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized.' });

        const { expiryDate, issuedDate, permitNumber } = req.body;
        if (!expiryDate) {
            return res.status(400).json({ success: false, message: 'Permit expiration date is required.' });
        }

        const parsedDate = new Date(expiryDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate <= today) {
            return res.status(400).json({ success: false, message: 'Expiration date must be in the future.' });
        }

        let parsedIssued = null;
        if (issuedDate) {
            parsedIssued = new Date(issuedDate);
        }

        let documentUrl = null;

        // If file uploaded via multipart
        if (req.file) {
            const base64Data = req.file.buffer.toString('base64');
            documentUrl = `data:${req.file.mimetype};base64,${base64Data}`;
        } else if (req.body.permitDocumentUrl || req.body.documentBase64) {
            documentUrl = req.body.permitDocumentUrl || req.body.documentBase64;
        }

        if (!documentUrl) {
            return res.status(400).json({ success: false, message: 'A copy of the business permit is required.' });
        }

        let pool = null;
        try { pool = getPool(); } catch (e) { pool = await connectDB(); }

        const provRes = await pool.request()
            .input('UID', sql.Int, userId)
            .query("SELECT ProviderID, BusinessName FROM dbo.ServiceProviders WHERE UserID = @UID OR ProviderID = @UID;");

        if (!provRes.recordset || !provRes.recordset.length) {
            return res.status(404).json({ success: false, message: 'Provider profile not found.' });
        }

        const prov = provRes.recordset[0];

        await pool.request()
            .input('PID', sql.Int, prov.ProviderID)
            .input('Doc', sql.NVarChar(sql.MAX), documentUrl)
            .input('Exp', sql.Date, parsedDate)
            .input('Issued', sql.Date, parsedIssued)
            .input('PNum', sql.NVarChar(100), permitNumber ? permitNumber.trim() : null)
            .query(`
                UPDATE dbo.ServiceProviders
                SET PermitRenewalDoc = @Doc,
                    PermitRenewalExpiryDate = @Exp,
                    PermitRenewalIssuedDate = @Issued,
                    PermitIssuedDate = COALESCE(@Issued, PermitIssuedDate),
                    PermitNumber = COALESCE(@PNum, PermitNumber),
                    PermitRenewalSubmittedAt = GETDATE(),
                    PermitRenewalStatus = 'Pending_Review',
                    PermitRenewalNotes = NULL
                WHERE ProviderID = @PID;
            `);

        // Notify Admins
        try {
            const adminUsers = await pool.request().query("SELECT UserID FROM dbo.Users WHERE RoleID = 1 OR RoleID IN (SELECT RoleID FROM dbo.Roles WHERE RoleName = 'Administrator');");
            if (adminUsers.recordset && adminUsers.recordset.length) {
                for (const admin of adminUsers.recordset) {
                    await pool.request()
                        .input('AdminUID', sql.Int, admin.UserID)
                        .input('Title', sql.NVarChar(200), 'New Business Permit Renewal Submitted')
                        .input('Msg', sql.NVarChar(500), `Provider "${prov.BusinessName}" has submitted a renewed business permit expiring on ${parsedDate.toLocaleDateString()}. Please review and verify.`)
                        .input('PID', sql.Int, prov.ProviderID)
                        .query(`
                            IF OBJECT_ID('dbo.Notifications', 'U') IS NOT NULL
                            BEGIN
                                INSERT INTO dbo.Notifications (UserID, Title, Message, NotificationType, RelatedID, RelatedType)
                                VALUES (@AdminUID, @Title, @Msg, 'PermitRenewalSubmission', @PID, 'ProviderPermit');
                            END
                        `);
                }
            }
        } catch (notifErr) {
            console.warn('Admin notification notice:', notifErr.message);
        }

        return res.status(200).json({
            success: true,
            message: 'Business permit renewal submitted successfully! Our administrators will review and verify it shortly.'
        });
    } catch (error) {
        console.error('Submit Permit Renewal Error:', error);
        return res.status(500).json({ success: false, message: error.message });
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
    getArchivedPackages,
    createProviderPackage,
    updateProviderPackage,
    deleteProviderPackage,
    archiveProviderPackage,
    restoreProviderPackage,
    deleteProviderPackagePermanently,
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
    deleteProviderReview,
    getProviderPermitStatus,
    submitPermitRenewal,
    upload,
    uploadPackagePhotos,
    deletePackagePhoto
};

