import type { RJSFSchema, ValidatorType } from '../../src/index.ts';
import {
  getClosestMatchingOption,
  getDefaultFormState,
  getFirstMatchingOption,
  getValidationSchemas,
  ID_KEY,
  omitExtraData,
  retrieveSchema,
  schemaKey,
} from '../../src/index.ts';
import looseSchema from './graph/looseSchema.ts';
import { miniValidator } from './graph/miniValidator.ts';

describe('matching options through the schema graph', () => {
  it('passes over a boolean option and one without the discriminator when matching by const', () => {
    const field: RJSFSchema = {
      discriminator: { propertyName: 'kind' },
      oneOf: [true, { properties: { z: {} } }, { properties: { kind: { const: 'b' }, x: {} } }],
    };
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: field } };
    const validator = miniValidator();
    expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { kind: 'b', x: 1, y: 2 } })).toEqual({
      v: { kind: 'b', x: 1 },
    });
    expect(validator.calls).toBe(0);
  });
  it('matches by const alone an option whose base declares the discriminator with neither a const nor an enum', () => {
    const option = (kind: string): RJSFSchema => ({
      allOf: [{ $ref: '#/definitions/Base' }, { properties: { kind: { const: kind }, [kind]: {} } }],
    });
    const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: [option('a'), option('b')] };
    const rootSchema: RJSFSchema = {
      definitions: { Base: { properties: { kind: { type: 'string' } } } },
      type: 'object',
      properties: { v: field },
    };
    const validator = miniValidator();
    expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { kind: 'b', a: 1, b: 2 } })).toEqual({
      v: { kind: 'b', b: 2 },
    });
    expect(validator.calls).toBe(0);
  });
  describe('reading a base that declares the discriminator with neither a const nor an enum', () => {
    type Case = [name: string, kind: RJSFSchema, values: (string | number)[], value: string | number];
    const matching = (kind: RJSFSchema, values: readonly (string | number)[], value: string | number) => {
      const options: RJSFSchema[] = values.map((entry) => ({
        allOf: [{ $ref: '#/definitions/Base' }, { properties: { kind: { const: entry } } }],
      }));
      const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: options };
      const rootSchema: RJSFSchema = {
        definitions: { Base: { properties: { kind } } },
        type: 'object',
        properties: { v: field },
      };
      const validator = miniValidator();
      const index = getFirstMatchingOption({ validator }, { kind: value }, options, rootSchema, 'kind');
      return { index, calls: validator.calls };
    };
    it.each<Case>([
      ['no type', { title: 'Kind' }, ['a', 'b'], 'b'],
      ['a type list allowing the value', { type: ['null', 'string'] }, ['a', 'b'], 'b'],
      ['an integer type the value is', { type: 'integer' }, [1, 2], 2],
    ])('matches by const alone past one with %s', (_name, kind: RJSFSchema, values, value) => {
      expect(matching(kind, values, value)).toEqual({ index: 1, calls: 0 });
    });
    it.each<Case>([
      ['a type the value is not', { type: 'integer' }, [1, 1.5], 1.5],
      ['a pattern', { type: 'string', pattern: '.' }, ['a', 'b'], 'b'],
    ])('leaves the validator to check past one with %s', (_name, kind: RJSFSchema, values, value) => {
      expect(matching(kind, values, value).calls).toBeGreaterThan(0);
    });
  });
  it('asks the validator in order where an earlier option declares the discriminator with a constraint it has to read', () => {
    const oneOf: RJSFSchema[] = [
      { allOf: [{ $ref: '#/definitions/Base' }], properties: { kind: { const: 'a' }, x: {} } },
      { type: 'object', properties: { kind: { enum: ['a', 'z'] }, y: {} } },
    ];
    const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf };
    const rootSchema: RJSFSchema = {
      definitions: { Base: { type: 'object', properties: { kind: { type: 'string', minLength: 1 } } } },
      type: 'object',
      properties: { v: field },
    };
    const context = { validator: miniValidator() };
    expect(getFirstMatchingOption(context, { kind: 'a' }, oneOf, rootSchema, 'kind')).toBe(0);
    expect(getClosestMatchingOption(context, rootSchema, { kind: 'a' }, oneOf, 0, 'kind')).toBe(0);
    expect(getFirstMatchingOption(context, { kind: 'q', y: 1 }, oneOf.slice(1), rootSchema, 'kind')).toBe(0);
  });
  it.each<[string, RJSFSchema]>([
    ['additionalProperties', { additionalProperties: { type: 'string' } }],
    ['patternProperties', { patternProperties: { '^s_': { type: 'string' } } }],
  ])('matches an option whose properties name nothing by the %s an allOf entry declares', (_name, entry) => {
    const oneOf: RJSFSchema[] = [
      { type: 'object', properties: { n: { type: 'number' } } },
      { type: 'object', properties: {}, allOf: [entry] },
    ];
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { oneOf } } };
    expect(getFirstMatchingOption({ validator: miniValidator() }, { s_a: 'x' }, oneOf, rootSchema)).toBe(1);
  });
  it('matches past an option holding a patternProperties pattern no flag compiles', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { a: { type: 'string' } }, patternProperties: { '(?<x': { type: 'string' } } },
      { type: 'object', properties: { b: { type: 'number' } } },
    ];
    const rootSchema: RJSFSchema = { oneOf: options };
    const validator = miniValidator();
    expect(getFirstMatchingOption({ validator }, { b: 1 }, options, rootSchema)).toBe(1);
    expect(getClosestMatchingOption({ validator }, rootSchema, { b: 1 }, options)).toBe(1);
  });
  it('omits by a boolean option the data matches', () => {
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { oneOf: [true] } } };
    expect(omitExtraData({ validator: miniValidator() }, rootSchema, rootSchema, { v: { a: 1 } })).toEqual({
      v: { a: 1 },
    });
  });
  it('drops an empty option list beside dependencies, which offers no choice', () => {
    const rootSchema: RJSFSchema = { type: 'object', dependencies: { a: ['b'] }, oneOf: [] };
    expect(retrieveSchema({ validator: miniValidator() }, rootSchema, rootSchema, {})).not.toHaveProperty('oneOf');
  });
  it('leaves unstubbed a key the selected option declares through the then of a boolean if', () => {
    const rootSchema: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'string' },
      oneOf: [{ if: true, then: { properties: { x: { type: 'number' } } } }],
    };
    const retrieved = retrieveSchema(
      { validator: miniValidator() },
      rootSchema,
      rootSchema,
      { x: 1, y: 'y' },
      false,
      0,
    );
    expect(Object.keys(retrieved.properties ?? {})).toEqual(['y']);
  });
  it('scores the views retrieveSchema() hands out for the options apart from the options they were retrieved from', () => {
    const conditional: RJSFSchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'a' } } },
      then: { properties: { n: { type: 'number' } } },
    };
    const declared: RJSFSchema = { type: 'object', properties: { kind: { type: 'string' }, n: { type: 'number' } } };
    const rootSchema: RJSFSchema = { anyOf: [conditional, declared] };
    const context = { validator: miniValidator() };
    const formData = { kind: 'a', n: 1 };
    // The raw option leaves `n` to its condition, which only its view takes, so the two score the data differently
    expect(getClosestMatchingOption(context, rootSchema, formData, [conditional, declared], 0)).toBe(1);
    const views = retrieveSchema(context, rootSchema, rootSchema, formData, true).anyOf ?? [];
    const objectViews = views.filter((view): view is RJSFSchema => typeof view === 'object');
    expect(objectViews).toHaveLength(2);
    expect(getClosestMatchingOption(context, rootSchema, formData, objectViews, 0)).toBe(0);
  });
  it('picks for data mutated in place since the last call what it holds now, at any depth', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { a: { type: 'string' } }, required: ['a'] },
      { type: 'object', properties: { b: { type: 'string' } }, required: ['b'] },
    ];
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { anyOf: options } } };
    const context = { validator: miniValidator() };
    const inner: Record<string, string> = { a: 'x' };
    const formData = { v: inner };
    const outer: RJSFSchema[] = [
      { type: 'object', properties: { v: { anyOf: options } } },
      { type: 'object', properties: { w: { type: 'string' } } },
    ];
    expect(getClosestMatchingOption(context, rootSchema, inner, options)).toBe(0);
    expect(getClosestMatchingOption(context, rootSchema, formData, outer)).toBe(0);

    delete inner.a;
    inner.b = 'y';

    expect(getClosestMatchingOption(context, rootSchema, inner, options)).toBe(1);
    expect(getClosestMatchingOption(context, rootSchema, formData, outer)).toBe(0);
  });
  it('picks for data holding a Date changed in place since the last call what it holds now', () => {
    const early = new Date(0);
    const late = new Date(1000);
    const options: RJSFSchema[] = [
      { type: 'object', properties: { when: looseSchema({ const: early }) }, required: ['when'] },
      { type: 'object', properties: { when: looseSchema({ const: late }) }, required: ['when'] },
    ];
    const rootSchema: RJSFSchema = { anyOf: options };
    const context = { validator: miniValidator() };
    const when = new Date(0);
    const formData = { when };
    expect(getClosestMatchingOption(context, rootSchema, formData, options)).toBe(0);

    when.setTime(1000);

    expect(getClosestMatchingOption(context, rootSchema, formData, options)).toBe(1);
  });
  it('picks for an array holding a Date changed in place since the last call what it holds now', () => {
    const options: RJSFSchema[] = [
      { type: 'array', items: looseSchema({ const: new Date(0) }) },
      { type: 'array', items: looseSchema({ const: new Date(1000) }) },
    ];
    const rootSchema: RJSFSchema = { anyOf: options };
    const context = { validator: miniValidator() };
    const when = new Date(0);
    const formData = [when];
    expect(getClosestMatchingOption(context, rootSchema, formData, options)).toBe(0);

    when.setTime(1000);

    expect(getClosestMatchingOption(context, rootSchema, formData, options)).toBe(1);
  });
  describe('options that refer to one another across definitions (#4990)', () => {
    const names = ['A', 'B', 'C', 'D', 'E'];
    const definitions = Object.fromEntries(
      names.map((name): [string, RJSFSchema] => [
        name,
        {
          type: 'object',
          properties: {
            child: {
              oneOf: [
                { type: 'null' },
                ...names.filter((other) => other !== name).map((other) => ({ $ref: `#/definitions/${other}` })),
              ],
            },
          },
        },
      ]),
    );
    const options: RJSFSchema[] = [{ type: 'null' }, ...names.map((name) => ({ $ref: `#/definitions/${name}` }))];
    const rootSchema: RJSFSchema = { definitions, oneOf: options };
    const nested = (depth: number, value: unknown): unknown =>
      depth === 1 ? { child: null, value } : { child: nested(depth - 1, value) };
    const validations = (value: unknown) =>
      [3, 4, 5, 6].map((depth) => {
        const validator = miniValidator();
        getClosestMatchingOption({ validator }, rootSchema, nested(depth, value), options);
        return validator.calls;
      });

    it('matches data holding a Date at its deepest level as often as data holding a string there', () => {
      const counts = validations(new Date(0));
      const steps = counts.slice(1).map((count, index) => count - counts[index]);

      expect(counts).toEqual(validations('x'));
      expect(new Set(steps).size).toBe(1);
    });
  });
  describe('options sharing a base that declares a key the data holds', () => {
    const pet = {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    } satisfies RJSFSchema;
    type Case = [name: string, cat: RJSFSchema, dog: RJSFSchema];
    it.each<Case>([
      [
        'a $ref beside its own properties',
        { $ref: '#/definitions/Pet', properties: { meows: { type: 'boolean' } }, required: ['meows'] },
        { $ref: '#/definitions/Pet', properties: { barks: { type: 'boolean' } }, required: ['barks'] },
      ],
      [
        'an allOf of the base and their own properties',
        { allOf: [{ $ref: '#/definitions/Pet' }, { properties: { meows: { type: 'boolean' } }, required: ['meows'] }] },
        { allOf: [{ $ref: '#/definitions/Pet' }, { properties: { barks: { type: 'boolean' } }, required: ['barks'] }] },
      ],
    ])('takes the option whose own keys the data holds, for options written as %s', (_name, cat, dog) => {
      const rootSchema: RJSFSchema = {
        definitions: { Pet: pet },
        type: 'object',
        properties: { v: { oneOf: [cat, dog] } },
      };
      const validator = miniValidator();
      const data = { name: 'x', barks: true };
      expect(getClosestMatchingOption({ validator }, rootSchema, data, [cat, dog])).toBe(1);
      expect(getClosestMatchingOption({ validator }, rootSchema, data, [cat, dog], 0)).toBe(1);
      expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { ...data, junk: 1 } })).toEqual({ v: data });
    });
  });
  it('scores an option by the properties its allOf entries add, passing over a boolean entry', () => {
    const options: RJSFSchema[] = [
      { allOf: [{ properties: { b: { type: 'string' } } }] },
      { allOf: [true, { properties: { a: { type: 'string' } } }, { properties: { c: { type: 'string' } } }] },
    ];
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: { anyOf: options } } };
    const data = { a: 'x', b: 'y', c: 'z' };
    expect(getClosestMatchingOption({ validator: miniValidator() }, rootSchema, data, options)).toBe(1);
  });
  it('scores a recursive definition a property reaches through an allOf as far as the data goes', () => {
    const options: RJSFSchema[] = [
      { $ref: '#/definitions/Node' },
      { type: 'object', properties: { other: { type: 'string' } } },
    ];
    const rootSchema: RJSFSchema = {
      definitions: {
        Node: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            parent: { type: 'object', description: 'The parent', allOf: [{ $ref: '#/definitions/Node' }] },
          },
        },
      },
      type: 'object',
      properties: { v: { oneOf: options } },
    };
    const validator = miniValidator();
    expect(
      getClosestMatchingOption({ validator }, rootSchema, { name: 'x', other: 'y', parent: { name: 'p' } }, options),
    ).toBe(0);
    // With no data every option ties, and the tie goes to the first candidate
    expect(getClosestMatchingOption({ validator }, rootSchema, undefined, options)).toBe(0);
  });
  it.each([
    ['resolves to nothing', '#/definitions/missing'],
    ['loops', '#/definitions/a'],
  ])('scores an allOf entry whose $ref %s as nothing, without throwing', (_name, $ref) => {
    const options: RJSFSchema[] = [{ type: 'object', properties: { a: { type: 'string' } } }, { allOf: [{ $ref }] }];
    const rootSchema: RJSFSchema = {
      definitions: { a: { $ref: '#/definitions/b' }, b: { $ref: '#/definitions/a' } },
      type: 'object',
      properties: { v: { anyOf: options } },
    };
    const field: RJSFSchema = { definitions: rootSchema.definitions, anyOf: options };
    // A validator fails a schema holding a `$ref` it cannot resolve, so neither option matches and both are scored
    const validator = { ...miniValidator(), isValid: () => false };
    // Both options score nothing, so the tie goes to the first candidate: the broken entry adds nothing to the second
    expect(getClosestMatchingOption({ validator }, rootSchema, { b: 1 }, options)).toBe(0);
    expect(omitExtraData({ validator }, field, field, { b: 1 })).toEqual({});
    expect(getDefaultFormState({ validator }, { schema: rootSchema, formData: { v: { b: 1 } }, rootSchema })).toEqual({
      v: { b: 1 },
    });
  });
  it.each([
    [
      'an allOf entry',
      (kind: string, key: string): RJSFSchema => ({
        allOf: [{ properties: { kind: { const: kind } } }],
        properties: { [key]: {} },
      }),
    ],
    [
      'its then',
      (kind: string, key: string): RJSFSchema => ({
        if: true,
        then: { properties: { kind: { const: kind } } },
        properties: { [key]: {} },
      }),
    ],
  ])('matches by its keys data without the discriminator when the options declare it in %s', (_name, option) => {
    const options = [option('a', 'x'), option('b', 'y')];
    const field: RJSFSchema = { discriminator: { propertyName: 'kind' }, oneOf: options };
    const rootSchema: RJSFSchema = { type: 'object', properties: { v: field } };
    const validator = miniValidator();
    expect(getFirstMatchingOption({ validator }, { y: 1 }, options, rootSchema, 'kind')).toBe(1);
    expect(getClosestMatchingOption({ validator }, rootSchema, { y: 1 }, options, -1, 'kind')).toBe(1);
    expect(omitExtraData({ validator }, rootSchema, rootSchema, { v: { y: 1 } })).toEqual({ v: { y: 1 } });
  });
  describe('options whose every declaration of the discriminator accepts the value', () => {
    const options: RJSFSchema[] = [{ $ref: '#/definitions/Cat' }, { $ref: '#/definitions/Dog' }];
    const pet: RJSFSchema = { discriminator: { propertyName: 'petType' }, oneOf: options };
    const rootOf = (own: (key: string, other: string) => RJSFSchema): RJSFSchema => ({
      definitions: {
        Pet: { type: 'object', properties: { petType: { type: 'string' } } },
        Cat: { allOf: [{ $ref: '#/definitions/Pet' }], ...own('hunts', 'barks') },
        Dog: { allOf: [{ $ref: '#/definitions/Pet' }], ...own('barks', 'hunts') },
      },
      type: 'object',
      properties: { pet },
    });
    const data = { petType: 'Dog', barks: true };
    it('matches by the whole option, which rejects the keys of the other', () => {
      const rootSchema = rootOf((key, other) => ({
        properties: { petType: true, [key]: { type: 'boolean' }, [other]: false },
      }));
      const validator = miniValidator();
      expect(getFirstMatchingOption({ validator }, data, options, rootSchema, 'petType')).toBe(1);
      expect(getFirstMatchingOption({ validator }, data, options, rootSchema)).toBe(1);
    });
    it('scores the options by their keys where both match', () => {
      const rootSchema = rootOf((key) => ({
        properties: { petType: true, [key]: { type: 'boolean' } },
        required: [key],
      }));
      const validator = miniValidator();
      expect(getClosestMatchingOption({ validator }, rootSchema, data, options, 0, 'petType')).toBe(1);
      expect(omitExtraData({ validator }, rootSchema, rootSchema, { pet: data })).toEqual({ pet: data });
    });
  });
});

describe('scoring an option with keys of the data stubbed into it', () => {
  /** A validator that records the schemas it is asked about and answers true for every one */
  function recordingValidator() {
    const schemas: RJSFSchema[] = [];
    const validator: ValidatorType = {
      validateFormData: () => ({ errors: [], errorSchema: {} }),
      isValid: (schema: RJSFSchema) => {
        schemas.push(schema);
        return true;
      },
      rawValidation: () => ({}),
    };
    return { schemas, validator };
  }
  const declared: RJSFSchema = {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
    patternProperties: { '^s_': { type: 'string' } },
  };
  const mapOnly: RJSFSchema = { type: 'object', additionalProperties: true };
  const options: RJSFSchema[] = [declared, { type: 'number' }];
  const mapOptions: RJSFSchema[] = [mapOnly, { type: 'number' }];
  const rootSchema: RJSFSchema = {
    type: 'object',
    properties: { v: { oneOf: options }, m: { oneOf: mapOptions } },
  };
  /** The option as it is scored: without its `required`, each subschema named where it sits in the root */
  const scored: RJSFSchema = {
    type: 'object',
    properties: { id: { $ref: '#/properties/v/oneOf/0/properties/id' } },
    patternProperties: { '^s_': { $ref: '#/properties/v/oneOf/0/patternProperties/%5Es_' } },
  };
  /** Matches the options retrieved against `data`, as `MultiSchemaField` retrieves them, returning the index matched
   * and the schemas the validator was asked about while matching
   */
  function matching(candidates: RJSFSchema[], data: unknown) {
    const { schemas, validator } = recordingValidator();
    const retrieved = candidates.map((option) => retrieveSchema({ validator }, option, rootSchema, data));
    schemas.length = 0;
    const index = getFirstMatchingOption({ validator }, data, retrieved, rootSchema);
    return { index, schemas };
  }

  it('scores it without the stubs, in the form that does not depend on the keys', () => {
    expect(matching(options, { id: 'x', s_a: 'y' }).schemas).toEqual([scored]);
    expect(Object.values(getValidationSchemas(rootSchema))).toContainEqual({ ...scored, [ID_KEY]: schemaKey(scored) });
  });
  it('scores the same option with no stubs by the same schema, the names it declares checked without the validator', () => {
    expect(matching(options, { id: 'x' }).schemas).toEqual([scored]);
  });
  it('does not ask the validator about it while every stubbed key holds undefined', () => {
    // A key holding undefined is no key, as `required` reads it, so the data holds none the option declares
    expect(matching(options, { s_a: undefined })).toEqual({ index: 1, schemas: [{ $ref: '#/properties/v/oneOf/1' }] });
  });
  it('scores an option with no names of its own by where it sits, whether or not a stubbed key holds undefined', () => {
    expect(matching(mapOptions, { z: undefined }).schemas).toEqual([{ $ref: '#/properties/m/oneOf/0' }]);
    expect(matching(mapOptions, { z: 'set' }).schemas).toEqual([{ $ref: '#/properties/m/oneOf/0' }]);
  });
  it('derives the scored form once per option', () => {
    const { schemas, validator } = recordingValidator();
    const retrieved = retrieveSchema({ validator }, declared, rootSchema, { s_a: 'x' });
    getFirstMatchingOption({ validator }, { s_a: 'x' }, [retrieved], rootSchema);
    getFirstMatchingOption({ validator }, { s_a: 'y' }, [retrieved], rootSchema);
    getFirstMatchingOption({ validator }, { s_a: undefined }, [retrieved], rootSchema);
    getFirstMatchingOption({ validator }, {}, [retrieved], rootSchema);
    expect(schemas).toEqual([scored, scored]);
    expect(schemas[1]).toBe(schemas[0]);
  });
  it('scores non-object data by the same schema', () => {
    expect(matching(options, 'text').schemas).toEqual([scored]);
  });
});
