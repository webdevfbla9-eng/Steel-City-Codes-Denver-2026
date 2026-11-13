import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase.js';
import { roles } from './permissions.js';

const AuthContext = createContext(null);
const AUTH_CACHE_KEY = 'scc-auth-cache';
const BOOTSTRAP_ADMIN_EMAILS = ['webdevfbla9@gmail.com'];

function readAuthCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(AUTH_CACHE_KEY));
    if (!cached?.profile || !cached?.userId) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeAuthCache(userId, profile) {
  try {
    if (!userId || !profile) localStorage.removeItem(AUTH_CACHE_KEY);
    else localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ userId, profile }));
  } catch {
    // Ignore quota / private mode.
  }
}

function clearAuthCache() {
  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {
    // Ignore.
  }
}

const requestedRoleOf = (user) => {
  const role = String(user?.user_metadata?.role || '').toLowerCase();
  return ['student', 'volunteer', 'parent', 'admin'].includes(role) ? role : '';
};

const withRequestedRole = (user, profile, { asAdmin = false } = {}) => {
  if (!user) return profile;
  const listedAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
  const requested = asAdmin || listedAdmin ? 'admin' : requestedRoleOf(user);
  const base = profile || {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    role: 'student',
    approval_status: 'approved',
  };
  const merged = {
    ...base,
    email: base.email || user.email,
    full_name: base.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email,
    created_at: base.created_at || user.created_at,
    avatar_url: base.avatar_url || user.user_metadata?.avatar_url || '',
  };
  if (!requested) return merged;
  return {
    ...merged,
    role: requested,
    approval_status: requested === 'volunteer' || requested === 'parent' ? merged.approval_status || 'pending' : 'approved',
  };
};

const toUser = (session, profile) => {
  if (!session?.user || !profile) return null;
  return {
    id: profile.id,
    name: profile.full_name || profile.name || session.user.email,
    email: profile.email || session.user.email,
    role: profile.role,
    approvalStatus: profile.approval_status,
    createdAt: profile.created_at || session.user.created_at,
    avatarUrl: profile.avatar_url || session.user.user_metadata?.avatar_url || '',
    profile,
  };
};

function unwrapProfile(data) {
  if (!data) return null;
  return Array.isArray(data) ? data[0] : data;
}

function profileRowFromUser(user, { asAdmin = false } = {}) {
  const listedAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
  const requested = asAdmin || listedAdmin ? 'admin' : requestedRoleOf(user) || 'student';
  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email || '',
    role: requested,
    approval_status: requested === 'volunteer' || requested === 'parent' ? 'pending' : 'approved',
  };
}

async function persistOwnProfile(user, { asAdmin = false } = {}) {
  const { data: ensured, error: rpcError } = await supabase.rpc('ensure_own_profile');
  if (!rpcError && ensured) return unwrapProfile(ensured);

  const { data: existing, error: selectError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing;

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert(profileRowFromUser(user, { asAdmin }))
    .select('*')
    .single();
  if (!insertError && inserted) return inserted;
  return null;
}

async function fetchProfile(user, { asAdmin = false } = {}) {
  const userId = user?.id;
  if (!userId) return null;
  const listedAdmin = BOOTSTRAP_ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
  const wantsAdmin = asAdmin || listedAdmin || requestedRoleOf(user) === 'admin';
  if (wantsAdmin) {
    const { data: fromMetadata, error: metadataError } = await supabase.rpc('claim_admin_from_metadata');
    if (!metadataError && fromMetadata) return withRequestedRole(user, unwrapProfile(fromMetadata), { asAdmin: true });
    const { data: pending, error: pendingError } = await supabase.rpc('claim_admin_if_pending');
    if (!pendingError && pending) return withRequestedRole(user, unwrapProfile(pending), { asAdmin: true });
  }
  const data = await persistOwnProfile(user, { asAdmin });
  if (data?.role === 'admin' && data.approval_status === 'pending') {
    const { data: claimed, error: claimError } = await supabase.rpc('claim_admin_if_pending');
    if (!claimError && claimed) return withRequestedRole(user, unwrapProfile(claimed), { asAdmin });
  }
  return withRequestedRole(user, data, { asAdmin });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(() => readAuthCache()?.profile ?? null);
  const [loading, setLoading] = useState(() => !readAuthCache()?.profile);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async (nextSession) => {
    if (!nextSession?.user) {
      setProfile(null);
      clearAuthCache();
      return;
    }
    const nextProfile = await fetchProfile(nextSession.user);
    setProfile(nextProfile);
    writeAuthCache(nextSession.user.id, nextProfile);
    return nextProfile;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return;
        const nextSession = data.session ?? null;
        setSession(nextSession);
        if (!nextSession) {
          setProfile(null);
          clearAuthCache();
          return;
        }
        return loadProfile(nextSession).catch((err) => {
          if (!cancelled) setError(err.message);
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return;
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        clearAuthCache();
        setLoading(false);
        return;
      }
      if (event === 'SIGNED_IN') {
        const cached = readAuthCache();
        const known = cached?.userId === nextSession?.user?.id;
        if (!known) setLoading(true);
        loadProfile(nextSession)
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false));
        return;
      }
      loadProfile(nextSession).catch((err) => setError(err.message));
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    setSession((prev) => (prev ? { ...prev, user: data.user } : prev));
    const nextProfile = await fetchProfile(data.user);
    setProfile(nextProfile);
    writeAuthCache(data.user.id, nextProfile);
    return nextProfile;
  }, []);

  const value = useMemo(
    () => ({
      configured: supabaseConfigured,
      loading,
      error,
      session,
      profile,
      user: toUser(session, profile),
      refreshProfile,
    }),
    [loading, error, session, profile, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

export function useUser() {
  return useAuth().user;
}

function authMessage(error) {
  const message = error?.message || 'Something went wrong.';
  if (/rate limit|rate exceeded/i.test(message)) {
    return 'Supabase hit its email limit. Sign in with an email you already used, or wait about an hour.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Confirm your email first. Check your inbox, then sign in.';
  }
  if (/invalid login credentials/i.test(message)) {
    return 'That email or password is incorrect.';
  }
  if (/already registered|already exists|already been registered/i.test(message)) {
    return 'This email already has an account. Sign in instead of creating another one.';
  }
  return message;
}

export async function signUp({ name, email, password, role }) {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  const requestedRole = ['student', 'volunteer', 'parent', 'admin'].includes(role) ? role : 'student';
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}${requestedRole === 'admin' ? '/admin/signin' : '/signin'}`,
      data: {
        full_name: name.trim(),
        role: requestedRole,
      },
    },
  });
  if (error) throw new Error(authMessage(error));
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('This email already has an account. Sign in instead of creating another one.');
  }
  let profile = null;
  if (data.user?.id && data.session) {
    profile = await fetchProfile(data.user, { asAdmin: requestedRole === 'admin' });
    writeAuthCache(data.user.id, profile);
  }
  return { ...data, profile };
}

export async function signIn({ email, password, asAdmin = false }) {
  if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(authMessage(error));
  let user = data.user;
  if (user && asAdmin) {
    const updated = await supabase.auth.updateUser({ data: { role: 'admin' } });
    if (!updated.error && updated.data.user) user = updated.data.user;
  }
  const profile = user ? await fetchProfile(user, { asAdmin }) : null;
  if (user && profile) writeAuthCache(user.id, profile);
  return { ...data, user, profile };
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

function fileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) {
      reject(new Error('Please choose a photo.'));
      return;
    }
    const image = new Image();
    const blobUrl = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      const side = Math.min(image.width, image.height);
      const sx = (image.width - side) / 2;
      const sy = (image.height - side) / 2;
      ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);
      URL.revokeObjectURL(blobUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    image.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('That photo could not be read.'));
    };
    image.src = blobUrl;
  });
}

export async function updateAvatar(file) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const dataUrl = await fileToAvatarDataUrl(file);
  const { data, error } = await supabase.auth.updateUser({ data: { avatar_url: dataUrl } });
  if (error) throw new Error(authMessage(error));
  if (data.user?.id) {
    await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', data.user.id);
  }
  return dataUrl;
}

export { roles };
