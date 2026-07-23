import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiLock, FiBell, FiShield, FiUser } from 'react-icons/fi';

export default function SettingsPage() {
    const { user } = useSelector((s) => s.auth);
    const notificationDesc = user?.role === 'freelancer'
        ? 'Message notifications, client approvals, and direct-hire requests.'
        : user?.role === 'client'
            ? 'Job requests from freelancers and direct-hire approval notifications.'
            : 'Manage message and job notifications.';

    const items = [
        { title: 'Edit Profile', desc: 'Update your name, phone, location, experience, and pricing', link: '/profile/edit', icon: <FiUser /> },
        { title: 'Change Password', desc: 'Update your account password securely', link: '/forgot-password', icon: <FiLock /> },
        { title: 'Notification Preferences', desc: notificationDesc, link: '/notification-preferences', icon: <FiBell /> },
        { title: 'Privacy & Security', desc: 'Manage 2FA, visibility, and account safety', link: '/privacy-security', icon: <FiShield /> },
    ];

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 860 }}>
                <div className="page-hero" style={{ marginBottom: 24 }}>
                    <div>
                        <div className="page-hero-badge">Account controls</div>
                        <h1 className="page-hero-title">Settings</h1>
                        <p className="text-muted text-sm" style={{ marginTop: 6 }}>Manage your profile, privacy, and account preferences in one place.</p>
                    </div>
                    <div className="page-toolbar">
                        <div className="info-pill">Secure</div>
                        <div className="info-pill">Tailored</div>
                    </div>
                </div>

                <div className="section-card" style={{ marginBottom: 20, padding: '18px 20px' }}>
                    <div className="metric-grid">
                        <div className="metric-card">
                            <span>Privacy</span>
                            <strong>Controlled</strong>
                        </div>
                        <div className="metric-card">
                            <span>Notifications</span>
                            <strong>Balanced</strong>
                        </div>
                        <div className="metric-card">
                            <span>Security</span>
                            <strong>Protected</strong>
                        </div>
                        <div className="metric-card">
                            <span>Profile</span>
                            <strong>Polished</strong>
                        </div>
                    </div>
                </div>

                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h2 className="heading-sm">Quick access</h2>
                            <p className="text-sm text-muted">Everything important in one place.</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                        {items.map((item) => (
                            <Link key={item.title} to={item.link} className="setting-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon">{item.icon}</div>
                                    <div>
                                        <div className="font-semibold">{item.title}</div>
                                        <div className="text-sm text-muted">{item.desc}</div>
                                    </div>
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>→</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
