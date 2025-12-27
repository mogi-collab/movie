import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

import Phase16Monetization from '../../src/components/phases/Phase16Monetization';

function renderIntoContainer(component: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(component);
  return { container, root };
}

describe('Phase16Monetization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    (global as any).fetch = undefined;
  });

  it('renders and calls server on generate', async () => {
    const { container } = renderIntoContainer(<Phase16Monetization projectId="proj-16" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(container.textContent).toContain('Phase 16: Monetization & Long-term Support');

    const button = Array.from(container.querySelectorAll('button')).find((b) => (b.textContent || '').trim().includes('Generate Monetization Plan')) as HTMLButtonElement | undefined;
    expect(button).toBeDefined();

    await act(async () => {
      button!.click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect((global as any).fetch).toHaveBeenCalled();
    const calledWith = (global as any).fetch.mock.calls[0][0];
    expect(calledWith).toContain('/functions/v1/phase16-monetization');

    expect(container.textContent).toContain('Monetization plan generated');
  });
});
