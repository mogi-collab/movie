import { useState } from 'react';
import { Idea } from '../../types';
import { Zap, Loader } from 'lucide-react';

interface Phase1ConceptProps {
  projectId: string;
}

const AI_ROLES = ['visionary', 'classic', 'emotional', 'realist', 'audience', 'producer'];

export default function Phase1Concept({ projectId }: Phase1ConceptProps) {
  const [generating, setGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateConcepts = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-concepts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate concepts');
      }

      const data = await response.json();
      setIdeas(data.ideas || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate concepts';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase 1: Idea & Concept Engine</h2>
        <p className="text-slate-400">Generate multiple creative concepts from six distinct AI perspectives</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
          <Zap className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Generate Your First Concept</h3>
          <p className="text-slate-400 mb-6">
            The AI will generate six unique concepts from different creative perspectives
          </p>
          <button
            onClick={handleGenerateConcepts}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
          >
            {generating && <Loader className="w-5 h-5 animate-spin" />}
            {generating ? 'Generating Concepts...' : 'Generate Concepts'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-50">AI Perspectives</h3>
            <div className="space-y-2">
              {AI_ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    const idea = ideas.find((i) => i.ai_role === role as any);
                    setSelectedIdea(idea?.id || null);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                    selectedIdea === ideas.find((i) => i.ai_role === role as any)?.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="capitalize">{role}</div>
                  <p className="text-xs text-slate-400 mt-1">{getAIRoleDescription(role)}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedIdea ? (
              (() => {
                const idea = ideas.find((i) => i.id === selectedIdea);
                return idea ? (
                  <div className="space-y-6 bg-slate-900 rounded-lg border border-slate-700 p-8">
                    <div>
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">One-Liner</h3>
                      <p className="text-lg font-semibold text-slate-50">{idea.one_liner || 'N/A'}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Logline</h3>
                      <p className="text-slate-300">{idea.logline || 'N/A'}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Short Synopsis</h3>
                      <p className="text-slate-300">{idea.short_synopsis || 'N/A'}</p>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Moral Question</h3>
                      <p className="text-slate-300">{idea.moral_question || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                      <div>
                        <span className="text-xs text-slate-400">Originality Score</span>
                        <div className="text-2xl font-bold text-blue-400 mt-1">
                          {idea.originality_score ? Math.round(idea.originality_score * 100) : 'N/A'}%
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Philosophy Depth</span>
                        <div className="text-2xl font-bold text-blue-400 mt-1">
                          {idea.philosophy_depth ? Math.round(idea.philosophy_depth * 10) : 'N/A'}/10
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()
            ) : (
              <div className="text-center py-12 text-slate-400">Select a perspective to view concept</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function getAIRoleDescription(role: string): string {
  const descriptions: Record<string, string> = {
    visionary: 'Bold, experimental, symbolic',
    classic: 'Structure, rules, proven storytelling',
    emotional: 'Feelings, empathy, psychology',
    realist: 'Logic, motivation, believability',
    audience: 'Engagement, drop-off risk',
    producer: 'Practicality, narrative economy',
  };
  return descriptions[role] || '';
}
