import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Idea, Debate, Script } from '../types';
import { Download, FileText, BarChart3 } from 'lucide-react';

interface OutputDashboardProps {
  projectId: string;
}

export default function OutputDashboard({ projectId }: OutputDashboardProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [characters, setCharacters] = useState<any[]>([]);
  const [coherenceScore, setCoherenceScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'concepts' | 'debates' | 'scripts'>('overview');

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [ideasData, debatesData, scriptsData, charactersData, outlinesData] = await Promise.all([
        supabase.from('ideas').select('*').eq('project_id', projectId),
        supabase.from('debates').select('*').eq('project_id', projectId),
        supabase.from('scripts').select('*').eq('project_id', projectId),
        supabase.from('characters').select('*').eq('project_id', projectId),
        supabase.from('story_outlines').select('*').eq('project_id', projectId),
      ]);

      if (!ideasData.error) setIdeas(ideasData.data || []);
      if (!debatesData.error) setDebates(debatesData.data || []);
      if (!scriptsData.error) setScripts(scriptsData.data || []);
      if (!charactersData.error) setCharacters(charactersData.data || []);
      // Compute structure coherence if we have an outline
      try {
        const outline = (outlinesData.data || [])[0];
        if (outline) {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-structure-check`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ outline }),
          });
          if (res.ok) {
            const json = await res.json();
            setCoherenceScore(typeof json.coherence_score === 'number' ? Math.round(json.coherence_score * 100) : null);
          }
        }
      } catch (e) {
        // ignore structure check failures
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    const report = {
      generated_at: new Date().toISOString(),
      project_id: projectId,
      concepts: ideas,
      debates: debates,
      scripts: scripts,
      characters: characters,
    };

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`);
    element.setAttribute('download', `director-report-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-50">Project Output</h2>
          <p className="text-slate-400 mt-1">Review and export your complete creative output</p>
        </div>
        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          <Download className="w-5 h-5" />
          Export Report
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-700">
        {(['overview', 'concepts', 'debates', 'scripts', 'characters'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              activeTab === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-300">Loading output data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-slate-400">Concepts Generated</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">{ideas.length}</div>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span className="text-sm text-slate-400">Debates Conducted</span>
                </div>
                <div className="text-3xl font-bold text-amber-400">{debates.length}</div>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-green-400" />
                  <span className="text-sm text-slate-400">Scripts Generated</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{scripts.length}</div>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-sm text-slate-400">AI Perspectives</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">6</div>
              </div>

              <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-5 h-5 text-rose-400" />
                  <span className="text-sm text-slate-400">Structure Coherence</span>
                </div>
                <div className="text-3xl font-bold text-rose-400">{coherenceScore !== null ? `${coherenceScore}%` : '—'}</div>
                {coherenceScore !== null && (
                  <div className="mt-3 w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500" style={{ width: `${coherenceScore}%` }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'concepts' && (
            <div className="space-y-4">
              {ideas.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No concepts generated yet</div>
              ) : (
                ideas.map((idea) => (
                  <div key={idea.id} className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-50 capitalize">{idea.ai_role}</h3>
                        <p className="text-slate-300 mt-2">{idea.one_liner}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-900 text-blue-200 rounded text-sm">
                        {Math.round((idea.originality_score || 0) * 100)}% Original
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{idea.logline}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'debates' && (
            <div className="space-y-4">
              {debates.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No debates conducted yet</div>
              ) : (
                debates.map((debate) => (
                  <div key={debate.id} className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                    <h3 className="text-lg font-semibold text-slate-50 mb-4">{debate.topic}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-slate-400">Agreement</span>
                        <div className="text-2xl font-bold text-green-400 mt-1">
                          {Math.round(debate.agreement_score * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400">Conflict Intensity</span>
                        <div className="text-2xl font-bold text-red-400 mt-1">
                          <span className={`${debate.conflict_intensity > 0.6 ? 'text-red-400' : debate.conflict_intensity > 0.3 ? 'text-amber-400' : 'text-green-400'} font-bold`}>{Math.round(debate.conflict_intensity * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'scripts' && (
            <div className="space-y-4">
              {scripts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No scripts generated yet</div>
              ) : (
                scripts.map((script) => (
                  <div key={script.id} className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-50">{script.title || script.script_type}</h3>
                        <p className="text-sm text-slate-400 mt-1 capitalize">{script.script_type} • {script.word_count?.toLocaleString()} words</p>
                      </div>
                      <span className="px-3 py-1 bg-green-900 text-green-200 rounded text-sm">
                        {Math.round(script.overall_score * 100)}% Quality
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Coherence</span>
                        <div className="font-bold text-slate-200 mt-1">
                          {Math.round(script.emotional_coherence * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Continuity</span>
                        <div className="font-bold text-slate-200 mt-1">
                          {Math.round(script.logical_continuity * 100)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Tolerance</span>
                        <div className="font-bold text-slate-200 mt-1">
                          {Math.round(script.audience_tolerance * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="space-y-4">
              {characters.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No characters generated yet</div>
              ) : (
                characters.map((c) => (
                  <div key={c.id} className="bg-slate-900 rounded-lg border border-slate-700 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-50 mb-2">{c.name}</h3>
                        <p className="text-sm text-slate-400">{c.role} • {c.arc_type}</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-900 text-indigo-200 rounded text-sm">Consistency: {Math.round((c.consistency_score || 0) * 100)}%</span>
                    </div>
                    <p className="text-sm text-slate-400">{c.backstory}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
