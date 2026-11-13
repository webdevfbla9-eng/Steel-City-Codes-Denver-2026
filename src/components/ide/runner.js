const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
const RUN_TIMEOUT_MS = 5000;
const LOAD_TIMEOUT_MS = 45000;

// Workers are built from strings so Vite ships them untouched and importScripts keeps working.
const pythonWorkerSource = `
importScripts('${PYODIDE_URL}');
const ready = loadPyodide();
self.onmessage = async (event) => {
  const pyodide = await ready;
  self.postMessage({ type: 'started' });
  const out = [];
  pyodide.setStdout({ batched: (s) => out.push(s) });
  pyodide.setStderr({ batched: (s) => out.push(s) });
  const scope = pyodide.globals.get('dict')();
  try {
    const result = await pyodide.runPythonAsync(event.data.code, { globals: scope });
    self.postMessage({ type: 'done', ok: true, stdout: out.join('\\n'), result: result == null ? null : String(result) });
  } catch (err) {
    const lines = String(err.message || err).trim().split('\\n');
    self.postMessage({ type: 'done', ok: false, stdout: out.join('\\n'), error: lines.slice(-4).join('\\n') });
  } finally {
    scope.destroy();
  }
};
`;

const jsWorkerSource = `
self.onmessage = (event) => {
  const logs = [];
  const format = (value) => (typeof value === 'string' ? value : JSON.stringify(value));
  self.console = { ...self.console, log: (...args) => logs.push(args.map(format).join(' ')) };
  self.postMessage({ type: 'started' });
  try {
    const result = new Function(event.data.code)();
    self.postMessage({ type: 'done', ok: true, stdout: logs.join('\\n'), result: result == null ? null : String(result) });
  } catch (err) {
    self.postMessage({ type: 'done', ok: false, stdout: logs.join('\\n'), error: err.name + ': ' + err.message });
  }
};
`;

const workerUrl = (source) => URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));

let pythonWorker = null;

function execute(worker, code, { onLoading, keepAlive }) {
  return new Promise((resolve) => {
    let timer;
    const finish = (payload, kill) => {
      clearTimeout(timer);
      worker.onmessage = null;
      worker.onerror = null;
      if (kill || !keepAlive) worker.terminate();
      resolve({ ...payload, killed: kill });
    };

    timer = setTimeout(
      () => finish({ ok: false, stdout: '', error: 'The code runner took too long to load. Check your internet connection and try again.' }, true),
      LOAD_TIMEOUT_MS
    );

    worker.onmessage = ({ data }) => {
      if (data.type === 'started') {
        clearTimeout(timer);
        timer = setTimeout(
          () => finish({ ok: false, stdout: '', error: 'Timed out after 5 seconds. Check for an infinite loop.' }, true),
          RUN_TIMEOUT_MS
        );
      } else {
        finish(data, false);
      }
    };
    worker.onerror = (event) => {
      event.preventDefault();
      finish({ ok: false, stdout: '', error: event.message || 'Could not start the code runner.' }, true);
    };

    if (onLoading) onLoading();
    worker.postMessage({ code });
  });
}

export async function runPython(code, onLoading) {
  if (!pythonWorker) pythonWorker = new Worker(workerUrl(pythonWorkerSource));
  const result = await execute(pythonWorker, code, { onLoading, keepAlive: true });
  if (result.killed) pythonWorker = null;
  return result;
}

export function runJavaScript(code) {
  return execute(new Worker(workerUrl(jsWorkerSource)), code, { keepAlive: false });
}

export function pythonHarness(userCode, fnName, tests) {
  return `${userCode}

import json as __json
__tests = __json.loads(${JSON.stringify(JSON.stringify(tests))})
__results = []
for __t in __tests:
    try:
        __got = ${fnName}(*__t["args"])
        __results.append({"ok": __got == __t["expected"], "got": __json.dumps(__got, default=str)})
    except Exception as __e:
        __results.append({"ok": False, "got": type(__e).__name__ + ": " + str(__e)})
__json.dumps(__results)
`;
}

export function javascriptHarness(userCode, fnName, tests) {
  return `${userCode}
;return JSON.stringify(${JSON.stringify(tests)}.map((t) => {
  try {
    const got = ${fnName}(...t.args);
    return { ok: JSON.stringify(got) === JSON.stringify(t.expected), got: got === undefined ? 'undefined' : JSON.stringify(got) };
  } catch (e) {
    return { ok: false, got: e.name + ': ' + e.message };
  }
}));`;
}
