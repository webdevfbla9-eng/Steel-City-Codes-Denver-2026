export const ROLES = {
  STUDENT: 'student',
  VOLUNTEER: 'volunteer',
  PARENT: 'parent',
  ADMIN: 'admin',
};

export const roles = [
  { id: 'student', label: 'Student' },
  { id: 'parent', label: 'Parent' },
  { id: 'volunteer', label: 'Volunteer' },
];

export const ALL_ROLES = ['student', 'volunteer', 'parent', 'admin'];

export const APPROVAL = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const ACTIONS = {
  viewAdminDashboard: 'viewAdminDashboard',
  manageUsers: 'manageUsers',
  approveAccounts: 'approveAccounts',
  changeRoles: 'changeRoles',
  rejectAccounts: 'rejectAccounts',
};

const adminActions = new Set(Object.values(ACTIONS));

/**
 * Central place to change who can open which page.
 * public: anyone, including signed-out visitors.
 * anyAuthenticated: signed-in users of any role/status.
 * roles: roles that may open the page.
 * requireApproved: pending/rejected users are blocked.
 * shared: shown in volunteer navigation as well as the owning role.
 */
export const routeAccess = {
  '/': { public: true },
  '/about': { public: true },
  '/get-involved': { public: true },
  '/signup': { public: true },
  '/signin': { public: true },
  '/admin/signup': { public: true },
  '/admin/signin': { public: true },
  '/pending': { anyAuthenticated: true },
  '/unauthorized': { anyAuthenticated: true },
  '/no-access': { anyAuthenticated: true },
  '/students': { roles: ['student', 'parent', 'admin'], requireApproved: true },
  '/volunteers': { roles: ['volunteer', 'parent', 'admin'], requireApproved: true },
  '/parents': { roles: ['parent', 'volunteer', 'admin'], requireApproved: true, shared: true },
  '/admin': { roles: ['admin'], requireApproved: true },
  '/dashboard': { roles: ALL_ROLES, requireApproved: true },
};

export const navByRole = {
  public: [{ to: '/about', label: 'About' }],
  student: [
    { to: '/about', label: 'About' },
    { to: '/students', label: 'Students' },
  ],
  volunteer: [
    { to: '/about', label: 'About' },
    { to: '/volunteers', label: 'Volunteers' },
    { to: '/parents', label: 'Parents', shared: true },
  ],
  parent: [
    { to: '/about', label: 'About' },
    { to: '/students', label: 'Students' },
    { to: '/parents', label: 'Parents' },
    { to: '/volunteers', label: 'Volunteers' },
  ],
  admin: [
    { to: '/about', label: 'About' },
    { to: '/students', label: 'Students' },
    { to: '/parents', label: 'Parents' },
    { to: '/volunteers', label: 'Volunteers' },
    { to: '/admin', label: 'Admin' },
  ],
  pending: [{ to: '/about', label: 'About' }],
  rejected: [{ to: '/about', label: 'About' }],
};

export function normalizePath(path) {
  if (!path) return '/';
  const clean = path.split('?')[0].replace(/\/+$/, '');
  return clean === '' ? '/' : clean;
}

export function isApproved(profile) {
  return profile?.approval_status === APPROVAL.APPROVED;
}

export function isAdmin(profile) {
  return profile?.role === ROLES.ADMIN && isApproved(profile);
}

export function getNavLinks(profile) {
  if (!profile) return navByRole.public;
  if (isAdmin(profile)) return navByRole.admin;
  if (profile.approval_status === APPROVAL.PENDING) return navByRole.pending;
  if (profile.approval_status === APPROVAL.REJECTED) return navByRole.rejected;
  return navByRole[profile.role] || navByRole.public;
}

export function homePathFor(profile) {
  if (!profile) return '/signin';
  if (isAdmin(profile)) return '/admin';
  if (profile.approval_status === APPROVAL.PENDING) return '/pending';
  if (profile.approval_status === APPROVAL.REJECTED) return '/unauthorized';
  return '/dashboard';
}

export function canAccessRoute(path, profile) {
  const clean = normalizePath(path);
  const spec = routeAccess[clean];
  if (!spec) return { ok: false, reason: 'forbidden' };
  if (spec.public) return { ok: true };
  if (!profile) return { ok: false, reason: 'unauthenticated' };
  if (spec.anyAuthenticated) return { ok: true };
  if (!spec.roles?.includes(profile.role)) return { ok: false, reason: 'forbidden' };
  if (spec.requireApproved && !isApproved(profile)) {
    return { ok: false, reason: profile.approval_status === APPROVAL.PENDING ? 'pending' : 'rejected' };
  }
  return { ok: true };
}

export function canPerform(action, profile) {
  if (!isAdmin(profile)) return false;
  return adminActions.has(action);
}

export function dashboardPathFor(profile) {
  if (isAdmin(profile)) return '/admin';
  return '/dashboard';
}
