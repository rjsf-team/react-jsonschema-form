import { augmentSchemaWithUiRequired, RJSFSchema, UiSchema } from '../src';

describe('augmentSchemaWithUiRequired', () => {
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

  it('adds ui:required: true field to required array', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:required': true } };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result.required).toEqual(['foo']);
    expect(result).not.toBe(schema);
  });

  it('does not duplicate existing required fields', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['foo'],
      properties: { foo: { type: 'string' } },
    };
    const uiSchema: UiSchema = { foo: { 'ui:required': true } };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result).toBe(schema);
  });

  it('preserves existing required and adds new ones', () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['foo'],
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
    };
    const uiSchema: UiSchema = { bar: { 'ui:required': true } };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result.required).toEqual(['foo', 'bar']);
  });

  it('handles nested objects', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
          },
        },
      },
    };
    const uiSchema: UiSchema = {
      address: { city: { 'ui:required': true } },
    };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect((result.properties!.address as RJSFSchema).required).toEqual(['city']);
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

  it('returns same schema when nested object has uiSchema but no ui:required changes', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
          },
        },
      },
    };
    const uiSchema: UiSchema = {
      address: { city: { 'ui:widget': 'textarea' } },
    };
    const result = augmentSchemaWithUiRequired(schema, uiSchema);
    expect(result).toBe(schema);
  });

  it('returns schema as-is for non-object types', () => {
    const schema: RJSFSchema = { type: 'string' };
    const uiSchema: UiSchema = { 'ui:required': true };
    expect(augmentSchemaWithUiRequired(schema, uiSchema)).toBe(schema);
  });
});
