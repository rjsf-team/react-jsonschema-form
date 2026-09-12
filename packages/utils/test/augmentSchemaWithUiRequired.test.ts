import type { RJSFSchema, UiSchema } from '../src/index.ts';
import { augmentSchemaWithUiRequired } from '../src/index.ts';

describe('augmentSchemaWithUiRequired()', () => {
  it('returns the same schema when no uiSchema is provided', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
    };
    expect(augmentSchemaWithUiRequired(schema)).toBe(schema);
  });

  it('returns the same schema when no ui:required fields exist', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:widget': 'textarea' } };
    expect(augmentSchemaWithUiRequired(schema, uiSchema)).toBe(schema);
  });

  it('adds a ui:required: true field to the required array', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:required': true } };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result.required).toEqual(['foo']);
    expect(result).not.toBe(schema);
  });

  it('does not duplicate an already-required field', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['foo'],
      properties: { foo: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:required': true } };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result).toBe(schema);
  });

  it('preserves existing required fields alongside new ones', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['foo'],
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
    };
    const uiSchema: UiSchema = { bar: { 'ui:required': true } };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result.required).toEqual(['foo', 'bar']);
  });

  it('ignores ui:required: false', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:required': false } };
    expect(augmentSchemaWithUiRequired(schema, uiSchema)).toBe(schema);
  });

  it('recurses into nested objects', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    };
    const uiSchema: UiSchema = {
      address: { city: { 'ui:required': true } },
    };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect((result.properties!.address as RJSFSchema).required).toEqual(['city']);
    expect(result.properties).not.toBe(schema.properties);
  });

  it('augments more than one nested object, copying the properties map only once', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        home: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
        work: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    };
    const uiSchema: UiSchema = {
      home: { city: { 'ui:required': true } },
      work: { city: { 'ui:required': true } },
    };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect((result.properties!.home as RJSFSchema).required).toEqual(['city']);
    expect((result.properties!.work as RJSFSchema).required).toEqual(['city']);
  });

  it('does not mutate the original schema', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:required': true } };
    augmentSchemaWithUiRequired(schema, uiSchema);
    expect(schema.required).toBeUndefined();
  });

  it('returns the same schema when a nested object has a uiSchema but no ui:required changes', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: { city: { type: 'string' } },
        },
      },
    };
    const uiSchema: UiSchema = {
      address: { city: { 'ui:widget': 'textarea' } },
    };
    expect(augmentSchemaWithUiRequired(schema, uiSchema)).toBe(schema);
  });

  it('returns non-object schemas unchanged', () => {
    const schema: RJSFSchema = { type: 'string' };
    const uiSchema: UiSchema = { 'ui:required': true };
    expect(augmentSchemaWithUiRequired(schema, uiSchema)).toBe(schema);
  });

  it('returns object schemas with no properties unchanged', () => {
    const schema: RJSFSchema = { type: 'object' };
    const uiSchema: UiSchema = { foo: { 'ui:required': true } };
    expect(augmentSchemaWithUiRequired(schema, uiSchema)).toBe(schema);
  });
});
