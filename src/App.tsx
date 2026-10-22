import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';
import { Workspace } from './components/Workspace';
import { LoadState } from './ui';

const LandingPage = lazy(() => import('./pages/LandingPage').then((page) => ({ default: page.LandingPage })));
const AuthPage = lazy(() => import('./pages/AuthPage').then((page) => ({ default: page.AuthPage })));
const ForgotPasswordPage = lazy(() => import('./pages/RecoveryPages').then((page) => ({ default: page.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/RecoveryPages').then((page) => ({ default: page.ResetPasswordPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((page) => ({ default: page.DashboardPage })));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage').then((page) => ({ default: page.VehiclesPage })));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage').then((page) => ({ default: page.VehicleDetailPage })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then((page) => ({ default: page.ServicesPage })));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage').then((page) => ({ default: page.ExpensesPage })));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage').then((page) => ({ default: page.DocumentsPage })));
const RemindersPage = lazy(() => import('./pages/RemindersPage').then((page) => ({ default: page.RemindersPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((page) => ({ default: page.ReportsPage })));
const AssistantPage = lazy(() => import('./pages/AssistantPage').then((page) => ({ default: page.AssistantPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((page) => ({ default: page.ProfilePage })));
const SupportPage = lazy(() => import('./pages/SupportPage').then((page) => ({ default: page.SupportPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then((page) => ({ default: page.AdminPage })));

function Protected({ children }: { children: ReactNode }) {
  const { user, loading, authError } = useAuth();
  const location = useLocation();
  if (loading) return <div className="full-screen-loader"><div className="brand-mark">VD</div><div className="load-state">Preparing your workspace…</div></div>;
  if (!user) {
    if (authError) return <div className="full-screen-loader"><div className="auth-error-card"><div className="brand-mark">VD</div><h1>We couldn't open your workspace</h1><p>{authError}</p><a className="btn-primary" href="/login">Go to sign in</a></div></div>;
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function RouteLoader() {
  return <div className="full-screen-loader"><LoadState loading error={null} /></div>;
}

export function App() {
  const { user, loading } = useAuth();
  return <Suspense fallback={<RouteLoader />}><Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/login" element={user ? <Navigate to="/app" replace /> : <AuthPage mode="login" />} />
    <Route path="/register" element={user ? <Navigate to="/app" replace /> : <AuthPage mode="register" />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/app" element={<Protected><Workspace /></Protected>}>
      <Route index element={<DashboardPage />} />
      <Route path="vehicles" element={<VehiclesPage />} />
      <Route path="vehicles/:id" element={<VehicleDetailPage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="documents" element={<DocumentsPage />} />
      <Route path="reminders" element={<RemindersPage />} />
      <Route path="reports" element={<ReportsPage />} />
      <Route path="assistant" element={<AssistantPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="support" element={<SupportPage />} />
      <Route path="admin" element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Route>
    <Route path="*" element={loading ? <div className="full-screen-loader"><LoadState loading error={null} /></div> : <Navigate to="/" replace />} />
  </Routes></Suspense>;
}
