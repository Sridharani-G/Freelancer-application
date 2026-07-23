import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiGithub, FiLinkedin, FiGlobe, FiStar, FiAward, FiMapPin, FiVideo, FiMessageSquare, FiBriefcase, FiClock, FiRefreshCw, FiCheckCircle, FiBookmark } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import toast from 'react-hot-toast';

export default function FreelancerProfilePage() {
    const { id } = useParams();
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [profile, setProfile] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('overview');
    const [reviewForm, setReviewForm] = useState({ stars: 5, comment: '', pros: '', cons: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [requestingHire, setRequestingHire] = useState(false);
    const [hireRequested, setHireRequested] = useState(false);
    const [savedGigIds, setSavedGigIds] = useState([]);

    useEffect(() => {
        Promise.all([
            API.get(`/users/${id}/freelancer-profile`).catch(() => ({ data: { profile: null } })),
            API.get(`/reviews/user/${id}`).catch(() => ({ data: { reviews: [] } })),
        ]).then(([profRes, revRes]) => {
            setProfile(profRes.data?.profile || profRes.data);
            setReviews(revRes.data.reviews || []);
        }).finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const stored = JSON.parse(localStorage.getItem('skillSphere.savedGigIds') || '[]');
            if (Array.isArray(stored)) setSavedGigIds(stored);
        } catch {
            setSavedGigIds([]);
        }
    }, []);

    const handleReviewSubmit = async (event) => {
        event.preventDefault();
        if (!isAuthenticated || user?.role !== 'client') {
            toast.error('Only clients can leave a review.');
            return;
        }
        if (!reviewForm.comment.trim()) {
            toast.error('Please write a brief review before submitting.');
            return;
        }

        setSubmittingReview(true);
        try {
            const { data } = await API.post('/reviews', {
                revieweeId: id,
                stars: Number(reviewForm.stars),
                comment: reviewForm.comment,
                pros: reviewForm.pros,
                cons: reviewForm.cons,
            });
            setReviews(prev => [{
                ...data.review,
                reviewer: { _id: user?._id, name: user?.name, avatar: user?.avatar || '' },
                createdAt: new Date().toISOString(),
            }, ...prev]);
            setReviewForm({ stars: 5, comment: '', pros: '', cons: '' });
            toast.success('Review submitted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return <div className="page flex-center" style={{ minHeight: '60vh' }}><div className="spinner" /></div>;

    const fp = profile || {};
    const profileTypeLabel = fp?.user?.role === 'client' ? 'Client' : 'Freelance';
    const locationText = [fp?.location?.address, fp?.location?.city, fp?.location?.state, fp?.location?.country].filter(Boolean).join(', ');
    const mapUrl = locationText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}` : '';
    const introMediaUrl = fp?.introMediaUrl || fp?.videoIntroUrl || fp?.introVideoUrl || fp?.videoUrl;
    const introMediaType = fp?.introMediaType || (introMediaUrl?.match(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i) ? 'image' : 'video');
    const visibleGigs = (fp?.gigs || []).filter((gig) => {
        if (gig?.isPublished === false) return false;

        const hasMedia = Boolean(
            gig?.thumbnailUrl ||
            gig?.mediaUrl ||
            gig?.imageUrl ||
            gig?.videoUrl ||
            gig?.introMediaUrl ||
            gig?.introVideoUrl ||
            gig?.coverImageUrl
        );
        const hasContent = Boolean(
            gig?.title?.trim() ||
            gig?.description?.trim() ||
            gig?.category?.trim() ||
            gig?.cost ||
            gig?.liveUrl?.trim()
        );

        return hasMedia || hasContent;
    });
    const isClient = isAuthenticated && user?.role === 'client';
    const profileTabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'about', label: 'About' },
        { key: 'gigs', label: 'Gigs' },
        { key: 'posts', label: 'Posts' },
        { key: 'reviews', label: 'Reviews' },
    ];

    const handleDirectHire = async () => {
        if (!fp?.user?._id) return;
        setRequestingHire(true);
        try {
            await API.post('/direct-hire', {
                freelancerId: fp.user._id,
                jobTitle: 'Direct hire request',
                message: 'I would like to work with you on a project.',
            });
            setHireRequested(true);
            toast.success('Hire request sent');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to send hire request');
        } finally {
            setRequestingHire(false);
        }
    };

    const handleSaveGig = (gigIdentifier, event) => {
        event?.preventDefault();
        event?.stopPropagation();
        if (!gigIdentifier) return;
        setSavedGigIds((prev) => {
            const next = prev.includes(gigIdentifier) ? prev.filter((id) => id !== gigIdentifier) : [...prev, gigIdentifier];
            if (typeof window !== 'undefined') {
                localStorage.setItem('skillSphere.savedGigIds', JSON.stringify(next));
            }
            return next;
        });
        toast.success('Gig saved');
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card profile-hero-card" style={{ marginBottom: 20, background: 'linear-gradient(135deg, rgba(0,201,167,0.12), rgba(14,165,233,0.08))' }}>
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', width: '100%' }}>
                        <div className="avatar avatar-xl" style={{ width: 92, height: 92, fontSize: '2rem', overflow: 'hidden', flexShrink: 0 }}>
                            {fp?.user?.avatar
                                ? <img src={fp.user.avatar} alt={fp.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                : (fp?.user?.name?.[0] || '?')}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div>
                                    <div className="page-hero-badge" style={{ marginBottom: 6 }}>Professional profile</div>
                                    <h1 className="page-hero-title" style={{ fontSize: '1.65rem' }}>{fp?.user?.name || 'Freelancer'}</h1>
                                    <p style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>{fp?.title || 'Professional Freelancer'}</p>
                                    {locationText && (
                                        <>
                                            <p className="text-sm text-muted" style={{ marginTop: 6, display: 'flex', gap: 4, alignItems: 'center' }}>
                                                <FiMapPin size={13} /> {locationText}
                                            </p>
                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                                                <a href={mapUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                    <FiMapPin size={14} /> View map
                                                </a>
                                                {isClient && fp?.user?._id && (
                                                    <Link to={`/chat/${fp.user._id}?shareLocation=1`} className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                        <FiMessageSquare /> Share location
                                                    </Link>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span className={`badge badge-${fp?.badge?.toLowerCase() || 'bronze'}`} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                                        <FiAward /> {fp?.badge || 'Bronze'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                                <div className="stat-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    {fp?.rating?.toFixed(1) || '0.0'} <FiStar style={{ color: '#f59e0b', fill: '#f59e0b' }} />
                                </div>
                                <div className="stat-pill">{fp?.completedProjects || 0} projects</div>
                                <div className="stat-pill">{fp?.successRate || 100}% success</div>
                                <div className="stat-pill">${fp?.hourlyRate || 0}/hr</div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                                {fp?.githubUrl && <a href={fp.githubUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiGithub /> GitHub</a>}
                                {fp?.linkedinUrl && <a href={fp.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiLinkedin /> LinkedIn</a>}
                                {fp?.websiteUrl && <a href={fp.websiteUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiGlobe /> Website</a>}
                                {isAuthenticated && user?.role === 'client' && fp?.user?._id && (
                                    <>
                                        <Link to={`/chat/${fp.user._id}`} className="btn btn-primary btn-sm"><FiMessageSquare /> Message</Link>
                                        <button type="button" className="btn btn-ghost btn-sm" onClick={handleDirectHire} disabled={requestingHire || hireRequested}>
                                            {requestingHire ? 'Sending…' : hireRequested ? 'Request sent' : 'Send hire request'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="section-card" style={{ marginBottom: 20, padding: '18px 20px' }}>
                    <div className="metric-grid">
                        <div className="metric-card">
                            <span>Availability</span>
                            <strong>{fp?.availability || 'Full time'}</strong>
                        </div>
                        <div className="metric-card">
                            <span>Rate</span>
                            <strong>${fp?.hourlyRate || 0}/hr</strong>
                        </div>
                        <div className="metric-card">
                            <span>Profile type</span>
                            <strong>{profileTypeLabel}</strong>
                        </div>
                        <div className="metric-card">
                            <span>Response</span>
                            <strong>Fast</strong>
                        </div>
                    </div>
                </div>

                <div className="tabs" style={{ marginBottom: 20 }}>
                    {profileTabs.map((item) => (
                        <button key={item.key} className={`tab ${tab === item.key ? 'active' : ''}`} onClick={() => setTab(item.key)}>{item.label}</button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="section-card">
                                <h3 className="heading-sm" style={{ marginBottom: 12 }}>Quick overview</h3>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <span className="text-sm text-muted">Availability</span>
                                        <span className={`badge badge-${(fp?.availability || 'available').toLowerCase() === 'unavailable' ? 'danger' : 'success'}`} style={{ textTransform: 'capitalize' }}>{fp?.availability || 'Available'}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <span className="text-sm text-muted">Success rate</span>
                                        <strong>{fp?.successRate || 100}%</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <span className="text-sm text-muted">Working time</span>
                                        <strong>{fp?.workingTime?.trim() ? fp.workingTime : 'Unavailable'}</strong>
                                    </div>
                                </div>
                            </div>
                            {fp?.bio && (
                                <div className="section-card">
                                    <h3 className="heading-sm" style={{ marginBottom: 10 }}>About</h3>
                                    <p style={{ lineHeight: 1.8, color: 'var(--text-muted)', fontSize: '0.92rem' }}>{fp.bio}</p>
                                </div>
                            )}
                            {fp?.skills?.length > 0 && (
                                <div className="section-card">
                                    <h3 className="heading-sm" style={{ marginBottom: 10 }}>Skills</h3>
                                    <div className="job-card-skills">
                                        {fp.skills.map((skill) => <span key={skill} className="skill-tag" style={{ padding: '5px 14px', fontSize: '0.875rem' }}>{skill}</span>)}
                                    </div>
                                </div>
                            )}
                            {fp?.experience?.length > 0 && (
                                <div className="section-card">
                                    <h3 className="heading-sm" style={{ marginBottom: 10 }}>Experience</h3>
                                    {fp.experience.map((entry, index) => (
                                        <div key={index} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: index < fp.experience.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                            <div className="font-semibold">{entry.role}</div>
                                            <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{entry.company}</div>
                                            <div className="text-xs text-muted">{entry.from && new Date(entry.from).getFullYear()} — {entry.isCurrent ? 'Present' : entry.to && new Date(entry.to).getFullYear()}</div>
                                            {entry.description && <p className="text-sm text-muted" style={{ marginTop: 6 }}>{entry.description}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {introMediaUrl ? (
                                <div className="section-card">
                                    <h3 className="heading-sm" style={{ marginBottom: 10 }}><FiVideo /> {introMediaType === 'image' ? 'Intro image' : 'Intro video'}</h3>
                                    <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-muted)' }}>
                                        {introMediaType === 'image' ? (
                                            <img src={introMediaUrl} alt="Freelancer intro media" style={{ width: '100%', display: 'block', objectFit: 'cover', maxHeight: 280 }} />
                                        ) : (
                                            <video controls preload="metadata" src={introMediaUrl} style={{ width: '100%', display: 'block' }} />
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="section-card" style={{ padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <FiVideo style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: 8 }} />
                                    <p className="text-sm text-muted">No intro media yet. Add a video or image link to make this profile feel more complete.</p>
                                </div>
                            )}
                            <div className="section-card">
                                <h3 className="heading-sm" style={{ marginBottom: 10 }}>Recent activity</h3>
                                <p className="text-sm text-muted">This profile highlights featured work, portfolio updates, and client feedback in a polished feed-style layout.</p>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'about' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 12 }}>Profile information</h3>
                            <div style={{ display: 'grid', gap: 12 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                                    <div>
                                        <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Name</div>
                                        <div className="font-semibold">{fp?.user?.name || 'Freelancer'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Experience</div>
                                        <div className="font-semibold">{fp?.experience?.length > 0 ? `${fp.experience.length} entry${fp.experience.length > 1 ? 'ies' : 'y'}` : 'Not provided'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Education</div>
                                        <div className="font-semibold">{fp?.education?.length > 0 ? `${fp.education.length} entry${fp.education.length > 1 ? 'ies' : 'y'}` : 'Not provided'}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-muted" style={{ marginBottom: 4 }}>Location</div>
                                        <div className="font-semibold">{fp?.location?.city || fp?.location?.country ? `${fp.location.city || ''}${fp.location.city && fp.location.country ? ', ' : ''}${fp.location.country || ''}`.trim() : 'Not provided'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 10 }}>Experience</h3>
                            {fp?.experience?.length > 0 ? fp.experience.map((entry, index) => (
                                <div key={index} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: index < fp.experience.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="font-semibold">{entry.role || 'Role not specified'}</div>
                                    <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{entry.company || 'Company not specified'}</div>
                                    {entry.description && <p className="text-sm text-muted" style={{ marginTop: 6 }}>{entry.description}</p>}
                                </div>
                            )) : <p className="text-sm text-muted">No experience added yet.</p>}
                        </div>

                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 10 }}>Education</h3>
                            {fp?.education?.length > 0 ? fp.education.map((entry, index) => (
                                <div key={index} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: index < fp.education.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="font-semibold">{entry.degree || 'Degree not specified'}</div>
                                    <div style={{ color: 'var(--primary)', fontSize: '0.875rem' }}>{entry.institution || 'Institution not specified'}</div>
                                    {entry.field && <p className="text-sm text-muted" style={{ marginTop: 6 }}>{entry.field}</p>}
                                </div>
                            )) : <p className="text-sm text-muted">No education details provided.</p>}
                        </div>

                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 10 }}>Skillset</h3>
                            {fp?.skills?.length > 0 ? (
                                <div className="job-card-skills">
                                    {fp.skills.map((skill) => <span key={skill} className="skill-tag" style={{ padding: '5px 14px', fontSize: '0.875rem' }}>{skill}</span>)}
                                </div>
                            ) : <p className="text-sm text-muted">No skills added yet.</p>}
                        </div>

                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 10 }}>Portfolio</h3>
                            {fp?.portfolio?.length > 0 ? fp.portfolio.map((item, index) => (
                                <div key={index} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: index < fp.portfolio.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <div className="font-semibold">{item.title || 'Portfolio project'}</div>
                                    {item.description && <p className="text-sm text-muted" style={{ marginTop: 6 }}>{item.description}</p>}
                                </div>
                            )) : <p className="text-sm text-muted">No portfolio items added yet.</p>}
                        </div>

                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 10 }}>Languages</h3>
                            {fp?.languages?.length > 0 ? (
                                <div style={{ display: 'grid', gap: 8 }}>
                                    {fp.languages.map((lang, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                            <span className="font-semibold">{lang.language || 'Language'}</span>
                                            <span className="text-sm text-muted">{lang.proficiency || 'Not specified'}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-sm text-muted">No languages added yet.</p>}
                        </div>

                        <div className="section-card">
                            <h3 className="heading-sm" style={{ marginBottom: 10 }}>Location</h3>
                            {fp?.location?.city || fp?.location?.country || fp?.location?.state ? (
                                <p className="text-sm text-muted" style={{ lineHeight: 1.7 }}>
                                    {fp.location.address ? `${fp.location.address}, ` : ''}{fp.location.city || ''}{fp.location.city && fp.location.state ? ', ' : ''}{fp.location.state || ''}{(fp.location.city || fp.location.state) && fp.location.country ? ', ' : ''}{fp.location.country || ''}
                                </p>
                            ) : <p className="text-sm text-muted">Location not provided.</p>}
                        </div>
                    </div>
                )}

                {tab === 'gigs' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {visibleGigs.length === 0 ? (
                            <div className="section-card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <FiBriefcase style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }} />
                                <p className="text-muted text-sm" style={{ marginTop: 10 }}>No published gigs yet. Publish a service offer and it will appear here.</p>
                            </div>
                        ) : visibleGigs.map((gig, index) => {
                            const relatedExperience = fp?.experience?.find((entry) => entry?.role) || fp?.experience?.[0] || null;
                            const servicePrice = gig?.cost && gig.cost > 0 ? (gig.billingMode === 'project' ? `$${gig.cost}` : `$${gig.cost}/hr`) : fp?.projectQuote && fp.projectQuote > 0 ? `$${fp.projectQuote}` : fp?.hourlyRate && fp.hourlyRate > 0 ? `$${fp.hourlyRate}/hr` : '$50+/hr';
                            const experienceSummary = relatedExperience ? `${relatedExperience.role || 'Professional'}${relatedExperience.company ? ` • ${relatedExperience.company}` : ''}` : 'Specialized expertise tailored for your project';
                            const deliveryTime = fp?.skills?.length > 0 ? '3-5 days' : '5-7 days';
                            const mediaUrl = gig?.thumbnailUrl || gig?.introMediaUrl || gig?.mediaUrl || gig?.imageUrl || gig?.videoUrl || gig?.coverImageUrl || '';
                            const mediaType = gig?.mediaType || gig?.introMediaType || (mediaUrl?.match(/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i) ? 'image' : 'video');
                            const tags = Array.isArray(gig?.tags) ? gig.tags : typeof gig?.tags === 'string' ? gig.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : [];
                            const stackItems = Array.isArray(gig?.techStack) ? gig.techStack : typeof gig?.techStack === 'string' ? gig.techStack.split(',').map((tech) => tech.trim()).filter(Boolean) : [];
                            const gigIdentifier = gig?._id || `${gig?.title || 'gig'}-${index}-${fp?.user?._id || id}`;
                            const isSavedGig = savedGigIds.includes(gigIdentifier);
                            const summary = gig.description || fp?.bio || 'A tailored service package built around your goals, timeline, and deliverables.';
                            return (
                                <motion.div key={gigIdentifier} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="section-card" style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', boxShadow: '0 10px 26px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', minHeight: 320 }}>
                                    <div style={{ position: 'relative', height: 152, background: 'linear-gradient(135deg, rgba(0,201,167,0.12), rgba(14,165,233,0.08))' }}>
                                        {mediaUrl ? (
                                            mediaType === 'image' ? (
                                                <img src={mediaUrl} alt={gig.title || 'Gig media'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <video controls preload="metadata" src={mediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                                            )
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 700, background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)' }}>
                                                {gig.title?.[0] || 'S'}
                                            </div>
                                        )}
                                        <div style={{ position: 'absolute', inset: '0 0 auto auto', padding: 10 }}>
                                            <span className="badge badge-primary">{servicePrice}</span>
                                        </div>
                                    </div>
                                    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                                            <div>
                                                <div className="page-hero-badge" style={{ marginBottom: 4 }}><FiBriefcase size={12} /> {gig.category || 'Service offer'}</div>
                                                <h3 className="heading-sm" style={{ marginBottom: 2, lineHeight: 1.3 }}>{gig.title || `${fp?.title || 'Custom'} service`}</h3>
                                                <div className="text-xs text-muted">{fp?.user?.name || 'Freelancer'}</div>
                                            </div>
                                            <button type="button" className={`btn btn-sm ${isSavedGig ? 'btn-primary' : 'btn-ghost'}`} onClick={(event) => handleSaveGig(gigIdentifier, event)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                                <FiBookmark size={14} /> {isSavedGig ? 'Saved' : 'Save'}
                                            </button>
                                        </div>
                                        <p className="text-sm text-muted" style={{ lineHeight: 1.7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {summary}
                                        </p>
                                        {stackItems.length > 0 && (
                                            <div className="job-card-skills">
                                                {stackItems.slice(0, 3).map((tech) => <span key={tech} className="skill-tag">{tech}</span>)}
                                                {stackItems.length > 3 && <span className="skill-tag">+{stackItems.length - 3}</span>}
                                            </div>
                                        )}
                                        {tags.length > 0 && (
                                            <div className="job-card-skills">
                                                {tags.slice(0, 3).map((tag) => <span key={tag} className="skill-tag">{tag}</span>)}
                                                {tags.length > 3 && <span className="skill-tag">+{tags.length - 3}</span>}
                                            </div>
                                        )}
                                        {(gig.liveUrl || gig.githubUrl) && (
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 'auto' }}>
                                                {gig.liveUrl && <a href={gig.liveUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary"><FiGlobe /> Live</a>}
                                                {gig.githubUrl && <a href={gig.githubUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost"><FiGithub /> Code</a>}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {tab === 'posts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {fp?.portfolio?.length === 0 ? (
                            <div className="section-card" style={{ padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <FiAward style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }} />
                                <p className="text-muted text-sm" style={{ marginTop: 10 }}>No posts yet</p>
                            </div>
                        ) : fp.portfolio.map((post, index) => (
                            <motion.div key={index} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="section-card" style={{ padding: 0, borderRadius: 24, overflow: 'hidden', border: '1px solid var(--border)' }}>
                                <div style={{ padding: 20, borderBottom: '1px solid var(--border)', background: 'linear-gradient(90deg, rgba(14,165,233,0.06), rgba(0,201,167,0.06))' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="avatar avatar-sm" style={{ overflow: 'hidden' }}>
                                                {fp?.user?.avatar
                                                    ? <img src={fp.user.avatar} alt={fp?.user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                    : (fp?.user?.name?.[0] || '?')}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{fp?.user?.name || 'Freelancer'}</div>
                                                <div className="text-xs text-muted">{post.completedAt ? new Date(post.completedAt).toLocaleDateString() : 'Shared recently'} · {fp?.title || 'Professional'}</div>
                                            </div>
                                        </div>
                                        <span className="badge badge-primary">Project update</span>
                                    </div>
                                </div>
                                <div style={{ padding: 20 }}>
                                    <h3 className="heading-sm" style={{ marginBottom: 8 }}>{post.title}</h3>
                                    <p className="text-sm text-muted" style={{ lineHeight: 1.8 }}>{post.description}</p>
                                    <div className="job-card-skills" style={{ marginTop: 12 }}>
                                        {post.techStack?.map((tech) => <span key={tech} className="skill-tag">{tech}</span>)}
                                    </div>
                                    {(post.liveUrl || post.githubUrl) && (
                                        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                                            {post.liveUrl && <a href={post.liveUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary"><FiGlobe /> Live</a>}
                                            {post.githubUrl && <a href={post.githubUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost"><FiGithub /> Code</a>}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {tab === 'reviews' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="section-card" style={{ padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <div>
                                    <h3 className="heading-sm" style={{ marginBottom: 4 }}>Reviews & feedback</h3>
                                    <p className="text-sm text-muted">Clients, freelancers, and other users can leave ratings and comments here.</p>
                                </div>
                                {isClient && (
                                    <div className="badge badge-primary">Write a review</div>
                                )}
                            </div>
                        </div>

                        {isClient && (
                            <form onSubmit={handleReviewSubmit} className="section-card" style={{ padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                    <h3 className="heading-sm">Leave a review</h3>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {Array.from({ length: 5 }).map((_, index) => (
                                            <button key={index} type="button" onClick={() => setReviewForm((prev) => ({ ...prev, stars: index + 1 }))} style={{ border: 'none', background: 'transparent', color: index < reviewForm.stars ? '#f59e0b' : 'var(--border)', fontSize: '1.2rem', cursor: 'pointer' }}>
                                                <FiStar />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea className="form-input" rows="3" placeholder="Share what it was like working with this freelancer or client" value={reviewForm.comment} onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))} style={{ marginTop: 12 }} />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                                    <input className="form-input" placeholder="Pros" value={reviewForm.pros} onChange={(event) => setReviewForm((prev) => ({ ...prev, pros: event.target.value }))} />
                                    <input className="form-input" placeholder="Cons" value={reviewForm.cons} onChange={(event) => setReviewForm((prev) => ({ ...prev, cons: event.target.value }))} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                                    <button type="submit" className="btn btn-primary btn-sm" disabled={submittingReview}>
                                        {submittingReview ? 'Submitting...' : 'Submit review'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {reviews.length === 0 ? (
                            <div className="section-card" style={{ padding: 48, textAlign: 'center', borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <FiStar style={{ fontSize: '3rem', color: 'var(--primary)', marginBottom: 16 }} />
                                <p className="text-muted text-sm" style={{ marginTop: 10 }}>No reviews yet. Be the first to share feedback.</p>
                            </div>
                        ) : reviews.map((review) => (
                            <div key={review._id} className="section-card" style={{ padding: 20, borderRadius: 20, border: '1px solid var(--border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                        <div className="avatar avatar-sm" style={{ overflow: 'hidden' }}>
                                            {review.reviewer?.avatar
                                                ? <img src={review.reviewer.avatar} alt={review.reviewer.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                : (review.reviewer?.name?.[0] || '?')}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">{review.reviewer?.name}</div>
                                            <div className="text-xs text-muted">{new Date(review.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    <div className="stars" style={{ display: 'flex', gap: 2 }}>
                                    {Array.from({ length: 5 }).map((_, idx) => (
                                        <FiStar
                                            key={idx}
                                            style={{
                                                color: idx < review.stars ? '#f59e0b' : 'var(--border)',
                                                fill: idx < review.stars ? '#f59e0b' : 'transparent',
                                                fontSize: '0.9rem'
                                            }}
                                        />
                                    ))}
                                </div>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>{review.comment}</p>
                                {(review.pros || review.cons) && (
                                    <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
                                        {review.pros && <div className="text-sm"><strong style={{ color: 'var(--success)' }}>+ </strong>{review.pros}</div>}
                                        {review.cons && <div className="text-sm"><strong style={{ color: 'var(--danger)' }}>- </strong>{review.cons}</div>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
