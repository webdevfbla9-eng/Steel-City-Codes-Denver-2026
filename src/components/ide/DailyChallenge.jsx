import { useEffect, useMemo, useState } from 'react';
import ChallengeWorkspace from './ChallengeWorkspace.jsx';
import { challengeForDate, dateKey } from '../../data/dailyChallenges.js';
import { logActivity } from '../../data/activity.js';

const STORAGE_KEY = 'scc-daily-v1';

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

const timeUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const minutes = Math.ceil((midnight - now) / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export default function DailyChallenge() {
  const [today, setToday] = useState(() => new Date());
  const [countdown, setCountdown] = useState(timeUntilMidnight);
  const challenge = challengeForDate(today);
  const key = dateKey(today);

  const saved = useMemo(loadSaved, []);
  const [code, setCode] = useState(saved.date === key ? saved.code : undefined);
  const [solvedDays, setSolvedDays] = useState(saved.solvedDays || []);
  const solved = solvedDays.includes(key);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCountdown(timeUntilMidnight());
      if (dateKey(now) !== dateKey(today)) {
        setToday(now);
        setCode(undefined);
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [today]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: key, code, solvedDays }));
  }, [key, code, solvedDays]);

  const formattedDate = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="ide daily-ide">
      <div className="ide-topbar">
        <span className="ide-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="daily-date">{formattedDate}</span>
        <span className="daily-badge">{challenge.level}</span>
        <span className="ide-progress">
          {solved ? '✓ Solved today' : `New challenge in ${countdown}`}
          {solvedDays.length > 0 && ` · ${solvedDays.length} day${solvedDays.length === 1 ? '' : 's'} solved`}
        </span>
      </div>

      <ChallengeWorkspace
        key={`${key}-${challenge.id}`}
        challenge={challenge}
        code={code ?? challenge.starter ?? ''}
        onCodeChange={setCode}
        onReset={() => setCode(undefined)}
        onPassed={() => {
          if (solved) return;
          setSolvedDays((prev) => (prev.includes(key) ? prev : [...prev, key]));
          logActivity('daily_solved', { challenge: challenge.title, language: challenge.language });
        }}
      />
    </div>
  );
}
