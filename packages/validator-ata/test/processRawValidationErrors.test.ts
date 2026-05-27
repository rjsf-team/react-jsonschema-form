import type { ValidationError } from 'ata-validator';
import { ErrorSchema, RJSFSchema, UiSchema, ValidatorType } from '@rjsf/utils';

import customizeValidator from '../src/customizeValidator';
import processRawValidationErrors, {
  filterDuplicateErrors,
  transformRJSFValidationErrors,
} from '../src/processRawValidationErrors';

/** A minimal validator stub satisfies the `ValidatorType` slots that
 * `processRawValidationErrors` reaches through during default-form-state
 * resolution. Real ATAValidator behavior is exercised in `validator.test.ts`;
 * the cases here target the post-validation transformation surface only.
 */
const stubValidator = customizeValidator() as unknown as ValidatorType;

const ataError = (over: Partial<ValidationError> = {}): ValidationError => ({
  keyword: 'required',
  instancePath: '',
  schemaPath: '#/required',
  params: { missingProperty: 'name' },
  message: "must have required property 'name'",
  ...over,
});

describe('filterDuplicateErrors()', () => {
  it("returns the input unchanged when suppressDuplicateFiltering is 'all'", () => {
    const errs = [
      { name: 'type', message: 'a', schemaPath: '#/anyOf/0/type', stack: '', property: '' },
      { name: 'type', message: 'a', schemaPath: '#/anyOf/1/type', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs, 'all')).toEqual(errs);
  });

  it('collapses duplicate anyOf errors that share the same prefix', () => {
    const errs = [
      { name: 'type', message: 'must be string', schemaPath: '#/properties/x/anyOf/0/type', stack: '', property: '.x' },
      { name: 'type', message: 'must be string', schemaPath: '#/properties/x/anyOf/1/type', stack: '', property: '.x' },
    ];
    expect(filterDuplicateErrors(errs)).toHaveLength(1);
  });

  it('collapses duplicate oneOf errors that share the same prefix', () => {
    const errs = [
      { name: 'type', message: 'must be string', schemaPath: '#/properties/y/oneOf/0/type', stack: '', property: '.y' },
      { name: 'type', message: 'must be string', schemaPath: '#/properties/y/oneOf/1/type', stack: '', property: '.y' },
    ];
    expect(filterDuplicateErrors(errs)).toHaveLength(1);
  });

  it("keeps anyOf duplicates when suppressDuplicateFiltering is 'anyOf'", () => {
    const errs = [
      { name: 'type', message: 'a', schemaPath: '#/anyOf/0/type', stack: '', property: '' },
      { name: 'type', message: 'a', schemaPath: '#/anyOf/1/type', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs, 'anyOf')).toHaveLength(2);
  });

  it("keeps oneOf duplicates when suppressDuplicateFiltering is 'oneOf'", () => {
    const errs = [
      { name: 'type', message: 'a', schemaPath: '#/oneOf/0/type', stack: '', property: '' },
      { name: 'type', message: 'a', schemaPath: '#/oneOf/1/type', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs, 'oneOf')).toHaveLength(2);
  });

  it('keeps non-anyOf, non-oneOf errors as-is', () => {
    const errs = [
      { name: 'required', message: 'a', schemaPath: '#/required', stack: '', property: '' },
      { name: 'required', message: 'b', schemaPath: '#/required', stack: '', property: '' },
    ];
    expect(filterDuplicateErrors(errs)).toHaveLength(2);
  });
});

describe('transformRJSFValidationErrors()', () => {
  it('handles an empty error list', () => {
    expect(transformRJSFValidationErrors()).toEqual([]);
  });

  it('produces RJSF error shape from ata error shape', () => {
    const out = transformRJSFValidationErrors([ataError()]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({
      name: 'required',
      property: 'name',
      schemaPath: '#/required',
    });
  });

  it('handles error without a message field by defaulting to empty string', () => {
    // ata always populates `message`, but the destructure default exists for
    // resilience against transformErrors hooks that might strip it upstream.
    const errs = [
      { keyword: 'type', instancePath: '', schemaPath: '#/type', params: {} },
    ] as unknown as ValidationError[];
    const out = transformRJSFValidationErrors(errs);
    expect(out[0].message).toBe('');
  });

  it('replaces missingProperty with uiSchema title when available', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'name' },
        message: "must have required property 'name'",
      }),
    ];
    const uiSchema: UiSchema = { name: { 'ui:title': 'Full Name' } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].message).toContain('Full Name');
    expect(out[0].title).toBe('Full Name');
  });

  it('falls back to schemaPath-derived uiSchema title', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/properties/user/required',
        params: { missingProperty: 'name' },
      }),
    ];
    const uiSchema: UiSchema = { user: { name: { 'ui:title': 'User Name' } } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].title).toBe('User Name');
  });

  it('falls back to parentSchema property title when uiSchema is empty', () => {
    const errors: ValidationError[] = [
      ataError({
        params: { missingProperty: 'name' },
        parentSchema: { properties: { name: { title: 'Schema Title' } } },
      }),
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].title).toBe('Schema Title');
    expect(out[0].message).toContain('Schema Title');
  });

  it('uses uiSchema title at the property level when params has no property names', () => {
    const errors: ValidationError[] = [
      {
        keyword: 'minLength',
        instancePath: '/email',
        schemaPath: '#/properties/email/minLength',
        params: { limit: 5 },
        message: 'must NOT have fewer than 5 characters',
      },
    ];
    const uiSchema: UiSchema = { email: { 'ui:title': 'Email Address' } };
    const out = transformRJSFValidationErrors(errors, uiSchema);
    expect(out[0].title).toBe('Email Address');
    expect(out[0].stack).toContain('Email Address');
  });

  it('uses parentSchema title at the property level when uiSchema is empty', () => {
    const errors: ValidationError[] = [
      {
        keyword: 'minLength',
        instancePath: '/email',
        schemaPath: '#/properties/email/minLength',
        params: { limit: 5 },
        message: 'must NOT have fewer than 5 characters',
        parentSchema: { title: 'Parent Email' },
      },
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].title).toBe('Parent Email');
  });

  it('appends params.missingProperty into the property path when instancePath is non-empty', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '/user',
        schemaPath: '#/properties/user/required',
        params: { missingProperty: 'name' },
      }),
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].property).toBe('.user.name');
  });

  it('uses just the missingProperty name when instancePath is empty', () => {
    const errors: ValidationError[] = [
      ataError({
        instancePath: '',
        schemaPath: '#/required',
        params: { missingProperty: 'top' },
      }),
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].property).toBe('top');
  });

  it('handles params.deps as a comma-separated dependency list', () => {
    const errors: ValidationError[] = [
      {
        keyword: 'dependencies',
        instancePath: '',
        schemaPath: '#/dependencies',
        params: { deps: 'a, b' },
        message: "must have properties 'a', 'b' when 'x' is present",
      },
    ];
    const out = transformRJSFValidationErrors(errors);
    expect(out[0].name).toBe('dependencies');
  });
});

describe('processRawValidationErrors()', () => {
  const schema: RJSFSchema = { type: 'object', properties: { x: { type: 'string' } } };

  it('returns errors and an errorSchema for normal validation failures', () => {
    const out = processRawValidationErrors(stubValidator, { errors: [ataError()] }, undefined, schema);
    expect(out.errors.length).toBeGreaterThan(0);
    expect(out.errorSchema).toBeDefined();
  });

  it('appends the validationError message to the error list', () => {
    const compileErr = new Error('schema invalid');
    const out = processRawValidationErrors(
      stubValidator,
      { errors: [], validationError: compileErr },
      undefined,
      schema,
    );
    expect(out.errors[out.errors.length - 1].stack).toBe('schema invalid');
    expect((out.errorSchema as ErrorSchema & { $schema?: { __errors?: string[] } }).$schema?.__errors).toEqual([
      'schema invalid',
    ]);
  });

  it('runs the transformErrors hook and returns transformed output', () => {
    const transform = vi.fn((errs) => errs.map((e: any) => ({ ...e, message: 'transformed' })));
    const out = processRawValidationErrors(
      stubValidator,
      { errors: [ataError()] },
      undefined,
      schema,
      undefined,
      transform,
    );
    expect(transform).toHaveBeenCalled();
    expect(out.errors[0].message).toBe('transformed');
  });

  it('runs the customValidate hook and merges the user errorSchema', () => {
    const customValidate = vi.fn((_data, errorHandler) => {
      errorHandler.x.addError('user error');
      return errorHandler;
    });
    const out = processRawValidationErrors(stubValidator, { errors: [] }, { x: 'a' }, schema, customValidate);
    expect(customValidate).toHaveBeenCalled();
    expect((out.errorSchema.x as ErrorSchema & { __errors?: string[] }).__errors).toContain('user error');
  });
});
