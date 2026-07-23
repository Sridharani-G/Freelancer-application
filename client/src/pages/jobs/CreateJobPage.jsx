import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion } from 'framer-motion';
import { createJob } from '../../redux/slices/jobsSlice';
import API from '../../services/api';
import { FiPlus, FiTrash2, FiArrowLeft } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CATEGORY_STORAGE_KEY = 'skillSphere.jobCategories';
const DEFAULT_CATEGORIES = [
    'Web Development', 'Frontend Development', 'Backend Development', 'Full-Stack Development',
    'UI/UX Design', 'Product Design', 'Branding & Identity', 'Mobile Apps', 'React Native', 'Flutter',
    'AI & Machine Learning', 'Data Science', 'Automation & Scripting', 'Cybersecurity', 'Blockchain',
    'Content Writing', 'Technical Writing', 'Copywriting', 'Video Editing', 'Motion Graphics',
    'Marketing', 'SEO', 'Social Media', 'Business & Admin', 'Customer Support', 'DevOps & Cloud',
    'Database Administration', 'QA & Testing', 'Game Development', '3D Design', 'Architecture & Planning', 'Legal Services', 'Art'
];
const SKILLS_SUGGESTIONS = ['React', 'Node.js', 'MongoDB', 'Python', 'Figma', 'Flutter', 'Vue.js', 'TypeScript', 'AWS', 'Docker'];
const SUBCATEGORY_SUGGESTIONS = {
    'web development': ['React', 'HTML', 'CSS', 'JavaScript', 'Node.js', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue.js'],
    'frontend development': ['React', 'HTML', 'CSS', 'JavaScript', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Vue.js'],
    'backend development': ['Node.js', 'Express.js', 'NestJS', 'MongoDB', 'PostgreSQL', 'REST APIs', 'GraphQL', 'Authentication'],
    'full-stack development': ['React', 'Node.js', 'MongoDB', 'REST APIs', 'Next.js', 'TypeScript', 'Deployment'],
    'ui/ux design': ['Wireframes', 'Prototypes', 'User Research', 'Design Systems', 'Accessibility'],
    'product design': ['User Flows', 'Journey Mapping', 'Competitor Analysis', 'Design Thinking', 'Prototyping'],
    'branding & identity': ['Logo Design', 'Brand Guidelines', 'Color Palette', 'Typography', 'Visual Identity'],
    'mobile apps': ['iOS App', 'Android App', 'App UI', 'App UX', 'App Store Optimization'],
    'react native': ['Cross-platform UI', 'Navigation', 'Animations', 'Expo', 'Native Modules'],
    'flutter': ['Material Design', 'Riverpod', 'Provider', 'State Management', 'API Integration'],
    'ai & machine learning': ['Prompt Engineering', 'Computer Vision', 'NLP', 'Generative AI', 'Model Training'],
    'data science': ['Pandas', 'NumPy', 'SQL', 'Visualization', 'Statistical Modeling'],
    'automation & scripting': ['Python Scripts', 'Shell Scripts', 'Workflow Automation', 'API Automation', 'Task Scheduling'],
    'cybersecurity': ['Pentesting', 'Security Audits', 'Threat Modeling', 'SOC Analysis', 'Compliance'],
    'blockchain': ['Smart Contracts', 'Solidity', 'Tokenomics', 'Web3 Integration', 'NFTs'],
    'content writing': ['Blog Writing', 'Editing', 'Copywriting', 'SEO Content', 'Ghostwriting'],
    'technical writing': ['API Docs', 'How-to Guides', 'Knowledge Base', 'Developer Documentation', 'Tutorials'],
    'copywriting': ['Ad Copy', 'Landing Page Copy', 'Email Copy', 'Sales Copy', 'Brand Messaging'],
    'video editing': ['Reel Editing', 'YouTube Editing', 'Color Grading', 'Motion Graphics', 'Subtitles'],
    'motion graphics': ['2D Animation', 'Intro Animation', 'Explainer Videos', 'After Effects', 'Transitions'],
    'marketing': ['Campaign Strategy', 'Growth Marketing', 'Email Campaigns', 'Performance Marketing', 'Analytics'],
    'seo': ['Keyword Research', 'On-page SEO', 'Technical SEO', 'Link Building', 'SEO Audits'],
    'social media': ['Content Planning', 'Social Strategy', 'Community Management', 'Posting Calendars', 'Ad Creative'],
    'business & admin': ['Project Coordination', 'Operations Support', 'Documentation', 'Research', 'Scheduling'],
    'customer support': ['Ticket Handling', 'Live Chat', 'Knowledge Base', 'CRM Support', 'Escalations'],
    'devops & cloud': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'CI/CD'],
    'database administration': ['SQL Tuning', 'Backup Strategy', 'Replication', 'Data Migration', 'Monitoring'],
    'qa & testing': ['Manual Testing', 'Automation Testing', 'Regression Testing', 'Bug Reporting', 'Test Cases'],
    'game development': ['Gameplay Design', 'Unity', 'Unreal Engine', 'Game UI', 'Physics'],
    '3d design': ['Modeling', 'Texturing', 'Rendering', 'Asset Optimization', 'Animation'],
    'architecture & planning': ['System Design', 'Wireframing', 'Requirements Mapping', 'Documentation', 'Roadmaps'],
    'legal services': ['Contract Review', 'Compliance Docs', 'Research', 'Drafting', 'Case Summary'],
    'art': ['Sketches', 'Watercolor Painting', 'Oil Painting', 'Digital Art', 'Illustration', 'Portrait Drawing']
};

const getSuggestedSubcategories = (category) => {
    if (!category) return [];
    const normalised = category.trim().toLowerCase();
    return SUBCATEGORY_SUGGESTIONS[normalised] || [];
};

const getStoredCategories = () => {
    if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
    try {
        const stored = JSON.parse(localStorage.getItem(CATEGORY_STORAGE_KEY) || '[]');
        return Array.isArray(stored) && stored.length > 0 ? stored : DEFAULT_CATEGORIES;
    } catch {
        return DEFAULT_CATEGORIES;
    }
};

export default function CreateJobPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [categoryOptions, setCategoryOptions] = useState(getStoredCategories);
    const [categoryInput, setCategoryInput] = useState('');
    const [customCategoryInput, setCustomCategoryInput] = useState('');
    const [subCategoryInput, setSubCategoryInput] = useState('');
    const [subCategories, setSubCategories] = useState([]);
    const [attachments, setAttachments] = useState([]);
    const [uploadingAttachments, setUploadingAttachments] = useState(false);
    const attachmentInputRef = useRef(null);

    const { register, handleSubmit, control, setValue, watch, formState: { errors } } = useForm({ defaultValues: { category: '' } });
    const { fields: milestones, append: addMilestone, remove: removeMilestone } = useFieldArray({ control, name: 'milestones' });
    const activeCategoryValue = watch('category') || '';
    const suggestedSubCategories = getSuggestedSubcategories(activeCategoryValue);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(categoryOptions));
        }
    }, [categoryOptions]);

    const addSkill = (skill) => {
        const s = skill.trim();
        if (s && !skills.includes(s)) setSkills(prev => [...prev, s]);
        setSkillInput('');
    };

    const addCategoryOption = (value) => {
        const normalized = value.trim();
        if (!normalized) return;
        setCategoryOptions((prev) => {
            const next = prev.includes(normalized) ? prev : [normalized, ...prev];
            return next;
        });
        setValue('category', normalized, { shouldDirty: true, shouldValidate: true });
        setCategoryInput(normalized);
        setCustomCategoryInput('');
    };

    const addSubCategory = (value) => {
        const normalized = value.trim();
        if (!normalized || subCategories.includes(normalized)) return;
        setSubCategories((prev) => [...prev, normalized]);
        setSubCategoryInput('');
    };

    const removeSubCategory = (value) => {
        setSubCategories((prev) => prev.filter((item) => item !== value));
    };

    const handleAttachmentUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        setUploadingAttachments(true);
        try {
            const formData = new FormData();
            files.forEach((file) => formData.append('files', file));
            formData.append('folder', 'skillsphere/jobs');
            const { data } = await API.post('/uploads/files', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const uploadedFiles = Array.isArray(data?.files) ? data.files : [];
            const normalized = uploadedFiles.map((file, index) => ({
                ...file,
                name: files[index]?.name || `Attachment ${index + 1}`,
                url: file?.url || '',
                type: file?.type || 'file',
            })).filter((file) => file.url);
            if (!normalized.length) throw new Error('Upload failed');
            setAttachments((prev) => [...prev, ...normalized]);
            toast.success(`${normalized.length} file${normalized.length > 1 ? 's' : ''} uploaded`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Attachment upload failed');
        } finally {
            setUploadingAttachments(false);
            event.target.value = '';
        }
    };

    const onSubmit = async (data) => {
        if (!data.category?.trim()) return toast.error('Choose or create a category');
        if (skills.length === 0) return toast.error('Add at least one skill');
        setLoading(true);
        try {
            const payload = {
                ...data,
                category: data.category.trim(),
                subCategories,
                skillsRequired: skills,
                budget: Number(data.budget),
                attachments: attachments.map((attachment) => attachment.url).filter(Boolean),
            };
            await dispatch(createJob(payload)).unwrap();
            toast.success('Job posted successfully!');
            navigate('/client/dashboard');
        } catch (err) {
            toast.error(err || 'Failed to post job');
        } finally { setLoading(false); }
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 800 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
                    <FiArrowLeft /> Back
                </button>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 className="heading-md" style={{ marginBottom: 8 }}>Post a New Job</h1>
                    <p className="text-muted text-sm" style={{ marginBottom: 28 }}>Fill in the details and our AI will find the best freelancers for you.</p>

                    <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Basic Info */}
                        <div className="card">
                            <h3 className="heading-sm" style={{ marginBottom: 20 }}>Job Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Job Title *</label>
                                    <input className="form-input" placeholder="Job title"
                                        {...register('title', { required: 'Title is required' })} />
                                    {errors.title && <span className="form-error">{errors.title.message}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Description *</label>
                                    <textarea className="form-input" rows={5} placeholder="Describe the project scope, deliverables, and any specific requirements..."
                                        {...register('description', { required: 'Description required', minLength: { value: 50, message: 'Min 50 characters' } })}
                                        style={{ resize: 'vertical' }} />
                                    {errors.description && <span className="form-error">{errors.description.message}</span>}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Category *</label>
                                        <input className="form-input" list="job-categories" placeholder="Type or select a category"
                                            {...register('category', { required: 'Category required' })}
                                            value={activeCategoryValue}
                                            onChange={(event) => {
                                                const nextValue = event.target.value;
                                                setValue('category', nextValue, { shouldDirty: true, shouldValidate: true });
                                                setCategoryInput(nextValue);
                                            }}
                                        />
                                        <datalist id="job-categories">
                                            {categoryOptions.map((category) => <option key={category} value={category} />)}
                                        </datalist>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                                            <input className="form-input" placeholder="Add new category" value={customCategoryInput} onChange={(event) => setCustomCategoryInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCategoryOption(customCategoryInput); } }} />
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addCategoryOption(customCategoryInput)}>Add</button>
                                        </div>
                                        <div className="text-xs text-muted" style={{ marginTop: 8 }}>You can add a new category and create subcategories for this job.</div>
                                        {errors.category && <span className="form-error">{errors.category.message}</span>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Subcategories</label>
                                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <input className="form-input" placeholder="Add subcategory" value={subCategoryInput} onChange={(event) => setSubCategoryInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addSubCategory(subCategoryInput); } }} />
                                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => addSubCategory(subCategoryInput)}><FiPlus /></button>
                                        </div>
                                        {suggestedSubCategories.length > 0 && (
                                            <div style={{ marginTop: 10 }}>
                                                <div className="text-xs text-muted" style={{ marginBottom: 8 }}>Suggested for this category</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {suggestedSubCategories.map((item) => (
                                                        <button key={item} type="button" className="btn btn-sm btn-secondary" onClick={() => addSubCategory(item)}>{item}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                                            {subCategories.map((item) => (
                                                <span key={item} className="skill-tag" style={{ fontSize: '0.875rem', padding: '5px 12px', cursor: 'pointer' }} onClick={() => removeSubCategory(item)}>
                                                    {item} x
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Experience Level</label>
                                    <select className="form-input" {...register('experienceLevel')}>
                                        <option value="entry">Entry Level</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="expert">Expert</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Budget (₹) *</label>
                                    <input className="form-input" type="number" placeholder="Budget"
                                        {...register('budget', { required: 'Budget required', min: { value: 100, message: 'Minimum ₹100' } })} />
                                    {errors.budget && <span className="form-error">{errors.budget.message}</span>}
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Job Type</label>
                                    <select className="form-input" {...register('jobType')}>
                                        <option value="fixed">Fixed Price</option>
                                        <option value="hourly">Hourly</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Deadline</label>
                                    <input className="form-input" type="date" {...register('deadline')} />
                                </div>
                            </div>
                        </div>

                        {/* Skills */}
                        <div className="card">
                            <h3 className="heading-sm" style={{ marginBottom: 16 }}>Required Skills</h3>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                                {SKILLS_SUGGESTIONS.map(s => (
                                    <button key={s} type="button" className="btn btn-sm btn-secondary" onClick={() => addSkill(s)}>{s}</button>
                                ))}
                            </div>
                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <input className="form-input" placeholder="Add custom skill..." value={skillInput}
                                    onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }} />
                                <button type="button" className="btn btn-primary" onClick={() => addSkill(skillInput)}><FiPlus /></button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {skills.map(s => (
                                    <span key={s} className="skill-tag" style={{ fontSize: '0.875rem', padding: '5px 12px', cursor: 'pointer' }}
                                        onClick={() => setSkills(prev => prev.filter(x => x !== s))}>
                                        {s} x
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Milestones */}
                        <div className="card">
                            <div className="flex-between" style={{ marginBottom: 16 }}>
                                <h3 className="heading-sm">Milestones (Optional)</h3>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => addMilestone({ title: '', amount: '', deadline: '' })}>
                                    <FiPlus /> Add Milestone
                                </button>
                            </div>
                            {milestones.map((m, i) => (
                                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Title</label>
                                        <input className="form-input" placeholder="Milestone title" {...register(`milestones.${i}.title`)} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Amount (₹)</label>
                                        <input className="form-input" type="number" placeholder="5000" {...register(`milestones.${i}.amount`)} />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Deadline</label>
                                        <input className="form-input" type="date" {...register(`milestones.${i}.deadline`)} />
                                    </div>
                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => removeMilestone(i)}><FiTrash2 /></button>
                                </div>
                            ))}
                        </div>

                        <div className="card">
                            <div className="flex-between" style={{ marginBottom: 12 }}>
                                <h3 className="heading-sm">Project files</h3>
                                <input ref={attachmentInputRef} type="file" hidden multiple onChange={handleAttachmentUpload} />
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingAttachments}>
                                    <FiPlus /> {uploadingAttachments ? 'Uploading…' : 'Add files'}
                                </button>
                            </div>
                            <p className="text-sm text-muted" style={{ marginBottom: 10 }}>Upload project brief, reference files, or contract templates. These are stored securely in Cloudinary and linked to the job.</p>
                            {attachments.length === 0 ? (
                                <div className="text-sm text-muted">No files added yet.</div>
                            ) : (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {attachments.map((attachment) => (
                                        <span key={attachment.url || attachment.name} className="skill-tag" style={{ fontSize: '0.875rem', padding: '5px 12px' }}>
                                            {attachment.name || 'Attachment'}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? 'Posting...' : 'Post Job & Find Freelancers'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
