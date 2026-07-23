const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
        email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
        password: { type: String, minlength: 6, select: false },
        role: { type: String, enum: ['client', 'freelancer', 'admin'], default: 'client' },
        avatar: { type: String, default: '' },
        phone: { type: String, default: '' },
        isEmailVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        isApproved: { type: Boolean, default: false }, // Admin approves freelancers
        googleId: { type: String },
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: { type: String, select: false },
        emailVerificationToken: String,
        emailVerificationOtp: String,
        emailVerificationExpire: Date,
        resetPasswordToken: String,
        resetPasswordExpire: Date,
        refreshToken: { type: String, select: false },
        lastLogin: Date,
        location: {
            address: { type: String, default: '' },
            city: { type: String, default: '' },
            state: { type: String, default: '' },
            country: { type: String, default: '' },
            lat: { type: Number, default: 0 },
            lng: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.generateAuthToken = function () {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured.');
    }
    return jwt.sign({ id: this._id, role: this.role }, jwtSecret, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// Generate Refresh Token
userSchema.methods.generateRefreshToken = function () {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!jwtRefreshSecret) {
        throw new Error('JWT_REFRESH_SECRET is not configured.');
    }
    return jwt.sign({ id: this._id }, jwtRefreshSecret, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d',
    });
};

// Generate Email Verification Token
userSchema.methods.generateEmailVerificationToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    return token;
};

// Generate Password Reset Token
userSchema.methods.generateResetPasswordToken = function () {
    const token = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    return token;
};

module.exports = mongoose.model('User', userSchema);
