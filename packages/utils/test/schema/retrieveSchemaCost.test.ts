import {
  RJSF_PROVENANCE_KEY,
  RJSF_REF_CYCLE_KEY,
  findSelectedOptionInXxxOf,
  getDefaultFormState,
  isObject,
  isSchemaObject,
  retrieveSchema,
} from '../../src/index.ts';
import type { RJSFSchema } from '../../src/index.ts';
import parseSchemaGraph from '../../src/schema/graph/parseSchemaGraph.ts';
import { miniValidator } from './graph/miniValidator.ts';

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
});
