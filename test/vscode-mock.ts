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
  mcpProviderId: undefined as string | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mcpProvider: undefined as any,
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
  state.mcpProviderId = undefined;
  state.mcpProvider = undefined;
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

export class EventEmitter<T> {
  private listeners: ((e: T) => void)[] = [];
  event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return { dispose: () => undefined };
  };
  fire(e: T): void {
    for (const l of this.listeners) l(e);
  }
  dispose(): void {
    this.listeners = [];
  }
}

export class McpHttpServerDefinition {
  constructor(
    public label: string,
    public uri: { toString(): string },
    public headers?: Record<string, string>,
    public version?: string
  ) {}
}

export const lm = {
  registerMcpServerDefinitionProvider: (id: string, provider: unknown) => {
    state.mcpProviderId = id;
    state.mcpProvider = provider;
    return { dispose: () => undefined };
  },
};
