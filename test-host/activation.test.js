// Extension-host smoke — runs inside a REAL VS Code via @vscode/test-cli.
// Proves the PACKAGED extension activates and contributes what it claims; the
// branch logic (host detection, JSONC merge, no-clobber) stays in the vitest
// unit tests. Network-free: under the test host uriScheme === 'vscode', so
// connectEditor takes the mcp/install deeplink branch — we assert it resolves,
// we never drive the OS install dialog (not headlessly automatable).
const assert = require('node:assert');
const vscode = require('vscode');

const EXTENSION_ID = 'agentage.agentage';
const COMMAND_ID = 'agentage.connectEditor';
const DEFAULT_MCP_URL = 'https://memory.agentage.io/mcp';

suite('Agentage extension — activation smoke', () => {
  // R1 — the packaged extension activates without an unhandled error.
  test('activates without error (R1)', async () => {
    const ext = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(ext, `extension ${EXTENSION_ID} not found in the host`);
    await ext.activate();
    assert.strictEqual(ext.isActive, true);
  });

  // R2 — the command is registered after activation.
  test('registers agentage.connectEditor (R2)', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes(COMMAND_ID), `${COMMAND_ID} is not registered`);
  });

  // R3 — invoking the command launches its handler without an early throw.
  // On the VS Code path connectEditor opens the mcp/install deeplink and then
  // awaits a user-facing info dialog, so it stays PENDING headlessly (O2). We
  // assert it does not reject early — proving the handler runs (imports resolve,
  // host detection + URL build don't blow up), not that the dialog is answered.
  test('connectEditor launches without rejecting early (R3)', async () => {
    const run = Promise.resolve(vscode.commands.executeCommand(COMMAND_ID));
    const outcome = await Promise.race([
      run.then(
        () => 'resolved',
        (err) => ({ rejected: err })
      ),
      new Promise((resolve) => setTimeout(() => resolve('pending'), 1500)),
    ]);
    assert.ok(
      outcome === 'pending' || outcome === 'resolved',
      `connectEditor rejected early: ${outcome && outcome.rejected}`
    );
  });

  // R4 — the contributed config defaults to the prod MCP endpoint.
  test('agentage.mcpUrl defaults to the prod endpoint (R4)', () => {
    const url = vscode.workspace.getConfiguration('agentage').get('mcpUrl');
    assert.strictEqual(url, DEFAULT_MCP_URL);
  });
});
