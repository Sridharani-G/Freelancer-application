import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { logoutUser } from '../../redux/slices/authSlice';
import { getRoleDashboardPath } from '../../utils/rolePaths';
import {
    FiSun, FiMoon, FiBell, FiMenu, FiX, FiUser, FiLogOut, FiSettings, FiGrid, FiMessageSquare
} from 'react-icons/fi';
import { RiSparklingFill } from 'react-icons/ri';
import toast from 'react-hot-toast';

export default function Navbar({ theme, toggleTheme }) {
    const { user, isAuthenticated } = useSelector((s) => s.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser());
            toast.success('Logged out successfully');
            navigate('/login', { replace: true });
        } catch (error) {
            console.error('Logout failed:', error);
            toast.error('Logout failed. Please try again.');
        }
    };

    const dashboardLink = getRoleDashboardPath(user?.role);
    const isActive = (path) => location.pathname === path ? 'active' : '';
    const browseLink = user?.role === 'freelancer'
        ? { to: '/jobs', label: 'Browse Jobs' }
        : user?.role === 'client'
            ? { to: '/freelancers', label: 'Browse Freelancers' }
            : null;
    const isBrowseActive = browseLink?.to === '/jobs'
        ? location.pathname.startsWith('/jobs')
        : location.pathname.startsWith('/freelancers');

    return (
        <nav className="navbar">
            <div className="container navbar-inner">
                {/* Brand */}
                <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img src="/logo.png" alt="SkillSphere" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                    <div style={{ fontWeight: 800 }}>Skill<span style={{ fontWeight: 700 }}>Sphere</span></div>
                </Link>

                {/* Desktop Nav Links */}
                <div className="navbar-links">
                    <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
                    {browseLink ? (
                        <Link to={browseLink.to} className={`nav-link ${isBrowseActive ? 'active' : ''}`}>{browseLink.label}</Link>
                    ) : (
                        <Link to="/jobs" className={`nav-link ${location.pathname.startsWith('/jobs') ? 'active' : ''}`}>Browse Jobs</Link>
                    )}
                </div>

                {/* Actions */}
                <div className="navbar-actions">
                    <button className="btn btn-ghost btn-icon" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
                    </button>

                    {isAuthenticated ? (
                        <>
                            <Link to="/chat" className="btn btn-ghost btn-icon" title="Messages">
                                <FiMessageSquare size={18} />
                            </Link>
                            <Link to="/notifications" className="btn btn-ghost btn-icon" style={{ position: 'relative' }}>
                                <FiBell size={18} />
                            </Link>
                            <div ref={dropdownRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setDropdownOpen((o) => !o)}
                                    className="avatar avatar-sm"
                                    style={{ border: '2px solid var(--primary)', cursor: 'pointer' }}
                                >
                                    {user?.avatar
                                        ? <img src={user.avatar} alt={user.name} referrerPolicy="no-referrer" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        : user?.name?.[0]?.toUpperCase()}
                                </button>
                                {dropdownOpen && (
                                    <div className="card" style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', minWidth: 200, padding: 8, zIndex: 100, animation: 'fadeInUp 0.2s ease' }}>
                                        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
                                            <div className="font-semibold text-sm">{user?.name}</div>
                                            <div className="text-xs text-muted" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
                                        </div>
                                        <Link to={dashboardLink} className="sidebar-link" onClick={() => setDropdownOpen(false)}>
                                            <FiGrid className="icon" /> Dashboard
                                        </Link>
                                        <Link to="/profile" className="sidebar-link" onClick={() => setDropdownOpen(false)}>
                                            <FiUser className="icon" /> Profile
                                        </Link>
                                        {user?.role === 'freelancer' && (
                                            <Link to="/gigs/manage" className="sidebar-link" onClick={() => setDropdownOpen(false)}>
                                                <FiGrid className="icon" /> Manage Gigs
                                            </Link>
                                        )}
                                        <Link to="/settings" className="sidebar-link" onClick={() => setDropdownOpen(false)}>
                                            <FiSettings className="icon" /> Settings
                                        </Link>
                                        <button className="sidebar-link" style={{ color: 'var(--danger)', width: '100%' }} onClick={handleLogout}>
                                            <FiLogOut className="icon" /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
                            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
