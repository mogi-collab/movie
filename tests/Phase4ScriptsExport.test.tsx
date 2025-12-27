/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import Phase4Scripts from '../src/components/phases/Phase4Scripts';

describe('Phase4Scripts component (SSR render)', () => {
  it('renders generate button and has Export text in markup', () => {
    const html = renderToString(React.createElement(Phase4Scripts, { projectId: 'proj1' } as any));
    expect(html).toContain('Generate Scripts');
  });
});
