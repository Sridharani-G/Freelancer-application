import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiX, FiUserPlus, FiInbox, FiClock } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const STATUS_TABS = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'rejected', label: 'Rejected' },
];

const STATUS_STYLE = {
    pending: { badge: 'badge-warning', color: '#f59e0b' },
    accepted: { badge: 'badge-success', color: '#10b981' },
    rejected: { badge: 'badge-danger', color: '#ef4444' },
    withdrawn: { badge: 'badge-secondary', color: 'var(--text-muted)' },
};

export default function DirectHirePage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        API.get('/direct-hire/freelancer')
            .then(({ data }) => setRequests(data.requests || []))
            .catch(() => toast.error('Failed to load hire requests'))
            .finally(() => setLoading(false));
    }, []);

    const updateStatus = async (id, status) => {
        try {
            await API.put(`/direct-hire/${id}/status`, { status });
            setRequests(prev => prev.map(r => r._id === id ? { ...r, status } : r));
            toast.success(`Request ${status}`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Failed to update');
        }
    };

    const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);
    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 860 }}>

                {/* Header */}
                <div style={{ marginBottom: 28 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16, gap: 6 }}>
                        <FiArrowLeft /> Back
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 48, height: 48, borderRadius: 14,
                            background: 'rgba(139,92,246,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#8b5cf6', fontSize: '1.3rem',
                        }}>
                            <FiUserPlus />
                        </div>
                        <div>
                            <h1 className="heading-md" style={{ marginBottom: 4 }}>Direct Hire Requests</h1>
                            <p className="text-muted text-sm">{requests.length} total · {pendingCount} pending response</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
                    {STATUS_TABS.map(tab => {
                        const count = tab.key === 'all' ? requests.length : requests.filter(r => r.status === tab.key).length;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'none',
                                    border: 'none',
                                    borderBottom: isActive ? '2px solid #8b5cf6' : '2px solid transparent',
                                    color: isActive ? '#8b5cf6' : 'var(--text-muted)',
                                    fontWeight: isActive ? 700 : 500,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    marginBottom: -1,
                                    transition: 'all 0.15s',
                                    display: 'flex', alignItems: 'center', gap: 6,
                                }}
                            >
                                {tab.label}
                                <span style={{
                                    background: isActive ? 'rgba(139,92,246,0.15)' : 'var(--bg-muted)',
                                    color: isActive ? '#8b5cf6' : 'var(--text-muted)',
                                    borderRadius: 20, padding: '1px 7px', fontSize: '0.75rem', fontWeight: 700,
                                }}>
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* List */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="section-card" style={{ textAlign: 'center', padding: '64px 24px' }}>
                        <FiInbox style={{ fontSize: '3rem', color: '#8b5cf6', marginBottom: 14 }} />
                        <h3 className="heading-sm" style={{ marginBottom: 8 }}>No requests here</h3>
                        <p className="text-muted text-sm">
                            {activeTab === 'pending' && 'No pending requests at the moment.'}
                            {activeTab === 'accepted' && 'You have not accepted any requests yet.'}
                            {activeTab === 'rejected' && 'No rejected requests.'}
                            {activeTab === 'all' && 'No direct hire requests yet.'}
                        </p>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.18 }}
                            style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                        >
                            {filtered.map((request, i) => (
                                <motion.div
                                    key={request._id}
                                    className="section-card"
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{ padding: '18px 20px' }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                                            {/* Avatar */}
                                            <div className="avatar avatar-md" style={{ overflow: 'hidden', flexShrink: 0, width: 46, height: 46, fontSize: '1.1rem' }}>
                                                {request.client?.avatar
                                                    ? <img src={request.client.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : (request.client?.name?.[0] || '?')}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div className="font-semibold" style={{ fontSize: '1rem', marginBottom: 2 }}>
                                                    {request.client?.name || 'Client'}
                                                </div>
                                                <div className="text-xs text-muted" style={{ marginBottom: 6 }}>
                                                    {request.client?.email}
                                                </div>
                                                {request.jobTitle && (
                                                    <div className="text-sm" style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: 4 }}>
                                                        {request.jobTitle}
                                                    </div>
                                                )}
                                                {request.message && (
                                                    <p className="text-sm text-muted" style={{ lineHeight: 1.5 }}>{request.message}</p>
                                                )}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                                                    <FiClock size={11} />
                                                    {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10, flexShrink: 0 }}>
                                            <span className={`badge ${STATUS_STYLE[request.status]?.badge || 'badge-secondary'}`}
                                                style={{ textTransform: 'capitalize', padding: '4px 12px' }}>
                                                {request.status}
                                            </span>
                                            {request.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-success btn-sm"
                                                        onClick={() => updateStatus(request._id, 'accepted')}>
                                                        <FiCheck /> Accept
                                                    </button>
                                                    <button className="btn btn-danger btn-sm"
                                                        onClick={() => updateStatus(request._id, 'rejected')}>
                                                        <FiX /> Reject
                                                    </button>
                                                </div>
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
