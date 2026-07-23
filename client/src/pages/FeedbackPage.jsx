import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiStar } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function FeedbackPage() {
    const [form, setForm] = useState({ name: '', email: '', message: '', rating: 0 });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!form.rating) {
            toast.error('Please select a star rating from 1 to 5.');
            return;
        }
        if (!form.message.trim()) {
            toast.error('Please share your feedback before submitting.');
            return;
        }

        setSubmitting(true);
        try {
            const existing = JSON.parse(localStorage.getItem('feedbacks') || '[]');
            const entry = {
                id: Date.now().toString(),
                name: form.name.trim() || 'Anonymous',
                email: form.email.trim(),
                message: form.message.trim(),
                rating: form.rating,
                createdAt: new Date().toISOString(),
            };
            localStorage.setItem('feedbacks', JSON.stringify([entry, ...existing]));
            setForm({ name: '', email: '', message: '', rating: 0 });
            toast.success('Feedback submitted successfully');
        } catch (error) {
            toast.error('Unable to save feedback right now.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 760, padding: '32px 24px' }}>
                <Link to="/" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
                    <FiArrowLeft /> Back home
                </Link>

                <div className="card" style={{ padding: 32, borderRadius: 24 }}>
                    <div style={{ marginBottom: 20 }}>
                        <div className="badge badge-primary" style={{ marginBottom: 10 }}>Feedback</div>
                        <h1 className="heading-lg" style={{ marginBottom: 8 }}>Share your feedback</h1>
                        <p className="text-muted" style={{ lineHeight: 1.7 }}>
                            Tell us about your experience and leave a rating from 1 to 5 stars.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <input
                                className="form-input"
                                placeholder="Your name"
                                value={form.name}
                                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                style={{ flex: 1, minWidth: 220 }}
                            />
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Email (optional)"
                                value={form.email}
                                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                                style={{ flex: 1, minWidth: 220 }}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold" style={{ display: 'block', marginBottom: 8 }}>Your rating</label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {Array.from({ length: 5 }).map((_, index) => {
                                    const filled = index < form.rating;
                                    return (
                                        <button
                                            key={index}
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, rating: index + 1 }))}
                                            style={{
                                                border: '1px solid #f59e0b',
                                                background: filled ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255,255,255,0.7)',
                                                color: filled ? '#f59e0b' : '#64748b',
                                                fontSize: '1.45rem',
                                                cursor: 'pointer',
                                                padding: '8px 10px',
                                                borderRadius: 999,
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            aria-label={`Rate ${index + 1} star${index + 1 > 1 ? 's' : ''}`}
                                        >
                                            <FiStar />
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="text-xs text-muted" style={{ marginTop: 8 }}>
                                {form.rating ? `${form.rating} out of 5 stars selected` : 'Tap any star to choose a rating'}
                            </div>
                        </div>

                        <textarea
                            className="form-input"
                            rows="5"
                            placeholder="Write your feedback here..."
                            value={form.message}
                            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                        />

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Submit feedback'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
