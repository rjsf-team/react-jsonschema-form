// Usage: node report.mjs <dir containing head.json and base.json> [head sha]
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const headSha = process.argv[3];
// size-limit prints `{"error": "..."}` when it fails internally, and a crashed
// run leaves an empty file; treat both as "no data".
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

// The json comes from the PR's own build, and this text is posted by a
// write-token workflow: keep names inert and the row count bounded.
const safe = (name) =>
  String(name)
    .replace(/[^\w ()@/+.,:-]/g, '')
    .slice(0, 80);
// size-limit budgets are decimal via bytes-iec.
const fmt = (bytes) => `${(bytes / 1000).toFixed(2)} kB`;
const rows = head.slice(0, 60).map((c) => {
  const b = base.get(c.name);
  const diff = b ? c.size - b.size : null;
  const delta = diff === null ? 'new' : Math.abs(diff) < 5 ? '=' : `${diff > 0 ? '+' : '-'}${fmt(Math.abs(diff))}`;
  const status = c.passed === false ? ' :x:' : '';
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
