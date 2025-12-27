import React from 'react';
import { Info } from 'lucide-react';

interface PhaseComingSoonProps {
  phase: number;
  title: string;
  description: string;
}

const phaseDescriptions: Record<number, string> = {
  5: 'Create detailed character profiles with arcs, backstories, desires, fears, and relationship dynamics for every character.',
  6: 'Design story structure using 3-Act, Hero\'s Journey, or non-linear frameworks with scene dependency validation.',
  7: 'Generate industry-standard screenplay with proper formatting, sluglines, actions, and dialogue.',
  8: 'Develop dialogue with emotion-mapped styling, subtext, and naturalness scoring for authentic character voices.',
  9: 'Track emotional journey throughout the story with tension curves and empathy scoring.',
  10: 'Analyze each scene for effectiveness, character goals, obstacles, and emotional beats.',
  11: 'Apply genre-specific intelligence ensuring genre rules and audience expectations are met.',
  12: 'Plan visual composition, camera movements, color palettes, and sound design for cinematic impact.',
  13: 'Simulate audience reactions across demographics to predict engagement and drop-off points.',
  14: 'Generate multiple ending variants optimized for different audiences and platforms.',
  15: 'Fine-tune sliders to adjust emotion, tension, pacing, and visual symbolism in real-time.',
  16: 'Learn from director preferences to improve suggestions and recommendations over time.',
};

export default function PhaseComingSoon({ phase, title, description }: PhaseComingSoonProps) {
  const phaseDesc = phaseDescriptions[phase] || description;

  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  function validateEmail(e: string) {
    return /\S+@\S+\.\S+/.test(e);
  }

  async function submitRequest() {
    if (!validateEmail(email)) {
      setErrorMsg('Please enter a valid email.');
      return;
    }

    try {
      setStatus('loading');
      setErrorMsg(null);
      const res = await fetch('/functions/v1/request-phase-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, email, notes }),
      });

      if (!res.ok) throw new Error('Request failed');

      setStatus('success');
      setTimeout(() => { setOpen(false); setStatus('idle'); setEmail(''); setNotes(''); }, 1200);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'An error occurred');
    }
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h2 className="text-3xl font-bold text-slate-50 mb-2">Phase {phase}: {title}</h2>
        <p className="text-slate-400">{phaseDesc}</p>
      </div>

      <div className="bg-slate-900 rounded-lg border border-slate-700 p-12 text-center">
        <Info className="w-12 h-12 text-slate-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-50 mb-2">Coming Soon</h3>
        <p className="text-slate-400 mb-6 max-w-md mx-auto">
          This phase is under development. Focus on completing earlier phases first to unlock this powerful feature.
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-300">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            Estimated: Q1 2024
          </div>

          <button className="ml-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white" onClick={() => setOpen(true)}>
            Request Early Access
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">What You'll Get</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Advanced AI-generated analysis and suggestions</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Detailed visualizations and metrics</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Multi-format export options</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Real-time collaborative features</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-slate-50 mb-4">How to Prepare</h3>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Complete the earlier phases fully</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Refine your director inputs for accuracy</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Adjust control sliders to your preference</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-400 font-bold">•</span>
              <span>Review generated concepts and outlines</span>
            </li>
          </ul>
        </div>
      </div>

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="relative bg-slate-900 rounded-lg border border-slate-700 p-6 w-full max-w-md z-10">
            <h4 className="text-lg font-semibold text-slate-50 mb-4">Request Early Access - Phase {phase}</h4>
            <label className="block text-slate-300 text-sm mb-2">Email</label>
            <input className="w-full mb-3 p-2 rounded bg-slate-800 text-slate-50" value={email} onChange={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="you@example.com" />
            <label className="block text-slate-300 text-sm mb-2">Notes (optional)</label>
            <textarea className="w-full mb-3 p-2 rounded bg-slate-800 text-slate-50" value={notes} onChange={(e) => setNotes((e.target as HTMLTextAreaElement).value)} placeholder="Tell us what you'd like to see" />

            {errorMsg && <p className="text-sm text-red-400 mb-2">{errorMsg}</p>}
            {status === 'success' && <p className="text-sm text-green-400 mb-2">Request submitted — we will email you when the beta is available.</p>}

            <div className="flex items-center justify-end gap-2">
              <button className="px-3 py-1 rounded bg-slate-700 text-sm text-slate-200" onClick={() => setOpen(false)} disabled={status === 'loading'}>Cancel</button>
              <button className="px-3 py-1 rounded bg-blue-600 text-sm text-white" onClick={submitRequest} disabled={status === 'loading'}>
                {status === 'loading' ? 'Sending…' : 'Request Access'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
