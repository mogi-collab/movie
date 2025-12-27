import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Project } from '../types';
import { LogOut, Plus, Trash2 } from 'lucide-react';

interface DashboardPageProps {
  onProjectSelect: (projectId: string) => void;
}

export default function DashboardPage({ onProjectSelect }: DashboardPageProps) {
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Health check UI state
  const [healthData, setHealthData] = useState<any | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkHealth = async () => {
    try {
      setCheckingHealth(true);
      setError(null);
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      setHealthData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setHealthData(null);
    } finally {
      setCheckingHealth(false);
    }
  };

  const loadProjects = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;
      setProjects(data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectTitle.trim()) return;

    try {
      setCreating(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            title: newProjectTitle,
            description: newProjectDescription,
            status: 'concept',
            current_phase: 1,
          },
        ])
        .select()
        .single();

      if (createError) throw createError;

      setProjects([data, ...projects]);
      setShowCreateModal(false);
      setNewProjectTitle('');
      setNewProjectDescription('');
      onProjectSelect(data.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (deleteError) throw deleteError;
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      setError(message);
    }
  };

  const getPhaseProgress = (project: Project) => {
    const totalPhases = 16;
    const completedPhases = project.completed_phases?.length || 0;
    return Math.round((completedPhases / totalPhases) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900 text-green-200';
      case 'in-progress':
        return 'bg-blue-900 text-blue-200';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-50">Projects</h1>
            <p className="text-slate-400 mt-1">Manage your filmmaking projects</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <Plus className="w-5 h-5" />
              New Project
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-slate-50 hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-950 border border-red-800 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="mb-6 flex items-center gap-4">
          <div className="p-4 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 w-full flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-400">API Health</div>
              <div className="text-xs text-slate-500">{healthData ? `${healthData.status} • ${new Date(healthData.timestamp).toLocaleString()}` : 'Unknown'}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={checkHealth} disabled={checkingHealth} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-60">
                {checkingHealth ? 'Checking...' : 'Check API Health'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 rounded-lg border border-slate-700">
            <p className="text-slate-400 text-lg mb-4">No projects yet. Create your first one to begin!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <Plus className="w-5 h-5" />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = getPhaseProgress(project);
              return (
                <div
                  key={project.id}
                  className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-slate-600 transition cursor-pointer group"
                  onClick={() => onProjectSelect(project.id)}
                >
                  <div className="p-6 group-hover:bg-slate-800 transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-50 mb-1">{project.title}</h3>
                        {project.description && <p className="text-sm text-slate-400">{project.description}</p>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProject(project.id);
                        }}
                        className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-400">Phase {project.current_phase}/16</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400">Progress</span>
                        <span className="text-xs font-medium text-slate-300">{progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-4">
                      Updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-xl border border-slate-700 p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-slate-50 mb-6">Create New Project</h2>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Project Title</label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  placeholder="e.g., Independent Sci-Fi Drama"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Description (optional)</label>
                <textarea
                  value={newProjectDescription}
                  onChange={(e) => setNewProjectDescription(e.target.value)}
                  placeholder="Brief description of your project..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-50 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewProjectTitle('');
                    setNewProjectDescription('');
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-50 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newProjectTitle.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
