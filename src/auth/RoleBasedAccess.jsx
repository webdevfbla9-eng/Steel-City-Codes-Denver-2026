import { useAuth } from './AuthProvider.jsx';
import { canPerform, isApproved } from './permissions.js';

export default function RoleBasedAccess({ roles, action, requireApproved = true, children, fallback = null }) {
  const { profile } = useAuth();
  if (action && !canPerform(action, profile)) return fallback;
  if (roles) {
    if (!profile || !roles.includes(profile.role)) return fallback;
    if (requireApproved && !isApproved(profile)) return fallback;
  }
  return children;
}
