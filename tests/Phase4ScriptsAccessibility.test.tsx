/* eslint-disable @typescript-eslint/no-explicit-any */
/* @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import Phase4Scripts from '../src/components/phases/Phase4Scripts';

describe('Phase4Scripts accessibility', () => {
  it('modal closes on Escape and focuses close button on open', async () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/functions/v1/generate-scripts')) {
        return { ok: true, json: async () => ({ scripts: [{ id: 'script1', title: 'Test Script', script_type: 'safe', word_count: 10, scene_count: 1, emotional_coherence: 0.5, logical_continuity: 0.5, audience_tolerance: 0.5, overall_score: 0.5, full_content: 'Line1\nLine2' }] }) } as unknown as Response;
      }
      if (typeof url === 'string' && url.includes('/rest/v1/script_versions')) {
        return { ok: true, json: async () => ([{ id: 'v1', version_number: 1, content: 'Line1\nLineX', created_at: new Date().toISOString() }]) } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    }) as unknown as (typeof global.fetch);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(Phase4Scripts, { projectId: 'proj1' } as React.ComponentProps<typeof Phase4Scripts>));
    });

    const genBtn = container.querySelector('button') as HTMLButtonElement;
    await act(async () => { genBtn.click(); });

    // Click script and load versions
    const scriptBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Safe/Commercial')) as HTMLButtonElement;
    await act(async () => { scriptBtn.click(); });

    const loadBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Load Versions')) as HTMLButtonElement;
    await act(async () => { loadBtn.click(); });

    // Open preview
    const previewBtn = Array.from(container.querySelectorAll('button')).find((b) => b.getAttribute('aria-label')?.startsWith('Preview version')) as HTMLButtonElement;
    await act(async () => { previewBtn.click(); });

    // wait for close button to appear and be focused
    const start = Date.now();
    let closeBtn: HTMLButtonElement | null = null;
    while (Date.now() - start < 1000) {
      closeBtn = container.querySelector('button[aria-label="Close preview"]') as HTMLButtonElement | null;
      if (closeBtn && document.activeElement === closeBtn) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(closeBtn).toBeTruthy();
    expect(document.activeElement).toBe(closeBtn as HTMLButtonElement);

    // Press Escape to close
    await act(async () => {
      const e = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(e);
    });

    expect(container.textContent).not.toContain('Preview - Version 1');

    root.unmount();
    global.fetch = originalFetch;
  });

  it('load versions button has aria-controls and aria-expanded toggles', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ({ scripts: [{ id: 's1', title: 'T', script_type: 'safe', word_count: 1, scene_count: 1, emotional_coherence: 0.5, logical_continuity: 0.5, audience_tolerance: 0.5, overall_score: 0.5, full_content: 'x' }] }) })) as unknown as (typeof global.fetch);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => { root.render(React.createElement(Phase4Scripts, { projectId: 'proj1' } as any)); });

    await act(async () => { (container.querySelector('button') as HTMLButtonElement).click(); });
    await act(async () => { (Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Safe/Commercial')) as HTMLButtonElement).click(); });

    const loadBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Load Versions')) as HTMLButtonElement;
    expect(loadBtn).toBeTruthy();
    expect(loadBtn.getAttribute('aria-controls')).toBeTruthy();
    expect(['false', '']).toContain(loadBtn.getAttribute('aria-expanded'));

    // clicking will set showVersions true (aria-expanded true)
    global.fetch = vi.fn(async () => ({ ok: true, json: async () => ([{ id: 'v1', version_number: 1, content: 'c', created_at: new Date().toISOString() }]) })) as any;
    await act(async () => { loadBtn.click(); });

    expect(loadBtn.getAttribute('aria-expanded')).toBe('true');

    root.unmount();
    global.fetch = originalFetch;
  });

  it('version preview buttons are keyboard navigable with ArrowDown/ArrowUp', async () => {
    const originalFetch = global.fetch;

    global.fetch = vi.fn(async (url: string) => {
      if (typeof url === 'string' && url.includes('/functions/v1/generate-scripts')) {
        return { ok: true, json: async () => ({ scripts: [{ id: 'script1', title: 'Test Script', script_type: 'safe', word_count: 10, scene_count: 1, emotional_coherence: 0.5, logical_continuity: 0.5, audience_tolerance: 0.5, overall_score: 0.5, full_content: 'Line1\nLine2' }] }) } as unknown as Response;
      }
      if (typeof url === 'string' && url.includes('/rest/v1/script_versions')) {
        return { ok: true, json: async () => ([{ id: 'v1', version_number: 1, content: 'A' }, { id: 'v2', version_number: 2, content: 'B' }]) } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    }) as unknown as (typeof global.fetch);

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => { root.render(React.createElement(Phase4Scripts, { projectId: 'proj1' } as any)); });

    await act(async () => { (container.querySelector('button') as HTMLButtonElement).click(); });
    await act(async () => { (Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Safe/Commercial')) as HTMLButtonElement).click(); });

    const loadBtn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent?.includes('Load Versions')) as HTMLButtonElement;
    await act(async () => { loadBtn.click(); });

    // wait for preview buttons to appear
    const start = Date.now();
    let previewBtns: HTMLButtonElement[] = [];
    while (Date.now() - start < 1000) {
      previewBtns = Array.from(container.querySelectorAll('button')).filter((b) => b.getAttribute('aria-label')?.startsWith('Preview version')) as HTMLButtonElement[];
      if (previewBtns.length >= 2) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(previewBtns.length).toBeGreaterThanOrEqual(2);

    // sanity check labels
    expect(previewBtns[0].getAttribute('aria-label')).toBe('Preview version 1');
    expect(previewBtns[1].getAttribute('aria-label')).toBe('Preview version 2');

    // focus first preview and press ArrowDown
    previewBtns[0].focus();
    await act(async () => {
      const ev = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
      previewBtns[0].dispatchEvent(ev);
      // allow scheduled focus to occur
      await new Promise((r) => setTimeout(r, 10));

      // debug: active label
    });

    // wait for focus to move
    const start2 = Date.now();
    while (Date.now() - start2 < 500) {
      if (document.activeElement === previewBtns[1]) break;
      await new Promise((r) => setTimeout(r, 10));
    }
    expect(document.activeElement).toBe(previewBtns[1]);

    // press ArrowUp to go back
    await act(async () => {
      const ev = new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true });
      previewBtns[1].dispatchEvent(ev);
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(document.activeElement).toBe(previewBtns[0]);

    root.unmount();
    global.fetch = originalFetch;
  });
});
