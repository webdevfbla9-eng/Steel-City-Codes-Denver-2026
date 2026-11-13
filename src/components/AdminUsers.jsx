import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { ALL_ROLES, APPROVAL, canPerform } from '../auth/permissions.js';
import { listProfilesForAdmin, setProfileApproval, setProfileRole } from '../lib/accounts.js';
import { supabase } from '../lib/supabase.js';

const statusFilters = ['pending', 'approved', 'rejected', 'all'];

function formatCreated(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsers() {
  const { profile: adminProfile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('all');
  const [busyId, setBusyId] = useState('');

  const canManage = canPerform('manageUsers', adminProfile);
  const pendingCount = profiles.filter((item) => item.approval_status === APPROVAL.PENDING).length;

  const load = async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      setProfiles(await listProfilesForAdmin());
    } catch (err) {
      setError(err.message);
      setProfiles([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!canManage || !supabase) return undefined;
    const channel = supabase
      .channel('admin-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        load();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [canManage]);

  const visible = useMemo(
    () => profiles.filter((item) => (status === 'all' ? true : item.approval_status === status)),
    [profiles, status],
  );

  if (!canManage) return null;

  const updateProfile = async (target, changes) => {
    if (target.id === adminProfile.id && (changes.role || changes.approval_status)) {
      setError('You cannot change your own role or approval status.');
      return;
    }
    setBusyId(target.id);
    setError('');
    try {
      const row = changes.role
        ? await setProfileRole(target.id, changes.role)
        : await setProfileApproval(target.id, changes.approval_status);
      setProfiles((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, ...row, approval_status: changes.approval_status || row.approval_status, role: changes.role || row.role } : item)),
      );
    } catch (err) {
      setError(err.message);
    }
    setBusyId('');
  };

  return (
    <section className="section section-offwhite">
      <div className="container">
        <h2 className="section-title">
          Accounts
          {pendingCount > 0 ? <span className="inquiry-unread">{pendingCount > 9 ? '9+' : pendingCount}</span> : null}
        </h2>
        <p className="body-large section-intro">
          Every signed-up account is stored in profiles and listed here. Parent and volunteer sign-ups wait until you
          approve or reject them. Students and admins are approved when they create an account.
        </p>
        <div className="admin-pills" role="group" aria-label="Filter accounts">
          {statusFilters.map((item) => (
            <button
              key={item}
              type="button"
              className={status === item ? 'is-active' : ''}
              aria-pressed={status === item}
              onClick={() => setStatus(item)}
            >
              {item === 'pending' && pendingCount > 0 ? `Pending (${pendingCount})` : item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
        {error && <p className="admin-error">{error}</p>}
        {loading ? (
          <p className="admin-empty">Loading accounts…</p>
        ) : visible.length === 0 ? (
          <p className="admin-empty">
            {status === 'pending'
              ? 'No accounts are waiting for approval. Open All to see every member.'
              : 'No accounts in this list.'}
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => {
                  const self = item.id === adminProfile.id;
                  const busy = busyId === item.id;
                  return (
                    <tr key={item.id}>
                      <td>{item.full_name || '—'}</td>
                      <td>{item.email}</td>
                      <td>{formatCreated(item.created_at)}</td>
                      <td>
                        <select
                          value={item.role}
                          disabled={self || busy || !canPerform('changeRoles', adminProfile)}
                          onChange={(event) => updateProfile(item, { role: event.target.value })}
                          aria-label={`Role for ${item.email}`}
                        >
                          {ALL_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <span className={`admin-status admin-status-${item.approval_status}`}>{item.approval_status}</span>
                      </td>
                      <td>
                        <div className="admin-message-actions">
                          {item.approval_status !== APPROVAL.APPROVED && (
                            <button
                              type="button"
                              className="arrow-button"
                              disabled={self || busy || !canPerform('approveAccounts', adminProfile)}
                              onClick={() => updateProfile(item, { approval_status: APPROVAL.APPROVED })}
                            >
                              Approve
                            </button>
                          )}
                          {item.approval_status !== APPROVAL.REJECTED && (
                            <button
                              type="button"
                              className="admin-link-button"
                              disabled={self || busy || !canPerform('rejectAccounts', adminProfile)}
                              onClick={() => updateProfile(item, { approval_status: APPROVAL.REJECTED })}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
