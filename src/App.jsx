import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import GetInvolved from './pages/GetInvolved.jsx';
import Volunteers from './pages/Volunteers.jsx';
import Students from './pages/Students.jsx';
import Parents from './pages/Parents.jsx';
import Admin from './pages/Admin.jsx';
import { SignIn, SignUp } from './pages/Auth.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Pending from './pages/Pending.jsx';
import Unauthorized from './pages/Unauthorized.jsx';
import StudentNoAccess from './pages/StudentNoAccess.jsx';
import Placeholder from './pages/Placeholder.jsx';
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx';
import { InquiriesProvider } from './lib/InquiriesProvider.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import { logActivity } from './data/activity.js';

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const node = document.getElementById(hash.slice(1));
      if (node) {
        node.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

let lastView = { path: null, at: 0 };

function TrackPageViews() {
  const { pathname } = useLocation();
  const { profile } = useAuth();
  useEffect(() => {
    const now = Date.now();
    if (pathname === '/admin' || (pathname === lastView.path && now - lastView.at < 1000)) return;
    lastView = { path: pathname, at: now };
    logActivity('page_view', { path: pathname, role: profile?.role });
  }, [pathname, profile?.role]);
  return null;
}

function Guard({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

function AppShell() {
  return (
    <>
      <ScrollToTop />
      <TrackPageViews />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<GetInvolved />} />
          <Route path="/get-involved" element={<Navigate to="/about" replace />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/admin/signup" element={<SignUp />} />
          <Route path="/admin/signin" element={<SignIn />} />
          <Route
            path="/volunteers"
            element={
              <Guard>
                <Volunteers />
              </Guard>
            }
          />
          <Route
            path="/parents"
            element={
              <Guard>
                <Parents />
              </Guard>
            }
          />
          <Route
            path="/students"
            element={
              <Guard>
                <Students />
              </Guard>
            }
          />
          <Route
            path="/admin"
            element={
              <Guard>
                <Admin />
              </Guard>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Guard>
                <Dashboard />
              </Guard>
            }
          />
          <Route
            path="/pending"
            element={
              <Guard>
                <Pending />
              </Guard>
            }
          />
          <Route
            path="/unauthorized"
            element={
              <Guard>
                <Unauthorized />
              </Guard>
            }
          />
          <Route
            path="/no-access"
            element={
              <Guard>
                <StudentNoAccess />
              </Guard>
            }
          />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <InquiriesProvider>
        <AppShell />
      </InquiriesProvider>
    </AuthProvider>
  );
}
