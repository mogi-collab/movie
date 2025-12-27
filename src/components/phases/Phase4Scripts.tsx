import { useState, useRef, useEffect } from 'react';
import { Script } from '../../types';
import { Loader, Film, Download } from 'lucide-react';

interface Phase4ScriptsProps {
  projectId: string;
}

interface Version {
  id: string;
  content?: string;
  version_number: number;
  created_at?: string;
}

export default function Phase4Scripts({ projectId }: Phase4ScriptsProps) {
  const [generating, setGenerating] = useState(false);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<string | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateScripts = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scripts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) throw new Error('Failed to generate scripts');
      const data = await response.json();
      setScripts(data.scripts || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate scripts';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (scriptId: string, versionNumber = 1) => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-script`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, scriptId, versionNumber, exportType: 'markdown' }),
      });

      if (!response.ok) throw new Error('Failed to export script');
      const data = await response.json();
      const artifact = data.export?.artifact_url;
      if (artifact) {
        // trigger download in browser (data URL)
        const a = document.createElement('a');
        a.href = artifact;
        a.download = `${scriptId}-v${versionNumber}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to export script';
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const loadVersions = async (scriptId: string) => {
    setVersionsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/script_versions?script_id=eq.${scriptId}&select=*`, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) {
        setError('Failed to load versions');
        return;
      }
      const data = await res.json();
      setVersions(data || []);
      setShowVersions(true);
    } catch {
      setError('Failed to load versions');
    } finally {
      setVersionsLoading(false);
    }
  };

  const handleRollback = async (versionId: string) => {
    setGenerating(true);
    setError(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/rollback-script`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, scriptId: selectedScript, versionId }),
      });
      if (!resp.ok) throw new Error('Rollback failed');
      // refresh versions
      if (selectedScript) await loadVersions(selectedScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setGenerating(false);
    }
  };

  const getScriptTypeLabel = (type: string) => {
    switch (type) {
      case 'safe':
        return 'Safe/Commercial';
      case 'bold':
        return 'Bold/Artistic';
      case 'experimental':
        return 'Experimental';
      default:
        return type;
    }
  };

  const getScriptTypeColor = (type: string) => {
    switch (type) {
      case 'safe':
        return 'bg-green-900 text-green-200';
      case 'bold':
        return 'bg-purple-900 text-purple-200';
      case 'experimental':
        return 'bg-pink-900 text-pink-200';
      default:
        return 'bg-slate-800 text-slate-200';
    }
  };

  // Preview & Diff state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewVersionNumber, setPreviewVersionNumber] = useState<number | null>(null);
  const [diffHtml, setDiffHtml] = useState<string | null>(null);

  // Accessibility refs
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const versionsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (previewOpen) {
      // focus close button for keyboard users
      try { closeBtnRef.current?.focus(); } catch { /* ignore */ }
      // add keydown listener to close on Escape
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setPreviewOpen(false);
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [previewOpen]);

  function computeWordDiffLine(aLine: string, bLine: string) {
    const aWords = (aLine || '').split(/(\s+)/);
    const bWords = (bLine || '').split(/(\s+)/);

    // build LCS DP table
    const dp: number[][] = Array.from({ length: aWords.length + 1 }, () => Array(bWords.length + 1).fill(0));
    for (let i = aWords.length - 1; i >= 0; i--) {
      for (let j = bWords.length - 1; j >= 0; j--) {
        if (aWords[i] === bWords[j]) dp[i][j] = 1 + dp[i + 1][j + 1];
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    // reconstruct
    let i = 0;
    let j = 0;
    const parts: string[] = [];
    while (i < aWords.length && j < bWords.length) {
      if (aWords[i] === bWords[j]) {
        parts.push(`<span>${escapeHtml(aWords[i])}</span>`);
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        parts.push(`<span class="text-rose-400">${escapeHtml(aWords[i])}</span>`);
        i++;
      } else {
        parts.push(`<span class="text-emerald-400">${escapeHtml(bWords[j])}</span>`);
        j++;
      }
    }
    while (i < aWords.length) { parts.push(`<span class="text-rose-400">${escapeHtml(aWords[i++])}</span>`); }
    while (j < bWords.length) { parts.push(`<span class="text-emerald-400">${escapeHtml(bWords[j++])}</span>`); }

    return parts.join('');
  }

  function computeDiffHtml(oldStr: string, newStr: string) {
    const a = (oldStr || '').split('\n');
    const b = (newStr || '').split('\n');
    const out: string[] = [];
    const max = Math.max(a.length, b.length);
    for (let i = 0; i < max; i++) {
      const la = a[i] ?? '';
      const lb = b[i] ?? '';
      if (la === lb) {
        out.push(`<div>${escapeHtml(la)}</div>`);
      } else {
        // compute word-level diff for lines
        if (la) out.push(`<div class="text-rose-400">- ${computeWordDiffLine(la, lb)}</div>`);
        if (lb) out.push(`<div class="text-emerald-400">+ ${computeWordDiffLine(la, lb)}</div>`);
      }
    }
    return out.join('<br/>');
  }

  function escapeHtml(s: string) {
    return (s || '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] as string));
  }

  const previewVersion = (v: Version) => {
    const script = scripts.find((s) => s.id === selectedScript);
    if (!script) return;
    // load content for version (if the versions array has content already, use it; otherwise fetch by id)
    const existing = versions.find((vv) => vv.id === v.id);
    const content = existing?.content ?? v.content ?? '';
    setPreviewContent(content);
    setPreviewVersionNumber(v.version_number);
    // compute diff between current script.full_content and version content
    setDiffHtml(computeDiffHtml(script.full_content || '', content));
    setPreviewOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase 4: Script Convergence</h2>
        <p className="text-slate-400">Synthesize AI perspectives into final Safe and Bold scripts</p>
      </div>

      {error && (
        <div className="flex gap-3 p-4 bg-red-950 border border-red-800 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {scripts.length === 0 ? (
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
          <Film className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Generate Scripts</h3>
          <p className="text-slate-400 mb-6">
            Converge all AI perspectives into two final script versions
          </p>
          <button
            onClick={handleGenerateScripts}
            disabled={generating}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 text-white font-medium rounded-lg transition"
          >
            {generating && <Loader className="w-5 h-5 animate-spin" />}
            {generating ? 'Generating Scripts...' : 'Generate Scripts'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            {scripts.map((script) => (
              <button
                key={script.id}
                onClick={() => setSelectedScript(script.id)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  selectedScript === script.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="capitalize font-semibold">{getScriptTypeLabel(script.script_type)}</div>
                    <div className="text-xs text-slate-400 mt-1">{script.word_count?.toLocaleString()} words</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedScript && (() => {
              const script = scripts.find((s) => s.id === selectedScript);
              return script ? (
                <div className="space-y-6 bg-slate-900 rounded-lg border border-slate-700 p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-slate-50">{script.title || script.script_type}</h3>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getScriptTypeColor(script.script_type)}`}>
                        {getScriptTypeLabel(script.script_type)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExport(script.id)}
                        disabled={generating}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm"
                      >
                        {generating ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        <span>Export</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 py-4 border-y border-slate-700">
                    <div>
                      <span className="text-xs text-slate-400">Scenes</span>
                      <div className="text-xl font-bold text-blue-400 mt-1">{script.scene_count}</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Word Count</span>
                      <div className="text-xl font-bold text-blue-400 mt-1">{Math.round(script.word_count / 1000)}K</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Coherence</span>
                      <div className="text-xl font-bold text-green-400 mt-1">{Math.round(script.emotional_coherence * 100)}%</div>
                    </div>
                    <div>
                      <span className="text-xs text-slate-400">Score</span>
                      <div className="text-xl font-bold text-yellow-400 mt-1">{Math.round(script.overall_score * 100)}%</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Emotional Coherence</span>
                        <span className="text-sm font-medium text-slate-300">{Math.round(script.emotional_coherence * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 transition-all"
                          style={{ width: `${script.emotional_coherence * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Logical Continuity</span>
                        <span className="text-sm font-medium text-slate-300">{Math.round(script.logical_continuity * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${script.logical_continuity * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-300">Audience Tolerance</span>
                        <span className="text-sm font-medium text-slate-300">{Math.round(script.audience_tolerance * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 transition-all"
                          style={{ width: `${script.audience_tolerance * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700 max-h-96 overflow-y-auto">
                    <h4 className="text-sm font-semibold text-slate-200 mb-3">Script Preview</h4>
                    <div className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">
                      {script.full_content?.substring(0, 1000)}...
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-200">Versions</h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => loadVersions(script.id)}
                          className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-200"
                          disabled={versionsLoading || generating}
                          aria-controls={`versions-${script.id}`}
                          aria-expanded={showVersions}
                        >
                          {versionsLoading ? 'Loading...' : 'Load Versions'}
                        </button>
                        <button
                          onClick={() => handleExport(script.id, 1)}
                          className="px-3 py-1 bg-blue-700 hover:bg-blue-800 rounded text-sm text-white"
                          disabled={generating}
                        >
                          Export PDF
                        </button>
                      </div>
                    </div>

                    {showVersions && (
                      <div className="mt-3 space-y-2">
                        {versionsLoading ? (
                          <div className="text-sm text-slate-400">Loading versions...</div>
                        ) : versions.length === 0 ? (
                          <div className="text-sm text-slate-400">No versions available</div>
                        ) : (
                          <div id={`versions-${script.id}`} ref={versionsContainerRef} role="list" aria-label={`Versions for ${script.title}`} className="space-y-2">
                            {versions.map((v) => (
                              <div key={v.id} className="flex items-center justify-between bg-slate-800 p-3 rounded" role="listitem">
                                <div>
                                  <div className="font-medium text-slate-200">Version {v.version_number}</div>
                                  <div className="text-xs text-slate-400">{new Date(v.created_at).toLocaleString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => handleExport(script.id, v.version_number)} className="px-3 py-1 bg-slate-700 rounded text-sm text-slate-200" disabled={generating || versionsLoading} aria-label={`Export version ${v.version_number}`}>Export</button>
                                  <button onClick={() => previewVersion(v)} onKeyDown={(e) => {
                                    if (e.key === 'Enter') previewVersion(v);
                                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                      const list = versionsContainerRef.current?.querySelectorAll('button[aria-label^="Preview version"]');
                                      if (!list) return;
                                      const arr = Array.from(list) as HTMLButtonElement[];
                                      const targetEl = (e.currentTarget as HTMLElement) || (e.target as HTMLElement);
                                      const idxNow = arr.findIndex((el) => el === targetEl);
                                      if (idxNow === -1) return;
                                      const nextIdx = e.key === 'ArrowDown' ? Math.min(arr.length - 1, idxNow + 1) : Math.max(0, idxNow - 1);
                                      // schedule focus to the next tick for robustness in tests
                                      setTimeout(() => arr[nextIdx]?.focus(), 0);
                                    }
                                  }} className="px-3 py-1 bg-slate-700 rounded text-sm text-slate-200" disabled={generating || versionsLoading} aria-label={`Preview version ${v.version_number}`}>Preview</button>
                                  <button onClick={() => handleRollback(v.id)} className="px-3 py-1 bg-rose-600 rounded text-sm text-white" disabled={generating || versionsLoading} aria-label={`Rollback to version ${v.version_number}`}>Rollback</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Preview Modal */}
                    {previewOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" role="presentation">
                        <div className="w-full max-w-3xl bg-slate-900 rounded-lg border border-slate-700 p-6" role="dialog" aria-modal="true" aria-labelledby="preview-title" aria-live="polite">
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                              <h4 id="preview-title" className="text-lg font-semibold text-slate-50">Preview - Version {previewVersionNumber}</h4>
                              <div className="text-xs text-slate-400 mt-1">Compare with current script</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button ref={closeBtnRef} onClick={() => setPreviewOpen(false)} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 rounded text-sm text-slate-200" aria-label="Close preview">Close</button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h5 className="text-sm text-slate-300 mb-2">Version Content</h5>
                              <pre className="text-xs text-slate-400 whitespace-pre-wrap font-mono leading-relaxed p-2 bg-slate-800 rounded h-64 overflow-auto">{previewContent}</pre>
                            </div>
                            <div>
                              <h5 className="text-sm text-slate-300 mb-2">Diff</h5>
                              <div className="text-xs font-mono leading-relaxed p-2 bg-slate-800 rounded h-64 overflow-auto" dangerouslySetInnerHTML={{ __html: diffHtml || '' }} />
                            </div>
                          </div>
                        </div>
                      </div>
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
