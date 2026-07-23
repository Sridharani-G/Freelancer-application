import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiUpload } from 'react-icons/fi';

export default function ManageGigsPage() {
    const { user } = useSelector((state) => state.auth);
    const navigate = useNavigate();
    const [gigs, setGigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    const loadGigs = async () => {
        setLoading(true);
        try {
            const { data } = await API.get('/users/profile', { timeout: 10000 });
            const profileGigs = Array.isArray(data?.profile?.gigs) ? data.profile.gigs : [];
            setGigs(profileGigs.map((gig) => ({
                ...gig,
                title: gig.title || '',
                description: gig.description || '',
                thumbnailUrl: gig.thumbnailUrl || gig.introMediaUrl || '',
                mediaType: gig.mediaType || 'image',
                cost: gig.cost ?? 0,
                billingMode: gig.billingMode || 'hourly',
                category: gig.category || '',
                isPublished: Boolean(gig.isPublished),
            })));
        } catch (error) {
            const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
            const isNetwork = !error.response;
            const msg = isTimeout
                ? 'Request timed out — the server may be starting up. Please retry.'
                : isNetwork
                    ? 'Cannot reach server. Check your connection.'
                    : `Server error (${error.response?.status})`;
            console.error('Gig load error:', error?.message);
            toast.error(msg, { duration: 5000 });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadGigs();
    }, []);

    const canManage = useMemo(() => !loading && user?.role === 'freelancer', [loading, user?.role]);

    const removeGig = async (index) => {
        setDeleting(index);
        try {
            const { data } = await API.get('/users/profile');
            const currentGigs = Array.isArray(data?.profile?.gigs) ? data.profile.gigs : [];
            const updated = currentGigs.filter((_, i) => i !== index);
            await API.put('/users/profile', { gigs: updated });
            setGigs(prev => prev.filter((_, i) => i !== index));
            toast.success('Gig removed');
        } catch (error) {
            toast.error('Failed to remove gig');
        } finally {
            setDeleting(null);
        }
    };

    if (loading) {
        return <div className="page flex-center" style={{ minHeight: '70vh' }}><div className="spinner" /></div>;
    }

    if (!canManage) {
        return <div className="page" style={{ padding: '36px 24px' }}><div className="container card" style={{ padding: 28 }}>Only freelancers can manage gigs.</div></div>;
    }

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, rgba(0,201,167,0.06), transparent 24%)' }}>
            <div className="container" style={{ padding: '36px 24px 64px', maxWidth: 1080 }}>
                <div className="page-hero" style={{ marginBottom: 32 }}>
                    <div>
                        <div className="page-hero-badge">Creator studio</div>
                        <h1 className="page-hero-title">Manage gigs</h1>
                        <p className="text-muted text-sm" style={{ marginTop: 6 }}>Create service offers with pricing, categories, and media so clients can discover you easily.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => navigate('/gigs/edit/new')}>
                            <FiPlus /> Add gig
                        </button>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {gigs.length === 0 ? (
                        <div className="card" style={{ padding: 48, textAlign: 'center', gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,201,167,0.15), rgba(14,165,233,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FiUpload size={28} style={{ color: 'var(--primary)' }} />
                            </div>
                            <p className="text-muted">You haven't created any gigs yet.</p>
                            <button type="button" className="btn btn-primary" onClick={() => navigate('/gigs/edit/new')}>
                                <FiPlus /> Create your first gig
                            </button>
                        </div>
                    ) : gigs.map((gig, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card"
                            style={{ padding: 0, borderRadius: 22, border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 10px 26px rgba(15,23,42,0.06)' }}
                        >
                            {/* Thumbnail */}
                            {gig.thumbnailUrl ? (
                                <div style={{ width: '100%', height: 160, overflow: 'hidden', background: 'var(--bg-muted)' }}>
                                    {gig.mediaType === 'video' ? (
                                        <video src={gig.thumbnailUrl} preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <img src={gig.thumbnailUrl} alt={gig.title || 'Gig'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                            ) : (
                                <div style={{ width: '100%', height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #0ea5e9 0%, #14b8a6 100%)' }}>
                                    {gig.title?.[0]?.toUpperCase() || 'G'}
                                </div>
                            )}

                            {/* Card Body */}
                            <div style={{ padding: 18 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                                    <h3 className="font-semibold" style={{ fontSize: '1rem', lineHeight: 1.3 }}>{gig.title || `Gig #${index + 1}`}</h3>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: gig.isPublished ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)', color: gig.isPublished ? '#10b981' : 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                        {gig.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </div>

                                <p className="text-sm text-muted" style={{ lineHeight: 1.6, marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {gig.description || 'No description yet.'}
                                </p>

                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                                    <span className="badge badge-primary">{gig.billingMode === 'project' ? 'Project' : 'Hourly'}</span>
                                    {gig.category && <span className="badge badge-secondary">{gig.category}</span>}
                                    {gig.cost > 0 && <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>${gig.cost}</span>}
                                </div>

                                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => removeGig(index)}
                                        disabled={deleting === index}
                                        style={{ color: 'var(--danger)' }}
                                    >
                                        <FiTrash2 /> {deleting === index ? 'Removing…' : 'Delete'}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        onClick={() => navigate(`/gigs/edit/${index}`)}
                                    >
                                        <FiEdit2 /> Edit
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
