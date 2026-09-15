import type { RJSFSchema, UiSchema } from '../../src/index.ts';
import { getUiRequiredErrorSchema, toErrorList } from '../../src/index.ts';
import getTestValidator from '../testUtils/getTestValidator.ts';

const testValidator = getTestValidator({});

describe('getUiRequiredErrorSchema()', () => {
  it('returns an empty error schema when no ui:required is set anywhere', () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const uiSchema: UiSchema = { foo: { 'ui:widget': 'textarea' } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { foo: 'x' });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('returns an empty error schema when uiSchema is undefined', () => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { type: 'string' } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, undefined, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('reports a missing top-level ui:required field', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.nick');
    expect(errors[0].message).toBe("must have required property 'nick'");
  });

  it('does not report a ui:required field that has a value', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { nick: 'Chuck' });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('ignores ui:required: false', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    const uiSchema: UiSchema = { nick: { 'ui:required': false } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('does not check ui:required at the root path itself', () => {
    const schema: RJSFSchema = { type: 'object', properties: { nick: { type: 'string' } } };
    // 'ui:required' isn't a real uiSchema key at the root, but even if present it must not be checked at path []
    const uiSchema = { 'ui:required': true } as unknown as UiSchema;
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('reports a missing deeply nested ui:required field', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } },
      },
    };
    const uiSchema: UiSchema = { a: { b: { c: { 'ui:required': true } } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { a: { b: {} } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.a.b.c');
  });

  it('reports a missing nested ui:required field when an ancestor object is entirely absent from formData', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        a: { type: 'object', properties: { b: { type: 'object', properties: { c: { type: 'string' } } } } },
      },
    };
    const uiSchema: UiSchema = { a: { b: { c: { 'ui:required': true } } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.a.b.c');
  });

  it('walks into an object schema with no properties without erroring', () => {
    const schema: RJSFSchema = { type: 'object', properties: { empty: { type: 'object' } } };
    const uiSchema: UiSchema = { empty: { 'ui:widget': 'someWidget' } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { empty: {} });
    expect(toErrorList(errorSchema)).toEqual([]);
  });

  it('skips a boolean sub-schema property without erroring', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { flag: true as unknown as RJSFSchema, nick: { type: 'string' } },
    };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.nick');
  });

  it('reports a ui:required field only introduced by a schema-form dependency', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { a: { type: 'string' } },
      dependencies: { a: { properties: { b: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = { b: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { a: 'x' });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.b');
  });

  it('reports a ui:required field declared through a nested allOf', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        address: {
          allOf: [
            { type: 'object', properties: { street: { type: 'string' } } },
            { type: 'object', properties: { city: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { address: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.address.street');
  });

  it('reports a ui:required field declared under a nested $ref', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { street: { type: 'string' } } } },
      properties: { address: { $ref: '#/definitions/Address' } },
    };
    const uiSchema: UiSchema = { address: { street: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { address: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.address.street');
  });

  it('reports a ui:required field on a $ref-rooted schema', () => {
    const schema: RJSFSchema = {
      definitions: { Person: { type: 'object', properties: { nick: { type: 'string' } } } },
      $ref: '#/definitions/Person',
    };
    const uiSchema: UiSchema = { nick: { 'ui:required': true } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, {});
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.nick');
  });

  it('reports a ui:required field declared in a ui:definitions fragment', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
      properties: { home: { $ref: '#/definitions/Address' } },
    };
    const uiSchema: UiSchema = {
      'ui:definitions': { '#/definitions/Address': { zip: { 'ui:required': true } } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { home: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.home.zip');
  });

  it('finds a ui:definitions-declared field reused at more than one path', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
      properties: {
        home: { $ref: '#/definitions/Address' },
        work: { $ref: '#/definitions/Address' },
      },
    };
    const uiSchema: UiSchema = {
      'ui:definitions': { '#/definitions/Address': { zip: { 'ui:required': true } } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { home: {}, work: { zip: '1' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.home.zip');
  });

  it('accepts an explicit uiSchemaDefinitions argument instead of reading ui:definitions off the uiSchema', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Address: { type: 'object', properties: { zip: { type: 'string' } } } },
      properties: { home: { $ref: '#/definitions/Address' } },
    };
    const uiSchemaDefinitions = { '#/definitions/Address': { zip: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(
      testValidator,
      schema,
      undefined,
      { home: {} },
      undefined,
      uiSchemaDefinitions,
    );
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.home.zip');
  });

  it('reports a ui:required field nested inside array items', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        people: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } },
      },
    };
    const uiSchema: UiSchema = { people: { items: { name: { 'ui:required': true } } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { people: [{}, { name: 'x' }] });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.people.0.name');
  });

  it('reports a ui:required field at the correct tuple position when uiSchema.items is an array', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: [
        { type: 'object', properties: { first: { type: 'string' } } },
        { type: 'object', properties: { second: { type: 'string' } } },
      ],
    };
    const uiSchema: UiSchema = {
      items: [{ first: { 'ui:required': true } }, { second: { 'ui:required': true } }],
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, [{}, {}]);
    const errors = toErrorList(errorSchema)
      .map((e) => e.property)
      .sort();
    expect(errors).toEqual(['.0.first', '.1.second']);
  });

  it('reports a ui:required field on an item added past a fixed tuple, using uiSchema.additionalItems', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: [{ type: 'object', properties: { first: { type: 'string' } } }],
      additionalItems: { type: 'object', properties: { extra: { type: 'string' } } },
    };
    const uiSchema: UiSchema = {
      items: { first: { 'ui:required': true } },
      additionalItems: { extra: { 'ui:required': true } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, [{ first: 'x' }, {}]);
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.1.extra');
  });

  it('reports a ui:required field on a dynamically-added additionalProperties entry', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
      additionalProperties: { type: 'object', properties: { name: { type: 'string' } } },
    };
    const uiSchema: UiSchema = {
      additionalProperties: { name: { 'ui:required': true } },
    };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { foo: 'x', extraKey: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.extraKey.name');
  });

  it('reports a ui:required field inside the selected oneOf branch', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          oneOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { aField: { 'ui:required': true }, bField: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'a' } });
    const errors = toErrorList(errorSchema);
    // Only the selected ('a') branch's field is checked; the unselected branch's bField is not reached.
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.aField');
  });

  it('reports a ui:required field inside the selected anyOf branch', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        thing: {
          anyOf: [
            { type: 'object', properties: { kind: { type: 'string', const: 'a' }, aField: { type: 'string' } } },
            { type: 'object', properties: { kind: { type: 'string', const: 'b' }, bField: { type: 'string' } } },
          ],
        },
      },
    };
    const uiSchema: UiSchema = { thing: { bField: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: { kind: 'b' } });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.bField');
  });

  it('treats an empty oneOf list as a plain schema rather than throwing', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { thing: { type: 'object', oneOf: [], properties: { nick: { type: 'string' } } } },
    };
    const uiSchema: UiSchema = { thing: { nick: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.nick');
  });

  it('treats a malformed non-array oneOf as a plain schema rather than throwing', () => {
    const schema = {
      type: 'object',
      properties: {
        thing: {
          type: 'object',
          oneOf: 'not-an-array',
          properties: { nick: { type: 'string' } },
        },
      },
    } as unknown as RJSFSchema;
    const uiSchema: UiSchema = { thing: { nick: { 'ui:required': true } } };
    const errorSchema = getUiRequiredErrorSchema(testValidator, schema, uiSchema, { thing: {} });
    const errors = toErrorList(errorSchema);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('.thing.nick');
  });
});
