import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { connectSocket, disconnectSocket } from './services/socket';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import VerifyEmailSuccessPage from './pages/auth/VerifyEmailSuccessPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import SetPasswordPage from './pages/auth/SetPasswordPage';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import FreelancerDashboard from './pages/dashboard/FreelancerDashboard';
import DirectHirePage from './pages/dashboard/DirectHirePage';
import AdminDashboard from './pages/admin/AdminDashboard';
import JobsPage from './pages/jobs/JobsPage';
import JobDetailPage from './pages/jobs/JobDetailPage';
import CreateJobPage from './pages/jobs/CreateJobPage';
import ApplicationsPage from './pages/jobs/ApplicationsPage';
import MyApplicationsPage from './pages/jobs/MyApplicationsPage';
import ClientJobsPage from './pages/jobs/ClientJobsPage';
import FreelancersPage from './pages/freelancers/FreelancersPage';
import FreelancerProfilePage from './pages/profile/FreelancerProfilePage';
import ClientProfilePage from './pages/profile/ClientProfilePage';
import EditProfilePage from './pages/profile/EditProfilePage';
import ChatPage from './pages/chat/ChatPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationPreferencesPage from './pages/NotificationPreferencesPage';
import PrivacySecurityPage from './pages/PrivacySecurityPage';
import SettingsPage from './pages/SettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import AboutPage from './pages/AboutPage';
import HelpCenterPage from './pages/HelpCenterPage';
import ContactPage from './pages/ContactPage';
import InfoPage from './pages/InfoPage';
import PrivacyPolicyPage from './pages/legal/PrivacyPolicyPage';
import TermsConditionsPage from './pages/legal/TermsConditionsPage';
import ManageGigsPage from './pages/gigs/ManageGigsPage';
import EditGigPage from './pages/gigs/EditGigPage';
import NotFoundPage from './pages/NotFoundPage';

// Layout
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Theme
const getInitialTheme = () => localStorage.getItem('theme') || 'light';

function JobsRouteGate() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  if (isAuthenticated && user?.role === 'client') {
    return <Navigate to="/freelancers" replace />;
  }
  return <JobsPage />;
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      connectSocket(user._id);
      return () => {
        disconnectSocket();
      };
    }
    disconnectSocket();
    return undefined;
  }, [isAuthenticated, user?._id]);

  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return (
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 4000, style: { borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontWeight: 500 } }} />
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/register/:role" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
          <Route path="/verify-email-success" element={<VerifyEmailSuccessPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/blog" element={<InfoPage title="Blog" description="Stay tuned for product updates, hiring tips, and freelancer success stories." cta="Back to home" />} />
          <Route path="/careers" element={<InfoPage title="Careers" description="We are growing the team behind SkillSphere and welcome builders, designers, and operators." cta="Back to home" />} />
          <Route path="/press" element={<InfoPage title="Press" description="Media inquiries and product announcements will be shared here soon." cta="Back to home" />} />
          <Route path="/help" element={<HelpCenterPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsConditionsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/jobs" element={<JobsRouteGate />} />
          <Route path="/gigs" element={<JobsRouteGate />} />
          <Route path="/freelancers" element={<FreelancersPage />} />
          <Route path="/freelancer/:id" element={<FreelancerProfilePage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />

          {/* Protected — Client */}
          <Route element={<ProtectedRoute allowedRoles={['client']} />}>
            <Route path="/client/dashboard" element={<ClientDashboard />} />
            <Route path="/client/jobs" element={<Navigate to="/client/jobs/overview" replace />} />
            <Route path="/client/jobs/:view" element={<ClientJobsPage />} />
            <Route path="/jobs/create" element={<CreateJobPage />} />
            <Route path="/jobs/:id/applications" element={<ApplicationsPage />} />
          </Route>

          {/* Protected — Freelancer */}
          <Route element={<ProtectedRoute allowedRoles={['freelancer']} />}>
            <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
            <Route path="/direct-hire" element={<DirectHirePage />} />
            <Route path="/my-applications" element={<MyApplicationsPage />} />
            <Route path="/gigs/manage" element={<ManageGigsPage />} />
            <Route path="/gigs/edit/:index" element={<EditGigPage />} />
          </Route>

          {/* Protected — Admin */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Protected — Any logged in */}
          <Route element={<ProtectedRoute allowedRoles={['client', 'freelancer', 'admin']} />}>
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/profile" element={<ClientProfilePage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:userId" element={<ChatPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/notification-preferences" element={<NotificationPreferencesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/privacy-security" element={<PrivacySecurityPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
  );
}
