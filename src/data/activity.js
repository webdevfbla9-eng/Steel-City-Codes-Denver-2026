import { useSyncExternalStore } from 'react';

// Stored in this browser only. To see activity from every visitor, replace
// readAll/writeAll with calls to a shared backend (Supabase, Firebase, etc.).
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
  form_open: { label: 'Opened a form', audience: 'Visitors' },
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

function currentRole() {
  try {
    return JSON.parse(localStorage.getItem('scc-auth-cache'))?.profile?.role || '';
  } catch {
    return '';
  }
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

export function logActivity(type, data = {}) {
  const event = { id: newId(), type, at: new Date().toISOString(), ...data };
  if (!event.role) event.role = currentRole();
  event.audience = audienceFor(event);
  writeAll([...readAll(), event]);
}

export function clearActivity() {
  writeAll([]);
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

export function useActivity() {
  return useSyncExternalStore(subscribe, readAll);
}

const demoNames = ['Maya Patel', 'Ethan Kim', 'Sofia Ramirez', 'Noah Johnson', 'Ava Nguyen', 'Liam Brooks', 'Zara Ali', 'Owen Lee'];
const demoPages = ['/', '/', '/', '/about', '/volunteers', '/parents', '/parents', '/students', '/students'];
const demoChallenges = [
  ['python', 'Count the Vowels'],
  ['python', 'FizzBuzz'],
  ['java', 'Loop Output'],
  ['javascript', 'Title Case'],
];
const demoQuestions = [
  'Is there a waitlist for the Koelbel Library chapter?',
  'Can my 3rd grader join Intro to Python?',
  'Do students need to bring lunch to summer camp?',
  'Is the Cherry Creek Academy chapter open to students from other schools?',
];

export function loadDemoActivity() {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const events = [];
  const now = Date.now();
  for (let day = 29; day >= 0; day--) {
    const dayStart = now - day * 86400000;
    const at = () => new Date(dayStart - Math.random() * 36000000).toISOString();
    const add = (type, data) => events.push({ id: newId(), type, at: at(), demo: true, ...data });
    const views = 8 + Math.floor(Math.random() * 25) + (day < 7 ? 10 : 0);
    for (let i = 0; i < views; i++) add('page_view', { path: pick(demoPages) });
    if (Math.random() < 0.5) {
      const [language, challenge] = pick(demoChallenges);
      add('assessment_passed', { name: pick(demoNames), language, challenge });
    }
    if (Math.random() < 0.15) add('assessment_completed', { name: pick(demoNames), language: pick(['python', 'java']), score: '4 / 4' });
    if (Math.random() < 0.6) add('daily_solved', { challenge: 'Daily challenge', language: pick(['python', 'java']) });
    if (Math.random() < 0.2) add('ide_request', { name: pick(demoNames), email: 'student@example.com', chapter: pick(['Smoky Hill Library', 'Koelbel Library', 'Castlewood Library']), message: 'I would like an account for the Steel City Codes IDE.', status: 'new' });
    if (Math.random() < 0.2) add('parent_question', { name: pick(demoNames), email: 'parent@example.com', message: pick(demoQuestions), status: 'new' });
    if (Math.random() < 0.3) add('donation_click', {});
    if (Math.random() < 0.35) add('account_created', { name: pick(demoNames), email: 'member@example.com', role: pick(['student', 'parent', 'volunteer']) });
    if (Math.random() < 0.4) add('form_open', { form: pick(['School Year Chapter Registration Form', 'Summer Camp Registration Form', 'School Year Chapters Volunteer Form']) });
  }
  events.sort((a, b) => a.at.localeCompare(b.at));
  writeAll([...readAll().filter((e) => !e.demo), ...events].sort((a, b) => a.at.localeCompare(b.at)));
}

export function clearDemoActivity() {
  writeAll(readAll().filter((event) => !event.demo));
}
