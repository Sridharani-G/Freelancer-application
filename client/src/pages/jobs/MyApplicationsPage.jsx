import { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiSend, FiCheck, FiClock, FiX, FiInbox, FiArrowLeft, FiCpu, FiDollarSign, FiExternalLink
} from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
    { key: 'all', label: 'All', icon: <FiInbox />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { key: 'pending', label: 'Applied', icon: <FiSend />, color: '#00c9a7', bg: 'rgba(0,201,167,0.1)' },
    { key: 'hired', label: 'Hired', icon: <FiCheck />, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { key: 'rejected', label: 'Rejected', icon: <FiX />, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
];

const STATUS_BADGE = {
    pending: 'badge-warning',
    shortlisted: 'badge-primary',
    hired: 'badge-success',
    rejected: 'badge-danger',
    withdrawn: 'badge-secondary',
};

export default function MyApplicationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const initialStatus = searchParams.get('status') || 'all';
    const [activeTab, setActiveTab] = useState(initialStatus);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/applications/my')
            .then(({ data }) => setApplications(data.applications || []))
            .catch(() => toast.error('Failed to load applications'))
            .finally(() => setLoading(false));
    }, []);

    const handleTabChange = (key) => {
        setActiveTab(key);
        setSearchParams(key === 'all' ? {} : { status: key });
    };

    const filtered = useMemo(() => {
        if (activeTab === 'all') return applications;
        // "pending" tab maps to both 'pending' and 'shortlisted' statuses (i.e. "applied but not yet resolved")
        if (activeTab === 'pending') return applications.filter(a => a.status === 'pending' || a.status === 'shortlisted');
        return applications.filter(a => a.status === activeTab);
    }, [applications, activeTab]);

    const counts = useMemo(() => ({
        all: applications.length,
        pending: applications.filter(a => a.status === 'pending' || a.status === 'shortlisted').length,
        hired: applications.filter(a => a.status === 'hired').length,
        rejected: applications.filter(a => a.status === 'rejected').length,
    }), [applications]);

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 900 }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16, gap: 6 }}>
                        <FiArrowLeft /> Back
                    </button>
                    <h1 className="heading-md" style={{ marginBottom: 6 }}>My Applications</h1>
                    <p className="text-muted text-sm">{applications.length} total applications submitted</p>
                </div>

                {/* Stat Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
                    {STATUS_TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => handleTabChange(tab.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    padding: '14px 16px',
                                    border: isActive ? `2px solid ${tab.color}` : '2px solid var(--border)',
                                    borderRadius: 14,
                                    background: isActive ? tab.bg : 'var(--surface)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    outline: 'none',
                                    width: '100%',
                                    textAlign: 'left',
                                }}
                            >
                                <span style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    background: isActive ? tab.bg : 'var(--bg-muted)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: isActive ? tab.color : 'var(--text-muted)',
                                    fontSize: '1rem', flexShrink: 0,
                                    transition: 'all 0.2s',
                                }}>
                                    {tab.icon}
                                </span>
                                <span>
                                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: isActive ? tab.color : 'var(--text)', lineHeight: 1 }}>
                                        {loading ? '—' : counts[tab.key]}
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{tab.label}</div>
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Application List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 16 }} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="section-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
                        <FiInbox style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: 14 }} />
                        <h3 className="heading-sm" style={{ marginBottom: 8 }}>No applications here</h3>
                        <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
                            {activeTab === 'pending' && 'You have no pending applications right now.'}
                            {activeTab === 'hired' && 'You have not been hired for any job yet.'}
                            {activeTab === 'rejected' && 'No rejected applications — great!'}
                            {activeTab === 'all' && 'You have not applied to any jobs yet.'}
                        </p>
                        <Link to="/jobs" className="btn btn-primary">Browse Jobs</Link>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                        >
                            {filtered.map((app, i) => (
                                <motion.div
                                    key={app._id}
                                    className="section-card"
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.04 }}
                                    style={{ padding: '18px 20px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                                            {/* Job Initial Avatar */}
                                            <div style={{
                                                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                                                background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                color: '#fff', fontWeight: 800, fontSize: '1.1rem',
                                            }}>
                                                {app.job?.title?.[0]?.toUpperCase() || 'J'}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                                                    <span className="font-semibold" style={{ fontSize: '1rem', color: 'var(--text)' }}>
                                                        {app.job?.title || 'Untitled Job'}
                                                    </span>
                                                    {app.job?.category && (
                                                        <span className="badge badge-secondary" style={{ fontSize: '0.72rem' }}>{app.job.category}</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted" style={{ marginBottom: 10, lineHeight: 1.5 }}>
                                                    {app.proposal?.substring(0, 160)}{app.proposal?.length > 160 ? '…' : ''}
                                                </p>
                                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>
                                                        <FiDollarSign size={14} />
                                                        Bid: ₹{app.bidAmount?.toLocaleString('en-IN')}
                                                    </span>
                                                    {app.job?.budget && (
                                                        <span className="text-xs text-muted">Budget: ₹{app.job.budget?.toLocaleString('en-IN')}</span>
                                                    )}
                                                    {app.aiMatchScore > 0 && (
                                                        <span className={`badge ${app.aiMatchScore >= 80 ? 'badge-success' : app.aiMatchScore >= 60 ? 'badge-warning' : 'badge-danger'}`}
                                                            style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                            <FiCpu size={11} /> {app.aiMatchScore}% match
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-muted">
                                                        Applied {new Date(app.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right side: status + action */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                                            <span className={`badge ${STATUS_BADGE[app.status] || 'badge-secondary'}`} style={{ textTransform: 'capitalize', fontSize: '0.82rem', padding: '4px 12px' }}>
                                                {app.status === 'pending' ? 'Applied' : app.status}
                                            </span>
                                            {app.job?._id && (
                                                <Link to={`/jobs/${app.job._id}`} className="btn btn-ghost btn-sm" style={{ gap: 4, fontSize: '0.8rem' }}>
                                                    View Job <FiExternalLink size={12} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
}
