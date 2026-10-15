import type { RJSFSchema } from '../../../src/index.ts';
import buildPlan from '../../../src/schema/graph/mergePlan.ts';
import type { MergePlan, Seed } from '../../../src/schema/graph/mergePlan.ts';
import parseSchemaGraph from '../../../src/schema/graph/parseSchemaGraph.ts';
import type { NodeId } from '../../../src/schema/graph/parseSchemaGraph.ts';
import { extendChain } from '../../../src/schema/graph/provenance.ts';
import {
  childField,
  collapses,
  count2Hit,
  firstEnteredRefHit,
  ownRefTargets,
  restartSeeds,
} from '../../../src/schema/graph/recursionRule.ts';
import { miniValidator } from './miniValidator.ts';

const D = (name: string) => `#/definitions/${name}`;

const schema: RJSFSchema = {
  definitions: {
    pl: { type: 'object', properties: { a: { type: 'string' }, child: { $ref: D('pl') } } },
    alias: { $ref: D('aliased') },
    aliased: { $ref: D('pl'), title: 'not pure' },
    loop: { $ref: D('loop') },
    yes: true,
    toBoolean: { $ref: D('yes') },
    mixin: { allOf: [{ $ref: D('pl') }] },
    toMixin: { $ref: D('mixin') },
  },
  $ref: D('pl'),
};
const graph = parseSchemaGraph(schema);
const context = { validator: miniValidator() };
const at = (pointer: string): NodeId => graph.byPointer(pointer) ?? -1;
const plan = (seeds: readonly Seed[]): MergePlan => buildPlan({ context, graph, seeds });
const pl = at('/definitions/pl');
const child = at('/definitions/pl/properties/child');

describe('the recursion rule', () => {
  describe('ownRefTargets()', () => {
    it('follows a containment node through its pure aliases, and stops at a target that is not one', () => {
      expect(ownRefTargets(graph, at('/definitions/pl'))).toEqual([]);
      expect(ownRefTargets(graph, child)).toEqual([pl]);
      expect(ownRefTargets(graph, at('/definitions/alias'))).toEqual([at('/definitions/aliased'), pl]);
      expect(ownRefTargets(graph, at('/definitions/toBoolean'))).toEqual([at('/definitions/yes')]);
      const [invalid] = ownRefTargets(graph, at('/definitions/loop'));
      expect(graph.node(invalid).kind).toBe('invalid');
    });
  });

  describe('firstEnteredRefHit()', () => {
    it("fires when a seed's own $ref is already on that seed's ref path", () => {
      expect(firstEnteredRefHit(graph, plan([{ node: child, refPath: [pl] }]))).toBe(true);
      expect(firstEnteredRefHit(graph, plan([{ node: child, refPath: [] }]))).toBe(false);
      expect(
        firstEnteredRefHit(
          graph,
          plan([
            { node: child, refPath: [] },
            { node: child, refPath: [pl] },
          ]),
        ),
      ).toBe(true);
    });
    it('checks the first $ref the plan enters through any edge when no seed has a $ref of its own', () => {
      const mixin = at('/definitions/mixin');
      expect(firstEnteredRefHit(graph, plan([{ node: mixin, refPath: [pl] }]))).toBe(true);
      expect(firstEnteredRefHit(graph, plan([{ node: mixin, refPath: [] }]))).toBe(false);
      expect(firstEnteredRefHit(graph, plan([{ node: pl, refPath: [pl] }]))).toBe(false);
    });
  });

  describe('count2Hit()', () => {
    it('fires when a $ref enters a target already twice on its ref path', () => {
      expect(count2Hit(plan([{ node: child, refPath: [pl, pl] }]))).toBe(true);
      expect(count2Hit(plan([{ node: child, refPath: [pl] }]))).toBe(false);
    });
  });

  describe('collapses()', () => {
    const recursive = plan([{ node: child, refPath: [pl] }]);
    const twice = plan([{ node: at('/definitions/toMixin'), refPath: [pl, pl] }]);
    const fresh = plan([{ node: child, refPath: [] }]);
    const chain = extendChain(graph, undefined, fresh.setKey);

    it('never collapses the call root', () => {
      expect(collapses(graph, recursive, { edge: 'root', view: 'defaults', chain })).toBe(false);
    });
    it('applies the ref-path checks to object properties in render, and to every edge in defaults', () => {
      expect(firstEnteredRefHit(graph, recursive)).toBe(true);
      expect(collapses(graph, recursive, { edge: 'property', view: 'render' })).toBe(true);
      expect(collapses(graph, recursive, { edge: 'item', view: 'render' })).toBe(false);
      expect(collapses(graph, recursive, { edge: 'item', view: 'defaults' })).toBe(true);
      expect(firstEnteredRefHit(graph, twice)).toBe(false);
      expect(count2Hit(twice)).toBe(true);
      expect(collapses(graph, twice, { edge: 'additionalKey', view: 'defaults' })).toBe(true);
    });
    it('applies the set-equality guard where a chain is given, but not to a field the data drives', () => {
      expect(firstEnteredRefHit(graph, fresh) || count2Hit(fresh)).toBe(false);
      expect(collapses(graph, fresh, { edge: 'property', view: 'render', chain })).toBe(true);
      expect(collapses(graph, fresh, { edge: 'item', view: 'render', chain, dataDriven: true })).toBe(false);
      expect(collapses(graph, fresh, { edge: 'item', view: 'defaults', chain })).toBe(true);
      expect(collapses(graph, fresh, { edge: 'property', view: 'render' })).toBe(false);
    });
  });

  describe('seeds', () => {
    it('restarts ref paths, for an expansion', () => {
      expect(restartSeeds([{ node: child, refPath: [pl, pl] }])).toEqual([{ node: child, refPath: [] }]);
    });
  });

  describe('childField()', () => {
    const parent = { plan: fresh(), chain: extendChain(graph, undefined, 'ancestor') };
    function fresh(): MergePlan {
      return plan([{ node: pl, refPath: [] }]);
    }
    const seeds = [{ node: child, refPath: [pl] }];

    it('extends the chain with the parent set for a property, and for a child the data does not hold', () => {
      const field = childField(graph, parent, { seeds, edge: 'property', inData: true });
      expect(field).toEqual({ seeds, chain: extendChain(graph, parent.chain, parent.plan.setKey), dataDriven: false });
      expect(childField(graph, parent, { seeds, edge: 'additionalKey', inData: false })).toEqual({
        seeds,
        chain: extendChain(graph, parent.chain, parent.plan.setKey),
        dataDriven: false,
      });
    });
    it('restarts the chain and the ref path of a child the data drives', () => {
      expect(childField(graph, parent, { seeds, edge: 'item', inData: true })).toEqual({
        seeds: [{ node: child, refPath: [] }],
        dataDriven: true,
      });
      expect(childField(graph, parent, { seeds, edge: 'patternKey', inData: true })).toEqual({
        seeds: [{ node: child, refPath: [] }],
        dataDriven: true,
      });
      expect(childField(graph, parent, { seeds, edge: 'additionalKey', inData: true }).seeds).toEqual([
        { node: child, refPath: [] },
      ]);
    });
  });
});
