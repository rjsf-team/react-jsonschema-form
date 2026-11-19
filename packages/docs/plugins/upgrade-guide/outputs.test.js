// @ts-check
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

const {
  DEFAULT_CONFIG: {
    markdown: { parseFrontMatter },
  },
} = require('@docusaurus/core/lib/server/configValidation.js');

const { loadVersions } = require('./entries.js');
const { renderOutputs } = require('./outputs.js');
const { resolveVersions } = require('./resolve.js');
const { byHeading } = require('./vocabulary.js');

const BODY = '## Detect\n\nSomething.\n\n## Change\n\n### A step\n\nSomething.\n\n## Verify\n\nSomething.\n';

/** @param {Record<string, string>} fields frontmatter values as YAML */
function entry(fields) {
  const lines = Object.entries({
    title: 'A change',
    description: 'What changed.',
    packages: "['@rjsf/core']",
    uses: '[form]',
    affects: '[code]',
    ...fields,
  }).map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n\n${BODY}`;
}

describe('byHeading', () => {
  it('groups by the first `affects` value in heading order, deprecated entries last, skipping empty headings', () => {
    const entries = [
      { id: 'old-prop', affects: ['setup'], deprecated: true },
      { id: 'defaults', affects: ['data', 'setup'], deprecated: false },
      { id: 'esm', affects: ['setup', 'code'], deprecated: false },
      { id: 'peer', affects: ['setup'], deprecated: false },
    ];
    assert.deepEqual(
      byHeading(entries).map(({ heading, entries: listed }) => [heading.id, listed.map(({ id }) => id)]),
      [
        ['setup', ['esm', 'peer']],
        ['data', ['defaults']],
        ['deprecated', ['old-prop']],
      ],
    );
  });
});

describe('renderOutputs', () => {
  /** @type {string} */
  let siteDir;
  /** @type {Map<string, string>} */
  let files;

  before(async () => {
    siteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'upgrade-guide-outputs-'));
    const docsDir = path.join(siteDir, 'docs');
    const sources = {
      'migration-guides/v7.x upgrade guide.mdx': '# Upgrade\n',
      'migration-guides/v7/data-change.md': entry({ affects: '[data, code]', related: '[mui-change]' }),
      'migration-guides/v7/setup-change.md': entry({ affects: '[setup]', schema: '[arrays]' }),
      'migration-guides/v7/old-prop.md': entry({ affects: '[setup]', deprecated: 'true' }),
      'migration-guides/v7/mui-change.md': entry({ packages: "['@rjsf/mui']", affects: '[appearance]' }),
    };
    for (const [name, text] of Object.entries(sources)) {
      await fs.mkdir(path.dirname(path.join(docsDir, name)), { recursive: true });
      await fs.writeFile(path.join(docsDir, name), text);
    }
    const permalinks = new Map(
      Object.keys(sources).map((name) => [`@site/docs/${name}`, `/docs/${name.replace(/\.mdx?$/, '')}`]),
    );
    const versions = resolveVersions(await loadVersions(siteDir, docsDir, parseFrontMatter, siteDir), permalinks);
    files = new Map(
      renderOutputs(versions, { siteUrl: 'https://example.com/', baseUrl: '/', permalinks }).map(
        ({ dir, name, text }) => [path.posix.join(dir, name), text],
      ),
    );
  });

  after(() => fs.rm(siteDir, { recursive: true, force: true }));

  it('writes llms.txt, a copy of each entry and the combined files beside the entries', () => {
    const dir = 'docs/migration-guides/v7';
    for (const name of [
      'llms.txt',
      'data-change.md',
      'setup-change.md',
      'old-prop.md',
      'mui-change.md',
      'all.md',
      'mui.md',
    ]) {
      assert.ok(files.has(`${dir}/${name}`), `no ${dir}/${name} in ${[...files.keys()].join(', ')}`);
    }
  });

  it("lists every entry under its first `affects` value's heading, deprecated ones under Deprecations last", () => {
    const all = /** @type {string} */ (files.get('docs/migration-guides/v7/all.md'));
    assert.deepEqual(
      [...all.matchAll(/^##{1,2} (.+)$/gm)].map(([, heading]) => heading),
      [
        'Installation and build',
        'A change',
        'Form data',
        'A change',
        'Markup and styles',
        'A change',
        'Deprecations',
        'A change',
      ],
    );
    assert.ok(
      all.indexOf('source: https://example.com/docs/migration-guides/v7/setup-change.md') <
        all.indexOf('source: https://example.com/docs/migration-guides/v7/data-change.md'),
    );
  });

  it('gives each entry its facts, related links and source, and demotes its sections', () => {
    const all = /** @type {string} */ (files.get('docs/migration-guides/v7/all.md'));
    assert.match(
      all,
      /\n- packages: `@rjsf\/core`\n- uses: `form`\n- schema: `any`\n- affects: `data`, `code`\n- related: \[mui-change\]\(https:\/\/example\.com\/docs\/migration-guides\/v7\/mui-change\.md\)\n- source: https:\/\/example\.com\/docs\/migration-guides\/v7\/data-change\.md\n/,
    );
    assert.match(all, /\n- affects: `setup`\n- deprecated: `true`\n/);
    assert.match(all, /\n#### Detect\n[\s\S]*\n##### A step\n/);
  });

  it('puts each entry in llms.txt under its heading with its facts', () => {
    const llms = /** @type {string} */ (files.get('docs/migration-guides/v7/llms.txt'));
    assert.match(
      llms,
      /\n## Installation and build\n\n.+\n\n- \[A change\]\(https:\/\/example\.com\/docs\/migration-guides\/v7\/setup-change\.md\): packages: `@rjsf\/core`; uses: `form`; schema: `arrays`; affects: `setup`\. What changed\.\n/,
    );
    assert.match(
      llms,
      /\n## Deprecations\n\n.+\n\n- \[A change\]\([^)]+old-prop\.md\): .*deprecated: `true`\. What changed\.\n/,
    );
  });

  it("leaves a theme's entries out of another package's file but keeps every user's", () => {
    const mui = /** @type {string} */ (files.get('docs/migration-guides/v7/mui.md'));
    const antd = /** @type {string} */ (files.get('docs/migration-guides/v7/antd.md'));
    assert.match(mui, /source: [^\n]+mui-change\.md/);
    assert.doesNotMatch(antd, /source: [^\n]+mui-change\.md/);
    assert.match(antd, /source: [^\n]+setup-change\.md/);
  });
});
