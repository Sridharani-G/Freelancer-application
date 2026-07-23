import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiCheck, FiX, FiBriefcase, FiInbox, FiCpu, FiClock } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function ApplicationsPage() {
    const { id: jobId } = useParams();
    const { user } = useSelector((s) => s.auth);
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const isClient = user?.role === 'client';

    useEffect(() => {
        const endpoint = isClient && jobId ? `/applications/job/${jobId}` : '/applications/my';
        API.get(endpoint)
            .then(({ data }) => setApplications(data.applications || []))
            .catch(() => toast.error('Failed to load applications'))
            .finally(() => setLoading(false));
    }, [jobId]);

    const handleStatusChange = async (appId, status) => {
        try {
            const { data } = await API.put(`/applications/${appId}/status`, { status });
            setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
            toast.success(`Application ${status}!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed');
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>
                <h1 className="heading-md" style={{ marginBottom: 8 }}>{isClient ? 'Job Applications' : 'My Applications'}</h1>
                <p className="text-muted text-sm" style={{ marginBottom: 24 }}>{applications.length} total</p>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 16 }} />)}
                    </div>
                ) : applications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0' }}>
                        <FiInbox style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: 16 }} />
                        <h3 className="heading-sm" style={{ marginTop: 16 }}>No applications yet</h3>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {applications.map((app, i) => (
                            <motion.div key={app._id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                                    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flex: 1 }}>
                                        <div className="avatar avatar-md" style={{ overflow: 'hidden', flexShrink: 0 }}>
                                            {isClient
                                                ? (app.freelancer?.avatar
                                                    ? <img src={app.freelancer.avatar} alt={app.freelancer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : (app.freelancer?.name?.[0] || 'F'))
                                                : (app.job?.title?.[0] || 'J')}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            {isClient ? (
                                                <>
                                                    <div className="font-semibold">{app.freelancer?.name}</div>
                                                    <div className="text-xs text-muted">{app.freelancer?.email}</div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="font-semibold">{app.job?.title}</div>
                                                    <div className="text-xs text-muted">{app.job?.category} · ₹{app.job?.budget?.toLocaleString()}</div>
                                                </>
                                            )}
                                            <p className="text-sm" style={{ marginTop: 8, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                                                {app.proposal?.substring(0, 150)}{app.proposal?.length > 150 ? '...' : ''}
                                            </p>
                                            <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center' }}>
                                                <span className="font-semibold" style={{ color: 'var(--success)' }}>Bid: ₹{app.bidAmount?.toLocaleString()}</span>
                                                {app.aiMatchScore > 0 && (
                                                    <div className={`match-score ${app.aiMatchScore >= 80 ? 'match-score-high' : app.aiMatchScore >= 60 ? 'match-score-mid' : 'match-score-low'}`}>
                                                        <FiCpu style={{ marginRight: 4, verticalAlign: 'middle', display: 'inline-block' }} /> {app.aiMatchScore}% match
                                                    </div>
                                                )}
                                                {app.estimatedDuration && <span className="text-xs text-muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FiClock /> {app.estimatedDuration}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                                        <span className={`badge ${app.status === 'hired' ? 'badge-success' : app.status === 'pending' ? 'badge-warning' : app.status === 'rejected' ? 'badge-danger' : 'badge-primary'}`}>
                                            {app.status}
                                        </span>
                                        {isClient && app.status === 'pending' && (
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(app._id, 'hired')}>
                                                    <FiCheck /> Hire
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(app._id, 'rejected')}>
                                                    <FiX /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
