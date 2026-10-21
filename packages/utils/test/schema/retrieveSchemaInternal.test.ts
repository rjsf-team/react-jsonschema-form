import { createSchemaUtils, isObject } from '../../src/index.ts';
import type { RJSFSchema } from '../../src/index.ts';
import parseSchemaGraph from '../../src/schema/graph/parseSchemaGraph.ts';
import {
  resolveMergedOwnRef,
  resolveOwnRef,
  retrieveSchemaInternal,
  withDependentProperties,
} from '../../src/schema/retrieveSchema.ts';
import { miniValidator } from './graph/miniValidator.ts';

describe('the branch resolution schemaParser() enumerates with', () => {
  it('merges a branch beside a $ref with the definition, leaving the $ref in the branch as it stands', () => {
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

describe('the options retrieveSchema() hands out for a list a merge rebuilt', () => {
  it("resolves the $refs an option holds in the resource of the lists merged into it, not the root's", () => {
    const s: RJSFSchema = { type: 'string', default: 's' };
    const option = (key: string, beside: RJSFSchema = { $ref: '#/$defs/s' }): RJSFSchema => ({
      properties: { [key]: beside },
    });
    // The root's own `s` is a number, which an option resolved against the root would read
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: {
        s: { type: 'number' },
        res: {
          $id: 'res.json',
          $defs: {
            s,
            o: {
              type: 'object',
              allOf: [{ anyOf: [option('a'), option('b')] }, { anyOf: [option('a', { title: 'A' }), option('c')] }],
            },
          },
        },
      },
      type: 'object',
      properties: { p: { $ref: 'res.json#/$defs/o' } },
    };
    const schemaUtils = createSchemaUtils({ validator: miniValidator() }, rootSchema);
    const field = schemaUtils.retrieveSchema(rootSchema).properties?.p;
    const options = schemaUtils.retrieveSchema(isObject(field) ? field : {}).anyOf ?? [];
    expect(options).toHaveLength(4);
    const [first] = options;
    const a = schemaUtils.retrieveSchema(isObject(first) ? first : {}).properties?.a;
    expect(schemaUtils.retrieveSchema(isObject(a) ? a : {})).toMatchObject({ ...s, title: 'A' });
  });
  it('hands out an option rebuilt from lists in two resources, which no one resource holds, as a call root', () => {
    const list = (id: string, key: string): RJSFSchema => ({
      $id: id,
      anyOf: [{ properties: { [key]: { type: 'string' } } }, { properties: { [`${key}2`]: { type: 'number' } } }],
    });
    const rootSchema: RJSFSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: 'https://example.com/root.json',
      $defs: { a: list('a.json', 'a'), b: list('b.json', 'b') },
      type: 'object',
      properties: { p: { type: 'object', allOf: [{ $ref: 'a.json' }, { $ref: 'b.json' }] } },
    };
    const schemaUtils = createSchemaUtils({ validator: miniValidator() }, rootSchema);
    const field = schemaUtils.retrieveSchema(rootSchema).properties?.p;
    const [first] = schemaUtils.retrieveSchema(isObject(field) ? field : {}).anyOf ?? [];
    expect(schemaUtils.retrieveSchema(isObject(first) ? first : {}).properties).toEqual({
      a: { type: 'string' },
      b: { type: 'string' },
    });
  });
});

describe('resolveMergedOwnRef()', () => {
  it('resolves a $ref none of the seeds declares as resolveOwnRef() resolves it', () => {
    const rootSchema: RJSFSchema = { definitions: { a: { type: 'string', title: 'A' } } };
    const schema: RJSFSchema = { $ref: '#/definitions/a', description: 'D' };
    const resolved = resolveMergedOwnRef(parseSchemaGraph(rootSchema), [], schema);
    expect(resolved).toBe(resolveOwnRef(schema, rootSchema));
    expect(resolved).toMatchObject({ type: 'string', title: 'A', description: 'D' });
  });
});
