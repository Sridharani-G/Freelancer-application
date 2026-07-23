import { Link } from 'react-router-dom';

export default function InfoPage({ title, description, cta }) {
    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 760, padding: '32px 24px' }}>
                <div className="card" style={{ padding: 32, borderRadius: 24 }}>
                    <div className="badge badge-primary" style={{ marginBottom: 12 }}>{title}</div>
                    <h1 className="heading-lg" style={{ marginBottom: 8 }}>{title}</h1>
                    <p className="text-muted" style={{ lineHeight: 1.8, marginBottom: 20 }}>{description}</p>
                    <Link to="/" className="btn btn-primary">{cta}</Link>
                </div>
            </div>
        </div>
    );
}
