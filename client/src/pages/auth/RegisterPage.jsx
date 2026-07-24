import { useLayoutEffect, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { clearError, registerUser } from '../../redux/slices/authSlice';
import { buildApiUrl } from '../../services/api';
import { getRoleDashboardPath } from '../../utils/rolePaths';

function injectAuthStyles() {
    if (document.getElementById('auth-styles')) return;
    // styles are injected by LoginPage; if navigating directly to register, inject them
    const style = document.createElement('style');
    style.id = 'auth-styles';
    style.textContent = `
.auth-page { display:flex; min-height:100vh; font-family:'Outfit',sans-serif; }
.auth-art-panel { width:45%; flex-shrink:0; position:relative; overflow:hidden; }
.auth-art-panel img { width:100%; height:100%; object-fit:cover; display:block; filter:brightness(var(--auth-art-brightness)); transition:filter 0.4s ease; }
.auth-art-overlay { position:absolute; inset:0; background:linear-gradient(to right,rgba(0,0,0,0.15),rgba(0,0,0,0.5)); }
.auth-brand { position:absolute; top:28px; left:28px; display:flex; align-items:center; gap:10px; }
.auth-brand-icon { width:36px; height:36px; border-radius:10px; background:linear-gradient(135deg,#00c9a7,#0ea5e9); display:flex; align-items:center; justify-content:center; font-size:1.1rem; font-weight:900; color:#fff; }
.auth-brand-name { color:white; font-weight:800; font-size:1.1rem; letter-spacing:-0.02em; }
.auth-art-credit { position:absolute; bottom:20px; left:24px; color:rgba(255,255,255,0.35); font-size:0.72rem; margin:0; }
.auth-form-panel { flex:1; background:var(--auth-panel-bg); display:flex; flex-direction:column; justify-content:center; align-items:center; padding:48px 32px; transition:background 0.4s ease; }
.auth-inner { width:100%; max-width:420px; }
.auth-title { font-size:2rem; font-weight:800; color:var(--text); margin-bottom:6px; font-family:'Outfit',sans-serif; }
.auth-subtitle { color:var(--text-muted); font-size:0.9rem; margin-bottom:24px; }
.auth-role-toggle { display:flex; background:var(--auth-input-bg); border-radius:10px; padding:4px; margin-bottom:24px; border:1px solid var(--border); gap:8px; }
.auth-role-btn { flex:1; min-width:140px; padding:12px 0; border-radius:10px; border:none; cursor:pointer; font-size:0.95rem; font-family:'Outfit',sans-serif; transition:all 0.15s; text-transform:capitalize; }
.auth-social-btn { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; padding:12px 20px; border-radius:10px; border:1px solid var(--border); background:var(--auth-input-bg); color:var(--text); font-size:0.9rem; font-weight:600; cursor:pointer; transition:background 0.15s,transform 0.12s; margin-bottom:10px; font-family:'Outfit',sans-serif; }
.auth-social-btn:hover { background:var(--auth-input-hover); transform:translateY(-1px); }
.auth-or-divider { display:flex; align-items:center; gap:12px; margin:20px 0; }
.auth-or-line { flex:1; height:1px; background:var(--border); }
.auth-or-text { color:var(--text-muted); font-size:0.8rem; letter-spacing:0.05em; font-weight:600; }
.auth-input-wrap { position:relative; }
.auth-input-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:0.9rem; pointer-events:none; }
.auth-input { width:100%; background:var(--auth-input-bg); border:1px solid var(--border); border-radius:10px; padding:12px 14px 12px 40px; color:var(--text); font-size:0.9rem; outline:none; box-sizing:border-box; font-family:'Outfit',sans-serif; transition:border-color 0.15s,box-shadow 0.15s; }
.auth-input::placeholder { color:var(--text-light); }
.auth-input:focus { border-color:#00c9a7; box-shadow:0 0 0 3px rgba(0,201,167,0.12); }
.auth-eye-btn { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer; padding:0; display:flex; align-items:center; }
.auth-submit-btn { width:100%; padding:13px; border-radius:10px; border:none; background:var(--auth-submit-bg); color:var(--auth-submit-text); font-size:0.95rem; font-weight:700; cursor:pointer; margin-top:4px; transition:background 0.15s,transform 0.12s,opacity 0.15s; font-family:'Outfit',sans-serif; }
.auth-submit-btn:hover:not(:disabled) { opacity:0.9; transform:translateY(-1px); }
.auth-submit-btn:disabled { opacity:0.55; cursor:not-allowed; }
.auth-error { color:#f87171; font-size:0.78rem; margin-top:-4px; }
.auth-footer-text { text-align:center; margin-top:24px; color:var(--text-muted); font-size:0.85rem; }
.auth-footer-link { color:#00c9a7; text-decoration:none; font-weight:600; }
.auth-forgot-link { color:var(--text-muted); font-size:0.8rem; text-decoration:none; transition:color 0.15s; }
.auth-forgot-link:hover { color:#00c9a7; }
.auth-agree-label { display:flex; gap:10px; align-items:flex-start; cursor:pointer; margin-top:4px; }
.auth-agree-text { color:var(--text-muted); font-size:0.8rem; line-height:1.5; }
:root { --auth-panel-bg:#f8f9fb; --auth-art-brightness:0.9; --auth-input-bg:rgba(255,255,255,0.8); --auth-input-hover:rgba(255,255,255,0.95); --auth-submit-bg:#0f172a; --auth-submit-text:#ffffff; }
[data-theme='dark'] { --auth-panel-bg:#0a0a0a; --auth-art-brightness:0.55; --auth-input-bg:#141414; --auth-input-hover:#1e1e1e; --auth-submit-bg:#ffffff; --auth-submit-text:#0a0a0a; }
@media (max-width:700px) { .auth-art-panel { display:none; } .auth-form-panel { padding:40px 20px; } }
    `;
    document.head.appendChild(style);
}

export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const { loading, error, isAuthenticated, user } = useSelector((s) => s.auth);
    const [showPassword, setShowPassword] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const searchRole = new URLSearchParams(location.search).get('role');
    const routeRole = params.role;
    const initialRole = searchRole === 'freelancer' || routeRole === 'freelancer' ? 'freelancer' : 'client';
    const [accountType, setAccountType] = useState(initialRole);

    const { register, handleSubmit, formState: { errors } } = useForm();

    useLayoutEffect(() => { injectAuthStyles(); }, []);

    useEffect(() => {
        if (isAuthenticated && user?.role) {
            navigate(getRoleDashboardPath(user.role), { replace: true });
        }
    }, [isAuthenticated, user, navigate]);

    useEffect(() => {
        if (error) { toast.error(error); dispatch(clearError()); }
    }, [error, dispatch]);

    const handleGoogleAuth = () => {
        const url = new URL(buildApiUrl('/auth/google'));
        url.searchParams.set('role', accountType);
        window.location.assign(url.toString());
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const roleFromSearch = searchParams.get('role');
        const roleFromRoute = params.role;
        if (roleFromSearch === 'freelancer' || roleFromRoute === 'freelancer') {
            setAccountType('freelancer');
        } else if (roleFromSearch === 'client' || roleFromRoute === 'client') {
            setAccountType('client');
        }
    }, [location.search, params.role]);

    const onSubmit = async (data) => {
        if (!agreed) { toast.error('Please agree to the terms to continue.'); return; }
        try {
            const result = await dispatch(registerUser({
                email: data.email.trim(), password: data.password,
                name: data.name.trim(), role: accountType,
            }));
            if (registerUser.fulfilled.match(result)) {
                const payload = result.payload || {};
                if (payload.requiresVerification) {
                    navigate('/verify-otp', { state: { email: payload.email || data.email } });
                    return;
                }
                navigate(getRoleDashboardPath(payload?.user?.role || accountType), { replace: true });
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="auth-page">
            {/* ── Left: Image ─── */}
            <div className="auth-art-panel">
                <img src="/auth-art.png" alt="Art" />
                <div className="auth-art-overlay" />
                <div className="auth-brand">
                    <div className="auth-brand-icon">S</div>
                    <span className="auth-brand-name">Skill Sphere</span>
                </div>
                <p className="auth-art-credit">AI-Powered Freelance Platform</p>
            </div>

            {/* ── Right: Form ─── */}
            <div className="auth-form-panel">
                <motion.div
                    className="auth-inner"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <h1 className="auth-title">Getting Started</h1>
                    <p className="auth-subtitle">Create an account to get started</p>

                    {/* Role Toggle */}
                    <div className="auth-role-toggle">
                        {['client', 'freelancer'].map(t => (
                            <button
                                key={t}
                                type="button"
                                className="auth-role-btn"
                                onClick={() => setAccountType(t)}
                                style={{
                                    background: accountType === t ? 'var(--bg-card)' : 'transparent',
                                    color: accountType === t ? 'var(--text)' : 'var(--text-muted)',
                                    fontWeight: accountType === t ? 700 : 500,
                                    boxShadow: accountType === t ? 'var(--shadow-sm)' : 'none',
                                }}
                            >{t}</button>
                        ))}
                    </div>

                    <button type="button" className="auth-social-btn" onClick={handleGoogleAuth} disabled={loading}>
                        <GoogleIcon /> Sign Up with Google
                    </button>

                    <div className="auth-or-divider">
                        <div className="auth-or-line" />
                        <span className="auth-or-text">OR</span>
                        <div className="auth-or-line" />
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div className="auth-input-wrap">
                            <FiUser className="auth-input-icon" />
                            <input className="auth-input" type="text" placeholder="Your Name"
                                {...register('name', { required: 'Name is required' })} />
                        </div>
                        {errors.name && <span className="auth-error">{errors.name.message}</span>}

                        <div className="auth-input-wrap">
                            <FiMail className="auth-input-icon" />
                            <input className="auth-input" type="email" placeholder="Your Email"
                                {...register('email', { required: 'Email is required', pattern: { value: /^\S+@\S+$/, message: 'Invalid email' } })} />
                        </div>
                        {errors.email && <span className="auth-error">{errors.email.message}</span>}

                        <div className="auth-input-wrap">
                            <FiLock className="auth-input-icon" />
                            <input className="auth-input" type={showPassword ? 'text' : 'password'}
                                placeholder="Create a Password" style={{ paddingRight: 42 }}
                                {...register('password', {
                                    required: 'Password is required',
                                    minLength: { value: 8, message: 'Min 8 characters' },
                                    validate: v => (/[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v) && /[^A-Za-z0-9]/.test(v)) || 'Use uppercase, lowercase, number & symbol',
                                })} />
                            <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                        </div>
                        {errors.password && <span className="auth-error">{errors.password.message}</span>}

                        <label className="auth-agree-label">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={e => setAgreed(e.target.checked)}
                                style={{ marginTop: 3, accentColor: '#00c9a7', flexShrink: 0 }}
                            />
                            <span className="auth-agree-text">
                                I agree to the{' '}
                                <Link to="/terms" className="auth-footer-link">Terms & Conditions</Link>
                                {' '}and{' '}
                                <Link to="/privacy" className="auth-footer-link">Privacy Policy</Link>
                            </span>
                        </label>

                        <button type="submit" className="auth-submit-btn" disabled={loading}>
                            {loading ? 'Creating account…' : 'Sign Up'}
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

function GoogleIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.8 6.5 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C33.8 6.5 29.2 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 44c5.2 0 9.8-1.9 13.4-5l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7.1l-6.6 5.1C9.6 39.6 16.3 44 24 44z" />
            <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C40.9 35.6 44 30.3 44 24c0-1.3-.1-2.7-.4-4z" />
        </svg>
    );
}
