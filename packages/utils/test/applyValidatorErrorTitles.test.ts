import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { applyValidatorErrorTitles } from '../src/index.ts';

const message = "must have required property 'name'";

describe('applyValidatorErrorTitles()', () => {
  it('returns the message as it is when no name has a title', () => {
    expect(
      applyValidatorErrorTitles({ message, names: ['name'], quote: "'", property: '', schemaPath: '#/required' }),
    ).toEqual({
      message,
      titles: new Map(),
    });
  });

  describe('looks a title up', () => {
    const titleOf = (source: { uiSchema?: UiSchema; parentSchema?: unknown; schema?: RJSFSchema }) =>
      applyValidatorErrorTitles({
        message,
        names: ['name'],
        quote: "'",
        property: '.user',
        schemaPath: '#/properties/account/required',
        ...source,
      }).titles.get('name');

    it('as the ui:title at the property first', () => {
      const uiSchema: UiSchema = {
        user: { name: { 'ui:title': 'At property' } },
        account: { name: { 'ui:title': 'At schema path' } },
      };
      expect(titleOf({ uiSchema })).toEqual('At property');
    });
    it('then as the ui:title at the schema path', () => {
      const uiSchema: UiSchema = {
        account: { name: { 'ui:title': 'At schema path' } },
        user: { name: { title: 'Raw' } },
      };
      expect(titleOf({ uiSchema })).toEqual('At schema path');
    });
    it('then as the title the uiSchema holds at the property', () => {
      expect(titleOf({ uiSchema: { user: { name: { title: 'Raw' } } }, parentSchema: parentSchema('Parent') })).toEqual(
        'Raw',
      );
    });
    it('then as the title in the parentSchema', () => {
      expect(titleOf({ parentSchema: parentSchema('Parent'), schema: rootSchema('Root') })).toEqual('Parent');
    });
    it('then as the title in the root schema', () => {
      expect(titleOf({ parentSchema: {}, schema: rootSchema('Root') })).toEqual('Root');
    });
    it('past an empty ui:title', () => {
      expect(titleOf({ uiSchema: { user: { name: { 'ui:title': '' } } }, schema: rootSchema('Root') })).toEqual('Root');
    });

    function parentSchema(title: string) {
      return { properties: { name: { type: 'string', title } } };
    }
    function rootSchema(title: string): RJSFSchema {
      return {
        type: 'object',
        properties: { user: { type: 'object', properties: { name: { type: 'string', title } } } },
      };
    }
  });

  it('reads the root property at a top-level name', () => {
    const { message: titled } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '',
      schemaPath: '#/required',
      uiSchema: { name: { 'ui:title': 'Full name' } },
    });
    expect(titled).toEqual("must have required property 'Full name'");
  });

  it('decodes the keys of the schema path with decodeSchemaPathKey', () => {
    const { titles } = applyValidatorErrorTitles({
      message: 'Instance does not have required property "name".',
      names: ['name'],
      quote: '"',
      property: '.a/b',
      schemaPath: '#/properties/a~1b/required',
      decodeSchemaPathKey: (key) => key.replaceAll('~1', '/'),
      uiSchema: { 'a/b': { name: { 'ui:title': 'Name' } } },
    });
    expect(titles).toEqual(new Map([['name', 'Name']]));
  });

  it("replaces every quoted name in one pass, in single quotes, so a title matching another name isn't replaced", () => {
    const { message: titled } = applyValidatorErrorTitles({
      message: 'must have property "b" when property "a" is present, and "a" again',
      names: ['b', 'a'],
      quote: '"',
      property: '',
      schemaPath: '#/dependentRequired',
      schema: { type: 'object', properties: { a: { title: '"b"' }, b: { title: 'B' } } },
    });
    expect(titled).toEqual(`must have property 'B' when property '"b"' is present, and '"b"' again`);
  });

  it('writes a title holding `$` patterns, and replaces a name holding regular expression characters, as written', () => {
    const { message: titled } = applyValidatorErrorTitles({
      message: "must have properties 'a.b', 'a+b' when property 'c' is present",
      names: ['a.b', 'a+b'],
      quote: "'",
      property: '',
      schemaPath: '#/dependentRequired',
      schema: { type: 'object', properties: { 'a.b': { title: "Price ($&$')" } } },
    });
    expect(titled).toEqual("must have properties 'Price ($&$')', 'a+b' when property 'c' is present");
  });
});
