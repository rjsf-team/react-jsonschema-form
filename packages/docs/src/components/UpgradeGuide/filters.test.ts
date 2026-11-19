import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  NO_FILTERS,
  describeFilters,
  groupByHeading,
  matcher,
  readFilters,
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
  headings: [
    { id: 'setup', heading: 'Installation and build', line: '' },
    { id: 'code', heading: 'Code and APIs', line: '' },
    { id: 'data', heading: 'Form data', line: '' },
    { id: 'deprecated', heading: 'Deprecations', line: '' },
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
    permalink: '/an-entry',
    ...fields,
  };
}

describe('matcher', () => {
  const cases: [string, Partial<Entry>, Partial<Filters>, boolean][] = [
    [
      'nothing answered shows a theme, validator and other package entry with any uses and schema',
      { packages: ['@rjsf/mui', '@rjsf/validator-ata', '@rjsf/snapshot-tests'], uses: ['markup'], schema: ['refs'] },
      {},
      true,
    ],
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
      'an other package shows when ticked',
      { packages: ['@rjsf/snapshot-tests'] },
      { theme: 'mui', other: ['snapshot-tests'] },
      true,
    ],
    ['the Nothing chip hides a customization entry', { uses: ['custom-widgets'] }, { nothing: true }, false],
    ['the Nothing chip hides an entry of an unticked More use', { uses: ['typescript'] }, { nothing: true }, false],
    ['the Nothing chip keeps a `form` entry', { uses: ['form', 'custom-widgets'] }, { nothing: true }, true],
    [
      'the Nothing chip keeps an entry of a ticked More use',
      { uses: ['typescript'] },
      { nothing: true, uses: ['typescript'] },
      true,
    ],
    ['a chip shows its entries', { uses: ['custom-widgets'] }, { uses: ['custom-widgets'] }, true],
    ['a chip hides another customization', { uses: ['custom-fields'] }, { uses: ['custom-widgets'] }, false],
    ['a chip hides an unticked More use', { uses: ['typescript'] }, { uses: ['custom-widgets'] }, false],
    ['a chip keeps a `form` entry', { uses: ['form'] }, { uses: ['custom-widgets'] }, true],
    ['a More checkbox shows its entries', { uses: ['markup'] }, { uses: ['markup'] }, true],
    ['a More checkbox hides a customization entry', { uses: ['custom-widgets'] }, { uses: ['markup'] }, false],
    ['chips and More checkboxes are one set', { uses: ['markup'] }, { uses: ['custom-widgets', 'markup'] }, true],
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
      'every clause must hold: matching uses and schema, wrong package',
      { packages: ['@rjsf/antd'], uses: ['form'], schema: [] },
      { theme: 'mui' },
      false,
    ],
  ];
  for (const [name, fields, filterFields, expected] of cases) {
    it(name, () => {
      assert.equal(matcher(guide, { ...NO_FILTERS, ...filterFields })(entry(fields)), expected);
    });
  }
});

describe('groupByHeading', () => {
  it('groups by the first `affects` value in heading order, deprecated entries last, skipping empty headings', () => {
    const entries = [
      entry({ id: 'old-prop', affects: ['setup'], deprecated: true }),
      entry({ id: 'defaults', affects: ['data', 'setup'] }),
      entry({ id: 'esm', affects: ['setup', 'code'] }),
      entry({ id: 'peer', affects: ['setup'] }),
    ];
    assert.deepEqual(
      groupByHeading(entries, guide.headings).map(({ heading, entries: listed }) => [
        heading.id,
        listed.map(({ id }) => id),
      ]),
      [
        ['setup', ['esm', 'peer']],
        ['data', ['defaults']],
        ['deprecated', ['old-prop']],
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
