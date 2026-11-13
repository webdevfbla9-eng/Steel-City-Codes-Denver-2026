import { useEffect, useMemo, useState } from 'react';
import ChallengeWorkspace from './ChallengeWorkspace.jsx';
import { challenges, languages } from '../../data/challenges.js';
import { logActivity } from '../../data/activity.js';

const STORAGE_KEY = 'scc-evaluation-v1';

const loadSaved = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
};

export default function EvaluationIDE() {
  const saved = useMemo(loadSaved, []);
  const [language, setLanguage] = useState('python');
  const [activeId, setActiveId] = useState(challenges[0].id);
  const [code, setCode] = useState(saved.code || {});
  const [passed, setPassed] = useState(saved.passed || {});
  const [name, setName] = useState(saved.name || '');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, passed, name }));
  }, [code, passed, name]);

  const visible = challenges.filter((c) => c.language === language);
  const challenge = challenges.find((c) => c.id === activeId);
  const passedCount = challenges.filter((c) => passed[c.id]).length;

  const selectLanguage = (id) => {
    setLanguage(id);
    setActiveId(challenges.find((c) => c.language === id).id);
  };

  return (
    <div className="ide">
      <div className="ide-topbar">
        <span className="ide-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <div className="ide-tabs" role="tablist" aria-label="Language">
          {languages.map((lang) => (
            <button
              key={lang.id}
              role="tab"
              aria-selected={language === lang.id}
              className={language === lang.id ? 'is-active' : ''}
              onClick={() => selectLanguage(lang.id)}
            >
              {lang.label}
            </button>
          ))}
        </div>
        <span className="ide-progress">
          {passedCount} / {challenges.length} passed
        </span>
      </div>

      <label className="ide-namebar">
        <span>Volunteer name</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your full name so our admins can see your results"
          autoComplete="name"
        />
      </label>

      <div className="ide-body">
        <aside className="ide-sidebar" aria-label="Practice problems">
          <p className="ide-sidebar-title">Practice</p>
          <ul>
            {visible.map((c) => (
              <li key={c.id}>
                <button
                  className={c.id === activeId ? 'is-active' : ''}
                  onClick={() => setActiveId(c.id)}
                  aria-current={c.id === activeId ? 'true' : undefined}
                >
                  <span className={`ide-check ${passed[c.id] ? 'is-done' : ''}`} aria-hidden="true">
                    {passed[c.id] ? '✓' : ''}
                  </span>
                  <span>
                    {c.title}
                    <small>{c.level}</small>
                  </span>
                  {passed[c.id] && <span className="sr-only">(passed)</span>}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <ChallengeWorkspace
          key={challenge.id}
          challenge={challenge}
          code={code[challenge.id] ?? challenge.starter ?? ''}
          onCodeChange={(value) => setCode((prev) => ({ ...prev, [challenge.id]: value }))}
          onReset={() =>
            setCode((prev) => {
              const next = { ...prev };
              delete next[challenge.id];
              return next;
            })
          }
          onPassed={() => {
            if (passed[challenge.id]) return;
            const next = { ...passed, [challenge.id]: true };
            setPassed(next);
            const who = name.trim() || 'Anonymous volunteer';
            const langLabel = languages.find((l) => l.id === challenge.language).label;
            logActivity('assessment_passed', { name: who, language: langLabel, challenge: challenge.title });
            const set = challenges.filter((c) => c.language === challenge.language);
            if (set.every((c) => next[c.id])) {
              logActivity('assessment_completed', { name: who, language: langLabel, score: `${set.length} / ${set.length}` });
            }
          }}
        />
      </div>
    </div>
  );
}
