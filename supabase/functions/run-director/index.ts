// Lightweight director orchestrator (stub)
// Accepts POST { projectId, phases: [{ id: number, input: any }] }
// For now it routes to simple helper functions and logs an execution trace.

import { serve } from 'std/server';
import { generateWithGemini } from '../../../src/lib/ai/gemini';
import { generateWithHF } from '../../../src/lib/ai/hf';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const body = await req.json().catch(() => ({}));
  const phases = body.phases || [];
  const trace: Array<any> = [];

  for (const p of phases) {
    const id = p.id;
    const input = p.input || '';

    try {
      // Echo provided options for testing / debugging
      const options = body.options || {};

      // Simple mapping demo: phases 1–6 use Gemini, fallback to HF
      if (id >= 1 && id <= 6) {
        const out = await generateWithGemini(String(input));
        trace.push({ phase: id, provider: 'gemini', options, output: out });
      } else {
        const out = await generateWithHF(undefined, String(input));
        trace.push({ phase: id, provider: 'hf', options, output: out });
      }
    } catch (err: any) {
      trace.push({ phase: id, error: String(err), options: body.options || {} });
    }
  }

  return new Response(JSON.stringify({ trace }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
