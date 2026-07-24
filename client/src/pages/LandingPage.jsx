import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiSearch, FiCheckCircle, FiStar, FiZap, FiShield, FiUsers, FiTrendingUp, FiGlobe, FiMapPin, FiCreditCard, FiMessageSquare, FiLock, FiBriefcase, FiHeart } from 'react-icons/fi';
import { RiBrainFill } from 'react-icons/ri';
import API from '../services/api';

const FEATURES = [
    { icon: <RiBrainFill />, title: 'AI-Powered Matching', desc: 'Our engine scores freelancers by skill, location, experience, and reputation to find the perfect fit.' },
    { icon: <FiMapPin />, title: 'Hyperlocal First', desc: 'Prioritize nearby talent with Haversine-based distance scoring — hire local, build community.' },
    { icon: <FiCreditCard />, title: 'Milestone Payments', desc: 'Release funds only when work is approved. Every milestone is tracked and transparent.' },
    { icon: <FiMessageSquare />, title: 'Real-Time Chat', desc: 'Built-in Socket.io messaging with typing indicators, read receipts and file sharing.' },
    { icon: <FiStar />, title: 'Reputation System', desc: 'Bronze → Diamond badges earned through on-time delivery, ratings, and completed projects.' },
    { icon: <FiLock />, title: 'Secure by Default', desc: 'JWT + refresh tokens, 2FA, rate limiting, XSS/NoSQL sanitization, and role-based access.' },
];

const STEPS = [
    { n: '01', title: 'Post Your Job', desc: 'Describe your project, budget, required skills, and deadline in minutes.' },
    { n: '02', title: 'AI Finds Matches', desc: 'Our engine ranks freelancers by compatibility score — you see the top candidates instantly.' },
    { n: '03', title: 'Collaborate & Track', desc: 'Chat, set milestones, track progress in real time on your dashboard.' },
    { n: '04', title: 'Release & Review', desc: 'Approve work, release milestone payments, and leave a public review.' },
];

const TESTIMONIALS = [];

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

export default function LandingPage() {
    const [categoryCards, setCategoryCards] = useState([]);
    const [liveStats, setLiveStats] = useState({ openJobs: 0, freelancerProfiles: 0, cities: 0, satisfaction: 0 });
    const [liveMatches, setLiveMatches] = useState([]);

    useEffect(() => {
        // Single efficient public endpoint — no auth needed
        API.get('/admin/public-stats')
            .then(({ data }) => {
                if (data.success) {
                    const { stats, topMatches, categories } = data;
                    setLiveStats({
                        openJobs: stats.openJobs ?? 0,
                        freelancerProfiles: stats.freelancerProfiles ?? 0,
                        cities: stats.cities ?? 0,
                        satisfaction: stats.satisfaction ?? 0,
                    });
                    setLiveMatches(topMatches || []);
                    setCategoryCards(categories || []);
                }
            })
            .catch(() => { /* ignore */ });
    }, []);

    return (
        <div style={{ overflow: 'hidden' }}>

            {/* ── HERO ─────────────────────────────────────────────── */}
            <section className="hero">
                {/* Left: Title + CTA Buttons + Subtitle */}
                <div style={{ position: 'relative', zIndex: 2, padding: '0 56px 64px', maxWidth: 680 }}>
                    <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.12 } } }}>
                        <motion.h1
                            variants={fadeUp}
                            className="hero-title"
                            style={{ color: 'white', lineHeight: 1.15, fontSize: 'clamp(2.8rem, 5.2vw, 5.2rem)', fontWeight: 900, marginBottom: 28 }}
                        >
                            Find <span style={{ backgroundImage: 'linear-gradient(135deg, var(--primary), var(--secondary), var(--accent))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Perfect<br />
                                Talent, Powered<br />
                                by AI.
                            </span>
                        </motion.h1>

                        <motion.div variants={fadeUp} className="hero-cta" style={{ marginBottom: 28 }}>
                            <Link to="/register?role=client" className="btn btn-primary btn-lg" style={{ borderRadius: '12px' }}>
                                Post a Job <FiArrowRight />
                            </Link>
                            <Link to="/jobs" className="btn" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)', padding: '14px 32px', borderRadius: '12px', fontWeight: 600 }}>
                                Browse Jobs <FiSearch />
                            </Link>
                        </motion.div>

                        <motion.p variants={fadeUp} className="hero-subtitle" style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.65)', maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
                            Connect clients and freelancers through project-based collaboration and intelligent matching.
                        </motion.p>
                    </motion.div>
                </div>

                {/* Right: Stats — pinned to bottom-right */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    style={{ position: 'absolute', bottom: 64, right: 64, zIndex: 2 }}
                >
                    <div className="hero-stats" style={{ margin: 0 }}>
                        {[
                            { value: liveStats.openJobs, label: 'Open jobs' },
                            { value: liveStats.freelancerProfiles, label: 'Freelancer profiles' },
                            { value: liveStats.cities, label: 'Cities' },
                            { value: liveStats.satisfaction > 0 ? `${liveStats.satisfaction}%` : '—', label: 'Satisfaction' },
                        ].map((item) => (
                            <div key={item.label} style={{ textAlign: 'left' }}>
                                <div className="hero-stat-value" style={{ fontSize: '2rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit, sans-serif' }}>{item.value}</div>
                                <div className="hero-stat-label" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </section>

            {/* ── FEATURES ─────────────────────────────────────────── */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Why Our Platform</div>
                        <h2 className="heading-lg">Everything You Need,<br /><span className="text-gradient">All in One Place</span></h2>
                    </div>
                    <div className="features-grid">
                        {FEATURES.map((f, i) => (
                            <motion.div key={f.title} className="feature-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                                <div className="feature-icon">{f.icon}</div>
                                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                                <p className="text-sm text-muted">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── AI MATCHING EXPLAINER ─────────────────────────────── */}
            <section className="section" style={{ background: 'linear-gradient(135deg, #111111, #1a1a1a)' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
                        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                            <div className="section-label">AI Engine</div>
                            <h2 className="heading-lg" style={{ color: 'white', marginBottom: 20 }}>Intelligent<br /><span className="text-gradient">Talent Matching</span></h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, lineHeight: 1.8 }}>Our multi-dimensional scoring algorithm evaluates every freelancer across 5 dimensions to surface the best match for your project.</p>
                            {[
                                ['Skills Match', '50%', 'Jaccard similarity between required and possessed skills'],
                                ['Experience', '20%', 'Years mapped to job level (entry/mid/expert)'],
                                ['Distance', '15%', 'Haversine geo-proximity within 50km radius'],
                                ['Budget Fit', '10%', 'Closeness of hourly rate to project budget'],
                                ['Reputation', '15%', 'Rating, badge, on-time delivery score'],
                            ].map(([label, pct, desc]) => (
                                <div key={label} style={{ marginBottom: 16 }}>
                                    <div className="flex-between" style={{ marginBottom: 6 }}>
                                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{label}</span>
                                        <span style={{ color: '#00c9a7', fontWeight: 700, fontSize: '0.9rem' }}>{pct}</span>
                                    </div>
                                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                                        <motion.div style={{ height: '100%', background: 'linear-gradient(90deg,#00c9a7,#0ea5e9)', borderRadius: 99 }} initial={{ width: 0 }} whileInView={{ width: pct }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 }} />
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{desc}</p>
                                </div>
                            ))}
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Live Compatibility Engine</span>
                                <span style={{
                                    background: liveMatches.length > 0 ? 'rgba(0, 201, 167, 0.15)' : 'rgba(255,255,255,0.07)',
                                    color: liveMatches.length > 0 ? '#00c9a7' : 'rgba(255,255,255,0.4)',
                                    border: `1px solid ${liveMatches.length > 0 ? 'rgba(0,201,167,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                    padding: '2px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 700
                                }}>
                                    {liveMatches.length > 0 ? `${liveMatches.length} Active Match${liveMatches.length > 1 ? 'es' : ''}` : 'Awaiting Data'}
                                </span>
                            </div>

                            {liveMatches.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    style={{
                                        padding: '36px 24px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px dashed rgba(255,255,255,0.12)',
                                        borderRadius: 16,
                                        textAlign: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 12
                                    }}
                                >
                                    <RiBrainFill style={{ fontSize: '2rem', opacity: 0.4, color: 'var(--primary)' }} />
                                    <div style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 700, fontSize: '0.95rem' }}>Engine Ready — No Matches Yet</div>
                                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6, maxWidth: 280, margin: 0 }}>
                                        Post a job and add freelancer profiles — the AI engine will compute and display real-time compatibility scores here automatically.
                                    </p>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                        <Link to="/jobs" style={{ fontSize: '0.78rem', color: '#00c9a7', fontWeight: 600, textDecoration: 'none', padding: '5px 12px', border: '1px solid rgba(0,201,167,0.3)', borderRadius: 8 }}>Browse Jobs</Link>
                                        <Link to="/register?role=freelancer" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textDecoration: 'none', padding: '5px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}>Join as Freelancer</Link>
                                    </div>
                                </motion.div>
                            ) : liveMatches.map((match, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.15 }}
                                    className="card-glass"
                                    style={{
                                        padding: 18,
                                        color: 'white',
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        borderRadius: 16,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 12,
                                        backdropFilter: 'blur(12px)',
                                        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <img
                                                src={match.freelancerAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${match.freelancerName}`}
                                                alt={match.freelancerName}
                                                referrerPolicy="no-referrer"
                                                style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)', objectFit: 'cover' }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{match.freelancerName}</div>
                                                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>Matched Freelancer</div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ color: match.score >= 85 ? '#00c9a7' : '#0ea5e9', fontWeight: 900, fontSize: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
                                                {match.score}%
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>Match Score</div>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', borderRadius: 10, padding: '10px 12px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>For Project</div>
                                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.jobTitle}</div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Skills Relevance</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ height: 4, flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                                    <div style={{ height: '100%', background: '#00c9a7', width: `${match.skillsMatch}%`, borderRadius: 2 }} />
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{match.skillsMatch}%</span>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Budget Alignment</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ height: 4, flex: 1, background: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
                                                    <div style={{ height: '100%', background: '#0ea5e9', width: `${match.budgetFit}%`, borderRadius: 2 }} />
                                                </div>
                                                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{match.budgetFit}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── CATEGORIES ───────────────────────────────────────── */}
            <section className="section">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Browse by Category</div>
                        <h2 className="heading-lg">Popular <span className="text-gradient">Job Categories</span></h2>
                    </div>
                    <div className="categories-grid">
                        {categoryCards.length === 0 ? (
                            <div className="card" style={{ gridColumn: '1 / -1', padding: 24, textAlign: 'center' }}>
                                <p className="text-muted">No public job categories are available yet.</p>
                            </div>
                        ) : categoryCards.map((c, i) => (
                            <motion.div key={c.name} className="category-card" initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                                <div className="category-icon"><FiBriefcase /></div>
                                <div className="category-name">{c.name}</div>
                                <div className="category-count">{c.count} open</div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────── */}
            <section className="section" style={{ background: 'var(--bg)' }}>
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Process</div>
                        <h2 className="heading-lg">How It <span className="text-gradient">Works</span></h2>
                    </div>
                    <div className="steps">
                        {STEPS.map((s, i) => (
                            <motion.div key={s.n} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <div className="step-number">{s.n}</div>
                                <h3 className="heading-sm" style={{ marginBottom: 8 }}>{s.title}</h3>
                                <p className="text-sm text-muted">{s.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── TESTIMONIALS ─────────────────────────────────────── */}
            <section className="section section-dark">
                <div className="container">
                    <div className="section-header">
                        <div className="section-label">Testimonials</div>
                        <h2 className="heading-lg" style={{ color: 'white' }}>Loved by <span className="text-gradient">Thousands</span></h2>
                    </div>
                    <div className="testimonials-grid">
                        {TESTIMONIALS.map((t, i) => (
                            <motion.div key={t.name} className="testimonial-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                                <div className="quote-mark">"</div>
                                <p style={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7, margin: '12px 0 20px', fontSize: '0.95rem' }}>{t.text}</p>
                                <div className="flex" style={{ gap: 12, alignItems: 'center' }}>
                                    <div className="avatar avatar-sm">{t.name[0]}</div>
                                    <div>
                                        <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{t.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{t.role}</div>
                                    </div>
                                    <div className="stars" style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                                        {Array.from({ length: t.rating }).map((_, idx) => (
                                            <FiStar key={idx} style={{ color: '#f59e0b', fill: '#f59e0b', fontSize: '0.8rem' }} />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ──────────────────────────────────────────────── */}
            <section className="section">
                <div className="container">
                    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ textAlign: 'center', background: 'linear-gradient(135deg,#00c9a7,#0ea5e9)', borderRadius: 32, padding: '72px 32px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'url(data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.04"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E)' }} />
                        <h2 className="heading-lg" style={{ color: 'white', marginBottom: 16, position: 'relative' }}>Ready to Get Started?</h2>
                        <p style={{ color: 'rgba(255,255,255,0.75)', marginBottom: 36, fontSize: '1.1rem', position: 'relative' }}>Create an account to start posting work or applying for projects.</p>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                            <Link to="/register?role=client" className="btn btn-lg" style={{ background: 'white', color: 'var(--primary-dark)', fontWeight: 700, boxShadow: 'var(--shadow-clay-outer)' }}>Hire a Freelancer</Link>
                            <Link to="/register?role=freelancer" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '2px solid rgba(255,255,255,0.3)' }}>Offer Your Skills</Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── FOOTER ───────────────────────────────────────────── */}
            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div>
                            <div className="footer-brand">Platform</div>
                            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, maxWidth: 280, marginBottom: 24 }}>Project-based collaboration platform for clients and freelancers.</p>
                        </div>
                        {[['Platform', ['Browse Jobs', 'Post a Job', 'Become a Freelancer', 'AI Matching']],
                        ['Company', ['About', 'Blog', 'Careers', 'Press']],
                        ['Support', ['Help Center', 'Privacy Policy', 'Terms of Service', 'Contact', 'Feedback']]].map(([title, links]) => (
                            <div key={title}>
                                <div style={{ color: 'white', fontWeight: 700, marginBottom: 16, fontSize: '0.9rem' }}>{title}</div>
                                {links.map((l) => {
                                    const pathMap = {
                                        'Browse Jobs': '/jobs',
                                        'Post a Job': '/register?role=client',
                                        'Become a Freelancer': '/register?role=freelancer',
                                        'AI Matching': '/jobs',
                                        About: '/about',
                                        Blog: 'https://www.nayoda.in/',
                                        Careers: 'https://www.nayoda.in/about',
                                        Press: 'https://www.nayoda.in/about',
                                        'Help Center': '/help',
                                        'Privacy Policy': '/privacy',
                                        'Terms of Service': '/terms',
                                        Contact: '/contact',
                                        Feedback: '/feedback',
                                    };
                                    return <Link key={l} to={pathMap[l] || '/'} className="footer-link">{l}</Link>;
                                })}
                            </div>
                        ))}
                    </div>
                    <div className="footer-bottom">
                        <span>© 2026 Platform. All rights reserved.</span>
                        <span>Built with <FiHeart style={{ color: '#ef4444', display: 'inline-block', verticalAlign: 'middle' }} /></span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
