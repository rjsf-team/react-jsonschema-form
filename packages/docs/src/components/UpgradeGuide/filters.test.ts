import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NO_FILTERS,
  badgeOf,
  describeFilters,
  fetchMarkdown,
  hashTarget,
  mapConcurrently,
  matcher,
  opensMore,
  readFilters,
  relatedLinks,
  toMarkdownDocument,
  toggleNothing,
  toggleUse,
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
  const cases: [string, Partial<Entry>, Partial<Filters>, boolean][] = [
    ['nothing answered shows a theme entry', { packages: ['@rjsf/mui'], uses: ['markup'], schema: ['refs'] }, {}, true],
    ['nothing answered shows a validator entry', { packages: ['@rjsf/validator-ata'] }, {}, true],
    ['nothing answered shows an other package entry', { packages: ['@rjsf/snapshot-tests'] }, {}, true],
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
    ['the Nothing chip hides a customization entry', { uses: ['custom-widgets'] }, { nothing: true }, false],
    ['the Nothing chip keeps an entry of an unanswered More use', { uses: ['typescript'] }, { nothing: true }, true],
    ['the Nothing chip keeps a `form` entry', { uses: ['form', 'custom-widgets'] }, { nothing: true }, true],
    [
      'the Nothing chip and a More use hide an entry of another More use',
      { uses: ['markup'] },
      { nothing: true, uses: ['typescript'] },
      false,
    ],
    [
      'the Nothing chip keeps an entry of a ticked More use',
      { uses: ['typescript'] },
      { nothing: true, uses: ['typescript'] },
      true,
    ],
    ['a chip shows its entries', { uses: ['custom-widgets'] }, { uses: ['custom-widgets'] }, true],
    ['a chip hides another customization', { uses: ['custom-fields'] }, { uses: ['custom-widgets'] }, false],
    ['a chip keeps an entry of an unanswered More use', { uses: ['typescript'] }, { uses: ['custom-widgets'] }, true],
    ['a chip keeps a `form` entry', { uses: ['form'] }, { uses: ['custom-widgets'] }, true],
    ['a More checkbox shows its entries', { uses: ['markup'] }, { uses: ['markup'] }, true],
    ['a More checkbox hides an entry of another More use', { uses: ['typescript'] }, { uses: ['markup'] }, false],
    [
      'a More checkbox keeps a customization entry while the chips are unanswered',
      { uses: ['custom-widgets'] },
      { uses: ['markup'] },
      true,
    ],
    [
      'a chip and a More checkbox each hide the other uses of their question',
      { uses: ['custom-fields', 'typescript'] },
      { uses: ['custom-widgets', 'markup'] },
      false,
    ],
    [
      'an entry stays when one of its uses holds',
      { uses: ['custom-fields', 'markup'] },
      { uses: ['custom-widgets', 'markup'] },
      true,
    ],
    ['an entry with no schema shows whatever schema is ticked', { schema: [] }, { schema: ['refs'] }, true],
    ['a ticked schema shows its entries', { schema: ['arrays', 'refs'] }, { schema: ['refs'] }, true],
    ['an unticked schema is hidden', { schema: ['arrays'] }, { schema: ['refs'] }, false],
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
      'every clause must hold: uses and schema answered and matching, package wrong',
      { packages: ['@rjsf/antd'], uses: ['custom-widgets'], schema: ['arrays'] },
      { theme: 'mui', uses: ['custom-widgets'], schema: ['arrays'] },
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
  it('Nothing unticks the chips and keeps the More uses', () => {
    assert.deepEqual(toggleNothing(guide, { ...NO_FILTERS, uses: ['custom-widgets', 'typescript'] }), {
      ...NO_FILTERS,
      nothing: true,
      uses: ['typescript'],
    });
  });

  it('Nothing pressed again unticks itself and nothing else', () => {
    assert.deepEqual(toggleNothing(guide, { ...NO_FILTERS, nothing: true, uses: ['typescript'] }), {
      ...NO_FILTERS,
      uses: ['typescript'],
    });
  });

  it('a chip ticked unticks Nothing', () => {
    assert.deepEqual(toggleUse(guide, { ...NO_FILTERS, nothing: true }, 'custom-widgets'), {
      ...NO_FILTERS,
      uses: ['custom-widgets'],
    });
  });

  it('a chip unticked leaves the other uses', () => {
    assert.deepEqual(toggleUse(guide, { ...NO_FILTERS, uses: ['custom-widgets', 'markup'] }, 'custom-widgets'), {
      ...NO_FILTERS,
      uses: ['markup'],
    });
  });

  it('a More use ticked keeps Nothing', () => {
    assert.deepEqual(toggleUse(guide, { ...NO_FILTERS, nothing: true }, 'typescript'), {
      ...NO_FILTERS,
      nothing: true,
      uses: ['typescript'],
    });
  });

  it('More starts open only when it holds an answer', () => {
    assert.equal(opensMore(guide, NO_FILTERS), false);
    assert.equal(opensMore(guide, { ...NO_FILTERS, theme: 'mui', nothing: true, uses: ['custom-widgets'] }), false);
    assert.equal(opensMore(guide, { ...NO_FILTERS, validator: 'validator-ata' }), true);
    assert.equal(opensMore(guide, { ...NO_FILTERS, schema: ['refs'] }), true);
    assert.equal(opensMore(guide, { ...NO_FILTERS, other: ['snapshot-tests'] }), true);
    assert.equal(opensMore(guide, { ...NO_FILTERS, uses: ['custom-widgets', 'typescript'] }), true);
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
  it('says every change shows when nothing is answered', () => {
    assert.equal(
      describeFilters(NO_FILTERS, guide),
      "Showing every change. Answer any of these to hide what doesn't apply to you.",
    );
  });

  it('names the packages, customizations, More answers, schema and search', () => {
    assert.equal(
      describeFilters(
        {
          ...NO_FILTERS,
          theme: 'mui',
          uses: ['custom-widgets', 'typescript'],
          schema: ['arrays', 'refs'],
          search: ' slot ',
        },
        guide,
      ),
      'Showing changes for `@rjsf/mui` with custom widgets, for code using TypeScript, for schemas with Arrays or References, matching "slot". Answer more to narrow the list, or clear to see everything.',
    );
  });

  it('names the Nothing chip', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, nothing: true }, guide),
      'Showing changes with no customization. Answer more to narrow the list, or clear to see everything.',
    );
  });

  it('names a validator and a theme author package, and Nothing beside a More use', () => {
    assert.equal(
      describeFilters(
        { ...NO_FILTERS, validator: 'validator-ata', other: ['snapshot-tests'], nothing: true, uses: ['typescript'] },
        guide,
      ),
      'Showing changes for `@rjsf/validator-ata` and `@rjsf/snapshot-tests` with no customization, for code using TypeScript. Answer more to narrow the list, or clear to see everything.',
    );
  });

  it('leaves out a theme author package while no theme or validator is picked, since it narrows nothing', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, other: ['snapshot-tests'] }, guide),
      "Showing every change. Answer any of these to hide what doesn't apply to you.",
    );
    assert.equal(
      describeFilters({ ...NO_FILTERS, other: ['snapshot-tests'], uses: ['typescript'] }, guide),
      'Showing changes for code using TypeScript. Answer more to narrow the list, or clear to see everything.',
    );
  });

  it('names a search alone', () => {
    assert.equal(
      describeFilters({ ...NO_FILTERS, search: 'ids' }, guide),
      'Showing changes matching "ids". Answer more to narrow the list, or clear to see everything.',
    );
  });
});

describe('readFilters and writeFilters', () => {
  it('round-trip every answer and the search', () => {
    const filters: Filters = {
      theme: 'mui',
      validator: 'validator-ajv8',
      nothing: true,
      uses: ['typescript', 'markup'],
      schema: ['refs'],
      other: ['snapshot-tests'],
      search: 'slot props & ids',
    };
    const search = writeFilters(filters);
    assert.equal(
      search,
      '?theme=mui&validator=validator-ajv8&customized=none&uses=typescript,markup&schema=refs&other=snapshot-tests&q=slot%20props%20%26%20ids',
    );
    assert.deepEqual(readFilters(search, guide), filters);
  });

  it('round-trip a chip alongside a More checkbox', () => {
    const filters: Filters = { ...NO_FILTERS, uses: ['custom-widgets', 'typescript'] };
    assert.deepEqual(readFilters(writeFilters(filters), guide), filters);
  });

  it('ignore unknown and old params and values the vocabulary does not have', () => {
    assert.deepEqual(
      readFilters(
        '?theme=bulma&uses=typescript,unknown,form&schema=nope&noticed=review&kind=runtime&customized=yes',
        guide,
      ),
      { ...NO_FILTERS, uses: ['typescript'] },
    );
  });

  it('write no query for no answers', () => {
    assert.equal(writeFilters(NO_FILTERS), '');
    assert.deepEqual(readFilters('', guide), NO_FILTERS);
  });
});
