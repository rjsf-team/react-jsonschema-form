import type { MockInstance } from 'vitest';

import {
  RJSF_PROVENANCE_KEY,
  RJSF_REF_CYCLE_KEY,
  findSelectedOptionInXxxOf,
  getClosestMatchingOption,
  getDefaultFormState,
  getPropertySchema,
  isObject,
  isSchemaObject,
  retrieveSchema,
} from '../../src/index.ts';
import type { RJSFSchema, SchemaContext } from '../../src/index.ts';
import parseSchemaGraph from '../../src/schema/graph/parseSchemaGraph.ts';
import type { SchemaGraph } from '../../src/schema/graph/parseSchemaGraph.ts';
import { miniValidator } from './graph/miniValidator.ts';

/** The graphs the spied-on `graph.adopt()` returned since the last call */
function graphsAdopted(adopt: MockInstance<SchemaGraph['adopt']>): Set<SchemaGraph> {
  return new Set(
    adopt.mock.results.splice(0).flatMap((result) => (result.type === 'return' ? [result.value.graph] : [])),
  );
}

function wideSchema(): RJSFSchema {
  const properties: Record<string, RJSFSchema> = { child: { $ref: '#/definitions/child' } };
  for (let index = 0; index < 200; index += 1) {
    properties[`f${index}`] = { type: 'string' };
  }
  return {
    definitions: {
      child: {
        type: 'object',
        properties: { a: { type: 'string' } },
        if: { properties: { a: { const: 'x' } } },
        then: { properties: { b: { type: 'string' } } },
      },
    },
    type: 'object',
    properties,
  };
}

// Each edit hands the form a new data object, so the cost of an edit is what a call for new data costs. These count
// what is rebuilt rather than time it, so they hold on any machine.
describe('the cost of an edit to a wide object', () => {
  it('hands out the same view of a field until a key the view reads changes', () => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const view = retrieveSchema(context, root, root, { f0: 'a' });
    expect(retrieveSchema(context, root, root, { f0: 'b', f1: 'c' })).toBe(view);
    expect(retrieveSchema(context, view, root, { f0: 'd' })).toBe(view);
    // `child` is handed out as it stands whatever its data, so an object there keeps the view too
    expect(retrieveSchema(context, root, root, { f0: 'e', child: { a: 'x' } })).toBe(view);
    expect(retrieveSchema(context, root, root, { f0: 'e' }, true)).not.toBe(view);
  });
  it('hands out the same view of a field offering no options when asked to resolve its options, as ObjectField asks', () => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const view = retrieveSchema(context, root, root, { f0: 'a' }, true);
    expect(retrieveSchema(context, root, root, { f0: 'b', f1: 'c' }, true)).toBe(view);
  });
  it('hands out a new view once a key the view reads would collapse, even when its object is mutated in place', () => {
    const context = { validator: miniValidator() };
    const root: RJSFSchema = {
      definitions: {
        node: {
          type: 'object',
          properties: {
            k: { type: 'string' },
            child: {
              type: 'object',
              properties: { a: { type: 'string' } },
              if: { properties: { a: { const: 'x' } }, required: ['a'] },
              then: { $ref: '#/definitions/node' },
            },
          },
        },
      },
      $ref: '#/definitions/node',
    };
    const child = { a: 'y' };
    const view = retrieveSchema(context, root, root, { child });
    expect(retrieveSchema(context, root, root, { k: 'e', child })).toBe(view);
    child.a = 'x';
    const collapsed = retrieveSchema(context, root, root, { k: 'e', child });
    expect(collapsed).not.toBe(view);
    const shownChild = collapsed.properties?.child;
    expect(isObject(shownChild) && Reflect.get(shownChild, RJSF_REF_CYCLE_KEY)).toBe(true);
  });
  it('plans a spread copy of a handed-out view once while its keywords stay the same', () => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const view = retrieveSchema(context, root, root, {});
    const copy = retrieveSchema(context, { ...view, title: 'T' }, root, { f0: 'a' });
    expect(copy.title).toBe('T');
    expect(retrieveSchema(context, { ...view, title: 'T' }, root, { f0: 'b' })).toBe(copy);
    expect(retrieveSchema(context, { ...view, title: 'U' }, root, { f0: 'b' }).title).toBe('U');
  });
  it('checks no condition again for the defaults of an edit to a property that merges nothing', () => {
    const validator = miniValidator();
    const root = wideSchema();
    getDefaultFormState({ validator }, { schema: root, rootSchema: root, formData: { f0: 'a' } });
    const first = validator.calls;
    getDefaultFormState({ validator }, { schema: root, rootSchema: root, formData: { f0: 'b' } });
    expect(validator.calls).toBe(first);
  });
  it('checks a condition once for the defaults of an edit whose data holds them', () => {
    const validator = miniValidator();
    const root: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string', default: 'x' }, other: { type: 'string' } },
      if: { properties: { k: { const: 'x' } }, required: ['k'] },
      then: { properties: { t: { type: 'number', default: 2 } } },
    };
    const filled = getDefaultFormState({ validator }, { schema: root, rootSchema: root });
    const first = validator.calls;
    const edit = { ...(isObject(filled) ? filled : {}), other: 'v' };
    expect(getDefaultFormState({ validator }, { schema: root, rootSchema: root, formData: edit })).toEqual(edit);
    expect(validator.calls - first).toBe(1);
  });
  it('checks a condition a default decides once against each data the first fill plans for', () => {
    const validator = miniValidator();
    const root: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string', default: 'x' } },
      if: { properties: { k: { const: 'x' } }, required: ['k'] },
      then: { properties: { t: { type: 'number', default: 2 } } },
    };
    expect(getDefaultFormState({ validator }, { schema: root, rootSchema: root })).toEqual({ k: 'x', t: 2 });
    // `{}`, the `{ k: 'x' }` its defaults fill it with and the `{ k: 'x', t: 2 }` the `then` adds
    expect(validator.calls).toBe(3);
  });
  it('checks an `if` several `allOf` entries share once against each data the fill copies', () => {
    const validator = miniValidator();
    const shared: RJSFSchema = { properties: { k: { const: 'x' } }, required: ['k'] };
    const entry = (key: string): RJSFSchema => ({
      if: shared,
      then: { properties: { [key]: { type: 'number', default: 1 } } },
    });
    const root: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string', default: 'x' } },
      allOf: [entry('t'), entry('u')],
    };
    const filled = getDefaultFormState({ validator }, { schema: root, rootSchema: root, formData: {} });
    expect(filled).toEqual({ k: 'x', t: 1, u: 1 });
    // The `{}` of the call for each entry, since the caller may mutate it between checks, then once for both the
    // `{ k: 'x' }` and `{ k: 'x', t: 1, u: 1 }` the fill copies
    expect(validator.calls).toBe(4);
  });
  it('checks a condition the plans of a pass share once for the data they share', () => {
    const validator = miniValidator();
    // The object `const` reads the field as retrieved, whose plan checks the `if` the field's own plan checks
    const r: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string', default: 'x' } },
      allOf: [{ if: { properties: { k: { const: 'x' } }, required: ['k'] }, then: { const: { k: 'x', c: 1 } } }],
    };
    const root: RJSFSchema = { type: 'object', properties: { r } };
    expect(getDefaultFormState({ validator }, { schema: root, rootSchema: root })).toEqual({ r: { k: 'x', c: 1 } });
    expect(validator.calls).toBe(2);
  });
  it('parses no schema anew to find the option a selector picks among options that lack the selector', () => {
    const context = { validator: miniValidator() };
    const selected: RJSFSchema = { type: 'object', properties: { kind: { const: 'hit' } } };
    const root: RJSFSchema = {
      type: 'object',
      properties: { p: { oneOf: [{ type: 'object', properties: { other: { type: 'string' } } }, selected] } },
    };
    const graph = parseSchemaGraph(root);
    const adopt = vi.spyOn(graph, 'adopt');
    const p = root.properties?.p;
    expect(isObject(p) && findSelectedOptionInXxxOf(context, root, p, 'kind', 'oneOf', { kind: 'hit' })).toEqual(
      selected,
    );
    expect(adopt.mock.results.map(({ value }) => value.graph === graph)).not.toContain(false);
  });
  it('parses the schema of the extra keys its patterns describe once, from one edit to the next', () => {
    const context = { validator: miniValidator() };
    const root: RJSFSchema = {
      type: 'object',
      patternProperties: { '^a': { type: 'string' }, '^ab': { minLength: 1 } },
    };
    const graph = parseSchemaGraph(root);
    const adopt = vi.spyOn(graph, 'adopt');
    const adoptedGraphs = () =>
      new Set(adopt.mock.results.splice(0).flatMap((result) => (result.type === 'return' ? [result.value.graph] : [])));
    const edit = (value: string) => {
      const formData = { abc: value, ab2: 'y', a: 'z' };
      retrieveSchema(context, root, root, formData);
      getDefaultFormState(context, { schema: root, rootSchema: root, formData });
      return adoptedGraphs();
    };
    const first = edit('x');
    expect([...edit('w')].filter((adopted) => !first.has(adopted))).toEqual([]);
  });
  it('parses no schema anew for the defaults of an untouched field offering options beside an unmerged allOf', () => {
    const context = { validator: miniValidator() };
    const root: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          allOf: [{ type: 'object' }],
          oneOf: [{ properties: { a: { type: 'string', default: 'a' } } }, { properties: { b: { type: 'string' } } }],
        },
        q: { type: 'string' },
      },
    };
    const graph = parseSchemaGraph(root);
    const adopt = vi.spyOn(graph, 'adopt');
    const adoptedGraphs = () =>
      new Set(adopt.mock.results.splice(0).flatMap((result) => (result.type === 'return' ? [result.value.graph] : [])));
    const edit = (value: string) => {
      expect(getDefaultFormState(context, { schema: root, rootSchema: root, formData: { q: value } })).toEqual({
        q: value,
        p: { a: 'a' },
      });
      return adoptedGraphs();
    };
    const first = edit('x');
    expect([...edit('y')].filter((adopted) => !first.has(adopted))).toEqual([]);
  });
  it('parses the options a merge rebuilds for each plan once while their keywords stay the same', () => {
    const context = { validator: miniValidator() };
    // `b` is declared by D0 and by the D1 it merges, each with an option list, so it offers the cross product
    const root: RJSFSchema = {
      definitions: {
        D0: { type: 'object', properties: { b: { $ref: '#/definitions/D1' } }, allOf: [{ $ref: '#/definitions/D1' }] },
        D1: {
          type: 'object',
          properties: { b: { anyOf: [{ $ref: '#/definitions/D0' }, { type: 'string' }] } },
          anyOf: [{ title: 'first' }, { title: 'second' }],
        },
      },
      $ref: '#/definitions/D0',
    };
    const b = retrieveSchema(context, root, root).properties?.b;
    const provenancesFor = (data: object) =>
      (isSchemaObject(b) ? (retrieveSchema(context, b, root, data, true).anyOf ?? []) : []).map((option): unknown =>
        isObject(option) ? Reflect.get(option, RJSF_PROVENANCE_KEY) : undefined,
      );
    const first = provenancesFor({ n: 1 });
    expect(first).toHaveLength(4);
    provenancesFor({ n: 2 }).forEach((provenance, index) => expect(provenance).toBe(first[index]));
  });
  it.each<[string, (context: SchemaContext, root: RJSFSchema, index: number) => RJSFSchema]>([
    [
      "SchemaField's stand-in for a boolean option, retrieved for the field's data",
      (context, root, index) => retrieveSchema(context, {}, root, `v${index}`),
    ],
    [
      "LayoutGridField's stand-in for a part the schema lacks, retrieved for the empty data it reads there",
      (context, root) => retrieveSchema(context, {}, root, {}),
    ],
    [
      'the stand-in getPropertySchema() hands back for an undeclared property, as a switch of options retrieves it',
      (context, root) => retrieveSchema(context, getPropertySchema(root, 'undeclared'), root),
    ],
  ])('plans %s once, however often it is built', (_, retrieveBuilt) => {
    const context = { validator: miniValidator() };
    const root = wideSchema();
    const adopt = vi.spyOn(parseSchemaGraph(root), 'adopt');
    const view = retrieveBuilt(context, root, 0);
    expect(retrieveBuilt(context, root, 1)).toBe(view);
    expect(graphsAdopted(adopt).size).toBe(1);
  });
  it('parses the options a merge rebuilds for the defaults once, from one call to the next', () => {
    const context = { validator: miniValidator() };
    // An `if` beside the `allOf` has it merged, which makes the cross product of the two lists
    const root: RJSFSchema = {
      type: 'object',
      properties: {
        q: { type: 'string' },
        p: {
          type: 'object',
          if: { properties: { k: { const: 'z' } } },
          then: { properties: { t: { type: 'string' } } },
          allOf: [
            {
              anyOf: [
                { properties: { a: { type: 'string', default: 'a' } } },
                { properties: { b: { type: 'string' } } },
              ],
            },
            {
              anyOf: [
                { properties: { c: { type: 'string', default: 'c' } } },
                { properties: { d: { type: 'string' } } },
              ],
            },
          ],
        },
      },
    };
    const adopt = vi.spyOn(parseSchemaGraph(root), 'adopt');
    const edit = (value: string) => {
      expect(getDefaultFormState(context, { schema: root, rootSchema: root, formData: { q: value } })).toEqual({
        q: value,
        p: { a: 'a', c: 'c' },
      });
      return graphsAdopted(adopt);
    };
    const first = edit('x');
    expect(first.size).toBeGreaterThan(0);
    expect([...edit('y')].filter((adopted) => !first.has(adopted))).toEqual([]);
  });
  it('parses no schema anew for the defaults of a field holding an object, offering options beside an unmerged allOf', () => {
    const context = { validator: miniValidator() };
    const root: RJSFSchema = {
      type: 'object',
      properties: {
        p: {
          allOf: [{ type: 'object' }],
          oneOf: [{ properties: { a: { type: 'string', default: 'a' } } }, { properties: { b: { type: 'string' } } }],
        },
        q: { type: 'string' },
      },
    };
    const adopt = vi.spyOn(parseSchemaGraph(root), 'adopt');
    const edit = (value: string) => {
      expect(
        getDefaultFormState(context, { schema: root, rootSchema: root, formData: { q: value, p: { a: value } } }),
      ).toEqual({
        q: value,
        p: { a: value },
      });
      return graphsAdopted(adopt);
    };
    const first = edit('x');
    expect([...edit('y')].filter((adopted) => !first.has(adopted))).toEqual([]);
  });
});

describe("the cost of scoring options under additionalPropertiesWhenAbsent: 'allow' (#5930)", () => {
  // Whether an option stubs the data's extra keys depends on the field offering the options, retrieved for the data,
  // which checks its `if`; a pick made before for the same data needs none of it
  it('checks no condition of the field offering the options to score the same data again', () => {
    const validator = miniValidator();
    const context = { validator, additionalPropertiesWhenAbsent: 'allow' as const };
    const options: RJSFSchema[] = [
      { properties: { a: { type: 'string' } } },
      { properties: { b: { type: 'string' } } },
    ];
    const field: RJSFSchema = { if: { required: ['k'] }, then: { type: 'object' }, oneOf: options };
    const rootSchema: RJSFSchema = { type: 'object', properties: { p: field } };
    const data = { a: 'x', k: 1 };
    expect(getClosestMatchingOption(context, rootSchema, data, options, 0)).toBe(0);
    const { calls } = validator;
    expect(calls).toBeGreaterThan(0);
    expect(getClosestMatchingOption(context, rootSchema, data, options, 0)).toBe(0);
    expect(validator.calls).toBe(calls);
  });
});

describe("the options scored under additionalPropertiesWhenAbsent: 'allow' for data changed in place (#5930)", () => {
  // Typed by its `then`, the field renders its own field beside the option, which takes the extra key `z` itself, so
  // the two options tie and the first is picked; untyped once `k` is gone, it leaves `z` to the option, which only the
  // second takes
  it('reads the field offering the options again for data a caller changed since the last call', () => {
    const context = { validator: miniValidator(), additionalPropertiesWhenAbsent: 'allow' as const };
    const options: RJSFSchema[] = [
      { properties: { a: { type: 'string' } }, additionalProperties: false },
      { properties: { a: { type: 'string' } } },
    ];
    const field: RJSFSchema = { if: { required: ['k'] }, then: { type: 'object' }, oneOf: options };
    const rootSchema: RJSFSchema = { type: 'object', properties: { p: field } };
    const data: Record<string, unknown> = { a: 'x', z: 'y', k: 1 };
    expect(getClosestMatchingOption(context, rootSchema, data, options, -1)).toBe(0);
    delete data.k;
    expect(getClosestMatchingOption(context, rootSchema, data, options, -1)).toBe(1);
  });
});
