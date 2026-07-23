import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiBell, FiCheck, FiBellOff } from 'react-icons/fi';
import API from '../services/api';
import { connectSocket, getSocket } from '../services/socket';

export default function NotificationsPage() {
    const { user } = useSelector((state) => state.auth);
    const [notifs, setNotifs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        API.get('/notifications').then(({ data }) => setNotifs(data.notifications || [])).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!user?._id) return undefined;
        const socket = connectSocket(user._id);
        const handleNewNotification = (notification) => setNotifs((prev) => [notification, ...prev]);
        socket.on('notification:new', handleNewNotification);
        return () => {
            socket.off('notification:new', handleNewNotification);
        };
    }, [user?._id]);

    const markRead = async (id) => {
        await API.put(`/notifications/${id}/read`).catch(() => { });
        setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    };

    const markAllRead = async () => {
        await API.put('/notifications/read-all').catch(() => { });
        setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    return (
        <div className="page">
            <div className="container" style={{ padding: '32px 24px', maxWidth: 760 }}>
                <div className="flex-between" style={{ marginBottom: 24 }}>
                    <h1 className="heading-md" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiBell /> Notifications
                    </h1>
                    {notifs.some(n => !n.isRead) && (
                        <button className="btn btn-ghost btn-sm" onClick={markAllRead}><FiCheck /> Mark all read</button>
                    )}
                </div>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 70, borderRadius: 12 }} />)}
                    </div>
                ) : notifs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <FiBellOff style={{ fontSize: '4rem', color: 'var(--primary)', opacity: 0.5, marginBottom: 12 }} />
                        <p className="text-muted text-sm" style={{ marginTop: 12 }}>No notifications yet</p>
                    </div>
                ) : notifs.map((n, i) => (
                    <motion.div key={n._id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className="card" style={{ marginBottom: 10, cursor: 'pointer', opacity: n.isRead ? 0.65 : 1, borderLeft: n.isRead ? 'none' : '3px solid var(--primary)' }}
                        onClick={() => markRead(n._id)}>
                        <div className="flex-between">
                            <div>
                                <div className="font-semibold text-sm">{n.title}</div>
                                <div className="text-sm text-muted" style={{ marginTop: 3 }}>{n.body}</div>
                                <div className="text-xs text-muted" style={{ marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                            {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }} />}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
