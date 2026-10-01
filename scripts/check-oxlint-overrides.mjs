// An oxlint override replaces a rule's options rather than adding to them, so the `no-restricted-globals` overrides
// in .oxlintrc.json each repeat the root list, and one narrowed to some packages' `src` repeats the published-src
// list too. This fails when one of them stops covering the list it repeats, or when a published package's `src` is
// missing from the override that keeps it off the tests' Node and Vitest globals.
import { existsSync, readdirSync, readFileSync } from 'node:fs';

// Its `src` holds the shared Vitest suites themselves
const exempt = new Set(['snapshot-tests']);

const config = JSON.parse(
  readFileSync('.oxlintrc.json', 'utf8').replaceAll(/("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g, '$1'),
);

const ruleEntries = (rules) => (rules['no-restricted-globals'] ?? []).slice(1).map((entry) => JSON.stringify(entry));
const rootEntries = ruleEntries(config.rules);
const problems = [];

const publishedOverride = config.overrides.find((override) =>
  override.files.some((glob) => /^packages\/\{[^}]+\}\/src\/\*\*$/.test(glob)),
);
const publishedEntries = ruleEntries(publishedOverride.rules);

const narrowsPublished = (override) =>
  override !== publishedOverride && override.files.every((glob) => /^packages\/[^/]+\/src\//.test(glob));

for (const override of config.overrides.filter((candidate) => ruleEntries(candidate.rules).length > 0)) {
  const entries = new Set(ruleEntries(override.rules));
  const required = narrowsPublished(override) ? publishedEntries : rootEntries;
  for (const missing of required.filter((entry) => !entries.has(entry))) {
    problems.push(`The override for ${override.files.join(', ')} is missing the no-restricted-globals ${missing}`);
  }
}

const guarded = new Set(publishedOverride.files[0].slice('packages/{'.length, -'}/src/**'.length).split(','));
const published = readdirSync('packages').filter(
  (dir) =>
    !exempt.has(dir) &&
    existsSync(`packages/${dir}/src`) &&
    existsSync(`packages/${dir}/package.json`) &&
    !JSON.parse(readFileSync(`packages/${dir}/package.json`, 'utf8')).private,
);
for (const dir of published.filter((name) => !guarded.has(name))) {
  problems.push(`packages/${dir} is published but missing from the published-src override's files glob`);
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}
