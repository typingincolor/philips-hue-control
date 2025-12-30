import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: ['node_modules/', 'test/', '**/*.config.js'],
    },
  },
});
