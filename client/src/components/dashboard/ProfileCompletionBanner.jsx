import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiChevronRight, FiAlertCircle } from 'react-icons/fi';

export default function ProfileCompletionBanner({ user, profile }) {
    if (!user) return null;

    // Stop displaying the banner if the account is older than 30 days
    const createdAt = new Date(user.createdAt || Date.now());
    const msInMonth = 30 * 24 * 60 * 60 * 1000;
    const isOldAccount = Date.now() - createdAt.getTime() > msInMonth;

    let percentage = 0;
    const missing = [];

    if (user.role === 'client') {
        const hasAvatar = !!user.avatar;
        const hasPhone = !!user.phone;
        const hasLocation = !!(user.location?.city || user.location?.country);

        if (hasAvatar) percentage += 20; else missing.push('Profile Photo');
        if (hasPhone) percentage += 30; else missing.push('Phone Number');
        if (hasLocation) percentage += 50; else missing.push('Location Details');
    } else if (user.role === 'freelancer') {
        const hasAvatar = !!user.avatar;
        const hasLocation = !!(user.location?.city || user.location?.country);
        const hasTitle = !!profile?.title;
        const hasBio = !!profile?.bio;
        const hasSkills = !!(profile?.skills?.length > 0);
        const hasGigs = !!(profile?.portfolio?.length > 0);

        if (hasAvatar) percentage += 10; else missing.push('Profile Photo');
        if (hasLocation) percentage += 10; else missing.push('Location Details');
        if (hasTitle) percentage += 20; else missing.push('Professional Title');
        if (hasBio) percentage += 20; else missing.push('Bio / Description');
        if (hasSkills) percentage += 20; else missing.push('Skills');
        if (hasGigs) percentage += 20; else missing.push('At least 1 Gig/Portfolio');
    } else {
        // Admin or other roles, skip banner
        return null;
    }

    if (percentage >= 100 || isOldAccount) return null;

    return (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="card" style={{ marginBottom: 20, padding: 20, border: '1px solid var(--primary)', background: 'linear-gradient(90deg, rgba(14,165,233,0.05), rgba(0,201,167,0.05))' }}>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
                        <h3 className="heading-sm" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <FiAlertCircle style={{ color: 'var(--primary)' }} />
                            {percentage < 50 ? 'Get started by completing your profile' : 'You are almost there!'}
                        </h3>
                        <span className="font-semibold" style={{ color: 'var(--primary)' }}>{percentage}% completed</span>
                    </div>
                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: 8, background: 'var(--bg-muted)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                        <div style={{ width: `${percentage}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #14b8a6)', borderRadius: 4, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                    </div>
                    <div className="text-sm text-muted">
                        Missing details to stand out: <strong style={{ color: 'var(--text)' }}>{missing.join(' • ')}</strong>
                    </div>
                </div>
                <div>
                    <Link to="/profile/edit" className="btn btn-primary btn-sm">Complete Profile <FiChevronRight /></Link>
                </div>
            </div>
        </motion.div>
    );
}
