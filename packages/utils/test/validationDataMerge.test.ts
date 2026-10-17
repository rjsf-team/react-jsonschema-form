import type { ErrorSchema, RJSFValidationError, ValidationData } from '../src/index.ts';
import { ERRORS_KEY, toErrorSchema, validationDataMerge } from '../src/index.ts';

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
  it('Keeps the existing errors when their errorSchema is empty', () => {
    const validationData: ValidationData<unknown> = {
      errorSchema: {},
      errors: [{ stack: 'an error with no message', name: 'foo', schemaPath: '.foo' }],
    };
    const errors = ['custom errors'];
    const customErrors = [{ property: '.', message: errors[0], stack: `. ${errors[0]}` }];
    const errorSchema: ErrorSchema = { [ERRORS_KEY]: errors };
    expect(validationDataMerge(validationData, errorSchema)).toEqual({
      errorSchema,
      errors: [...validationData.errors, ...customErrors],
    });
    expect(validationDataMerge(validationData, {})).toEqual(validationData);
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
  it('Skips additional errors already in the errorSchema when preventing duplicates', () => {
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
  describe('prevent duplicates lists the additional errors the merged errorSchema keeps', () => {
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
    // The `ValidationData` a validator returns: the `errorSchema` built from the `errors` by `toErrorSchema()`
    const validated = (...errors: RJSFValidationError[]): ValidationData<any> => ({
      errors,
      errorSchema: toErrorSchema(errors),
    });

    it.each([
      ['a validator root required error without the leading dot', 'foo', ['foo']],
      ['a root scalar error spelled as an empty string', '', []],
      ['a bracketed array index', '.arr[0]', ['arr', '0']],
      ['a bracketed array index in a nested path', '.arr[0].name', ['arr', '0', 'name']],
      ['a missing property', undefined, []],
    ])('skips %s', (_name, property, path) => {
      const validationData = validated(existingAt(property));
      const result = validationDataMerge(validationData, additional(path), true);
      expect(result.errors).toEqual(validationData.errors);
      expect(result.errorSchema).toEqual(additional(path));
    });

    it('keeps an error at another path with the same message', () => {
      const result = validationDataMerge(validated(existingAt('foo')), additional(['bar']), true);
      expect(result.errors).toEqual([existingAt('foo'), { property: '.bar', message, stack: `.bar ${message}` }]);
    });

    it('keeps an error at the same path with another message', () => {
      const other: ErrorSchema = { foo: { [ERRORS_KEY]: ['another message'] } };
      const result = validationDataMerge(validated(existingAt('foo')), other, true);
      expect(result.errors).toEqual([
        existingAt('foo'),
        { property: '.foo', message: 'another message', stack: '.foo another message' },
      ]);
    });

    it('lists an error under a dotted key that the errorSchema keeps apart from the nested path', () => {
      // `.a.b` addresses the nested `a` → `b`, while the additional error sits under the property named `a.b`
      const validationData = validated(existingAt('.a.b'));
      const result = validationDataMerge(validationData, { 'a.b': { [ERRORS_KEY]: [message] } }, true);
      expect(result.errorSchema).toEqual({ a: { b: { [ERRORS_KEY]: [message] } }, 'a.b': { [ERRORS_KEY]: [message] } });
      expect(result.errors).toEqual([existingAt('.a.b'), { property: '.a.b', message, stack: `.a.b ${message}` }]);
    });

    it('lists a root error that the errorSchema keeps apart from an invalid-schema error', () => {
      // An invalid schema is reported with no `property`, and held under `$schema` in the `errorSchema`
      const validationData: ValidationData<any> = {
        errors: [existingAt(undefined)],
        errorSchema: { $schema: { [ERRORS_KEY]: [message] } },
      };
      const result = validationDataMerge(validationData, additional([]), true);
      expect(result.errorSchema).toEqual({ $schema: { [ERRORS_KEY]: [message] }, [ERRORS_KEY]: [message] });
      expect(result.errors).toEqual([existingAt(undefined), { property: '.', message, stack: `. ${message}` }]);
    });

    it('copies a `__proto__` key as a plain key', () => {
      const extra = JSON.parse(`{ "__proto__": { "${ERRORS_KEY}": ["${message}"] } }`) as ErrorSchema;
      const result = validationDataMerge(validated(existingAt('foo')), extra, true);
      expect(result.errors).toEqual([
        existingAt('foo'),
        { property: '.__proto__', message, stack: `.__proto__ ${message}` },
      ]);
    });
  });
  describe('arrays for the items of an array field', () => {
    const item = (message: string) => ({ name: { [ERRORS_KEY]: [message] } });
    const listed = (index: number, message: string) => ({
      property: `.list.${index}.name`,
      message,
      stack: `.list.${index}.name ${message}`,
    });

    it('merges an additional array into the object the validator keys by index, keeping both errors', () => {
      const validationData: ValidationData<any> = {
        errors: [listed(1, 'from schema')],
        errorSchema: { list: { 1: item('from schema') } },
      };
      const result = validationDataMerge(validationData, { list: [item('extra')] });
      expect(result.errorSchema).toEqual({ list: { 0: item('extra'), 1: item('from schema') } });
      expect(result.errors).toEqual([listed(1, 'from schema'), listed(0, 'extra')]);
    });

    it('merges two arrays item by item instead of appending one to the other', () => {
      const validationData: ValidationData<any> = {
        errors: [listed(0, 'first')],
        errorSchema: { list: [item('first')] },
      };
      // oxlint-disable-next-line no-sparse-arrays -- the hole is the item without errors
      const result = validationDataMerge(validationData, { list: [, item('second')] }, true);
      expect(result.errorSchema).toEqual({ list: { 0: item('first'), 1: item('second') } });
      expect(result.errors).toEqual([listed(0, 'first'), listed(1, 'second')]);
    });

    it("keeps the validator's errors for an item the additional array holds undefined for", () => {
      const validationData: ValidationData<any> = {
        errors: [listed(0, 'from schema')],
        errorSchema: { list: { 0: item('from schema') } },
      };
      const result = validationDataMerge(validationData, { list: [undefined, item('extra')] }, true);
      expect(result.errorSchema).toStrictEqual({ list: { 0: item('from schema'), 1: item('extra') } });
      expect(result.errors).toEqual([listed(0, 'from schema'), listed(1, 'extra')]);
    });

    it('returns an additional array as the object keyed by index when there are no errors yet', () => {
      const result = validationDataMerge({ errors: [], errorSchema: {} }, { list: [item('extra')] });
      expect(result).toEqual({ errors: [listed(0, 'extra')], errorSchema: { list: { 0: item('extra') } } });
    });

    it.each([
      ['no additional errors', undefined],
      ['empty additional errors', {}],
      ['additional errors that hold only undefined', { other: undefined }],
    ])('returns an existing array as the object keyed by index with %s', (_, additional) => {
      const validationData: ValidationData<any> = {
        errors: [listed(0, 'first')],
        errorSchema: { list: [item('first')] },
      };
      expect(validationDataMerge(validationData, additional)).toStrictEqual({
        errors: [listed(0, 'first')],
        errorSchema: { list: { 0: item('first') } },
      });
    });

    it('returns validationData itself with nothing to merge when its errorSchema holds no array', () => {
      const validationData: ValidationData<any> = {
        errors: [listed(0, 'first')],
        errorSchema: { list: { 0: item('first') } },
      };
      expect(validationDataMerge(validationData, { other: undefined })).toBe(validationData);
    });
  });

  it('lists nothing for a primitive additionalErrorSchema, as an untyped caller may pass', () => {
    const validationData: ValidationData<unknown> = { errors: [], errorSchema: {} };
    // @ts-expect-error a string is not an ErrorSchema
    expect(validationDataMerge(validationData, 'bad').errors).toEqual([]);
  });
});
