import type { RJSFSchema } from '../src/index.ts';
import { getOptionSelectorSchema } from '../src/index.ts';

describe('getOptionSelectorSchema()', () => {
  const retrieve = (selector: RJSFSchema): RJSFSchema => ({ ...selector, const: 'resolved' });

  it('retrieves a selector written as a $ref', () => {
    const option: RJSFSchema = { properties: { kind: { $ref: '#/definitions/kind' } } };
    expect(getOptionSelectorSchema(option, 'kind', retrieve)).toEqual({
      $ref: '#/definitions/kind',
      const: 'resolved',
    });
  });

  it('reads a selector written in place as it stands, keeping its identity', () => {
    const kind: RJSFSchema = { const: 'a' };
    expect(getOptionSelectorSchema({ properties: { kind } }, 'kind', retrieve)).toBe(kind);
  });

  it.each<[string, RJSFSchema]>([
    ['declares no properties', {}],
    ['does not declare the selector', { properties: { other: { const: 'a' } } }],
    ['declares the selector as a boolean schema', { properties: { kind: true } }],
  ])('gives undefined for an option that %s', (_, option) => {
    expect(getOptionSelectorSchema(option, 'kind', retrieve)).toBeUndefined();
  });

  it('gives undefined for an option that does not declare a selector named __proto__', () => {
    expect(getOptionSelectorSchema({ properties: { kind: { const: 'a' } } }, '__proto__', retrieve)).toBeUndefined();
  });
});
