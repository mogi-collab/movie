import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import OutputDashboard from '../src/components/OutputDashboard';

describe('OutputDashboard (SSR snapshot)', () => {
  it('renders the Project Output header', () => {
    const html = renderToString(React.createElement(OutputDashboard, { projectId: 'proj1' } as any));
    expect(html).toContain('Project Output');
  });
});
