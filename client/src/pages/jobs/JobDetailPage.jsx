import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { fetchJob } from '../../redux/slices/jobsSlice';
import {
    FiMapPin, FiClock, FiDollarSign, FiCalendar, FiUsers, FiArrowLeft, FiBookmark, FiZap, FiUserPlus, FiStar
} from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentJob, loading } = useSelector((s) => s.jobs);
    const { user, isAuthenticated } = useSelector((s) => s.auth);
    const [applying, setApplying] = useState(false);
    const [showApplyForm, setShowApplyForm] = useState(false);
    const [form, setForm] = useState({ proposal: '', bidAmount: '', estimatedDuration: '' });
    const [requestingHireId, setRequestingHireId] = useState(null);
    const [requestedHireIds, setRequestedHireIds] = useState([]);

    useEffect(() => {
        dispatch(fetchJob(id));
    }, [id]);

    const job = currentJob?.job;
    const rankedFreelancers = currentJob?.rankedFreelancers || [];

    const handleApply = async (e) => {
        e.preventDefault();
        if (!isAuthenticated) return navigate('/login');
        setApplying(true);
        try {
            await API.post('/applications', { jobId: id, ...form, bidAmount: Number(form.bidAmount) });
            toast.success('Application submitted!');
            setShowApplyForm(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to apply');
        } finally { setApplying(false); }
    };

    const handleDirectHire = async (freelancerUserId) => {
        if (!isAuthenticated) return navigate('/login');
        setRequestingHireId(freelancerUserId);
        try {
            await API.post('/direct-hire', {
                freelancerId: freelancerUserId,
                jobTitle: job?.title || 'Direct hire request',
                message: `I would like to work with you on ${job?.title || 'this project'}.`,
            });
            setRequestedHireIds((prev) => (prev.includes(freelancerUserId) ? prev : [...prev, freelancerUserId]));
            toast.success('Hire request sent');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to send hire request');
        } finally { setRequestingHireId(null); }
    };

    if (loading || !job) {
        return (
            <div className="page container" style={{ padding: '40px 24px' }}>
                <div className="skeleton" style={{ height: 40, width: 200, marginBottom: 24 }} />
                <div className="skeleton" style={{ height: 300 }} />
            </div>
        );
    }

    const isClient = user?._id === job.client?._id?.toString();
    const isFreelancer = user?.role === 'freelancer';

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
                    <FiArrowLeft /> Back to Jobs
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                    {/* Main Content */}
                    <div>
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginBottom: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                <div>
                                    <span className="job-card-category" style={{ marginBottom: 8, display: 'block' }}>{job.category}</span>
                                    <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Outfit' }}>{job.title}</h1>
                                </div>
                                <span className={`badge ${job.status === 'open' ? 'badge-success' : job.status === 'in-progress' ? 'badge-warning' : 'badge-primary'}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
                                    {job.status}
                                </span>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-sm text-muted">
                                    <FiDollarSign /> Budget: <strong style={{ color: 'var(--text)' }}>₹{job.budget?.toLocaleString()}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-sm text-muted">
                                    <FiZap /> Level: <strong style={{ color: 'var(--text)' }}>{job.experienceLevel}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-sm text-muted">
                                    <FiClock /> Type: <strong style={{ color: 'var(--text)' }}>{job.jobType}</strong>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-sm text-muted">
                                    <FiUsers /> {job.applicationsCount} applicants
                                </div>
                                {job.deadline && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="text-sm text-muted">
                                        <FiCalendar /> Due: <strong>{new Date(job.deadline).toLocaleDateString()}</strong>
                                    </div>
                                )}
                            </div>

                            <h3 className="heading-sm" style={{ marginBottom: 12 }}>Job Description</h3>
                            <p style={{ lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{job.description}</p>

                            {job.skillsRequired?.length > 0 && (
                                <div style={{ marginTop: 24 }}>
                                    <h3 className="heading-sm" style={{ marginBottom: 12 }}>Required Skills</h3>
                                    <div className="job-card-skills">
                                        {job.skillsRequired.map(s => <span key={s} className="skill-tag" style={{ fontSize: '0.875rem', padding: '5px 14px' }}>{s}</span>)}
                                    </div>
                                </div>
                            )}

                            {/* Milestones */}
                            {job.milestones?.length > 0 && (
                                <div style={{ marginTop: 24 }}>
                                    <h3 className="heading-sm" style={{ marginBottom: 12 }}>Milestones</h3>
                                    {job.milestones.map((m, i) => (
                                        <div key={i} style={{ padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                                            <div>
                                                <div className="font-semibold text-sm">{m.title}</div>
                                                {m.description && <div className="text-xs text-muted">{m.description}</div>}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div className="font-semibold" style={{ color: 'var(--success)' }}>₹{m.amount?.toLocaleString()}</div>
                                                <span className={`badge badge-${m.status === 'approved' ? 'success' : m.status === 'pending' ? 'warning' : 'primary'}`}>{m.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>

                        {/* Apply Form */}
                        {isFreelancer && job.status === 'open' && (
                            <div className="card">
                                {!showApplyForm ? (
                                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                        <h3 className="heading-sm" style={{ marginBottom: 8 }}>Interested in this project?</h3>
                                        <p className="text-muted text-sm" style={{ marginBottom: 16 }}>Submit your proposal and bid to get hired.</p>
                                        <button className="btn btn-primary btn-lg" onClick={() => setShowApplyForm(true)}>Apply Now</button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleApply}>
                                        <h3 className="heading-sm" style={{ marginBottom: 20 }}>Submit Your Proposal</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            <div className="form-group">
                                                <label className="form-label">Your Proposal *</label>
                                                <textarea className="form-input" rows={5} placeholder="Describe your approach, relevant experience, and why you're the best fit..."
                                                    value={form.proposal} onChange={e => setForm(f => ({ ...f, proposal: e.target.value }))} required style={{ resize: 'vertical' }} />
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Your Bid (₹) *</label>
                                                    <input className="form-input" type="number" placeholder="Bid amount" value={form.bidAmount}
                                                        onChange={e => setForm(f => ({ ...f, bidAmount: e.target.value }))} required />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Estimated Duration</label>
                                                    <input className="form-input" placeholder="Duration" value={form.estimatedDuration}
                                                        onChange={e => setForm(f => ({ ...f, estimatedDuration: e.target.value }))} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <button type="submit" className="btn btn-primary" disabled={applying}>
                                                    {applying ? 'Submitting...' : 'Submit Proposal'}
                                                </button>
                                                <button type="button" className="btn btn-ghost" onClick={() => setShowApplyForm(false)}>Cancel</button>
                                            </div>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Client Info */}
                        <div className="card">
                            <h3 className="heading-sm" style={{ marginBottom: 14 }}>About the Client</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div className="avatar avatar-md" style={{ overflow: 'hidden', flexShrink: 0 }}>
                                    {job.client?.avatar
                                        ? <img src={job.client.avatar} alt={job.client.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                        : (job.client?.name?.[0] || 'C')}
                                </div>
                                <div>
                                    <div className="font-semibold">{job.client?.name}</div>
                                    <div className="text-xs text-muted">{job.client?.location?.city || 'Location not specified'}</div>
                                </div>
                            </div>
                            {isClient && (
                                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                                    <Link to={`/jobs/${id}/applications`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                        View Applications ({job.applicationsCount})
                                    </Link>
                                </div>
                            )}
                        </div>

                        {rankedFreelancers.length > 0 && (
                            <div className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <h3 className="heading-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <FiZap style={{ color: 'var(--primary)' }} /> AI Top Matches
                                    </h3>
                                    <span className="badge badge-primary">Recommended</span>
                                </div>
                                {rankedFreelancers.map((fp) => (
                                    <div key={fp._id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                                        <div className="avatar avatar-sm" style={{ overflow: 'hidden', flexShrink: 0 }}>
                                            {fp.user?.avatar
                                                ? <img src={fp.user.avatar} alt={fp.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                : (fp.user?.name?.[0] || 'F')}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="font-semibold text-sm">{fp.user?.name}</div>
                                            <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiStar style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {fp.rating || 'New'} • {fp.recommendation || 'Recommended'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                            <div className={`match-score ${fp.matchScore >= 80 ? 'match-score-high' : fp.matchScore >= 60 ? 'match-score-mid' : 'match-score-low'}`}>
                                                {fp.matchScore}%
                                            </div>
                                            {isClient && (
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDirectHire(fp.user?._id)} disabled={requestingHireId === fp.user?._id || requestedHireIds.includes(fp.user?._id)}>
                                                    <FiUserPlus /> {requestingHireId === fp.user?._id ? 'Sending…' : requestedHireIds.includes(fp.user?._id) ? 'Requested' : 'Invite'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
