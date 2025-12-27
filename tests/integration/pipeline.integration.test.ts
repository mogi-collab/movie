import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runGenerateConceptsForProject } from '../../supabase/functions/generate-concepts/index.ts';

describe('Pipeline runner (integration)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).Deno = { env: { get: (k: string) => (process.env as any)[k] } } as any;
    process.env.SUPABASE_URL = 'https://supabase.test';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    process.env.ANTHROPIC_API_KEY = 'fake';

    const db: any = { pipeline_runs: {}, ideas: {}, story_outlines: {}, debates: {}, scripts: {}, characters: {} };
    let nextId = 1;

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      const u = String(url);

      // pipeline_runs create
      if (u.endsWith('/rest/v1/pipeline_runs') && opts?.method === 'POST') {
        const id = `pr-${nextId++}`;
        db.pipeline_runs[id] = { id, ...JSON.parse(opts.body) };
        return { ok: true, json: async () => ([db.pipeline_runs[id]]) } as any;
      }

      // pipeline_runs patch
      if (u.includes('/rest/v1/pipeline_runs?id=eq.')) {
        const id = u.split('eq.')[1];
        const body = JSON.parse(opts.body);
        db.pipeline_runs[id] = { ...db.pipeline_runs[id], ...body };
        return { ok: true, json: async () => ([db.pipeline_runs[id]]) } as any;
      }

      // generate-concepts endpoint
      if (u.endsWith('/functions/v1/generate-concepts')) {
        return { ok: true, json: async () => ({ ideas: [{ ai_role: 'visionary', one_liner: 'A test' }] }) } as any;
      }

      // generate-stories endpoint
      if (u.endsWith('/functions/v1/generate-stories')) {
        return { ok: true, json: async () => ({ outlines: [{ ai_role: 'visionary', act_one: { title: 'Act I' } }] }) } as any;
      }

      // generate-debates
      if (u.endsWith('/functions/v1/generate-debates')) {
        return { ok: true, json: async () => ({ debates: [{ topic: 'Test debate' }] }) } as any;
      }

      // generate-scripts
      if (u.endsWith('/functions/v1/generate-scripts')) {
        return { ok: true, json: async () => ({ scripts: [{ id: 's1', title: 'Script A' }] }) } as any;
      }

      // generate-characters
      if (u.endsWith('/functions/v1/generate-characters')) {
        return { ok: true, json: async () => ({ characters: [{ name: 'Hero' }] }) } as any;
      }

      // default
      return { ok: true, json: async () => ([]) } as any;
    }) as any;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.ANTHROPIC_API_KEY;
  });

  it('runs the pipeline and tracks completed phases', async () => {
    // call the pipeline function handler directly so we can exercise the runner logic
    const { runPipelineHandler } = await import('../../supabase/functions/run-pipeline/index.ts');
    const req = new Request('https://supabase.test/functions/v1/run-pipeline', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId: 'proj1' }) });
    const res = await runPipelineHandler(req);
    const json = await res.json();
    expect(res.ok).toBe(true);
    expect(json.status).toBe('succeeded');
    expect(json.completed).toBeInstanceOf(Array);
    expect(json.completed.length).toBeGreaterThan(0);
  });
});
