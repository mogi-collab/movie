import { useState } from 'react';
import { Debate } from '../../types';
import { Loader, Zap } from 'lucide-react';

interface Phase3DebateProps {
  projectId: string;
}

export default function Phase3Debate({ projectId }: Phase3DebateProps) {
  const [generating, setGenerating] = useState(false);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [selectedDebate, setSelectedDebate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateDebates = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-debates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) throw new Error('Failed to generate debates');
      const data = await response.json();
      setDebates(data.debates || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate debates';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase 3: AI Debate & Arguments</h2>
        <p className="text-slate-400">Watch AI perspectives debate key creative decisions</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {debates.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
          <Zap className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Generate Debates</h3>
          <p className="text-slate-400 mb-6">
            AI roles will debate key story decisions and creative choices
          </p>
          <button
            onClick={handleGenerateDebates}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            {generating && <Loader className="w-5 h-5 animate-spin" />}
            {generating ? 'Generating Debates...' : 'Generate Debates'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            {debates.map((debate, idx) => (
              <button
                key={debate.id}
                onClick={() => setSelectedDebate(debate.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition text-sm ${
                  selectedDebate === debate.id
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="truncate">Debate {idx + 1}</div>
                <p className="text-xs text-slate-400 mt-1 truncate">{debate.topic}</p>
              </button>
            ))}
          </div>

          <div className="lg:col-span-3">
            {selectedDebate && (() => {
              const debate = debates.find((d) => d.id === selectedDebate);
              return debate ? (
                <div className="space-y-6 bg-slate-900 rounded-lg border border-slate-700 p-8">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">Topic</h3>
                    <p className="text-slate-200">{debate.topic}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-amber-400 mb-4">Arguments</h3>
                    <div className="space-y-4">
                      {debate.arguments?.map((arg, idx) => (
                        <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-200 capitalize">{arg.ai_role}</span>
                            <div className="text-xs bg-slate-700 px-2 py-1 rounded">
                              Strength: {Math.round(arg.strength * 100)}%
                            </div>
                          </div>
                          <p className="text-slate-400 text-sm">{arg.argument}</p>
                          {arg.counter_arguments && arg.counter_arguments.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-700">
                              <p className="text-xs font-medium text-slate-400 mb-2">Counter Arguments:</p>
                              {arg.counter_arguments.map((counter, idx) => (
                                <p key={idx} className="text-xs text-slate-500 mb-1">• {counter}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-400">Agreement Score</span>
                        <div className="text-2xl font-bold text-amber-400 mt-1">
                          {Math.round(debate.agreement_score * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Conflict Intensity</span>
                        <div className={`text-2xl font-bold mt-1 ${debate.conflict_intensity > 0.6 ? 'text-red-400' : debate.conflict_intensity > 0.3 ? 'text-amber-400' : 'text-green-400'}`}>
                          {Math.round(debate.conflict_intensity * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                  {debate.conflict_intensity > 0.6 && (
                    <div className="mt-4 p-3 bg-red-950 border border-red-800 rounded-lg">
                      <p className="text-sm text-red-300 font-medium">High conflict detected — consider reviewing minority opinions and counterarguments below.</p>
                    </div>
                  )}

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-amber-300 mb-3">Minority Opinions</h4>
                    {debate.minority_opinions && debate.minority_opinions.length > 0 ? (
                      <div className="space-y-3">
                        {debate.minority_opinions.map((m, idx) => (
                          <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-slate-200 capitalize">{m.ai_role}</span>
                              <div className="text-xs bg-slate-700 px-2 py-1 rounded">Strength: {Math.round((m.strength || 0) * 100)}%</div>
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{m.argument}</p>
                            {m.counter_arguments && m.counter_arguments.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-slate-700 text-xs text-slate-500">
                                <p className="font-medium text-slate-400 mb-1">Counter Arguments</p>
                                {m.counter_arguments.map((c, i) => (
                                  <p key={i}>• {c}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400">No strong minority opinions found.</div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
