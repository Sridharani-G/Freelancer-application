import { useNavigate } from 'react-router-dom';
import { FiShield, FiLock, FiEye, FiShieldOff } from 'react-icons/fi';

export default function PrivacySecurityPage() {
    const navigate = useNavigate();

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 860 }}>
                <div className="page-hero" style={{ marginBottom: 24 }}>
                    <div>
                        <div className="page-hero-badge">Privacy & security</div>
                        <h1 className="page-hero-title">Account safety</h1>
                        <p className="text-muted text-sm" style={{ marginTop: 6 }}>
                            Manage your login methods, two-factor authentication, and visibility settings.
                        </p>
                    </div>
                </div>

                <div className="section-card" style={{ marginBottom: 20, padding: '24px 20px' }}>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <div className="card" style={{ padding: 18 }}>
                            <div className="flex-between" style={{ gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiShield /></div>
                                    <div>
                                        <div className="font-semibold">Two-Factor Authentication</div>
                                        <div className="text-sm text-muted">Add an extra layer of protection for your account.</div>
                                    </div>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/settings')}>
                                    Manage
                                </button>
                            </div>
                        </div>
                        <div className="card" style={{ padding: 18 }}>
                            <div className="flex-between" style={{ gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiLock /></div>
                                    <div>
                                        <div className="font-semibold">Password & login</div>
                                        <div className="text-sm text-muted">Change your password and review active sessions.</div>
                                    </div>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/forgot-password')}>
                                    Change password
                                </button>
                            </div>
                        </div>
                        <div className="card" style={{ padding: 18 }}>
                            <div className="flex-between" style={{ gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiEye /></div>
                                    <div>
                                        <div className="font-semibold">Visibility</div>
                                        <div className="text-sm text-muted">Control whether others can discover your profile and activity.</div>
                                    </div>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/profile/edit')}>
                                    Adjust
                                </button>
                            </div>
                        </div>
                        <div className="card" style={{ padding: 18 }}>
                            <div className="flex-between" style={{ gap: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiShieldOff /></div>
                                    <div>
                                        <div className="font-semibold">Account activity</div>
                                        <div className="text-sm text-muted">Review recent logins and security alerts.</div>
                                    </div>
                                </div>
                                <button type="button" className="btn btn-outline btn-sm" onClick={() => navigate('/notifications')}>
                                    Review
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="section-card">
                    <h2 className="heading-sm">Need help?</h2>
                    <p className="text-sm text-muted" style={{ marginTop: 8 }}>
                        If you notice anything suspicious, change your password and contact support right away.
                    </p>
                </div>
            </div>
        </div>
    );
}
