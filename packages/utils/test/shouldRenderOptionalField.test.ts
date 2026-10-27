import type {
  GlobalUISchemaOptions,
  MergedClassMap,
  Registry,
  RJSFSchema,
  TemplatesType,
  UiSchema,
} from '../src/index.ts';
import {
  createSchemaUtils,
  englishStringTranslator,
  mergeThemePresentation,
  ROOT_FIELD_PATH,
  shouldRenderOptionalField,
  toFieldPath,
} from '../src/index.ts';
import { getOptionalDataControlsType, isOptionalDataControlsType } from '../src/shouldRenderOptionalField.ts';
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
  presentation: mergeThemePresentation(),
  classMap: {} as MergedClassMap,
  templates: {} as TemplatesType,
  globalFormOptions: GLOBAL_FORM_OPTIONS,
};

describe('getOptionalDataControlsType()', () => {
  const typeOf = (schema: RJSFSchema) => getOptionalDataControlsType(schema, TEST_ROOT_SCHEMA);
  test('a schema without anyOf/oneOf returns its own type', () => {
    expect(typeOf({ type: 'object' })).toEqual('object');
  });
  test('a schema without a type or anyOf/oneOf returns undefined', () => {
    expect(typeOf({})).toBeUndefined();
  });
  test.each([
    ['anyOf', ANY_OF_SCHEMA_ARRAY],
    ['oneOf', ONE_OF_SCHEMA_ARRAY],
  ])('an %s schema returns the type its options share', (_, schema) => {
    expect(typeOf(schema)).toEqual('array');
  });
  test('a schema with both anyOf and oneOf returns the type of its anyOf options', () => {
    expect(typeOf({ ...ONE_OF_SCHEMA_OBJECT, ...ANY_OF_SCHEMA_ARRAY })).toEqual('array');
  });
  test.each(['anyOf', 'oneOf'])('a schema with an empty %s returns its own type', (keyword) => {
    expect(typeOf({ type: 'array', items: { type: 'string' }, [keyword]: [] })).toEqual('array');
  });
  test.each<[RJSFSchema['type']]>([[['null', 'object', 'string']], [['object', 'string']]])(
    'a schema listing %j returns the type it resolves to',
    (type) => {
      expect(typeOf({ type })).toEqual('object');
    },
  );
  test('a nullable schema returns its one type other than null', () => {
    expect(typeOf({ type: ['null', 'object'] })).toEqual('object');
  });
  test('a oneOf option listing several types contributes the type it resolves to', () => {
    expect(typeOf({ oneOf: [{ type: ['object', 'string'] }, { type: 'object' }] })).toEqual('object');
  });
  test('a oneOf schema with mixed-type options returns every type', () => {
    expect(typeOf(ONE_OF_SCHEMA_MIXED)).toEqual(['object', 'array', 'string']);
  });
  test('a schema whose options name no type, and that names none itself, returns undefined', () => {
    expect(typeOf({ anyOf: [{ minLength: 1 }] })).toBeUndefined();
  });
  test.each<[RJSFSchema]>([[{ const: null }], [{ enum: [null] }], [{ type: 'null' }]])(
    'a %j option counts as null',
    (nullOption) => {
      expect(typeOf({ oneOf: [{ type: 'string' }, nullOption] })).toEqual(['string', 'null']);
    },
  );
  test.each<[RJSFSchema, string]>([
    [{ type: ['array', 'null'], items: { type: 'string' }, anyOf: [{ minItems: 1 }, { const: null }] }, 'array'],
    [
      {
        type: ['object', 'null'],
        properties: { a: { type: 'string' } },
        anyOf: [{ required: ['a'] }, { const: null }],
      },
      'object',
    ],
    [
      {
        type: ['object', 'null'],
        properties: { a: { type: 'string' } },
        anyOf: [{ required: ['a'] }, { enum: [null] }],
      },
      'object',
    ],
  ])('a null option under a nullable parent %j still counts as null', (schema, type) => {
    expect(typeOf(schema)).toEqual([type, 'null']);
  });
  test.each<[string, RJSFSchema, string | string[]]>([
    [
      'an object with a oneOf of required lists',
      { ...TEST_ROOT_SCHEMA, oneOf: [{ required: ['foo'] }, { minProperties: 1 }] },
      'object',
    ],
    [
      'an array with an anyOf of bounds',
      { type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 5 }] },
      'array',
    ],
    [
      'a nullable object whose options are all typeless',
      { type: ['object', 'null'], anyOf: [{ required: ['foo'] }, { minProperties: 1 }] },
      'object',
    ],
    [
      'a nullable object with a null option, which keeps the selector that reaches it',
      { type: ['object', 'null'], anyOf: [{ required: ['foo'] }, { type: 'null' }] },
      ['object', 'null'],
    ],
    ['an object with a boolean option', { ...TEST_ROOT_SCHEMA, oneOf: [false, { required: ['foo'] }] }, 'object'],
  ])('an option naming no type takes the type of its parent, for %s', (_, schema, expected) => {
    expect(typeOf(schema)).toEqual(expected);
  });
  test('a properties option keeps its object type under a parent listing several types, whose first it would take', () => {
    expect(
      typeOf({ type: ['array', 'object'], anyOf: [{ items: { type: 'string' } }, { properties: { a: {} } }] }),
    ).toEqual(['array', 'object']);
  });
  test('an enum option takes the type of its values', () => {
    expect(
      typeOf({ type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { enum: [['a'], ['b']] }] }),
    ).toEqual('array');
  });
  test('an option written as a $ref takes the type of its definition rather than the type of its object parent', () => {
    const rootSchema: RJSFSchema = { definitions: { s: { type: 'string' } } };
    expect(getOptionalDataControlsType({ type: 'object', anyOf: [{ $ref: '#/definitions/s' }] }, rootSchema)).toEqual(
      'string',
    );
  });
});

describe('isOptionalDataControlsType()', () => {
  const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['array'] };
  const isControlsType = (
    schema: RJSFSchema | (() => RJSFSchema),
    uiSchema: UiSchema,
    global?: GlobalUISchemaOptions,
  ) => isOptionalDataControlsType(schema, uiSchema, global, TEST_ROOT_SCHEMA);
  test('a type in enableOptionalDataFieldForType returns true', () => {
    expect(isControlsType(ANY_OF_SCHEMA_ARRAY, {}, globalUiOptions)).toBe(true);
  });
  test('a type not in enableOptionalDataFieldForType returns false', () => {
    expect(isControlsType(ONE_OF_SCHEMA_OBJECT, {}, globalUiOptions)).toBe(false);
  });
  test('a list of several types returns false even when one of them is enabled', () => {
    expect(isControlsType(ONE_OF_SCHEMA_MIXED, {}, globalUiOptions)).toBe(false);
  });
  test('a type list returns true when the type it resolves to is enabled', () => {
    expect(isControlsType({ type: ['null', 'array', 'string'] }, {}, globalUiOptions)).toBe(true);
  });
  test('no enabled types returns false', () => {
    expect(isControlsType({ type: 'array' }, {}, {})).toBe(false);
  });
  test('builds the schema from a function only when some type is enabled', () => {
    const buildSchema = vi.fn((): RJSFSchema => ({ type: 'array' }));
    expect(isControlsType(buildSchema, {}, {})).toBe(false);
    expect(buildSchema).not.toHaveBeenCalled();
    expect(isControlsType(buildSchema, {}, globalUiOptions)).toBe(true);
    expect(buildSchema).toHaveBeenCalledTimes(1);
  });
  test('no type returns false', () => {
    expect(isControlsType({}, {}, globalUiOptions)).toBe(false);
  });
  test('the uiSchema options take effect without any global UI options', () => {
    expect(isControlsType({ type: 'array' }, { 'ui:enableOptionalDataFieldForType': ['array'] })).toBe(true);
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
  test('a nested field offering options written as a $ref takes their type from the definitions they name', () => {
    const rootSchema: RJSFSchema = {
      definitions: { A: { type: 'object', properties: { a: { type: 'string' } } }, B: { type: 'object' } },
      properties: { p: { oneOf: [{ $ref: '#/definitions/A' }, { $ref: '#/definitions/B' }] } },
    };
    const globalUiOptions: GlobalUISchemaOptions = { enableOptionalDataFieldForType: ['object'] };
    const options = rootSchema.properties?.p;
    expect(
      typeof options === 'object' && nestedFieldRenders({ ...registry, rootSchema, globalUiOptions }, options),
    ).toBe(true);
    expect(typeof options === 'object' && getOptionalDataControlsType(options, rootSchema)).toBe('object');
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
