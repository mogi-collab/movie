import { useState } from 'react';
import { StoryOutline } from '../../types';
import { Loader, BookOpen } from 'lucide-react';

interface Phase2StoryProps {
  projectId: string;
}

export default function Phase2Story({ projectId }: Phase2StoryProps) {
  const [generating, setGenerating] = useState(false);
  const [outlines, setOutlines] = useState<StoryOutline[]>([]);
  const [selectedRole, setSelectedRole] = useState<AIRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateOutlines = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-stories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) throw new Error('Failed to generate stories');
      const data = await response.json();
      setOutlines(data.outlines || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate stories';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const AI_ROLES: AIRole[] = ['visionary', 'classic', 'emotional', 'realist', 'audience', 'producer'];

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase 2: Multi-AI Story Generation</h2>
        <p className="text-slate-400">Each AI role generates a complete story outline with three acts</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {outlines.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
          <BookOpen className="w-12 h-12 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Generate Story Outlines</h3>
          <p className="text-slate-400 mb-6">
            Each AI perspective will create a unique three-act structure for your story
          </p>
          <button
            onClick={handleGenerateOutlines}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            {generating && <Loader className="w-5 h-5 animate-spin" />}
            {generating ? 'Generating Outlines...' : 'Generate Story Outlines'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {AI_ROLES.map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  selectedRole === role
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="capitalize">{role}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedRole && (() => {
              const outline = outlines.find((o) => o.ai_role === selectedRole);
              return outline ? (
                <div className="space-y-6 bg-slate-900 rounded-lg border border-slate-700 p-8">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Act One</h3>
                    <p className="text-slate-300 mb-2">{outline.act_one?.title}</p>
                    <div className="space-y-2">
                      {outline.act_one?.scenes?.map((scene, idx) => (
                        <div key={idx} className="text-sm text-slate-400">
                          <span className="font-medium">Scene {scene.number}:</span> {scene.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Act Two</h3>
                    <p className="text-slate-300 mb-2">{outline.act_two?.title}</p>
                    <div className="space-y-2">
                      {outline.act_two?.scenes?.map((scene, idx) => (
                        <div key={idx} className="text-sm text-slate-400">
                          <span className="font-medium">Scene {scene.number}:</span> {scene.title}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-700 pt-6">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">Act Three</h3>
                    <p className="text-slate-300 mb-2">{outline.act_three?.title}</p>
                    <div className="space-y-2">
                      {outline.act_three?.scenes?.map((scene, idx) => (
                        <div key={idx} className="text-sm text-slate-400">
                          <span className="font-medium">Scene {scene.number}:</span> {scene.title}
                        </div>
                      ))}
                    </div>
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
