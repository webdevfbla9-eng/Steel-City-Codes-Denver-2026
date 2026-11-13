import { useState } from 'react';
import CodeEditor from './CodeEditor.jsx';
import { javascriptHarness, pythonHarness, runJavaScript, runPython } from './runner.js';

const fileNames = { python: 'main.py', java: 'Main.java', javascript: 'script.js' };

const normalizeOutput = (text) =>
  text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();

const formatArgs = (args) => args.map((arg) => JSON.stringify(arg)).join(', ');

// Render with key={challenge.id} so prediction and output reset when the challenge changes.
export default function ChallengeWorkspace({ challenge, code, onCodeChange, onReset, onPassed }) {
  const [prediction, setPrediction] = useState('');
  const [status, setStatus] = useState('idle');
  const [output, setOutput] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const isPredict = challenge.mode === 'predict';
  const busy = status !== 'idle';

  const runTests = async () => {
    setStatus('running');
    setOutput(null);

    const result =
      challenge.language === 'python'
        ? await runPython(pythonHarness(code, challenge.fnName, challenge.tests), () => setStatus('loading'))
        : await runJavaScript(javascriptHarness(code, challenge.fnName, challenge.tests));

    if (!result.ok) {
      setOutput({ kind: 'error', stdout: result.stdout, error: result.error });
    } else {
      const tests = JSON.parse(result.result).map((r, i) => ({ ...r, ...challenge.tests[i] }));
      const allPassed = tests.every((t) => t.ok);
      if (allPassed) onPassed();
      setOutput({ kind: 'tests', stdout: result.stdout, tests, allPassed });
    }
    setStatus('idle');
  };

  const checkPrediction = () => {
    const ok = normalizeOutput(prediction) === normalizeOutput(challenge.answer);
    if (ok) onPassed();
    setOutput({ kind: 'prediction', ok });
  };

  const resetCode = () => {
    onReset();
    setOutput(null);
  };

  return (
    <div className="ide-main">
      <div className="ide-prompt">
        <h3>{challenge.title}</h3>
        <p>{challenge.prompt}</p>
      </div>

      <div className="ide-file">{fileNames[challenge.language]}</div>
      <CodeEditor
        value={isPredict ? challenge.code : code}
        onChange={onCodeChange}
        readOnly={isPredict}
        indent={challenge.language === 'python' ? '    ' : '  '}
        label={`${challenge.title} code editor`}
      />

      {isPredict && (
        <label className="ide-prediction">
          <span>Your predicted output</span>
          <textarea
            rows={4}
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            spellCheck={false}
            placeholder="Type exactly what the program prints"
          />
        </label>
      )}

      <div className="ide-actions">
        {isPredict ? (
          <>
            <button className="ide-run" onClick={checkPrediction}>
              Check answer
            </button>
            {output?.kind === 'prediction' && !output.ok && (
              <button className="ide-secondary" onClick={() => setShowAnswer(true)}>
                Reveal answer
              </button>
            )}
          </>
        ) : (
          <>
            <button className="ide-run" onClick={runTests} disabled={busy}>
              {status === 'loading' ? 'Loading Python…' : status === 'running' ? 'Running…' : '▶ Run tests'}
            </button>
            <button className="ide-secondary" onClick={resetCode} disabled={busy}>
              Reset code
            </button>
          </>
        )}
      </div>

      <div className="ide-console" aria-live="polite">
        <p className="ide-console-title">Output</p>
        {!output && (
          <p className="ide-muted">
            {isPredict
              ? 'Read the code, type its output, then check your answer.'
              : 'Write your solution, then run the tests.'}
          </p>
        )}

        {output?.kind === 'prediction' && (
          <p className={output.ok ? 'ide-pass' : 'ide-fail'}>
            {output.ok ? '✓ Correct! Nice work.' : '✗ Not quite. Trace through the code line by line and try again.'}
          </p>
        )}
        {showAnswer && <pre className="ide-answer">{challenge.answer}</pre>}

        {output?.stdout && <pre className="ide-stdout">{output.stdout}</pre>}

        {output?.kind === 'error' && <pre className="ide-error">{output.error}</pre>}

        {output?.kind === 'tests' && (
          <>
            <ul className="ide-tests">
              {output.tests.map((t, i) => (
                <li key={i} className={t.ok ? 'ide-pass' : 'ide-fail'}>
                  <span aria-hidden="true">{t.ok ? '✓' : '✗'}</span>
                  <code>
                    {challenge.fnName}({formatArgs(t.args)})
                  </code>
                  <span className="ide-muted">
                    expected {JSON.stringify(t.expected)}
                    {!t.ok && <>, got {t.got}</>}
                  </span>
                </li>
              ))}
            </ul>
            <p className={output.allPassed ? 'ide-pass' : 'ide-fail'}>
              {output.allPassed
                ? 'All tests passed!'
                : `${output.tests.filter((t) => t.ok).length} of ${output.tests.length} tests passed.`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
