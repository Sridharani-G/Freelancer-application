import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
    return (
        <div className="page flex-center" style={{ minHeight: '100vh', flexDirection: 'column', gap: 20, textAlign: 'center', padding: 24 }}>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                <div style={{ fontSize: '8rem', fontWeight: 900, fontFamily: 'Outfit', background: 'linear-gradient(135deg,#00c9a7,#0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>404</div>
                <h2 className="heading-md" style={{ marginBottom: 12 }}>Page Not Found</h2>
                <p className="text-muted" style={{ marginBottom: 32 }}>The page you're looking for doesn't exist or was moved.</p>
                <Link to="/" className="btn btn-primary btn-lg">← Back to Home</Link>
            </motion.div>
        </div>
    );
}
