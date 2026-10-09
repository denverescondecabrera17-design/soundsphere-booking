const { connectDB } = require('../server/config/db');
const bookingModel = require('../server/models/bookingModel');

(async () => {
    const pool = await connectDB();
    const bookings = await bookingModel.getBookingsByUserId(1);
    console.log('Bookings count:', bookings.length);
    console.log('First booking ClientName:', JSON.stringify(bookings[0]?.ClientName));
    console.log('First booking full:', JSON.stringify(bookings[0], null, 2));
    process.exit(0);
})();
