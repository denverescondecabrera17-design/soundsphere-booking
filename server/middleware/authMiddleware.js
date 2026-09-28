/**
 * SoundSphere - Auth Middleware
 * JWT Token verification & Role-Based Access Control Guards
 */

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    try {
        let authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader && req.query && req.query.token) {
            authHeader = `Bearer ${req.query.token}`;
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. Authentication token required.'
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SoundSphere_Secret_Key');

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Session expired. Please log in again.'
            });
        }
        return res.status(403).json({
            success: false,
            message: 'Invalid or corrupted token.'
        });
    }
};

const optionalVerifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SoundSphere_Secret_Key');
            req.user = decoded;
        }
    } catch (e) {
        // Optional token verification, continue
    }
    next();
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden. User not authenticated.'
            });
        }

        const userRole = String(req.user.roleName || req.user.role || req.user.RoleName || req.user.Role || '').trim().toLowerCase();
        const userRoleId = parseInt(req.user.roleId || req.user.RoleID || req.user.role_id, 10);
        const userEmail = String(req.user.email || req.user.Email || '').trim().toLowerCase();

        const normalizedAllowed = allowedRoles.map(r => String(r).trim().toLowerCase());

        let isAuthorized = false;

        if (normalizedAllowed.includes(userRole)) {
            isAuthorized = true;
        } else if (normalizedAllowed.includes('administrator') || normalizedAllowed.includes('admin')) {
            if (userRole === 'administrator' || userRole === 'admin' || userRoleId === 1 || userEmail === 'soundsphere@gmail.com') {
                isAuthorized = true;
            }
        } else if (normalizedAllowed.includes('serviceprovider') || normalizedAllowed.includes('provider')) {
            if (userRole === 'serviceprovider' || userRole === 'provider' || userRoleId === 2) {
                isAuthorized = true;
            }
        } else if (normalizedAllowed.includes('client')) {
            if (userRole === 'client' || userRoleId === 3) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({
                success: false,
                message: `Forbidden. Role '${userRole || 'Unknown'}' is not authorized.`
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    optionalVerifyToken,
    authorizeRoles
};
