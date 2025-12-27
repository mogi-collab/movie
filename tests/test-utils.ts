/* eslint-disable @typescript-eslint/no-explicit-any */
import { vi } from 'vitest';
import { supabase } from '../src/lib/supabase';
export function stubSupabaseWithOutline(outline?: any) {
  const originalFrom = (supabase as any).from;
  (supabase as any).from = (table: string) => ({
    select: () => ({
      eq: () =>
        Promise.resolve({
          data: table === 'story_outlines' ? (outline ? [outline] : []) : [],
          error: null,
        }),
    }),
  });

  return () => {
    (supabase as any).from = originalFrom;
  };
}

export function stubStructureCheckFetch(score: number) {
  const originalFetch = global.fetch;
  global.fetch = vi.fn(async (url: string) => {
    if (typeof url === 'string' && url.includes('/generate-structure-check')) {
      return { ok: true, json: async () => ({ coherence_score: score }) } as any;
    }
    return { ok: true, json: async () => ({}) } as any;
  });

  return () => {
    global.fetch = originalFetch;
  };
}

export function stubStructureCheckWithOutline(outline: any, score = 0.75) {
  const restoreSupabase = stubSupabaseWithOutline(outline);
  const restoreFetch = stubStructureCheckFetch(score);
  return () => {
    restoreSupabase();
    restoreFetch();
  };
}
