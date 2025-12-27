import React, { useState } from 'react';

export default function Phase6Structure() {
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  async function runCheck() {
    setLoading(true);
    // For now, use a canned outline from the UI
    const outline = {
      act_one: { title: 'Act I', scenes: [{ number: 1, title: 'Opening', description: 'setup' }] },
      act_two: { title: 'Act II', scenes: [{ number: 2, title: 'Confrontation', description: 'rising' }] },
      act_three: { title: 'Act III', scenes: [{ number: 3, title: 'Resolution', description: 'finish' }] },
    };

    try {
      const res = await fetch('/.netlify/functions/generate-structure-check', { method: 'POST', body: JSON.stringify({ outline }), headers: { 'Content-Type': 'application/json' } });
      const json = await res.json();
      setResults(json);
    } catch (err) {
      console.error(err);
      setResults({ error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold">Structure Validation</h2>
      <p className="text-sm text-gray-500">Checks story outline for scene continuity, foreshadowing hints, and unresolved markers.</p>
      <button className="mt-4 btn" onClick={runCheck} disabled={loading}>{loading ? 'Running...' : 'Run Structure Check'}</button>
      <pre className="mt-4 bg-gray-100 p-2">{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}
