import { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { FiSave, FiUpload, FiArrowLeft, FiImage } from 'react-icons/fi';

const createEmptyGig = () => ({
    title: '',
    description: '',
    thumbnailUrl: '',
    introMediaUrl: '',
    mediaType: 'image',
    liveUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    techStack: '',
    cost: '',
    billingMode: 'hourly',
    category: '',
    subCategories: '',
    tags: '',
    isPublished: false,
});

export default function EditGigPage() {
    const { index } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);
    const [fullPortfolio, setFullPortfolio] = useState([]);
    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const loadGig = async () => {
            try {
                const { data } = await API.get('/users/profile');
                let profileGigs = Array.isArray(data?.profile?.gigs) ? data.profile.gigs : [];
                setFullPortfolio(profileGigs);

                if (index === 'new') {
                    setGig(createEmptyGig());
                } else {
                    const gigIndex = parseInt(index, 10);
                    if (gigIndex >= 0 && gigIndex < profileGigs.length) {
                        const existingGig = profileGigs[gigIndex];
                        setGig({
                            ...existingGig,
                            title: existingGig.title || '',
                            description: existingGig.description || '',
                            thumbnailUrl: existingGig.thumbnailUrl || existingGig.introMediaUrl || '',
                            introMediaUrl: existingGig.introMediaUrl || '',
                            mediaType: existingGig.mediaType || 'image',
                            liveUrl: existingGig.liveUrl || '',
                            githubUrl: existingGig.githubUrl || '',
                            portfolioUrl: existingGig.portfolioUrl || '',
                            techStack: Array.isArray(existingGig.techStack) ? existingGig.techStack.join(', ') : existingGig.techStack || '',
                            tags: Array.isArray(existingGig.tags) ? existingGig.tags.join(', ') : existingGig.tags || '',
                            cost: existingGig.cost ?? '',
                            billingMode: existingGig.billingMode || 'hourly',
                            category: existingGig.category || '',
                            subCategories: Array.isArray(existingGig.subCategories) ? existingGig.subCategories.join(', ') : (existingGig.subCategory || existingGig.subCategories || ''),
                            isPublished: Boolean(existingGig.isPublished),
                        });
                    } else {
                        toast.error('Gig not found');
                        navigate('/gigs/manage');
                    }
                }
            } catch (error) {
                toast.error('Unable to load profile data.');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'freelancer') loadGig();
        else {
            setLoading(false);
        }
    }, [index, navigate, user?.role]);

    const canSubmit = useMemo(() => !loading && user?.role === 'freelancer', [loading, user?.role]);

    const updateGigField = (field, value) => {
        setGig(prev => ({ ...prev, [field]: value }));
    };

    const uploadGigMedia = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'skillsphere/gigs');

        try {
            const { data } = await API.post('/uploads/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data?.success && data.url) {
                const mediaType = data.type === 'video' ? 'video' : 'image';
                setGig(prev => ({
                    ...prev,
                    thumbnailUrl: data.url,
                    introMediaUrl: data.url,
                    mediaType,
                }));
                toast.success('Media uploaded');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Media upload failed');
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const saveGig = async (publish = undefined) => {
        setSaving(true);
        try {
            const finalGig = { ...gig };
            if (publish !== undefined) {
                finalGig.isPublished = publish;
            }

            const formattedGig = {
                ...finalGig,
                title: finalGig.title?.trim() || '',
                description: finalGig.description?.trim() || '',
                thumbnailUrl: finalGig.thumbnailUrl?.trim() || '',
                introMediaUrl: finalGig.introMediaUrl?.trim() || '',
                mediaType: finalGig.mediaType || 'image',
                liveUrl: finalGig.liveUrl?.trim() || '',
                githubUrl: finalGig.githubUrl?.trim() || '',
                portfolioUrl: finalGig.portfolioUrl?.trim() || '',
                techStack: typeof finalGig.techStack === 'string'
                    ? finalGig.techStack.split(',').map((item) => item.trim()).filter(Boolean)
                    : Array.isArray(finalGig.techStack) ? finalGig.techStack : [],
                tags: typeof finalGig.tags === 'string'
                    ? finalGig.tags.split(',').map((item) => item.trim()).filter(Boolean)
                    : Array.isArray(finalGig.tags) ? finalGig.tags : [],
                cost: finalGig.cost === '' ? 0 : Number(finalGig.cost),
                isPublished: Boolean(finalGig.isPublished),
            };

            const newPortfolio = [...fullPortfolio];
            if (index === 'new') {
                newPortfolio.push(formattedGig);
            } else {
                newPortfolio[parseInt(index, 10)] = formattedGig;
            }

            const payload = {
                portfolio: newPortfolio.filter((g) => Object.values(g).some((value) => typeof value === 'string' ? value.trim() : value))
            };

            await API.put('/users/profile', { gigs: payload.portfolio });
            toast.success('Gig saved successfully');
            navigate('/gigs/manage');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to save gig');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="page flex-center" style={{ minHeight: '70vh' }}><div className="spinner" /></div>;
    }

    if (!canSubmit || !gig) {
        return <div className="page" style={{ padding: '36px 24px' }}><div className="container card" style={{ padding: 28 }}>Gig not available.</div></div>;
    }

    return (
        <div className="page" style={{ background: 'linear-gradient(180deg, rgba(0,201,167,0.06), transparent 24%)', minHeight: '100vh', paddingBottom: 64 }}>
            <div className="container" style={{ padding: '36px 24px', maxWidth: 800 }}>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
                    <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate('/gigs/manage')} title="Back to gigs">
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="page-hero-badge">Creator studio</div>
                        <h1 className="page-hero-title">{index === 'new' ? 'Create a gig' : 'Edit gig'}</h1>
                    </div>
                </div>

                <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label font-semibold">Service Title</label>
                        <input
                            className="form-input"
                            style={{ fontWeight: 600, fontSize: '1.1rem', padding: '12px 16px' }}
                            placeholder="e.g., I will design a minimalist logo"
                            value={gig.title || ''}
                            onChange={e => updateGigField('title', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label font-semibold">Description</label>
                        <textarea
                            className="form-input"
                            rows={4}
                            style={{ resize: 'vertical' }}
                            placeholder="Add a detailed description for this service offer..."
                            value={gig.description || ''}
                            onChange={e => updateGigField('description', e.target.value)}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label font-semibold">Pricing Model</label>
                            <select className="form-input" value={gig.billingMode || 'hourly'} onChange={e => updateGigField('billingMode', e.target.value)}>
                                <option value="hourly">Hourly Rate</option>
                                <option value="project">Fixed Project</option>
                            </select>
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label font-semibold">Cost (USD)</label>
                            <input className="form-input" type="number" placeholder="Price" value={gig.cost ?? ''} onChange={e => updateGigField('cost', e.target.value)} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label font-semibold">Category</label>
                            <input className="form-input" placeholder="e.g., Graphic Design" value={gig.category || ''} onChange={e => updateGigField('category', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label font-semibold">Sub Category</label>
                            <input className="form-input" placeholder="e.g., Logos" value={gig.subCategories || ''} onChange={e => updateGigField('subCategories', e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label font-semibold">Gig Media (Thumbnail/Video)</label>
                        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                            {(gig.thumbnailUrl || gig.introMediaUrl) ? (
                                <div style={{ width: 180, height: 120, borderRadius: 14, overflow: 'hidden', background: 'var(--bg-muted)', border: '1px solid var(--border)' }}>
                                    {gig.mediaType === 'video' ? (
                                        <video controls preload="metadata" src={gig.thumbnailUrl || gig.introMediaUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#000' }} />
                                    ) : (
                                        <img src={gig.thumbnailUrl || gig.introMediaUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    )}
                                </div>
                            ) : (
                                <div style={{ width: 180, height: 120, borderRadius: 14, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                    <FiImage size={32} />
                                </div>
                            )}
                            <label className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <FiUpload /> {uploading ? 'Uploading...' : 'Upload new media'}
                                <input type="file" accept="image/*,video/*" hidden onChange={uploadGigMedia} />
                            </label>
                        </div>
                    </div>

                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/gigs/manage')}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => saveGig(true)} disabled={saving}>
                            <FiSave /> {saving ? 'Saving...' : 'Publish Gig'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
