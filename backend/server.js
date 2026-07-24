require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const passport = require('passport');
const crypto = require('crypto');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { sanitizeInput } = require('./utils/security');
const { abuseProtection } = require('./middleware/abuseProtection');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Global process handlers to reduce unexpected crashes leading to 502s
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Note: don't exit immediately in development — log and allow supervisor to restart in production
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    // Allow the process manager (pm2/systemd) to restart the process in production.
});

// Routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const messageRoutes = require('./routes/messages');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/uploads');
const directHireRoutes = require('./routes/directHire');

let app;
let server;
let io;

const startServer = async () => {
    const dbResult = await connectDB();
    if (!dbResult?.connected) {
        console.warn('⚠️ Database unavailable. Starting API in degraded mode; requests that require persistence will fail until MongoDB is reachable.');
    }

    app = express();
    server = http.createServer(app);

    const configuredOrigins = [
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
        process.env.VITE_APP_URL,
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    ]
        .flatMap((value) => (value ? value.split(',') : []))
        .map((value) => value.trim())
        .filter(Boolean);
    const allowedOrigins = [
        ...configuredOrigins,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://10.2.0.2:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://10.2.0.2:5174',
    ].filter(Boolean);

    const corsOptions = {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const isAllowed = allowedOrigins.includes(origin) || /^(http:\/\/|https:\/\/)(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
            if (isAllowed) return callback(null, true);
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        },
        credentials: true,
    };

    app.use('/api', async (req, res, next) => {
        if (req.path === '/health') {
            return next();
        }

        try {
            await connectDB();
            if (!connectDB.isDbReady?.()) {
                return res.status(503).json({ success: false, message: 'Database is currently unavailable. Please try again later.' });
            }
            return next();
        } catch (error) {
            return res.status(503).json({ success: false, message: 'Database is currently unavailable. Please try again later.' });
        }
    });

    // Socket.io
    io = new Server(server, {
        cors: {
            origin: allowedOrigins,
            methods: ['GET', 'POST'],
        },
    });

    // Track online users with support for multiple sockets per user
    const onlineUsers = new Map();

    const getOnlineUserIds = () => Array.from(onlineUsers.keys());
    const addOnlineSocket = (userId, socketId) => {
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socketId);
    };
    const removeOnlineSocket = (socketId) => {
        for (const [userId, socketSet] of onlineUsers.entries()) {
            if (socketSet.has(socketId)) {
                socketSet.delete(socketId);
                if (socketSet.size === 0) {
                    onlineUsers.delete(userId);
                }
                break;
            }
        }
    };

    io.on('connection', (socket) => {
        console.log(`🔌 Socket connected: ${socket.id}`);

        // User joins with their userId
        socket.on('user:online', (userId) => {
            addOnlineSocket(userId, socket.id);
            io.emit('users:online', getOnlineUserIds());
        });

        // Join a private conversation room
        socket.on('chat:join', (conversationId) => {
            socket.join(conversationId);
        });

        // Send message via socket
        socket.on('chat:message', (data) => {
            const { conversationId, message } = data;
            socket.to(conversationId).emit('chat:message', message);
        });

        // Typing indicator
        socket.on('chat:typing', (data) => {
            socket.to(data.conversationId).emit('chat:typing', { userId: data.userId, isTyping: data.isTyping, conversationId: data.conversationId });
        });

        // Leave a conversation room when switching away
        socket.on('chat:leave', (conversationId) => {
            socket.leave(conversationId);
        });

        // Notification
        socket.on('notification:send', ({ toUserId, notification }) => {
            const recipientSockets = onlineUsers.get(toUserId);
            if (recipientSockets) {
                recipientSockets.forEach((socketId) => io.to(socketId).emit('notification:new', notification));
            }
        });

        socket.on('disconnect', () => {
            removeOnlineSocket(socket.id);
            io.emit('users:online', getOnlineUserIds());
        });
    });

    // Make io accessible in controllers
    app.set('io', io);
    app.set('onlineUsers', onlineUsers);

    // ── Middleware ──────────────────────────────────────────────────────────────
    app.disable('x-powered-by');
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                scriptSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                connectSrc: ["'self'", 'https:', 'ws:', 'wss:'],
            },
        },
        crossOriginEmbedderPolicy: false,
    }));
    app.use(cors(corsOptions));
    app.use(express.json({ limit: '100mb' }));
    app.use(express.urlencoded({ extended: true, limit: '100mb' }));
    app.use(cookieParser());
    app.use(passport.initialize());
    app.locals.passport = passport;
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
    app.use((req, res, next) => {
        if (req.method === 'GET' || req.path.startsWith('/api/health')) return next();
        if (req.path.startsWith('/api/auth/login') || req.path.startsWith('/api/auth/register') || req.path.startsWith('/api/auth/forgot-password') || req.path.startsWith('/api/auth/reset-password') || req.path.startsWith('/api/auth/verify-email')) return next();
        return next();
    });
    app.use((req, res, next) => {
        req.body = sanitizeInput(req.body || {});
        req.query = sanitizeInput(req.query || {});
        next();
    });

    const generalLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 200,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many requests, please try again after 15 minutes.' },
    });
    app.use('/api/', generalLimiter);

    const authLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Too many authentication attempts, please try again later.' },
    });
    app.use('/api/auth', authLimiter);
    app.use(abuseProtection);

    const csrfProtection = csrf({ cookie: true, ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] });
    app.use('/api', csrfProtection);

    const uploadLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 60,
        standardHeaders: true,
        legacyHeaders: false,
        message: { success: false, message: 'Upload limit reached. Please try again later.' },
    });
    app.use('/api/uploads', uploadLimiter);

    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`,
        }, async (_accessToken, _refreshToken, profile, done) => {
            try {
                const email = profile.emails?.[0]?.value?.toLowerCase();
                if (!email) return done(null, false);
                const googleId = profile.id;
                const avatar = profile.photos?.[0]?.value || '';
                const displayName = profile.displayName || email.split('@')[0];

                let user = await require('./models/User').findOne({ email });

                if (user) {
                    // Merge: link Google to the existing email-registered account
                    let changed = false;
                    if (!user.googleId) { user.googleId = googleId; changed = true; }
                    if (!user.isEmailVerified) { user.isEmailVerified = true; changed = true; }
                    if (!user.avatar && avatar) { user.avatar = avatar; changed = true; }
                    if (changed) await user.save({ validateBeforeSave: false });
                    // Mark as not new so callback won't change role
                    user._isNewGoogleUser = false;
                } else {
                    // Brand-new Google-only user — role will be set in googleCallback
                    user = await require('./models/User').create({
                        name: displayName,
                        email,
                        googleId,
                        password: crypto.randomBytes(16).toString('hex'),
                        role: 'client', // temporary; overridden to selectedRole in callback
                        avatar,
                        isEmailVerified: true,
                    });
                    user._isNewGoogleUser = true;
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        }));
    }

    passport.serializeUser((user, done) => done(null, user._id));
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await require('./models/User').findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });

    // ── Routes ──────────────────────────────────────────────────────────────────
    app.use('/api/auth', authRoutes);
    app.use('/api/jobs', jobRoutes);
    app.use('/api/applications', applicationRoutes);
    app.use('/api/messages', messageRoutes);
    app.use('/api/notifications', require('./routes/notifications'));
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/uploads', uploadRoutes);
    app.use('/api/direct-hire', directHireRoutes);

    // Health check
    app.get('/api/health', (req, res) => {
        res.json({ success: true, message: 'API is running 🚀', timestamp: new Date().toISOString() });
    });

    app.get('/api/auth/csrf-token', (req, res) => {
        const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';
        res.cookie('csrfToken', req.csrfToken(), {
            httpOnly: false,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 24 * 60 * 60 * 1000,
        });
        res.json({ success: true, csrfToken: req.csrfToken() });
    });

    // 404
    app.use((req, res) => {
        res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
    });

    // Error handler
    app.use(errorHandler);

    // ── Start Server ─────────────────────────────────────────────────────────────
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
        console.log(`\n🚀 API running on http://localhost:${PORT}`);
        console.log(`📡 Socket.io ready`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
};

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

module.exports = { app, server, io };
