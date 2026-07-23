import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const quickReplies = [
  'How do I register and verify my email?',
  'How do I post a job and receive applications?',
  'How do I update my profile and settings?',
  'How do I reset my password or get back into my account?',
  'How do I contact support or report an issue?',
];

function getBotReply(message) {
  const normalized = (message || '').toLowerCase().trim();

  if (!normalized) {
    return 'Please tell me what you need help with and I will guide you step by step.';
  }

  const greetingPatterns = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'thanks', 'thank you'];
  if (greetingPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'Hello! I can help with account setup, job posting, applications, profile updates, messaging, payments, and support requests. What would you like to do today?';
  }

  if (/(register|signup|sign up|create account|join|become a freelancer|hire talent)/.test(normalized)) {
    return 'You can register from the Get Started button on the home page. Choose your role, verify your email, and complete your profile so the dashboard unlocks correctly.';
  }

  if (/(post|publish|job|project|hire)/.test(normalized)) {
    return 'Clients can post a job from the dashboard by adding a title, description, budget, skills, and deadline. Once published, freelancers can view and apply to it.';
  }

  if (/(apply|application|applied|my applications)/.test(normalized)) {
    return 'Freelancers can apply to open jobs from the job details page. Clients can review applications from the relevant job page or dashboard.';
  }

  if (/(profile|settings|edit profile|update profile|location|phone|skills|availability)/.test(normalized)) {
    return 'Open your profile or settings area from the dashboard to update personal details, skills, location, contact information, and other account preferences.';
  }

  if (/(message|chat|conversation|notification|inbox)/.test(normalized)) {
    return 'Use the messaging and notifications sections from your dashboard to stay in touch with clients or freelancers and track project updates.';
  }

  if (/(forgot|reset|password|login|log in|access|locked|unable to sign in)/.test(normalized)) {
    return 'If you cannot access your account, use the Forgot Password link on the login page. If the issue continues, contact support with your email address and the problem you are seeing.';
  }

  if (/(support|contact|issue|bug|error|problem|help|report)/.test(normalized)) {
    return 'You can reach the support team at support@nayoda.in. Please include your account email, a short description of the issue, and any relevant screenshots if available.';
  }

  if (/(payment|milestone|release|fund|invoice)/.test(normalized)) {
    return 'Payments and milestone approvals are usually handled between the client and freelancer. If you need support with the platform experience, contact support.';
  }

  if (/(feedback|review|rating|testimonial)/.test(normalized)) {
    return 'You can leave feedback or review a completed collaboration from the project or profile page after work is confirmed.';
  }

  if (/(privacy|term|policy|legal|data)/.test(normalized)) {
    return 'You can review our Privacy Policy and Terms & Conditions directly from the footer links on the website.';
  }

  if (/(how|what|where|can|do)/.test(normalized)) {
    return 'I can help with account setup, job posting, applications, profile updates, messaging, payments, and support. Tell me your question in a sentence and I will guide you through it.';
  }

  return 'I understand that you need help with the platform. Try asking about account setup, job posting, applications, profile editing, payments, or support, and I will guide you through it.';
}

export default function HelpCenterPage() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Hello! I can help with common questions about creating an account, posting jobs, resetting passwords, and contacting support.',
    },
  ]);
  const [draft, setDraft] = useState('');

  function sendMessage(text) {
    const value = text.trim();
    if (!value) return;

    setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', text: value }]);
    setDraft('');

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: getBotReply(value) },
      ]);
    }, 250);
  }

  function handleSend(e) {
    e.preventDefault();
    sendMessage(draft);
  }

  function handleQuickReply(reply) {
    sendMessage(reply);
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 1180, padding: '40px 24px 80px' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ padding: 36, borderRadius: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
            <div>
              <div className="badge badge-primary" style={{ marginBottom: 12 }}>Help Center</div>
              <h1 className="heading-lg">Help Center</h1>
              <p className="text-muted" style={{ maxWidth: 760, lineHeight: 1.8, marginTop: 10 }}>
                Need help fast? Ask our assistant for common questions or reach out to the platform support team directly.
              </p>
            </div>
            <Link to="/" className="btn btn-ghost">Back Home</Link>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 680, border: '1px solid var(--border)', borderRadius: 24, padding: 16, background: 'var(--bg)' }}>
              <div style={{ fontWeight: 700, marginBottom: 12 }}>Assistant</div>
              <div style={{ display: 'grid', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 6 }}>
                {messages.map((message) => (
                  <div key={message.id} style={{ display: 'flex', justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '85%', padding: '10px 12px', borderRadius: 14, background: message.sender === 'user' ? 'var(--primary)' : 'white', color: message.sender === 'user' ? 'white' : 'var(--text-primary)', boxShadow: 'var(--shadow-sm)' }}>
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {quickReplies.map((reply) => (
                  <button key={reply} type="button" className="btn btn-ghost" style={{ padding: '8px 12px', fontSize: '0.8rem' }} onClick={() => handleQuickReply(reply)}>
                    {reply}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSend} style={{ marginTop: 12 }}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ask anything about the platform..."
                  style={{ width: '100%', borderRadius: 999, border: '1px solid var(--border)', padding: '12px 14px', outline: 'none', marginBottom: 10 }}
                />
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Send</button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
