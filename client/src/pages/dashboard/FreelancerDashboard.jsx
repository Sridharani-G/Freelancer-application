import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bar } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { FiBriefcase, FiGrid, FiSend, FiCheck, FiX, FiZap, FiUserPlus } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';
import ProfileCompletionBanner from '../../components/dashboard/ProfileCompletionBanner';

Chart.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function FreelancerDashboard() {
    const { user } = useSelector((s) => s.auth);
    const navigate = useNavigate();
    const directHireRef = useRef(null);

    const [applications, setApplications] = useState([]);
    const [profile, setProfile] = useState(null);
    const [directHireRequests, setDirectHireRequests] = useState([]);
    const [progressInputs, setProgressInputs] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?._id) return;
        Promise.all([
            API.get('/applications/my').catch(() => ({ data: { applications: [] } })),
            API.get(`/users/${user._id}/freelancer-profile`).catch(() => ({ data: {} })),
            API.get('/direct-hire/freelancer').catch(() => ({ data: { requests: [] } })),
        ]).then(([appRes, profRes, hireRes]) => {
            setApplications(appRes.data.applications || []);
            setProfile(profRes.data.profile || profRes.data || null);
            setDirectHireRequests(hireRes.data.requests || []);
        }).finally(() => setLoading(false));
    }, [user?._id]);

    const applied = applications.length;
    const hired = applications.filter(a => a.status === 'hired').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    const pendingHireRequests = directHireRequests.filter(r => r.status === 'pending').length;

    const barData = {
        labels: ['Applied', 'Hired', 'Rejected'],
        datasets: [{
            label: 'Applications',
            data: [applied, hired, rejected],
            backgroundColor: ['#00c9a7', '#10b981', '#ef4444'],
            borderRadius: 8,
        }],
    };

    const stats = [
        { icon: <FiSend />, label: 'Applied', value: applied, color: '#00c9a7', bg: 'rgba(0,201,167,0.1)', onClick: () => navigate('/my-applications?status=pending') },
        { icon: <FiCheck />, label: 'Hired', value: hired, color: '#10b981', bg: 'rgba(16,185,129,0.1)', onClick: () => navigate('/my-applications?status=hired') },
        { icon: <FiX />, label: 'Rejected', value: rejected, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', onClick: () => navigate('/my-applications?status=rejected') },
        { icon: <FiUserPlus />, label: 'Direct Hire', value: pendingHireRequests, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', onClick: () => navigate('/direct-hire'), badge: pendingHireRequests > 0 },
    ];

    const updateHireStatus = async (id, status) => {
        try {
            await API.put(`/direct-hire/${id}/status`, { status });
            setDirectHireRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
        } catch { /* ignore */ }
    };

    const updateProjectProgress = async (jobId, value) => {
        try {
            const progress = Number(value);
            if (Number.isNaN(progress) || progress < 0 || progress > 100) {
                toast.error('Progress must be between 0 and 100.');
                return;
            }
            const { data } = await API.put(`/jobs/${jobId}/progress`, { progress });
            setApplications((prev) => prev.map((app) => {
                if (app.job?._id === jobId) {
                    return { ...app, job: { ...app.job, ...data.job } };
                }
                return app;
            }));
            toast.success('Progress updated. The client was notified.');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update progress');
        }
    };

    const handleProgressInput = (jobId, newValue) => {
        setProgressInputs((prev) => ({ ...prev, [jobId]: newValue }));
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>

                {/* Header */}
                <div className="flex-between" style={{ marginBottom: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="avatar avatar-md" style={{ overflow: 'hidden', flexShrink: 0, width: 52, height: 52, fontSize: '1.4rem' }}>
                            {user?.avatar
                                ? <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer"
                                    onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : (user?.name?.[0] || 'F')}
                        </div>
                        <div>
                            <h1 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                Hello, {user?.name?.split(' ')[0]} <FiZap />
                            </h1>
                            <p className="text-muted text-sm" style={{ marginTop: 4 }}>Your freelance journey overview</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Link to="/jobs" className="btn btn-primary"><FiBriefcase /> Browse Jobs</Link>
                        <Link to="/gigs/manage" className="btn btn-ghost"><FiGrid /> Gigs</Link>
                    </div>
                </div>

                <ProfileCompletionBanner user={user} profile={profile} />

                {/* Stat Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                    {stats.map((s, i) => (
                        <motion.div
                            key={s.label}
                            className="stat-card"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            onClick={s.onClick}
                            style={{ cursor: 'pointer', position: 'relative' }}
                            whileHover={{ scale: 1.03, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
                        >
                            {s.badge && (
                                <span style={{
                                    position: 'absolute', top: 10, right: 12,
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: '#8b5cf6',
                                    boxShadow: '0 0 6px rgba(139,92,246,0.8)',
                                }} />
                            )}
                            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
                            <div>
                                <div className="stat-value" style={{ color: s.color }}>{loading ? '—' : s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Direct Hire Requests panel */}
                <div ref={directHireRef} className="card" style={{ marginBottom: 24, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 className="heading-sm">Direct Hire Requests</h3>
                        <span className="badge badge-secondary">
                            <FiUserPlus style={{ marginRight: 4 }} />
                            {pendingHireRequests} pending
                        </span>
                    </div>
                    {directHireRequests.length === 0 ? (
                        <p className="text-sm text-muted">No direct hire requests yet.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {directHireRequests.map((request) => (
                                <div key={request._id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                            <div className="avatar avatar-sm" style={{ overflow: 'hidden', flexShrink: 0, width: 36, height: 36, fontSize: '0.9rem' }}>
                                                {request.client?.avatar
                                                    ? <img src={request.client.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : (request.client?.name?.[0] || '?')}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{request.client?.name}</div>
                                                <div className="text-xs text-muted">{request.jobTitle || 'Direct hire request'}</div>
                                                {request.message && <div className="text-sm" style={{ marginTop: 4 }}>{request.message}</div>}
                                            </div>
                                        </div>
                                        <span className={`badge ${request.status === 'accepted' ? 'badge-success' : request.status === 'rejected' ? 'badge-danger' : request.status === 'pending' ? 'badge-warning' : 'badge-primary'}`}>
                                            {request.status}
                                        </span>
                                    </div>
                                    {request.status === 'pending' && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                            <button className="btn btn-success btn-sm" onClick={() => updateHireStatus(request._id, 'accepted')}>
                                                <FiCheck /> Accept
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => updateHireStatus(request._id, 'rejected')}>
                                                <FiX /> Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Charts + Recent */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                    <div className="card">
                        <h3 className="heading-sm" style={{ marginBottom: 16 }}>Application Status</h3>
                        <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }} />
                    </div>

                    <div className="card">
                        <div className="flex-between" style={{ marginBottom: 16 }}>
                            <h3 className="heading-sm">Recent Applications</h3>
                            <Link to="/my-applications" className="btn btn-ghost btn-sm">All</Link>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {loading
                                ? [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 50 }} />)
                                : applications.slice(0, 4).map(a => (
                                    <div key={a._id} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div className="font-medium text-sm">{a.job?.title || 'Untitled'}</div>
                                            <div className="text-xs text-muted">₹{a.bidAmount?.toLocaleString()}</div>
                                        </div>
                                        <span className={`badge ${a.status === 'hired' ? 'badge-success' : a.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}>
                                            {a.status}
                                        </span>
                                    </div>
                                ))}
                            {!loading && applications.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <p className="text-muted text-sm">No applications yet. <Link to="/jobs" style={{ color: 'var(--primary)' }}>Browse jobs!</Link></p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
