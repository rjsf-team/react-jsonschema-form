import type { GlobalUISchemaOptions, Registry, RJSFSchema, TemplatesType } from '../src/index.ts';
import {
  createSchemaUtils,
  englishStringTranslator,
  ROOT_FIELD_PATH,
  shouldRenderOptionalField,
  toFieldPath,
} from '../src/index.ts';
import {
  getOptionalDataControlsType,
  getSchemaTypesForXxxOf,
  isOptionalDataControlsType,
} from '../src/shouldRenderOptionalField.ts';
import getTestValidator from './testUtils/getTestValidator.ts';
import { GLOBAL_FORM_OPTIONS } from './testUtils/testData.ts';

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
  schemaUtils: createSchemaUtils({ validator: getTestValidator({}) }, TEST_ROOT_SCHEMA),
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
  test('a const null option reports the same type as the type null spelling of it', () => {
    expect(getSchemaTypesForXxxOf([{ type: 'string' }, { const: null }])).toEqual(['string', 'null']);
    expect(getSchemaTypesForXxxOf([{ type: 'string' }, { type: 'null' }])).toEqual(['string', 'null']);
  });
  test('only null options', () => {
    expect(getSchemaTypesForXxxOf([{ const: null }, { type: 'null' }])).toEqual('null');
  });
});

describe('getOptionalDataControlsType()', () => {
  test('a schema without anyOf/oneOf returns its own type', () => {
    expect(getOptionalDataControlsType({ type: 'object' })).toEqual('object');
  });
  test('a schema without a type or anyOf/oneOf returns undefined', () => {
    expect(getOptionalDataControlsType({})).toBeUndefined();
  });
  test.each([
    ['anyOf', ANY_OF_SCHEMA_ARRAY],
    ['oneOf', ONE_OF_SCHEMA_ARRAY],
  ])('an %s schema returns the type its options share', (_, schema) => {
    expect(getOptionalDataControlsType(schema)).toEqual('array');
  });
  test('a schema with both anyOf and oneOf returns the type of its anyOf options', () => {
    expect(getOptionalDataControlsType({ ...ONE_OF_SCHEMA_OBJECT, ...ANY_OF_SCHEMA_ARRAY })).toEqual('array');
  });
  test.each(['anyOf', 'oneOf'])('a schema with an empty %s returns its own type', (keyword) => {
    expect(getOptionalDataControlsType({ type: 'array', items: { type: 'string' }, [keyword]: [] })).toEqual('array');
  });
  test.each<[RJSFSchema['type']]>([[['null', 'object', 'string']], [['object', 'string']]])(
    'a schema listing %j returns the type it resolves to',
    (type) => {
      expect(getOptionalDataControlsType({ type })).toEqual('object');
    },
  );
  test('a nullable schema returns its one type other than null', () => {
    expect(getOptionalDataControlsType({ type: ['null', 'object'] })).toEqual('object');
  });
  test('a oneOf option listing several types contributes the type it resolves to', () => {
    expect(getOptionalDataControlsType({ oneOf: [{ type: ['object', 'string'] }, { type: 'object' }] })).toEqual(
      'object',
    );
  });
  test('a oneOf schema with mixed-type options returns every type', () => {
    expect(getOptionalDataControlsType(ONE_OF_SCHEMA_MIXED)).toEqual(['object', 'array', 'string']);
  });
  test.each<[string, RJSFSchema]>([
    ['unresolved $ref options', { anyOf: [{ $ref: '#/definitions/list' }] }],
    ['typeless options beside a type of its own', { type: 'array', anyOf: [{ minItems: 1 }] }],
  ])('a schema whose options name no type returns undefined, for %s', (_, schema) => {
    expect(getOptionalDataControlsType(schema)).toBeUndefined();
  });
});

describe('isOptionalDataControlsType()', () => {
  const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['array'] };
  test('a type in enableOptionalDataFieldForType returns true', () => {
    expect(isOptionalDataControlsType(ANY_OF_SCHEMA_ARRAY, {}, globalUiOptions)).toBe(true);
  });
  test('a type not in enableOptionalDataFieldForType returns false', () => {
    expect(isOptionalDataControlsType(ONE_OF_SCHEMA_OBJECT, {}, globalUiOptions)).toBe(false);
  });
  test('a list of several types returns false even when one of them is enabled', () => {
    expect(isOptionalDataControlsType(ONE_OF_SCHEMA_MIXED, {}, globalUiOptions)).toBe(false);
  });
  test('a type list returns true when the type it resolves to is enabled', () => {
    expect(isOptionalDataControlsType({ type: ['null', 'array', 'string'] }, {}, globalUiOptions)).toBe(true);
  });
  test('no enabled types returns false', () => {
    expect(isOptionalDataControlsType({ type: 'array' }, {}, {})).toBe(false);
  });
  test('no type returns false', () => {
    expect(isOptionalDataControlsType({}, {}, globalUiOptions)).toBe(false);
  });
  test('the uiSchema options take effect without any global UI options', () => {
    expect(isOptionalDataControlsType({ type: 'array' }, { 'ui:enableOptionalDataFieldForType': ['array'] })).toBe(
      true,
    );
  });
});

const FIELD_PATH = toFieldPath('nested');

/** `shouldRenderOptionalField()` for a field below the root, where the schema decides */
function nestedFieldRenders(fieldRegistry: typeof registry, schema: RJSFSchema, required = false): boolean {
  return shouldRenderOptionalField(fieldRegistry, schema, required, undefined, FIELD_PATH);
}

describe('shouldRenderOptionalField()', () => {
  test('the root field returns false, whatever its schema', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(
      shouldRenderOptionalField(
        { ...registry, globalUiOptions },
        { type: 'object' },
        false,
        undefined,
        ROOT_FIELD_PATH,
      ),
    ).toBe(false);
  });
  test('a nested field whose schema is the root schema returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, TEST_ROOT_SCHEMA)).toBe(true);
  });
  test('required returns false', () => {
    expect(nestedFieldRenders(registry, {}, true)).toBe(false);
  });
  test('schemaType undefined returns false', () => {
    expect(nestedFieldRenders(registry, {})).toBe(false);
  });
  test('schemaType array returns false', () => {
    expect(nestedFieldRenders(registry, { type: ['boolean', 'array'] })).toBe(false);
  });
  test('schemaType is not in enableOptionalDataFieldForType returns false', () => {
    expect(nestedFieldRenders(registry, { type: 'array' })).toBe(false);
  });
  test('schemaType is NOT in enableOptionalDataFieldForType returns false', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, { type: 'array' })).toBe(false);
  });
  test('schemaType IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, { type: 'object' })).toBe(true);
  });
  test('schemaType for single-type oneOf IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, ONE_OF_SCHEMA_OBJECT)).toBe(true);
  });
  test('schemaType for a single-type oneOf beside an empty anyOf IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    const schema: RJSFSchema = { ...ONE_OF_SCHEMA_OBJECT, anyOf: [] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, schema)).toBe(true);
  });
  test('schemaType for single-type anyOf IS in enableOptionalDataFieldForType returns true', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['array'] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, ANY_OF_SCHEMA_ARRAY)).toBe(true);
  });
  test('schemaType for mixed-type oneOf IS in enableOptionalDataFieldForType returns false', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['array'] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, ONE_OF_SCHEMA_MIXED)).toBe(false);
  });
  test('schemaType for an anyOf made nullable by a const null option returns false, like the type null spelling', () => {
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    const properties: RJSFSchema['properties'] = { a: { type: 'string' } };
    // The optional data controls hide the option selector until there is data, and `null` is not data, so a nullable
    // option list has to keep its selector to stay reachable once the `null` branch is chosen
    const constNull: RJSFSchema = { anyOf: [{ type: 'object', properties }, { const: null }] };
    const typeNull: RJSFSchema = { anyOf: [{ type: 'object', properties }, { type: 'null' }] };
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, constNull)).toBe(false);
    expect(nestedFieldRenders({ ...registry, globalUiOptions }, typeNull)).toBe(false);
  });
});
