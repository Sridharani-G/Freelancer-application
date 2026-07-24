const crypto = require('crypto');
const User = require('../models/User');
const FreelancerProfile = require('../models/FreelancerProfile');
const ClientProfile = require('../models/ClientProfile');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/sendEmail');
const connectDB = require('../config/db');
const { validatePasswordStrength, createHash, createToken, sanitizeForLogging, generateOtpCode, hashOtpCode } = require('../utils/security');
const { buildAuthRedirectUrl } = require('../utils/authRedirect');

const loginAttempts = new Map();

const parseList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.map((item) => (typeof item === 'string' ? item.trim() : item)).filter(Boolean);
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean);
};

const recordLoginAttempt = (email, success) => {
    const normalized = String(email || '').toLowerCase();
    const bucket = loginAttempts.get(normalized) || { count: 0, blockedUntil: 0 };
    if (success) {
        loginAttempts.delete(normalized);
        return;
    }
    const now = Date.now();
    if (bucket.blockedUntil && bucket.blockedUntil > now) return;
    bucket.count += 1;
    if (bucket.count >= 5) {
        bucket.blockedUntil = now + 15 * 60 * 1000;
        bucket.count = 0;
    }
    loginAttempts.set(normalized, bucket);
};

const auditSecurityEvent = async (userId, action, details = {}) => {
    try {
        const { default: AuditLog } = await import('../models/AuditLog.js');
        await AuditLog.create({ user: userId, action, details: { ...details, ip: details.ip || 'unknown', ua: details.ua || 'unknown' } });
    } catch (error) {
        // silent
    }
};

const inferIntroMediaType = (url = '') => {
    if (!url) return '';
    return /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url) ? 'image' : 'video';
};

const buildFreelancerProfileData = (body = {}) => {
    const skills = parseList(body.skills);
    const languages = parseList(body.languages).map((language) => ({ language, proficiency: 'Conversational' }));
    const introMediaUrl = body.introMediaUrl || '';

    return {
        title: body.title || '',
        bio: body.bio || '',
        skills,
        hourlyRate: Number(body.hourlyRate) || 0,
        availability: body.availability || 'full-time',
        languages,
        introMediaUrl,
        introMediaType: inferIntroMediaType(introMediaUrl),
    };
};

// Helper: Send token response
const sendTokenResponse = async (user, statusCode, res) => {
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    res.cookie('token', token, cookieOptions);
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.status(statusCode).json({
        success: true,
        token,
        refreshToken,
        user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
            isEmailVerified: user.isEmailVerified,
            isApproved: user.isApproved,
        },
    });
};

const sendOtpCode = async (user, req) => {
    const otp = generateOtpCode();
    const verificationToken = user.generateEmailVerificationToken();
    user.emailVerificationOtp = hashOtpCode(otp);
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });
    const verificationUrl = buildAuthRedirectUrl(req, `/verify-email/${encodeURIComponent(verificationToken)}`, process.env.CLIENT_URL || 'http://localhost:5173');
    await sendEmail({
        to: user.email,
        subject: 'Verify your email address',
        html: `
            <p>Your email verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>
            <p>Or click the link below to verify instantly:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        `,
    });
    return otp;
};

// @POST /api/auth/register
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, title, bio, skills, hourlyRate, availability, languages, introMediaUrl } = req.body;
        if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const passwordPolicy = validatePasswordStrength(password);
        if (!passwordPolicy.isValid) {
            return res.status(400).json({ success: false, message: passwordPolicy.reasons.join(' ') });
        }

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered.' });
        }

        const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role: role || 'client' });

        // Create profile
        if (user.role === 'freelancer') {
            await FreelancerProfile.create({
                user: user._id,
                ...buildFreelancerProfileData({ title, bio, skills, hourlyRate, availability, languages, introMediaUrl }),
            });
        } else if (user.role === 'client') {
            await ClientProfile.create({ user: user._id });
        }

        try {
            await sendOtpCode(user, req);
        } catch (e) {
            console.error('OTP email send failed:', e.message);
            // Clean up the user so they can re-register once email is fixed
            await user.deleteOne().catch(() => { });
            return res.status(500).json({ success: false, message: 'Account created but we could not send the verification email. Please try again or contact support.' });
        }

        res.status(201).json({ success: true, message: 'Account created. Check your email for the verification code.', requiresVerification: true, email: user.email });
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const attemptState = loginAttempts.get(normalizedEmail) || { count: 0, blockedUntil: 0 };
        if (attemptState.blockedUntil > Date.now()) {
            return res.status(429).json({ success: false, message: 'Too many failed login attempts. Please try again later.' });
        }

        let user = null;
        user = await User.findOne({ email: normalizedEmail }).select('+password +twoFactorSecret');

        if (!user) {
            recordLoginAttempt(normalizedEmail, false);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        let isMatch = false;
        if (user.comparePassword) {
            isMatch = await user.comparePassword(password);
        }
        if (!isMatch) {
            recordLoginAttempt(normalizedEmail, false);
            await auditSecurityEvent(user._id, 'login_failed', { ip: req.ip, ua: req.get('user-agent'), email: normalizedEmail });
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        if (!user.isActive) {
            await auditSecurityEvent(user._id, 'login_blocked_inactive', { ip: req.ip, ua: req.get('user-agent'), email: normalizedEmail });
            return res.status(403).json({ success: false, message: 'Account is deactivated.' });
        }

        if (!user.isEmailVerified) {
            // Re-send OTP so they can complete verification
            try { await sendOtpCode(user, req); } catch (e) { /* best-effort */ }
            return res.status(403).json({ success: false, message: 'Email not verified. We have re-sent a verification code to your email — please check your inbox and verify before logging in.', requiresVerification: true, email: user.email });
        }

        if (user.twoFactorEnabled) {
            await auditSecurityEvent(user._id, 'login_requires_2fa', { ip: req.ip, ua: req.get('user-agent'), email: normalizedEmail });
            return res.status(200).json({ success: true, requiresTwoFactor: true, userId: user._id });
        }

        recordLoginAttempt(normalizedEmail, true);
        await auditSecurityEvent(user._id, 'login_success', { ip: req.ip, ua: req.get('user-agent'), email: normalizedEmail });
        await sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/logout
exports.logout = async (req, res, next) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
        await auditSecurityEvent(req.user._id, 'logout', { ip: req.ip, ua: req.get('user-agent') });
        res.clearCookie('token');
        res.clearCookie('refreshToken');
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/refresh-token
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required.' });
        const jwt = require('jsonwebtoken');
        const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
        if (!jwtRefreshSecret) {
            return res.status(500).json({ success: false, message: 'Refresh token configuration is missing.' });
        }
        const decoded = jwt.verify(refreshToken, jwtRefreshSecret);
        const user = await User.findById(decoded.id).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
        }
        await sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @GET /api/auth/verify-email/:token
exports.verifyEmail = async (req, res, next) => {
    try {
        const rawToken = String(req.params.token || '').trim();
        const hashedToken = createHash(rawToken);
        const hashedOtp = hashOtpCode(rawToken);

        const user = await User.findOne({
            emailVerificationExpire: { $gt: Date.now() },
            $or: [
                { emailVerificationToken: hashedToken },
                { emailVerificationOtp: hashedOtp },
            ],
        });

        if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationOtp = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });
        res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/verify-email-otp
exports.verifyEmailOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
        }
        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
        if (!user.emailVerificationOtp || !user.emailVerificationExpire || user.emailVerificationExpire <= Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired or missing.' });
        }
        if (user.emailVerificationOtp !== hashOtpCode(String(otp).trim())) {
            return res.status(400).json({ success: false, message: 'Invalid OTP. Please check the code in your email and try again.' });
        }
        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationOtp = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });
        await sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/resend-otp
exports.resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });
        const user = await User.findOne({ email: String(email).toLowerCase() });
        if (!user) return res.status(404).json({ success: false, message: 'No account found for this email.' });
        if (user.isEmailVerified) return res.status(400).json({ success: false, message: 'Email is already verified.' });

        // Rate-limit: only allow resend every 50 seconds
        const cooldownMs = 50 * 1000;
        if (user.emailVerificationExpire && (user.emailVerificationExpire.getTime() - 10 * 60 * 1000) > Date.now() - cooldownMs) {
            const waitSec = Math.ceil((cooldownMs - (Date.now() - (user.emailVerificationExpire.getTime() - 10 * 60 * 1000))) / 1000);
            return res.status(429).json({ success: false, message: `Please wait ${waitSec} second(s) before requesting another code.` });
        }

        await sendOtpCode(user, req);
        res.status(200).json({ success: true, message: 'A new verification code has been sent to your email.' });
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/set-google-password
exports.setGooglePassword = async (req, res, next) => {
    try {
        const { password, token } = req.body;
        if (!password || !token) {
            return res.status(400).json({ success: false, message: 'Password and token are required.' });
        }

        // Validate password strength
        const passwordPolicy = validatePasswordStrength(password);
        if (!passwordPolicy.isValid) {
            return res.status(400).json({ success: false, message: passwordPolicy.reasons.join(' ') });
        }

        const jwt = require('jsonwebtoken');
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, message: 'Invalid or expired setup token.' });
        }

        if (decoded.purpose !== 'set_password') {
            return res.status(400).json({ success: false, message: 'Invalid setup token.' });
        }

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        user.password = password;
        await user.save(); // this triggers bcrypt pre-save hash

        // Login user and send token response
        await sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};


exports.firebaseSocial = async (req, res, next) => {
    try {
        const { provider, uid, email, displayName, photoURL, createAccount = false, role = 'client' } = req.body || {};
        if (!provider || !uid || !email) {
            return res.status(400).json({ success: false, message: 'provider, uid and email are required.' });
        }

        const normalizedEmail = String(email).toLowerCase();
        let user = await User.findOne({ email: normalizedEmail });

        if (user) {
            // Merge Google into existing email account — never change role
            let changed = false;
            if (provider === 'google' && !user.googleId) { user.googleId = uid; changed = true; }
            if (!user.avatar && photoURL) { user.avatar = photoURL; changed = true; }
            if (!user.isEmailVerified) { user.isEmailVerified = true; changed = true; }
            if (changed) await user.save({ validateBeforeSave: false });
            return await sendTokenResponse(user, 200, res);
        }

        if (!createAccount) {
            return res.status(404).json({ success: false, message: 'No account found for this email. Please register first or create a new account.' });
        }

        if (createAccount !== true) {
            return res.status(400).json({ success: false, message: 'Social account creation is not allowed without an explicit registration request.' });
        }

        const allowedRole = role === 'freelancer' ? 'freelancer' : 'client';
        user = await User.create({
            name: displayName || normalizedEmail.split('@')[0],
            email: normalizedEmail,
            password: crypto.randomBytes(16).toString('hex'),
            role: allowedRole,
            avatar: photoURL || '',
            isEmailVerified: true,
            googleId: provider === 'google' ? uid : undefined,
        });

        if (allowedRole === 'freelancer') {
            await FreelancerProfile.create({ user: user._id });
        } else {
            await ClientProfile.create({ user: user._id });
        }

        await sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/google
exports.googleAuth = (req, res, next) => {
    try {
        const role = req.query?.role === 'freelancer' ? 'freelancer' : 'client';
        return req.app.locals.passport
            ? req.app.locals.passport.authenticate('google', {
                scope: ['profile', 'email'],
                state: role,
                session: false,
            })(req, res, next)
            : next(new Error('Passport is not initialized.'));
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/apple
exports.appleAuth = async (req, res, next) => {
    try {
        const redirectUrl = buildAuthRedirectUrl(req, '/auth/apple/callback', process.env.CLIENT_URL || 'http://localhost:5173');
        return res.status(200).json({ success: true, redirectUrl, provider: 'apple' });
    } catch (error) {
        next(error);
    }
};

// @GET /api/auth/google/callback
exports.googleCallback = async (req, res, next) => {
    try {
        const frontendOrigin = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

        if (!req.user) {
            const fallback = `${frontendOrigin}/login?oauth=google&error=1`;
            return res.redirect(fallback);
        }

        const selectedRole = req.query?.state === 'freelancer' ? 'freelancer' : 'client';
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.redirect(`${frontendOrigin}/login?oauth=google&error=1`);
        }

        const isNewGoogleUser = req.user._isNewGoogleUser === true;

        // Only assign the selected role for brand-new Google-only accounts.
        // Existing email-registered users keep whatever role they already have.
        if (isNewGoogleUser) {
            user.role = selectedRole;
        }

        user.isEmailVerified = true;
        if (!user.avatar && req.user.avatar) user.avatar = req.user.avatar;
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // Ensure the correct profile document exists for their role
        const finalRole = user.role;
        if (finalRole === 'freelancer') {
            const existing = await FreelancerProfile.findOne({ user: user._id });
            if (!existing) await FreelancerProfile.create({ user: user._id });
        } else {
            const existing = await ClientProfile.findOne({ user: user._id });
            if (!existing) await ClientProfile.create({ user: user._id });
        }


        const allowedOrigin = frontendOrigin.split(',').map((v) => v.trim()).filter(Boolean)[0];

        if (isNewGoogleUser) {
            // New Google user — send them to set a password before full login
            const jwt = require('jsonwebtoken');
            const setupToken = jwt.sign(
                { id: user._id.toString(), purpose: 'set_password' },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );
            const redirectUrl = new URL(`${allowedOrigin}/set-password`);
            redirectUrl.searchParams.set('token', setupToken);
            redirectUrl.searchParams.set('role', user.role);
            return res.redirect(redirectUrl.toString());
        }

        // Existing user — issue full auth tokens and redirect to login handler
        const token = user.generateAuthToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        };
        res.cookie('token', token, cookieOptions);
        res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

        const redirectUrl = new URL(`${allowedOrigin}/login`);
        redirectUrl.searchParams.set('oauth', 'google');
        redirectUrl.searchParams.set('token', token);
        redirectUrl.searchParams.set('role', user.role);
        return res.redirect(redirectUrl.toString());
    } catch (error) {
        next(error);
    }
};

// @GET /api/auth/apple/callback
exports.appleCallback = async (req, res, next) => {
    try {
        if (!req.user) return res.status(401).json({ success: false, message: 'Apple authentication failed.' });
        await sendTokenResponse(req.user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(404).json({ success: false, message: 'No account with that email.' });
        const resetToken = user.generateResetPasswordToken();
        await user.save({ validateBeforeSave: false });
        const resetUrl = buildAuthRedirectUrl(req, `/reset-password/${resetToken}`, process.env.CLIENT_URL || 'http://localhost:5173');
        try {
            await sendEmail({
                to: user.email,
                subject: 'Password Reset',
                html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p>`,
            });
        } catch (e) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'Email could not be sent.' });
        }
        res.status(200).json({ success: true, message: 'Password reset email sent.' });
    } catch (error) {
        next(error);
    }
};

// @POST /api/auth/reset-password/:token
exports.resetPassword = async (req, res, next) => {
    try {
        const hashedToken = createHash(req.params.token);
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        const policy = validatePasswordStrength(req.body.password);
        if (!policy.isValid) {
            return res.status(400).json({ success: false, message: policy.reasons.join(' ') });
        }
        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
        res.status(200).json({ success: true, message: 'Password reset successful.' });
    } catch (error) {
        next(error);
    }
};
