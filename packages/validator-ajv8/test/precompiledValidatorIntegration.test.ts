/**
 * Integration tests verifying that getFirstMatchingOption, getClosestMatchingOption, and
 * omitExtraData work correctly when given an AJV8PrecompiledValidator whose schemas were
 * compiled from a oneOf/anyOf that contains options with `additionalProperties: false`.
 *
 * The critical property under test: omitExtraData's handleOneOf relaxes
 * `additionalProperties:false → true` before scoring options, and resolveAnyOrOneOfSchemas
 * now captures those relaxed schemas (plus their augmented forms) in the schemaParser so
 * that precompiled validators can find them via isValid() without throwing.
 */

import type { RJSFSchema } from '@rjsf/utils';
import {
  createSchemaUtils,
  getClosestMatchingOption,
  getFirstMatchingOption,
  omitExtraData,
  relaxOptionsForScoring,
  withVariantId,
  declineCheckSchema,
} from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator, customizeValidator } from '../src/index.ts';
import { evalValidatorCode } from './harness/compileSuperSchema.ts';

/** Compiles `schema` to AJV standalone code in memory and wraps it in an AJV8PrecompiledValidator. */
function buildPrecompiledValidator(schema: RJSFSchema) {
  return createPrecompiledValidator(evalValidatorCode(compileSchemaValidatorsCode(schema)), schema);
}

// ─── Test schemas ─────────────────────────────────────────────────────────────

/** oneOf with direct additionalProperties:false on each branch */
const STRICT_ONEOF_SCHEMA: RJSFSchema = {
  type: 'object',
  oneOf: [
    {
      type: 'object',
      properties: {
        kind: { const: 'a' },
        foo: { type: 'string' },
      },
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        kind: { const: 'b' },
        bar: { type: 'string' },
      },
      additionalProperties: false,
    },
  ],
};

/** oneOf where each branch is a $ref to a definition that has additionalProperties:false */
const STRICT_ONEOF_REF_SCHEMA: RJSFSchema = {
  definitions: {
    TypeA: {
      type: 'object',
      properties: {
        kind: { const: 'a' },
        foo: { type: 'string' },
      },
      additionalProperties: false,
    },
    TypeB: {
      type: 'object',
      properties: {
        kind: { const: 'b' },
        bar: { type: 'string' },
      },
      additionalProperties: false,
    },
  },
  type: 'object',
  oneOf: [{ $ref: '#/definitions/TypeA' }, { $ref: '#/definitions/TypeB' }],
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('precompiled validator integration: oneOf with additionalProperties:false', () => {
  describe('direct options (no $ref)', () => {
    let validator: ReturnType<typeof buildPrecompiledValidator>;

    beforeAll(() => {
      validator = buildPrecompiledValidator(STRICT_ONEOF_SCHEMA);
    });

    describe('getFirstMatchingOption()', () => {
      it('returns 0 when formData matches the first strict option exactly', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(getFirstMatchingOption({ validator }, { kind: 'a', foo: 'hello' }, options, STRICT_ONEOF_SCHEMA)).toBe(
          0,
        );
      });

      it('returns 1 when formData matches the second strict option exactly', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(getFirstMatchingOption({ validator }, { kind: 'b', bar: 'world' }, options, STRICT_ONEOF_SCHEMA)).toBe(
          1,
        );
      });

      it('does not throw when called with manually relaxed options and data containing extra keys', () => {
        const relaxed = relaxOptionsForScoring(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(() =>
          getFirstMatchingOption(
            { validator },
            { kind: 'a', foo: 'hello', extra: 'data' },
            relaxed,
            STRICT_ONEOF_SCHEMA,
          ),
        ).not.toThrow();
      });

      it('finds the correct match with relaxed options and extra keys in formData', () => {
        const relaxed = relaxOptionsForScoring(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(
          getFirstMatchingOption(
            { validator },
            { kind: 'a', foo: 'hello', extra: 'data' },
            relaxed,
            STRICT_ONEOF_SCHEMA,
          ),
        ).toBe(0);
      });
    });

    describe('getClosestMatchingOption()', () => {
      it('returns 0 for formData matching the first strict option', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(
          getClosestMatchingOption({ validator }, STRICT_ONEOF_SCHEMA, { kind: 'a', foo: 'hello' }, options, 0),
        ).toBe(0);
      });

      it('returns 1 for formData matching the second strict option', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(
          getClosestMatchingOption({ validator }, STRICT_ONEOF_SCHEMA, { kind: 'b', bar: 'world' }, options, 0),
        ).toBe(1);
      });

      it('does not throw with relaxed options and extra keys in formData', () => {
        const relaxed = relaxOptionsForScoring(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(() =>
          getClosestMatchingOption({ validator }, STRICT_ONEOF_SCHEMA, { kind: 'a', extra: 'data' }, relaxed, 0),
        ).not.toThrow();
      });

      it('picks the correct branch with relaxed options and extra keys', () => {
        const relaxed = relaxOptionsForScoring(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(
          getClosestMatchingOption(
            { validator },
            STRICT_ONEOF_SCHEMA,
            { kind: 'b', bar: 'hello', extra: 'ignored' },
            relaxed,
            0,
          ),
        ).toBe(1);
      });
    });

    describe('omitExtraData()', () => {
      it('filters formData to the matching branch without extra keys', () => {
        expect(
          omitExtraData({ validator }, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, { kind: 'a', foo: 'hello' }),
        ).toEqual({ kind: 'a', foo: 'hello' });
      });

      it('does not throw when formData contains extra keys (exercises the relaxation path)', () => {
        expect(() =>
          omitExtraData({ validator }, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).not.toThrow();
      });

      it('drops extra keys when formData matches the first branch', () => {
        expect(
          omitExtraData({ validator }, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'a', foo: 'hello' });
      });

      it('drops extra keys when formData matches the second branch', () => {
        expect(
          omitExtraData({ validator }, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, {
            kind: 'b',
            bar: 'world',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'b', bar: 'world' });
      });
    });
  });

  describe('$ref options (branches defined via $ref to strict definitions)', () => {
    let validator: ReturnType<typeof buildPrecompiledValidator>;

    beforeAll(() => {
      validator = buildPrecompiledValidator(STRICT_ONEOF_REF_SCHEMA);
    });

    describe('omitExtraData()', () => {
      it('does not throw when formData contains extra keys', () => {
        expect(() =>
          omitExtraData({ validator }, STRICT_ONEOF_REF_SCHEMA, STRICT_ONEOF_REF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).not.toThrow();
      });

      it('drops extra keys when formData matches the first $ref branch', () => {
        expect(
          omitExtraData({ validator }, STRICT_ONEOF_REF_SCHEMA, STRICT_ONEOF_REF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'a', foo: 'hello' });
      });

      it('drops extra keys when formData matches the second $ref branch', () => {
        expect(
          omitExtraData({ validator }, STRICT_ONEOF_REF_SCHEMA, STRICT_ONEOF_REF_SCHEMA, {
            kind: 'b',
            bar: 'world',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'b', bar: 'world' });
      });
    });
  });
  describe('an option whose schema dependencies the user fills in one at a time', () => {
    /** A form applies a dependency once its key has a value, so the option is scored with whichever subset of them
     * the data has filled in, not only with none or all of them applied
     */
    const DEPENDENCY_ONEOF_SCHEMA: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' }, b: { type: 'string' } },
          dependencies: {
            a: { properties: { a2: { type: 'string' } } },
            b: { properties: { b2: { type: 'string' } } },
          },
        },
        { type: 'object', properties: { z: { type: 'number' } } },
      ],
    };

    it.each([[{}], [{ a: 'q' }], [{ b: 'r' }], [{ a: 'q', b: 'r' }]])(
      'scores the option it retrieved for %s',
      (formData) => {
        const validator = buildPrecompiledValidator(DEPENDENCY_ONEOF_SCHEMA);
        const schemaUtils = createSchemaUtils({ validator }, DEPENDENCY_ONEOF_SCHEMA);
        const options = DEPENDENCY_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        // `MultiSchemaField` scores the option it retrieved and then validates it as it stands, which asked for a
        // schema no parse had reached for a partly filled-in option and threw rather than rendering
        const chosen = getClosestMatchingOption({ validator }, DEPENDENCY_ONEOF_SCHEMA, formData, options, 0);
        const retrieved = schemaUtils.retrieveSchema(options[chosen], formData);
        expect(validator.isValid(withVariantId(retrieved), formData, DEPENDENCY_ONEOF_SCHEMA)).toBe(true);
      },
    );
  });
  describe('a retrieved option validated as it stands', () => {
    /** The options carry an `$id`, which is what a validator keys the function it compiles by, so a retrieved option
     * validated under it would be answered by the function compiled for the option as declared
     */
    const ID_ONEOF_SCHEMA: RJSFSchema = {
      type: 'object',
      oneOf: [
        { $id: 'http://e.com/a.json', type: 'object', properties: { a: { type: 'string' } } },
        { $id: 'http://e.com/b.json', type: 'object', properties: { b: { type: 'number' } } },
      ],
    };

    it('is compiled under the derived $id that MultiSchemaField validates it under', () => {
      const validator = buildPrecompiledValidator(ID_ONEOF_SCHEMA);
      const schemaUtils = createSchemaUtils({ validator }, ID_ONEOF_SCHEMA);
      // `MultiSchemaField` keeps the chosen option while the data still fits it, which asks the validator for the
      // option it retrieved rather than for a scoring form of it
      const retrieved = schemaUtils.retrieveSchema(ID_ONEOF_SCHEMA.oneOf![0] as RJSFSchema, { a: 'x' });
      expect(validator.isValid(withVariantId(retrieved), { a: 'x' }, ID_ONEOF_SCHEMA)).toBe(true);
      expect(validator.isValid(withVariantId(retrieved), { a: 5 }, ID_ONEOF_SCHEMA)).toBe(false);
    });

    it('is compiled for an option that carries no $id of its own', () => {
      const anonymous: RJSFSchema = {
        type: 'object',
        oneOf: [
          { type: 'object', properties: { a: { type: 'string' } } },
          { type: 'object', properties: { b: { type: 'number' } } },
        ],
      };
      const validator = buildPrecompiledValidator(anonymous);
      const schemaUtils = createSchemaUtils({ validator }, anonymous);
      const retrieved = schemaUtils.retrieveSchema(anonymous.oneOf![1] as RJSFSchema, { b: 1 });
      expect(validator.isValid(withVariantId(retrieved), { b: 1 }, anonymous)).toBe(true);
    });
  });
});

describe('an option whose patternProperties or additionalProperties take keys from the form data', () => {
  /** Retrieving an option against the data stubs each key its `patternProperties` or `additionalProperties` take into
   * its `properties`. Those stubs only render the keys: options are scored and checked without them, so the precompiled
   * and live validators validate the same schema, and the keyword that takes a key decides its value
   */
  function rootFor(options: RJSFSchema[], discriminator?: string): RJSFSchema {
    const v: RJSFSchema = { oneOf: options };
    if (discriminator) {
      v.discriminator = { propertyName: discriminator };
    }
    return { type: 'object', properties: { v } };
  }

  /** The option the precompiled and the live validator each pick for `data`, scoring the options retrieved against
   * it as `MultiSchemaField` does, through both `getFirstMatchingOption()` and `getClosestMatchingOption()`
   */
  function picks(options: RJSFSchema[], data: unknown, discriminator?: string) {
    const root = rootFor(options, discriminator);
    return [buildPrecompiledValidator(root), customizeValidator()].map((validator) => {
      const schemaUtils = createSchemaUtils({ validator }, root);
      const retrieved = options.map((option) => schemaUtils.retrieveSchema(option, data));
      return [
        getFirstMatchingOption({ validator }, data, retrieved, root, discriminator),
        getClosestMatchingOption({ validator }, root, data, retrieved, 0, discriminator),
      ];
    });
  }

  it('does not let the `{ type: "null" }` stub of a key `additionalProperties: false` forbids match it', () => {
    // Option 0 forbids `other`, which its `{ type: 'null' }` stub would accept, so option 1 is picked
    const options: RJSFSchema[] = [
      {
        type: 'object',
        properties: { id: { type: 'string' } },
        patternProperties: { '^s_': { type: 'string' } },
        additionalProperties: false,
      },
      { type: 'object', properties: { other: {} } },
    ];
    expect(picks(options, { other: null })).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
  it('applies the `not` a guessed-type stub drops', () => {
    // `{ k: 'x' }` breaks option 1's `additionalProperties`, whose `not` its stub for `k` drops, so option 2 is picked
    const options: RJSFSchema[] = [
      { type: 'object', properties: { q: { type: 'number' } } },
      { type: 'object', properties: { id: { type: 'string' } }, additionalProperties: { not: { const: 'x' } } },
      { type: 'object', properties: { k: { const: 'x' } } },
    ];
    expect(picks(options, { k: 'x' })).toEqual([
      [2, 2],
      [2, 2],
    ]);
    expect(picks(options, { k: 'y' })).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
  it('does not count a key holding undefined as one the option takes', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { q: { type: 'number' } } },
      { type: 'object', properties: { a: { type: 'string' } }, additionalProperties: true },
    ];
    // `required` treats a key holding undefined as missing, so `z` doesn't satisfy the `anyOf` of option 1's names
    const [precompiled, live] = picks(options, { z: undefined });
    expect(precompiled[0]).toBe(0);
    expect(live[0]).toBe(0);
    expect(precompiled[1]).toBe(live[1]);
    expect(picks(options, { z: 'set' })).toEqual([
      [1, 1],
      [1, 1],
    ]);
    // An option that declares no names of its own fails for such data too, as the `anyOf` of the stubbed names did
    const mapOnly: RJSFSchema[] = [options[0], { type: 'object', additionalProperties: true }];
    const [precompiledMap, liveMap] = picks(mapOnly, { z: undefined });
    expect(precompiledMap[0]).toBe(0);
    expect(liveMap[0]).toBe(0);
    expect(precompiledMap[1]).toBe(liveMap[1]);
    expect(picks(mapOnly, { z: 'set' })).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
  it('scores an option with a `required` by the schema the parse records for a key it takes', () => {
    const options: RJSFSchema[] = [
      { type: 'number' },
      {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
        additionalProperties: { type: 'string' },
      },
    ];
    expect(picks(options, { id: 'a', k: 'v' })).toEqual([
      [1, 1],
      [1, 1],
    ]);
  });
  it('scores an option whose discriminator is only a stub for the key of the data, rather than checking the stub', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { kind: { const: 'a' } } },
      { type: 'object', properties: { x: {} }, additionalProperties: { not: { const: 'zzz' } } },
    ];
    // Option 1 doesn't declare `kind`, and its `additionalProperties` rejects `'zzz'`, which the stub would accept
    const [precompiled, live] = picks(options, { kind: 'zzz' }, 'kind');
    expect(precompiled[0]).toBe(0);
    expect(live[0]).toBe(0);
    // When no option validates, `getClosestMatchingOption()` falls back to a score that still counts the stub; both
    // validators agree on it
    expect(precompiled[1]).toBe(live[1]);
    expect(picks(options, { kind: 'a' }, 'kind')).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });
  it('does not take a stubbed discriminator as a simple discriminator match either', () => {
    // Option 1's stub for `kind` keeps the `enum` of its `additionalProperties` but drops the `not` that rejects 'a'
    const options: RJSFSchema[] = [
      { type: 'object', properties: { kind: { const: 'b' } } },
      { type: 'object', properties: { x: {} }, additionalProperties: { enum: ['a', 'b'], not: { const: 'a' } } },
      { type: 'object', properties: { kind: { type: 'string' } } },
    ];
    const [precompiled, live] = picks(options, { kind: 'a' }, 'kind');
    expect(precompiled[0]).toBe(2);
    expect(live[0]).toBe(2);
  });
  it('scores and checks an option without the stubs retrieved into a property a pattern also matches', () => {
    const options: RJSFSchema[] = [
      {
        type: 'object',
        properties: { s_cfg: { type: 'object' } },
        patternProperties: { '^s_': { type: 'object', additionalProperties: { type: 'string' } } },
      },
      { type: 'number' },
    ];
    const data = { s_cfg: { inner: 'x' } };
    expect(picks(options, data)).toEqual([
      [0, 0],
      [0, 0],
    ]);
    const root = rootFor(options);
    const validator = buildPrecompiledValidator(root);
    const retrieved = createSchemaUtils({ validator }, root).retrieveSchema(options[0], data);
    expect(validator.isValid(declineCheckSchema(retrieved), data, root)).toBe(true);
  });
  it('checks a retrieved option that carries an `$id` as MultiSchemaField does when a switch is declined', () => {
    const options: RJSFSchema[] = [
      { $id: 'http://e.com/opt.json', type: 'object', additionalProperties: { type: 'string' } },
      { type: 'number' },
    ];
    const root = rootFor(options);
    const validator = buildPrecompiledValidator(root);
    const live = customizeValidator();
    for (const data of [{ k: 'v' }, { k: 1 }]) {
      const chosen = createSchemaUtils({ validator: live }, root).retrieveSchema(options[0], data);
      // Checked as `MultiSchemaField` checks it, under an `$id` derived from its content without the stubs
      const checked = declineCheckSchema(chosen);
      expect(validator.isValid(checked, data, root)).toBe(live.isValid(checked, data, root));
    }
    expect(picks(options, { k: 'v' })).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });
  it.each([
    [{ id: 'a', s_na: 'xx' }, 0],
    [{ name: 'a', s_na: 'x' }, 2],
    [{ kind: 'extra', n: 1 }, 1],
    [{ kind: 'extra', n: 'one', name: 'b' }, 2],
    [{ name: 'a' }, 2],
  ])('picks the same option for %j with either validator', (data, expected) => {
    const options: RJSFSchema[] = [
      {
        type: 'object',
        properties: { id: { type: 'string' } },
        patternProperties: { '^s_': { type: 'string' }, '^s_n': { minLength: 2 } },
        additionalProperties: false,
      },
      { type: 'object', properties: { kind: { const: 'extra' } }, additionalProperties: { type: 'number' } },
      { type: 'object', properties: { name: { type: 'string' } } },
      { type: 'number' },
    ];
    expect(picks(options, data)).toEqual([
      [expected, expected],
      [expected, expected],
    ]);
  });
  /** Whether the first option, retrieved against `data`, passes the check `MultiSchemaField` runs when a switch is
   * declined, answered by the precompiled and the live validator
   */
  function declineChecks(options: RJSFSchema[], data: unknown, discriminator?: string) {
    const root = rootFor(options, discriminator);
    return [buildPrecompiledValidator(root), customizeValidator()].map((validator) => {
      const retrieved = createSchemaUtils({ validator }, root).retrieveSchema(options[0], data);
      return validator.isValid(declineCheckSchema(retrieved), data, root);
    });
  }
  it.each([
    [
      'an `allOf` entry',
      {
        allOf: [
          { type: 'object', properties: { id: { type: 'string', maxLength: 2 } } },
          { patternProperties: { '^s_': { type: 'string' } } },
        ],
      },
      { id: 'abc', s_x: 'v' },
    ],
    [
      'the rest of a schema whose `then` takes extra keys',
      {
        type: 'object',
        properties: { id: { type: 'string', maxLength: 2 } },
        if: { required: ['id'] },
        then: { additionalProperties: { type: 'string' } },
      },
      { id: 'abcdef', k: 'v' },
    ],
  ] as [string, RJSFSchema, object][])(
    'keeps a property declared by %s, rather than taking it as a stub another part stubbed',
    (_, first, data) => {
      // The declared `id` is too long, so option 0 fails and option 1 is picked
      const options: RJSFSchema[] = [first, { type: 'object', properties: { id: { type: 'string' } } }];
      expect(picks(options, data)).toEqual([
        [1, 1],
        [1, 1],
      ]);
      expect(declineChecks(options, data)).toEqual([false, false]);
    },
  );
  it('takes a discriminator declared in one `allOf` entry as declared when another entry takes extra keys', () => {
    const base: RJSFSchema = {
      type: 'object',
      properties: { name: { type: 'string' } },
      additionalProperties: { type: 'string' },
    };
    const options: RJSFSchema[] = [
      { allOf: [base, { properties: { kind: { const: 'a' } } }] },
      { allOf: [base, { properties: { kind: { const: 'b' } } }] },
    ];
    const data = { kind: 'b', name: 'x' };
    expect(picks(options, data, 'kind')).toEqual([
      [1, 1],
      [1, 1],
    ]);
    expect(declineChecks(options, data, 'kind')).toEqual([false, false]);
  });
  it('throws for a stubbed schema handed to it as it stands, as for any schema the parse never saw', () => {
    const options: RJSFSchema[] = [
      { type: 'object', properties: { id: { type: 'string' } }, patternProperties: { '^s_': { type: 'string' } } },
      { type: 'number' },
    ];
    const root = rootFor(options);
    const validator = buildPrecompiledValidator(root);
    const stubbed = createSchemaUtils({ validator }, root).retrieveSchema(options[0], { s_a: 'x' });
    expect(() => validator.isValid(stubbed, { s_a: 'x' }, root)).toThrow(/No precompiled validator function was found/);
    expect(() => validator.isValid({ type: 'string', minLength: 99 }, 'x', root)).toThrow(
      /No precompiled validator function was found/,
    );
  });
});
