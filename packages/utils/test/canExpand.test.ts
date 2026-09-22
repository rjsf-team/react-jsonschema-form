import type { RJSFSchema } from '../src/index.ts';
import { canExpand } from '../src/index.ts';

describe('canExpand()', () => {
  it('no additional or pattern properties', () => {
    expect(canExpand({}, {}, {})).toBe(false);
  });
  it('has additional properties', () => {
    const schema: RJSFSchema = {
      additionalProperties: {
        type: 'string',
      },
    };
    expect(canExpand(schema)).toBe(true);
  });
  it('has pattern properties', () => {
    const schema: RJSFSchema = {
      patternProperties: {
        '^foo': {
          type: 'string',
        },
      },
    };
    expect(canExpand(schema)).toBe(true);
  });
  it('has uiSchema expandable false', () => {
    const schema: RJSFSchema = {
      additionalProperties: {
        type: 'string',
      },
    };
    const uiSchema = {
      'ui:options': {
        expandable: false,
      },
    };
    expect(canExpand(schema, uiSchema)).toBe(false);
  });
  it('does not exceed maxProperties', () => {
    const schema: RJSFSchema = {
      maxProperties: 1,
      additionalProperties: {
        type: 'string',
      },
    };
    expect(canExpand(schema)).toBe(true);
  });
  it('already exceeds maxProperties', () => {
    const schema: RJSFSchema = {
      maxProperties: 1,
      additionalProperties: {
        type: 'string',
      },
    };
    const formData = {
      foo: 'bar',
    };
    expect(canExpand(schema, {}, formData)).toBe(false);
  });
  it('has an allowed property name left to take', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { enum: ['foo', 'bar'] },
      properties: { foo: { type: 'string' } },
    };
    expect(canExpand(schema)).toBe(true);
  });
  it('has taken every allowed property name', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { enum: ['foo', 'bar'] },
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
    };
    expect(canExpand(schema)).toBe(false);
  });
  it('has taken every allowed property name through its form data', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { enum: ['foo'] },
    };
    expect(canExpand(schema, {}, { foo: 'bar' })).toBe(false);
  });
  it('has taken every allowed property name while under the maxProperties limit', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { enum: ['foo', 'bar'] },
      maxProperties: 10,
    };
    expect(canExpand(schema, {}, { foo: '1', bar: '2' })).toBe(false);
  });
  it('has an allowed property name left to take but is at the maxProperties limit', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { enum: ['foo', 'bar'] },
      maxProperties: 1,
    };
    expect(canExpand(schema, {}, { foo: '1' })).toBe(false);
  });
  it('has a propertyNames that enumerates no name of its own', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { maxLength: 3 },
    };
    expect(canExpand(schema)).toBe(true);
  });
  it('has a propertyNames whose enum holds no name that could be a key', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: { enum: [1, 2] },
    };
    expect(canExpand(schema)).toBe(true);
  });
  it('has a boolean propertyNames', () => {
    const schema: RJSFSchema = {
      additionalProperties: { type: 'string' },
      propertyNames: true,
    };
    expect(canExpand(schema)).toBe(true);
  });
});
