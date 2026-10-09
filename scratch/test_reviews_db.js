const { connectDB } = require('../server/config/db');
const bookingModel = require('../server/models/bookingModel');
const providerModel = require('../server/models/providerModel');

async function testReviewFlow() {
    const pool = await connectDB();

    // 1. Submit a test review for BookingID 18 (ProviderID 1, ClientUserID 8)
    console.log('\n--- 1. Testing createReview ---');
    const newRev = await bookingModel.createReview({
        bookingId: 18,
        userId: 8,
        providerId: 1,
        rating: 5,
        reviewText: 'Outstanding sound quality and very professional light technicians! Made our wedding night unforgettable.'
    });
    console.log('Created/Updated Review:', newRev);

    // 2. Fetch provider by ID 13 (or 1)
    console.log('\n--- 2. Testing provider profile reviews ---');
    const provider13 = await providerModel.getProviderById(13);
    console.log('Provider 13 BusinessName:', provider13?.businessName);
    console.log('Provider 13 Rating:', provider13?.rating);
    console.log('Provider 13 Reviews Count:', provider13?.reviews?.length);
    console.log('Provider 13 Reviews:', provider13?.reviews);

    // 3. Test client bookings review mapping
    console.log('\n--- 3. Testing getBookingsByUserId for Client 8 ---');
    const clientBookings = await bookingModel.getBookingsByUserId(8);
    const bk18 = clientBookings.find(b => b.BookingID === 18);
    console.log('Booking 18 Review Data in Client List:', {
        BookingID: bk18?.BookingID,
        ReviewID: bk18?.ReviewID,
        Rating: bk18?.Rating,
        ReviewText: bk18?.ReviewText,
        Status: bk18?.BookingStatus
    });

    process.exit(0);
}

testReviewFlow();
