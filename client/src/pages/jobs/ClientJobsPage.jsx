import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBriefcase, FiUsers, FiCheckCircle, FiClock, FiPlus, FiArrowLeft, FiMail } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const SECTION_CONFIG = {
  overview: { title: 'Your Jobs', subtitle: 'Manage posted jobs and review recent activity.', icon: <FiBriefcase /> },
  applicants: { title: 'Applicants', subtitle: 'Review applications across your open jobs.', icon: <FiUsers /> },
  hired: { title: 'Hired', subtitle: 'Track freelancers you have hired and progress on their work.', icon: <FiCheckCircle /> },
  'in-progress': { title: 'In Progress', subtitle: 'Manage jobs currently being worked on.', icon: <FiClock /> },
};

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'applicants', label: 'Applicants' },
  { key: 'hired', label: 'Hired' },
  { key: 'in-progress', label: 'In progress' },
];

export default function ClientJobsPage() {
  const { view } = useParams();
  const navigate = useNavigate();
  const section = ['overview', 'applicants', 'hired', 'in-progress'].includes(view) ? view : 'overview';

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const { data } = await API.get('/jobs/my-jobs');
        setJobs(data.jobs || []);
      } catch (err) {
        toast.error('Failed to load your jobs.');
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  const sectionData = SECTION_CONFIG[section];

  const allApplications = useMemo(() => jobs.flatMap((job) => (job.applications || []).map((app) => ({ ...app, job }))), [jobs]);
  const applicants = allApplications.filter((app) => app.status !== 'hired' && app.status !== 'rejected');
  const hired = allApplications.filter((app) => app.status === 'hired');
  const inProgressJobs = jobs.filter((job) => job.status === 'in-progress');

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'grid', gap: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 16 }} />)}
        </div>
      );
    }

    if (section === 'overview') {
      if (jobs.length === 0) {
        return (
          <div className="card" style={{ padding: 28, textAlign: 'center' }}>
            <p className="text-muted">You have not posted any jobs yet.</p>
            <Link to="/jobs/create" className="btn btn-primary" style={{ marginTop: 16 }}>
              <FiPlus /> Post a job
            </Link>
          </div>
        );
      }

      return (
        <div style={{ display: 'grid', gap: 16 }}>
          {jobs.map((job) => (
            <motion.div key={job._id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 className="heading-sm" style={{ marginBottom: 6 }}>{job.title}</h3>
                  <p className="text-sm text-muted">{job.description?.slice(0, 120)}{job.description?.length > 120 ? '…' : ''}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className={`badge ${job.status === 'completed' ? 'badge-success' : job.status === 'in-progress' ? 'badge-warning' : 'badge-primary'}`}>{job.status}</span>
                  <span className="badge badge-secondary">₹{job.budget?.toLocaleString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/jobs/${job._id}`)}>View job</button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/jobs/${job._id}/applications`)}>
                  View applications ({job.applications?.length || 0})
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    const list = section === 'applicants' ? applicants : section === 'hired' ? hired : inProgressJobs;
    const emptyState = section === 'applicants'
      ? 'No applications yet across your jobs.'
      : section === 'hired'
        ? 'No hired freelancers yet.'
        : 'No active projects currently in progress.';

    if (list.length === 0) {
      return (
        <div className="card" style={{ padding: 28, textAlign: 'center' }}>
          <p className="text-muted">{emptyState}</p>
          <Link to="/jobs/create" className="btn btn-primary" style={{ marginTop: 16 }}>
            <FiPlus /> Post a job
          </Link>
        </div>
      );
    }

    if (section === 'in-progress') {
      return (
        <div style={{ display: 'grid', gap: 16 }}>
          {list.map((job) => (
            <motion.div key={job._id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 className="heading-sm" style={{ marginBottom: 6 }}>{job.title}</h3>
                  <p className="text-sm text-muted">{job.description?.slice(0, 120)}{job.description?.length > 120 ? '…' : ''}</p>
                </div>
                <span className="badge badge-warning">In progress</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <span className="text-sm text-muted">Applicants: {job.applications?.length || 0}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/jobs/${job._id}`)}>View job</button>
              </div>
            </motion.div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        {list.map((item) => {
          const app = section === 'applicants' || section === 'hired' ? item : null;
          return (
            <motion.div key={app?._id || item._id} className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <h3 className="heading-sm" style={{ marginBottom: 6 }}>{app?.freelancer?.name || item.title}</h3>
                  <p className="text-sm text-muted">{app ? app.proposal?.slice(0, 120) : item.description?.slice(0, 120)}{(app ? app.proposal : item.description)?.length > 120 ? '…' : ''}</p>
                </div>
                <span className={`badge ${section === 'hired' ? 'badge-success' : 'badge-primary'}`}>{section === 'hired' ? 'Hired' : app?.status || item.status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: 'var(--text-muted)' }}>
                  {app && (
                    <>
                      <span>{app.job?.title}</span>
                      <span>Bid: ₹{app.bidAmount?.toLocaleString()}</span>
                    </>
                  )}
                  {!app && <span>Budget: ₹{item.budget?.toLocaleString()}</span>}
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(app ? `/jobs/${app.job?._id}/applications` : `/jobs/${item._id}`)}>
                  View details
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page">
      <div className="container" style={{ padding: '32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 16, gap: 6 }}>
              <FiArrowLeft /> Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div className="avatar avatar-md" style={{ width: 52, height: 52, background: 'var(--surface)', display: 'grid', placeItems: 'center' }}>
                {sectionData.icon}
              </div>
              <div>
                <h1 className="heading-md" style={{ marginBottom: 6 }}>{sectionData.title}</h1>
                <p className="text-muted text-sm">{sectionData.subtitle}</p>
              </div>
            </div>
          </div>
          <Link to="/jobs/create" className="btn btn-primary" style={{ minWidth: 160 }}>
            <FiPlus /> Post a job
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`btn ${section === tab.key ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => navigate(`/client/jobs/${tab.key}`)}
              style={{ justifyContent: 'flex-start' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderContent()}
      </div>
    </div>
  );
}
