import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

export default function NotificationPreferencesPage() {
    const { user } = useSelector((state) => state.auth);
    const roleLabel = user?.role === 'freelancer' ? 'Freelancer' : user?.role === 'client' ? 'Client' : 'User';
    const [preferences, setPreferences] = useState({
        messages: true,
        jobUpdates: true,
        applicationStatus: true,
        freelancerProposals: true,
        directHireRequests: true,
    });

    const togglePreference = (key) => {
        setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 860 }}>
                <div className="page-hero" style={{ marginBottom: 24 }}>
                    <div>
                        <div className="page-hero-badge">Notification settings</div>
                        <h1 className="page-hero-title">Notification Preferences</h1>
                        <p className="text-muted text-sm" style={{ marginTop: 6 }}>
                            Manage how you receive alerts for messages, job activity, and account updates.
                        </p>
                    </div>
                    <div className="page-toolbar">
                        <div className="info-pill">{roleLabel}</div>
                        <div className="info-pill">Customizable</div>
                    </div>
                </div>

                <div className="section-card" style={{ marginBottom: 20, padding: '18px 20px' }}>
                    <div className="section-card-header">
                        <div>
                            <h2 className="heading-sm">Your preferences</h2>
                            <p className="text-sm text-muted">Toggle the alerts that matter most to you.</p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gap: 16 }}>
                        <label className="preference-toggle">
                            <span>Messages</span>
                            <div className={`toggle-switch ${preferences.messages ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={preferences.messages}
                                    onChange={() => togglePreference('messages')}
                                />
                                <span className="toggle-thumb" />
                            </div>
                        </label>
                        <label className="preference-toggle">
                            <span>Job updates</span>
                            <div className={`toggle-switch ${preferences.jobUpdates ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={preferences.jobUpdates}
                                    onChange={() => togglePreference('jobUpdates')}
                                />
                                <span className="toggle-thumb" />
                            </div>
                        </label>
                        <label className="preference-toggle">
                            <span>Application status</span>
                            <div className={`toggle-switch ${preferences.applicationStatus ? 'active' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={preferences.applicationStatus}
                                    onChange={() => togglePreference('applicationStatus')}
                                />
                                <span className="toggle-thumb" />
                            </div>
                        </label>
                        {user?.role === 'client' && (
                            <label className="preference-toggle">
                                <span>Freelancer proposals</span>
                                <div className={`toggle-switch ${preferences.freelancerProposals ? 'active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.freelancerProposals}
                                        onChange={() => togglePreference('freelancerProposals')}
                                    />
                                    <span className="toggle-thumb" />
                                </div>
                            </label>
                        )}
                        {user?.role === 'freelancer' && (
                            <label className="preference-toggle">
                                <span>Direct hire requests</span>
                                <div className={`toggle-switch ${preferences.directHireRequests ? 'active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.directHireRequests}
                                        onChange={() => togglePreference('directHireRequests')}
                                    />
                                    <span className="toggle-thumb" />
                                </div>
                            </label>
                        )}
                    </div>
                </div>

                <div className="section-card">
                    <div className="section-card-header">
                        <div>
                            <h2 className="heading-sm">Need help?</h2>
                            <p className="text-sm text-muted">Return to settings or review account privacy controls.</p>
                        </div>
                        <Link to="/settings" className="button button-secondary">Back to settings</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
