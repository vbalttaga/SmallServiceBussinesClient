import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ToastContainer from './components/Toast';
import PermissionRoute from './components/PermissionRoute';
import { P } from './constants/permissions';
import { TenantThemeProvider } from './theme/ThemeProvider';

// Auth
const LoginPage = lazy(() => import('./pages/Login/LoginPage'));
const AcceptInvitationPage = lazy(() => import('./pages/Auth/AcceptInvitationPage'));

// Portal (public)
const PortalLayout = lazy(() => import('./pages/Portal/PortalLayout'));
const PortalHomePage = lazy(() => import('./pages/Portal/PortalHomePage'));
const RegisterOrganisationPage = lazy(() => import('./pages/Portal/RegisterOrganisationPage'));
const MarketplacePage = lazy(() => import('./pages/Portal/MarketplacePage'));
const ReviewSubmitPage = lazy(() => import('./pages/Portal/ReviewSubmitPage'));

// Internal (authenticated staff/owner)
const InternalLayout = lazy(() => import('./pages/Internal/InternalLayout'));
const InternalDashboardPage = lazy(() => import('./pages/Internal/DashboardPage'));
const SchedulePage = lazy(() => import('./pages/Internal/SchedulePage'));
const ClientsPage = lazy(() => import('./pages/Internal/ClientsPage'));

// Client (authenticated customer)
const MyAppointmentsPage = lazy(() => import('./pages/Client/MyAppointmentsPage'));

// Admin (dynamic CRUD)
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'));
const AdminHomePage = lazy(() => import('./pages/Admin/AdminHomePage'));
const AdminListPage = lazy(() => import('./pages/Admin/AdminListPage'));
const AdminDetailPage = lazy(() => import('./pages/Admin/AdminDetailPage'));
const RolesPage = lazy(() => import('./pages/Admin/RolesPage'));
const UsersPage = lazy(() => import('./pages/Admin/UsersPage'));
const OrgSettingsPage = lazy(() => import('./pages/OrgSettings/OrgSettingsPage'));
const OrgStructurePage = lazy(() => import('./pages/Admin/OrgStructurePage'));

// Design settings
const DesignSettingsPage = lazy(() => import('./pages/Admin/DesignSettingsPage'));

// Profile
const ProfilePage = lazy(() => import('./pages/Profile/ProfilePage'));

// Reports
const ReportLayout = lazy(() => import('./pages/Reports/ReportLayout'));
const ReportHomePage = lazy(() => import('./pages/Reports/ReportHomePage'));
const ReportViewPage = lazy(() => import('./pages/Reports/ReportViewPage'));

// Misc
const NotFoundPage = lazy(() => import('./pages/NotFound/NotFoundPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <TenantThemeProvider>
        <ToastContainer />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public portal — lands on landing (base domain) or booking flow (subdomain) */}
            <Route path="/" element={<PortalLayout />}>
              <Route index element={<PortalHomePage />} />
            </Route>
            <Route path="/register" element={<RegisterOrganisationPage />} />
            <Route path="/discover" element={<MarketplacePage />} />
            <Route path="/review/:token" element={<ReviewSubmitPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

            {/* Client (customer) */}
            <Route path="/my-appointments" element={
              <ProtectedRoute><MyAppointmentsPage /></ProtectedRoute>
            } />

            {/* Internal (staff/manager/owner) */}
            <Route path="/internal" element={
              <ProtectedRoute><InternalLayout /></ProtectedRoute>
            }>
              <Route index element={<InternalDashboardPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="clients" element={<ClientsPage />} />
            </Route>

            {/* Admin — dynamic CRUD */}
            <Route path="/admin" element={
              <PermissionRoute permission={P.ADMIN_USERS_MANAGE}>
                <AdminLayout />
              </PermissionRoute>
            }>
              <Route index element={<AdminHomePage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="roles" element={<RolesPage />} />
              <Route path="settings" element={<OrgSettingsPage />} />
              <Route path="design" element={<DesignSettingsPage />} />
              <Route path="structure" element={<OrgStructurePage />} />
              <Route path=":entityName" element={<AdminListPage />} />
              <Route path=":entityName/:id" element={<AdminDetailPage />} />
            </Route>

            {/* Reports */}
            <Route path="/rpt" element={
              <PermissionRoute permission={P.REPORTS_VIEW}>
                <ReportLayout />
              </PermissionRoute>
            }>
              <Route index element={<ReportHomePage />} />
              <Route path=":code" element={<ReportViewPage />} />
            </Route>

            {/* Profile */}
            <Route path="/profile" element={
              <ProtectedRoute><ProfilePage /></ProtectedRoute>
            } />

            {/* Redirect common legacy links to new structure */}
            <Route path="/dashboard" element={<Navigate to="/internal" replace />} />

            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
        </TenantThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
