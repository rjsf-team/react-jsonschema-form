import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { getValidatorErrorUiTitle } from '../src/index.ts';

const objSchema: RJSFSchema = {
  type: 'object',
  properties: {
    obj: {
      type: 'object',
      additionalProperties: { type: 'object', allOf: [{ required: ['name'] }] },
    },
  },
};
const additionalUi: UiSchema = { obj: { additionalProperties: { name: { 'ui:title': 'Name ui' } } } };

describe('getValidatorErrorUiTitle()', () => {
  it('reads the ui:title at the property', () => {
    expect(
      getValidatorErrorUiTitle({
        property: "['a.b'].name",
        schemaPath: '#/properties/a.b/properties/name/type',
        uiSchema: { a: { b: { name: { 'ui:title': 'Wrong' } } }, 'a.b': { name: { 'ui:title': 'Right' } } },
      }),
    ).toEqual('Right');
  });

  it('reads the ui:title of a name under the property', () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.user',
        name: 'name',
        schemaPath: '#/properties/user/required',
        uiSchema: { user: { name: { 'ui:title': 'Full name' } } },
      }),
    ).toEqual('Full name');
  });

  it.each<[string, UiSchema]>([
    ['one object', { arr: { items: { name: { 'ui:title': 'Name ui' } } } }],
    ['an array of tuple positions', { arr: { items: [{}, { name: { 'ui:title': 'Name ui' } }] } }],
  ])("reads an array item field's ui:title under the array's items given as %s", (_, uiSchema) => {
    expect(
      getValidatorErrorUiTitle({
        property: '.arr.1.name',
        schemaPath: '#/definitions/T/properties/name/type',
        uiSchema,
      }),
    ).toEqual('Name ui');
  });

  it('reads a key that looks like an index as the key when the uiSchema holds it', () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.obj.0',
        schemaPath: '#/properties/obj/properties/0/type',
        uiSchema: { obj: { 0: { 'ui:title': 'Zero' }, items: { 'ui:title': 'Item' } } },
      }),
    ).toEqual('Zero');
  });

  it("doesn't read an additional property named like an index as an item, taking a sibling named items' ui:title", () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        obj: { type: 'object', properties: { items: { type: 'string' } }, additionalProperties: { type: 'object' } },
      },
    };
    const uiSchema: UiSchema = { obj: { items: { 'ui:title': 'Items ui', n: { 'ui:title': 'Items n' } } } };
    const source = { property: '.obj.0', schemaPath: '#/properties/obj/additionalProperties/type', uiSchema, schema };
    expect(getValidatorErrorUiTitle(source)).toBeUndefined();
    expect(getValidatorErrorUiTitle({ ...source, name: 'n' })).toBeUndefined();
  });

  it.each<[string, RJSFSchema | undefined, string | undefined]>([
    ['reads an additional property under additionalProperties', objSchema, 'Extra ui'],
    ["doesn't guess at one without the schema", undefined, undefined],
  ])('%s', (_, schema, title) => {
    expect(
      getValidatorErrorUiTitle({
        property: '.obj.extra',
        schemaPath: '#/properties/obj/additionalProperties/type',
        uiSchema: { obj: { additionalProperties: { 'ui:title': 'Extra ui' } } },
        schema,
      }),
    ).toEqual(title);
  });

  it('finds no ui:title for an item of an array whose items uiSchema is a function', () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.arr.0',
        schemaPath: '#/properties/arr/items/type',
        uiSchema: { arr: { items: () => ({ 'ui:title': 'Item' }) } },
      }),
    ).toBeUndefined();
  });

  it("doesn't read the schemaPath for the property itself, which a $ref can lead into another field's uiSchema", () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.shipping.street',
        schemaPath: '#/properties/billing/properties/street/type',
        uiSchema: { billing: { street: { 'ui:title': 'Billing street' } } },
      }),
    ).toBeUndefined();
  });

  it("reads a name's ui:title along the schemaPath, decoding its keys, when the property leads to none", () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.a/b.extra',
        name: 'name',
        schemaPath: '#/properties/a~1b/additionalProperties/required',
        decodeSchemaPathKey: (key) => key.replaceAll('~1', '/'),
        uiSchema: { 'a/b': { additionalProperties: { name: { 'ui:title': 'Name ui' } } } },
      }),
    ).toEqual('Name ui');
  });

  it("reads a name's ui:title along the schemaPath with the branches the keyword sits in removed", () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.obj.extra',
        name: 'name',
        schemaPath: '#/properties/obj/additionalProperties/allOf/0/required',
        uiSchema: additionalUi,
        schema: objSchema,
      }),
    ).toEqual('Name ui');
  });

  it.each<[string, string, string, UiSchema]>([
    [
      'an anyOf option',
      '.user',
      '#/properties/user/anyOf/0/required',
      { user: { anyOf: [{ name: { 'ui:title': 'Name ui' } }] } },
    ],
    [
      'a definition every $ref to it shares',
      '.shipping',
      '#/definitions/address/required',
      { definitions: { address: { name: { 'ui:title': 'Name ui' } } } },
    ],
    [
      'a tuple position',
      '.arr.1',
      '#/properties/arr/items/1/required',
      { arr: { items: [{}, { name: { 'ui:title': 'Name ui' } }] } },
    ],
    [
      'a prefixItems position, under a key named properties',
      '.properties.0',
      '#/properties/properties/prefixItems/0/required',
      { properties: { prefixItems: [{ name: { 'ui:title': 'Name ui' } }] } },
    ],
    [
      'a property of an item past a tuple',
      '.arr.3.sub',
      '#/properties/arr/additionalItems/properties/sub/required',
      { arr: { items: [{}], additionalItems: { sub: { name: { 'ui:title': 'Name ui' } } } } },
    ],
    [
      'a dependentSchemas branch of a property matching a pattern',
      '.obj.x1',
      '#/properties/obj/patternProperties/^x/dependentSchemas/properties/required',
      { obj: { patternProperties: { '^x': { dependentSchemas: { name: { 'ui:title': 'Name ui' } } } } } },
    ],
  ])("reads a name's ui:title along a schemaPath into %s", (_, property, schemaPath, uiSchema) => {
    expect(getValidatorErrorUiTitle({ property, name: 'name', schemaPath, uiSchema })).toEqual('Name ui');
  });

  it("doesn't read a schemaPath naming another property than the data path, as Ajv's behind a $ref does", () => {
    const uiSchema: UiSchema = { billing: { street: { 'ui:title': 'Billing street' } } };
    expect(
      getValidatorErrorUiTitle({
        property: '.shipping',
        name: 'street',
        schemaPath: '#/properties/billing/required',
        uiSchema,
      }),
    ).toBeUndefined();
    expect(
      getValidatorErrorUiTitle({ property: '', name: 'street', schemaPath: '#/properties/billing/required', uiSchema }),
    ).toBeUndefined();
  });

  it("guesses an index-like key past a $ref is an item, and doesn't take a declared key for an additional property", () => {
    const schema: RJSFSchema = {
      definitions: {
        Arr: { type: 'array', items: { type: 'object' } },
        Obj: { type: 'object', properties: { name: { type: 'string' } }, additionalProperties: { type: 'string' } },
      },
      type: 'object',
      properties: { arr: { $ref: '#/definitions/Arr' }, obj: { $ref: '#/definitions/Obj' } },
    };
    const uiSchema: UiSchema = {
      arr: { items: { name: { 'ui:title': 'Name ui' } } },
      obj: { additionalProperties: { 'ui:title': 'Extra ui' } },
    };
    const source = { schemaPath: '#/definitions/Obj/properties/name/type', uiSchema, schema };
    expect(getValidatorErrorUiTitle({ ...source, property: '.arr.0.name' })).toEqual('Name ui');
    expect(getValidatorErrorUiTitle({ ...source, property: '.obj.name' })).toBeUndefined();
  });

  it.each<[string, RJSFSchema, string]>([
    [
      'a prefixItems position',
      { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'string' } },
      'Prefix',
    ],
    [
      'the items past prefixItems',
      { type: 'array', prefixItems: [{ type: 'string' }], items: { type: 'string' } },
      'Rest',
    ],
    ['the additionalItems past a tuple', { type: 'array', items: [{ type: 'string' }], additionalItems: {} }, 'Extra'],
  ])('reads the uiSchema the form renders %s with', (label, arrSchema, title) => {
    expect(
      getValidatorErrorUiTitle({
        property: label === 'a prefixItems position' ? '.arr.0' : '.arr.1',
        schemaPath: '#/properties/arr/type',
        uiSchema: {
          arr: {
            prefixItems: [{ 'ui:title': 'Prefix' }],
            items: { 'ui:title': 'Rest' },
            additionalItems: { 'ui:title': 'Extra' },
          },
        },
        schema: { type: 'object', properties: { arr: arrSchema } },
      }),
    ).toEqual(title);
  });

  it("doesn't read a schemaPath stopping short of the data path, as Ajv's behind a $ref to the root does", () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.children.0',
        name: 'name',
        schemaPath: '#/required',
        uiSchema: { name: { 'ui:title': 'Root name' } },
      }),
    ).toBeUndefined();
  });

  it("doesn't remove the branches from a schemaPath the root doesn't lead along to the keyword", () => {
    expect(
      getValidatorErrorUiTitle({
        property: '.x',
        name: 'name',
        schemaPath: '#/allOf/0/required',
        uiSchema: { name: { 'ui:title': 'Root name' } },
        schema: objSchema,
      }),
    ).toBeUndefined();
  });

  it("returns an empty ui:title as found, undefined when there is none, and never the root's own", () => {
    const source = { property: '.a', schemaPath: '#/properties/a/type' };
    expect(getValidatorErrorUiTitle({ ...source, uiSchema: { a: { 'ui:title': '' } } })).toEqual('');
    expect(getValidatorErrorUiTitle({ ...source, uiSchema: { a: {} } })).toBeUndefined();
    expect(getValidatorErrorUiTitle(source)).toBeUndefined();
    expect(
      getValidatorErrorUiTitle({ property: '', schemaPath: '#/type', uiSchema: { 'ui:title': 'Form' } }),
    ).toBeUndefined();
  });
});
