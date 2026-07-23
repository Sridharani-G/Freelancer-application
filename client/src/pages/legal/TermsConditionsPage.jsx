import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const sections = [
  {
    title: '1. Acceptance of terms',
    body: 'By creating an account, using our platform, or otherwise accessing our services, you agree to be bound by these Terms and Conditions. If you do not agree, you should not use the platform.',
  },
  {
    title: '2. Eligibility and account responsibility',
    body: 'You must provide accurate information, maintain the security of your account, and use the platform in compliance with applicable laws. You are responsible for all activity conducted through your account.',
  },
  {
    title: '3. Platform use',
    body: 'The platform is intended to connect clients and freelancers for legitimate project-based work. You may not use it to post fraudulent jobs, misrepresent your qualifications, harass others, distribute harmful content, or bypass platform safeguards.',
  },
  {
    title: '4. Payments and services',
    body: 'Any payment terms, milestone schedules, or service expectations must be agreed between the relevant parties. We act as a facilitator and are not a party to individual contracts between clients and freelancers unless explicitly stated.',
  },
  {
    title: '5. Content and intellectual property',
    body: 'You retain ownership of content you create and upload, but you grant us the right to host, display, and process that content for the purpose of operating the platform. You may not upload content that infringes third-party rights.',
  },
  {
    title: '6. Limitation of liability',
    body: 'Our platform is provided “as is” and we do not guarantee uninterrupted availability or outcome success. We are not liable for indirect, incidental, or consequential damages arising from your use of the platform.',
  },
];

export default function TermsConditionsPage() {
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
              <div className="badge badge-primary" style={{ marginBottom: 12 }}>Terms & Conditions</div>
              <h1 className="heading-lg">Terms & Conditions</h1>
              <p className="text-muted" style={{ maxWidth: 720, lineHeight: 1.8, marginTop: 10 }}>
                These terms define how you may use our services, interact with other users, and access the platform responsibly.
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

            <section className="legal-section" style={{ padding: 20, borderRadius: 20, background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(14, 165, 233, 0.08))', border: '1px solid var(--border)' }}>
              <h3 className="heading-sm" style={{ marginBottom: 8 }}>7. Updates to these terms</h3>
              <p className="text-muted" style={{ lineHeight: 1.8, margin: 0 }}>
                We may update these Terms and Conditions from time to time. Continued use of the platform after such updates constitutes your acceptance of the revised terms.
              </p>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
