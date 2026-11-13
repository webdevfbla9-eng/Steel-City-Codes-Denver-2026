import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { isAdmin, isApproved } from '../auth/permissions.js';
import { supabase } from './supabase.js';
import { listAllInquiries, listParentInquiries } from './inquiries.js';

const InquiriesContext = createContext(null);

function upsertInquiry(list, row) {
  const next = list.filter((item) => item.id !== row.id);
  next.unshift(row);
  next.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return next;
}

export function InquiriesProvider({ children }) {
  const { user, profile } = useAuth();
  const admin = isAdmin(profile);
  const parent = profile?.role === 'parent' && isApproved(profile);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    if (!user?.id || (!admin && !parent)) {
      setInquiries([]);
      setError('');
      return [];
    }
    const rows = admin ? await listAllInquiries() : await listParentInquiries(user.id);
    setInquiries(rows);
    setError('');
    return rows;
  }, [admin, parent, user?.id]);

  useEffect(() => {
    if (!user?.id || (!admin && !parent)) {
      setInquiries([]);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    if (!supabase) return undefined;
    const channel = supabase
      .channel(`parent-inquiries-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'parent_inquiries' }, (payload) => {
        const row = payload.new;
        if (!row?.id) {
          refresh().catch(() => {});
          return;
        }
        if (!admin && row.user_id !== user.id) return;
        setInquiries((prev) => upsertInquiry(prev, row));
        if (admin && payload.eventType === 'INSERT') {
          setNotice(`New parent inquiry from ${row.name || row.email || 'a parent'}`);
        }
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [admin, parent, refresh, user?.id]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(timer);
  }, [notice]);

  const unreadCount = useMemo(
    () => (admin ? inquiries.filter((item) => !item.status || item.status === 'pending').length : 0),
    [admin, inquiries],
  );

  const value = useMemo(
    () => ({ inquiries, unreadCount, loading, error, notice, refresh, setInquiries }),
    [inquiries, unreadCount, loading, error, notice, refresh],
  );

  return <InquiriesContext.Provider value={value}>{children}</InquiriesContext.Provider>;
}

export function useInquiries() {
  const context = useContext(InquiriesContext);
  if (!context) throw new Error('useInquiries must be used inside InquiriesProvider');
  return context;
}
