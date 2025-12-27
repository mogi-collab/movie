/* @vitest-environment jsdom */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import OutputDashboard from '../src/components/OutputDashboard';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

describe('OutputDashboard (SSR snapshot)', () => {
  it('renders the Project Output header', () => {
    const html = renderToString(React.createElement(OutputDashboard, { projectId: 'proj1' } as any));
    expect(html).toContain('Project Output');
  });

  it('shows Structure Coherence card after fetching structure-check', async () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    // Use the shared test helpers exposed by setupTests
    const restore = (globalThis as any).testUtils.stubStructureCheckWithOutline(
      { id: 'o1', title: 'Outline', content: 'act1|act2|act3' },
      0.78
    );

    await act(async () => {
      root.render(React.createElement(OutputDashboard, { projectId: 'proj1' } as any));
      // wait for async loadData to complete and update the DOM
      const start = Date.now();
      while (Date.now() - start < 1000) {
        if (container.innerHTML.includes('Structure Coherence') && container.innerHTML.includes('78%')) break;
        await new Promise((r) => setTimeout(r, 10));
      }
    });

    expect(container.innerHTML).toContain('Structure Coherence');
    expect(container.innerHTML).toContain('78%');

    // cleanup
    root.unmount();
    restore();
  });
});
