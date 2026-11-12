import type { GenericObjectType, RJSFSchema, ValidatorType } from '../../src/index.ts';
import { getFirstMatchingOption } from '../../src/index.ts';

/** The levels of definitions `chainedDefinitions()` builds at which #5771 measured running out of memory */
export const DEEP_CHAIN = 18;

/** Returns the schema of #5771: definitions `L0` to `L<levels>`, each but the last naming the next under two
 * properties, and the last holding a choice whose two options name it again under the same property, so `L0` reaches
 * the choice along `2 ** levels` paths. The root offers an object whose `v` holds `L0` and one whose `v` holds any object.
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

/** Returns data for `chainedDefinitions(levels)` reaching the last definition along `a` at every level, holding
 * `leaf`
 */
function deepData(levels: number, leaf: unknown): object {
  let data: object = { leaf, c: { next: { x: 'x' } } };
  for (let level = 0; level < levels; level += 1) {
    data = { [level % 2 === 0 ? 'a' : 'b']: data };
  }
  return { v: data };
}

/** Checks that the `options` of `root`, built by `chainedDefinitions(levels)`, are matched in time, the part every path
 * reaches still checked, against the validator `buildValidator` returns for the root
 */
function expectOptionsMatched(
  buildValidator: (rootSchema: RJSFSchema) => ValidatorType,
  root: RJSFSchema,
  options: RJSFSchema[],
  levels: number,
): void {
  const validator = buildValidator(root);
  const match = (data: unknown) => getFirstMatchingOption({ validator }, data, options, root);

  expect(match(deepData(levels, 'leaf'))).toBe(0);
  // The last definition, reached along every path, is still checked
  expect(match(deepData(levels, 5))).toBe(1);
  expect(match({ v: { a: 'not an object' } })).toBe(1);
}

/** Checks that the options of the root `chainedDefinitions(DEEP_CHAIN)` gives, under `dialect`, are matched in time,
 * the part every path reaches still checked, against the validator `buildValidator` returns for the root
 */
function expectChainMatched(
  buildValidator: (rootSchema: RJSFSchema) => ValidatorType,
  id: string | undefined,
  dialect: string | undefined,
): void {
  const chained = chainedDefinitions(DEEP_CHAIN, id);
  const root = dialect === undefined ? chained.root : { $schema: dialect, ...chained.root };
  expectOptionsMatched(buildValidator, root, chained.options, DEEP_CHAIN);
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
      (_case, id, dialect) => expectChainMatched(buildValidator, id, dialect),
    );
  });
}

/** Runs the suite of `sharedCopyScoringTests()` for a draft-04 root, against a validator `buildValidator` returns that
 * reads an identifier from draft-04's `id` alone
 *
 * @param buildValidator - Returns the validator to match the options of the root with
 */
export function draft04SharedCopyScoringTests(buildValidator: (rootSchema: RJSFSchema) => ValidatorType): void {
  const draft04 = 'http://json-schema.org/draft-04/schema#';
  it(`matches the option of ${DEEP_CHAIN} levels of definitions naming the next twice, for a draft-04 root`, () =>
    expectChainMatched(buildValidator, undefined, draft04));
  it('matches the option of a part held once that has a draft-04 id of its own', () => {
    const levels = 3;
    const { root, options } = chainedDefinitions(levels);
    const next = { $ref: '#/definitions/L2' };
    // JSONSchema7 has no draft-04 `id`
    const L1: GenericObjectType = { id: '#L1', type: 'object', properties: { a: next, b: next } };
    const ownId: RJSFSchema = { $schema: draft04, ...root, definitions: { ...root.definitions, L1 } };
    expectOptionsMatched(buildValidator, ownId, options, levels);
  });
}
