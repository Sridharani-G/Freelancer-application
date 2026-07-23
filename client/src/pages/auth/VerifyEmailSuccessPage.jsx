import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiSparklingFill } from 'react-icons/ri';

export default function VerifyEmailSuccessPage() {
    return (
        <div className="page flex-center" style={{ background: 'linear-gradient(135deg,#111111,#1a1a1a)', minHeight: '100vh', padding: '32px 16px' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ width: '100%', maxWidth: 460, padding: '36px 32px', borderRadius: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.35)', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                    <div className="navbar-logo-icon" style={{ width: 54, height: 54, fontSize: '1.4rem' }}><RiSparklingFill /></div>
                </div>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif', marginBottom: 10 }}>Email verified</h1>
                <p className="text-muted text-sm" style={{ marginBottom: 20 }}>Your email has been verified successfully. You can now sign in and continue.</p>
                <Link to="/login" className="btn btn-primary" style={{ justifyContent: 'center' }}>Go to login</Link>
            </motion.div>
        </div>
    );
}
