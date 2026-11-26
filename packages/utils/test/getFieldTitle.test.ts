import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { getFieldTitle } from '../src/index.ts';
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

  it('gives no title to a field behind a $ref that resolves to nothing', () => {
    expect(titleOf({ type: 'object', properties: { p: { $ref: '#/$defs/Missing' } } }, ['p'])).toBeUndefined();
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
});
