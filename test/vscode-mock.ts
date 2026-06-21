// Minimal controllable mock of the 'vscode' module surface that connect-editor.ts
// and config.ts touch. Aliased to 'vscode' in vitest.config.ts.

export const state = {
  uriScheme: 'vscode',
  mcpUrl: undefined as string | undefined,
  infoReturn: undefined as string | undefined,
  errorReturn: undefined as string | undefined,
  openExternalReturn: true,
  infoMessages: [] as { message: string; items: string[] }[],
  errorMessages: [] as { message: string; items: string[] }[],
  openExternalCalls: [] as string[],
  clipboard: [] as string[],
  shownDocs: [] as string[],
};

export function __reset(): void {
  state.uriScheme = 'vscode';
  state.mcpUrl = undefined;
  state.infoReturn = undefined;
  state.errorReturn = undefined;
  state.openExternalReturn = true;
  state.infoMessages = [];
  state.errorMessages = [];
  state.openExternalCalls = [];
  state.clipboard = [];
  state.shownDocs = [];
}

export const window = {
  showInformationMessage: async (message: string, ...items: string[]) => {
    state.infoMessages.push({ message, items });
    return state.infoReturn;
  },
  showErrorMessage: async (message: string, ...items: string[]) => {
    state.errorMessages.push({ message, items });
    return state.errorReturn;
  },
  showTextDocument: async (uri: { toString(): string }) => {
    state.shownDocs.push(uri.toString());
    return {};
  },
};

export const workspace = {
  getConfiguration: (_section: string) => ({
    get: (_key: string) => state.mcpUrl,
  }),
};

export const env = {
  get uriScheme() {
    return state.uriScheme;
  },
  openExternal: async (uri: { toString(): string }) => {
    state.openExternalCalls.push(uri.toString());
    return state.openExternalReturn;
  },
  clipboard: {
    writeText: async (text: string) => {
      state.clipboard.push(text);
    },
  },
};

export const Uri = {
  parse: (s: string) => ({ toString: () => s }),
  file: (p: string) => ({ toString: () => `file://${p}`, fsPath: p }),
};

export const commands = {
  executeCommand: async () => undefined,
};
