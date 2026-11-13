import { Navigate, useLocation } from 'react-router-dom';
import AuthLoading from '../components/AuthLoading.jsx';
import { useAuth } from './AuthProvider.jsx';
import { canAccessRoute } from './permissions.js';

export default function ProtectedRoute({ children }) {
  const { loading, profile } = useAuth();
  const location = useLocation();

  if (loading && !profile) return <AuthLoading />;

  const result = canAccessRoute(location.pathname, profile);

  if (result.ok) return children;
  if (result.reason === 'unauthenticated') {
    const signInPath = location.pathname.startsWith('/admin') ? '/admin/signin' : '/signin';
    return <Navigate to={signInPath} replace state={{ from: location.pathname }} />;
  }
  if (result.reason === 'pending') {
    return <Navigate to="/pending" replace />;
  }
  if (profile?.role === 'student') {
    return <Navigate to="/no-access" replace />;
  }
  return <Navigate to="/unauthorized" replace />;
}
