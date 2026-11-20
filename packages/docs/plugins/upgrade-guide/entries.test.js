// @ts-check
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, describe, it } = require('node:test');

// The plugin reads entries with Docusaurus's default parser, whatever the site configures.
const { DEFAULT_PARSE_FRONT_MATTER: parseFrontMatter } = require('@docusaurus/utils');

const { headingIds, loadVersions } = require('./entries.js');
const upgradeGuidePlugin = require('./index.js');
const { resolveVersions } = require('./resolve.js');

const BODY = '## Detect\n\nSomething.\n\n## Change\n\nSomething.\n\n## Verify\n\nSomething.\n';
/** @type {Record<string, string>} */
const DEFAULTS = {
  title: 'A change',
  description: 'What changed.',
  packages: "['@rjsf/core']",
  uses: '[form]',
  affects: '[code]',
};

/**
 * @param {Record<string, string | undefined>} [fields] frontmatter values as YAML, over the defaults; `undefined` drops
 * the key
 * @param {string} [body]
 */
function entry(fields = {}, body = BODY) {
  const lines = Object.entries({ ...DEFAULTS, ...fields })
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join('\n')}\n---\n\n${body}`;
}

/** @param {string} link */
function linking(link) {
  return entry({}, BODY.replace('## Verify\n\nSomething.', `## Verify\n\nSee [it](${link}).`));
}

const roots = [];

/**
 * A site whose docs directory holds `docs` and whose v7 guide directory holds `entries`; the filtered page is there.
 * `changelog` is the site directory's `CHANGELOG-v7.md`, which `load` reads as the repository's.
 *
 * @param {Record<string, string>} entries
 * @param {Record<string, string>} [docs]
 * @param {string} [changelog]
 */
async function site(entries, docs = {}, changelog = undefined) {
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
  if (changelog !== undefined) {
    await fs.writeFile(path.join(siteDir, 'CHANGELOG-v7.md'), changelog);
  }
  return { siteDir, docsDir };
}

/** @param {{ siteDir: string; docsDir: string }} paths */
function load({ siteDir, docsDir }) {
  return loadVersions(siteDir, docsDir, parseFrontMatter, siteDir);
}

/** @param {Promise<unknown>} loading */
async function failure(loading) {
  const error = await loading.then(
    () => assert.fail('loadVersions resolved'),
    (thrown) => thrown,
  );
  assert.ok(error instanceof Error);
  return error.message;
}

after(() => Promise.all(roots.map((root) => fs.rm(root, { recursive: true, force: true }))));

describe('loadVersions', () => {
  it('loads a valid entry', async () => {
    const [version] = await load(
      await site(
        {
          'first-change.md': entry(
            { related: '[second-change]' },
            BODY.replace(
              '## Verify\n\nSomething.',
              '## Verify\n\nSee [the next](second-change.md) and [intro](../../intro.md#top).',
            ),
          ),
          'second-change.md': entry({
            packages: "['*']",
            schema: '[arrays]',
            affects: '[data, appearance]',
            deprecated: 'true',
          }),
        },
        { 'intro.md': '# Intro\n\n## Top\n' },
      ),
    );
    assert.equal(version.name, 'v7');
    assert.equal(version.number, 7);
    assert.deepEqual(
      version.entries.map(({ id, packages, schema, affects, deprecated, related }) => ({
        id,
        packages,
        schema,
        affects,
        deprecated,
        related,
      })),
      [
        {
          id: 'first-change',
          packages: ['@rjsf/core'],
          schema: [],
          affects: ['code'],
          deprecated: false,
          related: ['second-change'],
        },
        {
          id: 'second-change',
          packages: ['*'],
          schema: ['arrays'],
          affects: ['data', 'appearance'],
          deprecated: true,
          related: [],
        },
      ],
    );
  });

  it("turns `_anchors.json` values into entry lists and doc links, a doc link's hash being a heading's anchor", async () => {
    const [version] = await load(
      await site(
        {
          'first-change.md': entry(),
          'second-change.md': entry(),
          '_anchors.json': JSON.stringify({
            'old-section': 'first-change',
            both: ['first-change', 'second-change'],
            'first-change': ['first-change', 'second-change'],
            feature: '../../intro.md#the-feature-option',
            custom: '../../intro.md#custom-id',
            intro: '../../intro.md',
          }),
        },
        { 'intro.md': '# Intro\n\n## The `feature` option\n\n## Another heading {#custom-id}\n' },
      ),
    );
    assert.deepEqual(version.anchors, {
      'old-section': ['first-change'],
      both: ['first-change', 'second-change'],
      'first-change': ['first-change', 'second-change'],
    });
    assert.deepEqual(version.pageAnchors, {
      feature: { source: '@site/docs/intro.md', hash: '#the-feature-option' },
      custom: { source: '@site/docs/intro.md', hash: '#custom-id' },
      intro: { source: '@site/docs/intro.md', hash: '' },
    });
  });

  it('reads an entry and a doc an anchor links with CRLF line endings as it reads them with LF', async () => {
    const body = `${BODY}\n\`\`\`md\n## Not a section\n\`\`\`\n\n## If you can't preserve it\n\nSomething.\n`;
    const [version] = await load(
      await site(
        {
          'crlf-change.md': entry({ related: '[]' }, body).replace(/\n/g, '\r\n'),
          '_anchors.json': JSON.stringify({ top: '../../intro.md#top' }),
        },
        { 'intro.md': '---\r\ntitle: Intro\r\n---\r\n\r\n# Intro\r\n\r\n## Top\r\n' },
      ),
    );
    assert.deepEqual(version.pageAnchors, { top: { source: '@site/docs/intro.md', hash: '#top' } });
    const [loaded] = version.entries;
    assert.equal(loaded.title, 'A change');
    assert.equal(loaded.body, `\n${body}`);
    assert.doesNotMatch(loaded.frontMatter, /\r/);
  });

  describe('an invalid guide', () => {
    // Each fixture breaks one rule and is otherwise valid, so the error lists exactly one problem per rule. The one
    // `_anchors.json` breaks one rule per mapping, and the one changelog one rule per line after its first, whose
    // links all resolve.
    const BAD_ANCHORS = JSON.stringify({
      'old-section': 'gone',
      'no-heading': '../../intro.md#nowhere',
      'to-guide': '../v7.x%20upgrade%20guide.mdx',
      'to-entry-file': './all.md',
      'to-draft': '../../draft.md',
      'to-bad-escape': '../../bad%zz.md',
    });
    const docs = 'https://example.com/docs/migration-guides';
    const CHANGELOG = [
      `- See [an entry](${docs}/v7.x%20upgrade%20guide#unknown-key), [a mapping](${docs}/v7.x%20upgrade%20guide#old-section), [its page](${docs}/v7/unknown-key) and [the index](${docs}/v7/llms.txt).`,
      `- See [the guide](${docs}/v7.x%20upgrade%20guide#gone-anchor).`,
      `- See [the guide](${docs}/v7/gone-entry#detect).`,
    ].join('\n');
    const problems = {
      'unknown frontmatter key': ['unknown-key.md', entry({ extra: 'yes' }), 'unknown frontmatter field `extra`'],
      'the removed `kind` key': ['old-kind.md', entry({ kind: 'runtime' }), 'unknown frontmatter field `kind`'],
      'the removed `noticed` key': [
        'old-noticed.md',
        entry({ noticed: 'review' }),
        'unknown frontmatter field `noticed`',
      ],
      'no `affects`': [
        'affects-missing.md',
        entry({ affects: undefined }),
        '`affects` is required and must be a list of strings',
      ],
      'an empty `affects`': ['affects-empty.md', entry({ affects: '[]' }), '`affects` needs at least one value'],
      'an unknown `affects` value': [
        'affects-unknown.md',
        entry({ affects: '[runtime]' }),
        '`affects` value `runtime` is not in the vocabulary',
      ],
      'an `affects` value twice': [
        'affects-twice.md',
        entry({ affects: '[code, code]' }),
        '`affects` lists a value twice',
      ],
      'a `deprecated` other than `true`': [
        'deprecated-false.md',
        entry({ deprecated: 'false' }),
        '`deprecated` is `true` or left out',
      ],
      'reserved id': ['all.md', entry(), '`all` is a reserved id: the build writes `all.md` beside the entries'],
      'the reserved id `readme`': [
        'readme.md',
        entry(),
        "`readme` is a reserved id: Docusaurus makes `readme.md` the directory's own page",
      ],
      "the version directory's name": [
        'v7.md',
        entry(),
        "`v7` is a reserved id: Docusaurus makes `v7.md` in `v7/` the directory's own page",
      ],
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
        BAD_ANCHORS,
        '`old-section` maps to `gone`, which is not an entry',
      ],
      'an `_anchors.json` link to a heading its doc lacks': [
        '_anchors.json',
        BAD_ANCHORS,
        '`no-heading` maps to `../../intro.md#nowhere`, whose page has no heading with the anchor `#nowhere`',
      ],
      'an `_anchors.json` link to the filtered page': [
        '_anchors.json',
        BAD_ANCHORS,
        '`to-guide` maps to `../v7.x%20upgrade%20guide.mdx`, the v7 guide page itself',
      ],
      'an `_anchors.json` link to an entry file': [
        '_anchors.json',
        BAD_ANCHORS,
        "`to-entry-file` maps to `./all.md`, a file of the entries' directory; map to an entry by its id",
      ],
      'an `_anchors.json` link to a draft': [
        '_anchors.json',
        BAD_ANCHORS,
        '`to-draft` maps to `../../draft.md`, `docs/draft.md`, which is a draft',
      ],
      'an `_anchors.json` link with a malformed `%` escape': [
        '_anchors.json',
        BAD_ANCHORS,
        '`to-bad-escape` maps to `../../bad%zz.md`, which has a malformed `%` escape',
      ],
      'a changelog link to an anchor nothing maps': [
        'CHANGELOG-v7.md:2',
        CHANGELOG,
        'the link `migration-guides/v7.x%20upgrade%20guide#gone-anchor` names neither an entry of v7 nor an `_anchors.json` key',
      ],
      "a changelog link to a page that isn't an entry's": [
        'CHANGELOG-v7.md:3',
        CHANGELOG,
        'the link `migration-guides/v7/gone-entry` names neither an entry of v7 nor an `_anchors.json` key',
      ],
    };
    /** @type {string} */
    let message;

    before(async () => {
      const paths = await site(
        Object.fromEntries(
          Object.values(problems)
            .filter(([name]) => !name.startsWith('CHANGELOG'))
            .map(([name, text]) => [name, text]),
        ),
        {
          '_partial.md': '# Partial\n',
          'draft.md': '---\ndraft: true\n---\n\n# Draft\n',
          'intro.md': '# Intro\n\n## Top\n',
        },
        CHANGELOG,
      );
      // Beside the docs directory, not in it.
      await fs.writeFile(path.join(paths.siteDir, 'README.md'), '');
      message = await failure(load(paths));
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

describe('headingIds', () => {
  it("gives each heading outside code and frontmatter Docusaurus's anchor", () => {
    assert.deepEqual(
      headingIds(
        [
          '---',
          '# a YAML comment',
          '---',
          '# Intro',
          '## Repeat',
          '## Repeat',
          '## [Linked](other.md) text',
          '## Foo & `bar`',
          '## Mine {#my-id}',
          '```md',
          '## In code',
          '```',
        ].join('\n'),
      ),
      ['intro', 'repeat', 'repeat-1', 'linked-text', 'foo--bar', 'my-id'],
    );
  });
});

describe('resolveVersions', () => {
  it('fails on an `_anchors.json` doc link the docs plugin made no page of', async () => {
    const content = await load(await site({ 'a-change.md': entry() }));
    content[0].pageAnchors = { gone: { source: '@site/docs/gone.md', hash: '' } };
    const permalinks = new Map([
      ['@site/docs/migration-guides/v7/a-change.md', '/migration-guides/v7/a-change'],
      ['@site/docs/migration-guides/v7.x upgrade guide.mdx', '/migration-guides/v7.x upgrade guide'],
    ]);
    assert.throws(
      () => resolveVersions(content, permalinks),
      /made no page of @site\/docs\/gone\.md, which `_anchors\.json` maps #gone to/,
    );
  });
});

describe('the page data', () => {
  it("carries each entry's facts in heading order and resolves the anchors that go to other docs", async () => {
    const { siteDir } = await site(
      {
        'first-change.md': entry({ related: '[second-change]', affects: '[data, setup]' }),
        'second-change.md': entry({ affects: '[setup]' }),
        'third-change.md': entry({ affects: '[setup]', deprecated: 'true' }),
        '_anchors.json': JSON.stringify({ 'old-section': 'second-change', feature: '../../intro.md#the-feature' }),
      },
      { 'intro.md': '# Intro\n\n## The feature\n' },
    );
    const plugin = upgradeGuidePlugin(
      /** @type {any} */ ({
        siteDir,
        baseUrl: '/',
        siteConfig: { url: 'https://example.com' },
      }),
    );
    const content = /** @type {any} */ (await plugin.loadContent?.());
    const sources = [
      '@site/docs/intro.md',
      '@site/docs/migration-guides/v7.x upgrade guide.mdx',
      ...content[0].entries.map((/** @type {{ source: string }} */ { source }) => source),
    ];
    /** @type {Record<string, any>} */
    const created = {};
    await plugin.allContentLoaded?.(
      /** @type {any} */ ({
        allContent: {
          'rjsf-upgrade-guide': { default: content },
          'docusaurus-plugin-content-docs': {
            default: {
              loadedVersions: [
                {
                  docs: sources.map((source) => ({
                    source,
                    permalink: source.replace(/^@site\/docs/, '').replace(/\.mdx?$/, ''),
                  })),
                },
              ],
            },
          },
        },
        actions: {
          createData: async (/** @type {string} */ name, /** @type {string} */ data) => {
            created[name] = JSON.parse(data);
          },
        },
      }),
    );
    const guide = created['v7.json'];
    assert.deepEqual(
      guide.entries.map(
        (/** @type {{ id: string; affects: string[]; deprecated: boolean; related: string[] }} */ entry) => [
          entry.id,
          entry.affects,
          entry.deprecated,
          entry.related,
        ],
      ),
      [
        ['second-change', ['setup'], false, []],
        ['third-change', ['setup'], true, []],
        ['first-change', ['data', 'setup'], false, ['second-change']],
      ],
    );
    assert.deepEqual(guide.anchors, { 'old-section': ['second-change'] });
    assert.deepEqual(guide.pageAnchors, { feature: '/intro#the-feature' });
  });
});
