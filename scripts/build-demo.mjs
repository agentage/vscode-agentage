// Builds media/demo.gif - a mockup of the Agentage: Search Memory flow.
// SVG frames -> PNG (rsvg-convert) -> animated GIF (ImageMagick convert).
// Run: node scripts/build-demo.mjs
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const W = 1000;
const H = 620;
const GOLD = '#f3a52b';
const TMP = '/tmp/agentage-demo';
const OUT = 'media/demo.gif';

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// text with the matched term highlighted gold
function snippet(text, term, x, y, size, color) {
  const i = text.toLowerCase().indexOf(term.toLowerCase());
  if (i < 0)
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-family="'DejaVu Sans',sans-serif">${esc(text)}</text>`;
  const a = esc(text.slice(0, i));
  const b = esc(text.slice(i, i + term.length));
  const c = esc(text.slice(i + term.length));
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-family="'DejaVu Sans',sans-serif">${a}<tspan fill="${GOLD}" font-weight="bold">${b}</tspan>${c}</text>`;
}

const gearIcon = (cx, cy) => {
  const teeth = Array.from({ length: 8 }, (_, k) => {
    const ang = (k * Math.PI) / 4;
    const x1 = cx + Math.cos(ang) * 5.2;
    const y1 = cy + Math.sin(ang) * 5.2;
    const x2 = cx + Math.cos(ang) * 7.6;
    const y2 = cy + Math.sin(ang) * 7.6;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#9da2a8" stroke-width="2" stroke-linecap="round"/>`;
  }).join('');
  return `${teeth}<circle cx="${cx}" cy="${cy}" r="4.2" fill="none" stroke="#9da2a8" stroke-width="1.6"/>`;
};

const signOutIcon = (cx, cy) =>
  `<g stroke="#9da2a8" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round">
     <path d="M ${cx - 6} ${cy - 6} h -3 v 12 h 3"/>
     <line x1="${cx - 5}" y1="${cy}" x2="${cx + 7}" y2="${cy}"/>
     <polyline points="${cx + 3},${cy - 4} ${cx + 7},${cy} ${cx + 3},${cy + 4}"/>
   </g>`;

function chrome(tabLabel, readOnly) {
  const ro = readOnly
    ? `<g transform="translate(${48 + 14 + tabW(tabLabel) + 10},44)">
         <rect x="0" y="-12" width="74" height="18" rx="9" fill="#37343b" stroke="#4a4550" stroke-width="1"/>
         <circle cx="11" cy="-3" r="3.4" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
         <rect x="8.4" y="-3.4" width="5.2" height="4.2" rx="1" fill="${GOLD}"/>
         <text x="20" y="1" font-size="10.5" fill="#c7c2cc" font-family="'DejaVu Sans',sans-serif">Read-only</text>
       </g>`
    : '';
  return `
  <rect width="${W}" height="${H}" fill="#1e1e1e"/>
  <rect x="0" y="0" width="${W}" height="30" fill="#3c3c3c"/>
  <circle cx="18" cy="15" r="6" fill="#ff5f56"/><circle cx="38" cy="15" r="6" fill="#ffbd2e"/><circle cx="58" cy="15" r="6" fill="#27c93f"/>
  <text x="${W / 2}" y="19" font-size="12" fill="#c8c8c8" text-anchor="middle" font-family="'DejaVu Sans',sans-serif">Agentage Memory - Visual Studio Code</text>
  <rect x="0" y="30" width="48" height="${H - 30}" fill="#333333"/>
  <g transform="translate(24,70)">
    <path d="M -9 6 L 0 -9 L 9 6 L 4.5 6 L 4.5 0 a 4.5 4.5 0 0 0 -9 0 L -4.5 6 Z" fill="${GOLD}"/>
  </g>
  <rect x="14" y="120" width="20" height="3" rx="1.5" fill="#5a5a5a"/><rect x="14" y="128" width="20" height="3" rx="1.5" fill="#5a5a5a"/><rect x="14" y="136" width="20" height="3" rx="1.5" fill="#5a5a5a"/>
  <rect x="48" y="30" width="${W - 48}" height="36" fill="#252526"/>
  <rect x="48" y="30" width="${tabW(tabLabel)}" height="36" fill="#1e1e1e"/>
  <rect x="48" y="30" width="${tabW(tabLabel)}" height="2" fill="${GOLD}"/>
  <text x="${48 + 14}" y="53" font-size="12.5" fill="#d4d4d4" font-family="'DejaVu Sans',sans-serif">${esc(tabLabel)}</text>
  ${ro}`;
}
const tabW = (label) => Math.round(28 + label.length * 7.2);

function dim() {
  return `<rect x="48" y="66" width="${W - 48}" height="${H - 66}" fill="#000000" opacity="0.35"/>`;
}

// quick-input palette
function palette({ input, placeholder, cursor, buttons, list, busy }) {
  const px = 214;
  const pw = 640;
  const py = 44;
  const rowH = 38;
  let svg = `<rect x="${px - 2}" y="${py - 2}" width="${pw + 4}" height="${
    8 + rowH + (list ? list.length * 52 + 6 : 0)
  }" rx="6" fill="#000000" opacity="0.45"/>`;
  svg += `<rect x="${px}" y="${py}" width="${pw}" height="${
    6 + rowH + (list ? list.length * 52 + 6 : 0)
  }" rx="5" fill="#252526" stroke="#3d3d3d" stroke-width="1"/>`;
  // input box
  svg += `<rect x="${px + 8}" y="${py + 8}" width="${pw - 16}" height="${rowH - 8}" rx="3" fill="#1b1b1c" stroke="${GOLD}" stroke-opacity="0.55" stroke-width="1"/>`;
  const tx = px + 18;
  const ty = py + 8 + (rowH - 8) / 2 + 4.5;
  if (input) {
    svg += `<text x="${tx}" y="${ty}" font-size="14" fill="#e6e6e6" font-family="'DejaVu Sans',sans-serif">${esc(input)}</text>`;
    if (cursor) {
      const cw = 18 + input.length * 7.7;
      svg += `<rect x="${px + cw}" y="${py + 14}" width="1.6" height="18" fill="#e6e6e6"/>`;
    }
  } else if (placeholder) {
    svg += `<text x="${tx}" y="${ty}" font-size="14" fill="#7a7a7a" font-family="'DejaVu Sans',sans-serif">Search your memory...</text>`;
    if (cursor) svg += `<rect x="${tx}" y="${py + 14}" width="1.6" height="18" fill="#e6e6e6"/>`;
  }
  // buttons on the right
  if (buttons) {
    svg += gearIcon(px + pw - 46, py + 8 + (rowH - 8) / 2);
    svg += signOutIcon(px + pw - 24, py + 8 + (rowH - 8) / 2);
  }
  if (busy) {
    svg += `<circle cx="${px + pw - 26}" cy="${py + 8 + (rowH - 8) / 2}" r="7" fill="none" stroke="#5a5a5a" stroke-width="2"/>`;
    svg += `<path d="M ${px + pw - 26} ${py + 8 + (rowH - 8) / 2 - 7} a 7 7 0 0 1 7 7" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
  }
  // list rows
  if (list) {
    list.forEach((r, idx) => {
      const ry = py + rowH + 6 + idx * 52;
      if (r.selected) {
        svg += `<rect x="${px + 4}" y="${ry}" width="${pw - 8}" height="50" rx="3" fill="#093354"/>`;
        svg += `<rect x="${px + 4}" y="${ry}" width="3" height="50" fill="${GOLD}"/>`;
      }
      // title + path
      svg += `<text x="${px + 18}" y="${ry + 20}" font-size="13.5" fill="#e8e8e8" font-family="'DejaVu Sans',sans-serif">${esc(
        r.title
      )}</text>`;
      svg += `<text x="${px + 18 + r.title.length * 7.4 + 12}" y="${
        ry + 20
      }" font-size="11" fill="#8a8a8a" font-family="'DejaVu Sans Mono',monospace">${esc(
        r.path
      )}</text>`;
      // snippet
      svg += snippet(r.snippet, 'auth', px + 18, ry + 39, 11.5, '#9aa0a6');
    });
  }
  return svg;
}

function command() {
  const px = 214;
  const pw = 640;
  const py = 44;
  const rowH = 38;
  const cmds = [
    { t: 'Agentage: Search Memory', sel: true },
    { t: 'Preferences: Open Settings (UI)', sel: false },
    { t: 'Developer: Reload Window', sel: false },
  ];
  let svg = `<rect x="${px - 2}" y="${py - 2}" width="${pw + 4}" height="${
    8 + rowH + cmds.length * 34 + 6
  }" rx="6" fill="#000000" opacity="0.45"/>`;
  svg += `<rect x="${px}" y="${py}" width="${pw}" height="${
    6 + rowH + cmds.length * 34 + 6
  }" rx="5" fill="#252526" stroke="#3d3d3d" stroke-width="1"/>`;
  svg += `<rect x="${px + 8}" y="${py + 8}" width="${pw - 16}" height="${rowH - 8}" rx="3" fill="#1b1b1c" stroke="#3d3d3d" stroke-width="1"/>`;
  svg += `<text x="${px + 18}" y="${py + 8 + (rowH - 8) / 2 + 4.5}" font-size="14" fill="#e6e6e6" font-family="'DejaVu Sans',sans-serif">&gt; Agentage: Search Mem</text>`;
  const cw = 18 + '> Agentage: Search Mem'.length * 7.7;
  svg += `<rect x="${px + cw}" y="${py + 14}" width="1.6" height="18" fill="#e6e6e6"/>`;
  cmds.forEach((c, idx) => {
    const ry = py + rowH + 6 + idx * 34;
    if (c.sel) {
      svg += `<rect x="${px + 4}" y="${ry}" width="${pw - 8}" height="32" rx="3" fill="#093354"/>`;
      svg += `<rect x="${px + 4}" y="${ry}" width="3" height="32" fill="${GOLD}"/>`;
    }
    const idx2 = c.t.toLowerCase().indexOf('search mem');
    if (idx2 >= 0 && c.sel) {
      const a = esc(c.t.slice(0, idx2));
      const b = esc(c.t.slice(idx2, idx2 + 'Search Mem'.length));
      const cc = esc(c.t.slice(idx2 + 'Search Mem'.length));
      svg += `<text x="${px + 18}" y="${ry + 21}" font-size="13" fill="#e8e8e8" font-family="'DejaVu Sans',sans-serif">${a}<tspan fill="${GOLD}" font-weight="bold">${b}</tspan>${cc}</text>`;
    } else {
      svg += `<text x="${px + 18}" y="${ry + 21}" font-size="13" fill="#bdbdbd" font-family="'DejaVu Sans',sans-serif">${esc(
        c.t
      )}</text>`;
    }
  });
  return svg;
}

function doc() {
  const lines = [
    ['# OAuth setup notes', '#569cd6'],
    ['', ''],
    ['The Memory MCP endpoint signs you in with OAuth 2.1 + PKCE', '#d4d4d4'],
    ['and Dynamic Client Registration against auth.agentage.io.', '#d4d4d4'],
    ['', ''],
    ['- Token lives in the OS keychain (SecretStorage), never on disk.', '#d4d4d4'],
    ['- The redirect returns to a local loopback port.', '#d4d4d4'],
    ['- Read-only: search and open, no writes.', '#d4d4d4'],
  ];
  let svg = '';
  let n = 1;
  lines.forEach((ln, i) => {
    const y = 96 + i * 26;
    svg += `<text x="80" y="${y}" font-size="12" fill="#5a5a5a" text-anchor="end" font-family="'DejaVu Sans Mono',monospace">${n}</text>`;
    if (ln[0])
      svg += `<text x="98" y="${y}" font-size="13.5" fill="${ln[1]}" font-family="'DejaVu Sans Mono',monospace">${esc(
        ln[0]
      )}</text>`;
    n++;
  });
  return svg;
}

const R = [
  {
    title: 'Auth service - key decisions',
    path: 'work/auth/decisions.md',
    snippet: '...a dedicated Better Auth service as the IdP + OAuth 2.1 AS...',
  },
  {
    title: 'OAuth setup notes',
    path: 'notes/oauth-setup.md',
    snippet: '...one-click auth: OAuth 2.1 + PKCE + DCR against auth.agentage.io...',
  },
  {
    title: 'MCP connector soft-launch',
    path: 'tasks/mcp-connector.md',
    snippet: '...connector + auth path verified live; magic-link onboarding...',
  },
];

const frames = [
  { delay: 140, build: () => chrome('search.md', false) + dim() + command() },
  {
    delay: 70,
    build: () =>
      chrome('search.md', false) +
      dim() +
      palette({ placeholder: true, cursor: true, buttons: true }),
  },
  {
    delay: 55,
    build: () =>
      chrome('search.md', false) +
      dim() +
      palette({ input: 'auth', cursor: true, buttons: true, busy: true }),
  },
  {
    delay: 165,
    build: () =>
      chrome('search.md', false) +
      dim() +
      palette({
        input: 'auth',
        buttons: true,
        list: R.map((r, i) => ({ ...r, selected: i === 0 })),
      }),
  },
  {
    delay: 95,
    build: () =>
      chrome('search.md', false) +
      dim() +
      palette({
        input: 'auth',
        buttons: true,
        list: R.map((r, i) => ({ ...r, selected: i === 1 })),
      }),
  },
  { delay: 250, build: () => chrome('oauth-setup.md', true) + doc() },
];

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const svgWrap = (inner) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const args = [];
frames.forEach((f, i) => {
  const svgPath = `${TMP}/f${i}.svg`;
  const pngPath = `${TMP}/f${i}.png`;
  writeFileSync(svgPath, svgWrap(f.build()));
  execSync(`rsvg-convert -w ${W} -h ${H} "${svgPath}" -o "${pngPath}"`);
  args.push(`-delay ${f.delay} "${pngPath}"`);
});

mkdirSync('media', { recursive: true });
execSync(
  `convert -loop 0 ${args.join(' ')} -layers optimize "${OUT}"`,
  { stdio: 'inherit' }
);
console.log(`wrote ${OUT}`);
