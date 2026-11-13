import { useEffect, useState, useSyncExternalStore } from 'react';
import { supabase } from '../lib/supabase.js';

const STORAGE_KEY = 'scc-activity-v1';
const CHANGE_EVENT = 'scc-activity-change';
const MAX_EVENTS = 5000;

export const activityTypes = {
  page_view: { label: 'Page view', audience: 'Visitors' },
  assessment_passed: { label: 'Passed assessment problem', audience: 'Volunteers' },
  assessment_completed: { label: 'Completed assessment', audience: 'Volunteers' },
  daily_solved: { label: 'Solved daily challenge', audience: 'Students' },
  ide_request: { label: 'IDE account request', audience: 'Students' },
  parent_question: { label: 'Parent question', audience: 'Parents' },
  donation_click: { label: 'Donation click', audience: 'Parents' },
  form_open: { label: 'Opened a form', audience: 'Parents' },
  account_created: { label: 'New account', audience: 'Visitors' },
};

export const activityAudiences = ['Students', 'Parents', 'Volunteers'];

const audienceFromRole = (role) => {
  const value = String(role || '').toLowerCase();
  if (value === 'student') return 'Students';
  if (value === 'parent') return 'Parents';
  if (value === 'volunteer') return 'Volunteers';
  return '';
};

const audienceFromPath = (path) => {
  const value = String(path || '').split('?')[0].toLowerCase();
  if (value.startsWith('/students')) return 'Students';
  if (value.startsWith('/parents')) return 'Parents';
  if (value.startsWith('/volunteers')) return 'Volunteers';
  return '';
};

const audienceFromForm = (form) => {
  const value = String(form || '').toLowerCase();
  if (!value) return '';
  if (/volunteer|chapter leader|starting a chapter/.test(value)) return 'Volunteers';
  if (/registration|parent|camp|donate/.test(value)) return 'Parents';
  if (/student|ide/.test(value)) return 'Students';
  return '';
};

export function audienceFor(event) {
  if (!event) return 'Visitors';
  if (activityAudiences.includes(event.audience)) return event.audience;

  const typed = activityTypes[event.type]?.audience;
  if (typed && typed !== 'Visitors') return typed;

  return (
    audienceFromPath(event.path) ||
    audienceFromForm(event.form) ||
    audienceFromRole(event.role) ||
    typed ||
    'Visitors'
  );
}

function currentProfile() {
  try {
    return JSON.parse(localStorage.getItem('scc-auth-cache'))?.profile || null;
  } catch {
    return null;
  }
}

function currentRole() {
  return currentProfile()?.role || '';
}

let cache = null;

function readAll() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    cache = [];
  }
  return cache;
}

function writeAll(events) {
  cache = events.slice(-MAX_EVENTS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Storage full or blocked; keep the in-memory copy.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function toFeedEvent(row) {
  const payload = row?.payload && typeof row.payload === 'object' ? row.payload : {};
  return {
    ...payload,
    id: row.id,
    type: row.type,
    audience: row.audience || payload.audience,
    role: row.role || payload.role,
    path: row.path || payload.path,
    form: row.form || payload.form,
    name: row.name || payload.name,
    email: row.email || payload.email,
    at: row.created_at || payload.at,
  };
}

async function persistActivity(event) {
  if (!supabase) return;
  const payload = {
    type: event.type,
    audience: event.audience || null,
    role: event.role || null,
    path: event.path || null,
    form: event.form || null,
    name: event.name || null,
    email: event.email || null,
  };
  const { error: rpcError } = await supabase.rpc('log_site_activity', { p_event: payload });
  if (!rpcError) return;

  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) return;
  await supabase.from('activity_events').insert({
    user_id: userId,
    type: payload.type,
    audience: payload.audience,
    role: payload.role,
    path: payload.path,
    form: payload.form,
    name: payload.name,
    email: payload.email,
    payload,
  });
}

export function logActivity(type, data = {}) {
  const profile = currentProfile();
  const event = { id: newId(), type, at: new Date().toISOString(), ...data };
  if (!event.role) event.role = profile?.role || currentRole();
  if (!event.name) event.name = profile?.full_name || profile?.name || '';
  if (!event.email) event.email = profile?.email || '';
  event.audience = audienceFor(event);
  writeAll([...readAll(), event]);
  persistActivity(event).catch(() => {});
}

export async function listActivityForAdmin() {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('list_activity_for_admin');
  if (!error) {
    return (data || []).map(toFeedEvent).sort((a, b) => String(a.at).localeCompare(String(b.at)));
  }

  const { data: rows, error: queryError } = await supabase
    .from('activity_events')
    .select('id, user_id, type, audience, role, path, form, name, email, payload, created_at')
    .order('created_at', { ascending: true })
    .limit(2000);
  if (queryError) throw queryError;
  return (rows || []).map(toFeedEvent);
}

function subscribe(callback) {
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) {
      cache = null;
      callback();
    }
  };
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

function eventKey(event) {
  const time = Date.parse(event?.at) || 0;
  return [event?.type, event?.form || '', event?.path || '', event?.email || '', event?.challenge || '', Math.floor(time / 5000)].join('|');
}

function mergeActivity(local, remote) {
  const merged = [];
  const seen = new Set();
  [...(remote || []), ...(local || [])].forEach((event) => {
    const key = eventKey(event);
    if (!event || seen.has(key)) return;
    seen.add(key);
    merged.push(event);
  });
  return merged.sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
}

export function useActivity() {
  const local = useSyncExternalStore(subscribe, readAll);
  const [remote, setRemote] = useState([]);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;

    const load = () =>
      listActivityForAdmin()
        .then((rows) => {
          if (!cancelled) setRemote(rows);
        })
        .catch(() => {
          if (!cancelled) setRemote([]);
        });

    load();
    const channel = supabase
      .channel('activity-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity_events' }, () => {
        load();
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  return mergeActivity(local, remote);
}
