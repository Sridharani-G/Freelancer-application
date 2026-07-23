import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiUsers, FiCheckCircle, FiClock, FiPlus, FiCheck, FiX } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';
import DirectHirePanel from './DirectHirePanel';
import ProfileCompletionBanner from '../../components/dashboard/ProfileCompletionBanner';

export default function ClientDashboard() {
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const [jobs, setJobs] = useState([]);
    const [jobNotes, setJobNotes] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const { data } = await API.get('/jobs/my-jobs');
                setJobs(data.jobs || []);
            } catch (err) {
                toast.error('Failed to load your jobs');
            } finally {
                setLoading(false);
            }
        };

        loadJobs();
    }, []);

    const totalJobs = jobs.length;
    const totalApplications = jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0);
    const hiredApplicants = jobs.reduce((sum, job) => sum + (job.applications?.filter((app) => app.status === 'hired').length || 0), 0);
    const inProgressJobs = jobs.filter((job) => job.status === 'in-progress').length;
    const completedJobs = jobs.filter((job) => job.status === 'completed').length;

    const firstJobWithApplications = jobs.find((job) => (job.applications?.length || 0) > 0);
    const firstHiredJob = jobs.find((job) => job.applications?.some((app) => app.status === 'hired'));
    const firstInProgressJob = jobs.find((job) => job.status === 'in-progress');
    const firstJob = jobs[0];

    const handleStatusChange = async (jobId, appId, status) => {
        try {
            await API.put(`/applications/${appId}/status`, { status });
            setJobs((prev) => prev.map((job) => {
                if (job._id !== jobId) return job;
                return {
                    ...job,
                    status: status === 'hired' ? 'in-progress' : job.status,
                    applications: job.applications.map((app) => app._id === appId ? { ...app, status } : app),
                };
            }));
            toast.success(`Application ${status}!`);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to update application');
        }
    };

    const handleClientAction = async (jobId, action, notes = '') => {
        try {
            const { data } = await API.put(`/jobs/${jobId}/client-action`, { action, notes });
            setJobs((prev) => prev.map((job) => job._id === jobId ? { ...job, ...data.job } : job));
            if (action === 'approve') {
                toast.success('Project approved and marked complete. Payment released.');
            } else if (action === 'request_revision') {
                toast.success('Revision requested from the freelancer.');
            } else if (action === 'release_half') {
                toast.success('Half payment released.');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Unable to perform action');
        }
    };

    const updateJobNote = (jobId, value) => {
        setJobNotes((prev) => ({ ...prev, [jobId]: value }));
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>
                <div className="flex-between" style={{ marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div className="avatar avatar-md" style={{ overflow: 'hidden', flexShrink: 0, width: 52, height: 52, fontSize: '1.4rem' }}>
                            {user?.avatar
                                ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : (user?.name?.[0] || 'C')}
                        </div>
                        <div>
                            <h1 className="heading-md">Your posted jobs</h1>
                            <p className="text-muted text-sm" style={{ marginTop: 4 }}>See your jobs, review applicants, and track accepted work progress from one place.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <Link to="/jobs/create" className="btn btn-primary">
                            <FiPlus /> Post a Job
                        </Link>
                    </div>
                </div>

                <ProfileCompletionBanner user={user} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                    {[
                        { label: 'Jobs posted', value: totalJobs, icon: <FiBriefcase />, to: '/client/jobs/overview' },
                        { label: 'Applicants', value: totalApplications, icon: <FiUsers />, to: '/client/jobs/applicants' },
                        { label: 'Hired', value: hiredApplicants, icon: <FiCheckCircle />, to: '/client/jobs/hired' },
                        { label: 'In progress', value: inProgressJobs, icon: <FiClock />, to: '/client/jobs/in-progress' },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="card"
                            style={{ padding: 16, cursor: stat.to ? 'pointer' : 'default' }}
                            onClick={() => stat.to && navigate(stat.to)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: 'var(--primary)' }}>
                                {stat.icon}
                                <span className="text-sm text-muted">{stat.label}</span>
                            </div>
                            <div className="heading-md">{stat.value}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gap: 16, marginBottom: 20 }}>
                    <DirectHirePanel />
                </div>

                <div style={{ display: 'grid', gap: 16 }}>
                    {loading ? (
                        <div className="card" style={{ padding: 24 }}>Loading your jobs…</div>
                    ) : jobs.length === 0 ? (
                        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                            <p className="text-muted">You have not posted any jobs yet.</p>
                        </div>
                    ) : jobs.map((job, index) => (
                        <motion.div key={job._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="card" style={{ padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                                <div>
                                    <h3 className="heading-md" style={{ marginBottom: 4 }}>{job.title}</h3>
                                    <p className="text-sm text-muted">{job.description?.slice(0, 140)}{job.description?.length > 140 ? '…' : ''}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className={`badge ${job.status === 'in-progress' ? 'badge-warning' : job.status === 'completed' ? 'badge-success' : 'badge-primary'}`}>{job.status}</span>
                                    <span className="badge badge-secondary">₹{job.budget?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                                <span>Category: {job.category}</span>
                                <span>Applicants: {job.applications?.length || 0}</span>
                                <span>Hired: {job.applications?.filter((app) => app.status === 'hired').length || 0}</span>
                                <span>Progress: {job.status === 'completed' ? 'Completed' : job.status === 'in-progress' ? 'In progress' : 'Open'}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {job.applications?.length > 0 ? job.applications.map((app) => (
                                    <div key={app._id} style={{ padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                            <div className="avatar avatar-sm" style={{ overflow: 'hidden', flexShrink: 0, width: 36, height: 36, fontSize: '0.9rem' }}>
                                                {app.freelancer?.avatar
                                                    ? <img src={app.freelancer.avatar} alt={app.freelancer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : (app.freelancer?.name?.[0] || 'F')}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{app.freelancer?.name || 'Freelancer'}</div>
                                                <div className="text-xs text-muted">{app.freelancer?.email || ''}</div>
                                                <div className="text-sm" style={{ marginTop: 4, color: 'var(--text-muted)' }}>{app.proposal?.slice(0, 120)}{app.proposal?.length > 120 ? '…' : ''}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                            <span className={`badge ${app.status === 'hired' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : app.status === 'pending' ? 'badge-warning' : 'badge-primary'}`}>{app.status}</span>
                                            {app.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button className="btn btn-success btn-sm" onClick={() => handleStatusChange(job._id, app._id, 'hired')}>
                                                        <FiCheck /> Hire
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleStatusChange(job._id, app._id, 'rejected')}>
                                                        <FiX /> Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )) : <div className="text-sm text-muted">No applicants yet for this job.</div>}

                                {job.status === 'in-progress' && (
                                    <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 12, background: 'var(--surface)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                                            <div>
                                                <div className="font-semibold">Active project actions</div>
                                                <div className="text-xs text-muted">Progress: {job.projectProgress ?? 0}%</div>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <button className="btn btn-success btn-sm" onClick={() => handleClientAction(job._id, 'approve')}>
                                                    <FiCheck /> Approve Completion
                                                </button>
                                                <button className="btn btn-warning btn-sm" onClick={() => handleClientAction(job._id, 'release_half')}>
                                                    Half Payment
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                                            <textarea
                                                className="form-input"
                                                rows="3"
                                                placeholder="Revision instructions for the freelancer"
                                                value={jobNotes[job._id] || ''}
                                                onChange={(e) => updateJobNote(job._id, e.target.value)}
                                            />
                                            <button className="btn btn-secondary btn-sm" onClick={() => handleClientAction(job._id, 'request_revision', jobNotes[job._id] || '')}>
                                                Request Revision
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {job.status === 'completed' && job.paymentStatus === 'partial' && (
                                    <div className="text-sm text-muted">Partial payment has been released for this project.</div>
                                )}

                                {job.revisionRequested && (
                                    <div className="text-sm" style={{ color: '#dc2626', marginTop: 10 }}>
                                        Revision requested. Freelancer needs to update the project.
                                    </div>
                                )}

                                {job.reviewRequested && (
                                    <div className="text-sm" style={{ color: '#2563eb', marginTop: 10 }}>
                                        Project reached 100%. Please approve the completion or release final payment.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
