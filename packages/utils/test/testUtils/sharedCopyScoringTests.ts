import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import { getFirstMatchingOption } from '../../src/index.ts';

/** The levels of definitions `chainedDefinitions()` builds that #5771 measured running out of memory at */
export const DEEP_CHAIN = 18;

/** Returns the schema of #5771: definitions `L0` to `L<levels>`, each but the last naming the next under two properties,
 * and the last holding a choice whose two options name it again under the same property, so `L0` reaches the choice
 * along `2 ** levels` paths. The root offers an object whose `v` holds `L0` and one whose `v` holds any object.
 *
 * @param levels - The levels of definitions naming the next twice over
 * @param [id] - The `$id` of the root, if it has one
 * @returns - The root and its options
 */
export function chainedDefinitions(levels: number, id?: string): { root: RJSFSchema; options: RJSFSchema[] } {
  const definitions: Record<string, RJSFSchema> = {};
  for (let level = 0; level < levels; level += 1) {
    const next = { $ref: `#/definitions/L${level + 1}` };
    definitions[`L${level}`] = { type: 'object', properties: { a: next, b: next } };
  }
  definitions[`L${levels}`] = {
    type: 'object',
    properties: { leaf: { type: 'string' }, c: { $ref: '#/definitions/R' } },
  };
  definitions.R = {
    oneOf: [
      { type: 'object', properties: { next: { $ref: '#/definitions/R' }, x: { type: 'string' } } },
      { type: 'object', properties: { next: { $ref: '#/definitions/R' }, y: { type: 'number' } } },
    ],
  };
  const options: RJSFSchema[] = [
    { properties: { v: { $ref: '#/definitions/L0' } } },
    { properties: { v: { type: 'object' } } },
  ];
  return { root: { ...(id === undefined ? {} : { $id: id }), definitions, oneOf: options }, options };
}

/** Returns data for `chainedDefinitions(levels)` reaching the last definition along `a` at every level, holding `leaf` */
function deepData(levels: number, leaf: unknown): object {
  let data: object = { leaf, c: { next: { x: 'x' } } };
  for (let level = 0; level < levels; level += 1) {
    data = { [level % 2 === 0 ? 'a' : 'b']: data };
  }
  return { v: data };
}

/** Runs the suite checking that an option reaching a part of the data along many paths is matched in time and still
 * checks that part, against the validator `buildValidator` returns for a root: the live one or one precompiled from it
 *
 * @param buildValidator - Returns the validator to match the options of the root with
 */
export default function sharedCopyScoringTests(buildValidator: (rootSchema: RJSFSchema) => ValidatorType): void {
  describe('scoring an option that reaches a part along many paths (#5771)', () => {
    it.each([
      ['a root without an $id', undefined, undefined],
      ['a root with an $id', 'https://example.com/root.json', undefined],
      ['a 2020-12 root', undefined, 'https://json-schema.org/draft/2020-12/schema'],
    ])(
      `matches the option of ${DEEP_CHAIN} levels of definitions naming the next twice, for %s`,
      (_case, id, dialect) => {
        const chained = chainedDefinitions(DEEP_CHAIN, id);
        const { options } = chained;
        const root = dialect === undefined ? chained.root : { $schema: dialect, ...chained.root };
        const validator = buildValidator(root);
        const match = (data: unknown) => getFirstMatchingOption({ validator }, data, options, root);

        expect(match(deepData(DEEP_CHAIN, 'leaf'))).toBe(0);
        // The last definition, reached along every path, is still checked
        expect(match(deepData(DEEP_CHAIN, 5))).toBe(1);
        expect(match({ v: { a: 'not an object' } })).toBe(1);
      },
    );
  });
}
