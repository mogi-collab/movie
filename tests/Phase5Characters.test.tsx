import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Phase5Characters from '../src/components/phases/Phase5Characters';

describe('Phase5Characters component (SSR render)', () => {
  it('renders header and generate button', () => {
    const html = renderToString(React.createElement(Phase5Characters, { projectId: 'proj1' } as any));
    expect(html).toContain('Phase 5: Character Design');
    expect(html).toContain('Character Bible');
    expect(html).toContain('Generate Characters');
  });
});
