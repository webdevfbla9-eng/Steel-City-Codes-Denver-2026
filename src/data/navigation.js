import { getNavLinks } from '../auth/permissions.js';

export const pages = [
  { to: '/about', label: 'About' },
  { to: '/volunteers', label: 'Volunteers' },
  { to: '/parents', label: 'Parents' },
  { to: '/students', label: 'Students' },
  { to: '/admin', label: 'Admin' },
];

export function visiblePages(profile) {
  return getNavLinks(profile);
}
