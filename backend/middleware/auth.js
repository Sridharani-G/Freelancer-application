const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes — verify JWT
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Not authorized. No token provided.' });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            return res.status(500).json({ success: false, message: 'Authentication configuration is missing.' });
        }
        const decoded = jwt.verify(token, jwtSecret);

        const user = await User.findById(decoded.id).select('-password -refreshToken');

        if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
        if (!user.isActive) return res.status(403).json({ success: false, message: 'Account is deactivated.' });

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
    }
};

// Role-based access control
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this route.`,
            });
        }
        next();
    };
};

// Optional auth (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (token) {
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                return next(new Error('Authentication configuration is missing.'));
            }
            const decoded = jwt.verify(token, jwtSecret);
            req.user = await User.findById(decoded.id).select('-password');
        }
    } catch (e) {
        // silent
    }
    next();
};
