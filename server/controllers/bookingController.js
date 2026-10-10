/**
 * SoundSphere - Booking & Review API Controller
 * Handles POST /api/bookings, GET /api/bookings/my-bookings, POST /api/bookings/check-availability, etc.
 * DBMS: Microsoft SQL Server Management Studio (SSMS)
 */

const bookingModel = require('../models/bookingModel');
const paymentModel = require('../models/paymentModel');
const notificationModel = require('../models/notificationModel');
const paymongoService = require('../services/paymongoService');
const { getPool, sql } = require('../config/db');

/**
 * GET /api/packages/:id
 * Retrieve specific Package details directly from SQL Server Database
 */
const getPackageById = async (req, res) => {
    try {
        const packageId = parseInt(req.params.id, 10);
        if (!packageId) {
            return res.status(400).json({ success: false, message: 'Valid Package ID is required.' });
        }

        const pool = getPool();
        const pkgRes = await pool.request()
            .input('PackageID', sql.Int, packageId)
            .query(`
                SELECT 
                    p.PackageID,
                    p.UserID AS ProviderUserID,
                    p.PackageName,
                    p.Price,
                    COALESCE(p.AdditionalDayPercentage, 20.00) AS AdditionalDayPercentage,
                    p.Category,
                    p.Description,
                    p.Inclusions,
                    p.IsActive,
                    p.CreatedAt,
                    sp.ProviderID,
                    sp.BusinessName AS ProviderName,
                    sp.OwnerName AS ProviderOwnerName,
                    sp.ProfilePicture AS ProviderAvatar,
                    sp.BusinessAddress AS ProviderBusinessAddress,
                    sp.Latitude AS ProviderLatitude,
                    sp.Longitude AS ProviderLongitude,
                    COALESCE(sp.CoverageArea, 'Lian, Balayan, Nasugbu') AS CoverageArea,
                    sp.Description AS ProviderDescription,
                    u.Email AS ProviderEmail,
                    u.Phone AS ProviderPhone
                FROM dbo.Packages p
                LEFT JOIN dbo.ServiceProviders sp ON p.UserID = sp.UserID
                LEFT JOIN dbo.Users u ON p.UserID = u.UserID
                WHERE p.PackageID = @PackageID AND p.IsActive = 1;
            `);

        if (!pkgRes.recordset || pkgRes.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Package not found or inactive.' });
        }

        const pkgData = pkgRes.recordset[0];

        // Fetch package images
        const imgRes = await pool.request()
            .input('PackageID', sql.Int, packageId)
            .query(`
                SELECT ImageID, ImageUrl FROM dbo.PackageImages
                WHERE PackageID = @PackageID
                ORDER BY ImageID ASC;
            `);

        pkgData.images = (imgRes.recordset || []).map(img => ({
            id: img.ImageID,
            url: img.ImageUrl
        }));

        pkgData.inclusionsList = pkgData.Inclusions ? pkgData.Inclusions.split(',').map(s => s.trim()).filter(Boolean) : [];
        pkgData.priceFormatted = parseFloat(pkgData.Price || 0).toLocaleString();

        return res.status(200).json({
            success: true,
            package: pkgData
        });
    } catch (error) {
        console.error('Get Package By ID Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load package details.', error: error.message });
    }
};

/**
 * GET /api/bookings/transportation-fees
 * Get active distance-based transportation fee tiers
 */
const getTransportationFees = async (req, res) => {
    try {
        const fees = await bookingModel.getTransportationFees();
        return res.status(200).json({ success: true, fees });
    } catch (error) {
        console.error('Get Transportation Fees Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve transportation fees.', error: error.message });
    }
};

/**
 * POST /api/bookings/check-availability
 * Check provider schedule availability for requested date & times
 */
const checkAvailability = async (req, res) => {
    try {
        const { providerId, serviceStartDate, serviceEndDate, eventDate, startTime, endTime, excludeBookingId } = req.body;

        const startDate = serviceStartDate || eventDate;
        const endDate = serviceEndDate || eventDate;

        if (!providerId || !startDate || !startTime || !endTime) {
            return res.status(400).json({
                success: false,
                message: 'Provider ID, Service Dates, Start Time, and End Time are required.'
            });
        }

        const result = await bookingModel.checkProviderAvailability({
            providerId: parseInt(providerId, 10),
            serviceStartDate: startDate,
            serviceEndDate: endDate,
            eventDate: startDate,
            startTime,
            endTime,
            excludeBookingId: excludeBookingId ? parseInt(excludeBookingId, 10) : null
        });

        if (!result.isAvailable) {
            return res.status(200).json({
                success: true,
                isAvailable: false,
                message: 'This provider is not available for the selected dates. Please select another schedule.',
                conflictingBookings: result.conflictingBookings
            });
        }

        return res.status(200).json({
            success: true,
            isAvailable: true,
            message: 'Provider is available for the selected dates schedule.'
        });
    } catch (error) {
        console.error('Check Availability Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to check availability.', error: error.message });
    }
};

/**
 * GET /api/providers/:id/availability
 * Get all booked schedule slots and capacity rules for a provider (for calendar blackout)
 */
const getProviderAvailability = async (req, res) => {
    try {
        const providerId = parseInt(req.params.id, 10);
        if (!providerId) {
            return res.status(400).json({ success: false, message: 'Valid Provider ID is required.' });
        }

        const availData = await bookingModel.getProviderAvailabilitySlots(providerId);

        return res.status(200).json({
            success: true,
            providerId,
            bookedSlots: availData.slots || [],
            dateCapacities: availData.dateCapacities || [],
            defaultMaxDailyBookings: availData.defaultMaxDailyBookings || 1
        });
    } catch (error) {
        console.error('Get Provider Availability Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve provider availability.', error: error.message });
    }
};

/**
 * GET /api/providers/calendar/schedule
 * Full calendar schedule, custom capacities, and booking details for provider dashboard
 */
const getProviderCalendarSchedule = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.query.userId || 13);
        const data = await bookingModel.getProviderCalendarSchedule(userId);
        return res.status(200).json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error('Get Provider Calendar Schedule Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to load calendar schedule.', error: error.message });
    }
};

/**
 * PUT /api/providers/calendar/default-capacity
 * Set Default Daily Booking Limit (e.g. 1, 2, 3...)
 */
const saveDefaultDailyCapacity = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        const { maxDailyBookings } = req.body;
        if (!maxDailyBookings || parseInt(maxDailyBookings, 10) < 1) {
            return res.status(400).json({ success: false, message: 'Max daily bookings must be at least 1.' });
        }
        const updated = await bookingModel.updateProviderDefaultCapacity(userId, maxDailyBookings);
        return res.status(200).json({
            success: true,
            message: `Default daily booking limit updated to ${maxDailyBookings} booking(s) per day.`,
            data: updated
        });
    } catch (error) {
        console.error('Save Default Daily Capacity Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update default daily capacity.', error: error.message });
    }
};

/**
 * POST /api/providers/calendar/date-capacity
 * Set Custom Capacity Override for a specific date (0 = Blocked, 1, 2, 3...)
 */
const saveDateCapacityOverride = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        const { specificDate, maxBookings, notes } = req.body;
        if (!specificDate) {
            return res.status(400).json({ success: false, message: 'Specific date (YYYY-MM-DD) is required.' });
        }
        if (maxBookings === undefined || maxBookings === null || parseInt(maxBookings, 10) < 0) {
            return res.status(400).json({ success: false, message: 'Valid capacity (0 for blocked, or positive number) is required.' });
        }
        const result = await bookingModel.setProviderDateCapacity(userId, specificDate, maxBookings, notes);
        return res.status(200).json({
            success: true,
            message: parseInt(maxBookings, 10) === 0 ? `Date ${specificDate} is now BLOCKED from bookings.` : `Capacity for ${specificDate} set to ${maxBookings} booking(s).`,
            data: result
        });
    } catch (error) {
        console.error('Save Date Capacity Override Error:', error);
        return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to update date capacity.' });
    }
};

/**
 * DELETE /api/providers/calendar/date-capacity/:date
 * Remove Custom Capacity Override for a specific date (revert to default)
 */
const deleteDateCapacityOverride = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        const { date } = req.params;
        if (!date) {
            return res.status(400).json({ success: false, message: 'Specific date is required.' });
        }
        await bookingModel.deleteProviderDateCapacity(userId, date);
        return res.status(200).json({
            success: true,
            message: `Custom capacity override for ${date} removed. Date now uses default daily limit.`
        });
    } catch (error) {
        console.error('Delete Date Capacity Override Error:', error);
        return res.status(error.statusCode || 400).json({ success: false, message: error.message || 'Failed to delete date capacity override.' });
    }
};

/**
 * POST /api/providers/calendar/batch-capacity
 * Set Custom Capacity for ALL dates, current month, date range, or weekend days
 */
const saveBatchDateCapacity = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        const { dates, startDate, endDate, month, year, maxBookings, notes, applyToMode, daysOfWeek } = req.body;

        let targetDates = [];

        if (Array.isArray(dates) && dates.length > 0) {
            targetDates = dates;
        } else if (applyToMode === 'month' && month !== undefined && year) {
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const totalDays = new Date(y, m + 1, 0).getDate();
            for (let d = 1; d <= totalDays; d++) {
                const mm = String(m + 1).padStart(2, '0');
                const dd = String(d).padStart(2, '0');
                targetDates.push(`${y}-${mm}-${dd}`);
            }
        } else if (applyToMode === 'range' && startDate && endDate) {
            let curr = new Date(startDate);
            const end = new Date(endDate);
            while (curr <= end) {
                const y = curr.getFullYear();
                const m = String(curr.getMonth() + 1).padStart(2, '0');
                const d = String(curr.getDate()).padStart(2, '0');
                targetDates.push(`${y}-${m}-${d}`);
                curr.setDate(curr.getDate() + 1);
            }
        } else if (applyToMode === 'all_year' && year) {
            const y = parseInt(year, 10);
            for (let m = 1; m <= 12; m++) {
                const totalDays = new Date(y, m, 0).getDate();
                for (let d = 1; d <= totalDays; d++) {
                    const mm = String(m).padStart(2, '0');
                    const dd = String(d).padStart(2, '0');
                    targetDates.push(`${y}-${mm}-${dd}`);
                }
            }
        } else if (applyToMode === 'all_upcoming') {
            const now = new Date();
            const y = now.getFullYear();
            const endY = y + 1;
            let curr = new Date(y, now.getMonth(), now.getDate());
            const end = new Date(endY, 11, 31);
            while (curr <= end) {
                const yr = curr.getFullYear();
                const m = String(curr.getMonth() + 1).padStart(2, '0');
                const d = String(curr.getDate()).padStart(2, '0');
                targetDates.push(`${yr}-${m}-${d}`);
                curr.setDate(curr.getDate() + 1);
            }
        }

        // Optional filter by days of week
        if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
            targetDates = targetDates.filter(dStr => {
                const parts = dStr.split('-');
                const dayObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                return daysOfWeek.includes(dayObj.getDay());
            });
        }

        if (targetDates.length === 0) {
            return res.status(400).json({ success: false, message: 'No valid dates selected for bulk capacity update.' });
        }

        const capacityVal = maxBookings !== undefined ? parseInt(maxBookings, 10) : 1;

        const result = await bookingModel.setBatchProviderDateCapacity(userId, {
            dates: targetDates,
            maxBookings: capacityVal,
            notes: notes || `Bulk capacity: ${capacityVal}`
        });

        return res.status(200).json({
            success: true,
            message: `Custom capacity of ${capacityVal} booking(s) applied to all ${result.updatedCount} date(s) successfully!`,
            data: result
        });
    } catch (error) {
        console.error('Save Batch Date Capacity Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to update batch capacity.', error: error.message });
    }
};

/**
 * DELETE /api/providers/calendar/batch-capacity
 * Clear all specific date capacity overrides (reverts all dates to default)
 */
const clearBatchDateCapacity = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 13);
        const { month, year } = req.query;
        await bookingModel.clearAllProviderDateCapacities(userId, { month, year });
        return res.status(200).json({
            success: true,
            message: month && year ? `All custom date capacities for ${month}/${year} cleared.` : 'All custom date capacities cleared. All dates now use default daily limit.'
        });
    } catch (error) {
        console.error('Clear Batch Date Capacity Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to clear custom capacities.', error: error.message });
    }
};

/**
 * POST /api/bookings
 * Create a new Client Booking with server-side validation & atomic SQL transaction
 */
const createBooking = async (req, res) => {
    try {
        const clientUserId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.clientUserId || 8);
        if (!clientUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Please login to submit a booking.' });
        }

        const {
            bookingReference,
            packageId,
            providerId,
            clientName,
            clientPhone,
            clientEmail,
            eventName,
            eventType,
            customEventType,
            serviceStartDate,
            serviceEndDate,
            serviceHireDays,
            eventDate,
            startTime,
            endTime,
            numberOfHours,
            numberOfDays,
            eventPlace,
            venueName,
            eventAddress,
            eventLatitude,
            eventLongitude,
            locationNotes,
            paymentType,
            paymentMethod,
            transactionReference
        } = req.body;

        const sDate = serviceStartDate || eventDate;
        const eDate = serviceEndDate || eventDate || sDate;

        // SERVER-SIDE VALIDATION
        if (!sDate || !startTime || !endTime) {
            return res.status(400).json({ success: false, message: 'Service Start Date, End Date, Start Time, and End Time are required.' });
        }

        const startObj = new Date(sDate);
        const endObj = new Date(eDate);
        if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid service date format.' });
        }

        if (endObj < startObj) {
            return res.status(400).json({ success: false, message: 'Service End Date cannot be earlier than Service Start Date.' });
        }

        const diffMs = Math.abs(endObj - startObj);
        const calculatedHireDays = parseInt(serviceHireDays || numberOfDays, 10) || (Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

        const finalEventType = eventType === 'Other' ? (customEventType || 'Other Event') : (eventType || 'Party');
        const finalPlace = eventPlace || 'Lian';

        // Allowed Municipalities Check
        const allowedPlaces = ['Lian', 'Balayan', 'Nasugbu'];
        if (!allowedPlaces.includes(finalPlace)) {
            return res.status(400).json({ success: false, message: `Invalid place '${finalPlace}'. Allowed locations: Lian, Balayan, Nasugbu.` });
        }

        // SERVER-SIDE PACKAGE PRICE LOOKUP (Do NOT trust frontend price!)
        const pool = getPool();
        let targetPkg = null;

        if (packageId) {
            const pkgRes = await pool.request().input('PackageID', sql.Int, parseInt(packageId, 10)).query(`
                SELECT p.*, sp.ProviderID FROM dbo.Packages p
                LEFT JOIN dbo.ServiceProviders sp ON p.UserID = sp.UserID
                WHERE p.PackageID = @PackageID AND p.IsActive = 1;
            `);
            if (pkgRes.recordset && pkgRes.recordset[0]) {
                targetPkg = pkgRes.recordset[0];
            }
        }

        let actualPackagePrice = targetPkg ? parseFloat(targetPkg.Price || 0) : parseFloat(req.body.totalAmount || req.body.packagePrice || 15000);
        let actualPackageName = targetPkg ? targetPkg.PackageName : (req.body.packageName || 'Audio & Light Package');
        let actualProviderId = providerId || (targetPkg ? targetPkg.ProviderID : 13);

        if (!actualProviderId && targetPkg?.UserID) {
            const provRes = await pool.request().input('UserID', sql.Int, targetPkg.UserID).query(`
                SELECT ProviderID FROM dbo.ServiceProviders WHERE UserID = @UserID;
            `);
            if (provRes.recordset && provRes.recordset[0]) {
                actualProviderId = provRes.recordset[0].ProviderID;
            }
        }

        // Prevent Self-Booking Guard
        if (actualProviderId) {
            const provCheck = await pool.request().input('ProviderID', sql.Int, actualProviderId).query(`
                SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID;
            `);
            if (provCheck.recordset && provCheck.recordset[0]?.UserID === clientUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'This is your own service. You cannot book your own packages.'
                });
            }
        }

        // SERVER-SIDE OVERLAP AVAILABILITY CHECK (Before creating booking)
        const availability = await bookingModel.checkProviderAvailability({
            providerId: actualProviderId,
            serviceStartDate: sDate,
            serviceEndDate: eDate,
            eventDate: sDate,
            startTime,
            endTime
        });

        if (!availability.isAvailable) {
            return res.status(409).json({
                success: false,
                message: 'This provider is not available for the selected dates. Please select another schedule.'
            });
        }

        // SERVER-SIDE DYNAMIC PRICING CALCULATIONS
        const addDayPct = targetPkg ? parseFloat(targetPkg.AdditionalDayPercentage || 20.00) : 20.00;
        const additionalDayRate = actualPackagePrice * (addDayPct / 100);
        const additionalDayCharges = calculatedHireDays > 1 ? Math.round(additionalDayRate * (calculatedHireDays - 1)) : 0;

        const reqTransportFee = parseFloat(req.body.transportationFee);
        const reqDistanceKm = parseFloat(req.body.distanceKm);

        const transportationFee = !isNaN(reqTransportFee) ? reqTransportFee : 1000.00;
        const distanceKm = !isNaN(reqDistanceKm) ? reqDistanceKm : 15.0;

        // Total Booking Price Formula: Package Price + Additional Day Charges + Transportation Fee
        const totalAmount = actualPackagePrice + additionalDayCharges + transportationFee;

        const selectedPaymentType = (paymentType === 'full' || paymentType === 'Full Payment') ? 'full' : 'downpayment';
        let amountPaid = 0;
        let remainingBalance = 0;

        if (selectedPaymentType === 'downpayment') {
            amountPaid = Math.round(totalAmount * 0.5);
            remainingBalance = totalAmount - amountPaid;
        } else {
            amountPaid = totalAmount;
            remainingBalance = 0;
        }

        // CENTRALIZED 5% COMMISSION CALCULATION
        const commissionRate = 5.00; // 5%
        const commissionAmount = Math.round((totalAmount * 0.05) * 100) / 100;
        const providerEarnings = Math.round((totalAmount - commissionAmount) * 100) / 100;

        const bookingData = {
            bookingReference: bookingReference || null,
            clientUserId,
            clientName: clientName || null,
            clientPhone: clientPhone || null,
            clientEmail: clientEmail || null,
            providerId: actualProviderId,
            packageId: targetPkg ? targetPkg.PackageID : (packageId ? parseInt(packageId, 10) : null),
            packageName: actualPackageName,
            eventName: eventName || `${finalEventType} Celebration`,
            eventType: finalEventType,
            serviceStartDate: sDate,
            serviceEndDate: eDate,
            serviceHireDays: calculatedHireDays,
            eventDate: sDate,
            startTime,
            endTime,
            numberOfHours: 0,
            numberOfDays: calculatedHireDays,
            eventPlace: finalPlace,
            venueName: venueName || 'Private Event Venue',
            eventAddress: eventAddress || `${venueName || 'Venue'}, ${finalPlace}, Batangas`,
            eventLatitude: eventLatitude ? parseFloat(eventLatitude) : null,
            eventLongitude: eventLongitude ? parseFloat(eventLongitude) : null,
            locationNotes: locationNotes || null,
            location: `${venueName || 'Venue'}, ${finalPlace}`,
            packagePrice: actualPackagePrice,
            additionalDayCharges: additionalDayCharges,
            transportationFee: transportationFee,
            distanceKm: distanceKm,
            totalAmount: totalAmount,
            paymentType: selectedPaymentType,
            amountPaid: amountPaid,
            remainingBalance: remainingBalance,
            commissionRate: commissionRate,
            commissionAmount: commissionAmount,
            providerEarnings: providerEarnings,
            bookingStatus: 'Confirmed',
            paymentStatus: selectedPaymentType === 'downpayment' ? 'Partial' : 'Paid'
        };

        const selectedPaymentMethod = paymentMethod || 'PayMongo';

        const paymentData = {
            paymentType: selectedPaymentType,
            paymentMethod: selectedPaymentMethod,
            amount: amountPaid,
            transactionReference: transactionReference || null,
            paymentStatus: 'Paid'
        };

        // SQL TRANSACTION EXECUTION
        const newBooking = await bookingModel.createBookingWithTransaction(bookingData, paymentData);

        const bkId = newBooking.BookingID;
        const refCode = newBooking.BookingReference;

        // NOTIFICATION CREATION
        let notifClientName = clientName || 'A client';
        let providerUserId = null;

        try {
            if (!clientName) {
                const clientRes = await pool.request().input('UserID', sql.Int, clientUserId).query(`
                    SELECT ISNULL(NULLIF(c.FullName, ''), u.Email) AS Name FROM dbo.Users u LEFT JOIN dbo.Clients c ON u.UserID = c.UserID WHERE u.UserID = @UserID;
                `);
                if (clientRes.recordset && clientRes.recordset[0]) notifClientName = clientRes.recordset[0].Name;
            }

            if (actualProviderId) {
                const provRes = await pool.request().input('ProviderID', sql.Int, actualProviderId).query(`
                    SELECT UserID FROM dbo.ServiceProviders WHERE ProviderID = @ProviderID;
                `);
                if (provRes.recordset && provRes.recordset[0]) providerUserId = provRes.recordset[0].UserID;
            }
        } catch (err) {
            console.warn('Notification user lookup notice:', err.message);
        }

        // In-App Notification for Client
        await notificationModel.createNotification({
            userId: clientUserId,
            type: 'Booking',
            title: 'Booking Confirmed!',
            message: `Your booking reservation ${refCode} for ${actualPackageName} on ${eventDate} has been successfully confirmed.`,
            relatedId: bkId,
            relatedType: 'Booking'
        });

        // In-App Notification for Provider
        if (providerUserId) {
            await notificationModel.createNotification({
                userId: providerUserId,
                type: 'Booking',
                title: 'New Booking Received!',
                message: `${clientName} booked your package (${actualPackageName}) for ${eventDate} (${startTime} - ${endTime}).`,
                relatedId: bkId,
                relatedType: 'Booking'
            });
        }

        return res.status(201).json({
            success: true,
            message: '🎉 Booking reservation confirmed successfully!',
            booking: newBooking
        });

    } catch (error) {
        console.error('Create Booking Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process booking reservation.',
            error: error.message
        });
    }
};

/**
 * GET /api/bookings/:id
 * Retrieve single Booking confirmation details
 */
const getBookingDetails = async (req, res) => {
    try {
        const id = req.params.id;
        let booking = null;

        if (isNaN(id) && id.startsWith('SS-')) {
            booking = await bookingModel.getBookingByReference(id);
        } else {
            booking = await bookingModel.getBookingById(parseInt(id, 10));
        }

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found.' });
        }

        return res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        console.error('Get Booking Details Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve booking details.', error: error.message });
    }
};

/**
 * GET /api/client/bookings & GET /api/bookings/my-bookings
 */
const getMyBookings = async (req, res) => {
    try {
        const clientUserId = req.query.userId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);
        if (!clientUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. User ID not provided.' });
        }

        const bookings = await bookingModel.getBookingsByUserId(clientUserId);

        return res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get My Bookings Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve user bookings.', error: error.message });
    }
};

/**
 * GET /api/bookings/provider-bookings
 */
const getProviderBookings = async (req, res) => {
    try {
        const providerUserId = req.query.providerUserId || (req.user ? (req.user.userId || req.user.id || req.user.UserID) : null);
        if (!providerUserId) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Provider User ID not provided.' });
        }

        const bookings = await bookingModel.getBookingsByProviderUserId(providerUserId);

        return res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Get Provider Bookings Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve provider bookings.', error: error.message });
    }
};

/**
 * POST /api/payments
 */
const createPayment = async (req, res) => {
    try {
        const clientUserId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.clientUserId || 8);
        const { bookingId, providerId, packageId, paymentType, amount, transactionReference } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({ success: false, message: 'Booking ID and Amount are required.' });
        }

        const newPayment = await paymentModel.createPayment({
            bookingId: parseInt(bookingId, 10),
            clientUserId,
            providerId: parseInt(providerId, 10) || 13,
            packageId: packageId ? parseInt(packageId, 10) : null,
            paymentType: paymentType || 'downpayment',
            amount: parseFloat(amount),
            transactionReference: transactionReference || null,
            paymentStatus: 'Paid'
        });

        return res.status(201).json({
            success: true,
            message: 'Payment recorded successfully.',
            payment: newPayment
        });
    } catch (error) {
        console.error('Create Payment Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to record payment.', error: error.message });
    }
};

/**
 * GET /api/payments/:bookingId
 */
const getPaymentsByBookingId = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.bookingId, 10);
        const payments = await paymentModel.getPaymentsByBookingId(bookingId);
        return res.status(200).json({ success: true, payments });
    } catch (error) {
        console.error('Get Payments Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to retrieve payments.', error: error.message });
    }
};

/**
 * POST /api/reviews
 */
const submitReview = async (req, res) => {
    try {
        const userId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || 8);
        const { bookingId, providerId, rating, reviewText, comment, review } = req.body;

        const finalReviewText = (reviewText || comment || review || '').trim();
        if (!finalReviewText) {
            return res.status(400).json({ success: false, message: 'Review text is required.' });
        }

        let targetBookingId = (bookingId || req.body.booking_id || req.body.BookingID) ? parseInt(bookingId || req.body.booking_id || req.body.BookingID, 10) : null;
        let targetProviderId = (providerId || req.body.provider_id || req.body.ProviderID) ? parseInt(providerId || req.body.provider_id || req.body.ProviderID, 10) : null;
        const targetRating = parseInt(rating || req.body.Rating || req.body.stars, 10) || 5;

        // If no bookingId provided, attempt lookup of recent client booking with this provider
        if (!targetBookingId && targetProviderId) {
            try {
                const { getPool } = require('../config/db');
                const pool = getPool();
                const bRes = await pool.request()
                    .input('UID', userId)
                    .input('PID', targetProviderId)
                    .query(`SELECT TOP 1 BookingID FROM dbo.Bookings WHERE (ClientID = @UID) AND ProviderID = @PID ORDER BY BookingID DESC`);
                if (bRes.recordset && bRes.recordset.length > 0) {
                    targetBookingId = bRes.recordset[0].BookingID;
                }
            } catch (e) {
                console.warn('Booking ID lookup notice:', e.message);
            }
        }

        const newReview = await bookingModel.createReview({
            bookingId: targetBookingId,
            userId,
            providerId: targetProviderId,
            rating: targetRating,
            reviewText: finalReviewText
        });

        return res.status(201).json({ success: true, message: 'Review submitted successfully!', review: newReview });
    } catch (error) {
        console.error('Submit Review Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to submit review.', error: error.message });
    }
};

/**
 * POST /api/payments/paymongo/checkout
 * Create PayMongo Checkout Session for Card & E-Payment (GCash, Maya, QR PH, GrabPay)
 */
const createPayMongoCheckout = async (req, res) => {
    try {
        const { amount, packageName, bookingReference, paymentType, paymentMethod, clientEmail, clientName, clientPhone } = req.body;
        const originHost = `${req.protocol}://${req.get('host')}`;

        // Ensure official sequential booking reference is used
        const ref = bookingReference || await bookingModel.generateBookingReference();

        const sessionResult = await paymongoService.createCheckoutSession({
            amount: amount || 0,
            packageName: packageName || 'SoundSphere Event Package',
            bookingReference: ref,
            paymentType: paymentType || 'downpayment',
            paymentMethod: paymentMethod || 'all',
            clientEmail: clientEmail || (req.user ? req.user.email : ''),
            clientName: clientName || '',
            clientPhone: clientPhone || (req.user ? req.user.phone : ''),
            originHost
        });

        sessionResult.bookingReference = ref;

        return res.status(200).json(sessionResult);
    } catch (error) {
        console.error('Create PayMongo Checkout Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to initialize PayMongo checkout session.', error: error.message });
    }
};

/**
 * POST /api/bookings/:id/cancel
 * Handles client booking cancellation within 3-hour limit
 */
const cancelBooking = async (req, res) => {
    try {
        const bookingId = parseInt(req.params.id, 10);
        const clientUserId = req.user ? (req.user.userId || req.user.id || req.user.UserID) : (req.body.userId || req.body.clientUserId);
        const { reason } = req.body;

        if (!bookingId || isNaN(bookingId)) {
            return res.status(400).json({ success: false, message: 'Valid Booking ID is required.' });
        }

        const result = await bookingModel.cancelBookingByClient({
            bookingId,
            clientUserId,
            reason
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        return res.status(200).json(result);
    } catch (error) {
        console.error('Cancel Booking Controller Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to process cancellation.', error: error.message });
    }
};

module.exports = {
    getPackageById,
    getTransportationFees,
    checkAvailability,
    getProviderAvailability,
    getProviderCalendarSchedule,
    saveDefaultDailyCapacity,
    saveDateCapacityOverride,
    deleteDateCapacityOverride,
    saveBatchDateCapacity,
    clearBatchDateCapacity,
    createBooking,
    getBookingDetails,
    getMyBookings,
    getProviderBookings,
    createPayment,
    getPaymentsByBookingId,
    submitReview,
    createPayMongoCheckout,
    cancelBooking
};
