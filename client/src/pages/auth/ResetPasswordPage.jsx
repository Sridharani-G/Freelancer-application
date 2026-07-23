import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) return toast.error('Minimum 6 characters');
        setLoading(true);
        try {
            await API.post(`/auth/reset-password/${token}`, { password });
            toast.success('Password reset! Please log in.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="page flex-center" style={{ background: 'linear-gradient(135deg,#111111,#1a1a1a)', minHeight: '100vh' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ width: '100%', maxWidth: 440, padding: 40 }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit', marginBottom: 8 }}>New Password</h1>
                <p className="text-muted text-sm" style={{ marginBottom: 24 }}>Enter your new password below.</p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">New Password</label>
                        <input className="form-input" type="password" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    <Link to="/login" className="btn btn-ghost" style={{ textAlign: 'center' }}>← Back to Login</Link>
                </form>
            </motion.div>
        </div>
    );
}
