import type { RJSFSchema } from '../src/index.ts';
import { getItemSchema, getPrefixLength } from '../src/index.ts';

describe('getItemSchema() and getPrefixLength()', () => {
  const first: RJSFSchema = { type: 'string' };
  const rest: RJSFSchema = { type: 'number' };
  it.each<[string, RJSFSchema, number, (RJSFSchema | boolean)[]]>([
    ['prefixItems', { prefixItems: [first], items: rest }, 1, [first, rest]],
    ['a tuple items', { items: [first], additionalItems: rest }, 1, [first, rest]],
    ['a closed tuple', { items: [first], additionalItems: false }, 1, [first, false]],
    ['a single items', { items: rest }, 0, [rest, rest]],
    ['no items', {}, 0, [true, true]],
    ['a null items', { items: null } as unknown as RJSFSchema, 0, [true, true]],
    ['an array items beside prefixItems', { prefixItems: [first], items: [rest] }, 1, [first, true]],
    [
      'one tuple shared by prefixItems and items',
      (() => {
        const tuple = [first];
        return { prefixItems: tuple, items: tuple, additionalItems: false };
      })(),
      1,
      [first, true],
    ],
  ])('reads the item schemas of %s by position', (_, schema, length, expected) => {
    expect(getPrefixLength(schema)).toBe(length);
    expect([getItemSchema(schema, 0), getItemSchema(schema, 1)]).toStrictEqual(expected);
  });
});
