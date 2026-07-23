import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiPhone, FiClock, FiHelpCircle } from 'react-icons/fi';

const contactDetails = [
  {
    icon: <FiMail />,
    title: 'Email',
    value: 'support@nayoda.in',
    href: 'mailto:support@nayoda.in',
  },
  {
    icon: <FiPhone />,
    title: 'Phone',
    value: '+91 9360710370',
    href: 'tel:+919360710370',
  },
  {
    icon: <FiHelpCircle />,
    title: 'Placeholder',
    value: 'Office address will be updated soon.',
    href: '#',
  },
  {
    icon: <FiClock />,
    title: 'Support Hours',
    value: 'Mon–Fri • 9:00 AM to 6:00 PM',
    href: '#',
  },
];

export default function ContactPage() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 980, padding: '40px 24px 80px' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ padding: 36, borderRadius: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div>
              <div className="badge badge-primary" style={{ marginBottom: 12 }}>Contact Us</div>
              <h1 className="heading-lg">Contact Us</h1>
              <p className="text-muted" style={{ maxWidth: 720, lineHeight: 1.8, marginTop: 10 }}>
                Reach out to our support and admin team for help, feedback, or partnership questions.
              </p>
            </div>
            <Link to="/" className="btn btn-ghost">Back Home</Link>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {contactDetails.map((item) => (
              <div key={item.title} style={{ padding: 20, borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div className="badge badge-primary" style={{ fontSize: '1rem', padding: '10px 12px' }}>{item.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                  {item.href !== '#' ? (
                    <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {item.value}
                    </a>
                  ) : (
                    <div className="text-muted">{item.value}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </motion.div>
      </div>
    </div>
  );
}
