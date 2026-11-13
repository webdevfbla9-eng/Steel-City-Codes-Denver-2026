import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FadeIn from '../components/FadeIn.jsx';
import ParentInquiries from '../components/ParentInquiries.jsx';
import RevealHeading from '../components/RevealHeading.jsx';
import { signOut, updateAvatar, useAuth } from '../data/auth.js';
import { useActivity } from '../data/activity.js';
import { challenges } from '../data/challenges.js';
import { dateKey } from '../data/dailyChallenges.js';

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
};

const pageShortcuts = {
  student: [
    { title: 'Students page', text: 'Daily challenge, syntax references, and IDE account requests.', to: '/students' },
    { title: 'Everyday Coding Challenge', text: "Solve today's problem and keep your streak going.", to: '/students#challenge' },
    { title: 'Steel City Codes IDE', text: 'Code real projects in the national IDE.', href: 'https://code.steelcitycodes.org/' },
  ],
  parent: [
    { title: 'Students page', text: 'Daily challenge, syntax references, and IDE account requests.', to: '/students' },
    { title: 'Parents page', text: 'Donations, registration forms, curriculums, and FAQ.', to: '/parents' },
    { title: 'Volunteers page', text: 'Volunteer forms, curriculum slides, and evaluation.', to: '/volunteers' },
  ],
  volunteer: [
    { title: 'Volunteers page', text: 'Volunteer forms, curriculum slides, and evaluation.', to: '/volunteers' },
    { title: 'Parents page', text: 'Donations, registration forms, curriculums, and FAQ.', to: '/parents' },
    { title: 'Assessment', text: 'Complete the volunteer evaluation on the Volunteers page.', to: '/volunteers#evaluation' },
  ],
};

function streakFrom(days) {
  const solved = new Set(days);
  const day = new Date();
  if (!solved.has(dateKey(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (solved.has(dateKey(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function formatMemberSince(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function initialsFor(name, email) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return String(email || 'SC').slice(0, 2).toUpperCase();
}

export default function Dashboard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const activity = useActivity();
  const [avatarError, setAvatarError] = useState('');
  const [avatarBusy, setAvatarBusy] = useState(false);

  const daily = readJson('scc-daily-v1');
  const solvedDays = daily.solvedDays || [];
  const solvedToday = solvedDays.includes(dateKey(new Date()));
  const evaluation = readJson('scc-evaluation-v1');
  const passedCount = challenges.filter((c) => evaluation.passed?.[c.id]).length;
  const email = user.email?.toLowerCase();
  const formsOpened = activity.filter(
    (event) => event.type === 'form_open' && (!event.email || event.email.toLowerCase() === email),
  ).length;

  const roleLabel = user.role ? user.role[0].toUpperCase() + user.role.slice(1) : '';
  const firstName = user.name.split(' ')[0];
  const memberSince = formatMemberSince(user.createdAt);
  const progress =
    user.role === 'parent'
      ? [{ value: formsOpened, label: 'Forms opened', detail: 'Chapter and camp registration forms' }]
      : user.role === 'volunteer'
        ? [
            { value: `${passedCount}/${challenges.length}`, label: 'Assessment problems passed', detail: 'From the Volunteers evaluation' },
          ]
        : [
            { value: solvedDays.length, label: 'Daily challenges solved', detail: solvedToday ? "✓ Today's is done" : "Today's is waiting for you" },
            { value: streakFrom(solvedDays), label: 'Day streak', detail: 'Solve one every day to grow it' },
          ];

  const changePhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setAvatarError('');
    setAvatarBusy(true);
    try {
      await updateAvatar(file);
      await refreshProfile();
    } catch (err) {
      setAvatarError(err.message);
    } finally {
      setAvatarBusy(false);
    }
  };

  return (
    <>
      <section className="section section-dark dashboard-hero">
        <div className="container dashboard-hero-row">
          <div className="dashboard-avatar-wrap">
            <div className="dashboard-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={`${user.name} profile`} />
              ) : (
                <span aria-hidden="true">{initialsFor(user.name, user.email)}</span>
              )}
            </div>
            <label className="dashboard-avatar-edit">
              <input type="file" accept="image/*" onChange={changePhoto} disabled={avatarBusy} />
              {avatarBusy ? 'Saving…' : 'Change photo'}
            </label>
          </div>
          <div className="dashboard-hero-copy">
            <span className="dashboard-role">{roleLabel}</span>
            <RevealHeading as="h1" className="section-title section-title-xl">{`Welcome, ${firstName}!`}</RevealHeading>
            <FadeIn as="p" className="body-large section-intro" delay={300}>
              {memberSince ? `Member since ${memberSince} · ` : null}
              {user.email}
            </FadeIn>
            {avatarError && (
              <p className="auth-error" role="alert">
                {avatarError}
              </p>
            )}
            <button
              type="button"
              className="admin-link-button"
              onClick={() => {
                signOut();
                navigate('/');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      <section className="section section-offwhite">
        <div className="container">
          <RevealHeading className="section-title">Your Progress</RevealHeading>
          <ul className={`dashboard-stats dashboard-stats-${progress.length}`}>
            {progress.map((item, i) => (
              <FadeIn as="li" key={item.label} className="dashboard-stat" variant="zoom" delay={i * 120}>
                <span className="dashboard-stat-value">{item.value}</span>
                <span className="dashboard-stat-label">{item.label}</span>
                <span className="dashboard-stat-detail">{item.detail}</span>
              </FadeIn>
            ))}
          </ul>
        </div>
      </section>

      <section className="section section-cream">
        <div className="container">
          <RevealHeading className="section-title">Quick Links</RevealHeading>
          <div className="dashboard-links">
            {(pageShortcuts[user.role] || []).map((link, i) => {
              const content = (
                <>
                  <h3>{link.title}</h3>
                  <p>{link.text}</p>
                  <span className="dashboard-link-arrow" aria-hidden="true">
                    {link.href ? '↗' : '→'}
                  </span>
                </>
              );
              return (
                <FadeIn key={link.title} delay={i * 120}>
                  {link.href ? (
                    <a className="dashboard-link" href={link.href} target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  ) : (
                    <Link className="dashboard-link" to={link.to}>
                      {content}
                    </Link>
                  )}
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {user.role === 'parent' ? (
        <ParentInquiries
          heading="Responses from our team"
          intro="Questions you send from the Parents page, and the administrator replies to them, show up here."
        />
      ) : null}
    </>
  );
}
