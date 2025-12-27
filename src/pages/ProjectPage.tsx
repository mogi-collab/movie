import { useState } from 'react';
import { useProject } from '../hooks/useProject';
import { ArrowLeft } from 'lucide-react';
import { Phase1Concept, Phase2Story, Phase3Debate, Phase4Scripts, Phase5Characters, PhaseSetup } from '../components/phases';

interface ProjectPageProps {
  projectId: string;
  onBack: () => void;
}

type CurrentPhase = 'setup' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

const phaseLabels: Record<CurrentPhase, string> = {
  setup: 'Project Setup',
  1: 'Concept Engine',
  2: 'Story Generation',
  3: 'AI Debate',
  4: 'Script Convergence',
  5: 'Character Design',
  6: 'Story Structure',
  7: 'Screenplay',
  8: 'Dialogue',
  9: 'Emotion & Tension',
  10: 'Scene Intelligence',
  11: 'Genre Intelligence',
  12: 'Visual & Sound',
  13: 'Audience Simulation',
  14: 'Adaptive Endings',
  15: 'Control & Adjustment',
  16: 'Learning System',
};

export default function ProjectPage({ projectId, onBack }: ProjectPageProps) {
  const { project, directorInputs, sliders, loading } = useProject(projectId);
  const [currentPhase, setCurrentPhase] = useState<CurrentPhase>('setup');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-200">Loading project...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-50 transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-50">{project?.title}</h1>
              <p className="text-sm text-slate-400">Phase {project?.current_phase} • {phaseLabels[currentPhase]}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-slate-900 border-r border-slate-700 min-h-[calc(100vh-80px)]">
          <nav className="p-4 space-y-2">
            <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Workflow Phases
            </div>

            <button
              onClick={() => setCurrentPhase('setup')}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                currentPhase === 'setup'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50'
              }`}
            >
              Setup
            </button>

            {Array.from({ length: 16 }, (_, i) => (i + 1) as const).map((phase) => (
              <button
                key={phase}
                onClick={() => setCurrentPhase(phase)}
                className={`w-full text-left px-4 py-3 rounded-lg font-medium transition ${
                  currentPhase === phase
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Phase {phase}</span>
                  {project?.completed_phases?.includes(phase) && (
                    <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Done</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{phaseLabels[phase as CurrentPhase]}</p>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-8 py-8">
            {currentPhase === 'setup' && <PhaseSetup projectId={projectId} />}
            {currentPhase === 1 && directorInputs && <Phase1Concept projectId={projectId} />}
            {currentPhase === 2 && directorInputs && <Phase2Story projectId={projectId} />}
            {currentPhase === 3 && directorInputs && <Phase3Debate projectId={projectId} />}
            {currentPhase === 4 && directorInputs && <Phase4Scripts projectId={projectId} />}
            {currentPhase === 5 && directorInputs && <Phase5Characters projectId={projectId} />}
            {currentPhase > 5 && currentPhase <= 16 && (
              <div className="bg-slate-900 rounded-lg border border-slate-700 p-8 text-center">
                <p className="text-slate-400">Phase {currentPhase} - {phaseLabels[currentPhase]}</p>
                <p className="text-slate-500 mt-2">Coming soon...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
