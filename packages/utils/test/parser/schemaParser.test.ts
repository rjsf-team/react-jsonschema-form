import type { RJSFSchema } from '../../src/index.ts';
import { ELSE_KEY, isObject, noop, resetLogOnce, schemaParser, THEN_KEY } from '../../src/index.ts';
import {
  CHOICE as choice,
  mergeAllOfEntries,
  SCHEMA_MERGED_FOR_PATTERN_KEY,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  TITLED_CHOICE_OPTION,
  titleChoiceMergeAllOf as customMergeAllOf,
} from '../testUtils/customMergeAllOfData.ts';
import { identityMergeAllOf } from '../testUtils/parsedSchemaData.ts';
import {
  PROPERTY_DEPENDENCIES,
  RECURSIVE_REF,
  RECURSIVE_REF_ALLOF,
  SCHEMA_DEPENDENCIES,
  SCHEMA_WITH_ALLOF_CANNOT_MERGE,
  SCHEMA_AND_ONEOF_REF_DEPENDENCIES,
  SCHEMA_AND_REQUIRED_DEPENDENCIES,
  SCHEMA_WITH_ARRAY_CONDITION,
  SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES,
  SCHEMA_WITH_SINGLE_CONDITION,
  SCHEMA_WITH_MULTIPLE_CONDITIONS,
  SCHEMA_WITH_NESTED_CONDITIONS,
  SUPER_SCHEMA,
} from '../testUtils/testData.ts';

/** Returns a `customMergeAllOf` that merges its `allOf` entries while recording their property names, which for a
 * schema whose only `allOf` is the one a `patternProperties` combination is parsed as names the combinations that
 * were enumerated.
 *
 * @param mergedLists - The list each merged `allOf`'s property names are pushed onto
 * @returns - The recording `customMergeAllOf`
 */
function recordMergedProperties(mergedLists: string[][]) {
  return (schema: RJSFSchema) => {
    const { allOf = [] } = schema;
    mergedLists.push(allOf.filter(isObject).flatMap((subSchema) => Object.keys(subSchema.properties ?? {})));
    return mergeAllOfEntries(schema);
  };
}

describe('schemaParser()', () => {
  it('parses the oneOf options of a schema whose anyOf is resolved first', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        both: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
          oneOf: [
            { minLength: 1, title: 'filled' },
            { maxLength: 0, title: 'empty' },
          ],
        },
      },
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toContain('filled');
    expect(titles).toContain('empty');
  });

  it('parses the properties an option declares that its parent does not', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'object',
          properties: {
            x: {
              anyOf: [
                { type: 'string', minLength: 3, title: 'text' },
                { type: 'number', minimum: 7, title: 'count' },
              ],
            },
          },
        },
      ],
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toContain('text');
    expect(titles).toContain('count');
  });

  it('parses the items an option declares that its parent does not', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string', minLength: 3, title: 'text' },
              { type: 'number', minimum: 7, title: 'count' },
            ],
          },
        },
      ],
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toContain('text');
    expect(titles).toContain('count');
  });

  it.each(['anyOf', 'oneOf'])('parses the properties and items of a schema with an empty %s', (key) => {
    const itemOptions: RJSFSchema = {
      anyOf: [
        { type: 'string', minLength: 3, title: 'text' },
        { type: 'number', minimum: 7, title: 'count' },
      ],
    };
    const propertyOptions: RJSFSchema = {
      anyOf: [
        { type: 'string', maxLength: 3, title: 'code' },
        { type: 'number', maximum: 7, title: 'size' },
      ],
    };
    const schema: RJSFSchema = {
      type: 'object',
      [key]: [],
      properties: { x: propertyOptions },
      items: itemOptions,
    };
    const titles = Object.values(schemaParser(schema)).map((value) => value.title);
    expect(titles).toEqual(expect.arrayContaining(['text', 'count', 'code', 'size']));
  });

  it('parses property dependencies properly', () => {
    const schemaMap = schemaParser(PROPERTY_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs properly', () => {
    const schemaMap = schemaParser(RECURSIVE_REF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses recursive refs in allOf properly', () => {
    const schemaMap = schemaParser(RECURSIVE_REF_ALLOF);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies properly', () => {
    const schemaMap = schemaParser(SCHEMA_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema dependencies with one of and refs properly', () => {
    const schemaMap = schemaParser(SCHEMA_AND_ONEOF_REF_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema and required dependencies properly', () => {
    const schemaMap = schemaParser(SCHEMA_AND_REQUIRED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with oneof and nested dependencies', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ONEOF_NESTED_DEPENDENCIES);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with a single condition', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_SINGLE_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with multiple conditions', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_MULTIPLE_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses schema with nested conditions', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_NESTED_CONDITIONS);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses superSchema properly', () => {
    const schemaMap = schemaParser(SUPER_SCHEMA);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with array condition', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ARRAY_CONDITION);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parse schema with allof not able to merge', () => {
    const schemaMap = schemaParser(SCHEMA_WITH_ALLOF_CANNOT_MERGE);
    expect(schemaMap).toMatchSnapshot();
  });
  it('parses the properties that only a oneOf option has', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      oneOf: [
        { properties: { a: { oneOf: [{ const: 'x1' }, { const: 'x2' }] } } },
        { properties: { b: { type: 'string' } } },
      ],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'x1' }));
  });
  it('parses the options of a property that every oneOf option redefines', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { a: { oneOf: [{ const: 'p1' }, { const: 'p2' }] } },
      oneOf: [
        { properties: { a: { oneOf: [{ const: 'o1' }, { const: 'o2' }] } } },
        { properties: { a: { oneOf: [{ const: 'o3' }] } } },
      ],
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'p1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'o1' }));
  });
  it('parses the items that only a oneOf option has', () => {
    const rootSchema: RJSFSchema = {
      oneOf: [{ type: 'array', items: { oneOf: [{ const: 1 }, { const: 2 }] } }, { type: 'string' }],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 1 }));
  });
  it('parses the options a oneOf option only has through its own allOf', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          oneOf: [
            {
              type: 'object',
              allOf: [
                { properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } } },
                { properties: { z: { type: 'string' } } },
              ],
            },
          ],
        },
      },
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'a' }));
  });
  it('parses the options of a property the merged allOf gives its patternProperties', () => {
    // The `patternProperties` only applies to `p` once the `allOf` is merged, so only the merged schema has the options
    const rootSchema: RJSFSchema = {
      type: 'object',
      allOf: [
        { properties: { p: { type: 'object', properties: { x: { type: 'string' } } } } },
        { patternProperties: { '^p$': { properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } } } } },
      ],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'a' }));
  });
  it('parses the options of every position of a tuple items and of its additionalItems', () => {
    const rootSchema: RJSFSchema = {
      type: 'array',
      items: [{ oneOf: [{ const: 'i1' }, { const: 'i2' }] }, { type: 'string' }],
      additionalItems: { anyOf: [{ const: 'a1' }, { const: 'a2' }] },
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'i1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'a1' }));
  });
  it('parses the options of the additionalProperties and patternProperties a form renders extra keys with', () => {
    // No form data is parsed, so an extra key is never stubbed into `properties`; the schemas a form renders one with
    // have to be reached through the keywords themselves
    const rootSchema: RJSFSchema = {
      type: 'object',
      patternProperties: { '^x': { oneOf: [{ const: 'pp1' }, { const: 'pp2' }] } },
      additionalProperties: { oneOf: [{ const: 'ap1' }, { const: 'ap2' }] },
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'pp1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'ap1' }));
  });
  it('parses the options of an unevaluatedProperties a form renders extra keys with', () => {
    // The keyword describes the keys the other keywords leave over, which is what a form renders an extra key with
    // where no `additionalProperties` evaluates it, so the sub-schemas under it are the ones that key's options are
    // scored against
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' } },
      unevaluatedProperties: { oneOf: [{ const: 'up1' }, { const: 'up2' }] },
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'up1' }));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'up2' }));
  });
  it('parses no additionalItems of an items that is not a tuple, as a form renders none', () => {
    const rootSchema: RJSFSchema = {
      type: 'array',
      items: { type: 'string' },
      additionalItems: { oneOf: [{ const: 'never' }] },
    };
    expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(expect.objectContaining({ const: 'never' }));
  });
  it('parses each variant of an option that has an $id under a key of its own', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      definitions: {
        identified: {
          $id: 'identified',
          type: 'object',
          properties: { name: { type: 'string' } },
          additionalProperties: false,
        },
      },
      properties: {
        pick: {
          oneOf: [{ $ref: '#/definitions/identified' }, { type: 'object', properties: { other: { type: 'string' } } }],
        },
      },
    };
    const schemaMap = schemaParser(rootSchema);
    // An option is validated as `getFirstMatchingOption()` augments it, with its `additionalProperties` relaxed for
    // scoring, and as it stands, which is what `MultiSchemaField` validates it as when a parent declines an option
    // switch. None of the three is the schema the `$id` names, so each is keyed by its own content: holding the `$id`
    // would compile only the first and answer the rest with its function
    expect(schemaMap.identified).toBeUndefined();
    // The two scored forms hold the option inside an `allOf`, so that the assertion scoring adds cannot reach a child
    // the option describes through a `$ref` back to itself, and it is the held option that carries the derived `$id`
    const optionOf = (schema: RJSFSchema) => (schema.allOf?.[0] as RJSFSchema | undefined) ?? schema;
    const variants = Object.values(schemaMap).filter((schema) => optionOf(schema).properties?.name);
    expect(variants).toEqual([
      // The map keys each of these by its own hash, which the parser carries back on the schema as its `$id`
      expect.objectContaining({
        allOf: [expect.objectContaining({ additionalProperties: false })],
        anyOf: [{ required: ['name'] }],
      }),
      expect.objectContaining({
        allOf: [expect.objectContaining({ additionalProperties: true })],
        anyOf: [{ required: ['name'] }],
      }),
      expect.objectContaining({ additionalProperties: false }),
    ]);
    expect(variants[2].anyOf).toBeUndefined();
    const derivedIds = variants.map((schema) => optionOf(schema).$id);
    expect(derivedIds).toEqual([
      expect.stringMatching(/^identified\?rjsf=/),
      expect.stringMatching(/^identified\?rjsf=/),
      expect.stringMatching(/^identified\?rjsf=/),
    ]);
    expect(new Set(derivedIds).size).toBe(3);
  });
  it('parses the relaxed variant of an $id option that has no properties under a key of its own', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      definitions: { bare: { $id: 'bare', type: 'object', additionalProperties: false } },
      properties: { pick: { oneOf: [{ $ref: '#/definitions/bare' }, { type: 'string' }] } },
    };
    const schemaMap = schemaParser(rootSchema);
    // An option with no `properties` to augment is validated as it stands, which for `MultiSchemaField` is the
    // retrieved form rather than the declared one, so it is keyed by an `$id` derived from its own content too. The
    // derived `$id` keeps the declared one as its base so that a relative `$ref` inside it resolves the same way
    expect(schemaMap.bare).toBeUndefined();
    const strict = Object.entries(schemaMap).filter(([, schema]) => schema.additionalProperties === false);
    expect(strict).toEqual([[expect.stringMatching(/^bare\?rjsf=.+/), expect.objectContaining({ type: 'object' })]]);
    const relaxed = Object.entries(schemaMap).filter(([, schema]) => schema.additionalProperties === true);
    expect(relaxed).toEqual([[expect.stringMatching(/^bare\?rjsf=.+/), expect.objectContaining({ type: 'object' })]]);
  });
  it('parses each combination of patternProperties a key can match, as the form merges every one it matches', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      patternProperties: {
        '^x': { properties: { first: { type: 'string' } } },
        x$: { properties: { second: { type: 'string' } } },
      },
    };
    const mergedLists: string[][] = [];
    schemaParser(rootSchema, { customMergeAllOf: recordMergedProperties(mergedLists) });
    // A key of `xy` matches only the first pattern, `yx` only the second and `x` both, so a form can merge any of the
    // three and the sub-schemas of all three have to be parsed
    expect(mergedLists).toEqual([['first'], ['second'], ['first', 'second']]);
  });
  it('parses nothing of a boolean entry in an allOf, which constrains no value of its own', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      allOf: [true, { properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } } }],
    };
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'b' }));
  });
  it('parses each pattern alone and all of them together for more patternProperties than can be combined', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    const rootSchema: RJSFSchema = {
      type: 'object',
      patternProperties: Object.fromEntries(
        Array.from({ length: 17 }, (_, i) => [`^p${i}`, { properties: { [`v${i}`]: { type: 'string' } } }]),
      ),
    };
    const mergedLists: string[][] = [];
    schemaParser(rootSchema, { customMergeAllOf: recordMergedProperties(mergedLists) });
    // Enumerating the `2 ** 17 - 1` combinations is more work than a compile can do, and a schema that has that many
    // patterns is still compiled rather than reported: what a key matching some other subset of them loses is said
    expect(mergedLists).toEqual([
      ...Array.from({ length: 17 }, (_, i) => [`v${i}`]),
      Array.from({ length: 17 }, (_, i) => `v${i}`),
    ]);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/A schema has 17 patternProperties, more than the 16 whose combinations can all be/),
    );
    consoleWarnSpy.mockRestore();
  });
  it('reports every object with more patternProperties than can be combined, not just the first', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    resetLogOnce();
    const overLimit = (prefix: string): RJSFSchema['patternProperties'] =>
      Object.fromEntries(
        Array.from({ length: 17 }, (_, i) => [
          `^${prefix}${i}`,
          { properties: { [`${prefix}${i}`]: { type: 'string' } } },
        ]),
      );
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { first: { type: 'object', patternProperties: overLimit('a') } },
      additionalProperties: { type: 'object', patternProperties: overLimit('b') },
    };
    schemaParser(rootSchema);
    // `logOnce()` keys by the message, so one naming only the count would report the first object and drop the second,
    // leaving that object's compiled set quietly incomplete
    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('^a0, ^a1'));
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('^b0, ^b1'));
    consoleWarnSpy.mockRestore();
  });
  it.each([
    [
      'an anyOf on the recursive node',
      { properties: { child: { $ref: '#/definitions/Node' } }, anyOf: [{ required: ['a'] }, { required: ['b'] }] },
    ],
    ['a oneOf of one option', { properties: { child: { $ref: '#/definitions/Node' } }, oneOf: [{ required: ['a'] }] }],
    [
      'an allOf alongside the anyOf',
      {
        properties: { child: { $ref: '#/definitions/Node' } },
        allOf: [{ title: 'x' }],
        anyOf: [{ required: ['a'] }],
      },
    ],
    [
      'the recursion reached through an items',
      {
        properties: { children: { type: 'array', items: { $ref: '#/definitions/Node' } } },
        oneOf: [{ required: ['a'] }],
      },
    ],
  ] as [string, RJSFSchema][])('parses a recursive schema carrying %s', (_case, node) => {
    const rootSchema: RJSFSchema = { $ref: '#/definitions/Node', definitions: { Node: { type: 'object', ...node } } };
    // An option is merged into the schema as resolution has left it, which is one level deeper each time, and the
    // parse keys what it has seen by content, so without the references travelling with the schema nothing repeats
    // and the descent runs until the stack does
    expect(() => schemaParser(rootSchema)).not.toThrow();
  });
  it('parses each subset of the schema dependencies a form can have applied', () => {
    const option: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      dependencies: {
        a: { properties: { a2: { type: 'string' } } },
        b: { properties: { b2: { type: 'string' } } },
      },
    };
    const rootSchema: RJSFSchema = {
      type: 'object',
      oneOf: [option, { type: 'object', properties: { z: { type: 'number' } } }],
    };
    const names = Object.values(schemaParser(rootSchema)).map((schema) =>
      Object.keys(schema.properties ?? {})
        .sort()
        .join(','),
    );
    // A form applies a dependency once its key has a value, so a user part-way through filling the option in scores
    // it with only some of them applied, and expanding returned only the none- and all-applied forms
    expect(names).toEqual(expect.arrayContaining(['a,a2,b', 'a,b,b2', 'a,a2,b,b2', 'a,b']));
  });
  it('resolves the $ref of each schema dependency in every subset it is applied in', () => {
    const option: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      dependencies: { a: { $ref: '#/definitions/DepA' }, b: { $ref: '#/definitions/DepB' } },
    };
    const rootSchema: RJSFSchema = {
      type: 'object',
      oneOf: [option, { type: 'object', properties: { z: { type: 'number' } } }],
      definitions: {
        DepA: { properties: { a2: { type: 'string' } } },
        DepB: { properties: { b2: { type: 'string' } } },
      },
    };
    const names = Object.values(schemaParser(rootSchema)).map((schema) =>
      Object.keys(schema.properties ?? {})
        .sort()
        .join(','),
    );
    // Every subset is expanded from the path the schema itself was reached by, so a dependency's `$ref` resolves in
    // each of them rather than reading as a cycle in all but the first and staying a literal `$ref`
    expect(names).toEqual(expect.arrayContaining(['a,a2,b', 'a,b,b2', 'a,a2,b,b2', 'a,b']));
  });
  it('resolves the $ref of a schema dependency for every branch the option itself expands into', () => {
    const option: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      oneOf: [{ properties: { x: { type: 'string' } } }, { properties: { y: { type: 'string' } } }],
      dependencies: { a: { $ref: '#/definitions/DepA' }, b: { $ref: '#/definitions/DepB' } },
    };
    const rootSchema: RJSFSchema = {
      type: 'object',
      oneOf: [option, { type: 'object', properties: { z: { type: 'number' } } }],
      definitions: {
        DepA: { properties: { a2: { type: 'string' } } },
        DepB: { properties: { b2: { type: 'string' } } },
      },
    };
    const names = Object.values(schemaParser(rootSchema)).map((schema) =>
      Object.keys(schema.properties ?? {})
        .sort()
        .join(','),
    );
    // The option expands into one schema per branch of its own `oneOf`, and each applies the same dependencies, so a
    // list shared between them leaves the second branch reading what the first resolved as a cycle. Both branches
    // get every subset
    expect(names).toEqual(
      expect.arrayContaining([
        'a,b,x',
        'a,a2,b,x',
        'a,b,b2,x',
        'a,a2,b,b2,x',
        'a,b,y',
        'a,a2,b,y',
        'a,b,b2,y',
        'a,a2,b,b2,y',
      ]),
    );
  });
  it('reports a schema with more schema dependencies than can be expanded', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(noop);
    resetLogOnce();
    const keys = Array.from({ length: 9 }, (_, i) => `k${i}`);
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: Object.fromEntries(keys.map((key) => [key, { type: 'string' }])),
      dependencies: Object.fromEntries(keys.map((key) => [key, { properties: { [`${key}v`]: { type: 'string' } } }])),
    };
    schemaParser(rootSchema);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/A schema has 9 schema dependencies, more than the 8 whose subsets can all be expanded/),
    );
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('k0, k1'));
    consoleWarnSpy.mockRestore();
  });
  it('parses the combinations of patternProperties once for a schema its options are merged into', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      patternProperties: {
        '^x': { properties: { first: { type: 'string' } } },
        x$: { properties: { second: { type: 'string' } } },
      },
      oneOf: [{ properties: { opt1: { type: 'string' } } }, { properties: { opt2: { type: 'string' } } }],
    };
    const mergedLists: string[][] = [];
    schemaParser(rootSchema, { customMergeAllOf: recordMergedProperties(mergedLists) });
    // Each option carries the `patternProperties` of the schema it is merged into, so the combinations arrive once per
    // option and are enumerated for the first of them only
    expect(mergedLists).toEqual([['first'], ['second'], ['first', 'second']]);
  });
  it('parses the conditional branches of a property its patternProperties also match', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          type: 'object',
          properties: { t: { type: 'string' } },
          if: { properties: { t: { const: 'yes' } } },
          then: { properties: { c: { oneOf: [{ const: 'then1' }, { const: 'then2' }] } } },
        },
      },
      patternProperties: { '^p$': { properties: { extra: { type: 'string' } } } },
    };
    // Merging `p` with the pattern that matches it resolves it too, so that resolution expands its branches as well
    expect(Object.values(schemaParser(rootSchema))).toContainEqual(expect.objectContaining({ const: 'then1' }));
  });
  it('parses a schema whose allOf nests without multiplying the merges it makes', () => {
    const nested = (n: number): RJSFSchema => ({
      allOf: [{ properties: { [`a${n}`]: { type: 'string' } } }, { properties: { [`b${n}`]: { type: 'string' } } }],
    });
    const rootSchema: RJSFSchema = { type: 'object', allOf: [0, 1, 2, 3, 4, 5].map(nested) };
    let merges = 0;
    const customMergeAllOf = (schema: RJSFSchema) => {
      merges += 1;
      return mergeAllOfEntries(schema);
    };
    schemaParser(rootSchema, { customMergeAllOf });
    // Two merges per nested `allOf` -- one reached through the root's merge and one parsing the entry in its own
    // right -- plus the root's own, rather than one per combination of the branches of the nested ones
    expect(merges).toBe(13);
  });
  describe('with a customMergeAllOf', () => {
    const customOption = expect.objectContaining(TITLED_CHOICE_OPTION);

    it('parses an allOf merged with it', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('parses the allOf merged for a pattern-matching property with it', () => {
      const rootSchema = SCHEMA_MERGED_FOR_PATTERN_PROPERTY;
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('parses the allOf merged for a key its patternProperties match with it', () => {
      const rootSchema = SCHEMA_MERGED_FOR_PATTERN_KEY;
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('resolves an allOf merged with it further, as the form does', () => {
      // The `patternProperties` only applies to `p` once the `allOf` is merged
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [
          { properties: { p: { type: 'object', properties: { x: { type: 'string' } } } } },
          { patternProperties: { '^p$': { properties: { choice } } } },
        ],
      };
      expect(Object.values(schemaParser(rootSchema))).not.toContainEqual(customOption);
      expect(Object.values(schemaParser(rootSchema, { customMergeAllOf }))).toContainEqual(customOption);
    });
    it('parses the options it merges alongside the unmerged ones a form also validates', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      // `getObjectDefaults()` reads a nested object's unmerged `properties` and `omitExtraData()` reads the entries a
      // merge leaves in place, so both forms of an option are validated against and both have to be parsed
      const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf }));
      expect(schemas).toContainEqual(customOption);
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'b', $id: expect.any(String) }));
    });
    it('parses the entries of an allOf it leaves in place, as omitExtraData() scores them', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      // A merge that returns its input leaves the `allOf` for `omitExtraData()` to walk, scoring the options of each
      // entry it finds there
      const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf: identityMergeAllOf }));
      expect(schemas).toContainEqual(expect.objectContaining({ allOf: expect.any(Array) }));
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'a' }));
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'b' }));
    });
    it('parses the entries of an allOf only reached through a condition or a dependency', () => {
      const unmerged: RJSFSchema = { type: 'object', allOf: [{ properties: { choice } }] };
      // Resolution merges an `allOf` wherever it finds one, so the entries of a `then` branch's or a dependency's are
      // reached on what it returns rather than on the schema the parse was handed
      const viaCondition: RJSFSchema = {
        type: 'object',
        properties: { u: { if: { required: ['zz'] }, then: unmerged, else: unmerged } },
      };
      const viaDependency: RJSFSchema = {
        type: 'object',
        properties: { t: { type: 'string' } },
        dependencies: { t: unmerged },
      };
      for (const rootSchema of [viaCondition, viaDependency]) {
        const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf: identityMergeAllOf }));
        expect(schemas).toContainEqual(expect.objectContaining({ const: 'a' }));
        expect(schemas).toContainEqual(expect.objectContaining({ const: 'b' }));
      }
    });
    it('parses the allOf with it dropped when it throws, as the form does', () => {
      const rootSchema: RJSFSchema = {
        type: 'object',
        properties: { kept: { oneOf: [{ const: 'k1' }, { const: 'k2' }] } },
        allOf: [{ properties: { choice } }, { properties: { q: { type: 'string' } } }],
      };
      const throwingMergeAllOf = () => {
        throw new Error('cannot merge');
      };
      const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf: throwingMergeAllOf }));
      // The form drops an `allOf` it cannot merge, keeping the rest of the schema, and validates against that. The
      // entries are still parsed, since what reads them unmerged reads them whether or not a merge of them succeeds
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'k1' }));
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'b' }));
    });
  });
  it('keys an $id option by its retrieved content, which is what MultiSchemaField scores', () => {
    // An option with no `properties` to augment is scored as it stands. Retrieval changes these two -- one merges its
    // `allOf`, the other picks an `if` branch -- so the declared and the retrieved form are different schemas that
    // the option's own `$id` would name as one
    const viaAllOf: RJSFSchema = {
      type: 'object',
      properties: { v: { oneOf: [{ $id: 'str', allOf: [{ type: 'string' }, { minLength: 1 }] }, { type: 'number' }] } },
    };
    const viaCondition: RJSFSchema = {
      type: 'object',
      properties: {
        v: {
          oneOf: [
            { $id: 'str', type: 'string', if: { minLength: 3 }, then: { maxLength: 9 }, else: { pattern: 'a' } },
            { type: 'number' },
          ],
        },
      },
    };
    for (const rootSchema of [viaAllOf, viaCondition]) {
      const keys = Object.keys(schemaParser(rootSchema)).filter((key) => key.startsWith('str'));
      expect(keys.length).toBeGreaterThan(1);
      expect(keys).not.toContain('str');
    }
  });
  it('parses a recursive $ref under a key its patternProperties match', () => {
    // `child` matches `^c`, so the merge of the two resolves the `$ref` back to `node`, which has both again
    const rootSchema: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          properties: { child: { $ref: '#/definitions/node' } },
          patternProperties: { '^c': { type: 'object', properties: { tag: { oneOf: [{ const: 'p' }] } } } },
        },
      },
      $ref: '#/definitions/node',
    };
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(expect.objectContaining({ const: 'p' }));
  });
  it('parses an option with its dependency left unapplied, as a form scores it before the key is filled in', () => {
    const rootSchema: RJSFSchema = {
      oneOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          dependencies: { a: { properties: { c: { type: 'number' } } } },
        },
        { type: 'object', properties: { d: { type: 'string' } } },
      ],
    };
    // `MultiSchemaField` retrieves each option with the real form data, so data without `a` scores the first option
    // with its `dependencies` dropped and nothing merged in -- neither the declared option, which still carries the
    // `dependencies`, nor the applied one, which carries `c`
    const schemas = Object.values(schemaParser(rootSchema)).map(({ $id, ...schema }) => schema);
    expect(schemas).toContainEqual({
      type: 'object',
      properties: { a: { type: 'string' } },
      anyOf: [{ required: ['a'] }],
    });
  });
  it("parses the options of a dependency's oneOf, which omitExtraData() scores", () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { pet: { type: 'string', enum: ['No', 'Yes'] } },
      dependencies: {
        pet: {
          oneOf: [
            { properties: { pet: { enum: ['No'] } } },
            { properties: { pet: { enum: ['Yes'] }, age: { type: 'number' } }, required: ['age'] },
          ],
        },
      },
    };
    // Resolving a dependency only validates the conditions `withExactlyOneSubschema()` builds out of its `oneOf`,
    // where `omitExtraData()` scores the options themselves, augmented with an `anyOf` of their required keys
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(
      expect.objectContaining({ properties: { pet: { enum: ['No'] } }, anyOf: [{ required: ['pet'] }] }),
    );
  });
  it.each([THEN_KEY, ELSE_KEY])("parses the options of a dependency's oneOf declared in an if's %s branch", (key) => {
    const branch: RJSFSchema = {
      dependencies: {
        pet: {
          oneOf: [
            { properties: { pet: { enum: ['No'] } } },
            { properties: { pet: { enum: ['Yes'] }, age: { type: 'number' } }, required: ['age'] },
          ],
        },
      },
    };
    const rootSchema: RJSFSchema = {
      type: 'object',
      properties: { allowed: { type: 'boolean' }, pet: { type: 'string', enum: ['No', 'Yes'] } },
      if: { properties: { allowed: { const: true } }, required: ['allowed'] },
      [key]: branch,
    };
    // Resolution merges the branch into the schema it conditions, which applies the dependency rather than leaving it
    // to be scored, where `omitExtraData()` walks the branch's own schema and scores the `oneOf` of its dependency
    const schemas = Object.values(schemaParser(rootSchema));
    expect(schemas).toContainEqual(
      expect.objectContaining({ properties: { pet: { enum: ['No'] } }, anyOf: [{ required: ['pet'] }] }),
    );
  });
});
