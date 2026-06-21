import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    // Resolve `import 'vscode'` to a controllable mock so the command code path runs.
    alias: {
      vscode: fileURLToPath(new URL('./test/vscode-mock.ts', import.meta.url)),
    },
  },
});
