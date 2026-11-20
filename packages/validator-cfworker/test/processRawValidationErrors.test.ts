import type { FormValidation, RJSFSchema, RJSFValidationError, UiSchema } from '@rjsf/utils';

import customizeValidator from '../src/customizeValidator.ts';
import processRawValidationErrors, {
  filterDuplicateErrors,
  transformRJSFValidationErrors,
} from '../src/processRawValidationErrors.ts';
import type { CFWorkerValidationError } from '../src/types.ts';

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

  it('reads a required-property name holding quotes whole', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { "it's": { type: 'string', title: 'Its' }, 'say "hi"': { type: 'string' } },
      required: ["it's", 'say "hi"'],
    };
    const { errors } = customizeValidator().validateFormData({}, schema);
    expect(errors.map(({ property, title, message }) => ({ property, title, message }))).toEqual([
      { property: "it's", title: 'Its', message: "Instance does not have required property 'Its'." },
      { property: 'say "hi"', title: '', message: 'Instance does not have required property "say "hi"".' },
    ]);
  });

  it('reads a required or dependency property name holding a line break whole', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { 'a\nb': { type: 'string', title: 'AB' }, c: { type: 'string', title: 'C' } },
      required: ['a\nb'],
      dependentRequired: { c: ['a\nb'] },
    };
    const { errors } = customizeValidator().validateFormData({ c: 'x' }, schema);
    expect(errors.map(({ property, message }) => ({ property, message }))).toEqual([
      { property: 'a\nb', message: "Instance does not have required property 'AB'." },
      { property: 'a\nb', message: "Instance has 'C' but does not have 'AB'." },
    ]);
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

  describe('names a property by the title of the schema holding the failed keyword', () => {
    const name = { type: 'string', title: 'Full name' } as const;
    const item: RJSFSchema = { type: 'object', properties: { name }, required: ['name'] };

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'inside an array item',
        { type: 'object', properties: { arr: { type: 'array', items: item } } },
        { arr: [{}] },
        '.arr.0.name',
      ],
      [
        'under a $ref',
        { $defs: { I: item }, type: 'object', properties: { a: { $ref: '#/$defs/I' } } },
        { a: {} },
        '.a.name',
      ],
      [
        'under a chain of $refs',
        {
          $defs: { I: item, J: { $ref: '#/$defs/I' } },
          type: 'object',
          properties: { a: { $ref: '#/$defs/J' } },
        },
        { a: {} },
        '.a.name',
      ],
      [
        'under a $ref to a definition whose key holds a /',
        { $defs: { 'x/y': item }, type: 'object', properties: { a: { $ref: '#/$defs/x~1y' } } },
        { a: {} },
        '.a.name',
      ],
      [
        'under a $ref inside an array item',
        { $defs: { I: item }, type: 'object', properties: { arr: { type: 'array', items: { $ref: '#/$defs/I' } } } },
        { arr: [{}] },
        '.arr.0.name',
      ],
      ['under allOf', { type: 'object', properties: { a: { allOf: [item] } } }, { a: {} }, '.a.name'],
      [
        'under then',
        { type: 'object', properties: { a: { if: { type: 'object' }, then: item } } },
        { a: {} },
        '.a.name',
      ],
      ['under additionalProperties', { type: 'object', additionalProperties: item }, { x: {} }, '.x.name'],
    ])('for a missing property %s', (_, schema, formData, property) => {
      const { errors } = customizeValidator().validateFormData(formData, schema);
      expect(errors.find((error) => error.property === property)).toEqual(
        expect.objectContaining({
          title: 'Full name',
          message: "Instance does not have required property 'Full name'.",
        }),
      );
    });

    it('for a missing dependency inside an array item', () => {
      const schema: RJSFSchema = {
        type: 'object',
        properties: {
          arr: {
            type: 'array',
            items: { type: 'object', properties: { a: {}, b: { title: 'B' } }, dependentRequired: { a: ['b'] } },
          },
        },
      };
      const { errors } = customizeValidator().validateFormData({ arr: [{ a: 1 }] }, schema);
      expect(errors.find((error) => error.property === '.arr.0.b')).toEqual(
        expect.objectContaining({ title: 'B', message: 'Instance has "a" but does not have \'B\'.' }),
      );
    });

    it('keeps the raw name of a missing property under a $ref to an $anchor', () => {
      const schema: RJSFSchema = {
        $defs: { I: { ...item, $anchor: 'i' } },
        type: 'object',
        properties: { a: { $ref: '#i' } },
      };
      const { errors } = customizeValidator().validateFormData({ a: {} }, schema);
      expect(errors.find((error) => error.property === '.a.name')).toEqual(
        expect.objectContaining({ title: '', message: 'Instance does not have required property "name".' }),
      );
    });

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'inside an array item',
        { type: 'object', properties: { arr: { type: 'array', items: { type: 'object', properties: { name } } } } },
        { arr: [{ name: 1 }] },
        '.arr.0.name',
      ],
      [
        'under a $ref',
        { $defs: { N: name }, type: 'object', properties: { a: { $ref: '#/$defs/N' } } },
        { a: 1 },
        '.a',
      ],
      [
        'on a property named then inside an array item',
        {
          type: 'object',
          properties: { arr: { type: 'array', items: { type: 'object', properties: { then: name } } } },
        },
        { arr: [{ then: 1 }] },
        '.arr.0.then',
      ],
      [
        'on a property named else under a $ref',
        {
          $defs: { P: { type: 'object', properties: { else: name } } },
          type: 'object',
          properties: { a: { $ref: '#/$defs/P' } },
        },
        { a: { else: 1 } },
        '.a.else',
      ],
    ])('for an error other than required %s', (_, schema, formData, property) => {
      const { errors } = customizeValidator().validateFormData(formData, schema);
      expect(errors.find((error) => error.property === property && error.name === 'type')).toEqual(
        expect.objectContaining({ title: 'Full name', stack: expect.stringMatching(/^'Full name' /) }),
      );
    });

    it.each<[string, RJSFSchema, unknown, string]>([
      [
        'an untitled allOf branch',
        { type: 'object', properties: { a: { title: 'A', allOf: [{ type: 'string' }] } } },
        { a: true },
        'A',
      ],
      [
        'a titled allOf branch',
        { type: 'object', properties: { a: { title: 'A', allOf: [{ title: 'Branch', type: 'string' }] } } },
        { a: true },
        'A',
      ],
      [
        'titled oneOf options',
        {
          type: 'object',
          properties: {
            a: {
              title: 'A',
              oneOf: [
                { title: 'O1', type: 'string' },
                { title: 'O2', type: 'number' },
              ],
            },
          },
        },
        { a: true },
        'A',
      ],
      [
        'an allOf branch inside an array item',
        {
          type: 'object',
          properties: {
            arr: { type: 'array', items: { title: 'Item', allOf: [{ title: 'Branch', type: 'string' }] } },
          },
        },
        { arr: [true] },
        'Item',
      ],
      [
        'oneOf options under a $ref',
        {
          $defs: {
            X: {
              title: 'A',
              oneOf: [
                { title: 'O1', type: 'string' },
                { title: 'O2', type: 'number' },
              ],
            },
          },
          type: 'object',
          properties: { a: { $ref: '#/$defs/X' } },
        },
        { a: true },
        'A',
      ],
      [
        'a $ref inside an allOf branch inside an array item',
        {
          $defs: { S: { title: 'S', type: 'string' } },
          type: 'object',
          properties: { arr: { type: 'array', items: { title: 'Item', allOf: [{ $ref: '#/$defs/S' }] } } },
        },
        { arr: [true] },
        'Item',
      ],
      [
        'a dependencies schema inside an array item',
        {
          type: 'object',
          properties: {
            arr: { type: 'array', items: { title: 'Item', dependencies: { a: { title: 'Dep', type: 'string' } } } },
          },
        },
        { arr: [{ a: 1 }] },
        'Item',
      ],
    ])('takes the title of the field holding the branch for an error under %s', (_, schema, formData, title) => {
      const { errors } = customizeValidator().validateFormData(formData, schema);
      const typeErrors = errors.filter((error) => error.name === 'type');
      expect(typeErrors.length).toBeGreaterThan(0);
      expect(typeErrors.map((error) => error.title)).toEqual(typeErrors.map(() => title));
    });

    it('gives no title to an error a false schema reports', () => {
      const schema: RJSFSchema = {
        title: 'Root',
        type: 'object',
        properties: { a: { title: 'A' } },
        additionalProperties: false,
      };
      const { errors } = customizeValidator().validateFormData({ a: 1, x: 1 }, schema);
      expect(errors.find((error) => error.property === '.x')).toEqual(
        expect.objectContaining({ name: 'false', title: '', stack: '.x False boolean schema.' }),
      );
    });
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
    const formData: unknown = {};
    const result = processRawValidationErrors(
      { validator },
      { validationError: new Error('bad schema') },
      formData,
      schema,
    );
    expect(result.errors).toEqual([{ stack: 'bad schema' }]);
    expect(result.errorSchema.$schema?.__errors).toEqual(['bad schema']);
  });

  it('runs transformErrors with the uiSchema', () => {
    const validator = customizeValidator();
    const uiSchema = { value: { 'ui:label': false } };
    const transform = vi.fn(() => [{ stack: 'transformed' }]);
    const result = processRawValidationErrors(
      { validator },
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
    const customValidate = vi.fn((_data: unknown, errors: FormValidation<{ value?: string }>) => {
      errors.value?.addError('custom error');
      return errors;
    });
    const result = processRawValidationErrors({ validator }, { errors: [] }, { value: 'ok' }, schema, customValidate);
    expect(customValidate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), undefined, {});
    expect(result.errorSchema.value?.__errors).toEqual(['custom error']);
  });
});

describe('validateFormData() reporting a missing dependency', () => {
  const schema = (keyword: 'dependentRequired' | 'dependencies', titles = true): RJSFSchema => ({
    type: 'object',
    properties: {
      creditCard: { type: 'number', title: titles ? 'Credit card' : undefined },
      holderName: { type: 'string' },
      billingAddress: { type: 'string', title: titles ? 'Billing address' : undefined },
    },
    [keyword]: { creditCard: ['holderName', 'billingAddress'] },
  });

  it('places each error on its missing property and names the properties by their titles', () => {
    const { errors, errorSchema } = customizeValidator().validateFormData(
      { creditCard: 1 },
      schema('dependentRequired'),
    );
    expect(errors).toEqual([
      expect.objectContaining({
        property: 'holderName',
        message: `Instance has 'Credit card' but does not have "holderName".`,
        title: '',
        params: { missingProperty: 'holderName' },
      }),
      expect.objectContaining({
        property: 'billingAddress',
        message: `Instance has 'Credit card' but does not have 'Billing address'.`,
        title: 'Billing address',
        params: { missingProperty: 'billingAddress' },
      }),
    ]);
    expect(errorSchema).toEqual({
      holderName: { __errors: [`Instance has 'Credit card' but does not have "holderName".`] },
      billingAddress: { __errors: [`Instance has 'Credit card' but does not have 'Billing address'.`] },
    });
  });

  it('names the properties of a draft-07 `dependencies` by their uiSchema titles', () => {
    const uiSchema: UiSchema = { creditCard: { 'ui:title': 'UI card' }, billingAddress: { 'ui:title': 'UI address' } };
    const { errors } = customizeValidator({ draft: '7' }).validateFormData(
      { creditCard: 1 },
      schema('dependencies', false),
      undefined,
      undefined,
      uiSchema,
    );
    expect(errors.map(({ message }) => message)).toEqual([
      `Instance has 'UI card' but does not have "holderName".`,
      `Instance has 'UI card' but does not have 'UI address'.`,
    ]);
  });

  it('leaves a failed schema dependency on the object it applies to', () => {
    const { errors } = customizeValidator({ draft: '7' }).validateFormData(
      { creditCard: 1 },
      {
        type: 'object',
        properties: { creditCard: { type: 'number', title: 'Credit card' } },
        dependencies: { creditCard: { required: ['billingAddress'] } },
      },
    );
    expect(errors).toContainEqual(
      expect.objectContaining({
        name: 'dependencies',
        property: '',
        message: 'Instance has "creditCard" but does not match dependant schema.',
      }),
    );
  });

  it('names the properties by titles holding `$` replacement patterns as written', () => {
    const uiSchema: UiSchema = {
      creditCard: { 'ui:title': 'Card ($`)' },
      billingAddress: { 'ui:title': "Price ($&$')" },
    };
    const { errors } = customizeValidator().validateFormData(
      { creditCard: 1 },
      schema('dependentRequired'),
      undefined,
      undefined,
      uiSchema,
    );
    expect(errors[1].message).toEqual(`Instance has 'Card ($\`)' but does not have 'Price ($&$')'.`);
  });

  it('leaves the message as the engine wrote it when no property has a title', () => {
    const { errors } = customizeValidator().validateFormData({ creditCard: 1 }, schema('dependentRequired', false));
    expect(errors[1]).toEqual(
      expect.objectContaining({
        property: 'billingAddress',
        message: 'Instance has "creditCard" but does not have "billingAddress".',
      }),
    );
  });
});
