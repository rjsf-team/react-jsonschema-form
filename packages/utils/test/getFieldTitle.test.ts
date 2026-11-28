import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { createFieldTitleLookup, getFieldTitle } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const context = { validator: getTestValidator({}) };

const titleOf = (schema: RJSFSchema, path: string[], formData?: unknown, uiSchema?: UiSchema) =>
  getFieldTitle(context, schema, path, formData, uiSchema);

describe('getFieldTitle()', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      own: { type: 'string', title: 'Own' },
      untitled: { type: 'string' },
      branch: { type: 'string', allOf: [{ title: 'Branch' }] },
      branchUnder: { type: 'string', title: 'Field', allOf: [{ title: 'Branch' }] },
      ref: { $ref: '#/$defs/D' },
      refUnder: { title: 'Field', $ref: '#/$defs/D' },
      flag: { type: 'boolean', title: 'Flag', deprecated: true },
      bool: true,
    },
    $defs: { D: { type: 'string', title: 'Definition' } },
  };

  it.each<[string, string, string | undefined]>([
    ['its schema title', 'own', 'Own'],
    ['no title when it has none', 'untitled', undefined],
    ["an allOf entry's title when it has none of its own", 'branch', 'Branch'],
    ["its own title over an allOf entry's", 'branchUnder', 'Field'],
    ["a $ref target's title when it has none of its own", 'ref', 'Definition'],
    ["its own title over a $ref target's", 'refUnder', 'Field'],
    ["a deprecated field's title without the marker", 'flag', 'Flag'],
    ['no title for a boolean schema', 'bool', undefined],
    ['no title for a key no schema describes', 'missing', undefined],
  ])('reads %s', (_, key, title) => {
    expect(titleOf(schema, [key])).toEqual(title);
  });

  it.each<[string, RJSFSchema]>([
    ['behind a $ref', { $ref: '#/$defs/Missing' }],
    ['merging an allOf entry that is a $ref', { type: 'string', allOf: [{ $ref: '#/$defs/Missing' }] }],
  ])('gives no title to a field %s that resolves to nothing, nor to an item', (_, p) => {
    expect(titleOf({ type: 'object', properties: { p } }, ['p'])).toBeUndefined();
    const list: RJSFSchema = { type: 'array', title: 'List', items: p };
    expect(titleOf({ type: 'object', properties: { list } }, ['list', '0'], { list: ['z'] })).toBeUndefined();
  });

  it('reads the ui:title over the schema title, past an empty one', () => {
    expect(titleOf(schema, ['own'], undefined, { own: { 'ui:title': 'UI' } })).toEqual('UI');
    expect(titleOf(schema, ['own'], undefined, { own: { 'ui:title': '' } })).toEqual('Own');
  });

  it("gives the root no title, since the root's title titles the form", () => {
    expect(titleOf({ type: 'object', title: 'Form' }, [], {}, { 'ui:title': 'UI form' })).toBeUndefined();
  });

  it('reads an array item under items, a tuple position under its own entry', () => {
    const items: RJSFSchema = {
      type: 'object',
      properties: {
        list: { type: 'array', items: { type: 'string', title: 'Item' } },
        tuple: { type: 'array', prefixItems: [{ type: 'string' }, { type: 'string', title: 'Second' }] },
      },
    };
    expect(titleOf(items, ['list', '0'], { list: ['a'] })).toEqual('Item');
    expect(titleOf(items, ['list', '0'], { list: ['a'] }, { list: { items: { 'ui:title': 'UI item' } } })).toEqual(
      'UI item',
    );
    expect(titleOf(items, ['tuple', '1'], { tuple: ['a', 'b'] })).toEqual('Second');
    expect(
      titleOf(items, ['tuple', '1'], { tuple: ['a', 'b'] }, { tuple: { prefixItems: [{}, { 'ui:title': 'UI 2' }] } }),
    ).toEqual('UI 2');
  });

  it("reads a property keyed '' and the fields under it", () => {
    const empty: RJSFSchema = {
      type: 'object',
      properties: { '': { type: 'object', title: 'Empty', properties: { name: { type: 'string', title: 'Name' } } } },
    };
    expect(titleOf(empty, [''], { '': {} })).toEqual('Empty');
    expect(titleOf(empty, ['', 'name'], { '': {} })).toEqual('Name');
  });

  it("reads the title an array hands an untitled item, after the array's schema title, as the form does", () => {
    const arrays: RJSFSchema = {
      type: 'object',
      properties: {
        tags: { type: 'array', title: 'Tags', items: { type: 'string' } },
        untitled: { type: 'array', items: { type: 'array', items: { type: 'string' } } },
        nested: { type: 'array', title: 'N', items: { type: 'array', items: { type: 'string' } } },
        named: { type: 'array', title: 'Named', items: { type: 'object', properties: { x: { type: 'string' } } } },
      },
    };
    const uiSchema: UiSchema = { tags: { 'ui:title': 'Tags ui' }, untitled: { 'ui:title': 'Untitled ui' } };
    expect(titleOf(arrays, ['tags', '1'], { tags: ['a', 'b'] }, uiSchema)).toEqual('Tags-2');
    expect(titleOf(arrays, ['tags', '1'], { tags: ['a', 'b'] }, { tags: { items: { 'ui:title': 'UI' } } })).toEqual(
      'UI',
    );
    // The form labels these items after the array's key, which is no title
    expect(titleOf(arrays, ['untitled', '0'], { untitled: [['a']] }, uiSchema)).toBeUndefined();
    expect(titleOf(arrays, ['untitled', '0', '0'], { untitled: [['a']] }, uiSchema)).toBeUndefined();
    expect(titleOf(arrays, ['nested', '0', '1'], { nested: [['a', 'b']] })).toEqual('N-1-2');
    // A property of an item is handed no title
    expect(titleOf(arrays, ['named', '0', 'x'], { named: [{ x: 'a' }] })).toBeUndefined();
  });

  it('reads an item field under the uiSchema a function-form items returns for its data and index', () => {
    const list: RJSFSchema = {
      type: 'object',
      properties: { arr: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } } },
    };
    const items = vi.fn((item: unknown, index: number) => ({
      name: { 'ui:title': `${JSON.stringify(item)} ${index}` },
    }));
    expect(titleOf(list, ['arr', '1', 'name'], { arr: [{}, { name: 'b' }] }, { arr: { items } })).toEqual(
      '{"name":"b"} 1',
    );
    expect(items).toHaveBeenCalledWith({ name: 'b' }, 1, undefined);
  });

  it("reports a function-form items that throws under the item's field path, as the form reports it", () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('items');
    const nested: RJSFSchema = {
      type: 'object',
      properties: { o: { type: 'object', properties: { arr: { type: 'array', title: 'Arr', items: {} } } } },
    };
    const uiSchema: UiSchema = {
      o: {
        arr: {
          items: () => {
            throw error;
          },
        },
      },
    };
    expect(titleOf(nested, ['o', 'arr', '2'], { o: { arr: [1, 2, 3] } }, uiSchema)).toEqual('Arr-3');
    expect(consoleError).toHaveBeenCalledWith('Error executing dynamic uiSchema.items function for o.arr[2]:', error);
    consoleError.mockRestore();
  });

  it("gives an extra key no title, since the form labels it by its key, but reads its own fields' titles", () => {
    const extra: RJSFSchema = {
      type: 'object',
      additionalProperties: { type: 'object', title: 'Extra', properties: { name: { type: 'string', title: 'Name' } } },
    };
    const uiSchema: UiSchema = { additionalProperties: { 'ui:title': 'UI extra', name: { 'ui:title': 'UI name' } } };
    expect(titleOf(extra, ['k'], { k: {} }, uiSchema)).toBeUndefined();
    expect(titleOf(extra, ['k', 'name'], { k: {} })).toEqual('Name');
    expect(titleOf(extra, ['k', 'name'], { k: {} }, uiSchema)).toEqual('UI name');
  });

  it("reads a key of an anyOf/oneOf option from the option's uiSchema entry, or the field's without one", () => {
    const options: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          type: 'object',
          title: 'Field',
          oneOf: [{ title: 'A', properties: { a: { type: 'string', title: 'Option a' } } }],
        },
      },
    };
    expect(titleOf(options, ['p'], { p: { a: 'x' } })).toEqual('Field');
    expect(titleOf(options, ['p', 'a'], { p: { a: 'x' } })).toEqual('Option a');
    expect(titleOf(options, ['p', 'a'], { p: { a: 'x' } }, { p: { a: { 'ui:title': 'Field UI a' } } })).toEqual(
      'Field UI a',
    );
    expect(
      titleOf(options, ['p', 'a'], { p: { a: 'x' } }, { p: { oneOf: [{ a: { 'ui:title': 'Option UI a' } }] } }),
    ).toEqual('Option UI a');
  });

  it("reads an item of an array option from the option's uiSchema entry", () => {
    const options: RJSFSchema = {
      type: 'object',
      properties: { p: { oneOf: [{ type: 'array', items: { type: 'string', title: 'Item' } }, { type: 'number' }] } },
    };
    expect(
      titleOf(options, ['p', '0'], { p: ['a'] }, { p: { oneOf: [{ items: { 'ui:title': 'Option UI item' } }] } }),
    ).toEqual('Option UI item');
  });

  // The form renders an array schema with no `items` as an unsupported field, so it shows no item to label
  it.each<[string, RJSFSchema]>([
    ['no items', { type: 'array' }],
    ['only contains', { type: 'array', contains: { type: 'string' } }],
    ['a type list starting with array', { type: ['array', 'object'] }],
    ['a nullable type list', { type: ['array', 'null'] }],
    ['a nullable type list starting with null', { type: ['null', 'array'] }],
    ['a type list starting with object', { type: ['object', 'array'] }],
  ])('reads no title for an index under a schema with %s, never an additional property’s', (_, a) => {
    const uiSchema: UiSchema = { a: { items: { 'ui:title': 'IT' }, additionalProperties: { 'ui:title': 'AP' } } };
    for (const formData of [undefined, { a: ['x'] }, { a: { 0: 'x' } }]) {
      expect(titleOf({ type: 'object', properties: { a } }, ['a', '0'], formData, uiSchema)).toBeUndefined();
    }
  });

  it('reads an index under a nullable type list with items as an item', () => {
    const schema: RJSFSchema = { type: 'object', properties: { a: { type: ['null', 'array'], items: {} } } };
    const uiSchema: UiSchema = { a: { items: { 'ui:title': 'IT' }, additionalProperties: { 'ui:title': 'AP' } } };
    expect(titleOf(schema, ['a', '0'], { a: ['x'] }, uiSchema)).toEqual('IT');
  });
});

describe('createFieldTitleLookup()', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      list: {
        type: 'array',
        title: 'List',
        items: { type: 'object', properties: { a: { type: 'string', title: 'A' }, b: { type: 'string' } } },
      },
    },
  };

  it('reads each path as getFieldTitle() does, the paths sharing a field and a path asked again included', () => {
    const formData = { list: [{ a: 'x' }, { b: 'y' }] };
    const uiSchema: UiSchema = { list: { items: { b: { 'ui:title': 'B' } } } };
    const titleAt = createFieldTitleLookup(context, schema, formData, uiSchema);
    const paths = [['list', '0', 'a'], ['list', '0', 'b'], ['list', '1'], ['list', '1', 'b'], ['list', '0', 'a'], []];
    const expected = ['A', 'B', 'List-2', 'B', 'A', undefined];
    expect(paths.map((path) => titleAt(path))).toEqual(expected);
    expect(paths.map((path) => titleOf(schema, path, formData, uiSchema))).toEqual(expected);
  });
});
