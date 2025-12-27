import { useState } from 'react';

interface Phase16MonetizationProps {
  projectId: string;
}

export default function Phase16Monetization({ projectId }: Phase16MonetizationProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phase16-monetization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ projectId }),
      });

      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      setMessage(data?.ok ? 'Monetization plan generated' : 'Unexpected response');
    } catch (err) {
      setMessage('Failed to generate monetization plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase 16: Monetization & Long-term Support</h2>
        <p className="text-slate-400">Create a monetization and sustainability plan for long-term viability.</p>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
        <p className="text-slate-300 mb-4">Generate a plan that outlines revenue streams and long-term support considerations.</p>
        <div className="flex gap-3">
          <button onClick={handleGenerate} disabled={loading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white">
            {loading ? 'Generating…' : 'Generate Monetization Plan'}
          </button>
          {message && <span className="text-slate-300">{message}</span>}
        </div>
      </div>
    </div>
  );
}
