import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { booleanOptionsRenderAsSelect, hasOptionLabels } from '../src/index.ts';

const untitled: RJSFSchema[] = [{ const: true }, { const: false }];
const titled: RJSFSchema[] = [
  { const: true, title: 'Yes' },
  { const: false, title: 'No' },
];

describe('booleanOptionsRenderAsSelect()', () => {
  it.each<[string, RJSFSchema, RJSFSchema[], UiSchema | undefined, boolean]>([
    ['a declared boolean with untitled options', { type: 'boolean' }, untitled, undefined, false],
    ['a declared boolean with titled options', { type: 'boolean' }, titled, undefined, true],
    [
      'a declared boolean whose uiSchema titles an option',
      { type: 'boolean' },
      untitled,
      { oneOf: [{ 'ui:title': 'Yes' }] },
      true,
    ],
    [
      'a declared boolean with one titled option',
      { type: 'boolean' },
      [{ const: true, title: 'Agree' }],
      undefined,
      false,
    ],
    ['a boolean inferred from its constants', {}, untitled, undefined, true],
    ['a boolean inferred from one constant', {}, [{ const: true }], undefined, true],
    [
      'a nullable boolean offering null',
      { type: ['boolean', 'null'] },
      [...untitled, { const: null }],
      undefined,
      true,
    ],
    ['a nullable boolean offering no null', { type: ['boolean', 'null'] }, untitled, undefined, false],
    [
      'a type list naming boolean first among other types',
      { type: ['boolean', 'string'] },
      [{ const: true }, { const: 'a' }],
      undefined,
      true,
    ],
    ['a string', { type: 'string' }, [{ const: 'a', title: 'A' }, { const: 'b' }], undefined, false],
    ['constants of several types', {}, [{ const: true }, { const: 'a' }], undefined, false],
  ])('answers for %s', (_, schema, options, uiSchema, expected) => {
    expect(booleanOptionsRenderAsSelect({ ...schema, oneOf: options }, 'oneOf', options, uiSchema)).toBe(expected);
  });

  it('takes the word of a caller that wrote an inferred type into the schema', () => {
    const schema: RJSFSchema = { type: 'boolean', oneOf: untitled };
    expect(booleanOptionsRenderAsSelect(schema, 'oneOf', untitled, undefined, true)).toBe(true);
    expect(booleanOptionsRenderAsSelect(schema, 'oneOf', untitled, undefined, false)).toBe(false);
  });
});

describe('hasOptionLabels()', () => {
  it('finds a title on an option', () => {
    expect(hasOptionLabels(titled, 'oneOf')).toBe(true);
    expect(hasOptionLabels(untitled, 'oneOf')).toBe(false);
    expect(hasOptionLabels([true, { title: '' }], 'anyOf')).toBe(false);
  });

  it('finds a ui:title in the uiSchema entry of the same keyword and index', () => {
    expect(hasOptionLabels(untitled, 'oneOf', { oneOf: [{}, { 'ui:title': 'No' }] })).toBe(true);
    expect(hasOptionLabels(untitled, 'oneOf', { anyOf: [{ 'ui:title': 'Yes' }] })).toBe(false);
    expect(hasOptionLabels(untitled, 'oneOf', { oneOf: [] })).toBe(false);
  });
});
