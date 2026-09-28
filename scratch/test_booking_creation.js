const bookingModel = require('../server/models/bookingModel');
const { connectDB } = require('../server/config/db');

async function testBooking() {
    try {
        await connectDB();
        const bookingData = {
            clientUserId: 8,
            providerId: 13,
            packageId: 1,
            packageName: 'Basic Sound Package',
            eventName: 'Birthday Party',
            eventType: 'Birthday',
            serviceStartDate: '2026-10-15',
            serviceEndDate: '2026-10-15',
            serviceHireDays: 1,
            startTime: '06:00 PM',
            endTime: '10:00 PM',
            numberOfHours: 4,
            numberOfDays: 1,
            eventPlace: 'Balayan',
            venueName: 'Covered Court',
            eventAddress: 'Brgy 8, Balayan, Batangas',
            locationNotes: 'Near main entrance',
            location: 'Balayan, Batangas',
            packagePrice: 15000,
            additionalDayCharges: 0,
            transportationFee: 750,
            distanceKm: 15.0,
            totalAmount: 15750,
            paymentType: 'downpayment',
            amountPaid: 7875,
            remainingBalance: 7875,
            commissionRate: 5.00,
            commissionAmount: 787.50,
            providerEarnings: 14962.50,
            bookingStatus: 'Confirmed',
            paymentStatus: 'Partial'
        };

        const paymentData = {
            paymentType: 'downpayment',
            paymentMethod: 'PayMongo - Card',
            amount: 7875,
            transactionReference: 'TXN-TEST-12345',
            paymentStatus: 'Paid'
        };

        const result = await bookingModel.createBookingWithTransaction(bookingData, paymentData);
        console.log('Booking creation SUCCESS! Booking ID:', result.BookingID, 'Ref:', result.BookingReference);
        process.exit(0);
    } catch (err) {
        console.error('Booking creation FAILED:', err);
        process.exit(1);
    }
}

testBooking();
