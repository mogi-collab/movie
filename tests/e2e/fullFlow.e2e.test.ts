/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runGenerateConceptsForProject } from '../../supabase/functions/generate-concepts/index.ts';
import { runGenerateOutlinesForProject } from '../../supabase/functions/generate-stories/index.ts';
import { runGenerateDebatesForProject } from '../../supabase/functions/generate-debates/index.ts';
import { runGenerateScriptsForProject } from '../../supabase/functions/generate-scripts/index.ts';
import { runExportScriptPdf } from '../../supabase/functions/export-script-pdf/index.ts';

vi.mock('../../supabase/functions/_shared/aiClient.ts', () => {
  return {
    callAnthropicWithRetry: vi.fn(async (system: string, user: string) => {
      // crude heuristics to return appropriate JSON strings depending on prompt
      if (/Generate a compelling film concept/.test(user) || /One-Liner/.test(user)) {
        return JSON.stringify({ one_liner: 'A small-town secret unravels a family.', logline: 'A logline', short_synopsis: 'Short synopsis', hook_moment: 'Hook', moral_question: 'Is truth worth pain?', theme_conflict: {}, originality_score: 0.6, philosophy_depth: 0.5 });
      }
      if (/Create a three-act outline/.test(user) || /act_one/.test(user)) {
        return JSON.stringify({ act_one: { title: 'Act I', scenes: [{ number: 1, title: 'Opening', description: 'setup' }] }, act_two: { title: 'Act II', scenes: [{ number: 2, title: 'Confrontation', description: 'rising' }] }, act_three: { title: 'Act III', scenes: [{ number: 3, title: 'Resolution', description: 'finish' }] }, emotional_arc: [{ act: 1, emotion: 'curiosity', description: '' }], endings: [{ type: 'bittersweet', description: 'end', emotional_impact: 'satisfying', audience_satisfaction: 0.8 }] });
      }
      if (/Produce an argument/.test(user) || /argument/.test(user)) {
        return JSON.stringify({ argument: 'We should focus on character motivation', strength: 0.8 });
      }
      // fallback
      return JSON.stringify({});
    }),
    extractJson: (s: string) => {
      const m = s.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('No JSON');
      return JSON.parse(m[0]);
    },
  };
});

describe('e2e: full pipeline (concepts -> outlines -> debates -> scripts -> export)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // provide a Deno.env shim backed by process.env so functions expecting Deno.env.get() work in Node tests
    (global as any).Deno = { env: { get: (k: string) => (process.env as any)[k] } } as any;
    process.env.VITE_SUPABASE_URL = 'https://supabase.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    process.env.ANTHROPIC_API_KEY = 'fake';

    // in-memory DB
    const db: any = { script_versions: {}, scripts: {}, exports: {} };

    let nextScriptId = 1;
    let nextVersionId = 1;
    let nextExportId = 1;

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      const u = String(url);

      // script_versions query
      if (u.includes('/rest/v1/script_versions') && u.includes('script_id=eq')) {
        const mVer = u.match(/script_id=eq\.([^&]+)/);
        const mNum = u.match(/version_number=eq\.?(\d+)/);
        const script_id = mVer ? mVer[1] : null;
        const version_number = mNum ? Number(mNum[1]) : undefined;
        const found = Object.values(db.script_versions).filter((v: any) => v.script_id === script_id && (!version_number || v.version_number === version_number));
        return { ok: true, json: async () => found } as any;
      }

      // POST scripts
      if (u.endsWith('/rest/v1/scripts') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        const id = `s${nextScriptId++}`;
        db.scripts[id] = { id, ...body };
        return { ok: true, json: async () => ({ id }) } as any;
      }

      // POST script_versions
      if (u.endsWith('/rest/v1/script_versions') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        const id = `v${nextVersionId++}`;
        db.script_versions[id] = { id, ...body };
        return { ok: true, json: async () => ({ id }) } as any;
      }

      // storage upload
      if (u.includes('/storage/v1/object/')) {
        return { ok: true, text: async () => 'OK' } as any;
      }

      // exports POST
      if (u.endsWith('/rest/v1/exports') && opts?.method === 'POST') {
        const body = JSON.parse(opts.body);
        const id = `exp-${nextExportId++}`;
        db.exports[id] = { id, ...body };
        return { ok: true, json: async () => ({ id }) } as any;
      }

      // if calling Anthropic (generate-scripts does this), return content with JSON script
      if (u.includes('api.anthropic.com')) {
        return { ok: true, json: async () => ({ content: [{ text: JSON.stringify({ title: 'Script Title', full_content: 'FAKE CONTENT', scene_count: 5, word_count: 1200, emotional_coherence: 0.6, logical_continuity: 0.7, audience_tolerance: 0.5, overall_score: 0.75 }) }] }) } as any;
      }

      // default
      return { ok: true, json: async () => [] } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('runs full pipeline without throwing and produces exports', async () => {
    const directorInputs = { core_theme: 'Family secret', genre: ['drama'], platform: 'theatre' } as any;

    const concepts = await runGenerateConceptsForProject('proj1', directorInputs);
    expect(concepts).toBeInstanceOf(Array);
    expect(concepts.length).toBe(6);

    const outlines = await runGenerateOutlinesForProject('proj1', directorInputs, null as any);
    expect(outlines).toBeInstanceOf(Array);
    expect(outlines.length).toBe(6);

    const debates = await runGenerateDebatesForProject('proj1', outlines as any);
    expect(debates).toBeInstanceOf(Array);

    const scripts = await runGenerateScriptsForProject('proj1', debates as any, outlines as any);
    expect(scripts).toBeInstanceOf(Array);
    expect(scripts.length).toBe(3);

    // attempt export for the first generated script (script id might be null if storage returned no id - ensure no throw)
    const first = scripts[0];
    const exported = await runExportScriptPdf('proj1', first.id || 's1', 1);
    expect(exported).toHaveProperty('artifact_url');
  });
});
