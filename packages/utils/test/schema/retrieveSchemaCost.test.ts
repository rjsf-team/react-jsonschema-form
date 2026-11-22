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
  REUSES_DEFAULTS_FLAG,
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
  it('checks no condition again for the defaults of an edit that leaves the key it reads as it was', () => {
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
    expect(validator.calls - first).toBe(0);
  });
  it('checks no condition again for an edit of a key no condition reads (#4051)', () => {
    const validator = miniValidator();
    const root: RJSFSchema = {
      type: 'object',
      properties: { kind: { type: 'string' }, other: { type: 'string' } },
      allOf: ['a', 'b', 'c'].map((kind) => ({
        if: { properties: { kind: { const: kind } }, required: ['kind'] },
        then: { properties: { [kind]: { type: 'string' } } },
      })),
    };
    const context = { validator };
    getDefaultFormState(context, { schema: root, rootSchema: root, formData: { kind: 'b' } });
    retrieveSchema(context, root, root, { kind: 'b' });
    const first = validator.calls;
    getDefaultFormState(context, { schema: root, rootSchema: root, formData: { kind: 'b', other: 'v' } });
    expect(retrieveSchema(context, root, root, { kind: 'b', other: 'v' }).properties).toHaveProperty('b');
    expect(validator.calls).toBe(first);
    expect(retrieveSchema(context, root, root, { kind: 'c', other: 'v' }).properties).toHaveProperty('c');
    expect(validator.calls).toBe(first + 3);
  });
  it('checks a condition a default decides once for each value of the key it reads the first fill plans for', () => {
    const validator = miniValidator();
    const root: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string', default: 'x' } },
      if: { properties: { k: { const: 'x' } }, required: ['k'] },
      then: { properties: { t: { type: 'number', default: 2 } } },
    };
    expect(getDefaultFormState({ validator }, { schema: root, rootSchema: root })).toEqual({ k: 'x', t: 2 });
    // `{}` and the `{ k: 'x' }` its defaults fill it with; the `{ k: 'x', t: 2 }` the `then` adds holds the same `k`
    expect(validator.calls).toBe(2);
  });
  it('checks an `if` several `allOf` entries share once for each value of the key it reads', () => {
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
    // The `{}` of the call, then the `{ k: 'x' }` the fill copies, whose `k` the `{ k: 'x', t: 1, u: 1 }` holds too
    expect(validator.calls).toBe(2);
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
    expect(validator.calls).toBe(1);
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
  describe('the defaults of a long list (#3183)', () => {
    // Each row checks its `if` against its own data, so the validator's calls count the rows folded. The `minProperties`
    // makes the `if` read the whole row, so no check is spared for the value of `k` alone, see `conditionReads()`
    const row: RJSFSchema = {
      type: 'object',
      properties: { k: { type: 'string' } },
      if: { properties: { k: { const: 'k1' } }, required: ['k'], minProperties: 1 },
      then: { properties: { t: { type: 'string', default: 'd' } } },
    };
    const list: RJSFSchema = { type: 'array', items: row };
    const rowsOf = (count: number) => Array.from({ length: count }, (_, index) => ({ k: `k${index}` }));
    const fill = (context: SchemaContext, formData: unknown, more?: object, schema = list) =>
      getDefaultFormState(context, { schema, rootSchema: schema, formData, ...more });

    // As `Form` marks its context
    const reusing = (validator: SchemaContext['validator']): SchemaContext => ({
      validator,
      [REUSES_DEFAULTS_FLAG]: true,
    });

    it('folds every row again, and takes no snapshot, for a caller that does not mark its context', () => {
      const validator = miniValidator();
      const context = { validator };
      const state = fill(context, rowsOf(20));
      const first = validator.calls;
      const edited = Array.isArray(state) ? state.with(3, { k: 'edited' }) : [];
      expect(fill(context, edited)).toEqual(edited);
      expect(validator.calls - first).toBe(20);
    });
    it('folds only the row an edit changed', () => {
      const validator = miniValidator();
      const context = reusing(validator);
      const state = fill(context, rowsOf(20));
      expect(state).toHaveLength(20);
      const first = validator.calls;
      const edited = Array.isArray(state) ? state.with(3, { k: 'edited' }) : [];
      const next = fill(context, edited);
      expect(next).toEqual(edited);
      expect(validator.calls - first).toBeLessThanOrEqual(2);
      // The state is the caller's, so a row is no object another call handed out
      expect(Array.isArray(next) && next[1]).not.toBe(Array.isArray(state) && state[1]);
      expect(Array.isArray(next) && next[1]).toEqual({ k: 'k1', t: 'd' });
    });
    it('hands back the defaults an earlier call computed for a row, called with the same data again', () => {
      const validator = miniValidator();
      const context = reusing(validator);
      const rows = rowsOf(3);
      const first = fill(context, rows);
      const { calls } = validator;
      const again = fill(context, rows);
      expect(again).toEqual([{ k: 'k0' }, { k: 'k1', t: 'd' }, { k: 'k2' }]);
      expect(again).toEqual(first);
      expect(validator.calls).toBe(calls);
    });
    it('hands a row its fold kept as it stands back as the data a later call gives it', () => {
      const context = reusing(miniValidator());
      // An untyped item keeps its object data as it stands once the defaults are generated
      const untyped: RJSFSchema = { type: 'array', items: {} };
      const row = { a: 1 };
      const more = { initialDefaultsGenerated: true };
      fill(context, [row], more, untyped);
      const again = fill(context, [row], more, untyped);
      expect(again).toEqual([{ a: 1 }]);
      expect(Array.isArray(again) && again[0]).not.toBe(row);
    });
    describe('a row holding arrays, objects and dates', () => {
      const values: RJSFSchema = { type: 'array', items: { ...row, properties: { k: { type: 'string' } } } };
      const rowOf = (): Record<string, unknown> => ({
        k: 'k0',
        list: [1, [2]],
        when: new Date(0),
        nested: { a: 1 },
      });
      /** The validator calls a third call makes, after each key of `changes` takes what its function makes of its
       * value, which may change that value in place and hand it back
       */
      const checksAfter = (changes: Record<string, (current: unknown) => unknown>) => {
        const validator = miniValidator();
        const context = reusing(validator);
        const rows = [rowOf()];
        fill(context, rows, {}, values);
        const first = validator.calls;
        fill(context, rows, {}, values);
        expect(validator.calls).toBe(first);
        for (const [key, change] of Object.entries(changes)) {
          rows[0][key] = change(rows[0][key]);
        }
        const before = validator.calls;
        fill(context, rows, {}, values);
        return validator.calls - before;
      };

      it('is reused while what it holds equals its snapshot, a `Date` by its time', () => {
        const changes = { when: () => new Date(0), list: () => [1, [2]], nested: () => ({ a: 1 }) };
        expect(checksAfter(changes)).toBe(0);
      });
      it('is reused while it holds an invalid `Date`, whose time equals no time', () => {
        const validator = miniValidator();
        const context = reusing(validator);
        const rows = [{ ...rowOf(), when: new Date(NaN) }];
        fill(context, rows, {}, values);
        const first = validator.calls;
        fill(context, rows, {}, values);
        expect(validator.calls).toBe(first);
      });
      it.each<[string, Record<string, (current: unknown) => unknown>]>([
        [
          'a `Date` changes in place',
          {
            when: (when) => {
              (when as Date).setTime(1);
              return when;
            },
          },
        ],
        [
          'an array grows in place',
          {
            list: (list) => {
              (list as unknown[]).push(3);
              return list;
            },
          },
        ],
        [
          'a nested array grows in place',
          {
            list: (list) => {
              (list as unknown[][])[1].push(9);
              return list;
            },
          },
        ],
        [
          'an array item is deleted in place, leaving a hole',
          {
            list: (list) => {
              Reflect.deleteProperty(list as unknown[], 0);
              return list;
            },
          },
        ],
        ['a `Date` changes', { when: () => new Date(1) }],
        ['a `Date` turns into a string', { when: () => 'now' }],
        ['an object gains a key', { nested: () => ({ a: 1, b: 2 }) }],
        ['an object trades a key for another', { nested: () => ({ c: 1 }) }],
        ['an array turns into an object', { list: () => ({ 0: 1, 1: [2] }) }],
        ['an object turns into an array', { nested: () => [1] }],
      ])('is folded again once %s', (_label, changes) => {
        expect(checksAfter(changes)).toBeGreaterThan(0);
      });
      it('fills the default of an item set to `undefined` where its array held a hole, and keeps a hole it still holds', () => {
        const context = reusing(miniValidator());
        const lists: RJSFSchema = {
          type: 'array',
          items: { type: 'object', properties: { list: { type: 'array', items: { type: 'string', default: 'x' } } } },
        };
        const list: unknown[] = ['a', 'b', 'c'];
        const rows = [{ list }];
        fill(context, rows, {}, lists);
        Reflect.deleteProperty(list, 0);
        Reflect.deleteProperty(list, 2);
        const holed = fill(context, rows, {}, lists) as { list: unknown[] }[];
        expect(0 in holed[0].list).toBe(false);
        expect(fill(context, rows, {}, lists)).toStrictEqual(holed);
        list[0] = undefined;
        const filled = fill(context, rows, {}, lists) as { list: unknown[] }[];
        expect(filled[0].list[0]).toBe('x');
        expect(2 in filled[0].list).toBe(false);
        // And back to a hole, which the item holding `undefined` is not
        Reflect.deleteProperty(list, 0);
        expect(fill(context, rows, {}, lists)).toStrictEqual(holed);
      });
      it('hands back the keys of an object in the order its data holds them, once they change places in place', () => {
        const frees: RJSFSchema = {
          type: 'array',
          items: { type: 'object', properties: { free: { type: 'object', additionalProperties: { type: 'string' } } } },
        };
        const keysAfterSwap = (context: SchemaContext) => {
          const free: Record<string, string> = { x: '1', y: '2' };
          const rows = [{ free }];
          fill(context, rows, {}, frees);
          Reflect.deleteProperty(free, 'x');
          free.x = '1';
          const swapped = fill(context, rows, {}, frees) as { free: object }[];
          return Object.keys(swapped[0].free);
        };
        expect(keysAfterSwap({ validator: miniValidator() })).toEqual(['y', 'x']);
        expect(keysAfterSwap(reusing(miniValidator()))).toEqual(['y', 'x']);
      });
      it('is folded on every call while it holds another kind of object, which could change in place unseen', () => {
        const validator = miniValidator();
        const context = reusing(validator);
        const rows = [{ ...rowOf(), held: new Map() }, rowOf(), { ...rowOf(), nested: { deep: [new Set()] } }];
        fill(context, rows, {}, values);
        const first = validator.calls;
        fill(context, rows, {}, values);
        const again = validator.calls - first;
        expect(again).toBeGreaterThan(0);
        // The row holding none is reused, so a call folds fewer rows than the first did
        expect(again).toBeLessThan(first);
      });
    });
    it('folds only the row a list grows by in place, and none for a key the object holding the list gains', () => {
      const validator = miniValidator();
      const context = reusing(validator);
      const holder: RJSFSchema = {
        type: 'object',
        properties: { group: { type: 'object', properties: { rows: list } } },
      };
      const group: { rows: object[]; note?: string } = { rows: rowsOf(20) };
      fill(context, { group }, {}, holder);
      let before = validator.calls;
      group.rows.push({ k: 'k20' });
      fill(context, { group }, {}, holder);
      expect(validator.calls - before).toBe(1);
      before = validator.calls;
      group.note = 'n';
      fill(context, { group }, {}, holder);
      expect(validator.calls).toBe(before);
    });
    it('folds a row changed in place again', () => {
      const validator = miniValidator();
      const context = reusing(validator);
      const rows = rowsOf(5);
      fill(context, rows);
      rows[1].k = 'k9';
      expect(fill(context, rows)).toEqual([{ k: 'k0' }, { k: 'k9' }, { k: 'k2' }, { k: 'k3' }, { k: 'k4' }]);
    });
    it('folds each row again under other global options, and one holding a `null` fill on every call', () => {
      const validator = miniValidator();
      const context = reusing(validator);
      const nulls: RJSFSchema = { type: 'array', items: { ...row, properties: { k: {}, n: { type: 'null' } } } };
      const rows = [
        { k: 'k0', n: undefined },
        { k: 'k1', n: null },
      ];
      fill(context, rows, {}, nulls);
      const first = validator.calls;
      expect(fill(context, rows, {}, nulls)).toEqual([
        { k: 'k0', n: null },
        { k: 'k1', n: null, t: 'd' },
      ]);
      const again = validator.calls - first;
      expect(again).toBeGreaterThan(0);
      const uiSchema = { 'ui:globalOptions': { enableOptionalDataFieldForType: ['object'] } };
      fill(context, rows, { uiSchema }, nulls);
      expect(validator.calls - first - again).toBeGreaterThan(again);
    });
    it("folds a row offering options again, as the option it shows is the form's to say", () => {
      const validator = miniValidator();
      const context = reusing(validator);
      const offering: RJSFSchema = {
        type: 'array',
        items: {
          type: 'object',
          oneOf: [
            { title: 'A', properties: { a: { type: 'string', default: 'a' } } },
            { title: 'B', properties: { b: { type: 'string', default: 'b' } } },
          ],
        },
      };
      const selectedOption = vi.fn(() => 1);
      // A state of a class holding private fields, which its methods read only when called on the state itself
      class State {
        #selectedOption = selectedOption;
        selectedOption() {
          return this.#selectedOption();
        }
        isExpanded() {
          return this.#selectedOption !== undefined;
        }
      }
      const fieldState = new State();
      const props = { schema: offering, rootSchema: offering, formData: [{}], fieldState };
      expect(getDefaultFormState(context, props)).toEqual([{ b: 'b' }]);
      selectedOption.mockReturnValue(0);
      expect(getDefaultFormState(context, props)).toEqual([{ a: 'a' }]);
      // Without a `fieldState` the data picks the option, which a call with one is not answered with
      const formData = [{}];
      expect(getDefaultFormState(context, { ...props, formData, fieldState: undefined })).toEqual([{ a: 'a' }]);
      selectedOption.mockReturnValue(1);
      expect(getDefaultFormState(context, { ...props, formData })).toEqual([{ b: 'b' }]);
    });
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
