import { useState, useEffect } from 'react';
import { Character } from '../../types';
import { Loader, User, BookOpen, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Phase5CharactersProps {
  projectId: string;
}

export default function Phase5Characters({ projectId }: Phase5CharactersProps) {
  const [generating, setGenerating] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [projectId]);

  const loadCharacters = async () => {
    try {
      const res = await supabase.from('characters').select('*').eq('project_id', projectId);
      if (!res.error) setCharacters(res.data || []);
    } catch (err) {
      // ignore
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-characters`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, numberOfCharacters: 3 }),
      });

      if (!response.ok) throw new Error('Failed to generate characters');
      const data = await response.json();
      setCharacters(data.characters || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate characters';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase 5: Character Design</h2>
        <p className="text-slate-400">Generate a Character Bible for your project</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="bg-slate-900 rounded-lg border border-slate-700 p-8 text-center">
        <BookOpen className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-50 mb-2">Character Bible</h3>
        <p className="text-slate-400 mb-6">Create a set of core characters and their arcs</p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
        >
          {generating && <Loader className="w-5 h-5 animate-spin" />}
          {generating ? 'Generating...' : 'Generate Characters'}
        </button>
      </div>

      {characters.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {characters.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  selected === c.id ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-slate-300" />
                  <div>
                    <div className="font-semibold capitalize">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.role}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selected && (() => {
              const char = characters.find((x) => x.id === selected);
              return char ? (
                <div className="space-y-4 bg-slate-900 rounded-lg border border-slate-700 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-50">{char.name}</h3>
                      <div className="text-sm text-slate-400">{char.role} • {char.arc_type}</div>
                    </div>
                    <button className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition">
                      <Download className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm text-slate-300">Backstory</h4>
                      <p className="text-sm text-slate-200 mt-2">{char.backstory}</p>
                    </div>
                    <div>
                      <h4 className="text-sm text-slate-300">Desire & Fear</h4>
                      <p className="text-sm text-slate-200 mt-2">{char.desire} / {char.fear}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm text-slate-300">Flaws</h4>
                    <div className="text-sm text-slate-200 mt-2">Primary: {char.flaws?.primary} • Secondary: {char.flaws?.secondary}</div>
                  </div>

                  <div>
                    <h4 className="text-sm text-slate-300">Inner Voice</h4>
                    <p className="text-sm text-slate-200 mt-2">{char.inner_voice}</p>
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
