import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, Line } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { FiUsers, FiBriefcase, FiStar, FiTrendingUp, FiSearch, FiShield, FiFolder, FiLayers } from 'react-icons/fi';
import API from '../../services/api';
import toast from 'react-hot-toast';

Chart.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Tooltip, Legend, Filler);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tab, setTab] = useState('overview');

    useEffect(() => {
        Promise.all([
            API.get('/admin/stats').catch(() => ({ data: {} })),
            API.get('/admin/users').catch(() => ({ data: { users: [] } })),
        ]).then(([statsRes, usersRes]) => {
            setStats(statsRes.data);
            setUsers(usersRes.data.users || []);
        }).finally(() => setLoading(false));
    }, []);

    const cards = stats ? [
        { icon: <FiUsers />, label: 'Total Users', value: stats.stats?.totalUsers, color: '#00c9a7', bg: 'rgba(0,201,167,0.1)' },
        { icon: <FiUsers />, label: 'Freelancers', value: stats.stats?.totalFreelancers, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
        { icon: <FiBriefcase />, label: 'Clients', value: stats.stats?.totalClients, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
        { icon: <FiBriefcase />, label: 'Jobs', value: stats.stats?.totalJobs, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
        { icon: <FiFolder />, label: 'Applications', value: stats.stats?.totalApplications, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
        { icon: <FiStar />, label: 'Reviews', value: stats.stats?.totalReviews, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    ] : [];

    const userGrowthData = {
        labels: (stats?.userGrowth || []).map(u => `${MONTHS[(u._id.month || 1) - 1]}`),
        datasets: [{
            label: 'New Users',
            data: (stats?.userGrowth || []).map(u => u.count),
            borderColor: '#00c9a7',
            backgroundColor: 'rgba(99,102,241,0.1)',
            fill: true, tension: 0.4,
        }],
    };

    const categoryData = {
        labels: (stats?.jobsByCategory || []).map(c => c._id),
        datasets: [{
            label: 'Jobs',
            data: (stats?.jobsByCategory || []).map(c => c.count),
            backgroundColor: ['#00c9a7', '#0ea5e9', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#22d3ee', '#f97316'],
            borderRadius: 8,
        }],
    };

    const handleToggleUser = async (userId, isActive) => {
        try {
            await API.put(`/admin/users/${userId}`, { isActive: !isActive });
            setUsers(u => u.map(x => x._id === userId ? { ...x, isActive: !isActive } : x));
            toast.success(`User ${!isActive ? 'activated' : 'deactivated'}`);
        } catch { toast.error('Failed'); }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px' }}>
                <div style={{ marginBottom: 28 }}>
                    <h1 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        Admin Dashboard <FiShield />
                    </h1>
                    <p className="text-muted text-sm">Platform overview and management</p>
                </div>

                {/* Tab Navigation */}
                <div className="tabs" style={{ marginBottom: 24 }}>
                    {['overview', 'users', 'analytics'].map(t => (
                        <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <>
                        {/* Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
                            {loading ? [1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton" style={{ height: 90 }} />) :
                                cards.map((c, i) => (
                                    <motion.div key={c.label} className="stat-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                                        <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
                                        <div>
                                            <div className="stat-value" style={{ color: c.color }}>{c.value?.toLocaleString() ?? 0}</div>
                                            <div className="stat-label">{c.label}</div>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>

                        {/* Top Freelancers */}
                        <div className="card">
                            <h3 className="heading-sm" style={{ marginBottom: 16 }}>Top Freelancers</h3>
                            <div className="table-container">
                                <table>
                                    <thead><tr><th>#</th><th>Freelancer</th><th>Rating</th><th>Projects</th><th>Badge</th></tr></thead>
                                    <tbody>
                                        {(stats?.topFreelancers || []).map((f, i) => (
                                            <tr key={f._id}>
                                                <td className="font-semibold" style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                                <td>
                                                    <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                                                        <div className="avatar avatar-sm" style={{ overflow: 'hidden', flexShrink: 0 }}>
                                                            {f.user?.avatar
                                                                ? <img src={f.user.avatar} alt={f.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                                : (f.user?.name?.[0] || 'F')}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm">{f.user?.name}</div>
                                                            <div className="text-xs text-muted">{f.user?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="stars" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                                        <FiStar style={{ color: '#f59e0b', fill: '#f59e0b' }} /> {f.rating?.toFixed(1) || '0.0'}
                                                    </span>
                                                </td>
                                                <td>{f.completedProjects}</td>
                                                <td><span className={`badge badge-${f.badge?.toLowerCase()}`}>{f.badge}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {tab === 'users' && (
                    <div className="card">
                        <div className="flex-between" style={{ marginBottom: 16 }}>
                            <h3 className="heading-sm">User Management</h3>
                            <div className="input-group" style={{ width: 280 }}>
                                <FiSearch className="input-icon" />
                                <input className="form-input" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
                                <tbody>
                                    {filteredUsers.map(u => (
                                        <tr key={u._id}>
                                            <td>
                                                <div className="flex" style={{ gap: 10, alignItems: 'center' }}>
                                                    <div className="avatar avatar-sm" style={{ overflow: 'hidden', flexShrink: 0 }}>
                                                        {u.avatar
                                                            ? <img src={u.avatar} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                                            : (u.name?.[0] || 'U')}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm">{u.name}</div>
                                                        <div className="text-xs text-muted">{u.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                                            <td className="text-sm text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Inactive'}</span>
                                            </td>
                                            <td>
                                                <button className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggleUser(u._id, u.isActive)}>
                                                    {u.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {tab === 'analytics' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <div className="card">
                            <h3 className="heading-sm" style={{ marginBottom: 16 }}>User Growth</h3>
                            {!loading && <Line data={userGrowthData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
                        </div>
                        <div className="card">
                            <h3 className="heading-sm" style={{ marginBottom: 16 }}>Jobs by Category</h3>
                            {!loading && <Bar data={categoryData} options={{ responsive: true, plugins: { legend: { display: false } } }} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
