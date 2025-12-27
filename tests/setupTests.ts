/* eslint-disable @typescript-eslint/no-explicit-any */
import { stubSupabaseWithOutline, stubStructureCheckFetch } from './test-utils';
import * as React from 'react';

// Ensure React is available globally for compiled JSX that references `React`.
(globalThis as any).React = React;

// Attach lightweight test helpers to globalThis so tests can opt-in easily.
(globalThis as any).testUtils = {
  stubSupabaseWithOutline,
  stubStructureCheckFetch,
  stubStructureCheckWithOutline: (outline: any, score = 0.75) => {
    const restoreSupabase = stubSupabaseWithOutline(outline);
    const restoreFetch = stubStructureCheckFetch(score);
    return () => {
      restoreSupabase();
      restoreFetch();
    };
  },
};
