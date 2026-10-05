import type { GenericObjectType, RJSFSchema } from '../../src/index.ts';
import { isObject, mergeSchemas, schemaParser } from '../../src/index.ts';
import {
  CHOICE as choice,
  SCHEMA_MERGED_FOR_PATTERN_KEY,
  SCHEMA_MERGED_FOR_PATTERN_PROPERTY,
  TITLED_CHOICE_OPTION,
  titleChoiceMergeAllOf as customMergeAllOf,
} from '../testUtils/customMergeAllOfData.ts';
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
    // An option is validated both as `getFirstMatchingOption()` augments it and with its `additionalProperties`
    // relaxed for scoring. Neither is the schema the `$id` names, so each is keyed by its own content: holding the
    // `$id` would compile only the first and answer the rest with its function
    expect(schemaMap.identified).toBeUndefined();
    expect(Object.values(schemaMap).filter((schema) => schema.properties?.name)).toEqual([
      expect.objectContaining({ additionalProperties: false }),
      expect.objectContaining({ additionalProperties: true }),
    ]);
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
    const customMergeAllOf = (schema: RJSFSchema) => {
      const { allOf = [], ...rest } = schema;
      mergedLists.push(allOf.filter(isObject).flatMap((subSchema) => Object.keys(subSchema.properties ?? {})));
      return allOf.reduce<GenericObjectType>(
        (acc, subSchema) => (isObject(subSchema) ? mergeSchemas(acc, subSchema) : acc),
        rest,
      );
    };
    schemaParser(rootSchema, { customMergeAllOf });
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
  it('reports a schema with more patternProperties than the combinations of them can be enumerated for', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      patternProperties: Object.fromEntries(
        Array.from({ length: 17 }, (_, i) => [`^p${i}`, { properties: { [`v${i}`]: { type: 'string' } } }]),
      ),
    };
    expect(() => schemaParser(rootSchema)).toThrow(/A schema has 17 patternProperties, more than the 16/);
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
      const { allOf = [], ...rest } = schema;
      return allOf.reduce<GenericObjectType>((acc, s) => (isObject(s) ? mergeSchemas(acc, s) : acc), rest);
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
      const identityMergeAllOf = (schema: RJSFSchema) => schema;
      // A merge that returns its input leaves the `allOf` for `omitExtraData()` to walk, scoring the options of each
      // entry it finds there
      const schemas = Object.values(schemaParser(rootSchema, { customMergeAllOf: identityMergeAllOf }));
      expect(schemas).toContainEqual(expect.objectContaining({ allOf: expect.any(Array) }));
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'a' }));
      expect(schemas).toContainEqual(expect.objectContaining({ const: 'b' }));
    });
    it('parses the entries of an allOf only reached through a condition or a dependency', () => {
      const identityMergeAllOf = (schema: RJSFSchema) => schema;
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
});
