import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { FiEdit, FiMail, FiPhone, FiMapPin, FiShield, FiBell, FiMessageSquare, FiArrowRight, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function ClientProfilePage() {
    const { user } = useSelector((s) => s.auth);

    const roleLabel = user?.role === 'client' ? 'Client account' : user?.role === 'freelancer' ? 'Freelancer account' : 'Account overview';
    const locationText = [user?.location?.city, user?.location?.country].filter(Boolean).join(', ') || 'Location not set';
    const userLocationText = [user?.location?.address, user?.location?.city, user?.location?.state, user?.location?.country].filter(Boolean).join(', ');
    const mapUrl = userLocationText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(userLocationText)}` : '';

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 980 }}>

                <div className="section-card" style={{ marginBottom: 20, padding: '24px 24px 20px' }}>
                    <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="avatar avatar-xl" style={{ width: 92, height: 92, fontSize: '2rem', overflow: 'hidden', flexShrink: 0 }}>
                            {user?.avatar
                                ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : (user?.name?.[0] || 'U')}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                                <div>
                                    <h2 className="heading-sm">{user?.name || 'Your name'}</h2>
                                    <p className="text-sm text-muted" style={{ marginTop: 4 }}>{user?.email}</p>
                                </div>
                                <span className={`badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    {user?.isEmailVerified ? (
                                        <>
                                            <FiCheckCircle /> Email verified
                                        </>
                                    ) : (
                                        <>
                                            <FiAlertTriangle /> Email not verified
                                        </>
                                    )}
                                </span>
                            </div>

                            <div className="metric-grid" style={{ marginTop: 14 }}>
                                <div className="metric-card">
                                    <span>Role</span>
                                    <strong>{user?.role || 'Member'}</strong>
                                </div>
                                <div className="metric-card">
                                    <span>Location</span>
                                    <strong>{locationText}</strong>
                                </div>
                                <div className="metric-card">
                                    <span>Contact</span>
                                    <strong>{user?.phone ? 'Added' : 'Pending'}</strong>
                                </div>
                                <div className="metric-card">
                                    <span>Status</span>
                                    <strong>{user?.isEmailVerified ? 'Active' : 'Needs review'}</strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.75fr', gap: 20 }}>
                    <div className="section-card">
                        <div className="section-card-header">
                            <div>
                                <h2 className="heading-sm">Account details</h2>
                                <p className="text-sm text-muted">Keep your contact and location information current.</p>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: 12 }}>
                            <div className="setting-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiMail /></div>
                                    <div>
                                        <div className="font-semibold">Email address</div>
                                        <div className="text-sm text-muted">{user?.email || 'No email added'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="setting-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiPhone /></div>
                                    <div>
                                        <div className="font-semibold">Phone number</div>
                                        <div className="text-sm text-muted">{user?.phone || 'No phone number added'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="setting-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div className="setting-icon"><FiMapPin /></div>
                                    <div>
                                        <div className="font-semibold">Location</div>
                                        <div className="text-sm text-muted">{locationText}</div>
                                        {mapUrl && (
                                            <a href={mapUrl} target="_blank" rel="noreferrer" className="text-xs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                                                <FiMapPin size={12} /> View on map
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="section-card">
                            <div className="section-card-header">
                                <div>
                                    <h2 className="heading-sm">Quick actions</h2>
                                    <p className="text-sm text-muted">Jump straight to the most useful tools.</p>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                <Link to="/profile/edit" className="setting-card" style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="setting-icon"><FiEdit /></div>
                                        <span className="font-semibold">Update profile</span>
                                    </div>
                                    <FiArrowRight />
                                </Link>
                                <Link to="/settings" className="setting-card" style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="setting-icon"><FiShield /></div>
                                        <span className="font-semibold">Security settings</span>
                                    </div>
                                    <FiArrowRight />
                                </Link>
                                <Link to="/notifications" className="setting-card" style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="setting-icon"><FiBell /></div>
                                        <span className="font-semibold">Notifications</span>
                                    </div>
                                    <FiArrowRight />
                                </Link>
                                <Link to="/chat" className="setting-card" style={{ padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div className="setting-icon"><FiMessageSquare /></div>
                                        <span className="font-semibold">Messages</span>
                                    </div>
                                    <FiArrowRight />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
