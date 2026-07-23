import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { setUser } from '../../redux/slices/authSlice';
import API from '../../services/api';
import toast from 'react-hot-toast';
import {
    FiUser, FiPhone, FiMapPin, FiGlobe, FiGithub, FiLinkedin, FiFacebook, FiInstagram, FiYoutube, FiLink,
    FiDollarSign, FiPlus, FiTrash2, FiChevronDown, FiChevronUp,
    FiBriefcase, FiBook, FiImage, FiAward, FiCode
} from 'react-icons/fi';

const AVAILABILITY_OPTIONS = ['full-time', 'part-time', 'weekends', 'unavailable'];
const PROFICIENCY_OPTIONS = ['Basic', 'Conversational', 'Fluent', 'Native'];

export default function EditProfilePage() {
    const { user } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [activeSection, setActiveSection] = useState('basic');

    // Basic fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [avatarUploading, setAvatarUploading] = useState(false);

    // Freelancer-only fields
    const [bio, setBio] = useState('');
    const [title, setTitle] = useState('');
    const [profileType, setProfileType] = useState('freelance');
    const [skillInput, setSkillInput] = useState('');
    const [skills, setSkills] = useState([]);
    const [billingMode, setBillingMode] = useState('hourly');
    const [hourlyRate, setHourlyRate] = useState('');
    const [projectQuote, setProjectQuote] = useState('');
    const [availability, setAvailability] = useState('full-time');
    const [socialLinks, setSocialLinks] = useState([]);
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Experience
    const [experience, setExperience] = useState([]);
    // Education
    const [education, setEducation] = useState([]);
    // Portfolio
    const [portfolio, setPortfolio] = useState([]);
    const [portfolioUploading, setPortfolioUploading] = useState({});
    // Languages
    const [languages, setLanguages] = useState([]);

    const isFreelancer = user?.role === 'freelancer';

    useEffect(() => {
        API.get('/users/profile').then(res => {
            const u = res.data.user;
            const p = res.data.profile;
            setName(u.name || '');
            setPhone(u.phone || '');
            setCity(u.location?.city || '');
            setState(u.location?.state || '');
            setCountry(u.location?.country || '');
            setAvatarUrl(u.avatar || '');
            if (p && isFreelancer) {
                setBio(p.bio || '');
                setTitle(p.title || '');
                const nextType = p.profileType || 'freelance';
                setProfileType(nextType);
                setSkills(p.skills || []);
                setBillingMode(p.billingMode || 'hourly');
                setHourlyRate(p.hourlyRate || '');
                setProjectQuote(p.projectQuote || '');
                setAvailability(p.availability || 'full-time');
                setSocialLinks(p.socialLinks || []);
                setWebsiteUrl(p.websiteUrl || '');
                setExperience(p.experience || []);
                setEducation(p.education || []);
                setPortfolio(p.portfolio || []);
                setLanguages(p.languages || []);
            }
        }).catch((err) => {
            console.error('Failed to load profile:', err?.response?.status, err?.response?.data || err.message);
            toast.error(`Failed to load profile: ${err?.response?.data?.message || err.message}`);
        }).finally(() => setFetching(false));
    }, []);

    const [dragOverType, setDragOverType] = useState(null);

    const handleAvatarUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'skillsphere/profile');
        setAvatarUploading(true);

        try {
            const { data } = await API.post('/uploads/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data?.success && data.url) {
                setAvatarUrl(data.url);
                toast.success('Profile photo uploaded');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Profile photo upload failed');
        } finally {
            setAvatarUploading(false);
            event.target.value = '';
        }
    };

    const addSkill = () => {
        const s = skillInput.trim();
        if (s && !skills.includes(s)) {
            setSkills([...skills, s]);
            setSkillInput('');
        }
    };

    const removeSkill = (s) => setSkills(skills.filter(x => x !== s));

    const addExperience = () => setExperience([...experience, { company: '', role: '', from: '', to: '', isCurrent: false, description: '' }]);
    const updateExperience = (i, field, value) => {
        const updated = [...experience];
        updated[i] = { ...updated[i], [field]: value };
        setExperience(updated);
    };
    const removeExperience = (i) => setExperience(experience.filter((_, idx) => idx !== i));

    const addEducation = () => setEducation([...education, { institution: '', degree: '', field: '', from: '', to: '' }]);
    const updateEducation = (i, field, value) => {
        const updated = [...education];
        updated[i] = { ...updated[i], [field]: value };
        setEducation(updated);
    };
    const removeEducation = (i) => setEducation(education.filter((_, idx) => idx !== i));

    const addPortfolio = () => setPortfolio([...portfolio, {
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
        subCategory: '',
        tags: '',
    }]);
    const updatePortfolio = (i, field, value) => {
        const updated = [...portfolio];
        updated[i] = { ...updated[i], [field]: value };
        setPortfolio(updated);
    };
    const removePortfolio = (i) => setPortfolio(portfolio.filter((_, idx) => idx !== i));

    const handlePortfolioThumbnailUpload = async (event, index) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'skillsphere/portfolio');
        setPortfolioUploading(prev => ({ ...prev, [index]: true }));

        try {
            const { data } = await API.post('/uploads/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (data?.success && data.url) {
                updatePortfolio(index, 'thumbnailUrl', data.url);
                toast.success('Thumbnail uploaded');
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Thumbnail upload failed');
        } finally {
            setPortfolioUploading(prev => ({ ...prev, [index]: false }));
            event.target.value = '';
        }
    };

    const addLanguage = () => setLanguages([...languages, { language: '', proficiency: 'Conversational' }]);
    const updateLanguage = (i, field, value) => {
        const updated = [...languages];
        updated[i] = { ...updated[i], [field]: value };
        setLanguages(updated);
    };
    const removeLanguage = (i) => setLanguages(languages.filter((_, idx) => idx !== i));

    const addSocialLink = () => setSocialLinks([...socialLinks, { platform: 'Instagram', url: '' }]);
    const updateSocialLink = (i, field, value) => {
        const updated = [...socialLinks];
        updated[i] = { ...updated[i], [field]: value };
        setSocialLinks(updated);
    };
    const removeSocialLink = (i) => setSocialLinks(socialLinks.filter((_, idx) => idx !== i));

    const onSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name, phone, avatar: avatarUrl,
                'location.city': city,
                'location.state': state,
                'location.country': country,
            };
            if (isFreelancer) {
                Object.assign(payload, {
                    bio, title, profileType, skills, billingMode, hourlyRate, projectQuote, availability,
                    socialLinks, websiteUrl,
                    experience,
                    education,
                    portfolio,
                    languages,
                });
            }
            const res = await API.put('/users/profile', payload);
            const savedType = res.data.profile?.profileType || profileType;
            setProfileType(savedType);
            dispatch(setUser(res.data.user));
            localStorage.setItem('user', JSON.stringify(res.data.user));
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.response?.data?.message || err.friendlyMessage || 'Update failed');
        } finally { setLoading(false); }
    };

    const sections = isFreelancer ? [
        { id: 'basic', label: 'Basic Info', icon: <FiUser /> },
        { id: 'experience', label: 'Experience', icon: <FiAward /> },
        { id: 'education', label: 'Education', icon: <FiBook /> },
        { id: 'portfolio', label: 'Portfolio', icon: <FiImage /> },
        { id: 'languages', label: 'Languages', icon: <FiGlobe /> },
        { id: 'links', label: 'Social Links', icon: <FiCode /> },
    ] : [
        { id: 'basic', label: 'Basic Info', icon: <FiUser /> },
    ];

    if (fetching) return (
        <div className="page flex-center" style={{ minHeight: '100vh' }}>
            <div className="spinner" />
        </div>
    );
    let percentage = 0;
    if (!isFreelancer) {
        if (avatarUrl) percentage += 20;
        if (phone) percentage += 30;
        if (city || country) percentage += 50;
    } else {
        if (avatarUrl) percentage += 10;
        if (city || country) percentage += 10;
        if (title) percentage += 20;
        if (bio) percentage += 20;
        if (skills.length > 0) percentage += 20;
        if (portfolio.length > 0) percentage += 20;
    }

    return (
        <div className="page page-shell" style={{ paddingBottom: 60 }}>
            <div className="container" style={{ padding: '32px 24px', maxWidth: 960 }}>
                <div className="section-card" style={{ marginBottom: 24, padding: '18px 20px', border: '1px solid var(--primary)', background: 'linear-gradient(90deg, rgba(14,165,233,0.05), rgba(0,201,167,0.05))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                        <h2 className="heading-sm">Profile Completion</h2>
                        <span className="font-semibold" style={{ color: 'var(--primary)' }}>{percentage}%</span>
                    </div>
                    <div style={{ width: '100%', height: 8, background: 'var(--bg-muted)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #14b8a6)', borderRadius: 4, transition: 'width 0.8s ease' }}></div>
                    </div>
                </div>

                <form onSubmit={onSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }}>

                        {/* Sidebar nav */}
                        <div className="section-card" style={{ padding: 8, position: 'sticky', top: 88 }}>
                            {sections.map(s => (
                                <button key={s.id} type="button"
                                    onClick={() => setActiveSection(s.id)}
                                    className="sidebar-link"
                                    style={{
                                        width: '100%', textAlign: 'left', gap: 10,
                                        background: activeSection === s.id ? 'rgba(0,201,167,0.08)' : 'transparent',
                                        color: activeSection === s.id ? 'var(--primary)' : 'var(--text-muted)',
                                        fontWeight: activeSection === s.id ? 700 : 500,
                                        borderLeft: activeSection === s.id ? '3px solid var(--primary)' : '3px solid transparent',
                                    }}>
                                    <span className="icon">{s.icon}</span> {s.label}
                                </button>
                            ))}
                            <div style={{ padding: '12px 8px 4px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        {/* Main panel */}
                        <div className="section-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                            {/* ── BASIC INFO ── */}
                            {activeSection === 'basic' && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <h2 className="heading-sm" style={{ marginBottom: 4 }}>Basic Information</h2>
                                    <div className="form-group">
                                        <label className="form-label">Profile Picture</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                                            <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt="Profile preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <FiUser size={28} color="var(--text-muted)" />
                                                )}
                                            </div>
                                            <label className="btn btn-ghost btn-sm" style={{ cursor: 'pointer' }}>
                                                <FiImage /> {avatarUploading ? 'Uploading...' : 'Upload photo'}
                                                <input type="file" accept="image/*" hidden onChange={handleAvatarUpload} />
                                            </label>
                                        </div>
                                        <p className="text-xs text-muted" style={{ marginTop: 8 }}>PNG, JPG, WebP, or GIF up to 20 MB.</p>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Full Name</label>
                                        <div className="input-group">
                                            <FiUser className="input-icon" />
                                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone Number</label>
                                        <div className="input-group">
                                            <FiPhone className="input-icon" />
                                            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 9999999999" />
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                        <div className="form-group">
                                            <label className="form-label">City</label>
                                            <input className="form-input" value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">State</label>
                                            <input className="form-input" value={state} onChange={e => setState(e.target.value)} placeholder="State" />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Country</label>
                                            <input className="form-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" />
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* ── EXPERIENCE ── */}
                            {activeSection === 'experience' && isFreelancer && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="flex-between">
                                        <h2 className="heading-sm">Work Experience</h2>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={addExperience}><FiPlus /> Add</button>
                                    </div>
                                    {experience.length === 0 && (
                                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>No experience added yet. Click Add to get started.</p>
                                    )}
                                    {experience.map((exp, i) => (
                                        <div key={i} className="card-neumorphic" style={{ padding: 16 }}>
                                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                                <span className="font-semibold text-sm">Experience #{i + 1}</span>
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeExperience(i)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                                            </div>
                                            <div className="form-group" style={{ maxWidth: 320, marginBottom: 12 }}>
                                                <label className="form-label">Profile Type</label>
                                                <select
                                                    className="form-input"
                                                    value={profileType}
                                                    onChange={(e) => setProfileType(e.target.value)}
                                                    style={{ textTransform: 'capitalize' }}
                                                >
                                                    <option value="company">Company</option>
                                                    <option value="freelance">Freelance</option>
                                                    <option value="intern">Intern</option>
                                                </select>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: profileType === 'freelance' ? '1fr 1fr' : '1fr 1fr', gap: 12 }}>
                                                {profileType !== 'freelance' && (
                                                    <div className="form-group">
                                                        <label className="form-label">Company</label>
                                                        <input className="form-input" value={exp.company} onChange={e => updateExperience(i, 'company', e.target.value)} placeholder="Company" />
                                                    </div>
                                                )}
                                                <div className="form-group" style={{ gridColumn: profileType === 'freelance' ? '1 / -1' : 'auto' }}>
                                                    <label className="form-label">Role / Position</label>
                                                    <input className="form-input" value={exp.role} onChange={e => updateExperience(i, 'role', e.target.value)} placeholder="Role" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">From</label>
                                                    <input className="form-input" type="date" value={exp.from || ''} onChange={e => updateExperience(i, 'from', e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">To</label>
                                                    <input className="form-input" type="date" value={exp.to || ''} onChange={e => updateExperience(i, 'to', e.target.value)} disabled={exp.isCurrent} />
                                                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                                        <input type="checkbox" checked={exp.isCurrent || false} onChange={e => updateExperience(i, 'isCurrent', e.target.checked)} />
                                                        Currently working here
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="form-group" style={{ marginTop: 12 }}>
                                                <label className="form-label">Description</label>
                                                <textarea className="form-input" rows={2} value={exp.description} onChange={e => updateExperience(i, 'description', e.target.value)} placeholder="Briefly describe your role and achievements..." style={{ resize: 'vertical' }} />
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* ── EDUCATION ── */}
                            {activeSection === 'education' && isFreelancer && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="flex-between">
                                        <h2 className="heading-sm">Education</h2>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={addEducation}><FiPlus /> Add</button>
                                    </div>
                                    {education.length === 0 && (
                                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>No education added yet.</p>
                                    )}
                                    {education.map((edu, i) => (
                                        <div key={i} className="card-neumorphic" style={{ padding: 16 }}>
                                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                                <span className="font-semibold text-sm">Education #{i + 1}</span>
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeEducation(i)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                <div className="form-group" style={{ gridColumn: '1/-1' }}>
                                                    <label className="form-label">Institution</label>
                                                    <input className="form-input" value={edu.institution} onChange={e => updateEducation(i, 'institution', e.target.value)} placeholder="Institution" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Degree</label>
                                                    <input className="form-input" value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} placeholder="Degree" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Field of Study</label>
                                                    <input className="form-input" value={edu.field} onChange={e => updateEducation(i, 'field', e.target.value)} placeholder="Field" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">From</label>
                                                    <input className="form-input" type="date" value={edu.from || ''} onChange={e => updateEducation(i, 'from', e.target.value)} />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">To</label>
                                                    <input className="form-input" type="date" value={edu.to || ''} onChange={e => updateEducation(i, 'to', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* ── PORTFOLIO ── */}
                            {activeSection === 'portfolio' && isFreelancer && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="flex-between">
                                        <h2 className="heading-sm">Portfolio Projects</h2>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={addPortfolio}><FiPlus /> Add</button>
                                    </div>
                                    {portfolio.length === 0 && (
                                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>No portfolio projects yet. Showcase your best work!</p>
                                    )}
                                    {portfolio.map((proj, i) => (
                                        <div key={i} className="card-neumorphic" style={{ padding: 16 }}>
                                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                                <span className="font-semibold text-sm">Project #{i + 1}</span>
                                                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removePortfolio(i)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                <div className="form-group">
                                                    <label className="form-label">Project Title</label>
                                                    <input className="form-input" value={proj.title || ''} onChange={e => updatePortfolio(i, 'title', e.target.value)} placeholder="e.g. Personal Portfolio Website" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Description</label>
                                                    <textarea className="form-input" rows={2} value={proj.description || ''} onChange={e => updatePortfolio(i, 'description', e.target.value)} style={{ resize: 'vertical' }} placeholder="What did you build and what problem does it solve?" />
                                                </div>
                                                <div className="form-group">
                                                    <label className="form-label">Portfolio Link</label>
                                                    <input className="form-input" value={proj.portfolioUrl || ''} onChange={e => updatePortfolio(i, 'portfolioUrl', e.target.value)} placeholder="https://myportfolio.com/project" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}



                            {/* ── LANGUAGES ── */}
                            {activeSection === 'languages' && isFreelancer && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="flex-between">
                                        <h2 className="heading-sm">Languages</h2>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={addLanguage}><FiPlus /> Add</button>
                                    </div>
                                    {languages.length === 0 && (
                                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>No languages added yet.</p>
                                    )}
                                    {languages.map((lang, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                                            <div className="form-group">
                                                {i === 0 && <label className="form-label">Language</label>}
                                                <input className="form-input" value={lang.language} onChange={e => updateLanguage(i, 'language', e.target.value)} placeholder="Language" />
                                            </div>
                                            <div className="form-group">
                                                {i === 0 && <label className="form-label">Proficiency</label>}
                                                <select className="form-input" value={lang.proficiency} onChange={e => updateLanguage(i, 'proficiency', e.target.value)}>
                                                    {PROFICIENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                                                </select>
                                            </div>
                                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeLanguage(i)} style={{ color: 'var(--danger)' }}><FiTrash2 /></button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* ── SOCIAL LINKS ── */}
                            {activeSection === 'links' && isFreelancer && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div className="flex-between">
                                        <h2 className="heading-sm">Social & Professional Links</h2>
                                        <button type="button" className="btn btn-primary btn-sm" onClick={addSocialLink}><FiPlus /> Add</button>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Personal Website / Portfolio</label>
                                        <div className="input-group">
                                            <FiGlobe className="input-icon" />
                                            <input className="form-input" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="Website URL" />
                                        </div>
                                    </div>
                                    {socialLinks.length === 0 && (
                                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '24px 0' }}>No social links added yet.</p>
                                    )}
                                    {socialLinks.map((link, i) => (
                                        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, auto) 1fr auto', gap: 12, alignItems: 'end', background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">Platform</label>
                                                <select className="form-input" value={link.platform} onChange={e => updateSocialLink(i, 'platform', e.target.value)}>
                                                    <option value="Instagram">Instagram</option>
                                                    <option value="Facebook">Facebook</option>
                                                    <option value="YouTube">YouTube</option>
                                                    <option value="Custom">Custom Link</option>
                                                </select>
                                            </div>
                                            <div className="form-group" style={{ marginBottom: 0 }}>
                                                <label className="form-label">URL</label>
                                                <div className="input-group">
                                                    {link.platform === 'Instagram' ? <FiInstagram className="input-icon" /> :
                                                        link.platform === 'Facebook' ? <FiFacebook className="input-icon" /> :
                                                            link.platform === 'YouTube' ? <FiYoutube className="input-icon" /> :
                                                                <FiLink className="input-icon" />}
                                                    <input className="form-input" value={link.url} onChange={e => updateSocialLink(i, 'url', e.target.value)} placeholder="https://" />
                                                </div>
                                            </div>
                                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeSocialLink(i)} style={{ color: 'var(--danger)', height: 38, width: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrash2 /></button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
