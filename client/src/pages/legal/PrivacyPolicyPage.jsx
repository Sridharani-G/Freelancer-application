import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. What information we collect',
    body: 'We collect the information you provide when you create an account, post a job, submit an application, message a freelancer, or leave feedback. This may include your name, email address, profile details, location, project preferences, and payment-related information needed to operate the platform.',
  },
  {
    title: '2. How we use your information',
    body: 'Your information helps us create and maintain your account, personalize matching recommendations, support messaging and collaboration, process payments, improve our services, and communicate important updates about your experience on the platform.',
  },
  {
    title: '3. Sharing and disclosure',
    body: 'We may share limited information with service providers that help us operate the platform, such as hosting, analytics, communication, and payment support providers. We do not sell personal data to third parties for advertising purposes.',
  },
  {
    title: '4. Cookies and analytics',
    body: 'We use cookies and similar tools to remember your preferences, understand how visitors use the platform, and improve performance. You can disable cookies in your browser settings, although some parts of the service may not function properly as a result.',
  },
  {
    title: '5. Your choices and rights',
    body: 'You can access, update, or request deletion of your account information through your profile settings or by contacting support. Depending on your location, you may also have additional rights regarding access, correction, portability, or restriction of processing.',
  },
  {
    title: '6. Security',
    body: 'We use reasonable technical and organizational safeguards to protect your information. However, no internet-based service can be completely risk-free, so we encourage you to protect your password and report any suspicious activity immediately.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 980, padding: '40px 24px 80px' }}>
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ padding: 40, borderRadius: 32 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
            <div>
              <div className="badge badge-primary" style={{ marginBottom: 12 }}>Privacy Policy</div>
              <h1 className="heading-lg">Privacy Policy</h1>
              <p className="text-muted" style={{ maxWidth: 720, lineHeight: 1.8, marginTop: 10 }}>
                We are committed to protecting your personal information while you use our platform. This policy explains what data we collect, why it is collected, and how you can control it.
              </p>
            </div>
            <Link to="/" className="btn btn-ghost">Back Home</Link>
          </div>

          <div className="legal-content" style={{ display: 'grid', gap: 16 }}>
            {sections.map((section) => (
              <section key={section.title} className="legal-section" style={{ padding: 20, borderRadius: 20, background: 'var(--bg)', border: '1px solid var(--border)' }}>
                <h3 className="heading-sm" style={{ marginBottom: 8 }}>{section.title}</h3>
                <p className="text-muted" style={{ lineHeight: 1.8, margin: 0 }}>{section.body}</p>
              </section>
            ))}

            <section className="legal-section" style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg, rgba(0, 201, 167, 0.08), rgba(14, 165, 233, 0.08))', border: '1px solid var(--border)' }}>
              <h3 className="heading-sm" style={{ marginBottom: 8 }}>7. Contact us</h3>
              <p className="text-muted" style={{ lineHeight: 1.8, margin: 0 }}>
                If you have questions about this Privacy Policy or your personal data, please reach out through the Support section or the contact page in the app.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
