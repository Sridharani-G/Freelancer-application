import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RiSparklingFill } from 'react-icons/ri';

export default function RoleSelectionPage() {
  return (
    <div className="page flex-center" style={{ background: 'linear-gradient(135deg,#111111,#1a1a1a)', minHeight: '100vh', padding: '40px 16px' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ width: '100%', maxWidth: 560, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
            <div className="navbar-logo-icon" style={{ width: 54, height: 54, fontSize: '1.4rem' }}><RiSparklingFill /></div>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>Create your account</h1>
          <p className="text-muted text-sm" style={{ marginTop: 8 }}>Choose how you want to use SkillSphere.</p>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <Link to="/register/client" className="btn btn-primary" style={{ justifyContent: 'center', padding: '16px 20px' }}>
            I’m a Client, hiring talent
          </Link>
          <Link to="/register/freelancer" className="btn btn-secondary" style={{ justifyContent: 'center', padding: '16px 20px' }}>
            I’m a Freelancer, offering services
          </Link>
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p className="text-sm text-muted">Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Log in</Link></p>
        </div>
      </motion.div>
    </div>
  );
}
