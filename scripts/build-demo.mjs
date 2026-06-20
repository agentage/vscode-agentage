// Builds media/demo.gif - the agentage memory answering in Copilot Chat
// through the MCP connection. SVG frames -> PNG (rsvg-convert) -> GIF (convert).
// Run: node scripts/build-demo.mjs
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';

const W = 1000;
const H = 620;
const GOLD = '#f3a52b';
const TMP = '/tmp/agentage-demo';
const OUT = 'media/demo.gif';
const CX = 512; // chat panel left edge
const PAD = 18;
const CL = CX + PAD; // content left
const FS = "font-family=\"'DejaVu Sans',sans-serif\"";
const FM = "font-family=\"'DejaVu Sans Mono',monospace\"";

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const txt = (x, y, s, fill, str, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${s}" fill="${fill}" ${FS} ${extra}>${esc(str)}</text>`;
const mono = (x, y, s, fill, str, extra = '') =>
  `<text x="${x}" y="${y}" font-size="${s}" fill="${fill}" ${FM} ${extra}>${esc(str)}</text>`;

const rocketA = (cx, cy, sc, fill = GOLD) =>
  `<g transform="translate(${cx},${cy}) scale(${sc})"><path d="M -9 6 L 0 -9 L 9 6 L 4.5 6 L 4.5 0 a 4.5 4.5 0 0 0 -9 0 L -4.5 6 Z" fill="${fill}"/></g>`;

const sparkle = (cx, cy, s, fill = GOLD) => {
  const p = [
    [cx, cy - s],
    [cx + s * 0.26, cy - s * 0.26],
    [cx + s, cy],
    [cx + s * 0.26, cy + s * 0.26],
    [cx, cy + s],
    [cx - s * 0.26, cy + s * 0.26],
    [cx - s, cy],
    [cx - s * 0.26, cy - s * 0.26],
  ]
    .map((q) => q.map((n) => n.toFixed(1)).join(','))
    .join(' ');
  return `<polygon points="${p}" fill="${fill}"/>`;
};

function chrome() {
  return `
  <rect width="${W}" height="${H}" fill="#1e1e1e"/>
  <rect x="0" y="0" width="${W}" height="30" fill="#3c3c3c"/>
  <circle cx="18" cy="15" r="6" fill="#ff5f56"/><circle cx="38" cy="15" r="6" fill="#ffbd2e"/><circle cx="58" cy="15" r="6" fill="#27c93f"/>
  ${txt(W / 2, 19, 12, '#c8c8c8', 'Agentage Memory - Visual Studio Code', 'text-anchor="middle"')}
  <rect x="0" y="30" width="48" height="${H - 30}" fill="#333333"/>
  ${rocketA(24, 70, 1.0)}
  <rect x="14" y="120" width="20" height="3" rx="1.5" fill="#5a5a5a"/><rect x="14" y="128" width="20" height="3" rx="1.5" fill="#5a5a5a"/><rect x="14" y="136" width="20" height="3" rx="1.5" fill="#5a5a5a"/>

  <!-- left editor (faded roadmap) -->
  <rect x="48" y="30" width="${CX - 48}" height="36" fill="#252526"/>
  <rect x="48" y="30" width="120" height="36" fill="#1e1e1e"/>
  <rect x="48" y="30" width="120" height="2" fill="${GOLD}"/>
  ${txt(62, 53, 12.5, '#cdcdcd', 'roadmap.md')}
  ${mono(72, 100, 12.5, '#4f7da3', '# Product roadmap')}
  ${mono(72, 150, 12.5, '#3f3f3f', '...')}
  ${mono(72, 184, 12.5, '#7d6a3a', '## Q3 2026')}
  ${mono(72, 218, 12.5, '#3f3f46', '<!-- pull the milestones')}
  ${mono(72, 240, 12.5, '#3f3f46', '     from memory -->')}

  <!-- chat panel -->
  <rect x="${CX}" y="30" width="${W - CX}" height="${H - 30}" fill="#1b1b1c"/>
  <line x1="${CX}" y1="30" x2="${CX}" y2="${H}" stroke="#2b2b2b" stroke-width="1"/>
  ${sparkle(CL + 6, 49, 6, '#cfcfcf')}
  ${txt(CL + 20, 53, 12, '#cfcfcf', 'CHAT', 'letter-spacing="1"')}
  <line x1="${CX}" y1="66" x2="${W}" y2="66" stroke="#2b2b2b" stroke-width="1"/>`;
}

function toolChip(x, y, state) {
  const w = 322;
  let s =
    `<rect x="${x}" y="${y}" width="${w}" height="30" rx="6" fill="#232324" stroke="#3a3a3a" stroke-width="1"/>` +
    rocketA(x + 17, y + 15, 0.62);
  s += `<text x="${x + 34}" y="${y + 19}" font-size="11.5" ${FM}><tspan fill="${GOLD}" font-weight="bold">agentage</tspan><tspan fill="#6f6f6f"> · </tspan><tspan fill="#c9c9c9">memory__search</tspan></text>`;
  if (state === 'run') {
    s += `<circle cx="${x + w - 18}" cy="${y + 15}" r="6" fill="none" stroke="#4a4a4a" stroke-width="2"/>`;
    s += `<path d="M ${x + w - 18} ${y + 9} a 6 6 0 0 1 6 6" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
  } else {
    s += `<path d="M ${x + w - 40} ${y + 15} l 3 3 l 6 -7" fill="none" stroke="#3fb950" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<text x="${x + w - 27} " y="${y + 19}" font-size="11" fill="#8a8a8a" ${FS}>5 hits</text>`;
  }
  return s;
}

const BULLETS = [
  ['Better Auth single-host login cutover', 'auth/roadmap.md'],
  ['Git-store GA + hourly off-box backup', 'git-store/transition.md'],
  ['MCP connector directory listing', 'tasks/mcp-directory.md'],
  ['VS Code + Cursor memory search', 'features/vscode.md'],
];

function chatBody({ input, sent, chip, bullets, closing, spinner }) {
  let s = '';
  let y = 96;
  // user message
  if (sent) {
    s += `<circle cx="${CL + 9}" cy="${y}" r="10" fill="#3a3a3d"/>`;
    s += `<circle cx="${CL + 9}" cy="${y - 3}" r="3.4" fill="#b9b9bd"/><path d="M ${CL + 2} ${y + 7} a 7 6 0 0 1 14 0 z" fill="#b9b9bd"/>`;
    s += txt(CL + 26, y + 4, 11.5, '#9a9a9a', 'You');
    y += 26;
    s += txt(CL, y, 13.5, '#e7e7e7', 'get me the milestones for Q3 2026');
    y += 34;
    // assistant header
    s += `<circle cx="${CL + 9}" cy="${y}" r="10" fill="#26303a"/>` + sparkle(CL + 9, y, 6, GOLD);
    s += txt(CL + 26, y + 4, 11.5, '#9a9a9a', 'GitHub Copilot');
    y += 22;
    if (spinner) {
      s += `<circle cx="${CL + 8}" cy="${y + 4}" r="6" fill="none" stroke="#4a4a4a" stroke-width="2"/>`;
      s += `<path d="M ${CL + 8} ${y - 2} a 6 6 0 0 1 6 6" fill="none" stroke="${GOLD}" stroke-width="2" stroke-linecap="round"/>`;
      s += txt(CL + 22, y + 8, 12.5, '#8a8a8a', 'Searching your memory...');
      y += 24;
    }
    if (chip) {
      s += toolChip(CL, y, chip);
      y += 44;
    }
    if (bullets > 0) {
      s += txt(CL, y, 13, '#cccccc', 'Your Q3 2026 milestones, from memory:');
      y += 30;
      BULLETS.slice(0, bullets).forEach(([m, ref]) => {
        s += `<circle cx="${CL + 4}" cy="${y - 4}" r="3" fill="${GOLD}"/>`;
        s += txt(CL + 16, y, 13, '#dcdcdc', m);
        y += 19;
        s += mono(CL + 16, y, 10.5, '#6c6c72', ref);
        y += 25;
      });
      if (closing) {
        y += 4;
        s += txt(CL, y, 12.5, '#9a9a9a', 'Want owners and target dates for any of these?');
      }
    }
  }
  // input box
  const iy = 564;
  s += `<rect x="${CL}" y="${iy}" width="${W - PAD - CL}" height="34" rx="8" fill="#2b2b2d" stroke="#3d3d3d" stroke-width="1"/>`;
  if (input) {
    s += txt(CL + 12, iy + 22, 12.5, '#e2e2e2', input);
    const cw = 12 + input.length * 6.9;
    s += `<rect x="${CL + cw}" y="${iy + 9}" width="1.5" height="17" fill="#e2e2e2"/>`;
  } else {
    s += txt(CL + 12, iy + 22, 12.5, '#6f6f6f', 'Ask Copilot...');
  }
  // send arrow
  const ax = W - PAD - 20;
  s += `<g stroke="${GOLD}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M ${ax - 7} ${iy + 17} h 13 M ${ax + 2} ${iy + 12} l 4 5 l -4 5"/></g>`;
  return s;
}

const frames = [
  { delay: 150, build: () => chatBody({ input: 'get me the milestones for Q3 2026' }) },
  { delay: 70, build: () => chatBody({ sent: true, spinner: true }) },
  { delay: 75, build: () => chatBody({ sent: true, chip: 'run' }) },
  { delay: 120, build: () => chatBody({ sent: true, chip: 'done', bullets: 2 }) },
  { delay: 280, build: () => chatBody({ sent: true, chip: 'done', bullets: 4, closing: true }) },
];

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
const wrap = (inner) =>
  `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${chrome()}${inner}</svg>`;

const args = [];
frames.forEach((f, i) => {
  const svg = `${TMP}/f${i}.svg`;
  const png = `${TMP}/f${i}.png`;
  writeFileSync(svg, wrap(f.build()));
  execSync(`rsvg-convert -w ${W} -h ${H} "${svg}" -o "${png}"`);
  args.push(`-delay ${f.delay} "${png}"`);
});

mkdirSync('media', { recursive: true });
execSync(`convert -loop 0 ${args.join(' ')} -layers optimize "${OUT}"`, { stdio: 'inherit' });
console.log(`wrote ${OUT}`);
