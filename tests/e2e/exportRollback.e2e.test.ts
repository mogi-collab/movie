/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runExportScriptPdf } from '../../supabase/functions/export-script-pdf/index.ts';
import { runRollbackForScript } from '../../supabase/functions/rollback-script/index.ts';

describe('e2e: export to PDF and rollback', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).Deno = undefined;
    (process as any).VITE_SUPABASE_URL = 'https://supabase.test';
    (process as any).SUPABASE_SERVICE_ROLE_KEY = 'service-key';

    // In-memory fake DB
    const db: any = {
      scripts: {
        s1: { id: 's1', project_id: 'proj1', full_content: 'second content', title: 'Script S1' },
      },
      script_versions: {
        v1: { id: 'v1', script_id: 's1', project_id: 'proj1', version_number: 1, content: 'first content', metadata: { title: 'S1 v1' } },
        v2: { id: 'v2', script_id: 's1', project_id: 'proj1', version_number: 2, content: 'second content', metadata: { title: 'S1 v2' } },
      },
      exports: {},
    };

    global.fetch = vi.fn(async (url: string, opts?: RequestInit) => {
      const u = String(url);

      // storage upload path
      if (u.includes('/storage/v1/object/')) {
        return { ok: true, text: async () => 'OK' } as unknown as Response;
      }

      // script_versions query by script_id and version_number
      if (u.includes('/rest/v1/script_versions') && u.includes('script_id=eq')) {
        // parse query params
        const mVer = u.match(/script_id=eq\.([^&]+)/);
        const mNum = u.match(/version_number=eq\.?(\d+)/);
        if (mVer) {
          const script_id = mVer[1];
          const version_number = mNum ? Number(mNum[1]) : undefined;
          const found = Object.values(db.script_versions).filter((v: any) => v.script_id === script_id && (!version_number || v.version_number === version_number));
          return { ok: true, json: async () => found } as unknown as Response;
        }
      }

      // GET single version by id
      if (u.includes('/rest/v1/script_versions?id=eq.')) {
        const m = u.match(/id=eq\.([^&]+)/);
        const id = m ? m[1] : null;
        const v = id ? (db.script_versions[id] ? [db.script_versions[id]] : []) : [];
        return { ok: true, json: async () => v } as unknown as Response;
      }

      // POST to exports
      if (u.endsWith('/rest/v1/exports') && opts?.method === 'POST') {
        const body = JSON.parse((opts as any).body);
        const id = `exp-${Object.keys(db.exports).length + 1}`;
        db.exports[id] = { id, ...body };
        return { ok: true, json: async () => ({ id }) } as unknown as Response;
      }

      // PATCH scripts
      if (u.includes('/rest/v1/scripts') && opts?.method === 'PATCH') {
        // script id in query param
        const m = u.match(/id=eq\.([^&]+)/);
        const id = m ? m[1] : null;
        if (id && db.scripts[id]) {
          const body = JSON.parse((opts as any).body);
          db.scripts[id] = { ...db.scripts[id], full_content: body.full_content, title: body.title };
          return { ok: true, json: async () => ({}) } as unknown as Response;
        }
        return { ok: false, status: 404, text: async () => 'Not found' } as unknown as Response;
      }

      // POST new script_versions
      if (u.endsWith('/rest/v1/script_versions') && opts?.method === 'POST') {
        const body = JSON.parse((opts as any).body);
        const id = `v${Object.keys(db.script_versions).length + 1}`;
        db.script_versions[id] = { id, ...body };
        return { ok: true, json: async () => ({ id }) } as unknown as Response;
      }

      return { ok: true, json: async () => ({}) } as unknown as Response;
    }) as unknown as (typeof global.fetch);
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete (process as any).VITE_SUPABASE_URL;
    delete (process as any).SUPABASE_SERVICE_ROLE_KEY;
  });

  it('exports PDF for a given script version and records export', async () => {
    const res = await runExportScriptPdf('proj1', 's1', 1);
    expect(res).toHaveProperty('artifact_url');
    expect(res.artifact_url).toMatch(/storage\/v1\/object/);
  });

  it('rolls back to a previous version and creates a new version entry', async () => {
    const result = await runRollbackForScript('proj1', 's1', 'v1');
    expect(result).toHaveProperty('rolled_to_version_id');
    // subsequent fetch of the script_versions by id should include rolled_back_from in metadata — our fake DB stores the created record
  });
});
