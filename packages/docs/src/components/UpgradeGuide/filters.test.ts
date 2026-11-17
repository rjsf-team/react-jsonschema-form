import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { chosenPackages, matches, readFilters, writeFilters, type Entry, type Filters, type Guide } from './filters.ts';

const guide: Guide = {
  uses: [
    { id: 'form', label: 'Renders a form', detect: '' },
    { id: 'typescript', label: 'TypeScript', detect: '' },
    { id: 'custom-widgets', label: 'Custom widgets', detect: '' },
  ],
  everyUserUse: 'form',
  schema: [
    { id: 'arrays', label: 'Arrays', detect: '' },
    { id: 'refs', label: 'References', detect: '' },
  ],
  kinds: [],
  noticed: [{ id: 'review', label: 'Nothing reports it', short: 'review', hint: '', badge: 'badge--secondary' }],
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

const noFilters: Filters = { theme: '', validator: '', uses: [], schema: [], other: [], noticed: '' };

function entry(fields: Partial<Entry>): Entry {
  return {
    id: 'an-entry',
    title: 'An entry',
    description: '',
    packages: ['@rjsf/core'],
    uses: ['typescript'],
    schema: [],
    kind: 'runtime',
    noticed: 'review',
    permalink: '/an-entry',
    ...fields,
  };
}

describe('matches', () => {
  const cases: [string, Partial<Entry>, Partial<Filters>, boolean][] = [
    ['`*` applies with no package chosen', { packages: ['*'] }, {}, true],
    ['`@rjsf/core` applies with no package chosen', { packages: ['@rjsf/core'] }, {}, true],
    ['`@rjsf/utils` applies with no package chosen', { packages: ['@rjsf/utils'] }, {}, true],
    ['a theme applies when chosen', { packages: ['@rjsf/mui'] }, { theme: 'mui' }, true],
    ['a theme does not apply when another is chosen', { packages: ['@rjsf/mui'] }, { theme: 'antd' }, false],
    ['a theme does not apply with none chosen', { packages: ['@rjsf/mui'] }, {}, false],
    ['a validator applies when chosen', { packages: ['@rjsf/validator-ata'] }, { validator: 'validator-ata' }, true],
    [
      'a validator does not apply when another is chosen',
      { packages: ['@rjsf/validator-ata'] },
      { validator: 'validator-ajv8' },
      false,
    ],
    [
      'an other package applies when ticked',
      { packages: ['@rjsf/snapshot-tests'] },
      { other: ['snapshot-tests'] },
      true,
    ],
    ['an other package does not apply unticked', { packages: ['@rjsf/snapshot-tests'] }, {}, false],
    ['any use applies when no use is ticked', { uses: ['custom-widgets'] }, {}, true],
    ['a ticked use applies', { uses: ['custom-widgets'] }, { uses: ['custom-widgets'] }, true],
    [
      'an unticked use does not apply when another is ticked',
      { uses: ['custom-widgets'] },
      { uses: ['typescript'] },
      false,
    ],
    ['`form` applies whatever use is ticked', { uses: ['form'] }, { uses: ['custom-widgets'] }, true],
    ['any schema applies when no schema is ticked', { schema: ['arrays'] }, {}, true],
    ['an entry with no schema tags applies whatever schema is ticked', { schema: [] }, { schema: ['refs'] }, true],
    ['a ticked schema applies', { schema: ['arrays', 'refs'] }, { schema: ['refs'] }, true],
    ['a non-matching schema does not apply', { schema: ['arrays'] }, { schema: ['refs'] }, false],
    [
      'every clause must hold: matching uses and schema, wrong package',
      { packages: ['@rjsf/antd'], uses: ['form'], schema: [] },
      { theme: 'mui' },
      false,
    ],
  ];
  for (const [name, fields, filterFields, expected] of cases) {
    it(name, () => {
      const filters = { ...noFilters, ...filterFields };
      assert.equal(matches(entry(fields), chosenPackages(guide, filters), filters, guide.everyUserUse), expected);
    });
  }
});

describe('readFilters and writeFilters', () => {
  it('round-trip every filter, a multi-value `uses` included', () => {
    const filters: Filters = {
      theme: 'mui',
      validator: 'validator-ajv8',
      uses: ['typescript', 'custom-widgets'],
      schema: ['refs'],
      other: ['snapshot-tests'],
      noticed: 'review',
    };
    const search = writeFilters(filters);
    assert.equal(
      search,
      '?theme=mui&validator=validator-ajv8&uses=typescript,custom-widgets&schema=refs&other=snapshot-tests&noticed=review',
    );
    assert.deepEqual(readFilters(search, guide), filters);
  });

  it('drop a value the vocabulary does not have', () => {
    assert.deepEqual(readFilters('?theme=bulma&uses=typescript,unknown&schema=nope&noticed=never', guide), {
      ...noFilters,
      uses: ['typescript'],
    });
  });

  it('write no query for no filters', () => {
    assert.equal(writeFilters(noFilters), '');
    assert.deepEqual(readFilters('', guide), noFilters);
  });
});
