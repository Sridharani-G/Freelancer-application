import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail } from 'react-icons/fi';
import { RiSparklingFill } from 'react-icons/ri';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await API.post('/auth/forgot-password', { email });
            setSent(true);
            toast.success('Reset email sent!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send email');
        } finally { setLoading(false); }
    };

    return (
        <div className="page flex-center" style={{ background: 'linear-gradient(135deg,#111111,#1a1a1a)', minHeight: '100vh' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <div className="navbar-logo-icon" style={{ width: 52, height: 52, fontSize: '1.4rem', margin: '0 auto 16px' }}><RiSparklingFill /></div>
                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>Reset Password</h1>
                    <p className="text-muted text-sm" style={{ marginTop: 8 }}>We'll send a reset link to your email</p>
                </div>
                {sent ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <FiMail style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }} />
                        <p className="font-semibold" style={{ marginBottom: 8 }}>Check your inbox!</p>
                        <p className="text-muted text-sm">We sent a password reset link to <strong>{email}</strong></p>
                        <Link to="/login" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Back to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <div className="input-group">
                                <FiMail className="input-icon" />
                                <input className="form-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : 'Send Reset Link'}
                        </button>
                        <Link to="/login" className="btn btn-ghost" style={{ textAlign: 'center' }}>← Back to Login</Link>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
