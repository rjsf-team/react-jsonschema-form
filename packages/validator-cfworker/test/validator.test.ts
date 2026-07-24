import type { Validator as EngineValidator } from '@cfworker/json-schema';
import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';
import { ROOT_SCHEMA_PREFIX } from '@rjsf/utils';
import noop from 'lodash/noop';

import * as pkg from '../src';
import createCfworkerInstance, { installFormats } from '../src/createCfworkerInstance';
import customizeValidator from '../src/customizeValidator';
import type { CFWorkerValidationError } from '../src/types';
import { normalizeFormDataForValidation } from '../src/validator';

describe('CFWorkerValidator', () => {
  it('normalizes undefined object members so required errors surface', () => {
    const validator = customizeValidator<{ email?: string }>();
    const schema: RJSFSchema = {
      type: 'object',
      required: ['email'],
      properties: { email: { type: 'string' } },
    };
    const formData = { email: undefined };

    const raw = validator.rawValidation<CFWorkerValidationError>(schema, formData);
    expect(raw.validationError).toBeUndefined();
    expect(raw.errors?.some((error) => error.keyword === 'required')).toBe(true);

    const result = validator.validateFormData(formData, schema);
    expect(result.errors.some((error) => error.name === 'required')).toBe(true);
    expect(result.errorSchema.email?.__errors?.length).toBeGreaterThan(0);
  });

  it('validates supported values and returns raw errors for invalid values', () => {
    const validator = customizeValidator();
    const schema: RJSFSchema = { type: 'string', minLength: 3 };
    expect(validator.rawValidation(schema, 'valid')).toEqual({ errors: undefined, validationError: undefined });
    const invalid = validator.rawValidation<CFWorkerValidationError>(schema, 'x');
    expect(invalid.validationError).toBeUndefined();
    expect(invalid.errors?.some((error) => error.keyword === 'minLength')).toBe(true);
  });

  it('preserves the upstream multipleOf and additionalProperties behavior', () => {
    const validator = customizeValidator();
    const priceSchema: RJSFSchema = {
      type: 'object',
      properties: { price: { type: 'number', multipleOf: 0.01, minimum: 0 } },
    };
    expect(validator.validateFormData({ price: 0.14 }, priceSchema).errors).toHaveLength(0);

    const additionalSchema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
    const result = validator.validateFormData({ extra: 42 }, additionalSchema);
    expect(result.errors.some((error) => error.name === 'additionalProperties')).toBe(true);
    expect(result.errorSchema.extra?.__errors).toHaveLength(1);
  });

  it('honors the draft and shortCircuit options', () => {
    const validator = customizeValidator({ draft: '2019-09', shortCircuit: true });
    expect(validator.options).toEqual(expect.objectContaining({ draft: '2019-09', shortCircuit: true }));
    const schema: RJSFSchema = {
      type: 'object',
      properties: { first: { type: 'string' }, second: { type: 'string' } },
    };
    const result = validator.validateFormData({ first: 1, second: 2 }, schema);
    expect(result.errors.some((error) => error.property === '.first')).toBe(true);
    expect(result.errors.some((error) => error.property === '.second')).toBe(false);
  });

  it('captures invalid schemas instead of throwing', () => {
    const validator = customizeValidator();
    expect(validator.rawValidation(null as unknown as RJSFSchema, {}).validationError).toBeInstanceOf(Error);
  });

  it('runs transformErrors and customValidate hooks', () => {
    const validator = customizeValidator<{ value?: string }>();
    const schema: RJSFSchema = { type: 'object', required: ['value'], properties: { value: { type: 'string' } } };
    const transform = vi.fn((errors: RJSFValidationError[]) =>
      errors.map((error) => ({ ...error, message: 'transformed' })),
    );
    const custom = vi.fn((_data, errors) => {
      errors.value.addError('custom');
      return errors;
    });
    const result = validator.validateFormData({}, schema, custom, transform, {});
    expect(transform).toHaveBeenCalled();
    expect(custom).toHaveBeenCalled();
    expect(result.errors[0].message).toBe('transformed');
    expect(result.errorSchema.value?.__errors).toEqual(expect.arrayContaining(['transformed', 'custom']));
  });

  it('resolves root-schema references', () => {
    const validator = customizeValidator();
    const rootSchema: RJSFSchema = {
      $id: 'https://example.com/root',
      $defs: { name: { type: 'string', minLength: 2 } },
    };
    const schema: RJSFSchema = { $ref: '#/$defs/name' };
    expect(validator.isValid(schema, 'Al', rootSchema)).toBe(true);
    expect(validator.isValid(schema, 'A', rootSchema)).toBe(false);
  });

  it('reuses a cached validator for repeated calls with the same schema id', () => {
    const extenderFn = vi.fn((validator: EngineValidator) => validator);
    const validator = customizeValidator({ extenderFn });
    const schema: RJSFSchema = { $id: 'https://example.com/string', type: 'string' };
    expect(validator.isValid(schema, 'one', schema)).toBe(true);
    const constructedCount = extenderFn.mock.calls.length;
    expect(validator.isValid(schema, 'two', schema)).toBe(true);
    expect(constructedCount).toBeGreaterThan(0);
    expect(extenderFn).toHaveBeenCalledTimes(constructedCount);
  });

  it('accepts a root already registered under the RJSF prefix', () => {
    const validator = customizeValidator();
    const schema: RJSFSchema = { $id: ROOT_SCHEMA_PREFIX, type: 'string' };
    expect(validator.isValid(schema, 'value', schema)).toBe(true);
  });

  it('rebuilds an id entry when its schema changes and after reset', () => {
    const extenderFn = vi.fn((validator: EngineValidator) => validator);
    const validator = customizeValidator({ extenderFn });
    const stringSchema: RJSFSchema = { $id: 'https://example.com/value', type: 'string' };
    const numberSchema: RJSFSchema = { $id: 'https://example.com/value', type: 'number' };
    expect(validator.rawValidation(stringSchema, 'ok').errors).toBeUndefined();
    expect(validator.rawValidation(numberSchema, 4).errors).toBeUndefined();
    expect(extenderFn).toHaveBeenCalledTimes(2);
    validator.reset();
    expect(validator.rawValidation(numberSchema, 5).errors).toBeUndefined();
    expect(extenderFn).toHaveBeenCalledTimes(3);
  });

  it('refreshes cached validators when the root schema changes', () => {
    const extenderFn = vi.fn((validator: EngineValidator) => validator);
    const validator = customizeValidator({ extenderFn });
    const schema: RJSFSchema = { $ref: '#/$defs/value' };
    const stringRoot: RJSFSchema = { $defs: { value: { type: 'string' } } };
    const sameStringRoot: RJSFSchema = { $defs: { value: { type: 'string' } } };
    const numberRoot: RJSFSchema = { $defs: { value: { type: 'number' } } };
    expect(validator.isValid(schema, 'ok', stringRoot)).toBe(true);
    const firstCount = extenderFn.mock.calls.length;
    expect(validator.isValid(schema, 'still ok', sameStringRoot)).toBe(true);
    expect(extenderFn).toHaveBeenCalledTimes(firstCount);
    expect(validator.isValid(schema, 5, numberRoot)).toBe(true);
    expect(extenderFn.mock.calls.length).toBeGreaterThan(firstCount);
  });

  it('returns false and warns for an invalid schema in isValid', () => {
    const validator = customizeValidator();
    const warn = vi.spyOn(console, 'warn').mockImplementation(noop);
    expect(validator.isValid(null as unknown as RJSFSchema, {}, null as unknown as RJSFSchema)).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('supports custom format functions, regexes, and strings', () => {
    const validator = customizeValidator({
      customFormats: {
        'starts-x': (value) => value.startsWith('x'),
        digits: /^\d+$/,
        lowercase: '^[a-z]+$',
      },
    });
    expect(validator.isValid({ type: 'string', format: 'starts-x' }, 'xyz', { type: 'string' })).toBe(true);
    expect(validator.isValid({ type: 'string', format: 'digits' }, '123', { type: 'string' })).toBe(true);
    expect(validator.isValid({ type: 'string', format: 'lowercase' }, 'ABC', { type: 'string' })).toBe(false);
  });

  it('installs the RJSF color and data-url formats', () => {
    const validator = customizeValidator();
    expect(validator.isValid({ type: 'string', format: 'color' }, '#fff', { type: 'string' })).toBe(true);
    expect(
      validator.isValid({ type: 'string', format: 'data-url' }, 'data:text/plain;base64,eA==', { type: 'string' }),
    ).toBe(true);
  });

  it('normalizes nested arrays, primitives, and a top-level undefined', () => {
    expect(normalizeFormDataForValidation({ a: [undefined, { b: undefined, c: 1 }] })).toEqual({
      a: [null, { c: 1 }],
    });
    expect(normalizeFormDataForValidation('value')).toBe('value');
    expect(normalizeFormDataForValidation(undefined)).toBeNull();
  });
});

describe('createCfworkerInstance()', () => {
  it('uses defaults and validates directly', () => {
    expect(createCfworkerInstance({ type: 'string' }).validate('ok').valid).toBe(true);
  });

  it('registers additional and root schemas, then applies the extender', () => {
    const extenderFn = vi.fn((validator: EngineValidator) => validator);
    const validator = createCfworkerInstance(
      { $ref: 'https://example.com/value' },
      {
        additionalMetaSchemas: [{ $id: 'https://example.com/extra', type: 'number' }],
        extenderFn,
      },
      { $id: 'https://example.com/value', type: 'string' },
    );
    expect(validator.validate('ok').valid).toBe(true);
    expect(extenderFn).toHaveBeenCalledTimes(1);
  });

  it('fails loudly if the engine format registry is unavailable', () => {
    expect(() => installFormats({}, null as never)).toThrow('did not expose its format registry');
  });
});

describe('package surface', () => {
  it('exports the default and named validator APIs', () => {
    expect(typeof pkg.customizeValidator).toBe('function');
    expect(typeof pkg.CFWorkerValidator).toBe('function');
    expect(pkg.default).toBeInstanceOf(pkg.CFWorkerValidator);
  });
});
