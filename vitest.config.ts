import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: 'tests/setupTests.ts',
    reporters: ['default', ['json', { outputFile: './node_modules/.cache/vitest/results.json' }], ['junit', { outputFile: './node_modules/.cache/vitest/junit.xml' }]],
  },
});
