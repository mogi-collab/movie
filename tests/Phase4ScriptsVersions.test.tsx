/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Phase4Scripts from '../src/components/phases/Phase4Scripts';

describe('Phase4Scripts versions preview', () => {
  it('loads versions and shows preview modal with diff', async () => {
    // stub fetch for generate-scripts and script_versions
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (url: string, opts?: any) => {
      if (typeof url === 'string' && url.includes('/functions/v1/generate-scripts')) {
        return {
          ok: true,
          json: async () => ({ scripts: [{
            id: 'script1',
            title: 'Test Script',
            script_type: 'safe',
            word_count: 4500,
            scene_count: 12,
            emotional_coherence: 0.8,
            logical_continuity: 0.9,
            audience_tolerance: 0.7,
            overall_score: 0.85,
            full_content: 'Line1\nLine2\nLine3',
          }] }),
        } as any;
      }

      if (typeof url === 'string' && url.includes('/rest/v1/script_versions')) {
        return {
          ok: true,
          json: async () => ([{ id: 'v1', version_number: 1, content: 'Line1\nLineX\nLine3', created_at: new Date().toISOString() }]),
        } as any;
      }

      return { ok: true, json: async () => ({}) } as any;
    });

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(Phase4Scripts, { projectId: 'proj1' } as any));
    });

    // Click generate
    const genBtn = container.querySelector('button') as HTMLButtonElement;
    expect(genBtn).toBeTruthy();

    await act(async () => {
      genBtn.click();
      // wait for the script button to appear
      const start = Date.now();
      while (Date.now() - start < 1000) {
        if (container.textContent?.includes('Test Script')) break;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 10));
      }
    });

    const scriptBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Safe/Commercial')) as HTMLButtonElement;
    expect(scriptBtn).toBeTruthy();

    await act(async () => {
      scriptBtn.click();
      // wait for Load Versions button
      const start = Date.now();
      while (Date.now() - start < 1000) {
        if (container.textContent?.includes('Load Versions')) break;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 10));
      }
    });

    const loadVersionsBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Load Versions')) as HTMLButtonElement;
    expect(loadVersionsBtn).toBeTruthy();

    // Test loading state by stubbing fetch to delay
    const originalFetch2 = global.fetch;
    global.fetch = vi.fn(async (url: string, opts?: any) => {
      if (typeof url === 'string' && url.includes('/rest/v1/script_versions')) {
        // delay to simulate loading
        await new Promise((r) => setTimeout(r, 300));
        return { ok: true, json: async () => ([{ id: 'v1', version_number: 1, content: 'Line1\nLineX\nLine3', created_at: new Date().toISOString() }]) } as any;
      }
      return originalFetch2(url, opts);
    }) as any;

    await act(async () => {
      loadVersionsBtn.click();
    });

    // the Load Versions button should be disabled while fetching
    expect(loadVersionsBtn.disabled).toBe(true);

    // restore fetch to original behavior for the rest of the test
    global.fetch = originalFetch2;

    await act(async () => {
      // wait for version list
      const start = Date.now();
      while (Date.now() - start < 1000) {
        if (container.textContent?.includes('Version 1')) break;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 10));
      }
    });

    const previewBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Preview')) as HTMLButtonElement;
    expect(previewBtn).toBeTruthy();

    await act(async () => {
      previewBtn.click();
      // wait for modal
      const start = Date.now();
      while (Date.now() - start < 1000) {
        if (container.textContent?.includes('Preview - Version 1')) break;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 10));
      }
    });

    expect(container.textContent).toContain('Preview - Version 1');
    expect(container.textContent).toContain('LineX');
    // diff should show removed and added lines markers
    expect(container.innerHTML).toMatch(/text-rose-400|text-emerald-400/);

    // cleanup
    root.unmount();
    global.fetch = originalFetch;
  });
});
