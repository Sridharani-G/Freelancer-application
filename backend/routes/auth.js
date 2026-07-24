const express = require('express');
const passport = require('passport');
const router = express.Router();
const {
    register, login, getMe, logout, refreshToken, verifyEmail, verifyEmailOtp, resendOtp, setGooglePassword, firebaseSocial, googleAuth, googleCallback, appleAuth, appleCallback, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.get('/verify-email/:token', verifyEmail);
router.post('/verify-email-otp', verifyEmailOtp);
router.post('/resend-otp', resendOtp);
router.post('/set-google-password', setGooglePassword);
router.post('/firebase-social', firebaseSocial);
router.get('/google', googleAuth);
router.get('/google/callback', (req, res, next) => {
    const frontendOrigin = process.env.CLIENT_URL || process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:5173';
    const failureRedirect = `${frontendOrigin}/login?oauth=google&error=1`;
    passport.authenticate('google', {
        failureRedirect,
        session: false,
        state: req.query.state || 'client',
    })(req, res, next);
}, googleCallback);
router.post('/apple', appleAuth);
router.get('/apple/callback', appleCallback);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
