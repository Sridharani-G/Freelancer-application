import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip, FiSmile, FiMessageSquare, FiX, FiMapPin } from 'react-icons/fi';
import { connectSocket, getSocket } from '../../services/socket';
import API from '../../services/api';
import toast from 'react-hot-toast';

const getDisplayName = (person, fallback = 'Contact') => {
    if (!person) return fallback;
    if (typeof person === 'string') return person || fallback;
    const rawName = person.name || person.fullName || person.email || '';
    if (rawName) return rawName;
    if (person.email) return person.email.split('@')[0];
    return fallback;
};

const getAvatarLabel = (person, fallback = 'C') => {
    const name = getDisplayName(person, fallback);
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return fallback.slice(0, 2).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ChatPage() {
    const { userId: targetId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector((s) => s.auth);
    const location = useLocation();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [text, setText] = useState('');
    const [hasPrefilledLocation, setHasPrefilledLocation] = useState(false);
    const [typing, setTyping] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [pendingAttachment, setPendingAttachment] = useState(null);
    const [uploadingAttachment, setUploadingAttachment] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimerRef = useRef(null);
    const attachmentInputRef = useRef(null);

    // Connect socket and handle incoming updates for the current conversation
    useEffect(() => {
        if (!user) return undefined;
        const socket = connectSocket(user._id);

        const handleOnlineUsers = (ids) => setOnlineUsers(ids);
        const handleIncomingMessage = (msg) => {
            const convId = [user._id, targetId].sort().join('_');
            if (msg.conversationId !== convId) return;
            setMessages((prev) => [...prev, msg]);
            scrollBottom();
        };
        const handleTypingEvent = ({ userId, conversationId, isTyping }) => {
            const convId = [user._id, targetId].sort().join('_');
            if (conversationId !== convId) return;
            if (userId !== user._id) setTyping(isTyping);
        };

        socket.on('users:online', handleOnlineUsers);
        socket.on('chat:message', handleIncomingMessage);
        socket.on('chat:typing', handleTypingEvent);

        return () => {
            socket.off('users:online', handleOnlineUsers);
            socket.off('chat:message', handleIncomingMessage);
            socket.off('chat:typing', handleTypingEvent);
        };
    }, [user, targetId]);

    // Load conversations
    useEffect(() => {
        API.get('/messages/conversations').then(({ data }) => {
            setConversations(data.conversations || []);
            const firstConversation = data.conversations?.[0];
            if (targetId && data.conversations?.length) {
                const match = data.conversations.find((c) => c.partner?._id === targetId);
                setSelectedUser(match?.partner || null);
            } else if (firstConversation?.partner) {
                setSelectedUser(firstConversation.partner);
            }
        });
    }, [targetId]);

    // Load the selected contact details if they are not already present
    useEffect(() => {
        if (!targetId) {
            setSelectedUser(null);
            return;
        }

        let ignore = false;
        API.get(`/users/${targetId}`).then(({ data }) => {
            if (!ignore) setSelectedUser(data.user || null);
        }).catch(() => {
            if (!ignore) setSelectedUser(null);
        });

        return () => {
            ignore = true;
        };
    }, [targetId]);

    // Load messages when target changes
    useEffect(() => {
        if (!targetId) {
            setMessages([]);
            return undefined;
        }

        const convId = [user?._id, targetId].sort().join('_');
        API.get(`/messages/${targetId}`).then(({ data }) => {
            setMessages(data.messages || []);
            scrollBottom();
        }).catch(() => setMessages([]));

        const socket = getSocket();
        if (socket) {
            socket.emit('chat:join', convId);
        }

        return () => {
            if (socket) {
                socket.emit('chat:leave', convId);
            }
        };
    }, [targetId, user?._id]);

    const shareLocationQuery = new URLSearchParams(location.search).get('shareLocation') === '1';
    useEffect(() => {
        if (!shareLocationQuery || hasPrefilledLocation || !selectedUser || text.trim()) return;
        const locationText = [selectedUser.location?.address, selectedUser.location?.city, selectedUser.location?.state, selectedUser.location?.country].filter(Boolean).join(', ');
        if (!locationText) return;
        setText(`Hi ${getDisplayName(selectedUser)}, I’m interested in your work in ${locationText}.`);
        setHasPrefilledLocation(true);
    }, [shareLocationQuery, selectedUser, hasPrefilledLocation, text]);

    const scrollBottom = () => { setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); };

    const handleAttachmentUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingAttachment(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'skillsphere/chat');
            const { data } = await API.post('/uploads/media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            if (!data?.success || !data.url) throw new Error('Upload failed');
            setPendingAttachment({ name: file.name, url: data.url, type: data.type || 'file' });
            toast.success('Attachment uploaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Attachment upload failed');
        } finally {
            setUploadingAttachment(false);
            event.target.value = '';
        }
    };

    const handleSend = async () => {
        if ((!text.trim() && !pendingAttachment) || !targetId) return;
        const msgText = text.trim();
        setText('');
        const payload = {
            content: msgText || (pendingAttachment?.name || 'Shared a file'),
            type: pendingAttachment ? (pendingAttachment.type === 'video' ? 'video' : pendingAttachment.type === 'image' ? 'image' : 'pdf') : 'text',
        };
        if (pendingAttachment) {
            payload.fileUrl = pendingAttachment.url;
        }
        try {
            const { data } = await API.post(`/messages/${targetId}`, payload);
            setMessages(prev => [...prev, data.message]);
            setPendingAttachment(null);
            const socket = getSocket();
            if (socket) {
                const convId = [user._id, targetId].sort().join('_');
                socket.emit('chat:message', { conversationId: convId, message: data.message });
            }
            scrollBottom();
        } catch { toast.error('Failed to send'); }
    };

    const handleTyping = () => {
        const socket = getSocket();
        if (socket && targetId) {
            const convId = [user._id, targetId].sort().join('_');
            socket.emit('chat:typing', { conversationId: convId, userId: user._id, isTyping: true });
            clearTimeout(typingTimerRef.current);
            typingTimerRef.current = setTimeout(() => {
                socket.emit('chat:typing', { conversationId: convId, userId: user._id, isTyping: false });
            }, 2000);
        }
    };

    return (
        <div className="page" style={{ paddingTop: 72 }}>
            <div className="chat-layout">
                {/* Conversations Sidebar */}
                <div className="chat-sidebar">
                    <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
                        <h3 className="heading-sm">Messages</h3>
                    </div>
                    {conversations.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                            <FiMessageSquare style={{ fontSize: '2.5rem', color: 'var(--primary)' }} />
                            <p className="text-muted text-sm" style={{ marginTop: 12 }}>No conversations yet</p>
                        </div>
                    ) : conversations.map((c) => (
                        <div key={c.conversationId} className={`chat-contact ${targetId === c.partner?._id ? 'active' : ''}`}
                            onClick={() => { navigate(`/chat/${c.partner?._id}`); setSelectedUser(c.partner); }}>
                            <div style={{ position: 'relative' }}>
                                <div className="avatar avatar-md" style={{ overflow: 'hidden' }}>
                                    {c.partner?.avatar
                                        ? <img src={c.partner.avatar} alt={getDisplayName(c.partner)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                        : getAvatarLabel(c.partner, 'C')}
                                </div>
                                {onlineUsers.includes(c.partner?._id) && (
                                    <div className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0 }} />
                                )}
                            </div>
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div className="font-semibold text-sm">{getDisplayName(c.partner, 'Contact')}</div>
                                <div className="text-xs text-muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.lastMessage?.content || 'Start a conversation'}
                                </div>
                            </div>
                            {c.unread > 0 && <span className="badge badge-primary">{c.unread}</span>}
                        </div>
                    ))}
                </div>

                {/* Chat Area */}
                {!targetId ? (
                    <div className="flex-center" style={{ flexDirection: 'column', gap: 12, color: 'var(--text-muted)' }}>
                        <FiMessageSquare style={{ fontSize: '4rem', color: 'var(--primary)', opacity: 0.5 }} />
                        <p>Select a conversation to start chatting</p>
                    </div>
                ) : (
                    <div className="chat-area">
                        {/* Chat Header */}
                        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)' }}>
                            <div className="avatar avatar-sm" style={{ overflow: 'hidden' }}>
                                {selectedUser?.avatar
                                    ? <img src={selectedUser.avatar} alt={getDisplayName(selectedUser)} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                                    : getAvatarLabel(selectedUser, 'C')}
                            </div>
                            <div>
                                <div className="font-semibold text-sm">{getDisplayName(selectedUser, 'Contact')}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <div className="text-xs" style={{ color: onlineUsers.includes(targetId) ? 'var(--success)' : 'var(--text-muted)' }}>
                                        {onlineUsers.includes(targetId) ? '● Online' : '● Offline'}
                                    </div>
                                    {selectedUser?.location?.city && (
                                        <div className="text-xs" style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                                            <FiMapPin size={12} /> {[selectedUser.location.city, selectedUser.location.country].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="chat-messages">
                            {messages.map((msg, i) => {
                                const isSent = msg.sender?._id === user._id || msg.sender === user._id;
                                return (
                                    <motion.div key={msg._id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                                        {!isSent && (
                                            <div className="message-author">{getDisplayName(msg.sender, 'Contact')}</div>
                                        )}
                                        <div className={`message-bubble ${isSent ? 'message-sent' : 'message-received'}`}>
                                            {msg.fileUrl ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                    <a href={msg.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                                                        Open attachment
                                                    </a>
                                                    {msg.content ? <div>{msg.content}</div> : null}
                                                </div>
                                            ) : (
                                                msg.content
                                            )}
                                        </div>
                                        <div className="message-time">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </motion.div>
                                );
                            })}
                            {typing && (
                                <div style={{ display: 'flex', gap: 4, padding: '8px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, borderBottomLeftRadius: 4, width: 'fit-content', alignItems: 'center' }}>
                                    {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-muted)', animation: `pulse-glow 1s ${i * 0.2}s infinite` }} />)}
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="chat-input-bar">
                            <input ref={attachmentInputRef} type="file" hidden onChange={handleAttachmentUpload} />
                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => attachmentInputRef.current?.click()} disabled={uploadingAttachment}>
                                <FiPaperclip />
                            </button>
                            {pendingAttachment && (
                                <div className="skill-tag" style={{ padding: '6px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                    <span>{pendingAttachment.name}</span>
                                    <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }} onClick={() => setPendingAttachment(null)}>
                                        <FiX size={12} />
                                    </span>
                                </div>
                            )}
                            <input className="form-input" placeholder="Type a message..." value={text}
                                onChange={e => { setText(e.target.value); handleTyping(); }}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                                style={{ flex: 1 }} />
                            <button className="btn btn-primary btn-icon" onClick={handleSend} disabled={!text.trim() && !pendingAttachment}>
                                <FiSend />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
