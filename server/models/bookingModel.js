/**
 * SoundSphere - Booking & Review Data Access Model
 * Manages SQL Server operations for Client Bookings, Reviews, and Booking History
 */

const { getPool, sql } = require('../config/db');

/**
 * Check backend provider availability for overlapping booking schedules on the same event date
 * Overlap logic: existing.start_time < requested.end_time AND existing.end_time > requested.start_time
 */
const checkProviderAvailability = async ({ providerId, serviceStartDate, serviceEndDate, eventDate, startTime, endTime, excludeBookingId = null }) => {
    const pool = getPool();
    if (!pool) return { isAvailable: true, conflictingBookings: [] };

    const startDate = serviceStartDate || eventDate;
    const endDate = serviceEndDate || eventDate;

    const req = pool.request()
        .input('ProviderID', sql.Int, providerId)
        .input('StartDate', sql.NVarChar(50), startDate)
        .input('EndDate', sql.NVarChar(50), endDate);

    let excludeClause = '';
    if (excludeBookingId) {
        req.input('ExcludeBookingID', sql.Int, excludeBookingId);
        excludeClause = 'AND b.BookingID != @ExcludeBookingID';
    }

    const result = await req.query(`
        SELECT 
            b.BookingID,
            b.BookingReference,
            b.PackageName,
            b.EventDate,
            b.ServiceStartDate,
            b.ServiceEndDate,
            b.StartTime,
            b.EndTime,
            b.BookingStatus
        FROM dbo.Bookings b
        WHERE b.ProviderID = @ProviderID
          AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
          AND (
              ISNULL(b.ServiceStartDate, b.EventDate) <= @EndDate 
              AND ISNULL(b.ServiceEndDate, b.EventDate) >= @StartDate
          )
          ${excludeClause};
    `);

    const conflicts = result.recordset || [];
    return {
        isAvailable: conflicts.length === 0,
        conflictingBookings: conflicts
    };
};

/**
 * Get provider's booked dates & times for calendar blackout
 */
const getProviderAvailabilitySlots = async (providerId) => {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .query(`
            SELECT 
                b.BookingID,
                b.EventDate,
                b.ServiceStartDate,
                b.ServiceEndDate,
                b.ServiceHireDays,
                b.StartTime,
                b.EndTime,
                b.BookingStatus
            FROM dbo.Bookings b
            WHERE b.ProviderID = @ProviderID
              AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
            ORDER BY ISNULL(b.ServiceStartDate, b.EventDate) ASC;
        `);

    return result.recordset || [];
};

/**
 * Get active distance-based transportation fee tiers from database
 */
const getTransportationFees = async () => {
    const pool = getPool();
    if (!pool) return [];

    try {
        const res = await pool.request().query(`
            SELECT FeeID, MinDistanceKm, MaxDistanceKm, ServiceFee, IsActive
            FROM dbo.TransportationFees
            WHERE IsActive = 1
            ORDER BY MinDistanceKm ASC;
        `);
        return res.recordset || [];
    } catch (err) {
        console.warn('Query dbo.TransportationFees notice:', err.message);
        return [
            { FeeID: 1, MinDistanceKm: 0.00, MaxDistanceKm: 10.00, ServiceFee: 500.00, IsActive: 1 },
            { FeeID: 2, MinDistanceKm: 10.01, MaxDistanceKm: 20.00, ServiceFee: 750.00, IsActive: 1 },
            { FeeID: 3, MinDistanceKm: 20.01, MaxDistanceKm: 30.00, ServiceFee: 1000.00, IsActive: 1 },
            { FeeID: 4, MinDistanceKm: 30.01, MaxDistanceKm: 40.00, ServiceFee: 1250.00, IsActive: 1 },
            { FeeID: 5, MinDistanceKm: 40.01, MaxDistanceKm: 50.00, ServiceFee: 1500.00, IsActive: 1 },
            { FeeID: 6, MinDistanceKm: 50.01, MaxDistanceKm: 999.00, ServiceFee: 2000.00, IsActive: 1 }
        ];
    }
};

/**
 * Generate unique booking reference code (e.g. SS-2026-00001)
 */
const generateBookingReference = async () => {
    const pool = getPool();
    const currentYear = new Date().getFullYear();
    const countRes = await pool.request().query(`SELECT COUNT(*) AS Total FROM dbo.Bookings;`);
    const nextNum = (countRes.recordset[0]?.Total || 0) + 1;
    const padded = String(nextNum).padStart(5, '0');
    return `SS-${currentYear}-${padded}`;
};

/**
 * Create a new Client Booking + Payment atomically inside a SQL Transaction
 */
const createBookingWithTransaction = async (bookingData, paymentData) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        const reference = bookingData.bookingReference || await generateBookingReference();

        const sDate = bookingData.serviceStartDate || bookingData.eventDate;
        const eDate = bookingData.serviceEndDate || bookingData.eventDate || sDate;
        const sDays = parseInt(bookingData.serviceHireDays || bookingData.numberOfDays || 1, 10);

        const req = transaction.request()
            .input('BookingReference', sql.NVarChar(50), reference)
            .input('ClientUserID', sql.Int, bookingData.clientUserId)
            .input('ProviderID', sql.Int, bookingData.providerId)
            .input('PackageID', sql.Int, bookingData.packageId || null)
            .input('PackageName', sql.NVarChar(150), bookingData.packageName)
            .input('EventName', sql.NVarChar(200), bookingData.eventName || 'Event Booking')
            .input('EventType', sql.NVarChar(100), bookingData.eventType || 'Party')
            .input('EventDate', sql.NVarChar(50), sDate)
            .input('ServiceStartDate', sql.NVarChar(50), sDate)
            .input('ServiceEndDate', sql.NVarChar(50), eDate)
            .input('ServiceHireDays', sql.Int, sDays)
            .input('StartTime', sql.NVarChar(50), bookingData.startTime || '06:00 PM')
            .input('EndTime', sql.NVarChar(50), bookingData.endTime || '10:00 PM')
            .input('NumberOfHours', sql.Decimal(10, 2), bookingData.numberOfHours || 0)
            .input('NumberOfDays', sql.Int, sDays)
            .input('EventPlace', sql.NVarChar(100), bookingData.eventPlace || 'Lian')
            .input('VenueName', sql.NVarChar(200), bookingData.venueName || null)
            .input('EventAddress', sql.NVarChar(500), bookingData.eventAddress || '')
            .input('EventLatitude', sql.Decimal(10, 7), bookingData.eventLatitude || null)
            .input('EventLongitude', sql.Decimal(10, 7), bookingData.eventLongitude || null)
            .input('LocationNotes', sql.NVarChar(500), bookingData.locationNotes || null)
            .input('Location', sql.NVarChar(255), bookingData.location || bookingData.eventAddress || bookingData.eventPlace || 'Batangas')
            .input('PackagePrice', sql.Decimal(18, 2), bookingData.packagePrice || 0)
            .input('AdditionalDayCharges', sql.Decimal(18, 2), bookingData.additionalDayCharges || 0)
            .input('TransportationFee', sql.Decimal(18, 2), bookingData.transportationFee || 0)
            .input('DistanceKm', sql.Decimal(10, 2), bookingData.distanceKm || 0)
            .input('TotalAmount', sql.Decimal(18, 2), bookingData.totalAmount || bookingData.packagePrice || 0)
            .input('PaymentType', sql.NVarChar(30), bookingData.paymentType || 'downpayment')
            .input('AmountPaid', sql.Decimal(18, 2), bookingData.amountPaid || 0)
            .input('RemainingBalance', sql.Decimal(18, 2), bookingData.remainingBalance || 0)
            .input('CommissionRate', sql.Decimal(5, 2), bookingData.commissionRate || 5.00)
            .input('CommissionAmount', sql.Decimal(18, 2), bookingData.commissionAmount || 0)
            .input('ProviderEarnings', sql.Decimal(18, 2), bookingData.providerEarnings || 0)
            .input('BookingStatus', sql.NVarChar(30), bookingData.bookingStatus || 'Confirmed')
            .input('PaymentStatus', sql.NVarChar(30), bookingData.paymentStatus || 'Paid');

        const insertBkRes = await req.query(`
            INSERT INTO dbo.Bookings
            (BookingReference, ClientUserID, ProviderID, PackageID, PackageName, EventName, EventType, EventDate, ServiceStartDate, ServiceEndDate, ServiceHireDays, StartTime, EndTime, NumberOfHours, NumberOfDays, EventPlace, VenueName, EventAddress, EventLatitude, EventLongitude, LocationNotes, Location, PackagePrice, AdditionalDayCharges, TransportationFee, DistanceKm, TotalAmount, PaymentType, AmountPaid, RemainingBalance, CommissionRate, CommissionAmount, ProviderEarnings, BookingStatus, PaymentStatus, CreatedAt)
            OUTPUT INSERTED.*
            VALUES
            (@BookingReference, @ClientUserID, @ProviderID, @PackageID, @PackageName, @EventName, @EventType, @EventDate, @ServiceStartDate, @ServiceEndDate, @ServiceHireDays, @StartTime, @EndTime, @NumberOfHours, @NumberOfDays, @EventPlace, @VenueName, @EventAddress, @EventLatitude, @EventLongitude, @LocationNotes, @Location, @PackagePrice, @AdditionalDayCharges, @TransportationFee, @DistanceKm, @TotalAmount, @PaymentType, @AmountPaid, @RemainingBalance, @CommissionRate, @CommissionAmount, @ProviderEarnings, @BookingStatus, @PaymentStatus, GETDATE());
        `);

        const createdBooking = insertBkRes.recordset[0];

        // Insert Payment record
        if (paymentData) {
            const payReq = transaction.request()
                .input('BookingID', sql.Int, createdBooking.BookingID)
                .input('Amount', sql.Decimal(18, 2), paymentData.amount || bookingData.amountPaid || 0)
                .input('PaymentMethod', sql.NVarChar(50), paymentData.paymentMethod || bookingData.paymentMethod || 'PayMongo')
                .input('PaymentStatus', sql.NVarChar(20), paymentData.paymentStatus || 'Paid')
                .input('TransactionReference', sql.NVarChar(100), paymentData.transactionReference || reference);

            await payReq.query(`
                INSERT INTO dbo.Payments
                (BookingID, Amount, PaymentMethod, PaymentStatus, TransactionReference, PaidAt, CreatedAt)
                VALUES
                (@BookingID, @Amount, @PaymentMethod, @PaymentStatus, @TransactionReference, GETDATE(), GETDATE());
            `);
        }

        await transaction.commit();
        return createdBooking;
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

/**
 * Get single Booking details by BookingID
 */
const getBookingById = async (bookingId) => {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
            SELECT 
                b.*,
                sp.BusinessName AS ProviderName,
                sp.OwnerName AS ProviderOwnerName,
                sp.ProfilePicture AS ProviderAvatar,
                sp.CoverageArea AS ProviderCoverage,
                u.Email AS ProviderEmail,
                u.Phone AS ProviderPhone,
                cUser.Email AS ClientEmail,
                cUser.Phone AS ClientPhone,
                ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), cUser.Email) AS ClientName
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users cUser ON b.ClientUserID = cUser.UserID
            LEFT JOIN dbo.Clients c ON cUser.UserID = c.UserID
            WHERE b.BookingID = @BookingID;
        `);

    return result.recordset[0] || null;
};

/**
 * Get single Booking details by BookingReference (e.g. SS-2026-00001)
 */
const getBookingByReference = async (bookingReference) => {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.request()
        .input('BookingReference', sql.NVarChar(50), bookingReference)
        .query(`
            SELECT 
                b.*,
                sp.BusinessName AS ProviderName,
                sp.OwnerName AS ProviderOwnerName,
                sp.ProfilePicture AS ProviderAvatar,
                sp.CoverageArea AS ProviderCoverage,
                u.Email AS ProviderEmail,
                u.Phone AS ProviderPhone,
                cUser.Email AS ClientEmail,
                cUser.Phone AS ClientPhone,
                ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), cUser.Email) AS ClientName
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users cUser ON b.ClientUserID = cUser.UserID
            LEFT JOIN dbo.Clients c ON cUser.UserID = c.UserID
            WHERE b.BookingReference = @BookingReference;
        `);

    return result.recordset[0] || null;
};

/**
 * Get all Bookings for a specific Client UserID
 */
const getBookingsByUserId = async (clientUserId) => {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.request()
        .input('ClientUserID', sql.Int, clientUserId)
        .query(`
            SELECT 
                b.*,
                sp.BusinessName AS ProviderName,
                sp.ProfilePicture AS ProviderAvatar,
                r.ReviewID,
                r.Rating,
                r.ReviewText
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Reviews r ON b.BookingID = r.BookingID
            WHERE b.ClientUserID = @ClientUserID
            ORDER BY b.CreatedAt DESC;
        `);

    return result.recordset || [];
};

/**
 * Get all Bookings for a Service Provider UserID
 */
const getBookingsByProviderUserId = async (providerUserId) => {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.request()
        .input('ProviderUserID', sql.Int, providerUserId)
        .query(`
            SELECT 
                b.*,
                ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email) AS ClientName,
                u.Phone AS ClientPhone,
                u.Email AS ClientEmail,
                u.ProfilePicture AS ClientAvatar
            FROM dbo.Bookings b
            INNER JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
            LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
            WHERE sp.UserID = @ProviderUserID OR b.ProviderID = @ProviderUserID
            ORDER BY b.CreatedAt DESC;
        `);

    return result.recordset || [];
};

/**
 * Create a new Rating & Review for a completed Booking
 */
const createReview = async ({ bookingId, userId, providerId, rating, reviewText }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    try {
        await pool.request().query(`
            IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Reviews' AND COLUMN_NAME='BookingID' AND IS_NULLABLE='NO')
            BEGIN
                ALTER TABLE dbo.Reviews ALTER COLUMN BookingID INT NULL;
            END
        `);
    } catch (e) { }

    const result = await pool.request()
        .input('BookingID', sql.Int, bookingId || null)
        .input('UserID', sql.Int, userId)
        .input('ProviderID', sql.Int, providerId || null)
        .input('Rating', sql.Int, rating || 5)
        .input('ReviewText', sql.NVarChar(1000), reviewText.trim())
        .query(`
            INSERT INTO dbo.Reviews
            (BookingID, UserID, ProviderID, Rating, ReviewText)
            OUTPUT INSERTED.ReviewID, INSERTED.BookingID, INSERTED.UserID, INSERTED.Rating, INSERTED.ReviewText, INSERTED.SubmittedAt
            VALUES
            (@BookingID, @UserID, @ProviderID, @Rating, @ReviewText);
        `);

    return result.recordset[0];
};

/**
 * Get all Reviews for a specific UserID
 */
const getReviewsByUserId = async (userId) => {
    const pool = getPool();
    if (!pool) return [];

    const result = await pool.request()
        .input('UserID', sql.Int, userId)
        .query(`
            SELECT 
                r.ReviewID,
                r.BookingID,
                r.UserID,
                r.Rating,
                r.ReviewText,
                r.SubmittedAt,
                b.PackageName,
                b.EventDate
            FROM dbo.Reviews r
            LEFT JOIN dbo.Bookings b ON r.BookingID = b.BookingID
            WHERE r.UserID = @UserID
            ORDER BY r.SubmittedAt DESC;
        `);

    return result.recordset || [];
};

module.exports = {
    checkProviderAvailability,
    getProviderAvailabilitySlots,
    getTransportationFees,
    generateBookingReference,
    createBookingWithTransaction,
    getBookingById,
    getBookingByReference,
    getBookingsByUserId,
    getBookingsByProviderUserId,
    createReview,
    getReviewsByUserId
};
