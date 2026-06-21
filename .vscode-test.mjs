import { defineConfig } from '@vscode/test-cli';

// Runs the host smoke (test-host/**) inside a real downloaded VS Code, loading the
// built extension from ./dist (run `npm run compile` first; `test:host` does).
export default defineConfig({
  files: 'test-host/**/*.test.js',
  version: 'stable',
  mocha: { ui: 'tdd', timeout: 20000 },
});
