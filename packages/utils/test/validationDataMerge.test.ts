import type { ErrorSchema, ValidationData } from '../src/index.ts';
import { ERRORS_KEY, validationDataMerge } from '../src/index.ts';

describe('validationDataMerge()', () => {
  it('Returns validationData when no additionalErrorSchema is passed', () => {
    const validationData: ValidationData<any> = {
      errorSchema: {},
      errors: [],
    };
    expect(validationDataMerge(validationData)).toBe(validationData);
  });
  it('Returns only additionalErrorSchema when additionalErrorSchema is passed and no validationData', () => {
    const validationData: ValidationData<any> = {
      errorSchema: {},
      errors: [],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    const expected = {
      errorSchema,
      errors: customErrors,
    };
    expect(validationDataMerge(validationData, errorSchema)).toEqual(expected);
  });
  it('Returns merged data when additionalErrorSchema is passed', () => {
    const oldError = 'ajv error';
    const validationData: ValidationData<any> = {
      errorSchema: { [ERRORS_KEY]: [oldError] },
      errors: [{ stack: oldError, name: 'foo', schemaPath: '.foo' }],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    const expected = {
      errorSchema: { [ERRORS_KEY]: [oldError, ...errors] },
      errors: [...validationData.errors, ...customErrors],
    };
    expect(validationDataMerge(validationData, errorSchema)).toEqual(expected);
  });
  it('Returns merged data when additionalErrorSchema is passed, prevent duplicates', () => {
    const oldError = 'ajv error';
    const validationData: ValidationData<any> = {
      errorSchema: { [ERRORS_KEY]: [oldError] },
      errors: [{ stack: oldError, name: 'foo', schemaPath: '.foo' }],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    const expected = {
      errorSchema: { [ERRORS_KEY]: [oldError, ...errors] },
      errors: [...validationData.errors, ...customErrors],
    };
    expect(validationDataMerge(validationData, errorSchema, true)).toEqual(expected);
  });
  it('Skips additional errors already in the errors list when preventing duplicates', () => {
    const message = 'must be at least 3 characters';
    const existing = { property: '.street', message, stack: `.street ${message}` };
    const validationData: ValidationData<any> = {
      errorSchema: { street: { [ERRORS_KEY]: [message] } },
      errors: [existing],
    };
    const errorSchema: ErrorSchema = { street: { [ERRORS_KEY]: [message] }, city: { [ERRORS_KEY]: [message] } };
    const expected = {
      errorSchema: { street: { [ERRORS_KEY]: [message] }, city: { [ERRORS_KEY]: [message] } },
      errors: [existing, { property: '.city', message, stack: `.city ${message}` }],
    };
    expect(validationDataMerge(validationData, errorSchema, true)).toEqual(expected);
    expect(validationDataMerge(validationData, errorSchema).errors).toHaveLength(3);
  });
  describe('prevent duplicates matches errors by path, not by the spelling of `property`', () => {
    const message = 'must have required property';
    const additional = (path: string[]): ErrorSchema => {
      const schema: ErrorSchema = {};
      let node: any = schema;
      path.forEach((key) => {
        node[key] = {};
        node = node[key];
      });
      node[ERRORS_KEY] = [message];
      return schema;
    };
    const existingAt = (property: string | undefined) => ({ property, message, stack: `${property} ${message}` });

    it.each([
      ['a validator root required error without the leading dot', 'foo', ['foo']],
      ['a root scalar error spelled as an empty string', '', []],
      ['a bracketed array index', '.arr[0]', ['arr', '0']],
      ['a bracketed array index in a nested path', '.arr[0].name', ['arr', '0', 'name']],
      ['a missing property', undefined, []],
    ])('skips %s', (_name, property, path) => {
      const validationData: ValidationData<any> = {
        errorSchema: additional(path),
        errors: [existingAt(property)],
      };
      const result = validationDataMerge(validationData, additional(path), true);
      expect(result.errors).toEqual(validationData.errors);
      expect(result.errorSchema).toEqual(additional(path));
    });

    it('keeps an error at another path with the same message', () => {
      const validationData: ValidationData<any> = {
        errorSchema: additional(['foo']),
        errors: [existingAt('foo')],
      };
      const result = validationDataMerge(validationData, additional(['bar']), true);
      expect(result.errors).toEqual([existingAt('foo'), { property: '.bar', message, stack: `.bar ${message}` }]);
    });

    it('keeps an error at the same path with another message', () => {
      const validationData: ValidationData<any> = {
        errorSchema: additional(['foo']),
        errors: [existingAt('foo')],
      };
      const other: ErrorSchema = { foo: { [ERRORS_KEY]: ['another message'] } };
      const result = validationDataMerge(validationData, other, true);
      expect(result.errors).toEqual([
        existingAt('foo'),
        { property: '.foo', message: 'another message', stack: '.foo another message' },
      ]);
    });
  });
});
