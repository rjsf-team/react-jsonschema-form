// @ts-check
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

// The site configures no `markdown.parseFrontMatter`, so in production the plugin gets this default.
const {
  DEFAULT_CONFIG: {
    markdown: { parseFrontMatter },
  },
} = require('@docusaurus/core/lib/server/configValidation.js');

const { loadVersions } = require('./entries.js');

const BODY = '## Detect\n\nSomething.\n\n## Change\n\nSomething.\n\n## Verify\n\nSomething.\n';
/** @type {Record<string, string>} */
const DEFAULTS = {
  title: 'A change',
  description: 'What changed.',
  packages: "['@rjsf/core']",
  uses: '[form]',
  kind: 'runtime',
  noticed: 'review',
};

/**
 * @param {Record<string, string>} [fields] frontmatter values as YAML, over the defaults
 * @param {string} [body]
 */
function entry(fields = {}, body = BODY) {
  const lines = Object.entries({ ...DEFAULTS, ...fields }).map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

/** @param {string} link */
function linking(link) {
  return entry({}, BODY.replace('## Verify\n\nSomething.', `## Verify\n\nSee [it](${link}).`));
}

const roots = [];

/**
 * A site whose docs directory holds `docs` and whose v7 guide directory holds `entries`; the filtered page is there.
 *
 * @param {Record<string, string>} entries
 * @param {Record<string, string>} [docs]
 */
async function site(entries, docs = {}) {
  const siteDir = await fs.mkdtemp(path.join(os.tmpdir(), 'upgrade-guide-'));
  roots.push(siteDir);
  const docsDir = path.join(siteDir, 'docs');
  const files = {
    'migration-guides/v7.x upgrade guide.mdx': '# Upgrade\n',
    ...docs,
    ...Object.fromEntries(Object.entries(entries).map(([name, text]) => [`migration-guides/v7/${name}`, text])),
  };
  for (const [name, text] of Object.entries(files)) {
    await fs.mkdir(path.dirname(path.join(docsDir, name)), { recursive: true });
    await fs.writeFile(path.join(docsDir, name), text);
  }
  return { siteDir, docsDir };
}

after(() => Promise.all(roots.map((root) => fs.rm(root, { recursive: true, force: true }))));

describe('loadVersions', () => {
  it('loads a valid entry', async () => {
    const { siteDir, docsDir } = await site(
      {
        'first-change.md': entry(
          { related: '[second-change]' },
          BODY.replace(
            '## Verify\n\nSomething.',
            '## Verify\n\nSee [the next](second-change.md) and [intro](../../intro.md#top).',
          ),
        ),
        'second-change.md': entry({ packages: "['*']", schema: '[arrays]' }),
        '_anchors.json': JSON.stringify({ 'old-section': 'first-change', both: ['first-change', 'second-change'] }),
      },
      { 'intro.md': '# Intro\n' },
    );
    const [version] = await loadVersions(siteDir, docsDir, parseFrontMatter);
    assert.equal(version.name, 'v7');
    assert.equal(version.number, 7);
    assert.deepEqual(
      version.entries.map(({ id, packages, schema, related }) => ({ id, packages, schema, related })),
      [
        { id: 'first-change', packages: ['@rjsf/core'], schema: [], related: ['second-change'] },
        { id: 'second-change', packages: ['*'], schema: ['arrays'], related: [] },
      ],
    );
    assert.deepEqual(version.anchors, { 'old-section': ['first-change'], both: ['first-change', 'second-change'] });
  });

  describe('an invalid guide', () => {
    // Each fixture breaks one rule and is otherwise valid, so the error lists exactly one problem per rule.
    const problems = {
      'unknown frontmatter key': ['unknown-key.md', entry({ extra: 'yes' }), 'unknown frontmatter field `extra`'],
      'reserved id': ['all.md', entry(), '`all` is a reserved id'],
      '`related` to an unknown id': [
        'related-unknown.md',
        entry({ related: '[nowhere]' }),
        '`related` names `nowhere`, which is not an entry',
      ],
      '`*` beside another package': [
        'star-and-core.md',
        entry({ packages: "['*', '@rjsf/core']" }),
        "`packages: ['*']` already means every package",
      ],
      'a backtick in the title': [
        'title-backtick.md',
        entry({ title: "'Renames `foo`'" }),
        '`title` is plain text, with no backtick',
      ],
      'a description over 260 chars': [
        'long-description.md',
        entry({ description: `'${'a'.repeat(261)}'` }),
        '`description` is 261 chars; the limit is 260',
      ],
      'sections out of order': [
        'sections-out-of-order.md',
        entry({}, '## Change\n\nSomething.\n\n## Detect\n\nSomething.\n\n## Verify\n\nSomething.\n'),
        'the `##` sections are "Change", "Detect", "Verify"',
      ],
      'a link to the filtered page': [
        'links-guide-page.md',
        linking('../v7.x%20upgrade%20guide.mdx#some-section'),
        'goes to the v7 guide page',
      ],
      'a link to a `.md` outside the docs directory': [
        'links-outside-docs.md',
        linking('../../../README.md'),
        '`README.md`, which is outside the docs directory',
      ],
      'a link to a `_` file': [
        'links-partial.md',
        linking('../../_partial.md'),
        'which the docs plugin skips as a `_` file or directory',
      ],
      'a link to a draft': ['links-draft.md', linking('../../draft.md'), 'which is a draft'],
      'a link to a missing doc': ['links-missing.md', linking('../../missing.md'), "which doesn't exist"],
      'a malformed `%` escape': [
        'links-malformed.md',
        linking('bad%zz.md'),
        'the link `bad%zz.md` has a malformed `%` escape',
      ],
      'a bad `_anchors.json` target': [
        '_anchors.json',
        JSON.stringify({ 'old-section': 'gone' }),
        '`old-section` maps to `gone`, which is not an entry',
      ],
    };
    /** @type {string} */
    let message;

    before(async () => {
      const { siteDir, docsDir } = await site(
        Object.fromEntries(Object.values(problems).map(([name, text]) => [name, text])),
        {
          '_partial.md': '# Partial\n',
          'draft.md': '---\ndraft: true\n---\n\n# Draft\n',
        },
      );
      // Beside the docs directory, not in it.
      await fs.writeFile(path.join(siteDir, 'README.md'), '');
      const error = await loadVersions(siteDir, docsDir, parseFrontMatter).then(
        () => assert.fail('loadVersions resolved'),
        (thrown) => thrown,
      );
      assert.ok(error instanceof Error);
      message = error.message;
    });

    it('lists every problem in one error', () => {
      assert.match(message, new RegExp(`^The upgrade guide has ${Object.keys(problems).length} problems:\n`));
      assert.equal(message.split('\n  - ').length - 1, Object.keys(problems).length);
    });

    for (const [rule, [name, , expected]] of Object.entries(problems)) {
      it(`reports ${rule}`, () => {
        const line = message.split('\n').find((candidate) => candidate.includes(expected));
        assert.ok(line, `no problem says ${JSON.stringify(expected)} in:\n${message}`);
        assert.ok(line.includes(name), `the problem names ${name}: ${line}`);
      });
    }
  });
});
