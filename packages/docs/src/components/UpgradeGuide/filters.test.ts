import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CORE_ONLY,
  NO_FILTERS,
  badgeOf,
  describeFilters,
  fetchMarkdown,
  hashTarget,
  mapConcurrently,
  isNarrowed,
  matcher,
  opensMore,
  readFilters,
  relatedLinks,
  toMarkdownDocument,
  toggled,
  writeFilters,
  type Entry,
  type Filters,
  type Guide,
} from './filters.ts';

const guide: Guide = {
  uses: [
    { id: 'form', label: 'Renders a form', detect: '' },
    { id: 'typescript', label: 'TypeScript', detect: '' },
    { id: 'markup', label: 'Markup', detect: '' },
    { id: 'custom-widgets', label: 'Custom widgets', chip: 'Widgets', detect: '' },
    { id: 'custom-fields', label: 'Custom fields', chip: 'Fields', detect: '' },
  ],
  everyUserUse: 'form',
  schema: [
    { id: 'arrays', label: 'Arrays', detect: '' },
    { id: 'refs', label: 'References', detect: '' },
  ],
  packages: [
    { id: '*', short: '*', group: 'always', removed: false },
    { id: '@rjsf/core', short: 'core', group: 'always', removed: false },
    { id: '@rjsf/utils', short: 'utils', group: 'always', removed: false },
    { id: '@rjsf/mui', short: 'mui', group: 'theme', removed: false },
    { id: '@rjsf/antd', short: 'antd', group: 'theme', removed: false },
    { id: '@rjsf/validator-ajv8', short: 'validator-ajv8', group: 'validator', removed: false },
    { id: '@rjsf/validator-ata', short: 'validator-ata', group: 'validator', removed: false },
    { id: '@rjsf/snapshot-tests', short: 'snapshot-tests', group: 'other', removed: false },
  ],
  entries: [],
  anchors: {},
  pageAnchors: {},
  llmsTxt: '',
  combined: {},
};

function entry(fields: Partial<Entry>): Entry {
  return {
    id: 'an-entry',
    title: 'An entry',
    description: '',
    packages: ['@rjsf/core'],
    uses: ['typescript'],
    schema: [],
    affects: ['code'],
    deprecated: false,
    related: [],
    permalink: '/an-entry',
    ...fields,
  };
}

describe('hashTarget', () => {
  const esm = entry({ id: 'esm-only-packages', title: 'ESM only' });
  const umd = entry({ id: 'umd-bundles-removed', title: 'No UMD' });
  const seed = entry({ id: 'reset-goes-back-to-the-seed', title: 'Reset' });
  const withAnchors: Guide = {
    ...guide,
    entries: [esm, umd, seed],
    anchors: {
      'esm-only-packages': ['esm-only-packages', 'umd-bundles-removed'],
      'reset-goes-back-to-the-seed': ['reset-goes-back-to-the-seed'],
      'old-umd-section': ['umd-bundles-removed'],
    },
    pageAnchors: { transformchange: '/docs/migration-guides/whats-new-v7#working-with-form-data' },
  };

  it('lists every entry a mapping names, even when the anchor is also an entry id', () => {
    assert.deepEqual(hashTarget(withAnchors, 'esm-only-packages'), { kind: 'entries', entries: [esm, umd] });
  });

  it('opens the entry an id names when no mapping has it', () => {
    assert.deepEqual(hashTarget(withAnchors, 'umd-bundles-removed'), { kind: 'entry', entry: umd });
  });

  it('opens the entry a mapping to its own id names', () => {
    assert.deepEqual(hashTarget(withAnchors, 'reset-goes-back-to-the-seed'), { kind: 'entry', entry: seed });
  });

  it('moves a mapping to one other entry to its id', () => {
    assert.deepEqual(hashTarget(withAnchors, 'old-umd-section'), { kind: 'moved', id: 'umd-bundles-removed' });
  });

  it('goes to the doc a page mapping names', () => {
    assert.deepEqual(hashTarget(withAnchors, 'transformchange'), {
      kind: 'page',
      url: '/docs/migration-guides/whats-new-v7#working-with-form-data',
    });
  });

  it('goes to the doc a page mapping names even when the anchor is also an entry id', () => {
    assert.deepEqual(
      hashTarget({ ...withAnchors, pageAnchors: { 'umd-bundles-removed': '/x' } }, 'umd-bundles-removed'),
      {
        kind: 'page',
        url: '/x',
      },
    );
  });

  it('names nothing for an unknown or empty hash', () => {
    assert.equal(hashTarget(withAnchors, 'nowhere'), undefined);
    assert.equal(hashTarget(withAnchors, ''), undefined);
  });
});

describe('toMarkdownDocument', () => {
  const page = { url: 'https://example.com/guide?theme=mui', origin: 'https://example.com' };

  it("leaves out each `.md` copy's frontmatter", () => {
    const markdown = toMarkdownDocument(
      [entry({ title: 'Widgets get ids', description: 'Ids change.' })],
      ['---\ntitle: Widgets get ids\nuses: [form]\n---\n\n## Detect\n\nIds.\n'],
      'v7',
      page,
    );
    assert.doesNotMatch(markdown, /uses: \[form\]/);
    assert.match(markdown, /Ids change\.\n\n## Detect\n\nIds\.\n$/);
  });

  it("cites the page and lists each entry's affects, deprecation, packages and source", () => {
    const markdown = toMarkdownDocument(
      [
        entry({
          permalink: '/docs/v7/old-prop',
          affects: ['data', 'code'],
          deprecated: true,
          packages: ['@rjsf/core', '@rjsf/mui'],
        }),
      ],
      ['## Detect\n'],
      'v7',
      page,
    );
    assert.match(
      markdown,
      /^> react-jsonschema-form v7 upgrade guide: the 1 entry that matches https:\/\/example\.com\/guide\?theme=mui,/,
    );
    assert.match(
      markdown,
      /\n- affects: `data`, `code`; deprecated\n- packages: `@rjsf\/core`, `@rjsf\/mui`\n- source: https:\/\/example\.com\/docs\/v7\/old-prop\.md\n/,
    );
  });
});

describe('fetchMarkdown', () => {
  const rows = [
    entry({ id: 'a', title: 'A', permalink: '/v7/a' }),
    entry({ id: 'b', title: 'B', permalink: '/v7/b/' }),
  ];
  const page = { url: 'https://example.com/guide', origin: 'https://example.com' };

  it("joins the rows' `.md` copies in the rows' order", async () => {
    const fetched: string[] = [];
    const markdown = await fetchMarkdown(rows, 'v7', page, async (url) => {
      fetched.push(url);
      return new Response(`## Detect\n\nFrom ${url}.\n`);
    });
    assert.deepEqual(fetched, ['https://example.com/v7/a.md', 'https://example.com/v7/b.md']);
    assert.ok(
      markdown.indexOf('From https://example.com/v7/a.md.') < markdown.indexOf('From https://example.com/v7/b.md.'),
    );
  });

  it('fails naming the copy that answered with an error', async () => {
    await assert.rejects(
      fetchMarkdown(rows, 'v7', page, async () => new Response('', { status: 404 })),
      /https:\/\/example\.com\/v7\/a\.md answered 404/,
    );
  });
});

describe('mapConcurrently', () => {
  it('keeps at most `limit` calls in flight and the results in order', async () => {
    const pending: { item: number; settle: () => Promise<number> }[] = [];
    let inFlight = 0;
    let most = 0;
    const results = mapConcurrently([1, 2, 3, 4, 5], 2, (item) => {
      inFlight += 1;
      most = Math.max(most, inFlight);
      const { promise, resolve } = Promise.withResolvers<number>();
      pending.push({
        item,
        settle: () => {
          inFlight -= 1;
          resolve(item * 10);
          return promise;
        },
      });
      return promise;
    });
    // Settling the newest call first finishes the items out of order; a worker starts its next call before the
    // awaited settle resumes this loop.
    const settledOrder: number[] = [];
    while (pending.length > 0) {
      const next = pending.pop()!;
      settledOrder.push(next.item);
      await next.settle();
    }
    assert.deepEqual(settledOrder, [2, 3, 4, 5, 1]);
    assert.equal(most, 2);
    assert.deepEqual(await results, [10, 20, 30, 40, 50]);
  });
});

describe('matcher', () => {
  it('shows every entry while everything is selected', () => {
    const entries = [
      entry({ packages: ['@rjsf/mui'], uses: ['markup'], schema: ['refs'] }),
      entry({ packages: ['@rjsf/validator-ata'], uses: ['custom-fields'] }),
      entry({ packages: ['@rjsf/snapshot-tests'], uses: ['custom-widgets'], schema: ['arrays'] }),
      entry({ uses: ['form'] }),
    ];
    assert.deepEqual(entries.filter(matcher(guide, NO_FILTERS)), entries);
  });

  const cases: [string, Partial<Entry>, Partial<Filters>, boolean][] = [
    ['`*` shows whatever theme is chosen', { packages: ['*'] }, { theme: 'mui' }, true],
    ['`@rjsf/core` shows whatever theme is chosen', { packages: ['@rjsf/core'] }, { theme: 'mui' }, true],
    [
      '`@rjsf/utils` shows whatever validator is chosen',
      { packages: ['@rjsf/utils'] },
      { validator: 'validator-ata' },
      true,
    ],
    ['a theme shows when chosen', { packages: ['@rjsf/mui'] }, { theme: 'mui' }, true],
    ['a theme is hidden when another is chosen', { packages: ['@rjsf/mui'] }, { theme: 'antd' }, false],
    [
      'a theme shows under All themes when a validator is chosen',
      { packages: ['@rjsf/mui'] },
      { validator: 'validator-ata' },
      true,
    ],
    ['a validator shows when chosen', { packages: ['@rjsf/validator-ata'] }, { validator: 'validator-ata' }, true],
    [
      'a validator is hidden when another is chosen',
      { packages: ['@rjsf/validator-ata'] },
      { validator: 'validator-ajv8' },
      false,
    ],
    [
      'an other package is hidden once a theme is chosen',
      { packages: ['@rjsf/snapshot-tests'] },
      { theme: 'mui' },
      false,
    ],
    [
      'an other package is hidden once a validator is chosen',
      { packages: ['@rjsf/snapshot-tests'] },
      { validator: 'validator-ata' },
      false,
    ],
    [
      'an other package shows when ticked',
      { packages: ['@rjsf/snapshot-tests'] },
      { theme: 'mui', other: ['snapshot-tests'] },
      true,
    ],
    ['Core only hides an entry for one theme', { packages: ['@rjsf/mui'] }, { theme: CORE_ONLY }, false],
    [
      'Core only hides an entry for themes alone',
      { packages: ['@rjsf/mui', '@rjsf/antd'] },
      { theme: CORE_ONLY },
      false,
    ],
    [
      'Core only keeps an entry for core and a theme',
      { packages: ['@rjsf/core', '@rjsf/mui'] },
      { theme: CORE_ONLY },
      true,
    ],
    ['Core only keeps a validator entry', { packages: ['@rjsf/validator-ata'] }, { theme: CORE_ONLY }, true],
    ['Core only keeps an other package entry', { packages: ['@rjsf/snapshot-tests'] }, { theme: CORE_ONLY }, true],
    [
      'Core only beside a validator still hides another validator',
      { packages: ['@rjsf/validator-ajv8'] },
      { theme: CORE_ONLY, validator: 'validator-ata' },
      false,
    ],
    [
      'deselecting a chip hides an entry whose only use it is',
      { uses: ['custom-widgets'] },
      { without: ['custom-widgets'] },
      false,
    ],
    [
      'deselecting a chip keeps an entry with another use still selected',
      { uses: ['custom-widgets', 'custom-fields'] },
      { without: ['custom-widgets'] },
      true,
    ],
    [
      'deselecting every use of an entry hides it',
      { uses: ['custom-widgets', 'typescript'] },
      { without: ['custom-widgets', 'typescript'] },
      false,
    ],
    ['deselecting a chip keeps other entries', { uses: ['custom-fields'] }, { without: ['custom-widgets'] }, true],
    [
      'a `form` entry stays whatever is deselected',
      { uses: ['form', 'custom-widgets'] },
      { without: ['custom-widgets', 'custom-fields', 'typescript', 'markup'] },
      true,
    ],
    [
      'deselecting a More use hides an entry whose only use it is',
      { uses: ['typescript'] },
      { without: ['typescript'] },
      false,
    ],
    [
      'deselecting a More use keeps an entry with a chip still selected',
      { uses: ['typescript', 'custom-fields'] },
      { without: ['typescript'] },
      true,
    ],
    [
      'an entry with no schema shows whatever schema is deselected',
      { schema: [] },
      { noSchema: ['arrays', 'refs'] },
      true,
    ],
    [
      'deselecting a schema feature hides an entry listing only it',
      { schema: ['arrays'] },
      { noSchema: ['arrays'] },
      false,
    ],
    [
      'deselecting a schema feature keeps an entry listing another',
      { schema: ['arrays', 'refs'] },
      { noSchema: ['arrays'] },
      true,
    ],
    [
      'deselecting every schema feature an entry lists hides it, even a `form` entry',
      { uses: ['form'], schema: ['arrays', 'refs'] },
      { noSchema: ['arrays', 'refs'] },
      false,
    ],
    ['a search token matches the title, ignoring case', { title: 'Widgets get ids' }, { search: 'WIDGETS' }, true],
    ['a search token matches the description', { description: 'Use `idPrefix`.' }, { search: 'idprefix' }, true],
    ['a search token matches the id', { id: 'mui-slot-props' }, { search: 'slot-props' }, true],
    [
      'every search token must match somewhere',
      { id: 'mui-slot-props', title: 'Slot props win' },
      { search: '  mui   win ' },
      true,
    ],
    ['a search token that matches nothing hides', { title: 'Slot props win' }, { search: 'slot lose' }, false],
    ['a blank search hides nothing', {}, { search: '   ' }, true],
    [
      'every clause must hold: uses and schema still selected, package wrong',
      { packages: ['@rjsf/antd'], uses: ['custom-widgets'], schema: ['arrays'] },
      { theme: 'mui', without: ['custom-fields'], noSchema: ['refs'] },
      false,
    ],
  ];
  for (const [name, fields, filterFields, expected] of cases) {
    it(name, () => {
      assert.equal(matcher(guide, { ...NO_FILTERS, ...filterFields })(entry(fields)), expected);
    });
  }
});

describe('the filter bar', () => {
  it('toggled deselects a selected value and selects it again', () => {
    assert.deepEqual(toggled(['typescript'], 'custom-widgets'), ['typescript', 'custom-widgets']);
    assert.deepEqual(toggled(['typescript', 'custom-widgets'], 'typescript'), ['custom-widgets']);
  });

  it('offers Clear once anything differs from everything selected and all themes', () => {
    assert.equal(isNarrowed(NO_FILTERS), false);
    assert.equal(isNarrowed({ ...NO_FILTERS, search: '  ' }), false);
    assert.equal(isNarrowed({ ...NO_FILTERS, theme: CORE_ONLY }), true);
    assert.equal(isNarrowed({ ...NO_FILTERS, without: ['custom-widgets'] }), true);
    assert.equal(isNarrowed({ ...NO_FILTERS, noSchema: ['refs'] }), true);
  });

  it('More filters starts open only when something inside it is changed', () => {
    assert.equal(opensMore(guide, NO_FILTERS), false);
    assert.equal(opensMore(guide, { ...NO_FILTERS, theme: 'mui', without: ['custom-widgets'] }), false);
    assert.equal(opensMore(guide, { ...NO_FILTERS, validator: 'validator-ata' }), true);
    assert.equal(opensMore(guide, { ...NO_FILTERS, noSchema: ['refs'] }), true);
    assert.equal(opensMore(guide, { ...NO_FILTERS, other: ['snapshot-tests'] }), true);
    assert.equal(opensMore(guide, { ...NO_FILTERS, without: ['custom-widgets', 'typescript'] }), true);
  });

  it('badges an entry only for exactly one theme or validator', () => {
    const packagesById = new Map(guide.packages.map((pkg) => [pkg.id, pkg]));
    const badge = (packages: string[]) => badgeOf(entry({ packages }), packagesById)?.short;
    assert.equal(badge(['@rjsf/mui']), 'mui');
    assert.equal(badge(['@rjsf/validator-ata']), 'validator-ata');
    assert.equal(badge(['@rjsf/mui', '@rjsf/antd']), undefined);
    assert.equal(badge(['@rjsf/core']), undefined);
    assert.equal(badge(['@rjsf/snapshot-tests']), undefined);
  });
});

describe('relatedLinks', () => {
  it("links each related id beside the entry's page, titled from the version's docs", () => {
    assert.deepEqual(
      relatedLinks({ id: 'migration-guides/v7/a', permalink: '/docs/migration-guides/v7/a/' }, ['b', 'c'], {
        'migration-guides/v7/b': { title: 'B changed' },
        'migration-guides/v7/c': { title: 'C changed' },
      }),
      [
        { id: 'b', title: 'B changed', permalink: '/docs/migration-guides/v7/b' },
        { id: 'c', title: 'C changed', permalink: '/docs/migration-guides/v7/c' },
      ],
    );
  });
});

describe('describeFilters', () => {
  it('says every change shows while everything is selected', () => {
    assert.equal(
      describeFilters(NO_FILTERS, guide),
      "Showing every change. Deselect what your app doesn't do to hide its changes.",
    );
  });

  it('names the deselected uses and schema features, and how to bring them back', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, without: ['custom-fields', 'typescript'], noSchema: ['refs'] }, guide),
      'Hiding changes for TypeScript, custom fields and References. Select them again, or Clear, to bring them back.',
    );
  });

  it('names three hidden things and counts the rest', () => {
    assert.equal(
      describeFilters(
        {
          ...NO_FILTERS,
          without: ['typescript', 'markup', 'custom-widgets', 'custom-fields'],
          noSchema: ['arrays', 'refs'],
        },
        guide,
      ),
      'Hiding changes for TypeScript, Markup, custom widgets and 3 more. Select them again, or Clear, to bring them back.',
    );
  });

  it('names the theme picked, the search and what is hidden, but no unticked theme author package', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, theme: 'mui', noSchema: ['arrays'], search: ' slot ' }, guide),
      'Showing changes for `@rjsf/mui` matching "slot", hiding changes for Arrays. Select them again, or Clear, to bring them back.',
    );
  });

  it('names Core only', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, theme: CORE_ONLY }, guide),
      'Showing changes for core only. Clear shows every change.',
    );
  });

  it('names a validator and a ticked theme author package once they change the list', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, validator: 'validator-ata', other: ['snapshot-tests'] }, guide),
      'Showing changes for `@rjsf/validator-ata` and `@rjsf/snapshot-tests`. Clear shows every change.',
    );
    assert.equal(
      describeFilters({ ...NO_FILTERS, other: ['snapshot-tests'] }, guide),
      "Showing every change. Deselect what your app doesn't do to hide its changes.",
    );
  });

  it('names a search alone', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, search: 'ids' }, guide),
      'Showing changes matching "ids". Clear shows every change.',
    );
  });
});

describe('readFilters and writeFilters', () => {
  it('round-trip every deselection, the packages and the search', () => {
    const filters: Filters = {
      theme: 'mui',
      validator: 'validator-ajv8',
      without: ['custom-fields', 'typescript'],
      noSchema: ['refs'],
      other: ['snapshot-tests'],
      search: 'slot props & ids',
    };
    const search = writeFilters(filters);
    assert.equal(
      search,
      '?theme=mui&validator=validator-ajv8&without=custom-fields,typescript&no-schema=refs&other=snapshot-tests&q=slot%20props%20%26%20ids',
    );
    assert.deepEqual(readFilters(search, guide), filters);
  });

  it('round-trip Core only', () => {
    const filters: Filters = { ...NO_FILTERS, theme: CORE_ONLY };
    assert.equal(writeFilters(filters), '?theme=core');
    assert.deepEqual(readFilters('?theme=core', guide), filters);
  });

  it('ignore unknown and old params and values the vocabulary does not have', () => {
    assert.deepEqual(
      readFilters(
        '?theme=bulma&without=typescript,unknown,form&no-schema=nope&uses=markup&customized=none&schema=refs&noticed=review',
        guide,
      ),
      { ...NO_FILTERS, without: ['typescript'] },
    );
  });

  it('write no query while everything is selected', () => {
    assert.equal(writeFilters(NO_FILTERS), '');
    assert.deepEqual(readFilters('', guide), NO_FILTERS);
  });
});
