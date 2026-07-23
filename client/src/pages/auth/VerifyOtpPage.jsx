import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { RiSparklingFill, RiMailCheckLine } from 'react-icons/ri';
import { FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { verifyOtpCode } from '../../redux/slices/authSlice';
import API from '../../services/api';
import { getRoleDashboardPath } from '../../utils/rolePaths';

const OTP_TTL_SECONDS = 60; // 1-minute countdown

export default function VerifyOtpPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { loading, isAuthenticated, user } = useSelector((s) => s.auth);

    // Email comes from navigation state (set by RegisterPage / LoginPage)
    const email = location.state?.email || '';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [secondsLeft, setSecondsLeft] = useState(OTP_TTL_SECONDS);
    const [resending, setResending] = useState(false);
    const inputRefs = useRef([]);
    const timerRef = useRef(null);

    // If no email provided, redirect back to register
    useEffect(() => {
        if (!email) {
            navigate('/register', { replace: true });
        }
    }, [email, navigate]);

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && user?.role) {
            navigate(getRoleDashboardPath(user.role), { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    // Countdown timer
    useEffect(() => {
        setSecondsLeft(OTP_TTL_SECONDS);
        timerRef.current = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) {
                    clearInterval(timerRef.current);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [email]); // restart when email changes (i.e. after resend)

    const resetTimer = () => {
        clearInterval(timerRef.current);
        setSecondsLeft(OTP_TTL_SECONDS);
        timerRef.current = setInterval(() => {
            setSecondsLeft((s) => {
                if (s <= 1) { clearInterval(timerRef.current); return 0; }
                return s - 1;
            });
        }, 1000);
    };

    const otpString = otp.join('');
    const isExpired = secondsLeft === 0;
    const isComplete = otpString.length === 6;

    // Format mm:ss
    const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    // Handle individual digit input
    const handleChange = (index, value) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        if (digit && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (otp[index]) {
                const next = [...otp];
                next[index] = '';
                setOtp(next);
            } else if (index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
        if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;
        const digits = pasted.split('');
        const next = ['', '', '', '', '', ''];
        digits.forEach((d, i) => { if (i < 6) next[i] = d; });
        setOtp(next);
        // Focus last filled or last box
        const focusIdx = Math.min(digits.length, 5);
        inputRefs.current[focusIdx]?.focus();
    };

    const handleVerify = async (e) => {
        e?.preventDefault();
        if (!isComplete) { toast.error('Enter all 6 digits.'); return; }
        if (isExpired) { toast.error('Code expired. Please request a new one.'); return; }

        const resultAction = await dispatch(verifyOtpCode({ email, otp: otpString }));
        if (verifyOtpCode.fulfilled.match(resultAction)) {
            toast.success('Email verified! Welcome aboard');
            const role = resultAction.payload?.user?.role;
            navigate(getRoleDashboardPath(role || 'client'), { replace: true });
        } else {
            toast.error(resultAction.payload || 'Invalid code. Try again.');
            // Clear the boxes on wrong code
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        }
    };

    const handleResend = async () => {
        if (resending) return;
        setResending(true);
        try {
            const { data } = await API.post('/auth/resend-otp', { email });
            if (data.success) {
                toast.success('New code sent! Check your inbox.');
                setOtp(['', '', '', '', '', '']);
                resetTimer();
                inputRefs.current[0]?.focus();
            } else {
                toast.error(data.message || 'Could not resend OTP.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not resend OTP.');
        } finally {
            setResending(false);
        }
    };

    const progressPct = (secondsLeft / OTP_TTL_SECONDS) * 100;
    const progressColor = secondsLeft > 20 ? 'var(--primary)' : secondsLeft > 10 ? '#f59e0b' : '#ef4444';

    return (
        <div className="page flex-center" style={{ background: 'linear-gradient(135deg,#111111,#1a1a1a)', minHeight: '100vh', padding: '32px 16px' }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{ width: '100%', maxWidth: 460, padding: '40px 36px', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', textAlign: 'center' }}
            >
                {/* Icon */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div style={{
                        width: 72, height: 72, borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(0,201,167,0.15), rgba(0,201,167,0.05))',
                        border: '2px solid rgba(0,201,167,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '2rem', color: 'var(--primary)',
                    }}>
                        <RiMailCheckLine />
                    </div>
                </div>

                <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 8 }}>
                    Check your email
                </h1>
                <p className="text-muted text-sm" style={{ marginBottom: 6 }}>
                    We sent a 6-digit code to
                </p>
                <p style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 28, fontSize: '0.95rem' }}>{email}</p>

                {/* Countdown ring / bar */}
                <div style={{ marginBottom: 24 }}>
                    <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 8 }}>
                        <motion.div
                            animate={{ width: `${progressPct}%` }}
                            transition={{ duration: 0.5, ease: 'linear' }}
                            style={{ height: '100%', borderRadius: 999, background: progressColor, transition: 'background 0.5s' }}
                        />
                    </div>
                    {isExpired ? (
                        <p style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Code expired — request a new one below</p>
                    ) : (
                        <p style={{ fontSize: '0.85rem', color: secondsLeft <= 10 ? '#ef4444' : 'var(--text-muted)', fontWeight: 500 }}>
                            Expires in <span style={{ fontWeight: 700, color: progressColor }}>{formatTime(secondsLeft)}</span>
                        </p>
                    )}
                </div>

                {/* OTP boxes */}
                <form onSubmit={handleVerify}>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 24 }}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => { inputRefs.current[i] = el; }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                onPaste={i === 0 ? handlePaste : undefined}
                                onFocus={(e) => e.target.select()}
                                disabled={isExpired}
                                style={{
                                    width: 52, height: 58,
                                    textAlign: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    fontFamily: 'Outfit, monospace',
                                    borderRadius: 12,
                                    border: `2px solid ${digit ? 'var(--primary)' : 'rgba(255,255,255,0.12)'}`,
                                    background: digit ? 'rgba(0,201,167,0.08)' : 'rgba(255,255,255,0.04)',
                                    color: 'var(--text)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s, background 0.2s',
                                    opacity: isExpired ? 0.4 : 1,
                                    cursor: isExpired ? 'not-allowed' : 'text',
                                }}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !isComplete || isExpired}
                        style={{ width: '100%', justifyContent: 'center', marginBottom: 14, fontSize: '1rem', padding: '13px' }}
                    >
                        {loading
                            ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
                            : 'Verify & Create Account'}
                    </button>
                </form>

                {/* Resend */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <button
                        type="button"
                        onClick={handleResend}
                        disabled={resending || (!isExpired && secondsLeft > OTP_TTL_SECONDS - 10)}
                        style={{
                            background: 'none', border: 'none', cursor: resending ? 'not-allowed' : 'pointer',
                            color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', gap: 6,
                            opacity: resending ? 0.6 : 1,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <FiRefreshCw style={{ animation: resending ? 'spin 1s linear infinite' : 'none' }} />
                        {resending ? 'Sending...' : 'Resend code'}
                    </button>
                </div>

                <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                    <p className="text-xs text-muted">
                        Wrong email?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 'inherit' }}
                        >
                            Go back
                        </button>
                    </p>
                </div>
            </motion.div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
