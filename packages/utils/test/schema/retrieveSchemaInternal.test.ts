import { createSchemaUtils, RJSF_REF_KEY } from '../../src/index.ts';
import type { RJSFSchema } from '../../src/index.ts';
import { retrieveSchemaInternal, withDependentProperties } from '../../src/schema/retrieveSchema.ts';
import { miniValidator } from './graph/miniValidator.ts';

describe('the branch resolution schemaParser() enumerates with', () => {
  it('merges a branch beside a $ref into the definition, marked with the reference it was resolved from', () => {
    const schema: RJSFSchema = {
      definitions: { A: { type: 'object', properties: { a: { type: 'string' } } } },
      type: 'object',
      properties: {
        p: { $ref: '#/definitions/A', if: {}, then: { properties: { friend: { $ref: '#/definitions/A' } } } },
      },
    };
    const property = schema.properties?.p;
    expect(typeof property).toBe('object');
    const [retrieved] = retrieveSchemaInternal(
      { validator: miniValidator() },
      typeof property === 'object' ? property : {},
      schema,
      {},
    );
    expect(retrieved.properties).toEqual({ a: { type: 'string' }, friend: { $ref: '#/definitions/A' } });
    expect(Reflect.get(retrieved, RJSF_REF_KEY)).toBe('#/definitions/A');
  });

  it('withDependentProperties() starts a required list for a schema without one', () => {
    expect(withDependentProperties({ type: 'object' }, ['a'])).toEqual({ type: 'object', required: ['a'] });
  });
});

describe('the option retrieveSchema() merges beside dependencies', () => {
  it('matches the options of an object reached in two resources as each resource reads them', () => {
    const shared: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string' } },
      dependencies: { k: { properties: { d: { type: 'string' } } } },
      oneOf: [{ $ref: '#/$defs/o1' }, { $ref: '#/$defs/o2' }],
    };
    const resource = (id: string, first: string, second: string): RJSFSchema => ({
      $id: id,
      $defs: {
        o1: { properties: { k: { const: first }, one: { type: 'string' } } },
        o2: { properties: { k: { const: second }, two: { type: 'string' } } },
        s: shared,
      },
    });
    const rootSchema: RJSFSchema = {
      $id: 'http://x/root.json',
      type: 'object',
      $defs: { A: resource('http://x/a.json', 'x', 'y'), B: resource('http://x/b.json', 'y', 'x') },
      properties: { pa: { $ref: 'http://x/a.json#/$defs/s' }, pb: { $ref: 'http://x/b.json#/$defs/s' } },
    };
    const schemaUtils = createSchemaUtils({ validator: miniValidator() }, rootSchema);
    const view = schemaUtils.retrieveSchema(rootSchema, { pa: { k: 'x' }, pb: { k: 'x' } });
    const propertyKeys = (key: string) => {
      const property = view.properties?.[key];
      const retrieved = schemaUtils.retrieveSchema(typeof property === 'object' ? property : {}, { k: 'x' });
      return Object.keys(retrieved.properties ?? {});
    };
    expect(propertyKeys('pa')).toEqual(['k', 'one', 'd']);
    expect(propertyKeys('pb')).toEqual(['k', 'two', 'd']);
  });
});
