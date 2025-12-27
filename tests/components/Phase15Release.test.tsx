import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

import Phase15Release from '../../src/components/phases/Phase15Release';

function renderIntoContainer(component: React.ReactElement) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  root.render(component);
  return { container, root };
}

describe('Phase15Release', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) }));
  });

  afterEach(() => {
    document.body.innerHTML = '';
    (global as any).fetch = undefined;
  });

  it('renders and calls server on generate', async () => {
    const { container } = renderIntoContainer(<Phase15Release projectId="proj-15" />);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(container.textContent).toContain('Phase 15: Release & Promotion');

    const button = Array.from(container.querySelectorAll('button')).find((b) => (b.textContent || '').trim().includes('Generate Release Plan')) as HTMLButtonElement | undefined;
    expect(button).toBeDefined();

    await act(async () => {
      button!.click();
      await new Promise((r) => setTimeout(r, 10));
    });

    expect((global as any).fetch).toHaveBeenCalled();
    const calledWith = (global as any).fetch.mock.calls[0][0];
    expect(calledWith).toContain('/functions/v1/phase15-release');

    expect(container.textContent).toContain('Release plan generated');
  });
});
