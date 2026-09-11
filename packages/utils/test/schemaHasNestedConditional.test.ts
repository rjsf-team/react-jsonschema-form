import type { RJSFSchema } from '../src/index.ts';
import { schemaHasNestedConditional } from '../src/index.ts';

describe('schemaHasNestedConditional()', () => {
  it('returns false for a non-object schema', () => {
    expect(schemaHasNestedConditional(true, {})).toBe(false);
    expect(schemaHasNestedConditional(undefined, {})).toBe(false);
  });
  it('returns false for a schema with no conditional anywhere', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { foo: { type: 'string' } },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(false);
  });
  it("returns false for the root schema's own dependencies/if, which don't count as nested", () => {
    const dependenciesSchema: RJSFSchema = {
      type: 'object',
      dependencies: { foo: { required: ['bar'] } },
    };
    expect(schemaHasNestedConditional(dependenciesSchema, dependenciesSchema)).toBe(false);

    const ifSchema: RJSFSchema = {
      type: 'object',
      if: { properties: { foo: { const: 'bar' } } },
      then: { required: ['bar'] },
    };
    expect(schemaHasNestedConditional(ifSchema, ifSchema)).toBe(false);
  });
  it('returns true for a dependencies keyword nested inside properties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        m: {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
      },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for an if keyword nested inside properties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        m: {
          type: 'object',
          if: { properties: { animal: { const: 'Cat' } } },
          then: { required: ['food'] },
        },
      },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('resolves a $ref to find a dependencies keyword nested behind it', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: {
        Animal: {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
      },
      properties: { m: { $ref: '#/definitions/Animal' } },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('finds a dependencies keyword declared locally alongside a $ref, not just on the ref target', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: {
        Animal: {
          type: 'object',
          properties: { animal: { type: 'string' } },
        },
      },
      properties: {
        m: {
          $ref: '#/definitions/Animal',
          dependencies: { animal: { required: ['food'] } },
        },
      },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns false and does not throw for an unresolvable $ref', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: { m: { $ref: '#/definitions/Missing' } },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(false);
  });
  it('returns false and does not infinitely recurse for a circular $ref', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: {
        Node: {
          type: 'object',
          properties: { next: { $ref: '#/definitions/Node' } },
        },
      },
      properties: { root: { $ref: '#/definitions/Node' } },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(false);
  });
  it('ignores a $ref that resolves to a boolean schema', () => {
    const schema: RJSFSchema = {
      type: 'object',
      definitions: { Foo: true as unknown as RJSFSchema },
      properties: { m: { $ref: '#/definitions/Foo' } },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(false);
  });
  it('returns true for a dependencies keyword nested inside patternProperties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      patternProperties: {
        '^x-': {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
      },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for a dependencies keyword nested inside a single items schema', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: {
        type: 'object',
        properties: { animal: { type: 'string' } },
        dependencies: { animal: { required: ['food'] } },
      },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for a dependencies keyword nested inside a tuple items array', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
        { type: 'string' },
      ],
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for a dependencies keyword nested inside additionalProperties', () => {
    const schema: RJSFSchema = {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: { animal: { type: 'string' } },
        dependencies: { animal: { required: ['food'] } },
      },
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for a dependencies keyword nested inside allOf', () => {
    const schema: RJSFSchema = {
      type: 'object',
      allOf: [
        {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
      ],
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for a dependencies keyword nested inside anyOf', () => {
    const schema: RJSFSchema = {
      anyOf: [
        {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
      ],
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
  it('returns true for a dependencies keyword nested inside oneOf', () => {
    const schema: RJSFSchema = {
      oneOf: [
        {
          type: 'object',
          properties: { animal: { type: 'string' } },
          dependencies: { animal: { required: ['food'] } },
        },
      ],
    };
    expect(schemaHasNestedConditional(schema, schema)).toBe(true);
  });
});
