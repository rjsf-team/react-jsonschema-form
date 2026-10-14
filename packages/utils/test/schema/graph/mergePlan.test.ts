import type { JSONSchema7Definition } from 'json-schema';

import { ADDITIONAL_PROPERTY_FLAG, RJSF_REF_KEY } from '../../../src/index.ts';
import type { RJSFSchema, SchemaContext } from '../../../src/index.ts';
import buildPlan, { childSeeds, itemSeeds } from '../../../src/schema/graph/mergePlan.ts';
import type { MergePlan, PlanPolicy, Seed } from '../../../src/schema/graph/mergePlan.ts';
import parseSchemaGraph from '../../../src/schema/graph/parseSchemaGraph.ts';
import type { SchemaGraph } from '../../../src/schema/graph/parseSchemaGraph.ts';
import looseSchema from './looseSchema.ts';
import { miniValidator } from './miniValidator.ts';

interface Options {
  readonly data?: unknown;
  readonly depData?: unknown;
  readonly policy?: PlanPolicy;
  readonly context?: SchemaContext;
  readonly seeds?: (graph: SchemaGraph) => Seed[];
}

function planOf(schema: RJSFSchema, options: Options = {}): MergePlan {
  const graph = parseSchemaGraph(schema);
  return buildPlan({
    context: options.context ?? { validator: miniValidator() },
    graph,
    seeds: options.seeds?.(graph) ?? [{ node: graph.root, refPath: [] }],
    data: options.data,
    depData: options.depData,
    policy: options.policy,
  });
}

/** The plan entries as [pointer, edge, ref path as pointers] */
function entriesOf(plan: MergePlan): [string, string, string[]][] {
  const pointer = (id: number) => plan.graph.node(id).pointer;
  return plan.entries.map(({ node, edge, refPath }) => [pointer(node), edge, refPath.map(pointer)]);
}

/** The seeds as [pointer, ref path as pointers] */
function seedsOf(plan: MergePlan, seeds: readonly Seed[]): [string, string[]][] {
  const pointer = (id: number) => plan.graph.node(id).pointer;
  return seeds.map(({ node, refPath }) => [pointer(node), refPath.map(pointer)]);
}

const D = (name: string) => `#/definitions/${name}`;

/** The merged schema's keywords, less the `definitions` a root carries along and the marker symbols */
function keywordsOf(plan: MergePlan): unknown {
  const { definitions, ...keywords } = plan.schema;
  return JSON.parse(JSON.stringify(keywords));
}

describe('buildPlan()', () => {
  describe('$ref', () => {
    it('overrides the target keyword by keyword with the siblings, as v7 resolves a $ref with siblings', () => {
      const plan = planOf({
        definitions: { A: { type: 'object', title: 'A', properties: { x: { type: 'string' } } } },
        $ref: D('A'),
        title: 'own',
      });
      expect(keywordsOf(plan)).toEqual({ type: 'object', title: 'own', properties: { x: { type: 'string' } } });
      expect(Object.keys(plan.schema)).toEqual(['type', 'title', 'properties', 'definitions']);
      expect(Reflect.get(plan.schema, RJSF_REF_KEY)).toBe(D('A'));
      expect(entriesOf(plan)).toEqual([
        ['', 'seed', []],
        ['/definitions/A', 'ref', ['/definitions/A']],
      ]);
      expect(seedsOf(plan, plan.children.properties.get('x') ?? [])).toEqual([
        ['/definitions/A/properties/x', ['/definitions/A']],
      ]);
    });
    it('flattens an alias chain, extending the ref path at every target', () => {
      const plan = planOf({
        definitions: { B: { $ref: D('C'), description: 'B' }, C: { type: 'string', description: 'C' } },
        $ref: D('B'),
      });
      expect(keywordsOf(plan)).toEqual({ type: 'string', description: 'B' });
      expect(entriesOf(plan)).toEqual([
        ['', 'seed', []],
        ['/definitions/B', 'ref', ['/definitions/B']],
        ['/definitions/C', 'ref', ['/definitions/B', '/definitions/C']],
      ]);
    });
    it('throws the error findSchemaDefinition() throws for a $ref that resolves to nothing', () => {
      expect(() => planOf({ $ref: D('missing') })).toThrow('Could not find a definition for #/definitions/missing.');
      expect(() => planOf({ definitions: { a: { $ref: D('a') } }, $ref: D('a') })).toThrow(
        'Definition for #/definitions/a is a circular reference',
      );
    });
    it('reads a boolean target as no keywords, as v7 spreads it', () => {
      expect(keywordsOf(planOf({ definitions: { f: false }, $ref: D('f'), title: 't' }))).toEqual({ title: 't' });
    });
    it('enters a target already in the plan only once, leaving no literal $ref', () => {
      const plan = planOf({
        definitions: { Pet: { type: 'object', allOf: [{ $ref: D('Pet') }], properties: { name: { type: 'string' } } } },
        $ref: D('Pet'),
      });
      expect(keywordsOf(plan)).toEqual({ type: 'object', properties: { name: { type: 'string' } } });
      expect(entriesOf(plan)).toEqual([
        ['', 'seed', []],
        ['/definitions/Pet', 'ref', ['/definitions/Pet']],
        ['/definitions/Pet/allOf/0', 'allOf', ['/definitions/Pet']],
      ]);
      expect(JSON.stringify(keywordsOf(plan))).not.toContain('$ref');
    });
  });

  describe('boolean seeds', () => {
    it('reads true as the empty schema and false as one nothing satisfies', () => {
      expect(
        keywordsOf(
          planOf(
            { properties: { t: true } },
            { seeds: (graph) => [{ node: graph.byPointer('/properties/t') ?? -1, refPath: [] }] },
          ),
        ),
      ).toEqual({});
      expect(
        keywordsOf(
          planOf(
            { properties: { f: false } },
            { seeds: (graph) => [{ node: graph.byPointer('/properties/f') ?? -1, refPath: [] }] },
          ),
        ),
      ).toEqual({ not: {} });
    });
  });

  describe('allOf', () => {
    const schema: RJSFSchema = {
      definitions: { A: { properties: { a: { type: 'string' } } } },
      type: 'object',
      allOf: [{ $ref: D('A') }, { $ref: '#/definitions/%41' }, { required: ['a'] }],
    };

    it('merges the entries, first wins, and an entry naming a node already in the plan adds nothing', () => {
      const plan = planOf(schema);
      expect(keywordsOf(plan)).toEqual({ type: 'object', properties: { a: { type: 'string' } }, required: ['a'] });
      expect(entriesOf(plan)).toEqual([
        ['', 'seed', []],
        ['/allOf/0', 'allOf', []],
        ['/definitions/A', 'ref', ['/definitions/A']],
        ['/allOf/1', 'allOf', []],
        ['/allOf/2', 'allOf', []],
      ]);
      expect(plan.setKey).toBe([...plan.set].sort((a, b) => a - b).join(','));
    });
    it('drops an allOf that is not a list', () => {
      const plan = planOf(looseSchema({ allOf: { title: 'not a list' }, title: 't' }));
      expect(keywordsOf(plan)).toEqual({ title: 't' });
      expect(plan.entries).toHaveLength(1);
    });
    it('leaves the allOf unmerged when the policy merges none', () => {
      const plan = planOf(schema, { policy: { allOf: false } });
      expect(plan.schema.allOf).toBe(schema.allOf);
      expect(plan.entries).toHaveLength(1);
    });
    it("merges a seed's allOf under the 'if' policy only when the seed has an if", () => {
      expect(planOf(schema, { policy: { allOf: 'if' } }).schema.allOf).toBe(schema.allOf);
      const withIf = planOf({ ...schema, if: true }, { policy: { allOf: 'if' } });
      expect(withIf.schema.allOf).toBeUndefined();
      expect(withIf.schema.required).toEqual(['a']);
    });
    it('passes the merge to customMergeAllOf when the context has one', () => {
      const customMergeAllOf = vi.fn((merged: RJSFSchema): RJSFSchema => ({ title: `${merged.allOf?.length} merged` }));
      const plan = planOf(schema, { context: { validator: miniValidator(), customMergeAllOf } });
      // The entry naming a target already entered still joins, with no keywords of its own
      expect(keywordsOf(plan)).toEqual({ title: '3 merged' });
    });
    it('drops an allOf that cannot be merged, and says so once', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const plan = planOf({ type: 'string', allOf: [{ type: 'number' }], title: 'unmergeable' });
      expect(keywordsOf(plan)).toEqual({ type: 'string', title: 'unmergeable' });
      expect(warn).toHaveBeenCalledWith('could not merge subschemas in allOf:\n', expect.any(Error));
      warn.mockRestore();
    });
    it("re-applies the symbols the merge drops, the field's own before its entries'", () => {
      const flagged: RJSFSchema = { title: 'flagged', [ADDITIONAL_PROPERTY_FLAG]: true };
      const plan = planOf({
        definitions: { A: { allOf: [flagged, { $ref: D('B') }] }, B: { type: 'string' } },
        $ref: D('A'),
      });
      expect(Reflect.get(plan.schema, ADDITIONAL_PROPERTY_FLAG)).toBe(true);
      expect(Reflect.get(plan.schema, RJSF_REF_KEY)).toBe(D('A'));
    });
    it('reads a merge with a false entry as the empty schema', () => {
      const customMergeAllOf = (merged: RJSFSchema): RJSFSchema => merged;
      expect(
        keywordsOf(planOf({ allOf: [false] }, { context: { validator: miniValidator(), customMergeAllOf } })),
      ).toEqual({
        allOf: [{ not: {} }],
      });
      expect(keywordsOf(planOf({ allOf: [false] }))).toEqual({ not: {} });
    });
  });

  describe('if, then and else', () => {
    const schema: RJSFSchema = {
      definitions: { T: { properties: { t: { type: 'string' } } } },
      type: 'object',
      properties: { a: { type: 'string' } },
      if: { properties: { a: { const: 'x' } }, required: ['a'] },
      then: { $ref: D('T') },
      else: { properties: { e: { type: 'string' } } },
    };

    it('merges then when the data satisfies the if, with the branch keywords winning', () => {
      const plan = planOf(schema, { data: { a: 'x' } });
      expect(keywordsOf(plan)).toEqual({
        type: 'object',
        properties: { a: { type: 'string' }, t: { type: 'string' } },
      });
      expect(entriesOf(plan).map(([pointer, edge]) => [pointer, edge])).toEqual([
        ['', 'seed'],
        ['/then', 'then'],
        ['/definitions/T', 'ref'],
      ]);
      expect([...plan.children.properties.keys()]).toEqual(['t', 'a']);
    });
    it('merges else otherwise, checking {} for no data', () => {
      const validator = miniValidator();
      const isValid = vi.spyOn(validator, 'isValid');
      const plan = planOf(schema, { context: { validator } });
      expect(plan.schema.properties).toEqual({ a: { type: 'string' }, e: { type: 'string' } });
      expect(isValid).toHaveBeenCalledWith(schema.if, {}, schema);
    });
    it("keeps the field's own RJSF_REF_KEY over a branch's", () => {
      const plan = planOf({
        definitions: { S: { if: true, then: { $ref: D('T') } }, T: { title: 'T' } },
        $ref: D('S'),
      });
      expect(keywordsOf(plan)).toEqual({ title: 'T' });
      expect(Reflect.get(plan.schema, RJSF_REF_KEY)).toBe(D('S'));
    });
    it('takes a branch the field does not override from the node providing it', () => {
      const plan = planOf({
        definitions: { S: { if: false, else: { title: 'from the target' } } },
        $ref: D('S'),
        then: { title: 'beside the $ref' },
      });
      expect(keywordsOf(plan)).toEqual({ title: 'from the target' });
    });
    it('drops the conditional keywords when there is no branch to take or the if is not a schema', () => {
      expect(keywordsOf(planOf({ if: true, else: { title: 'e' } }))).toEqual({});
      expect(keywordsOf(planOf(looseSchema({ if: true, then: 'garbage', title: 't' })))).toEqual({ title: 't' });
      expect(keywordsOf(planOf({ if: false, title: 'no else' }))).toEqual({ title: 'no else' });
      expect(keywordsOf(planOf(looseSchema({ if: 'garbage', then: { title: 't' } })))).toEqual({});
      expect(keywordsOf(planOf({ then: { title: 'no if' } }))).toEqual({ then: { title: 'no if' } });
    });
    it('checks a condition once per node and data', () => {
      const validator = miniValidator();
      const data = { a: 'x' };
      const graph = parseSchemaGraph(schema);
      const seeds = [{ node: graph.root, refPath: [] }];
      buildPlan({ context: { validator }, graph, seeds, data });
      buildPlan({ context: { validator }, graph, seeds, data, policy: { allOf: false } });
      expect(validator.calls).toBe(1);
      buildPlan({ context: { validator }, graph, seeds, data: { a: 'x' } });
      expect(validator.calls).toBe(2);
    });
  });

  describe('dependencies', () => {
    it('adds the names of an array dependency to required once its key has data', () => {
      const schema: RJSFSchema = { properties: { a: {}, b: {} }, required: ['b'], dependencies: { a: ['b', 'c'] } };
      expect(planOf(schema, { data: { a: 1 } }).schema.required).toEqual(['b', 'c']);
      expect(planOf({ ...schema, required: undefined }, { data: { a: 1 } }).schema.required).toEqual(['b', 'c']);
      expect(planOf(schema, { data: {} }).schema.required).toEqual(['b']);
      expect(planOf(schema).schema).not.toHaveProperty('dependencies');
    });
    it('merges a schema dependency judged on the dependency data, defaulting to the data', () => {
      const schema: RJSFSchema = {
        properties: { a: { type: 'string' } },
        dependencies: { a: { properties: { extra: { type: 'string' } } } },
      };
      expect(planOf(schema, { data: { a: 'v' } }).schema.properties).toHaveProperty('extra');
      expect(planOf(schema, { data: {}, depData: { a: 'default' } }).schema.properties).toHaveProperty('extra');
      expect(planOf(schema, { data: {} }).schema.properties).not.toHaveProperty('extra');
    });
    it('qualifies a dependency on the properties its declaring node declares, not the merged ones', () => {
      const schema: RJSFSchema = {
        definitions: { D: { properties: { z: {} }, dependencies: { a: { title: 'applied' } } } },
        $ref: D('D'),
        properties: { a: {} },
      };
      expect(planOf(schema, { data: { a: 1 } }).schema.title).toBeUndefined();
      expect(planOf({ dependencies: { a: { title: 'applied' } } }, { data: { a: 1 } }).schema.title).toBe('applied');
    });
    it('drops dependencies that are not a map', () => {
      expect(keywordsOf(planOf(looseSchema({ dependencies: 5, title: 't' }), { data: { a: 1 } }))).toEqual({
        title: 't',
      });
    });
    it('adds nothing for a dependency already in the plan', () => {
      const shared: RJSFSchema = { title: 'shared' };
      const plan = planOf({ allOf: [shared], dependencies: { a: shared } }, { data: { a: 1 } });
      expect(plan.entries.filter(({ edge }) => edge === 'dependency')).toEqual([]);
    });

    describe('with a oneOf', () => {
      const options: JSONSchema7Definition[] = [
        { properties: { kind: { const: 'a' }, forA: { type: 'string' } } },
        { properties: { kind: { const: 'b' }, forB: { type: 'string' } } },
        { properties: { kind: { const: 'b' } } },
        { $ref: D('refOption') },
        { title: 'no properties' },
        { properties: { other: {} } },
        { properties: { kind: true, forAnything: {} } },
        true,
      ];
      const withOptions = (oneOf: JSONSchema7Definition[]): RJSFSchema => ({
        definitions: { refOption: { properties: { kind: { const: 'ref' }, viaRef: { type: 'string' } } } },
        properties: { kind: { type: 'string' } },
        dependencies: { kind: { oneOf } },
      });
      const schema = withOptions(options);

      it('merges the one option the data satisfies, less the dependency key', () => {
        const plan = planOf(withOptions(options.slice(0, 6)), { data: { kind: 'a' } });
        expect(keywordsOf(plan)).toEqual({ properties: { kind: { type: 'string' }, forA: { type: 'string' } } });
        expect(seedsOf(plan, plan.children.properties.get('kind') ?? [])).toEqual([['/properties/kind', []]]);
      });
      it('follows an option that is a $ref to its properties', () => {
        const plan = planOf(withOptions(options.slice(3, 4)), { data: { kind: 'ref' } });
        expect(plan.schema.properties).toEqual({ kind: { type: 'string' }, viaRef: { type: 'string' } });
      });
      it('merges none when no option or several are satisfied, and says so', () => {
        const log = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const several = planOf(schema, { data: { kind: 'b' } });
        expect(keywordsOf(several)).toEqual({ properties: { kind: { type: 'string' } } });
        const message =
          'ignoring oneOf in dependencies of "kind" because there isn\'t exactly one subschema that is valid';
        expect(log).toHaveBeenCalledWith(message);
        log.mockRestore();
      });
      it('reads a boolean condition property as a schema', () => {
        const plan = planOf(withOptions(options.slice(6, 7)), { data: { kind: 'anything' } });
        expect(plan.schema.properties).toHaveProperty('forAnything');
      });
      it('merges nothing for an option already in the plan', () => {
        const option: RJSFSchema = { properties: { kind: { const: 'a' }, forA: {} } };
        const plan = planOf({ allOf: [option], dependencies: { kind: { oneOf: [option] } } }, { data: { kind: 'a' } });
        expect(
          plan.entries.filter(({ edge }) => edge === 'dependency').map(({ node }) => plan.graph.node(node).pointer),
        ).toEqual(['/dependencies/kind']);
      });
      it('leaves a dependency whose oneOf is not a list as it is', () => {
        const plan = planOf(looseSchema({ dependencies: { kind: { oneOf: 'garbage', title: 't' } } }), {
          data: { kind: 'a' },
        });
        expect(keywordsOf(plan)).toEqual({ title: 't' });
      });
    });
  });

  describe('options', () => {
    const schema: RJSFSchema = {
      definitions: { O: { properties: { o: { $ref: D('O') } } } },
      type: 'object',
      anyOf: [{ title: 'first' }, { $ref: D('O') }],
      oneOf: [{ required: ['x'] }],
    };

    it('records each option list, and merges none without a selectOption', () => {
      const plan = planOf(schema);
      expect(plan.choices).toEqual([
        {
          keyword: 'anyOf',
          provider: plan.graph.root,
          options: [expect.any(Number), expect.any(Number)],
          selected: undefined,
        },
        { keyword: 'oneOf', provider: plan.graph.root, options: [expect.any(Number)], selected: undefined },
      ]);
      expect(plan.schema.anyOf).toBe(schema.anyOf);
    });
    it('merges the option selectOption chooses, its ref path restarted', () => {
      const selectOption = vi.fn(({ keyword }: { keyword: string }) => (keyword === 'anyOf' ? 1 : 0));
      const data = { x: 1 };
      const plan = planOf(schema, { data, policy: { allOf: true, selectOption } });
      expect(plan.schema.properties).toEqual({ o: { $ref: D('O') } });
      expect(plan.schema.required).toEqual(['x']);
      expect(entriesOf(plan).filter(([, edge]) => edge !== 'seed')).toEqual([
        ['/anyOf/1', 'option', []],
        ['/definitions/O', 'ref', ['/definitions/O']],
        ['/oneOf/0', 'option', []],
      ]);
      expect(selectOption).toHaveBeenCalledWith(expect.objectContaining({ keyword: 'anyOf', data, graph: plan.graph }));
      expect(plan.choices.map(({ selected }) => selected)).toEqual([1, 0]);
    });
    it('merges none for a choice out of range', () => {
      const plan = planOf(schema, { policy: { allOf: true, selectOption: () => 5 } });
      expect(plan.choices.map(({ selected }) => selected)).toEqual([undefined, undefined]);
      expect(planOf(schema, { policy: { allOf: true, selectOption: () => -1 } }).schema.required).toBeUndefined();
    });
    it('merges nothing for an option that is the field itself', () => {
      const plan = planOf(
        { definitions: { node: { anyOf: [{ $ref: D('node') }, { title: 'x' }] } }, $ref: D('node') },
        { policy: { allOf: true, selectOption: () => 0 } },
      );
      expect(entriesOf(plan).map(([pointer, edge]) => [pointer, edge])).toEqual([
        ['', 'seed'],
        ['/definitions/node', 'ref'],
        ['/definitions/node/anyOf/0', 'option'],
      ]);
      expect(keywordsOf(plan)).toEqual({ anyOf: [{ $ref: D('node') }, { title: 'x' }] });
    });
    it('skips an options keyword that is not a list', () => {
      expect(planOf(looseSchema({ anyOf: { title: 'not a list' } })).choices).toEqual([]);
    });
  });

  describe('seeds and children', () => {
    const schema = looseSchema({
      definitions: {
        first: {
          properties: { a: { title: 'first a' } },
          patternProperties: { '^p': { title: 'pattern' } },
          additionalProperties: { title: 'additional' },
          items: [{ title: 'tuple 0' }],
          additionalItems: { title: 'more' },
        },
        second: { properties: { a: { title: 'second a' }, b: {} }, prefixItems: [{}, {}], items: { title: 'items' } },
      },
    });
    const both = (graph: SchemaGraph): Seed[] => {
      const first = graph.byPointer('/definitions/first') ?? -1;
      const second = graph.byPointer('/definitions/second') ?? -1;
      return [
        { node: first, refPath: [first] },
        { node: second, refPath: [second] },
        { node: first, refPath: [first, first] },
      ];
    };

    it('conjoins several seeds in order, the first winning, and lists the seeds of each child in that order', () => {
      const plan = planOf(schema, { seeds: both });
      // The merge applies the first seed's additionalProperties to the property only the second declares
      expect(plan.schema.properties).toEqual({ a: { title: 'first a' }, b: { title: 'additional' } });
      expect(seedsOf(plan, plan.children.properties.get('a') ?? [])).toEqual([
        ['/definitions/first/properties/a', ['/definitions/first']],
        ['/definitions/second/properties/a', ['/definitions/second']],
      ]);
      expect(plan.children.prefixItems.map((seeds) => seedsOf(plan, seeds))).toEqual([
        [
          ['/definitions/first/items/0', ['/definitions/first']],
          ['/definitions/second/prefixItems/0', ['/definitions/second']],
        ],
        [['/definitions/second/prefixItems/1', ['/definitions/second']]],
      ]);
    });
    it('lists tuple seeds of a longer first seed after those of a shorter one', () => {
      const plan = planOf(schema, { seeds: (graph) => both(graph).slice(1, 3) });
      expect(plan.children.prefixItems.map((seeds) => seedsOf(plan, seeds))).toEqual([
        [
          ['/definitions/second/prefixItems/0', ['/definitions/second']],
          ['/definitions/first/items/0', ['/definitions/first', '/definitions/first']],
        ],
        [['/definitions/second/prefixItems/1', ['/definitions/second']]],
      ]);
    });
    it('plans no seeds as the empty schema', () => {
      const plan = planOf(schema, { seeds: () => [] });
      expect(keywordsOf(plan)).toEqual({});
      expect(plan.entries).toEqual([]);
      expect(plan.setKey).toBe('');
    });
    it('names the seeds of an object child: declared and matching patterns, patterns, or additional properties', () => {
      const plan = planOf(schema, { seeds: (graph) => both(graph).slice(0, 1) });
      const pointers = (key: string) => {
        const { seeds, edge } = childSeeds(plan, key);
        return [edge, seeds.map(({ node }) => plan.graph.node(node).pointer)];
      };
      expect(pointers('a')).toEqual(['property', ['/definitions/first/properties/a']]);
      expect(pointers('px')).toEqual(['patternKey', ['/definitions/first/patternProperties/^p']]);
      expect(pointers('other')).toEqual(['additionalKey', ['/definitions/first/additionalProperties']]);
      const declared = planOf({ properties: { pa: {} }, patternProperties: { '^p': {} } });
      expect(childSeeds(declared, 'pa').seeds).toHaveLength(2);
      expect(childSeeds(declared, 'zz')).toEqual({ seeds: [], edge: 'additionalKey' });
    });
    it('names the seeds of an array row: the tuple entry, then the items or additional items', () => {
      const first = planOf(schema, { seeds: (graph) => both(graph).slice(0, 1) });
      expect(itemSeeds(first, 0).edge).toBe('tupleItem');
      expect(first.graph.node(itemSeeds(first, 1).seeds[0].node).pointer).toBe('/definitions/first/additionalItems');
      const second = planOf(schema, { seeds: (graph) => both(graph).slice(1, 2) });
      expect(seedsOf(second, itemSeeds(second, 2).seeds)).toEqual([
        ['/definitions/second/items', ['/definitions/second']],
      ]);
      expect(itemSeeds(second, 2).edge).toBe('item');
    });
  });

  describe('memoization', () => {
    it('returns the same plan for the same graph, seeds, data, policy and context', () => {
      const context = { validator: miniValidator() };
      const graph = parseSchemaGraph({ type: 'object', if: true, then: { title: 't' } });
      const seeds = [{ node: graph.root, refPath: [] }];
      const data = {};
      const plan = buildPlan({ context, graph, seeds, data });
      expect(buildPlan({ context, graph, seeds: [{ node: graph.root, refPath: [] }], data })).toBe(plan);
      expect(buildPlan({ context, graph, seeds, data: {} })).not.toBe(plan);
      expect(buildPlan({ context, graph, seeds, data, policy: { allOf: false } })).not.toBe(plan);
      expect(buildPlan({ context: { validator: miniValidator() }, graph, seeds, data })).not.toBe(plan);
      expect(plan.graph).toBe(graph);
    });
  });
});
