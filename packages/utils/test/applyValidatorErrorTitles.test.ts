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

  it('reads no field of the root for an equal branch the root leads along the schemaPath to another instance', () => {
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.a',
      schemaPath: '#/allOf/0/required',
      parentSchema: { required: ['name'] },
      uiSchema: { name: { 'ui:title': 'Root UI name' } },
      schema: {
        type: 'object',
        properties: { name: { type: 'string', title: 'Root name' }, a: { $ref: '#/$defs/F' } },
        allOf: [{ required: ['name'] }],
      },
    });
    expect(titles).toEqual(new Map());
  });

  // The root a recursive `$ref: '#'` names is reached again at each kid, any number of times, and nowhere else
  it.each<[string, string, Map<string, string>]>([
    ['a kid of a kid', '.kids.0.kids.1', new Map([['name', 'Root name']])],
    ['another instance', '.a', new Map()],
  ])(
    'reads the root along a schemaPath the root leads along to %s through a recursive $ref',
    (_, property, expected) => {
      const { titles } = applyValidatorErrorTitles({
        message,
        names: ['name'],
        quote: "'",
        property,
        schemaPath: '#/allOf/0/required',
        parentSchema: { required: ['name'] },
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string', title: 'Root name' },
            kids: { type: 'array', items: { $ref: '#' } },
            a: { $ref: '#/$defs/F' },
          },
          allOf: [{ required: ['name'] }],
        },
      });
      expect(titles).toEqual(expected);
    },
  );

  // A `$ref: '#'` inside a definition sits wherever a `$ref` names the definition, so the root is reached anywhere
  it('reads the root along a schemaPath anywhere where a recursive $ref to it sits in a definition', () => {
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.kids.0',
      schemaPath: '#/allOf/0/required',
      parentSchema: { required: ['name'] },
      schema: {
        $defs: { Kids: { type: 'array', items: { $ref: '#' } } },
        type: 'object',
        properties: { name: { type: 'string', title: 'Root name' }, kids: { $ref: '#/$defs/Kids' } },
        allOf: [{ required: ['name'] }],
      },
    });
    expect(titles).toEqual(new Map([['name', 'Root name']]));
  });

  // `.kids.0` is one step of the kids' `$ref: '#'` or two of `additionalProperties`', which a regular expression would
  // split every way before failing, doubling its time with each kid: over 10 minutes at 40 kids
  it.each<[string, string, Map<string, string>]>([
    ['leads to', `${'.kids.0'.repeat(40)}.q`, new Map([['name', 'Q UI name']])],
    ['doesn’t lead to', `${'.kids.0'.repeat(40)}.zz.q.r`, new Map([['name', 'Q name']])],
  ])('reads a property where the root names itself from places that overlap a path %s', (_, property, expected) => {
    const q: RJSFSchema = { type: 'object', properties: { name: { title: 'Q name' } } };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property,
      schemaPath: '#/properties/kids/items/properties/q/required',
      parentSchema: q,
      uiSchema: { kids: { items: { q: { name: { 'ui:title': 'Q UI name' } } } } },
      schema: {
        type: 'object',
        properties: { name: { type: 'string' }, q, kids: { type: 'array', items: { $ref: '#' } } },
        additionalProperties: { $ref: '#' },
      },
    });
    expect(titles).toEqual(expected);
  });

  it('reads a property where an array item step would have to span several keys as not led to', () => {
    const q: RJSFSchema = { type: 'object', properties: { name: { title: 'Q name' } } };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.kids.0.zz.q',
      schemaPath: '#/properties/q/required',
      parentSchema: q,
      uiSchema: { q: { name: { 'ui:title': 'Root UI name' } } },
      schema: { type: 'object', properties: { name: {}, q, kids: { type: 'array', items: { $ref: '#' } } } },
    });
    expect(titles).toEqual(new Map([['name', 'Q name']]));
  });

  it('reads the ui:title at a schemaPath the root can’t be read along', () => {
    const map: RJSFSchema = { type: 'object', required: ['name'], properties: { name: {} } };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.map.foo',
      schemaPath: '#/properties/map/additionalProperties/required',
      skipsRefs: true,
      parentSchema: map,
      uiSchema: { map: { additionalProperties: { name: { 'ui:title': 'Map UI name' } } } },
      schema: {
        $defs: { M: { $anchor: 'm', type: 'object', additionalProperties: map } },
        type: 'object',
        properties: { map: { $ref: '#m' } },
      },
    });
    expect(titles).toEqual(new Map([['name', 'Map UI name']]));
  });

  it('reads a property of the root its $ref target declares where the parentSchema is the root as written', () => {
    const schema: RJSFSchema = {
      $defs: { R: { properties: { name: { type: 'string', title: 'R name' } } } },
      $ref: '#/$defs/R',
      required: ['name'],
    };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '',
      schemaPath: '#/required',
      parentSchema: schema,
      schema,
    });
    expect(titles).toEqual(new Map([['name', 'R name']]));
  });

  it('reads the field holding the branch along a schemaPath into a definition, which a $ref anywhere reaches', () => {
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
      schemaPath: '#/$defs/Item/then/required',
      parentSchema: item.then,
      schema: {
        $defs: { Item: item },
        type: 'object',
        properties: { arr: { type: 'array', items: { $ref: '#/$defs/Item' } } },
      },
    });
    expect(titles).toEqual(new Map([['name', 'Full name']]));
  });

  it('reads the parentSchema as it is where the root leads along the schemaPath to another schema', () => {
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.a',
      schemaPath: '#/required',
      parentSchema: { required: ['name'], properties: { name: { title: 'F name' } } },
      schema: {
        type: 'object',
        properties: { name: { type: 'string', title: 'Root name' }, a: { $ref: '#/$defs/F' } },
      },
    });
    expect(titles).toEqual(new Map([['name', 'F name']]));
  });

  it('names a property by the field holding the branch when the branch the parentSchema is holds a $ref', () => {
    const branch = { $ref: '#/$defs/O', required: ['n'] };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['n'],
      quote: "'",
      property: '.0',
      schemaPath: '#/items/allOf/0/required',
      parentSchema: branch,
      schema: {
        $defs: { O: { type: 'object' } },
        type: 'array',
        items: { type: 'object', properties: { n: { type: 'string', title: 'N' } }, allOf: [branch] },
      },
    });
    expect(titles).toEqual(new Map([['n', 'N']]));
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
