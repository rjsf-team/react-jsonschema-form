// Usage: node .github/changelog/check.mjs [base] [head]
// Checks the entries a change adds under a package's heading in the changelog
// against the rules in packages/docs/docs/contributing.md#changelog. Compares HEAD with its merge
// base on origin/v7 by default. CHANGELOG_SKIP=true (the `no-changelog` label)
// lets a change to a published package's src add no entry.
import { execFileSync } from 'node:child_process';

const [baseArg, head = 'HEAD'] = process.argv.slice(2);
const git = (/** @type {string[]} */ ...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
const base = baseArg ?? git('merge-base', 'origin/v7', head).trim();
// Plain, rename-free output whatever the user's git config says
const diff = (/** @type {string[]} */ ...args) => git('diff', '--no-color', '--no-ext-diff', '--no-renames', ...args);

const VERBS = ['Add', 'Change', 'Deprecate', 'Fix', 'Remove'];
const BREAKING = '**BREAKING CHANGE:** ';
const GUIDE_LINK = /migration-guides\/v(\d+)\.x%20upgrade%20guide\/?#([\w-]+)/g;
const REPO_LINK = /\]\(https:\/\/github\.com\/rjsf-team\/react-jsonschema-form\/(?:pull|issues)\/\d+\)/;
const STYLE_LENGTH = 200;

/** @type {string[]} */
const errors = [];
/** @type {string[]} */
const warnings = [];

const show = (/** @type {string} */ file) => {
  try {
    return git('show', `${head}:${file}`);
  } catch {
    return '';
  }
};

/** @type {Map<string, Set<string>>} */
const guides = new Map();
// The v<major>.x upgrade guide's heading ids, as Docusaurus makes them with github-slugger
const guideIds = (/** @type {string} */ major) => {
  const cached = guides.get(major);
  if (cached) {
    return cached;
  }
  /** @type {Map<string, number>} */
  const seen = new Map();
  const markdown = show(`packages/docs/docs/migration-guides/v${major}.x upgrade guide.md`);
  const ids = new Set(
    [...markdown.replace(/^\s*```[\s\S]*?^\s*```/gm, '').matchAll(/^#{1,6} (.+?)(?: \{#([\w-]+)\})?$/gm)].map(
      ([, text, id]) => {
        const slug =
          id ??
          text
            .toLowerCase()
            .replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, '')
            .replace(/ /g, '-');
        const count = seen.get(slug) ?? 0;
        seen.set(slug, count + 1);
        return count === 0 ? slug : `${slug}-${count}`;
      },
    ),
  );
  guides.set(major, ids);
  return ids;
};

/** @type {Map<string, boolean>} */
const published = new Map();
const isPublished = (/** @type {string} */ dir) => {
  if (!published.has(dir)) {
    /** @type {{ private?: unknown }} */
    const manifest = JSON.parse(show(`packages/${dir}/package.json`) || '{"private": true}');
    published.set(dir, manifest.private !== true);
  }
  return published.get(dir) === true;
};

// On v7, CHANGELOG-v7.md sits beside main's CHANGELOG.md: entries belong in the one with the newest release
const newestRelease = (/** @type {string} */ file) => Number(/^# (\d+)/m.exec(show(file))?.[1] ?? -1);
const [changelog = 'CHANGELOG.md'] = git('ls-tree', '--name-only', head)
  .split('\n')
  .filter((name) => /^CHANGELOG[^/]*\.md$/.test(name))
  .sort((a, b) => newestRelease(b) - newestRelease(a));

const changedFiles = diff('--name-only', base, head).split('\n').filter(Boolean);
let entries = 0;

if (changedFiles.includes(changelog)) {
  // A hunk that removes nothing inserts new entries, which the rules apply to. A hunk that replaces lines edits
  // existing entries: that counts as the change's entry, but entries written before the rules aren't held to them
  /** @type {Set<number>} */
  const inserted = new Set();
  /** @type {Set<number>} */
  const edited = new Set();
  for (const [, removed = '1', start, count = '1'] of diff('--unified=0', base, head, '--', changelog).matchAll(
    /^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/gm,
  )) {
    for (let line = Number(start); line < Number(start) + Number(count); line += 1) {
      (removed === '0' ? inserted : edited).add(line);
    }
  }
  let releases = 0;
  let heading = '';
  for (const [index, text] of show(changelog).split('\n').entries()) {
    const line = index + 1;
    const at = `${changelog}:${line}`;
    if (text.startsWith('# ')) {
      releases += 1;
    } else if (text.startsWith('## ')) {
      heading = text.slice(3);
    } else if (heading.startsWith('@rjsf/') && /^\s*- /.test(text) && (inserted.has(line) || edited.has(line))) {
      entries += 1;
      if (releases !== 1) {
        errors.push(`${at}: add entries to the upcoming release at the top of the file`);
      }
      if (inserted.has(line) && text.startsWith('- ')) {
        const isBreaking = text.startsWith(`- ${BREAKING}`);
        const body = text.slice(isBreaking ? 2 + BREAKING.length : 2);
        const guideLinks = [...text.matchAll(GUIDE_LINK)];
        if (!VERBS.some((verb) => body.startsWith(`${verb} `))) {
          errors.push(
            `${at}: start the entry with ${VERBS.join(', ')}, and mark a breaking change \`- ${BREAKING.trim()}\``,
          );
        }
        if (!REPO_LINK.test(text)) {
          errors.push(
            `${at}: link the entry's PR or issue, such as ([#1234](https://github.com/rjsf-team/react-jsonschema-form/pull/1234))`,
          );
        }
        if (isBreaking && guideLinks.length === 0) {
          errors.push(`${at}: link a breaking change to the upgrade guide section that says what to change`);
        }
        for (const [, major, anchor] of guideLinks) {
          if (!guideIds(major).has(anchor)) {
            errors.push(`${at}: the v${major}.x upgrade guide has no heading with the id \`${anchor}\``);
          }
        }
        const { length } = body.replace(/\]\([^)]*\)/g, ']');
        if (length > STYLE_LENGTH) {
          warnings.push(`${at}: the entry is ${length} characters; about ${STYLE_LENGTH} reads best`);
        }
      }
    }
  }
}

const publishedSource = changedFiles.find((file) => {
  const [, dir] = /^packages\/([^/]+)\/src\//.exec(file) ?? [];
  return dir !== undefined && isPublished(dir);
});
if (publishedSource && entries === 0 && process.env.CHANGELOG_SKIP !== 'true') {
  errors.push(
    `${publishedSource} changed but ${changelog} has no new entry: add one, or ask a maintainer for the \`no-changelog\` label if users can't notice the change`,
  );
}

const report = (/** @type {'error' | 'warning'} */ level, /** @type {string} */ message) =>
  console.log(process.env.GITHUB_ACTIONS ? `::${level}::${message}` : `${level}: ${message}`);
warnings.forEach((warning) => report('warning', warning));
errors.forEach((error) => report('error', error));
process.exitCode = errors.length > 0 ? 1 : 0;
