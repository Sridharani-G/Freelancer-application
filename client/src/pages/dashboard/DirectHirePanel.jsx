import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import API from '../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiUserPlus } from 'react-icons/fi';

export default function DirectHirePanel() {
    const { user } = useSelector((state) => state.auth);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const endpoint = user?.role === 'client' ? '/direct-hire/client' : '/direct-hire/freelancer';

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await API.get(endpoint);
                setRequests(data.requests || []);
            } catch {
                setRequests([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [endpoint]);

    const updateStatus = async (id, status) => {
        try {
            const { data } = await API.put(`/direct-hire/${id}/status`, { status });
            setRequests((prev) => prev.map((item) => (item._id === id ? { ...item, status: data.request?.status || status } : item)));
            toast.success(`Request ${status}`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to update request');
        }
    };

    return (
        <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 className="heading-sm">Direct hire requests</h3>
                <span className="badge badge-secondary"><FiUserPlus /> {requests.filter((r) => r.status === 'pending').length} pending</span>
            </div>
            {loading ? (
                <div className="text-sm text-muted">Loading…</div>
            ) : requests.length === 0 ? (
                <div className="text-sm text-muted">No direct hire requests yet.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {requests.map((request) => (
                        <div key={request._id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div className="avatar avatar-sm" style={{ overflow: 'hidden', flexShrink: 0, width: 36, height: 36, fontSize: '0.9rem' }}>
                                        {(user?.role === 'client' ? request.freelancer?.avatar : request.client?.avatar)
                                            ? <img src={user?.role === 'client' ? request.freelancer.avatar : request.client.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                            : (user?.role === 'client' ? request.freelancer?.name?.[0] : request.client?.name?.[0]) || '?'}
                                    </div>
                                    <div>
                                        <div className="font-semibold">
                                            {user?.role === 'client' ? request.freelancer?.name : request.client?.name}
                                        </div>
                                        <div className="text-xs text-muted">{request.jobTitle || 'Direct hire request'}</div>
                                        {request.message && <div className="text-sm" style={{ marginTop: 4 }}>{request.message}</div>}
                                    </div>
                                </div>
                                <span className={`badge ${request.status === 'accepted' ? 'badge-success' : request.status === 'rejected' ? 'badge-danger' : request.status === 'pending' ? 'badge-warning' : 'badge-primary'}`}>{request.status}</span>
                            </div>
                            {user?.role === 'freelancer' && request.status === 'pending' && (
                                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(request._id, 'accepted')}><FiCheck /> Accept</button>
                                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(request._id, 'rejected')}><FiX /> Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
