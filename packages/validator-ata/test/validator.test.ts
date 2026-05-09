import { ErrorSchemaBuilder, RJSFSchema } from '@rjsf/utils';

import customizeValidator from '../src/customizeValidator';
import ATAValidator from '../src/validator';

/** ATAValidator behavior tests. The shared `@rjsf/utils` schema test suite
 * (see `test/utilsTests/schema.test.ts`) exercises the full ValidatorType
 * contract end-to-end against this validator; the cases here cover behavior
 * specific to the ata-backed implementation: option propagation, format
 * customization, error format compatibility, and cache/reset semantics.
 */
describe('ATAValidator', () => {
  describe('isValid()', () => {
    it('returns true for valid data', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = { type: 'object', properties: { name: { type: 'string' } } };
      expect(v.isValid(schema, { name: 'Alice' }, schema)).toBe(true);
    });

    it('returns false for invalid data', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = { type: 'object', required: ['name'] };
      expect(v.isValid(schema, {}, schema)).toBe(false);
    });

    it('resolves $ref against rootSchema', () => {
      const v = customizeValidator();
      const rootSchema: RJSFSchema = {
        definitions: { name: { type: 'string', minLength: 2 } },
        type: 'object',
        properties: { first: { $ref: '#/definitions/name' } },
      };
      expect(v.isValid(rootSchema, { first: 'Al' }, rootSchema)).toBe(true);
      expect(v.isValid(rootSchema, { first: 'A' }, rootSchema)).toBe(false);
    });

    // ata is permissive on unrecognized `type` strings (treats them as
    // annotation-only) and does not throw at compile time, so the
    // AJV-validator's "malformed schema -> false" assertion does not have a
    // direct counterpart. Schema-shape errors that ata does throw on (e.g.
    // `null` schema, mutually-recursive `$ref` past the depth guard) are
    // covered indirectly by the rawValidation try/catch and the shared
    // `@rjsf/utils` schema test suite.
  });

  describe('rawValidation()', () => {
    it('returns errors in AJV-compatible shape', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = {
        type: 'object',
        properties: { age: { type: 'number', minimum: 18 } },
        required: ['age'],
      };
      const { errors, validationError } = v.rawValidation(schema, { age: 5 });
      expect(validationError).toBeUndefined();
      expect(errors).toBeDefined();
      const errorList = errors as Array<{
        keyword: string;
        instancePath: string;
        schemaPath: string;
        params: Record<string, unknown>;
        message: string;
      }>;
      const minimumError = errorList.find((e) => e.keyword === 'minimum');
      expect(minimumError).toBeDefined();
      expect(minimumError!.instancePath).toBe('/age');
      expect(minimumError!.schemaPath).toContain('minimum');
      expect(minimumError!.params).toEqual(expect.objectContaining({ limit: 18 }));
    });

    it('returns undefined errors when valid', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = { type: 'string' };
      const { errors, validationError } = v.rawValidation(schema, 'ok');
      expect(errors).toBeUndefined();
      expect(validationError).toBeUndefined();
    });

    it('captures schema-compilation errors instead of throwing', () => {
      const v = customizeValidator();
      // ata throws on `null` as the schema body; this is the closest analog
      // to AJV's "schema not an object" error and verifies that we don't
      // surface the throw to the caller.
      const { validationError } = v.rawValidation(null as unknown as RJSFSchema, {});
      expect(validationError).toBeInstanceOf(Error);
    });
  });

  describe('validateFormData()', () => {
    it('returns errors and an errorSchema for invalid data', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
        },
        required: ['email'],
      };
      const { errors, errorSchema } = v.validateFormData({ email: 'not-an-email' }, schema);
      expect(errors.length).toBeGreaterThan(0);
      const formatError = errors.find((e) => e.name === 'format');
      expect(formatError).toBeDefined();
      expect(errorSchema).toBeDefined();
      // ErrorSchemaBuilder gives us a stable shape to compare against.
      const expected = new ErrorSchemaBuilder().addErrors(formatError!.message, 'email').ErrorSchema;
      expect(errorSchema.email).toEqual(expected.email);
    });

    it('runs the user-supplied transformErrors hook', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = { type: 'string', minLength: 5 };
      const transform = jest.fn((errs) => errs.map((e: any) => ({ ...e, message: 'transformed' })));
      const { errors } = v.validateFormData('abc', schema, undefined, transform);
      expect(transform).toHaveBeenCalled();
      expect(errors[0].message).toBe('transformed');
    });

    it('runs the user-supplied customValidate function', () => {
      const v = customizeValidator();
      const schema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };
      const customValidate = jest.fn((_data, errorHandler) => {
        errorHandler.x.addError('custom error');
        return errorHandler;
      });
      const { errorSchema } = v.validateFormData({ x: 'a' }, schema, customValidate);
      expect(customValidate).toHaveBeenCalled();
      expect(errorSchema.x?.__errors).toContain('custom error');
    });
  });

  describe('customFormats option', () => {
    it('routes a RegExp through to ata as a format checker', () => {
      const v = customizeValidator({
        customFormats: { 'phone-us': /\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/ },
      });
      const schema: RJSFSchema = { type: 'string', format: 'phone-us' };
      expect(v.isValid(schema, '(415) 555-0142', schema)).toBe(true);
      expect(v.isValid(schema, 'not-a-phone', schema)).toBe(false);
    });

    it('routes a function through to ata as a format checker', () => {
      const v = customizeValidator({
        customFormats: { 'starts-with-x': (s: string) => s.startsWith('x') },
      });
      const schema: RJSFSchema = { type: 'string', format: 'starts-with-x' };
      expect(v.isValid(schema, 'xyz', schema)).toBe(true);
      expect(v.isValid(schema, 'abc', schema)).toBe(false);
    });
  });

  describe('extenderFn option', () => {
    it('is invoked with the constructed validator', () => {
      const extenderFn = jest.fn((validator) => validator);
      const v = customizeValidator({ extenderFn });
      v.isValid({ type: 'string' } as RJSFSchema, 'a', { type: 'string' } as RJSFSchema);
      expect(extenderFn).toHaveBeenCalled();
    });
  });

  describe('localizer option', () => {
    it('runs against ata error objects when invalid', () => {
      const localizer = jest.fn();
      const v = customizeValidator({}, localizer);
      const schema: RJSFSchema = { type: 'object', required: ['x'] };
      v.rawValidation(schema, {});
      expect(localizer).toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('clears the cached validator state', () => {
      const v = customizeValidator() as ATAValidator;
      const schema: RJSFSchema = { type: 'string' };
      v.isValid(schema, 'a', schema);
      v.reset();
      // After reset, repeating the call should still work without error
      // (and rebuilds the validator under the hood).
      expect(v.isValid(schema, 'b', schema)).toBe(true);
    });
  });
});
