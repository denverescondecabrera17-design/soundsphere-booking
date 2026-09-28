const { connectDB } = require('../server/config/db');
const bookingController = require('../server/controllers/bookingController');

async function testEndpoint() {
    await connectDB();
    const req = {};
    const res = {
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(data) {
            console.log("Response Status:", this.statusCode);
            console.log("Response Data:", data);
        }
    };

    await bookingController.getTransportationFees(req, res);
    process.exit(0);
}

testEndpoint();
