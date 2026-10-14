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
} from '@rjsf/utils';

import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators.ts';
import { createPrecompiledValidator } from '../src/index.ts';
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
  describe('an option with an `if` that has no `else`', () => {
    /** Until the data satisfies the `if`, a form renders the option without its `then`, so that schema has to be
     * compiled as well as the one with `then` applied
     */
    const CONDITIONAL_ONEOF_SCHEMA: RJSFSchema = {
      type: 'object',
      oneOf: [
        {
          type: 'object',
          properties: { a: { type: 'string' } },
          if: { properties: { a: { const: 'x' } }, required: ['a'] },
          then: { properties: { extra: { type: 'string' } } },
        },
        { type: 'object', properties: { z: { type: 'number' } } },
      ],
    };

    it.each([[{}], [{ a: 'q' }], [{ a: 'x' }]])('scores the option it retrieved for %s', (formData) => {
      const validator = buildPrecompiledValidator(CONDITIONAL_ONEOF_SCHEMA);
      const schemaUtils = createSchemaUtils({ validator }, CONDITIONAL_ONEOF_SCHEMA);
      const options = CONDITIONAL_ONEOF_SCHEMA.oneOf as RJSFSchema[];
      const chosen = getClosestMatchingOption({ validator }, CONDITIONAL_ONEOF_SCHEMA, formData, options, 0);
      const retrieved = schemaUtils.retrieveSchema(options[chosen], formData);
      // the option the data selects has a compiled validator even when the `if` doesn't hold
      expect(validator.isValid(withVariantId(retrieved), formData, CONDITIONAL_ONEOF_SCHEMA)).toBe(true);
    });
  });
  describe.each([
    [
      'an own `then` merged over the rest before an `allOf`',
      {
        type: 'object',
        properties: { a: { type: 'string', maxLength: 10, title: 'A' } },
        if: { properties: { b: { const: 'x' } }, required: ['b'] },
        then: { properties: { a: { maxLength: 20, title: 'A2' } } },
        allOf: [{ properties: { b: { type: 'string' } } }],
      },
      [{}, { b: 'x' }, { b: 'q' }],
    ],
    [
      'an `else: false`',
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { properties: { a: { const: 'x' } }, required: ['a'] },
        then: { properties: { extra: { type: 'string' } } },
        else: false,
      },
      [{ a: 'x' }, { a: 'q' }],
    ],
    [
      'a `then: false` next to an `else`',
      {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { properties: { a: { const: 'x' } }, required: ['a'] },
        then: false,
        else: { properties: { other: { type: 'number' } } },
      },
      [{ a: 'x' }, { a: 'q' }],
    ],
    [
      'a one-sided `if` next to `dependencies` in an `allOf` entry',
      {
        type: 'object',
        allOf: [
          {
            title: 'base',
            properties: { p: { type: 'string' }, q: { type: 'string' }, r: { type: 'string' } },
            dependencies: { p: { title: 'fromDep', required: ['r'] } },
            if: { properties: { p: { const: 'x' } }, required: ['p'] },
            then: { title: 'fromThen', required: ['q'] },
          },
        ],
      },
      [
        { p: 'x', q: 'a', r: 'b' },
        { p: 'y', r: 'b' },
      ],
    ],
  ] as [string, RJSFSchema, object[]][])('an option with %s', (_, option, formDatas) => {
    const schema: RJSFSchema = {
      type: 'object',
      oneOf: [option, { type: 'object', properties: { z: { type: 'number' } }, required: ['z'] }],
    };
    it.each(formDatas.map((formData) => [formData]))(
      'has a compiled validator for the form it retrieves for %s',
      (formData) => {
        const validator = buildPrecompiledValidator(schema);
        const schemaUtils = createSchemaUtils({ validator }, schema);
        const retrieved = schemaUtils.retrieveSchema(option, formData);
        expect(() => validator.isValid(withVariantId(retrieved), formData, schema)).not.toThrow();
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
