import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiChrome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { setAuthSession } from '../../redux/slices/authSlice';
import { getRoleDashboardPath } from '../../utils/rolePaths';

const AUTH_STYLES = `
.auth-page { display: flex; min-height: 100vh; font-family: 'Outfit', sans-serif; }
.auth-art-panel { width: 45%; flex-shrink: 0; position: relative; overflow: hidden; }
.auth-art-panel img { filter: brightness(var(--auth-art-brightness)); transition: filter 0.4s ease; width: 100%; height: 100%; object-fit: cover; display: block; }
.auth-art-overlay { position: absolute; inset: 0; background: linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.5)); }
.auth-brand { position: absolute; top: 28px; left: 28px; display: flex; align-items: center; gap: 10px; }
.auth-brand-icon { width: 36px; height: 36px; border-radius: 10px; background: linear-gradient(135deg, #00c9a7, #0ea5e9); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; font-weight: 900; color: #fff; }
.auth-brand-name { color: white; font-weight: 800; font-size: 1.1rem; letter-spacing: -0.02em; }
.auth-art-credit { position: absolute; bottom: 20px; left: 24px; color: rgba(255,255,255,0.35); font-size: 0.72rem; margin: 0; }
.auth-form-panel { flex: 1; background: var(--auth-panel-bg); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 48px 32px; transition: background 0.4s ease; }
.auth-inner { width: 100%; max-width: 380px; }
.auth-title { font-size: 2rem; font-weight: 800; color: var(--text); margin-bottom: 6px; font-family: 'Outfit', sans-serif; }
.auth-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 32px; }
.auth-input-wrap { position: relative; }
.auth-input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 0.9rem; pointer-events: none; }
.auth-input { width: 100%; background: var(--auth-input-bg); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px 12px 40px; color: var(--text); font-size: 0.9rem; outline: none; box-sizing: border-box; font-family: 'Outfit', sans-serif; transition: border-color 0.15s, box-shadow 0.15s; }
.auth-input::placeholder { color: var(--text-light); }
.auth-input:focus { border-color: #00c9a7; box-shadow: 0 0 0 3px rgba(0,201,167,0.12); }
.auth-eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; display: flex; align-items: center; }
.auth-submit-btn { width: 100%; padding: 13px; border-radius: 10px; border: none; background: var(--auth-submit-bg); color: var(--auth-submit-text); font-size: 0.95rem; font-weight: 700; cursor: pointer; margin-top: 4px; transition: background 0.15s, transform 0.12s, opacity 0.15s; font-family: 'Outfit', sans-serif; }
.auth-submit-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.auth-submit-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.auth-error { color: #f87171; font-size: 0.78rem; margin-top: 4px; display: block; }
.auth-footer-text { text-align: center; margin-top: 24px; color: var(--text-muted); font-size: 0.85rem; }
.auth-footer-link { color: #00c9a7; text-decoration: none; font-weight: 600; }
.auth-brand-icon-small { width: 54px; height: 54px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: #00c9a7; color: #fff; margin: 0 auto 16px; }

:root { --auth-panel-bg: #f8f9fb; --auth-art-brightness: 0.9; --auth-input-bg: rgba(255,255,255,0.8); --auth-input-hover: rgba(255,255,255,0.95); --auth-submit-bg: #0f172a; --auth-submit-text: #ffffff; }
[data-theme='dark'] { --auth-panel-bg: #0a0a0a; --auth-art-brightness: 0.55; --auth-input-bg: #141414; --auth-input-hover: #1e1e1e; --auth-submit-bg: #ffffff; --auth-submit-text: #0a0a0a; }
@media (max-width: 700px) { .auth-art-panel { display: none; } .auth-form-panel { padding: 40px 20px; } }
`;

function injectAuthStyles() {
    if (document.getElementById('auth-styles')) return;
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = AUTH_STYLES;
    document.head.appendChild(style);
}

export default function SetPasswordPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isAuthenticated, user: currentUser } = useSelector((s) => s.auth);

    const token = searchParams.get('token');
    const role = searchParams.get('role') || 'client';

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const passwordVal = watch('password', '');

    useEffect(() => {
        injectAuthStyles();
    }, []);

    useEffect(() => {
        if (isAuthenticated && currentUser?.role) {
            navigate(getRoleDashboardPath(currentUser.role), { replace: true });
        }
    }, [isAuthenticated, currentUser, navigate]);

    useEffect(() => {
        if (!token) {
            toast.error('Session expired or invalid setup link.');
            navigate('/register', { replace: true });
        }
    }, [token, navigate]);

    const onSubmit = async (data) => {
        if (!token) return;
        setSubmitting(true);
        try {
            const { data: responseData } = await API.post('/auth/set-google-password', {
                token,
                password: data.password,
            });

            if (responseData.success && responseData.token) {
                localStorage.setItem('token', responseData.token);
                localStorage.setItem('user', JSON.stringify(responseData.user));
                dispatch(setAuthSession({ token: responseData.token, user: responseData.user, isAuthenticated: true }));
                toast.success('Password setup successful! Welcome to SkillSphere.');
                navigate(getRoleDashboardPath(responseData.user.role || role), { replace: true });
            } else {
                toast.error(responseData.message || 'Failed to complete registration.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Verification failed. Link may be expired.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-art-panel">
                <img src="/auth-art.png" alt="Art" />
                <div className="auth-art-overlay" />
                <div className="auth-brand">
                    <div className="auth-brand-icon">S</div>
                    <span className="auth-brand-name">Skill Sphere</span>
                </div>
                <p className="auth-art-credit">AI-Powered Freelance Platform</p>
            </div>
            <div className="auth-form-panel">
                <motion.div className="auth-inner" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div className="auth-brand-icon-small">
                            <FiChrome />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
                            <FiChrome style={{ color: 'var(--primary)', fontSize: '1.2rem' }} />
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--primary)' }}>
                                Google Signup
                            </span>
                        </div>
                        <h1 className="auth-title">Create a Password</h1>
                        <p className="auth-subtitle">Create a password to allow standard email login options in the future.</p>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <div className="auth-input-wrap">
                                <FiLock className="auth-input-icon" />
                                <input
                                    className="auth-input"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Create password"
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Use at least 8 characters' },
                                        validate: (v) => (
                                            (/[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v))
                                            || 'Use 8+ chars with uppercase, lowercase, number, and symbol'
                                        ),
                                    })}
                                />
                                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.password && <span className="auth-error">{errors.password.message}</span>}
                        </div>
                        <div>
                            <div className="auth-input-wrap">
                                <FiLock className="auth-input-icon" />
                                <input
                                    className="auth-input"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm password"
                                    {...register('confirmPassword', {
                                        required: 'Confirm password is required',
                                        validate: (v) => v === passwordVal || 'Passwords do not match',
                                    })}
                                />
                                <button type="button" className="auth-eye-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                            {errors.confirmPassword && <span className="auth-error">{errors.confirmPassword.message}</span>}
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={submitting}>
                            {submitting ? 'Completing…' : 'Set Password & Complete Signup'}
                        </button>
                    </form>
                    <p className="auth-footer-text">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-footer-link">Log in</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
