import { Link } from 'react-router-dom';
import { FiArrowRight, FiBriefcase, FiUsers, FiShield, FiStar } from 'react-icons/fi';

const highlights = [
    {
        icon: <FiUsers size={20} />,
        title: 'Trusted connections',
        text: 'Bring together clients and freelancers in one transparent workspace built around clear collaboration.',
    },
    {
        icon: <FiBriefcase size={20} />,
        title: 'Project-first workflow',
        text: 'Create jobs, review applications, and manage work from discovery through delivery.',
    },
    {
        icon: <FiShield size={20} />,
        title: 'Confidence and safety',
        text: 'Support your decisions with profiles, ratings, and communication tools designed for professional work.',
    },
    {
        icon: <FiStar size={20} />,
        title: 'Reputation that matters',
        text: 'Build trust over time with reviews, badges, and a transparent history of completed work.',
    },
];

export default function AboutPage() {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 1080, padding: '32px 24px 64px' }}>
                <div className="card" style={{ borderRadius: 28, padding: 36, background: 'linear-gradient(135deg, rgba(0,201,167,0.12), rgba(14,165,233,0.08))' }}>
                    <div className="badge badge-primary" style={{ marginBottom: 12 }}>About SkillSphere</div>
                    <h1 className="heading-lg" style={{ marginBottom: 12 }}>A modern platform for hiring, collaborating, and growing.</h1>
                    <p className="text-muted" style={{ lineHeight: 1.8, fontSize: '1rem', maxWidth: 760 }}>
                        SkillSphere is built to make freelance work easier to discover, manage, and trust. Clients can post work, review talent, and communicate clearly while freelancers can showcase skills, share portfolios, and connect with the right opportunities.
                    </p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
                        <Link to="/register?role=client" className="btn btn-primary">Hire talent</Link>
                        <Link to="/register?role=freelancer" className="btn btn-ghost">Join as freelancer</Link>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
                    {highlights.map((item) => (
                        <div key={item.title} className="card" style={{ padding: 24, borderRadius: 20 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42, borderRadius: 12, background: 'rgba(0,201,167,0.14)', color: 'var(--primary)', marginBottom: 12 }}>
                                {item.icon}
                            </div>
                            <h3 className="heading-sm" style={{ marginBottom: 8 }}>{item.title}</h3>
                            <p className="text-muted" style={{ lineHeight: 1.7, fontSize: '0.95rem' }}>{item.text}</p>
                        </div>
                    ))}
                </div>

                <div className="card" style={{ padding: 28, borderRadius: 24, marginTop: 24 }}>
                    <h2 className="heading-md" style={{ marginBottom: 10 }}>Why people use SkillSphere</h2>
                    <p className="text-muted" style={{ lineHeight: 1.8 }}>
                        Whether you are hiring for a short-term delivery or building long-term partnerships, SkillSphere helps turn intentions into action with practical tools for discovery, messaging, and review.
                    </p>
                    <Link to="/feedback" className="btn btn-ghost" style={{ marginTop: 16 }}>
                        Share feedback <FiArrowRight style={{ marginLeft: 8 }} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
