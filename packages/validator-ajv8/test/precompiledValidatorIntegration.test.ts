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

import {
  getClosestMatchingOption,
  getFirstMatchingOption,
  omitExtraData,
  relaxOptionsForScoring,
  RJSFSchema,
} from '@rjsf/utils';

import { createPrecompiledValidator } from '../src';
import { compileSchemaValidatorsCode } from '../src/compileSchemaValidators';
import { ValidatorFunctions } from '../src/types';

/**
 * Compiles `schema` to AJV standalone code, evaluates it via Function constructor, and
 * wraps it in an AJV8PrecompiledValidator. This avoids writing files to disk and keeps
 * the tests fully self-contained.
 *
 * The compiled code is pure JS with no require() calls, so Function evaluation is safe.
 */
function buildPrecompiledValidator(schema: RJSFSchema) {
  const code = compileSchemaValidatorsCode(schema);
  const exports: ValidatorFunctions = {};
  // eslint-disable-next-line no-new-func
  new Function('exports', code)(exports);
  return createPrecompiledValidator(exports, schema);
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
        expect(getFirstMatchingOption(validator, { kind: 'a', foo: 'hello' }, options, STRICT_ONEOF_SCHEMA)).toBe(0);
      });

      it('returns 1 when formData matches the second strict option exactly', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(getFirstMatchingOption(validator, { kind: 'b', bar: 'world' }, options, STRICT_ONEOF_SCHEMA)).toBe(1);
      });

      it('does not throw when called with manually relaxed options and data containing extra keys', () => {
        const relaxed = relaxOptionsForScoring<RJSFSchema>(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(() =>
          getFirstMatchingOption(validator, { kind: 'a', foo: 'hello', extra: 'data' }, relaxed, STRICT_ONEOF_SCHEMA),
        ).not.toThrow();
      });

      it('finds the correct match with relaxed options and extra keys in formData', () => {
        const relaxed = relaxOptionsForScoring<RJSFSchema>(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(
          getFirstMatchingOption(validator, { kind: 'a', foo: 'hello', extra: 'data' }, relaxed, STRICT_ONEOF_SCHEMA),
        ).toBe(0);
      });
    });

    describe('getClosestMatchingOption()', () => {
      it('returns 0 for formData matching the first strict option', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(getClosestMatchingOption(validator, STRICT_ONEOF_SCHEMA, { kind: 'a', foo: 'hello' }, options, 0)).toBe(
          0,
        );
      });

      it('returns 1 for formData matching the second strict option', () => {
        const options = STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[];
        expect(getClosestMatchingOption(validator, STRICT_ONEOF_SCHEMA, { kind: 'b', bar: 'world' }, options, 0)).toBe(
          1,
        );
      });

      it('does not throw with relaxed options and extra keys in formData', () => {
        const relaxed = relaxOptionsForScoring<RJSFSchema>(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(() =>
          getClosestMatchingOption(validator, STRICT_ONEOF_SCHEMA, { kind: 'a', extra: 'data' }, relaxed, 0),
        ).not.toThrow();
      });

      it('picks the correct branch with relaxed options and extra keys', () => {
        const relaxed = relaxOptionsForScoring<RJSFSchema>(STRICT_ONEOF_SCHEMA.oneOf as RJSFSchema[]);
        expect(
          getClosestMatchingOption(
            validator,
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
        expect(omitExtraData(validator, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, { kind: 'a', foo: 'hello' })).toEqual(
          { kind: 'a', foo: 'hello' },
        );
      });

      it('does not throw when formData contains extra keys (exercises the relaxation path)', () => {
        expect(() =>
          omitExtraData(validator, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).not.toThrow();
      });

      it('drops extra keys when formData matches the first branch', () => {
        expect(
          omitExtraData(validator, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'a', foo: 'hello' });
      });

      it('drops extra keys when formData matches the second branch', () => {
        expect(
          omitExtraData(validator, STRICT_ONEOF_SCHEMA, STRICT_ONEOF_SCHEMA, {
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
          omitExtraData(validator, STRICT_ONEOF_REF_SCHEMA, STRICT_ONEOF_REF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).not.toThrow();
      });

      it('drops extra keys when formData matches the first $ref branch', () => {
        expect(
          omitExtraData(validator, STRICT_ONEOF_REF_SCHEMA, STRICT_ONEOF_REF_SCHEMA, {
            kind: 'a',
            foo: 'hello',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'a', foo: 'hello' });
      });

      it('drops extra keys when formData matches the second $ref branch', () => {
        expect(
          omitExtraData(validator, STRICT_ONEOF_REF_SCHEMA, STRICT_ONEOF_REF_SCHEMA, {
            kind: 'b',
            bar: 'world',
            extra: 'drop',
          }),
        ).toEqual({ kind: 'b', bar: 'world' });
      });
    });
  });
});
