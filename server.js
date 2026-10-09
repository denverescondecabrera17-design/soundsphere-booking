/**
 * SoundSphere - Application Server Entry Point
 * Technology Stack: Node.js & Express.js
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { connectDB } = require('./server/config/db');
const authRoutes = require('./server/routes/authRoutes');
const providerAppRoutes = require('./server/routes/providerAppRoutes');
const adminRoutes = require('./server/routes/adminRoutes');
const providerRoutes = require('./server/routes/providerRoutes');
const userRoutes = require('./server/routes/userRoutes');
const bookingRoutes = require('./server/routes/bookingRoutes');
const notificationRoutes = require('./server/routes/notificationRoutes');
const messageRoutes = require('./server/routes/messageRoutes');
const reportRoutes = require('./server/routes/reportRoutes');
const subscriptionRoutes = require('./server/routes/subscriptionRoutes');
const cashierRoutes = require('./server/routes/cashierRoutes');

const { getMapsConfig } = require('./server/config/mapsConfig');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxies for protocol detection & OAuth callbacks
app.set('trust proxy', 1);

// Enable Cross-Origin Resource Sharing & Body Parsing
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Client Static Frontend Assets
app.use(express.static(path.join(__dirname, 'client'), { etag: false, maxAge: 0 }));
app.use(express.static(path.join(__dirname, 'client', 'pages'), { etag: false, maxAge: 0 }));
app.use('/client', express.static(path.join(__dirname, 'client'), { etag: false, maxAge: 0 }));
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), { etag: false, maxAge: 0 }));
app.use('/uploads', express.static(path.join(__dirname, 'client', 'uploads'), { etag: false, maxAge: 0 }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/provider-applications', providerAppRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/packages', bookingRoutes);
app.use('/api/payments', bookingRoutes);

const bookingController = require('./server/controllers/bookingController');
const { verifyToken } = require('./server/middleware/authMiddleware');
const reviewRouter = express.Router();
reviewRouter.post('/', verifyToken, bookingController.submitReview);
reviewRouter.post('/reviews', verifyToken, bookingController.submitReview);
app.use('/api/reviews', reviewRouter);

app.get('/api/config/maps-key', getMapsConfig);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Favicon Endpoint to avoid 404 console logs
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Basic Server Connection & DB Diagnostics Endpoint
app.get('/api/health', async (req, res) => {
    let dbStatus = 'Disconnected';
    let dbError = null;
    try {
        const pool = await connectDB();
        if (pool && pool.connected) {
            dbStatus = 'Connected';
        } else if (pool) {
            dbStatus = 'Pool initialized (Connecting)';
        }
    } catch (err) {
        dbError = err.message;
    }

    res.status(200).json({
        success: true,
        message: 'SoundSphere API Server is running.',
        dbStatus,
        dbServer: process.env.DB_SERVER || '127.0.0.1',
        dbName: process.env.DB_NAME || process.env.DB_DATABASE || 'SoundSphereDB',
        dbError,
        timestamp: new Date().toISOString()
    });
});

// Explicit Static HTML Routes
app.get(['/', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.get(['/login', '/login.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'login.html'));
});

app.get(['/signup', '/signup.html', '/register', '/register.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'register.html'));
});

app.get(['/forgot-password', '/forgot-password.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'forgot-password.html'));
});

app.get(['/reset-password', '/reset-password.html'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'reset-password.html'));
});

app.get('/verify-otp.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'pages', 'verify-otp.html'));
});

app.get(['/marketplace.html', '/client/dashboard.html', '/client/dashboard'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'marketplace.html'));
});

app.get(['/provider/dashboard.html', '/provider/dashboard'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'provider', 'dashboard.html'));
});

app.get(['/cashier/dashboard.html', '/cashier/dashboard', '/cashier'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'cashier', 'dashboard.html'));
});

app.get(['/provider-detail.html', '/provider-detail', '/provider-profile.html', '/provider-profile'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'provider-detail.html'));
});

app.get(['/booking.html', '/booking'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'booking.html'));
});

app.get(['/booking-confirmation.html', '/booking-confirmation'], (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'booking-confirmation.html'));
});

app.get('/checkout-modal.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'checkout-modal.html'));
});

app.get('/client-bookings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'client-bookings.html'));
});

app.get('/client-messages.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'client-messages.html'));
});

// Global 404 Route Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route '${req.originalUrl}' not found.`
    });
});

// Initialize DB and Start Express Server
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(` SoundSphere Server running at http://localhost:${PORT}`);
        console.log(` Authentication API ready at http://localhost:${PORT}/api/auth`);
        console.log(` User Profile API ready at http://localhost:${PORT}/api/users`);
        console.log(` Service Providers API ready at http://localhost:${PORT}/api/providers`);
        console.log(` Provider Applications API ready at http://localhost:${PORT}/api/provider-applications`);
        console.log(` Admin API ready at http://localhost:${PORT}/api/admin`);
    });
};

startServer();
