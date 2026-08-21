// Builds a markdown size report comparing head.json/base.json size-limit output.
// Usage: node report.mjs <dir containing head.json and base.json>
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
const head = read('head.json');
const base = new Map(read('base.json').map((c) => [c.name, c]));

const fmt = (bytes) => `${(bytes / 1024).toFixed(2)} kB`;
const rows = head.map((c) => {
  const b = base.get(c.name);
  const diff = b ? c.size - b.size : null;
  const delta =
    diff === null ? 'new' : diff === 0 ? '=' : `${diff > 0 ? '+' : '-'}${fmt(Math.abs(diff))}`;
  const status = c.passed === false ? ' :x:' : '';
  return `| ${c.name}${status} | ${b ? fmt(b.size) : '—'} | ${fmt(c.size)} | ${delta} |`;
});

const body = [
  '<!-- size-limit-report -->',
  '## Size limit report',
  '',
  'Sizes are minified + brotli, measured by [size-limit](https://github.com/ai/size-limit).',
  '',
  '| Check | Base | PR | Δ |',
  '| --- | --- | --- | --- |',
  ...rows,
  '',
].join('\n');

fs.writeFileSync(path.join(dir, 'size-limit-report.md'), body);
console.log(body);
