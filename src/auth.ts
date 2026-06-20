import * as vscode from 'vscode';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { OAuthClientProvider } from '@modelcontextprotocol/sdk/client/auth.js';
import type {
  OAuthClientInformationFull,
  OAuthClientMetadata,
  OAuthTokens,
} from '@modelcontextprotocol/sdk/shared/auth.js';
import { CLIENT_NAME, SCOPE } from './config';

const KEY_CLIENT = 'agentage.clientInformation';
const KEY_TOKENS = 'agentage.tokens';
const KEY_VERIFIER = 'agentage.codeVerifier';

type CallbackServer = {
  server: http.Server;
  port: number;
  code: Promise<string>;
};

function startLoopbackServer(): Promise<CallbackServer> {
  return new Promise((resolve, reject) => {
    let resolveCode!: (code: string) => void;
    let rejectCode!: (err: Error) => void;
    const code = new Promise<string>((res, rej) => {
      resolveCode = res;
      rejectCode = rej;
    });

    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      if (url.pathname !== '/callback') {
        res.writeHead(404);
        res.end();
        return;
      }
      const authCode = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(
        '<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;text-align:center;padding-top:4rem">' +
          '<h2>agentage Memory</h2><p>Signed in. You can close this tab and return to your editor.</p></body>'
      );
      if (error) rejectCode(new Error(`Authorization failed: ${error}`));
      else if (authCode) resolveCode(authCode);
      else rejectCode(new Error('No authorization code in callback'));
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ server, port, code });
    });
  });
}

/**
 * OAuth 2.1 + PKCE + DCR provider for the MCP SDK, backed by VS Code SecretStorage.
 * The SDK drives DCR, PKCE and the token exchange; we only persist + open the browser
 * and capture the loopback redirect.
 */
export class VsCodeOAuthProvider implements OAuthClientProvider {
  private callback?: CallbackServer;
  private _redirectUrl = 'http://127.0.0.1:0/callback';

  constructor(private readonly secrets: vscode.SecretStorage) {}

  get redirectUrl(): string {
    return this._redirectUrl;
  }

  get clientMetadata(): OAuthClientMetadata {
    return {
      client_name: CLIENT_NAME,
      redirect_uris: [this._redirectUrl],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
      scope: SCOPE,
    };
  }

  async clientInformation(): Promise<OAuthClientInformationFull | undefined> {
    const raw = await this.secrets.get(KEY_CLIENT);
    return raw ? (JSON.parse(raw) as OAuthClientInformationFull) : undefined;
  }

  async saveClientInformation(info: OAuthClientInformationFull): Promise<void> {
    await this.secrets.store(KEY_CLIENT, JSON.stringify(info));
  }

  async tokens(): Promise<OAuthTokens | undefined> {
    const raw = await this.secrets.get(KEY_TOKENS);
    return raw ? (JSON.parse(raw) as OAuthTokens) : undefined;
  }

  async saveTokens(tokens: OAuthTokens): Promise<void> {
    await this.secrets.store(KEY_TOKENS, JSON.stringify(tokens));
  }

  async saveCodeVerifier(verifier: string): Promise<void> {
    await this.secrets.store(KEY_VERIFIER, verifier);
  }

  async codeVerifier(): Promise<string> {
    const v = await this.secrets.get(KEY_VERIFIER);
    if (!v) throw new Error('Missing PKCE code verifier');
    return v;
  }

  async redirectToAuthorization(authorizationUrl: URL): Promise<void> {
    vscode.window.setStatusBarMessage(
      `Agentage Memory: opening ${authorizationUrl.host} to sign in...`,
      6000
    );
    await vscode.env.openExternal(vscode.Uri.parse(authorizationUrl.toString()));
  }

  async invalidateCredentials(
    scope: 'all' | 'client' | 'tokens' | 'verifier'
  ): Promise<void> {
    if (scope === 'all' || scope === 'client') await this.secrets.delete(KEY_CLIENT);
    if (scope === 'all' || scope === 'tokens') await this.secrets.delete(KEY_TOKENS);
    if (scope === 'all' || scope === 'verifier') await this.secrets.delete(KEY_VERIFIER);
  }

  // --- loopback lifecycle, used by the client around an interactive connect ---

  async startCallback(): Promise<void> {
    this.callback = await startLoopbackServer();
    this._redirectUrl = `http://127.0.0.1:${this.callback.port}/callback`;
  }

  waitForCode(): Promise<string> {
    if (!this.callback) throw new Error('Callback server not started');
    return this.callback.code;
  }

  stopCallback(): void {
    this.callback?.server.close();
    this.callback = undefined;
  }

  async signOut(): Promise<void> {
    await this.invalidateCredentials('all');
  }
}
