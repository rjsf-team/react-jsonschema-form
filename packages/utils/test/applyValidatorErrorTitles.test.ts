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
    it('past a uiSchema `title` that is a sub-field rather than a string', () => {
      expect(titleOf({ uiSchema: { user: { name: { title: { 'ui:placeholder': 'Title' } } } } })).toBeUndefined();
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

  it.each<[string, RJSFSchema, string | undefined]>([
    ['resolved', { $ref: '#/$defs/N' }, 'Full name'],
    ['keeping its own title over its target’s', { title: 'Own', $ref: '#/$defs/N' }, 'Own'],
    ['keeping its own title when the $ref names an $anchor', { title: 'Own', $ref: '#n' }, 'Own'],
    ['with no title when the $ref names an $anchor', { $ref: '#n' }, undefined],
  ])('reads a property schema that is a $ref %s', (_, name, title) => {
    const schema: RJSFSchema = {
      $defs: { N: { type: 'string', title: 'Full name', $anchor: 'n' } },
      type: 'object',
      required: ['name'],
      properties: { name },
    };
    const source = { message, names: ['name'], quote: "'" as const, property: '', schemaPath: '#/required', schema };
    expect(applyValidatorErrorTitles({ ...source, parentSchema: schema }).titles.get('name')).toEqual(title);
    expect(applyValidatorErrorTitles(source).titles.get('name')).toEqual(title);
  });

  it('reads the field holding the branch the failed keyword sits in', () => {
    const item: RJSFSchema = {
      type: 'object',
      properties: { name: { type: 'string', title: 'Full name' } },
      then: { required: ['name'] },
    };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.arr.0',
      schemaPath: '#/properties/arr/items/then/required',
      parentSchema: item.then,
      schema: { type: 'object', properties: { arr: { type: 'array', items: item } } },
    });
    expect(titles).toEqual(new Map([['name', 'Full name']]));
  });

  it('reads no field of the root for a branch the root doesn’t lead along the schemaPath to', () => {
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.a',
      schemaPath: '#/then/required',
      parentSchema: { required: ['name'] },
      uiSchema: { name: { 'ui:title': 'Root UI name' } },
      schema: {
        type: 'object',
        properties: { name: { type: 'string', title: 'Root name' }, a: { $ref: '#/$defs/F' } },
      },
    });
    expect(titles).toEqual(new Map());
  });

  it('reads the ui:title at the schemaPath of the field holding the branch the failed keyword sits in', () => {
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.arr.0',
      schemaPath: '#/properties/arr/items/then/required',
      uiSchema: { arr: { items: { name: { 'ui:title': 'UI name' } } } },
    });
    expect(titles).toEqual(new Map([['name', 'UI name']]));
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

  it('reads a name holding a dot as one key at the property', () => {
    const { titles } = applyValidatorErrorTitles({
      message: "must have required property 'a.b'",
      names: ['a.b'],
      quote: "'",
      property: '',
      schemaPath: '#/allOf/0/required',
      uiSchema: { a: { b: { 'ui:title': 'Inner b' } }, 'a.b': { 'ui:title': 'Dotted' } },
    });
    expect(titles).toEqual(new Map([['a.b', 'Dotted']]));
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
      schema: { type: 'object', properties: { 'a.b': { title: "Price ($$$&$')" } } },
    });
    expect(titled).toEqual("must have properties 'Price ($$$&$')', 'a+b' when property 'c' is present");
  });

  it('replaces a name that another name starts with, followed by the quote, as its own name', () => {
    const { message: titled } = applyValidatorErrorTitles({
      message: "must have property 'it's' when property 'it' is present",
      names: ['it', "it's"],
      quote: "'",
      property: '',
      schemaPath: '#/dependentRequired',
      schema: { type: 'object', properties: { it: { title: 'It' }, "it's": { title: 'Its' } } },
    });
    expect(titled).toEqual("must have property 'Its' when property 'It' is present");
  });

  it('leaves an untitled name that a titled name, followed by the quote, starts', () => {
    const { message: titled } = applyValidatorErrorTitles({
      message: "must have property 'it's' when property 'it' is present",
      names: ['it', "it's"],
      quote: "'",
      property: '',
      schemaPath: '#/dependentRequired',
      schema: { type: 'object', properties: { it: { title: 'It' } } },
    });
    expect(titled).toEqual("must have property 'it's' when property 'It' is present");
  });
});
