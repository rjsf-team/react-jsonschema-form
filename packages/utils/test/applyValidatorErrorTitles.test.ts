import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { applyValidatorErrorTitles } from '../src/index.ts';
import getTestValidator from './testUtils/getTestValidator.ts';

const context = { validator: getTestValidator({}) };
const message = "must have required property 'name'";

describe('applyValidatorErrorTitles()', () => {
  it('returns the message as it is when no name has a title', () => {
    expect(
      applyValidatorErrorTitles({
        message,
        names: ['name'],
        quote: "'",
        property: '',
        context,
        schema: { type: 'object', properties: { name: { type: 'string' } } },
      }),
    ).toEqual({ message, titles: new Map() });
  });

  it('names each name by the title the form labels its field under the property with', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { user: { type: 'object', properties: { name: { type: 'string', title: 'Schema name' } } } },
    };
    const uiSchema: UiSchema = { user: { name: { 'ui:title': 'UI name' } } };
    const source = { message, names: ['name'], quote: "'" as const, property: '.user', context, schema };
    expect(applyValidatorErrorTitles(source)).toEqual({
      message: "must have required property 'Schema name'",
      titles: new Map([['name', 'Schema name']]),
    });
    expect(applyValidatorErrorTitles({ ...source, uiSchema }).titles).toEqual(new Map([['name', 'UI name']]));
  });

  it('reads a name holding a dot as one key at a property holding a dot', () => {
    const { titles } = applyValidatorErrorTitles({
      message: "must have required property 'c.d'",
      names: ['c.d'],
      quote: "'",
      property: "['a.b']",
      context,
      schema: {
        type: 'object',
        properties: { 'a.b': { type: 'object', properties: { 'c.d': { type: 'string', title: 'Right' } } } },
      },
      uiSchema: { a: { b: { c: { d: { 'ui:title': 'Wrong' } } } } },
    });
    expect(titles).toEqual(new Map([['c.d', 'Right']]));
  });

  it("replaces every quoted name in one pass, in single quotes, so a title matching another name isn't replaced", () => {
    const { message: titled } = applyValidatorErrorTitles({
      message: 'must have property "b" when property "a" is present, and "a" again',
      names: ['b', 'a'],
      quote: '"',
      property: '',
      context,
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
      context,
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
      context,
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
      context,
      schema: { type: 'object', properties: { it: { title: 'It' } } },
    });
    expect(titled).toEqual("must have property 'it's' when property 'It' is present");
  });

  // `.kids.0` is one step of the kids' `$ref: '#'` or two of `additionalProperties`'; the walk follows the data, so it
  // stays linear in the path. The uiSchema names `q` one kid deep only, so 40 kids down `q.name` takes its schema title
  it.each<[string, string, Map<string, string>]>([
    ['a field', `${'.kids.0'.repeat(40)}.q`, new Map([['name', 'Q name']])],
    ['no field', `${'.kids.0'.repeat(40)}.zz.q.r`, new Map()],
  ])('reads a path to %s where the root names itself from places that overlap', (_, property, expected) => {
    const q: RJSFSchema = { type: 'object', properties: { name: { title: 'Q name' } } };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property,
      context,
      uiSchema: { kids: { items: { q: { name: { 'ui:title': 'Q UI name' } } } } },
      schema: {
        type: 'object',
        properties: { name: { type: 'string' }, q, kids: { type: 'array', items: { $ref: '#' } } },
        additionalProperties: { $ref: '#' },
      },
    });
    expect(titles).toEqual(expected);
  });

  it.each<[string, string, Map<string, string>]>([
    ['a definition path', '#/$defs/M', new Map([['name', 'Map UI name']])],
    ['an $anchor, which retrieveSchema() can’t resolve,', '#m', new Map()],
  ])('reads a field of an extra key under a $ref to %s', (_, $ref, expected) => {
    const map: RJSFSchema = { type: 'object', required: ['name'], properties: { name: {} } };
    const { titles } = applyValidatorErrorTitles({
      message,
      names: ['name'],
      quote: "'",
      property: '.map.foo',
      context,
      uiSchema: { map: { additionalProperties: { name: { 'ui:title': 'Map UI name' } } } },
      schema: {
        $defs: { M: { $anchor: 'm', type: 'object', additionalProperties: map } },
        type: 'object',
        properties: { map: { $ref } },
      },
    });
    expect(titles).toEqual(expected);
  });
});
