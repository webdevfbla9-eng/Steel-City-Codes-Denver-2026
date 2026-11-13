import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { activityAudiences, activityTypes, audienceFor, useActivity } from '../data/activity.js';
import { signOut } from '../auth/AuthProvider.jsx';
import RoleBasedAccess from '../auth/RoleBasedAccess.jsx';
import AdminUsers from '../components/AdminUsers.jsx';
import AdminInquiries from '../components/AdminInquiries.jsx';
import { ACTIONS } from '../auth/permissions.js';
import { listProfilesForAdmin } from '../lib/accounts.js';
import { useInquiries } from '../lib/InquiriesProvider.jsx';

const ranges = [
  { id: '7', label: 'Last 7 days', days: 7 },
  { id: '30', label: 'Last 30 days', days: 30 },
  { id: 'all', label: 'All time', days: null },
];

const pageNames = {
  '/': 'Home',
  '/about': 'About',
  '/get-involved': 'About',
  '/volunteers': 'Volunteers',
  '/parents': 'Parents',
  '/students': 'Students',
};

const audiences = activityAudiences;

const adminShortcuts = [
  { to: '/students', title: 'Students page', text: 'Daily challenge, syntax references, and IDE account requests.' },
  { to: '/parents', title: 'Parents page', text: 'Donations, registration forms, curriculums, and FAQ.' },
  { to: '/volunteers', title: 'Volunteers page', text: 'Volunteer forms, curriculum slides, and evaluation.' },
];

const dayKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatTime = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const countBy = (events, getKey) => {
  const counts = new Map();
  events.forEach((event) => {
    const key = getKey(event);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
};

function describe(event) {
  switch (event.type) {
    case 'page_view':
      return `Visited ${pageNames[event.path] || event.path}`;
    case 'assessment_passed':
      return `${event.name} passed "${event.challenge}" (${event.language})`;
    case 'assessment_completed':
      return `${event.name} completed the ${event.language} assessment (${event.score})`;
    case 'daily_solved':
      return `A student solved "${event.challenge}"`;
    case 'ide_request':
      return `${event.name} requested an IDE account${event.chapter ? ` · ${event.chapter}` : ''}`;
    case 'parent_question':
      return `${event.name} asked: "${event.message}"`;
    case 'donation_click':
      return 'Someone opened the PayPal donation page';
    case 'form_open':
      return `Opened the ${event.form}`;
    case 'account_created':
      return `${event.name} signed up as a ${event.role} (${event.email})`;
    default:
      return activityTypes[event.type]?.label || event.type;
  }
}

function StatCard({ label, value, detail }) {
  return (
    <div className="admin-stat">
      <span className="admin-stat-value">{value}</span>
      <span className="admin-stat-label">{label}</span>
      {detail && <span className="admin-stat-detail">{detail}</span>}
    </div>
  );
}

function DailyChart({ events, days }) {
  const buckets = useMemo(() => {
    const counts = new Map(countBy(events, (e) => dayKey(e.at)));
    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      return { key: dayKey(date), date, count: counts.get(dayKey(date)) || 0 };
    });
  }, [events, days]);

  const max = Math.max(1, ...buckets.map((b) => b.count));
  const width = 720;
  const height = 220;
  const pad = { top: 16, bottom: 28, left: 32 };
  const slot = (width - pad.left) / buckets.length;
  const barWidth = Math.max(4, slot * 0.62);
  const labelEvery = Math.ceil(buckets.length / 7);
  const scaleY = (value) => ((height - pad.top - pad.bottom) * value) / max;

  return (
    <svg className="admin-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Page views per day over the last ${days} days`}>
      {[0, 0.5, 1].map((t) => {
        const y = height - pad.bottom - scaleY(max * t);
        return (
          <g key={t}>
            <line x1={pad.left} x2={width} y1={y} y2={y} className="admin-chart-grid" />
            <text x={pad.left - 8} y={y + 4} textAnchor="end" className="admin-chart-axis">
              {Math.round(max * t)}
            </text>
          </g>
        );
      })}
      {buckets.map((bucket, i) => {
        const x = pad.left + i * slot + (slot - barWidth) / 2;
        const barHeight = scaleY(bucket.count);
        return (
          <g key={bucket.key}>
            <rect x={x} y={height - pad.bottom - barHeight} width={barWidth} height={barHeight} rx={3} className="admin-chart-bar">
              <title>{`${bucket.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}: ${bucket.count} views`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={x + barWidth / 2} y={height - 8} textAnchor="middle" className="admin-chart-axis">
                {bucket.date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BarList({ rows, emptyText }) {
  if (rows.length === 0) return <p className="admin-empty">{emptyText}</p>;
  const max = Math.max(...rows.map(([, count]) => count));
  return (
    <ul className="admin-barlist">
      {rows.map(([label, count]) => (
        <li key={label}>
          <span className="admin-barlist-label">{label}</span>
          <span className="admin-barlist-track">
            <span className="admin-barlist-fill" style={{ width: `${(count / max) * 100}%` }} />
          </span>
          <span className="admin-barlist-count">{count}</span>
        </li>
      ))}
    </ul>
  );
}

function ActivityFeed({ events }) {
  const [audience, setAudience] = useState('All');
  const [showViews, setShowViews] = useState(false);
  const rows = events
    .filter((event) => showViews || event.type !== 'page_view')
    .filter((event) => audience === 'All' || audienceFor(event) === audience)
    .slice(-60)
    .reverse();

  return (
    <>
      <div className="admin-feed-controls">
        <div className="admin-pills admin-pills-dark" role="group" aria-label="Filter activity">
          {['All', ...audiences].map((a) => (
            <button key={a} type="button" className={audience === a ? 'is-active' : ''} aria-pressed={audience === a} onClick={() => setAudience(a)}>
              {a}
            </button>
          ))}
        </div>
        <label className="admin-toggle">
          <input type="checkbox" checked={showViews} onChange={(event) => setShowViews(event.target.checked)} />
          Show page views
        </label>
      </div>
      {rows.length === 0 ? (
        <p className="admin-empty">
          {audience === 'All' ? 'No activity yet.' : `No ${audience.toLowerCase()} activity in this range.`}
        </p>
      ) : (
        <ol className="admin-feed">
          {rows.map((event) => {
            const info = activityTypes[event.type] || { label: event.type, audience: 'Visitors' };
            const group = audienceFor(event);
            return (
              <li key={event.id}>
                <span className={`admin-dot admin-dot-${group.toLowerCase()}`} aria-hidden="true" />
                <span className="admin-feed-text">
                  <strong>{info.label}</strong>
                  <span>{describe(event)}</span>
                </span>
                <time dateTime={event.at}>{formatTime(event.at)}</time>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const all = useActivity();
  const { inquiries, unreadCount } = useInquiries();
  const [rangeId, setRangeId] = useState('30');
  const [profiles, setProfiles] = useState([]);
  const range = ranges.find((r) => r.id === rangeId);

  useEffect(() => {
    listProfilesForAdmin()
      .then(setProfiles)
      .catch(() => setProfiles([]));
  }, []);

  const events = useMemo(() => {
    if (!range.days) return all;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - (range.days - 1));
    return all.filter((event) => new Date(event.at) >= cutoff);
  }, [all, range]);

  const ofType = (type) => events.filter((event) => event.type === type);
  const views = ofType('page_view');
  const passed = ofType('assessment_passed');
  const completed = ofType('assessment_completed');
  const ideRequests = ofType('ide_request');
  const pendingAccounts = profiles.filter((item) => item.approval_status === 'pending');

  const topPages = countBy(views, (e) => pageNames[e.path] || e.path).slice(0, 6);
  const byAudience = audiences.map((a) => [a, events.filter((e) => audienceFor(e) === a).length]).filter(([, n]) => n > 0);
  const byLanguage = countBy(passed, (e) => e.language);
  const topForms = countBy(ofType('form_open'), (e) => e.form);

  return (
    <>
      <section className="section section-dark admin-hero">
        <div className="container">
          <h1 className="section-title section-title-xl">
            Admin Dashboard
            {unreadCount + pendingAccounts.length > 0 ? (
              <span className="inquiry-unread">
                {unreadCount + pendingAccounts.length > 9 ? '9+' : unreadCount + pendingAccounts.length}
              </span>
            ) : null}
          </h1>
          <p className="body-large section-intro">
            Review pending accounts, parent questions, and site activity.
          </p>
          <div className="admin-toolbar">
            <div className="admin-pills admin-pills-dark" role="group" aria-label="Date range">
              {ranges.map((r) => (
                <button key={r.id} type="button" className={rangeId === r.id ? 'is-active' : ''} aria-pressed={rangeId === r.id} onClick={() => setRangeId(r.id)}>
                  {r.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="admin-link-button"
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
            >
              Sign out
            </button>
          </div>
          <div className="admin-stats">
            <StatCard
              label="Pending approvals"
              value={pendingAccounts.length}
              detail={pendingAccounts.length ? pendingAccounts.map((item) => item.role).join(' · ') : 'No accounts waiting'}
            />
            <StatCard label="Parent inquiries" value={inquiries.length} detail={unreadCount ? `${unreadCount} pending` : 'All caught up'} />
            <StatCard label="Page views" value={views.length} detail={plural(new Set(views.map((v) => dayKey(v.at))).size, 'active day')} />
            <StatCard label="Assessments completed" value={completed.length} detail={`${plural(passed.length, 'problem')} passed`} />
            <StatCard label="Daily challenges solved" value={ofType('daily_solved').length} />
            <StatCard label="IDE account requests" value={ideRequests.length} />
            <StatCard label="Donation clicks" value={ofType('donation_click').length} detail="Opened the PayPal page" />
            <StatCard label="Sign-up forms opened" value={ofType('form_open').length} detail="Full Google Forms" />
          </div>
        </div>
      </section>

      <RoleBasedAccess action={ACTIONS.manageUsers}>
        <AdminUsers />
      </RoleBasedAccess>

      <RoleBasedAccess action={ACTIONS.viewAdminDashboard}>
        <AdminInquiries />
      </RoleBasedAccess>

      <section className="section section-offwhite">
        <div className="container">
          <h2 className="section-title">Quick Links</h2>
          <div className="dashboard-links">
            {adminShortcuts.map((link) => (
              <Link key={link.to} className="dashboard-link" to={link.to}>
                <h3>{link.title}</h3>
                <p>{link.text}</p>
                <span className="dashboard-link-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <h2 className="section-title">Analytics</h2>
          <div className="admin-panel admin-panel-wide">
            <h3>Website traffic</h3>
            <DailyChart events={views} days={range.days || 30} />
          </div>
          <div className="admin-grid">
            <div className="admin-panel">
              <h3>Most visited pages</h3>
              <BarList rows={topPages} emptyText="No page views yet." />
            </div>
            <div className="admin-panel">
              <h3>Activity by audience</h3>
              <BarList rows={byAudience} emptyText="No volunteer, student, or parent activity yet." />
            </div>
            <div className="admin-panel">
              <h3>Assessment problems passed</h3>
              <BarList rows={byLanguage} emptyText="No volunteers have passed a problem yet." />
            </div>
            <div className="admin-panel">
              <h3>Sign-up forms opened</h3>
              <BarList rows={topForms} emptyText="Nobody has opened a full form yet." />
            </div>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <h2 className="section-title">Recent Activity</h2>
          <ActivityFeed events={events} />
        </div>
      </section>
    </>
  );
}

export default function Admin() {
  return <Dashboard />;
}
