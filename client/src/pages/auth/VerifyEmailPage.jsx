import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader } from 'react-icons/fi';
import API from '../../services/api';

export default function VerifyEmailPage() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        API.get(`/auth/verify-email/${token}`)
            .then(({ data }) => {
                setStatus('success');
                setMessage(data.message || 'Email verified successfully.');
                window.setTimeout(() => navigate('/verify-email-success', { replace: true }), 900);
            })
            .catch((err) => { setStatus('error'); setMessage(err.response?.data?.message || 'Verification failed'); });
    }, [token, navigate]);

    return (
        <div className="page flex-center" style={{ minHeight: '100vh' }}>
            <div className="card" style={{ maxWidth: 460, width: '100%', padding: 48, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    {status === 'loading' && (
                        <FiLoader
                            style={{
                                fontSize: '4rem',
                                color: 'var(--primary)',
                                animation: 'spin 1.5s linear infinite'
                            }}
                        />
                    )}
                    {status === 'success' && <FiCheckCircle style={{ fontSize: '4rem', color: '#10b981' }} />}
                    {status === 'error' && <FiXCircle style={{ fontSize: '4rem', color: '#ef4444' }} />}
                </div>
                <h2 className="heading-md" style={{ marginBottom: 12 }}>
                    {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Email Verified!' : 'Verification Failed'}
                </h2>
                <p className="text-muted text-sm" style={{ marginBottom: 24 }}>{message}</p>
                {status !== 'loading' && <Link to="/login" className="btn btn-primary">Go to Login</Link>}
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
