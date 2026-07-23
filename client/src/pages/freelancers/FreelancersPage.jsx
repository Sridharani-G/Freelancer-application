import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBookmark, FiDollarSign, FiTag, FiBriefcase, FiSearch, FiFilter, FiMapPin, FiStar } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

const normalizeSearch = (value) => String(value || '').toLowerCase().trim();
const tokenize = (text) => normalizeSearch(text).split(/\s+/).filter(Boolean);

const computeGigMatchScore = (gig, query) => {
    if (!query) return 0;
    const terms = tokenize(query);
    const fields = [
        gig.title,
        gig.description,
        gig.category,
        gig.subCategory,
        gig._freelancerName,
        gig._freelancerTitle,
        ...(gig.skills || []),
        ...(gig.tags || []),
    ].join(' ');
    const haystack = tokenize(fields);
    if (!haystack.length) return 0;
    const set = new Set(haystack);
    const found = terms.filter((term) => set.has(term)).length;
    return Math.round((found / Math.max(terms.length, 1)) * 100);
};

const computeExperienceYears = (experience = []) => {
    if (!Array.isArray(experience)) return 0;
    return experience.reduce((acc, exp) => {
        const from = exp.from ? new Date(exp.from) : null;
        const to = exp.isCurrent ? new Date() : exp.to ? new Date(exp.to) : null;
        if (!from || !to) return acc;
        return acc + Math.max(0, (to - from) / (1000 * 60 * 60 * 24 * 365));
    }, 0);
};

export default function FreelancersPage() {
    const [allGigs, setAllGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savedGigIds, setSavedGigIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: '',
        location: '',
        minPrice: '',
        maxPrice: '',
        minRating: '',
        minReviews: '',
        minExperience: '',
        minSuccessRate: '',
        sortBy: 'bestMatch',
    });

    useEffect(() => {
        API.get('/admin/freelancers')
            .then(res => {
                const freelancers = res.data?.freelancers || [];
                const gigs = freelancers.flatMap(freelancer => {
                    const publishedGigs = (freelancer.gigs || []).filter(g => g.isPublished !== false && (g.title || g.description));
                    const experienceYears = computeExperienceYears(freelancer.experience);
                    const location = freelancer.location?.city || freelancer.location?.state || freelancer.location?.country || freelancer.user?.location?.city || freelancer.user?.location?.state || freelancer.user?.location?.country || '';
                    return publishedGigs.map(gig => ({
                        ...gig,
                        _freelancerId: freelancer.user?._id || freelancer.user,
                        _freelancerName: freelancer.user?.name || 'Freelancer',
                        _freelancerAvatar: freelancer.user?.avatar || '',
                        _freelancerTitle: freelancer.title || '',
                        _freelancerRating: freelancer.rating > 0 ? freelancer.rating.toFixed(1) : null,
                        _freelancerReviews: freelancer.reviewsCount || 0,
                        _freelancerBadge: freelancer.badge || '',
                        _freelancerSuccessRate: freelancer.successRate || 0,
                        _freelancerExperience: Math.round(experienceYears),
                        _freelancerLocation: location,
                        _profileId: freelancer._id,
                    }));
                });
                setAllGigs(gigs);
            })
            .catch(() => setAllGigs([]))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem('skillSphere.savedGigIds') || '[]');
            if (Array.isArray(stored)) setSavedGigIds(stored);
        } catch {
            setSavedGigIds([]);
        }
    }, []);

    const handleSaveGig = (gigId, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (!gigId) return;
        setSavedGigIds(prev => {
            const next = prev.includes(gigId) ? prev.filter(id => id !== gigId) : [...prev, gigId];
            localStorage.setItem('skillSphere.savedGigIds', JSON.stringify(next));
            return next;
        });
        toast.success(savedGigIds.includes(gigId) ? 'Removed from saved' : 'Gig saved');
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const visibleGigs = useMemo(() => {
        const query = normalizeSearch(searchQuery);
        return allGigs
            .map((gig) => ({
                ...gig,
                _matchScore: computeGigMatchScore(gig, query),
            }))
            .filter((gig) => {
                if (filters.category && normalizeSearch(gig.category) !== normalizeSearch(filters.category)) return false;
                if (filters.location && !normalizeSearch(gig._freelancerLocation).includes(normalizeSearch(filters.location))) return false;
                if (filters.minPrice && Number(gig.cost || gig.hourlyRate || gig.projectQuote || 0) < Number(filters.minPrice)) return false;
                if (filters.maxPrice && Number(gig.cost || gig.hourlyRate || gig.projectQuote || 0) > Number(filters.maxPrice)) return false;
                if (filters.minRating && Number(gig._freelancerRating || 0) < Number(filters.minRating)) return false;
                if (filters.minReviews && Number(gig._freelancerReviews || 0) < Number(filters.minReviews)) return false;
                if (filters.minExperience && Number(gig._freelancerExperience || 0) < Number(filters.minExperience)) return false;
                if (filters.minSuccessRate && Number(gig._freelancerSuccessRate || 0) < Number(filters.minSuccessRate)) return false;
                if (query) {
                    return gig._matchScore > 0 || normalizeSearch(gig._freelancerName).includes(query) || normalizeSearch(gig.title).includes(query) || normalizeSearch(gig.description).includes(query);
                }
                return true;
            })
            .sort((a, b) => {
                switch (filters.sortBy) {
                    case 'priceAsc': return (Number(a.cost || a.hourlyRate || a.projectQuote || 0) - Number(b.cost || b.hourlyRate || b.projectQuote || 0));
                    case 'priceDesc': return (Number(b.cost || b.hourlyRate || b.projectQuote || 0) - Number(a.cost || a.hourlyRate || a.projectQuote || 0));
                    case 'rating': return (Number(b._freelancerRating || 0) - Number(a._freelancerRating || 0));
                    case 'reviews': return (Number(b._freelancerReviews || 0) - Number(a._freelancerReviews || 0));
                    case 'experience': return (Number(b._freelancerExperience || 0) - Number(a._freelancerExperience || 0));
                    case 'successRate': return (Number(b._freelancerSuccessRate || 0) - Number(a._freelancerSuccessRate || 0));
                    case 'bestMatch':
                    default:
                        return Number(b._matchScore || 0) - Number(a._matchScore || 0);
                }
            });
    }, [allGigs, searchQuery, filters]);

    if (loading) {
        return <div className="page flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;
    }

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, rgba(0,201,167,0.06), transparent 24%)', minHeight: '100vh' }}>
            <div className="container" style={{ padding: '36px 24px 64px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    <h1 className="heading-lg" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Browse freelancer gigs</h1>
                    <p className="text-muted" style={{ maxWidth: 680, fontSize: '1.1rem' }}>
                        Explore published service offers from top-rated freelancers and find the perfect match for your project.
                    </p>
                </div>

                <div className="section-card" style={{ marginBottom: 20, padding: 20 }}>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="input-group" style={{ flex: '1 1 260px', minWidth: 240 }}>
                            <FiSearch className="input-icon" />
                            <input
                                className="form-input"
                                placeholder="Search gigs by title, skills, category, freelancer name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-secondary" onClick={() => setShowFilters((prev) => !prev)}>
                            <FiFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>
                        <div className="select-group" style={{ minWidth: 180 }}>
                            <select className="form-input" value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)}>
                                <option value="bestMatch">Best Match</option>
                                <option value="priceAsc">Price: Low to High</option>
                                <option value="priceDesc">Price: High to Low</option>
                                <option value="rating">Rating</option>
                                <option value="reviews">Reviews</option>
                                <option value="experience">Experience</option>
                                <option value="successRate">Success Rate</option>
                            </select>
                        </div>
                    </div>

                    {showFilters && (
                        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <input className="form-input" value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} placeholder="Category" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Location</label>
                                <div className="input-group">
                                    <FiMapPin className="input-icon" />
                                    <input className="form-input" value={filters.location} onChange={(e) => handleFilterChange('location', e.target.value)} placeholder="City or country" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min Price</label>
                                <input type="number" className="form-input" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} placeholder="0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max Price</label>
                                <input type="number" className="form-input" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} placeholder="9999" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min Rating</label>
                                <input type="number" className="form-input" min="0" max="5" step="0.1" value={filters.minRating} onChange={(e) => handleFilterChange('minRating', e.target.value)} placeholder="4.0" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min Reviews</label>
                                <input type="number" className="form-input" value={filters.minReviews} onChange={(e) => handleFilterChange('minReviews', e.target.value)} placeholder="10" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min Experience (yrs)</label>
                                <input type="number" className="form-input" value={filters.minExperience} onChange={(e) => handleFilterChange('minExperience', e.target.value)} placeholder="2" />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min Success Rate (%)</label>
                                <input type="number" className="form-input" min="0" max="100" value={filters.minSuccessRate} onChange={(e) => handleFilterChange('minSuccessRate', e.target.value)} placeholder="90" />
                            </div>
                        </div>
                    )}
                </div>

                {visibleGigs.length === 0 ? (
                    <div className="card" style={{ padding: 48, textAlign: 'center' }}>
                        <FiBriefcase style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }} />
                        <p className="text-muted">No gigs matched your search criteria. Try broadening your keywords or removing some filters.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
                        {visibleGigs.map((gig, idx) => {
                            const gigId = gig._id || `${gig._freelancerId}-${idx}`;
                            const isSaved = savedGigIds.includes(gigId);
                            const mediaUrl = gig.thumbnailUrl || gig.introMediaUrl || '';
                            const price = gig.cost > 0
                                ? (gig.billingMode === 'project' ? `$${gig.cost}` : `$${gig.cost}/hr`)
                                : null;

                            return (
                                <motion.div
                                    key={gigId}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 4px 18px rgba(15,23,42,0.06)' }}
                                >
                                    {/* Thumbnail */}
                                    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: 'linear-gradient(135deg, #0ea5e9, #14b8a6)' }}>
                                        <Link to={`/freelancer/${gig._freelancerId}`} style={{ position: 'absolute', inset: 0 }}>
                                            {mediaUrl ? (
                                                gig.mediaType === 'video' ? (
                                                    <video src={mediaUrl} preload="metadata" muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <img src={mediaUrl} alt={gig.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                )
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                                                    {gig.title?.[0]?.toUpperCase() || 'G'}
                                                </div>
                                            )}
                                        </Link>

                                        {/* Save button */}
                                        <button
                                            type="button"
                                            onClick={e => handleSaveGig(gigId, e)}
                                            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', color: isSaved ? '#f97316' : '#fff', transition: 'all 0.2s', zIndex: 2 }}
                                        >
                                            <FiBookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
                                        </button>

                                        {/* Price badge */}
                                        {price && (
                                            <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 8, padding: '3px 10px', fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <FiDollarSign size={12} /> {price}
                                            </div>
                                        )}
                                    </div>

                                    {/* Body */}
                                    <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: 8 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <img
                                                src={gig._freelancerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${gig._freelancerName}`}
                                                alt={gig._freelancerName}
                                                referrerPolicy="no-referrer"
                                                style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                                            />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{gig._freelancerName}</span>
                                            {gig._freelancerBadge && (
                                                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>{gig._freelancerBadge}</span>
                                            )}
                                        </div>
                                        <Link
                                            to={`/freelancer/${gig._freelancerId}`}
                                            style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                                        >
                                            {gig.title || `${gig._freelancerTitle || 'Service offer'}`}
                                        </Link>
                                        {gig.description && (
                                            <p className="text-sm text-muted" style={{ lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                                                {gig.description}
                                            </p>
                                        )}
                                        {gig.category && (
                                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <FiTag size={12} style={{ color: 'var(--primary)' }} />
                                                <span className="text-sm text-muted">{gig.category}</span>
                                            </div>
                                        )}
                                        {gig._freelancerLocation && (
                                            <div className="text-sm text-muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <FiMapPin size={14} />{gig._freelancerLocation}
                                            </div>
                                        )}
                                        {gig._freelancerRating && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                                <svg fill="currentColor" viewBox="0 0 576 512" height="13" width="13" style={{ color: '#f59e0b' }}><path d="M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" /></svg>
                                                <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{gig._freelancerRating}</span>
                                                {gig._freelancerReviews > 0 && <span className="text-muted" style={{ fontSize: '0.85rem' }}>({gig._freelancerReviews})</span>}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                                        <Link
                                            to={`/freelancer/${gig._freelancerId}`}
                                            className="btn btn-primary btn-sm"
                                            style={{ width: '100%', justifyContent: 'center' }}
                                        >
                                            View Profile & Hire
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
