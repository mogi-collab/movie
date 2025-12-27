import { useState } from 'react';

interface DirectorPanelProps {
  projectId: string;
  onClose?: () => void;
}

export default function DirectorPanel({ projectId, onClose }: DirectorPanelProps) {
  const [input, setInput] = useState('Create a tense opening scene about betrayal.');
  const [phases, setPhases] = useState<string>('1,2,3');
  const [running, setRunning] = useState(false);
  const [trace, setTrace] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setTrace(null);

    try {
      const body = {
        projectId,
        phases: phases.split(',').map((s) => ({ id: Number(s.trim()), input })),
      };

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/run-director`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`Orchestrator failed: ${res.status}`);
      const json = await res.json();
      setTrace(json.trace || null);
    } catch (err: any) {
      setError(String(err));
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">AI Director — Run Phases</h2>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 px-2 py-1 rounded"
            >
              Close
            </button>
          )}
        </div>
      </div>

      <label className="block text-sm text-slate-400 mb-1">Prompt</label>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded p-3 text-slate-100 mb-4"
        rows={4}
      />

      <label className="block text-sm text-slate-400 mb-1">Phases (comma-separated)</label>
      <input
        value={phases}
        onChange={(e) => setPhases(e.target.value)}
        className="w-36 bg-slate-800 border border-slate-700 rounded p-2 text-slate-100 mb-4"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={running}
          className={`px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white`}
        >
          {running ? 'Running…' : 'Run'}
        </button>
        <button
          onClick={() => { setTrace(null); setError(null); }}
          className="px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
        >
          Clear
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {trace && (
        <div className="mt-4 bg-slate-800 border border-slate-700 rounded p-3 text-sm">
          <div className="font-medium text-slate-200 mb-2">Execution Trace</div>
          {trace.map((t: any, i: number) => (
            <div key={i} className="mb-2">
              <div className="text-slate-300">Phase {t.phase} — {t.provider || 'n/a'}</div>
              <pre className="text-xs text-slate-400 mt-1 overflow-auto">{JSON.stringify(t.output || t.error || {}, null, 2)}</pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
