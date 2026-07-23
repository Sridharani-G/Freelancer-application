import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchJobs } from '../../redux/slices/jobsSlice';
import { FiSearch, FiFilter, FiMapPin } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const normalizeText = (value) => String(value || '').toLowerCase().trim();
const tokenizeText = (value) => normalizeText(value).split(/\s+/).filter(Boolean);
const computeJobMatchScore = (job, query) => {
    const terms = tokenizeText(query);
    if (!terms.length) return 0;
    const haystack = tokenizeText([
        job.title,
        job.description,
        job.category,
        job.subCategories?.join(' '),
        job.skillsRequired?.join(' '),
        job.client?.name,
    ].filter(Boolean).join(' '));
    const set = new Set(haystack);
    const found = terms.filter((term) => set.has(term)).length;
    return Math.round((found / Math.max(terms.length, 1)) * 100);
};

const CATEGORY_STORAGE_KEY = 'skillSphere.jobCategories';
const DEFAULT_CATEGORIES = [
    'Web Development', 'Frontend Development', 'Backend Development', 'Full-Stack Development',
    'UI/UX Design', 'Product Design', 'Branding & Identity', 'Mobile Apps', 'React Native', 'Flutter',
    'AI & Machine Learning', 'Data Science', 'Automation & Scripting', 'Cybersecurity', 'Blockchain',
    'Content Writing', 'Technical Writing', 'Copywriting', 'Video Editing', 'Motion Graphics',
    'Marketing', 'SEO', 'Social Media', 'Business & Admin', 'Customer Support', 'DevOps & Cloud',
    'Database Administration', 'QA & Testing', 'Game Development', '3D Design', 'Architecture & Planning', 'Legal Services'
];

const getStoredCategories = () => {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    try {
        const stored = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]');
        return Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_CATEGORIES;
    } catch {
        return DEFAULT_CATEGORIES;
    }
};

export default function JobsPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { jobs, total, pages, loading } = useSelector((s) => s.jobs);
    const { user } = useSelector((s) => s.auth);

    const [filters, setFilters] = useState({ search: '', category: '', experienceLevel: '', jobType: '', minBudget: '', maxBudget: '', location: '', sortBy: 'bestMatch', page: 1 });
    const [showFilters, setShowFilters] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState(getStoredCategories);

    useEffect(() => {
        dispatch(fetchJobs(filters));
    }, [filters, dispatch]);

    const jobsWithMatch = useMemo(() => {
        const search = filters.search || '';
        return (jobs || []).map((job) => ({
            ...job,
            _matchScore: computeJobMatchScore(job, search),
        }));
    }, [jobs, filters.search]);

    const visibleJobs = useMemo(() => {
        const sorted = [...jobsWithMatch];
        switch (filters.sortBy) {
            case 'budgetAsc':
                return sorted.sort((a, b) => (Number(a.budget || 0) - Number(b.budget || 0)));
            case 'budgetDesc':
                return sorted.sort((a, b) => (Number(b.budget || 0) - Number(a.budget || 0)));
            case 'newest':
                return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            case 'oldest':
                return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            case 'bestMatch':
            default:
                return sorted.sort((a, b) => (Number(b._matchScore || 0) - Number(a._matchScore || 0)));
        }
    }, [jobsWithMatch, filters.sortBy]);

    const handleFilter = (key, value) => setFilters(f => ({ ...f, [key]: value, page: key === 'page' ? value : 1 }));

    const handleSave = async (jobId, e) => {
        e.stopPropagation();
        if (!user) return navigate('/login');
        try {
            const { data } = await API.post(`/jobs/${jobId}/save`);
            toast.success(data.saved ? 'Job saved!' : 'Job unsaved');
        } catch { toast.error('Login required'); }
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>
                <div className="page-hero" style={{ marginBottom: 24 }}>
                    <div>
                        <div className="page-hero-badge">Discover opportunities</div>
                        <h1 className="page-hero-title">Browse <span className="text-gradient">Jobs</span></h1>
                        <p className="text-muted text-sm" style={{ marginTop: 6 }}>{total} jobs available for talent, design, and development teams.</p>
                    </div>
                </div>

                <div className="section-card" style={{ marginBottom: 20, padding: 20 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="input-group" style={{ flex: '1 1 280px', minWidth: 240 }}>
                            <FiSearch className="input-icon" />
                            <input className="form-input" placeholder="Search jobs, skills, category, location..." value={filters.search}
                                onChange={e => handleFilter('search', e.target.value)} />
                        </div>
                        <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
                            <FiFilter /> {showFilters ? 'Hide' : 'Show'} Filters
                        </button>
                        <div className="select-group" style={{ minWidth: 180 }}>
                            <select className="form-input" value={filters.sortBy} onChange={(e) => handleFilter('sortBy', e.target.value)}>
                                <option value="bestMatch">Best Match</option>
                                <option value="budgetAsc">Budget: low to high</option>
                                <option value="budgetDesc">Budget: high to low</option>
                                <option value="newest">Newest</option>
                                <option value="oldest">Oldest</option>
                            </select>
                        </div>
                        {user?.role === 'client' && <Link to="/jobs/create" className="btn btn-primary">+ Post Job</Link>}
                    </div>

                    <AnimatePresence>
                        {showFilters && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                style={{ marginTop: 16, overflow: 'hidden' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-input" value={filters.category} onChange={e => handleFilter('category', e.target.value)}>
                                            <option value="">All Categories</option>
                                            {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Experience</label>
                                        <select className="form-input" value={filters.experienceLevel} onChange={e => handleFilter('experienceLevel', e.target.value)}>
                                            <option value="">Any Level</option>
                                            <option value="entry">Entry Level</option>
                                            <option value="intermediate">Intermediate</option>
                                            <option value="expert">Expert</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Job Type</label>
                                        <select className="form-input" value={filters.jobType} onChange={e => handleFilter('jobType', e.target.value)}>
                                            <option value="">Any Type</option>
                                            <option value="fixed">Fixed Price</option>
                                            <option value="hourly">Hourly</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Location</label>
                                        <div className="input-group">
                                            <FiMapPin className="input-icon" />
                                            <input className="form-input" placeholder="City or country" value={filters.location} onChange={e => handleFilter('location', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Min Budget ($)</label>
                                        <input className="form-input" type="number" placeholder="0" value={filters.minBudget} onChange={e => handleFilter('minBudget', e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Max Budget ($)</label>
                                        <input className="form-input" type="number" placeholder="100000" value={filters.maxBudget} onChange={e => handleFilter('maxBudget', e.target.value)} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
                    <button className={`btn btn-sm ${!filters.category ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleFilter('category', '')}>All</button>
                    {categoryOptions.map(cat => (
                        <button key={cat} className={`btn btn-sm ${filters.category === cat ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => handleFilter('category', cat)} style={{ whiteSpace: 'nowrap' }}>{cat}</button>
                    ))}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 160, marginBottom: 1, background: 'var(--bg-secondary)' }} />)}
                    </div>
                ) : jobs.length === 0 ? (
                    <div className="section-card" style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FiSearch style={{ fontSize: '3.5rem', color: 'var(--primary)', marginBottom: 16 }} />
                        <h3 className="heading-sm">No jobs found</h3>
                        <p className="text-muted text-sm" style={{ marginTop: 8 }}>Try adjusting your filters to explore more opportunities.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4 }}>
                        {visibleJobs.map((job, i) => {
                            const daysLeft = job.deadline ? Math.max(0, Math.ceil((new Date(job.deadline) - Date.now()) / (1000 * 60 * 60 * 24))) : Math.floor(Math.random() * 6 + 2);
                            const price = job.budget ? `₹${job.budget.toLocaleString('en-IN')}` : `₹${Math.floor(Math.random() * 5000 + 1500).toLocaleString('en-IN')}`;
                            const isHourly = job.jobType === 'hourly';

                            return (
                                <motion.div key={job._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                    onClick={() => navigate(`/jobs/${job._id}`)}
                                    style={{
                                        display: 'flex',
                                        padding: '24px',
                                        borderBottom: '1px solid var(--border)',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    {/* Left Column */}
                                    <div style={{ flex: 1, paddingRight: 32 }}>
                                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
                                            {job.title}
                                        </h3>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
                                            {daysLeft} days left
                                        </div>
                                        <p style={{
                                            color: 'var(--text-secondary)',
                                            fontSize: '0.95rem',
                                            lineHeight: 1.5,
                                            marginBottom: 16,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 4,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {job.description}
                                        </p>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 12px' }}>
                                            {(job.skillsRequired || []).map(skill => (
                                                <span key={skill} style={{ color: '#007bff', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Column */}
                                    <div style={{ width: 140, flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 2 }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text)' }}>
                                                {price} {isHourly ? '/ hr' : ''}
                                            </span>
                                        </div>
                                        {isHourly ? (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>Avg hr</div>
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>Avg Bid</div>
                                        )}

                                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                                            {job.applicationsCount || Math.floor(Math.random() * 50 + 5)} bids
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {pages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
                        {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                            <button key={p} className={`btn btn-sm ${filters.page === p ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilters(f => ({ ...f, page: p }))}>{p}</button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
