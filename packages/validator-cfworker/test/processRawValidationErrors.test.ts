import type { RJSFSchema, RJSFValidationError } from '@rjsf/utils';

import customizeValidator from '../src/customizeValidator';
import processRawValidationErrors, {
  filterDuplicateErrors,
  transformRJSFValidationErrors,
} from '../src/processRawValidationErrors';
import type { CFWorkerValidationError } from '../src/types';

function rawError(overrides: Partial<CFWorkerValidationError> = {}): CFWorkerValidationError {
  return {
    instanceLocation: '#/value',
    keywordLocation: '#/properties/value/type',
    keyword: 'type',
    error: 'Instance type is invalid.',
    ...overrides,
  };
}

describe('transformRJSFValidationErrors()', () => {
  it('supplies a fallback message when the engine omits one', () => {
    const errors = transformRJSFValidationErrors([
      rawError({ instanceLocation: '#', keyword: 'pattern', keywordLocation: '#/pattern', error: '' }),
    ]);
    expect(errors[0]).toEqual(
      expect.objectContaining({
        name: 'pattern',
        property: '',
        message: 'Validation failed for keyword "pattern"',
      }),
    );
  });

  it('maps required errors to the missing property and schema title', () => {
    const schema: RJSFSchema = { properties: { value: { title: 'Schema value' } } };
    const errors = transformRJSFValidationErrors(
      [
        rawError({
          instanceLocation: '#',
          keyword: 'required',
          keywordLocation: '#/required',
          error: 'Instance does not have required property "value".',
        }),
      ],
      undefined,
      undefined,
      schema,
    );
    expect(errors[0]).toEqual(
      expect.objectContaining({
        property: 'value',
        message: "Instance does not have required property 'Schema value'.",
        title: 'Schema value',
        params: { missingProperty: 'value' },
      }),
    );
  });

  it('prefers the uiSchema title for required errors', () => {
    const errors = transformRJSFValidationErrors(
      [
        rawError({
          instanceLocation: '#/nested',
          keyword: 'required',
          keywordLocation: '#/properties/nested/required',
          error: 'Instance does not have required property "value".',
        }),
      ],
      { nested: { value: { 'ui:title': 'UI value' } } },
      undefined,
      { properties: { nested: { properties: { value: { title: 'Schema value' } } } } },
    );
    expect(errors[0]).toEqual(
      expect.objectContaining({
        property: '.nested.value',
        message: "Instance does not have required property 'UI value'.",
        title: 'UI value',
      }),
    );
  });

  it('finds a nested required-property title in the schema', () => {
    const errors = transformRJSFValidationErrors(
      [
        rawError({
          instanceLocation: '#/nested',
          keyword: 'required',
          keywordLocation: '#/properties/nested/required',
          error: 'Instance does not have required property "value".',
        }),
      ],
      undefined,
      undefined,
      { properties: { nested: { properties: { value: { title: 'Nested value' } } } } },
    );
    expect(errors[0].title).toBe('Nested value');
  });

  it('keeps the raw required-property name when no title exists', () => {
    const errors = transformRJSFValidationErrors([
      rawError({
        instanceLocation: '#',
        keyword: 'required',
        keywordLocation: '#/required',
        error: 'Instance does not have required property "value".',
      }),
    ]);
    expect(errors[0]).toEqual(
      expect.objectContaining({ property: 'value', title: '', message: expect.stringContaining('"value"') }),
    );
  });

  it('uses uiSchema and schema titles for non-required errors', () => {
    const uiErrors = transformRJSFValidationErrors([rawError()], { value: { 'ui:title': 'UI value' } });
    expect(uiErrors[0].stack).toBe("'UI value' Instance type is invalid.");

    const schemaErrors = transformRJSFValidationErrors([rawError()], undefined, undefined, {
      properties: { value: { title: 'Schema value' } },
    });
    expect(schemaErrors[0].stack).toBe("'Schema value' Instance type is invalid.");

    const untitled = transformRJSFValidationErrors([rawError()]);
    expect(untitled[0].stack).toBe('.value Instance type is invalid.');
  });
});

describe('filterDuplicateErrors()', () => {
  const anyOfErrors: RJSFValidationError[] = [
    { message: 'same', schemaPath: '#/properties/x/anyOf/0/type', stack: 'same' },
    { message: 'same', schemaPath: '#/properties/x/anyOf/1/type', stack: 'same' },
  ];
  const oneOfErrors: RJSFValidationError[] = [
    { message: 'same', schemaPath: '#/properties/x/oneOf/0/type', stack: 'same' },
    { message: 'same', schemaPath: '#/properties/x/oneOf/1/type', stack: 'same' },
  ];

  it('filters duplicates by default', () => {
    expect(filterDuplicateErrors(anyOfErrors)).toHaveLength(1);
    expect(filterDuplicateErrors(oneOfErrors)).toHaveLength(1);
  });

  it('supports each filtering suppression mode', () => {
    expect(filterDuplicateErrors(anyOfErrors, 'anyOf')).toHaveLength(2);
    expect(filterDuplicateErrors(oneOfErrors, 'oneOf')).toHaveLength(2);
    expect(filterDuplicateErrors(anyOfErrors, 'oneOf')).toHaveLength(1);
    expect(filterDuplicateErrors(oneOfErrors, 'anyOf')).toHaveLength(1);
    expect(filterDuplicateErrors(anyOfErrors, 'all')).toBe(anyOfErrors);
  });
});

describe('processRawValidationErrors()', () => {
  const schema: RJSFSchema = { type: 'object', properties: { value: { type: 'string' } } };

  it('turns a validation exception into list and schema errors', () => {
    const validator = customizeValidator();
    const result = processRawValidationErrors(validator, { validationError: new Error('bad schema') }, {}, schema);
    expect(result.errors).toEqual([{ stack: 'bad schema' }]);
    expect(result.errorSchema.$schema?.__errors).toEqual(['bad schema']);
  });

  it('runs transformErrors with the uiSchema', () => {
    const validator = customizeValidator();
    const uiSchema = { value: { 'ui:label': false } };
    const transform = vi.fn(() => [{ stack: 'transformed' }]);
    const result = processRawValidationErrors(
      validator,
      { errors: [rawError()] },
      { value: 1 },
      schema,
      undefined,
      transform,
      uiSchema,
    );
    expect(transform).toHaveBeenCalledWith(expect.any(Array), uiSchema);
    expect(result.errors).toEqual([{ stack: 'transformed' }]);
  });

  it('merges custom validation errors', () => {
    const validator = customizeValidator();
    const customValidate = vi.fn((_data, errors) => {
      errors.value.addError('custom error');
      return errors;
    });
    const result = processRawValidationErrors(validator, { errors: [] }, { value: 'ok' }, schema, customValidate);
    expect(customValidate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), undefined, {});
    expect(result.errorSchema.value?.__errors).toEqual(['custom error']);
  });
});
