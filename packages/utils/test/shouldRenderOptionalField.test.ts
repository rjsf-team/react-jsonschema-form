import {
  createSchemaUtils,
  englishStringTranslator,
  shouldRenderOptionalField,
  Registry,
  RJSFSchema,
  TemplatesType,
} from '../src';
import { getSchemaTypesForXxxOf } from '../src/shouldRenderOptionalField';
import getTestValidator from './testUtils/getTestValidator';
import { GlobalUISchemaOptions } from '../lib';
import { GLOBAL_FORM_OPTIONS } from './testUtils/testData';

const TEST_ROOT_SCHEMA: RJSFSchema = {
  type: 'object',
  properties: {
    foo: {
      type: 'string',
    },
  },
};
const ONE_OF_SCHEMA_OBJECT: RJSFSchema = {
  oneOf: [
    TEST_ROOT_SCHEMA,
    {
      type: 'object',
      properties: {
        bar: {
          type: 'string',
        },
      },
    },
  ],
};
const ONE_OF_SCHEMA_ARRAY: RJSFSchema = {
  oneOf: [
    {
      type: 'array',
      items: { type: 'string' },
    },
    {
      type: 'array',
      items: { type: 'number' },
    },
  ],
};
const ONE_OF_SCHEMA_MIXED: RJSFSchema = {
  oneOf: [
    TEST_ROOT_SCHEMA,
    {
      type: 'array',
      items: { type: 'string' },
    },
    false,
    { type: 'string' },
  ],
};
const ANY_OF_SCHEMA_ARRAY: RJSFSchema = {
  anyOf: ONE_OF_SCHEMA_ARRAY.oneOf,
};

const registry: Registry = {
  formContext: {},
  rootSchema: TEST_ROOT_SCHEMA,
  schemaUtils: createSchemaUtils(getTestValidator({}), TEST_ROOT_SCHEMA),
  translateString: englishStringTranslator,
  fields: {},
  widgets: {},
  templates: {} as TemplatesType,
  globalFormOptions: GLOBAL_FORM_OPTIONS,
};

describe('getSchemaTypesForXxxOf', () => {
  test('empty list', () => {
    expect(getSchemaTypesForXxxOf([])).toEqual([]);
  });
  test('all objects', () => {
    expect(getSchemaTypesForXxxOf(ONE_OF_SCHEMA_OBJECT.oneOf as RJSFSchema[])).toEqual('object');
  });
  test('all arrays', () => {
    expect(getSchemaTypesForXxxOf(ONE_OF_SCHEMA_ARRAY.oneOf as RJSFSchema[])).toEqual('array');
  });
  test('mixed', () => {
    expect(getSchemaTypesForXxxOf(ONE_OF_SCHEMA_MIXED.oneOf as RJSFSchema[])).toEqual(['object', 'array', 'string']);
  });
});

describe('shouldRenderOptionalField()', () => {
  test('is root schema returns false', () => {
    expect(shouldRenderOptionalField(registry, TEST_ROOT_SCHEMA, false)).toBe(false);
  });
  test('required returns false', () => {
    expect(shouldRenderOptionalField(registry, {}, true)).toBe(false);
  });
  test('schemaType undefined returns false', () => {
    expect(shouldRenderOptionalField(registry, {}, false)).toBe(false);
  });
  test('schemaType array returns false', () => {
    expect(shouldRenderOptionalField(registry, { type: ['boolean', 'array'] }, false)).toBe(false);
  });
  test('schemaType is not in enableOptionalDataFieldForType returns false', () => {
    expect(shouldRenderOptionalField(registry, { type: 'array' }, false)).toBe(false);
  });
  test('schemaType is NOT in enableOptionalDataFieldForType returns false', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(shouldRenderOptionalField({ ...registry, globalUiOptions }, { type: 'array' }, false)).toBe(false);
  });
  test('schemaType IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(shouldRenderOptionalField({ ...registry, globalUiOptions }, { type: 'object' }, false)).toBe(true);
  });
  test('schemaType for single-type oneOf IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(shouldRenderOptionalField({ ...registry, globalUiOptions }, ONE_OF_SCHEMA_OBJECT, false)).toBe(true);
  });
  test('schemaType for single-type anyOf IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['array'] };
    expect(shouldRenderOptionalField({ ...registry, globalUiOptions }, ANY_OF_SCHEMA_ARRAY, false)).toBe(true);
  });
  test('schemaType for mixed-type oneOf IS in enableOptionalDataFieldForType returns false', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['array'] };
    expect(shouldRenderOptionalField({ ...registry, globalUiOptions }, ONE_OF_SCHEMA_MIXED, false)).toBe(false);
  });
});
