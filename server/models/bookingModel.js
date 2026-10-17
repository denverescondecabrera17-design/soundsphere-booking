/**
 * SoundSphere - Booking & Review Data Access Model
 * Manages SQL Server operations for Client Bookings, Reviews, and Booking History
 */

const { getPool, sql } = require('../config/db');

/**
 * Check backend provider availability for overlapping booking schedules on the same event date
 * Considers Provider Default Daily Capacity and Specific Date Overrides (0 = Blocked)
 */
const checkProviderAvailability = async ({ providerId, serviceStartDate, serviceEndDate, eventDate, startTime, endTime, excludeBookingId = null }) => {
    const pool = getPool();
    if (!pool) return { isAvailable: true, conflictingBookings: [] };

    const startDate = serviceStartDate || eventDate;
    const endDate = serviceEndDate || eventDate;

    // 1. Get Provider info and default capacity
    const provRes = await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .query(`SELECT TOP 1 ProviderID, ISNULL(MaxDailyBookings, 1) AS MaxDailyBookings FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID OR UserID = @ProviderID;`);

    const defaultCapacity = (provRes.recordset && provRes.recordset.length > 0) ? (provRes.recordset[0].MaxDailyBookings || 1) : 1;
    const resolvedProviderId = (provRes.recordset && provRes.recordset.length > 0) ? provRes.recordset[0].ProviderID : providerId;

    // 2. Check specific date capacity override (e.g. for startDate / endDate)
    const capRes = await pool.request()
        .input('ProviderID', sql.Int, resolvedProviderId)
        .input('StartDate', sql.NVarChar(50), startDate)
        .input('EndDate', sql.NVarChar(50), endDate)
        .query(`
            SELECT SpecificDate, MaxBookings 
            FROM dbo.ProviderDateCapacity 
            WHERE ProviderID = @ProviderID 
              AND SpecificDate >= @StartDate AND SpecificDate <= @EndDate;
        `);

    const overrides = {};
    (capRes.recordset || []).forEach(r => {
        overrides[r.SpecificDate] = r.MaxBookings;
    });

    // If any date in range has MaxBookings === 0, it's blocked
    for (const dStr in overrides) {
        if (overrides[dStr] === 0) {
            return {
                isAvailable: false,
                isBlocked: true,
                message: `Date ${dStr} is marked as unavailable/blocked by the provider.`,
                conflictingBookings: []
            };
        }
    }

    const req = pool.request()
        .input('ProviderID', sql.Int, resolvedProviderId)
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
        WHERE (b.ProviderID = @ProviderID OR b.ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID))
          AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
          AND (ISNULL(b.PaymentStatus, '') IN ('Paid', 'Partial') OR ISNULL(b.AmountPaid, 0) > 0)
          AND (
              ISNULL(b.ServiceStartDate, b.EventDate) <= @EndDate 
              AND ISNULL(b.ServiceEndDate, b.EventDate) >= @StartDate
          )
          ${excludeClause};
    `);

    const conflicts = result.recordset || [];
    
    // Check if any date in the continuous range [startDate ... endDate] meets or exceeds capacity
    const [sY, sM, sD] = startDate.split('-').map(Number);
    const [eY, eM, eD] = endDate.split('-').map(Number);
    let curDate = new Date(sY, sM - 1, sD);
    const endDateObj = new Date(eY, eM - 1, eD);

    while (curDate <= endDateObj) {
        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const d = String(curDate.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;

        const limit = (overrides[dStr] !== undefined) ? overrides[dStr] : defaultCapacity;
        if (limit === 0) {
            return {
                isAvailable: false,
                isBlocked: true,
                message: `Date ${dStr} is marked as unavailable/blocked by the provider.`,
                conflictingBookings: []
            };
        }

        const dateConflicts = conflicts.filter(b => {
            const bStart = String(b.ServiceStartDate || b.EventDate || '').trim().split('T')[0];
            const bEnd = String(b.ServiceEndDate || bStart).trim().split('T')[0];
            return (dStr >= bStart && dStr <= bEnd);
        });

        if (dateConflicts.length >= limit) {
            return {
                isAvailable: false,
                message: `Date ${dStr} is already booked or at maximum capacity. Bookings must be continuous with no gaps.`,
                conflictingBookings: dateConflicts
            };
        }

        curDate.setDate(curDate.getDate() + 1);
    }

    return {
        isAvailable: true,
        allowedLimit: defaultCapacity,
        currentBookingsCount: conflicts.length,
        conflictingBookings: conflicts
    };
};

/**
 * Get provider's booked dates & times plus capacity rules for calendar blackout
 */
const getProviderAvailabilitySlots = async (providerId) => {
    const pool = getPool();
    if (!pool) return { slots: [], capacities: [], defaultMaxDailyBookings: 1 };

    // Resolve ProviderID and default capacity
    const provRes = await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .query(`SELECT TOP 1 ProviderID, ISNULL(MaxDailyBookings, 1) AS MaxDailyBookings FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID OR UserID = @ProviderID;`);

    const defaultMaxDailyBookings = (provRes.recordset && provRes.recordset.length > 0) ? (provRes.recordset[0].MaxDailyBookings || 1) : 1;
    const resolvedProviderId = (provRes.recordset && provRes.recordset.length > 0) ? provRes.recordset[0].ProviderID : providerId;

    const [bookingsRes, capRes] = await Promise.all([
        pool.request()
            .input('ProviderID', sql.Int, resolvedProviderId)
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
                WHERE (b.ProviderID = @ProviderID OR b.ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID))
                  AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
                  AND (ISNULL(b.PaymentStatus, '') IN ('Paid', 'Partial') OR ISNULL(b.AmountPaid, 0) > 0)
                ORDER BY ISNULL(b.ServiceStartDate, b.EventDate) ASC;
            `),
        pool.request()
            .input('ProviderID', sql.Int, resolvedProviderId)
            .query(`
                SELECT CapacityID, ProviderID, SpecificDate, MaxBookings, Notes
                FROM dbo.ProviderDateCapacity
                WHERE ProviderID = @ProviderID OR ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID);
            `)
    ]);

    return {
        slots: bookingsRes.recordset || [],
        dateCapacities: capRes.recordset || [],
        defaultMaxDailyBookings: defaultMaxDailyBookings
    };
};

/**
 * Helper to resolve ProviderID & Default MaxDailyBookings from UserID or ProviderID
 */
const resolveProviderId = async (pool, providerUserIdOrProviderId) => {
    if (!pool) return { providerId: providerUserIdOrProviderId, defaultCapacity: 1 };

    let provRes = await pool.request()
        .input('ID', sql.Int, providerUserIdOrProviderId)
        .query(`SELECT TOP 1 ProviderID, ISNULL(MaxDailyBookings, 1) AS MaxDailyBookings FROM dbo.ServiceProviders WHERE UserID = @ID OR ProviderID = @ID;`);

    if (provRes.recordset && provRes.recordset.length > 0) {
        return {
            providerId: provRes.recordset[0].ProviderID,
            defaultCapacity: provRes.recordset[0].MaxDailyBookings || 1
        };
    }

    // If missing from ServiceProviders, auto-create/link
    const uRes = await pool.request().input('ID', sql.Int, providerUserIdOrProviderId).query(`SELECT UserID, Email FROM dbo.Users WHERE UserID = @ID;`);
    if (uRes.recordset && uRes.recordset.length > 0) {
        const u = uRes.recordset[0];
        const insRes = await pool.request()
            .input('UserID', sql.Int, u.UserID)
            .input('BusinessName', sql.NVarChar(255), (u.Email.split('@')[0] || 'SoundSphere Provider') + ' Sounds & Lights')
            .query(`
                INSERT INTO dbo.ServiceProviders (UserID, BusinessName, VerificationStatus, MaxDailyBookings)
                OUTPUT INSERTED.ProviderID, INSERTED.MaxDailyBookings
                VALUES (@UserID, @BusinessName, 'Approved', 1);
            `);
        if (insRes.recordset && insRes.recordset.length > 0) {
            return {
                providerId: insRes.recordset[0].ProviderID,
                defaultCapacity: insRes.recordset[0].MaxDailyBookings || 1
            };
        }
    }

    return {
        providerId: providerUserIdOrProviderId,
        defaultCapacity: 1
    };
};

/**
 * Full Provider Calendar Schedule: bookings, custom capacities, default capacity, client details
 */
const getProviderCalendarSchedule = async (providerUserIdOrProviderId) => {
    const pool = getPool();
    if (!pool) return { bookings: [], capacities: [], defaultCapacity: 1 };

    const { providerId, defaultCapacity } = await resolveProviderId(pool, providerUserIdOrProviderId);

    const [bookingsRes, capRes] = await Promise.all([
        pool.request()
            .input('ProviderID', sql.Int, providerId)
            .query(`
                SELECT 
                    b.BookingID,
                    b.BookingReference,
                    b.PackageName,
                    b.EventName,
                    b.EventType,
                    b.EventDate,
                    b.ServiceStartDate,
                    b.ServiceEndDate,
                    b.ServiceHireDays,
                    b.StartTime,
                    b.EndTime,
                    b.VenueName,
                    b.EventAddress,
                    b.EventPlace,
                    b.Location,
                    b.TotalAmount,
                    b.PaymentType,
                    b.AmountPaid,
                    b.RemainingBalance,
                    b.BookingStatus,
                    b.PaymentStatus,
                    b.CreatedAt,
                    COALESCE(NULLIF(LTRIM(RTRIM(b.ClientName)), ''), NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email, 'Client') AS ClientName,
                    COALESCE(NULLIF(b.ClientPhone, ''), u.Phone) AS ClientPhone,
                    COALESCE(NULLIF(b.ClientEmail, ''), u.Email) AS ClientEmail
                FROM dbo.Bookings b
                LEFT JOIN dbo.Users u ON b.ClientUserID = u.UserID
                LEFT JOIN dbo.Clients c ON u.UserID = c.UserID
                WHERE (b.ProviderID = @ProviderID OR b.ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID))
                  AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
                ORDER BY ISNULL(b.ServiceStartDate, b.EventDate) ASC, b.StartTime ASC;
            `),
        pool.request()
            .input('ProviderID', sql.Int, providerId)
            .query(`
                SELECT CapacityID, ProviderID, SpecificDate, MaxBookings, Notes, UpdatedAt
                FROM dbo.ProviderDateCapacity
                WHERE ProviderID = @ProviderID OR ProviderID IN (SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID)
                ORDER BY SpecificDate ASC;
            `)
    ]);

    return {
        providerId,
        defaultCapacity,
        bookings: bookingsRes.recordset || [],
        capacities: capRes.recordset || []
    };
};

/**
 * Update Provider Default Daily Capacity
 */
const updateProviderDefaultCapacity = async (providerUserIdOrProviderId, maxDaily) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const maxBookings = Math.max(1, parseInt(maxDaily, 10) || 1);
    const { providerId } = await resolveProviderId(pool, providerUserIdOrProviderId);

    const res = await pool.request()
        .input('PID', sql.Int, providerId)
        .input('MaxDaily', sql.Int, maxBookings)
        .query(`
            UPDATE dbo.ServiceProviders 
            SET MaxDailyBookings = @MaxDaily 
            WHERE ProviderID = @PID;

            SELECT TOP 1 ProviderID, MaxDailyBookings FROM dbo.ServiceProviders WHERE ProviderID = @PID;
        `);

    return res.recordset && res.recordset[0] ? res.recordset[0] : { MaxDailyBookings: maxBookings };
};

/**
 * Set Specific Date Capacity Override (0 = Blocked, 1, 2, 3...)
 */
const setProviderDateCapacity = async (providerUserIdOrProviderId, specificDate, maxBookings, notes = null) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const { providerId } = await resolveProviderId(pool, providerUserIdOrProviderId);
    const capacityVal = Math.max(0, parseInt(maxBookings, 10));

    // Check count of active bookings scheduled on this specific date
    const checkBookings = await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .input('SpecificDate', sql.NVarChar(50), specificDate)
        .query(`
            SELECT COUNT(*) AS activeCount
            FROM dbo.Bookings b
            WHERE b.ProviderID = @ProviderID
              AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
              AND (
                  ISNULL(b.ServiceStartDate, b.EventDate) <= @SpecificDate 
                  AND ISNULL(b.ServiceEndDate, b.EventDate) >= @SpecificDate
              );
        `);

    const activeCount = (checkBookings.recordset && checkBookings.recordset[0]) ? (checkBookings.recordset[0].activeCount || 0) : 0;

    if (capacityVal < activeCount) {
        const error = new Error(`Cannot set capacity to ${capacityVal}. You already have ${activeCount} booking(s) scheduled on ${specificDate}. Minimum allowed capacity is ${activeCount}.`);
        error.statusCode = 400;
        throw error;
    }

    const result = await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .input('SpecificDate', sql.NVarChar(50), specificDate)
        .input('MaxBookings', sql.Int, capacityVal)
        .input('Notes', sql.NVarChar(255), notes || '')
        .query(`
            IF EXISTS (SELECT 1 FROM dbo.ProviderDateCapacity WHERE ProviderID = @ProviderID AND SpecificDate = @SpecificDate)
            BEGIN
                UPDATE dbo.ProviderDateCapacity
                SET MaxBookings = @MaxBookings, Notes = @Notes, UpdatedAt = GETDATE()
                OUTPUT INSERTED.*
                WHERE ProviderID = @ProviderID AND SpecificDate = @SpecificDate;
            END
            ELSE
            BEGIN
                INSERT INTO dbo.ProviderDateCapacity (ProviderID, SpecificDate, MaxBookings, Notes, CreatedAt, UpdatedAt)
                OUTPUT INSERTED.*
                VALUES (@ProviderID, @SpecificDate, @MaxBookings, @Notes, GETDATE(), GETDATE());
            END
        `);

    return result.recordset[0];
};

/**
 * Delete Specific Date Capacity Override (reverts to default capacity)
 */
const deleteProviderDateCapacity = async (providerUserIdOrProviderId, specificDate) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const { providerId, defaultCapacity } = await resolveProviderId(pool, providerUserIdOrProviderId);

    // Verify default capacity is not less than active bookings on this date
    const checkBookings = await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .input('SpecificDate', sql.NVarChar(50), specificDate)
        .query(`
            SELECT COUNT(*) AS activeCount
            FROM dbo.Bookings b
            WHERE b.ProviderID = @ProviderID
              AND ISNULL(b.BookingStatus, '') NOT IN ('Cancelled', 'Rejected')
              AND (
                  ISNULL(b.ServiceStartDate, b.EventDate) <= @SpecificDate 
                  AND ISNULL(b.ServiceEndDate, b.EventDate) >= @SpecificDate
              );
        `);

    const activeCount = (checkBookings.recordset && checkBookings.recordset[0]) ? (checkBookings.recordset[0].activeCount || 0) : 0;

    if (defaultCapacity < activeCount) {
        const error = new Error(`Cannot reset to default daily limit (${defaultCapacity}) because ${activeCount} booking(s) are already scheduled on ${specificDate}. Minimum allowed capacity is ${activeCount}.`);
        error.statusCode = 400;
        throw error;
    }

    await pool.request()
        .input('ProviderID', sql.Int, providerId)
        .input('SpecificDate', sql.NVarChar(50), specificDate)
        .query(`DELETE FROM dbo.ProviderDateCapacity WHERE ProviderID = @ProviderID AND SpecificDate = @SpecificDate;`);

    return { success: true };
};

/**
 * Bulk Set Provider Date Capacity for All Dates / Range / Month / Days of Week
 */
const setBatchProviderDateCapacity = async (providerUserIdOrProviderId, { dates = [], maxBookings = 1, notes = null }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const { providerId } = await resolveProviderId(pool, providerUserIdOrProviderId);
    const capacityVal = Math.max(0, parseInt(maxBookings, 10));

    if (!Array.isArray(dates) || dates.length === 0) {
        throw new Error('No valid dates provided for bulk update.');
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        for (const d of dates) {
            const req = transaction.request()
                .input('ProviderID', sql.Int, providerId)
                .input('SpecificDate', sql.NVarChar(50), d)
                .input('MaxBookings', sql.Int, capacityVal)
                .input('Notes', sql.NVarChar(255), notes || 'Bulk updated capacity');

            await req.query(`
                IF EXISTS (SELECT 1 FROM dbo.ProviderDateCapacity WHERE ProviderID = @ProviderID AND SpecificDate = @SpecificDate)
                BEGIN
                    UPDATE dbo.ProviderDateCapacity
                    SET MaxBookings = @MaxBookings, Notes = @Notes, UpdatedAt = GETDATE()
                    WHERE ProviderID = @ProviderID AND SpecificDate = @SpecificDate;
                END
                ELSE
                BEGIN
                    INSERT INTO dbo.ProviderDateCapacity (ProviderID, SpecificDate, MaxBookings, Notes, CreatedAt, UpdatedAt)
                    VALUES (@ProviderID, @SpecificDate, @MaxBookings, @Notes, GETDATE(), GETDATE());
                END
            `);
        }

        await transaction.commit();
        return { updatedCount: dates.length, maxBookings: capacityVal };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

/**
 * Clear All Specific Date Capacity Overrides for a provider
 */
const clearAllProviderDateCapacities = async (providerUserIdOrProviderId, { month = null, year = null } = {}) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const { providerId } = await resolveProviderId(pool, providerUserIdOrProviderId);

    const req = pool.request().input('ProviderID', sql.Int, providerId);

    if (month && year) {
        const mm = String(month).padStart(2, '0');
        const pattern = `${year}-${mm}-%`;
        req.input('Pattern', sql.NVarChar(50), pattern);
        await req.query(`DELETE FROM dbo.ProviderDateCapacity WHERE ProviderID = @ProviderID AND SpecificDate LIKE @Pattern;`);
    } else {
        await req.query(`DELETE FROM dbo.ProviderDateCapacity WHERE ProviderID = @ProviderID;`);
    }

    return { success: true };
};

/**
 * Get active distance-based transportation fee tiers from database
 */
const getTransportationFees = async () => {
    const pool = getPool();
    if (!pool) return [];

    try {
        const res = await pool.request().query(`
            SELECT FeeID, MinDistanceKm, MaxDistanceKm, ServiceFee, RatePerKm, IsActive
            FROM dbo.TransportationFees
            WHERE IsActive = 1
            ORDER BY MinDistanceKm ASC;
        `);
        return res.recordset || [];
    } catch (err) {
        console.warn('Query dbo.TransportationFees notice:', err.message);
        return [
            { FeeID: 1, MinDistanceKm: 0.00, MaxDistanceKm: 10.00, ServiceFee: 200.00, RatePerKm: 20.00, IsActive: 1 },
            { FeeID: 2, MinDistanceKm: 10.01, MaxDistanceKm: 20.00, ServiceFee: 400.00, RatePerKm: 20.00, IsActive: 1 },
            { FeeID: 3, MinDistanceKm: 20.01, MaxDistanceKm: 30.00, ServiceFee: 600.00, RatePerKm: 20.00, IsActive: 1 },
            { FeeID: 4, MinDistanceKm: 30.01, MaxDistanceKm: 40.00, ServiceFee: 800.00, RatePerKm: 20.00, IsActive: 1 },
            { FeeID: 5, MinDistanceKm: 40.01, MaxDistanceKm: 50.00, ServiceFee: 1000.00, RatePerKm: 20.00, IsActive: 1 },
            { FeeID: 6, MinDistanceKm: 50.01, MaxDistanceKm: 999.00, ServiceFee: 2000.00, RatePerKm: 20.00, IsActive: 1 }
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
            .input('ClientName', sql.NVarChar(150), bookingData.clientName || null)
            .input('ClientPhone', sql.NVarChar(50), bookingData.clientPhone || null)
            .input('ClientEmail', sql.NVarChar(150), bookingData.clientEmail || null)
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
            (BookingReference, ClientUserID, ClientName, ClientPhone, ClientEmail, ProviderID, PackageID, PackageName, EventName, EventType, EventDate, ServiceStartDate, ServiceEndDate, ServiceHireDays, StartTime, EndTime, NumberOfHours, NumberOfDays, EventPlace, VenueName, EventAddress, EventLatitude, EventLongitude, LocationNotes, Location, PackagePrice, AdditionalDayCharges, TransportationFee, DistanceKm, TotalAmount, PaymentType, AmountPaid, RemainingBalance, CommissionRate, CommissionAmount, ProviderEarnings, BookingStatus, PaymentStatus, CreatedAt)
            OUTPUT INSERTED.*
            VALUES
            (@BookingReference, @ClientUserID, @ClientName, @ClientPhone, @ClientEmail, @ProviderID, @PackageID, @PackageName, @EventName, @EventType, @EventDate, @ServiceStartDate, @ServiceEndDate, @ServiceHireDays, @StartTime, @EndTime, @NumberOfHours, @NumberOfDays, @EventPlace, @VenueName, @EventAddress, @EventLatitude, @EventLongitude, @LocationNotes, @Location, @PackagePrice, @AdditionalDayCharges, @TransportationFee, @DistanceKm, @TotalAmount, @PaymentType, @AmountPaid, @RemainingBalance, @CommissionRate, @CommissionAmount, @ProviderEarnings, @BookingStatus, @PaymentStatus, GETDATE());
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
const BOOKING_SELECT_FIELDS = `
    b.BookingID,
    b.BookingReference,
    b.ClientUserID,
    b.ProviderID,
    b.PackageID,
    b.PackageName,
    b.EventName,
    b.EventType,
    b.EventDate,
    b.ServiceStartDate,
    b.ServiceEndDate,
    b.ServiceHireDays,
    b.StartTime,
    b.EndTime,
    b.NumberOfHours,
    b.NumberOfDays,
    b.EventPlace,
    b.VenueName,
    b.EventAddress,
    b.EventLatitude,
    b.EventLongitude,
    b.LocationNotes,
    b.Location,
    b.PackagePrice,
    b.AdditionalDayCharges,
    b.TransportationFee,
    b.DistanceKm,
    b.TotalAmount,
    b.PaymentType,
    b.AmountPaid,
    b.RemainingBalance,
    b.CommissionRate,
    b.CommissionAmount,
    b.ProviderEarnings,
    b.BookingStatus,
    b.PaymentStatus,
    b.EscrowStatus,
    b.CompletionRequestedAt,
    b.CompletionAcceptedAt,
    b.CreatedAt,
    b.UpdatedAt
`;

const getBookingById = async (bookingId) => {
    const pool = getPool();
    if (!pool) return null;

    const result = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
            SELECT 
                ${BOOKING_SELECT_FIELDS},
                sp.BusinessName AS ProviderName,
                sp.OwnerName AS ProviderOwnerName,
                sp.ProfilePicture AS ProviderAvatar,
                sp.CoverageArea AS ProviderCoverage,
                u.Email AS ProviderEmail,
                u.Phone AS ProviderPhone,
                r.ReviewID,
                r.Rating,
                r.ReviewText,
                (SELECT TOP 1 pr.ReportID FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID ORDER BY pr.ReportID DESC) AS ReportID,
                (SELECT TOP 1 pr.Status FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID ORDER BY pr.ReportID DESC) AS ReportStatus,
                (SELECT TOP 1 pr.Reason FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID ORDER BY pr.ReportID DESC) AS ReportReason,
                ISNULL(b.ClientEmail, cUser.Email) AS ClientEmail,
                ISNULL(b.ClientPhone, cUser.Phone) AS ClientPhone,
                ISNULL(b.ClientName, ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), cUser.Email)) AS ClientName
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users cUser ON b.ClientUserID = cUser.UserID
            LEFT JOIN dbo.Clients c ON cUser.UserID = c.UserID
            LEFT JOIN dbo.Reviews r ON b.BookingID = r.BookingID
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
                ${BOOKING_SELECT_FIELDS},
                sp.BusinessName AS ProviderName,
                sp.OwnerName AS ProviderOwnerName,
                sp.ProfilePicture AS ProviderAvatar,
                sp.CoverageArea AS ProviderCoverage,
                u.Email AS ProviderEmail,
                u.Phone AS ProviderPhone,
                r.ReviewID,
                r.Rating,
                r.ReviewText,
                (SELECT TOP 1 pr.ReportID FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID ORDER BY pr.ReportID DESC) AS ReportID,
                (SELECT TOP 1 pr.Status FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID ORDER BY pr.ReportID DESC) AS ReportStatus,
                (SELECT TOP 1 pr.Reason FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID ORDER BY pr.ReportID DESC) AS ReportReason,
                ISNULL(b.ClientEmail, cUser.Email) AS ClientEmail,
                ISNULL(b.ClientPhone, cUser.Phone) AS ClientPhone,
                ISNULL(b.ClientName, ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), cUser.Email)) AS ClientName
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users u ON sp.UserID = u.UserID
            LEFT JOIN dbo.Users cUser ON b.ClientUserID = cUser.UserID
            LEFT JOIN dbo.Clients c ON cUser.UserID = c.UserID
            LEFT JOIN dbo.Reviews r ON b.BookingID = r.BookingID
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
                ${BOOKING_SELECT_FIELDS},
                sp.BusinessName AS ProviderName,
                sp.ProfilePicture AS ProviderAvatar,
                r.ReviewID,
                r.Rating,
                r.ReviewText,
                (SELECT TOP 1 pr.ReportID FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID AND pr.ReporterUserID = b.ClientUserID ORDER BY pr.ReportID DESC) AS ReportID,
                (SELECT TOP 1 pr.Status FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID AND pr.ReporterUserID = b.ClientUserID ORDER BY pr.ReportID DESC) AS ReportStatus,
                (SELECT TOP 1 pr.Reason FROM dbo.ProviderReports pr WHERE pr.BookingID = b.BookingID AND pr.ReporterUserID = b.ClientUserID ORDER BY pr.ReportID DESC) AS ReportReason,
                ISNULL(b.ClientName, ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), cUser.Email)) AS ClientName,
                ISNULL(b.ClientEmail, cUser.Email) AS ClientEmail,
                ISNULL(b.ClientPhone, cUser.Phone) AS ClientPhone
            FROM dbo.Bookings b
            LEFT JOIN dbo.ServiceProviders sp ON b.ProviderID = sp.ProviderID
            LEFT JOIN dbo.Users cUser ON b.ClientUserID = cUser.UserID
            LEFT JOIN dbo.Clients c ON cUser.UserID = c.UserID
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
                ${BOOKING_SELECT_FIELDS},
                ISNULL(b.ClientName, ISNULL(NULLIF(LTRIM(RTRIM(CONCAT(c.FirstName, ' ', c.LastName))), ''), u.Email)) AS ClientName,
                ISNULL(b.ClientPhone, u.Phone) AS ClientPhone,
                ISNULL(b.ClientEmail, u.Email) AS ClientEmail,
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

    let resolvedProviderId = providerId;
    if (bookingId && !resolvedProviderId) {
        try {
            const bkRes = await pool.request()
                .input('BID', sql.Int, bookingId)
                .query(`SELECT ProviderID FROM dbo.Bookings WHERE BookingID = @BID`);
            if (bkRes.recordset && bkRes.recordset.length > 0) {
                resolvedProviderId = bkRes.recordset[0].ProviderID;
            }
        } catch (e) {}
    }

    const result = await pool.request()
        .input('BookingID', sql.Int, bookingId || null)
        .input('UserID', sql.Int, userId)
        .input('ProviderID', sql.Int, resolvedProviderId || null)
        .input('Rating', sql.Int, rating || 5)
        .input('ReviewText', sql.NVarChar(1000), reviewText.trim())
        .query(`
            IF @BookingID IS NOT NULL AND EXISTS (SELECT 1 FROM dbo.Reviews WHERE BookingID = @BookingID)
            BEGIN
                UPDATE dbo.Reviews
                SET Rating = @Rating,
                    ReviewText = @ReviewText,
                    ProviderID = ISNULL(@ProviderID, ProviderID),
                    SubmittedAt = GETDATE()
                OUTPUT INSERTED.ReviewID, INSERTED.BookingID, INSERTED.UserID, INSERTED.Rating, INSERTED.ReviewText, INSERTED.SubmittedAt
                WHERE BookingID = @BookingID;
            END
            ELSE
            BEGIN
                INSERT INTO dbo.Reviews
                (BookingID, UserID, ProviderID, Rating, ReviewText)
                OUTPUT INSERTED.ReviewID, INSERTED.BookingID, INSERTED.UserID, INSERTED.Rating, INSERTED.ReviewText, INSERTED.SubmittedAt
                VALUES
                (@BookingID, @UserID, @ProviderID, @Rating, @ReviewText);
            END
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

/**
 * Cancel a booking by client within the 3-hour grace window
 */
const cancelBookingByClient = async ({ bookingId, clientUserId, reason }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database pool not available.');

    const bkRes = await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`SELECT * FROM dbo.Bookings WHERE BookingID = @BookingID;`);

    const booking = bkRes.recordset[0];
    if (!booking) {
        return { success: false, code: 'NOT_FOUND', message: 'Booking not found.' };
    }

    // Verify ownership if clientUserId is provided
    if (clientUserId && booking.ClientUserID && parseInt(booking.ClientUserID, 10) !== parseInt(clientUserId, 10)) {
        return { success: false, code: 'FORBIDDEN', message: 'You are not authorized to cancel this booking.' };
    }

    if (booking.BookingStatus === 'Cancelled') {
        return { success: false, code: 'ALREADY_CANCELLED', message: 'This booking has already been cancelled.' };
    }

    if (booking.BookingStatus === 'Completed') {
        return { success: false, code: 'COMPLETED', message: 'Completed event bookings cannot be cancelled.' };
    }

    // Cancellation Policy Evaluation:
    // 1. Bookings made 2 or more days before event: Can cancel up to 1 day before the event.
    // 2. Same-day / short-notice bookings: Can cancel within 1 hour of making the reservation.
    const createdAtTime = new Date(booking.CreatedAt);
    const nowTime = new Date();
    const eventDateRaw = booking.EventDate || booking.ServiceStartDate;

    let canCancel = false;
    let policyMessage = '';

    if (eventDateRaw) {
        let eventMidnight;
        const match = String(eventDateRaw).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) {
            eventMidnight = new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10), 0, 0, 0);
        } else {
            const parsed = new Date(eventDateRaw);
            eventMidnight = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0);
        }

        const createdMidnight = new Date(createdAtTime.getFullYear(), createdAtTime.getMonth(), createdAtTime.getDate(), 0, 0, 0);
        const daysBetweenBookingAndEvent = Math.round((eventMidnight.getTime() - createdMidnight.getTime()) / (1000 * 60 * 60 * 24));

        if (daysBetweenBookingAndEvent >= 2) {
            // Bookings made 2 or more days before event: Can cancel up to 1 day before the event
            // Cutoff is event day start (i.e. up to 23:59:59 of day before event)
            const cutoffTime = eventMidnight.getTime();
            if (nowTime.getTime() < cutoffTime) {
                canCancel = true;
            } else {
                const oneDayBefore = new Date(cutoffTime - (24 * 60 * 60 * 1000));
                const deadlineFormatted = oneDayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                policyMessage = `Cancellation closed. Bookings made in advance can only be cancelled up to 1 day before the event (${deadlineFormatted}).`;
            }
        } else {
            // Same-day / short-notice bookings: Can cancel within 1 hour of making the reservation
            const elapsedMinutes = Math.max(0, (nowTime.getTime() - createdAtTime.getTime()) / (1000 * 60));
            const maxAllowedMinutes = 60; // 1 hour
            if (elapsedMinutes <= maxAllowedMinutes) {
                canCancel = true;
            } else {
                policyMessage = `Cancellation window expired. Same-day bookings can only be cancelled within 1 hour of reservation (${Math.round(elapsedMinutes)} minutes have passed).`;
            }
        }
    } else {
        // Fallback if event date is missing: Allow within 1 hour
        const elapsedMinutes = Math.max(0, (nowTime.getTime() - createdAtTime.getTime()) / (1000 * 60));
        if (elapsedMinutes <= 60) {
            canCancel = true;
        } else {
            policyMessage = 'Cancellation window expired. Bookings can only be cancelled within 1 hour of reservation.';
        }
    }

    if (!canCancel) {
        return {
            success: false,
            code: 'TIME_LIMIT_EXCEEDED',
            expired: true,
            message: policyMessage || 'Cancellation window has expired for this booking.'
        };
    }

    // Update status to Cancelled
    await pool.request()
        .input('BookingID', sql.Int, bookingId)
        .query(`
            UPDATE dbo.Bookings 
            SET BookingStatus = 'Cancelled', UpdatedAt = GETDATE()
            WHERE BookingID = @BookingID;
        `);

    // Automatic Refund Credit to Client Wallet if client had paid downpayment/full
    const refundAmount = parseFloat(booking.AmountPaid || 0);
    let refundResult = null;
    if (refundAmount > 0 && booking.ClientUserID) {
        try {
            const walletService = require('../services/walletService');
            refundResult = await walletService.creditWalletForRefund({
                userId: booking.ClientUserID,
                amount: refundAmount,
                bookingId: booking.BookingID,
                bookingReference: booking.BookingReference,
                reason: `Automatic refund for booking cancelled by client (${booking.PackageName || 'Event Service'})`
            });

            // Update booking payment status to Refunded and clear remaining balance
            await pool.request()
                .input('BookingID', sql.Int, bookingId)
                .query(`
                    UPDATE dbo.Bookings 
                    SET PaymentStatus = 'Refunded', RemainingBalance = 0, UpdatedAt = GETDATE()
                    WHERE BookingID = @BookingID;
                `);
        } catch (rfErr) {
            console.error('Wallet refund on client cancel notice:', rfErr);
        }
    }

    return {
        success: true,
        message: refundAmount > 0 
            ? `Booking cancelled. A refund of ₱${refundAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been automatically credited to your Wallet!` 
            : 'Booking successfully cancelled.',
        bookingId,
        cancelledAt: new Date(),
        reason: reason || 'Cancelled by client',
        refundAmount,
        walletCredited: !!(refundResult && refundResult.credited)
    };
};

/**
 * Settle the remaining balance of a booking
 * Sets AmountPaid to TotalAmount, RemainingBalance to 0, PaymentStatus to 'Paid'
 */
const settleRemainingBalance = async ({ bookingId, bookingReference, amount, paymentMethod, transactionReference }) => {
    const pool = getPool();
    if (!pool) throw new Error('Database connection pool not available.');

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
        let req = transaction.request();
        let queryStr = `SELECT BookingID, BookingReference, TotalAmount, AmountPaid, RemainingBalance, PaymentStatus FROM dbo.Bookings WHERE `;
        if (bookingId) {
            req.input('BookingID', sql.Int, bookingId);
            queryStr += `BookingID = @BookingID;`;
        } else if (bookingReference) {
            req.input('BookingReference', sql.NVarChar(50), bookingReference);
            queryStr += `BookingReference = @BookingReference;`;
        } else {
            throw new Error('BookingID or BookingReference is required.');
        }

        const bRes = await req.query(queryStr);
        if (!bRes.recordset || bRes.recordset.length === 0) {
            await transaction.rollback();
            return { success: false, message: 'Booking not found.' };
        }

        const booking = bRes.recordset[0];
        const total = parseFloat(booking.TotalAmount || 0);
        const currentPaid = parseFloat(booking.AmountPaid || 0);
        const currentRemaining = parseFloat(booking.RemainingBalance !== undefined && booking.RemainingBalance !== null ? booking.RemainingBalance : (total - currentPaid));
        const paymentAmount = amount !== undefined && amount !== null && parseFloat(amount) > 0 ? parseFloat(amount) : currentRemaining;

        const newAmountPaid = Math.min(total, currentPaid + paymentAmount);
        const newRemaining = Math.max(0, total - newAmountPaid);
        const newPaymentStatus = newRemaining <= 0 ? 'Paid' : 'Partial';

        const updateReq = transaction.request()
            .input('BID', sql.Int, booking.BookingID)
            .input('AmountPaid', sql.Decimal(18, 2), newAmountPaid)
            .input('RemainingBalance', sql.Decimal(18, 2), newRemaining)
            .input('PaymentStatus', sql.NVarChar(30), newPaymentStatus)
            .input('PaymentType', sql.NVarChar(30), newRemaining <= 0 ? 'full' : 'downpayment');

        await updateReq.query(`
            UPDATE dbo.Bookings
            SET AmountPaid = @AmountPaid,
                RemainingBalance = @RemainingBalance,
                PaymentStatus = @PaymentStatus,
                PaymentType = @PaymentType,
                UpdatedAt = GETDATE()
            WHERE BookingID = @BID;
        `);

        // Insert payment record into dbo.Payments
        const payReq = transaction.request()
            .input('BID', sql.Int, booking.BookingID)
            .input('Amount', sql.Decimal(18, 2), paymentAmount)
            .input('PaymentMethod', sql.NVarChar(50), paymentMethod || 'PayMongo')
            .input('PaymentStatus', sql.NVarChar(20), 'Paid')
            .input('TransactionReference', sql.NVarChar(100), transactionReference || `BAL-${booking.BookingReference}-${Date.now()}`);

        await payReq.query(`
            INSERT INTO dbo.Payments
            (BookingID, Amount, PaymentMethod, PaymentStatus, TransactionReference, PaidAt, CreatedAt)
            VALUES
            (@BID, @Amount, @PaymentMethod, @PaymentStatus, @TransactionReference, GETDATE(), GETDATE());
        `);

        await transaction.commit();

        return {
            success: true,
            message: 'Booking balance settled successfully. Status updated to Paid.',
            bookingId: booking.BookingID,
            bookingReference: booking.BookingReference,
            totalAmount: total,
            amountPaid: newAmountPaid,
            remainingBalance: newRemaining,
            paymentStatus: newPaymentStatus
        };
    } catch (err) {
        await transaction.rollback();
        throw err;
    }
};

module.exports = {
    checkProviderAvailability,
    getProviderAvailabilitySlots,
    getProviderCalendarSchedule,
    updateProviderDefaultCapacity,
    setProviderDateCapacity,
    deleteProviderDateCapacity,
    setBatchProviderDateCapacity,
    clearAllProviderDateCapacities,
    getTransportationFees,
    generateBookingReference,
    createBookingWithTransaction,
    getBookingById,
    getBookingByReference,
    getBookingsByUserId,
    getBookingsByProviderUserId,
    createReview,
    getReviewsByUserId,
    resolveProviderId,
    cancelBookingByClient,
    settleRemainingBalance
};
