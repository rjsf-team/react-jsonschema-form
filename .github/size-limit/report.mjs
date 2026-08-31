// Builds a markdown size report comparing head.json/base.json size-limit output.
// Usage: node report.mjs <dir containing head.json and base.json> [head sha]
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const headSha = process.argv[3];
// size-limit prints `{"error": "..."}` (not an array) when it fails internally,
// and a crashed run can leave an empty file; treat both as "no data".
const read = (f) => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
const head = read('head.json');
const base = new Map(read('base.json').map((c) => [c.name, c]));

// The json is produced by the PR's own build: keep names inert as markdown and
// the row count bounded, since this text is posted by a write-token workflow.
const safe = (name) =>
  String(name)
    .replace(/[^\w ()@/+.,:-]/g, '')
    .slice(0, 80);
// size-limit budgets ("90 kB") are decimal via bytes-iec, so format with 1000.
const fmt = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;
// One row per released package, plus a second for those with dependencies of
// their own; bounded well above that so the report stays finite for json the
// PR's own build produced.
const rows = head.slice(0, 60).map((c) => {
  const b = base.get(c.name);
  const diff = b ? c.size - b.size : null;
  // Under 5 bytes the delta would render as a signed 0.00 kB; call it unchanged.
  const delta = diff === null ? 'new' : Math.abs(diff) < 5 ? '=' : `${diff > 0 ? '+' : '-'}${fmt(Math.abs(diff))}`;
  const status = c.passed === false ? ' :x:' : '';
  // Code span so a name can never render as a mention or other live markdown.
  return `| \`${safe(c.name)}\`${status} | ${b ? fmt(b.size) : '—'} | ${fmt(c.size)} | ${delta} |`;
});
if (rows.length === 0) {
  rows.push('| _no size data produced_ | — | — | — |');
}

const body = [
  '<!-- size-limit-report -->',
  '## Size limit report',
  '',
  `Sizes are minified + brotli, measured by [size-limit](https://github.com/ai/size-limit)${
    headSha ? ` at \`${headSha.slice(0, 7)}\`` : ''
  }.`,
  '',
  'A package listed twice is measured both as installed and, on the second row, as its own code with its dependencies excluded. Peer dependencies are always excluded.',
  '',
  '| Check | Base | PR | Δ |',
  '| --- | --- | --- | --- |',
  ...rows,
  '',
].join('\n');

fs.writeFileSync(path.join(dir, 'size-limit-report.md'), body);
console.log(body);
