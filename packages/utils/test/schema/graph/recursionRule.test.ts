import type { RJSFSchema } from '../../../src/index.ts';
import buildPlan from '../../../src/schema/graph/mergePlan.ts';
import type { MergePlan, Seed } from '../../../src/schema/graph/mergePlan.ts';
import parseSchemaGraph from '../../../src/schema/graph/parseSchemaGraph.ts';
import type { NodeId } from '../../../src/schema/graph/parseSchemaGraph.ts';
import { extendChain } from '../../../src/schema/graph/provenance.ts';
import {
  childField,
  collapseReason,
  count2Hit,
  firstEnteredRefHit,
  optionSeeds,
  ownRefTargets,
  restartSeeds,
  settleField,
} from '../../../src/schema/graph/recursionRule.ts';
import { miniValidator } from './miniValidator.ts';
import { createWalker } from './walk.ts';

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

  describe('collapseReason()', () => {
    const recursive = plan([{ node: child, refPath: [pl] }]);
    const twice = plan([{ node: at('/definitions/toMixin'), refPath: [pl, pl] }]);
    const fresh = plan([{ node: child, refPath: [] }]);
    const chain = extendChain(graph, undefined, fresh.setKey);

    it('never collapses the call root', () => {
      expect(collapseReason(graph, recursive, { edge: 'root', view: 'defaults', chain })).toBeUndefined();
    });
    it('applies the ref-path checks to object properties in render, and to every edge in defaults', () => {
      expect(collapseReason(graph, recursive, { edge: 'property', view: 'render' })).toBe('firstEntered');
      expect(collapseReason(graph, recursive, { edge: 'item', view: 'render' })).toBeUndefined();
      expect(collapseReason(graph, recursive, { edge: 'item', view: 'defaults' })).toBe('firstEntered');
      expect(firstEnteredRefHit(graph, twice)).toBe(false);
      expect(collapseReason(graph, twice, { edge: 'additionalKey', view: 'defaults' })).toBe('count2');
    });
    it('applies the set-equality guard to every field but one the data drives in render', () => {
      expect(collapseReason(graph, fresh, { edge: 'property', view: 'render', chain })).toBe('guard');
      expect(collapseReason(graph, fresh, { edge: 'item', view: 'render', chain, dataDriven: true })).toBeUndefined();
      expect(collapseReason(graph, fresh, { edge: 'item', view: 'defaults', chain, dataDriven: true })).toBe('guard');
      expect(collapseReason(graph, fresh, { edge: 'property', view: 'render' })).toBeUndefined();
    });
  });

  describe('seeds', () => {
    it('restarts ref paths, for an expansion and for a selected option', () => {
      expect(restartSeeds([{ node: child, refPath: [pl, pl] }])).toEqual([{ node: child, refPath: [] }]);
      expect(optionSeeds([{ node: child, refPath: [pl] }], pl)).toEqual([
        { node: child, refPath: [pl] },
        { node: pl, refPath: [] },
      ]);
    });
  });

  describe('childField()', () => {
    const parent = { plan: fresh(), chain: extendChain(graph, undefined, 'ancestor') };
    function fresh(): MergePlan {
      return plan([{ node: pl, refPath: [] }]);
    }
    const seeds = [{ node: child, refPath: [pl] }];

    it('extends the chain with the parent set for a property, and for every child in defaults', () => {
      const field = childField(graph, parent, { seeds, edge: 'property', inData: true }, 'render');
      expect(field).toEqual({ seeds, chain: extendChain(graph, parent.chain, parent.plan.setKey), dataDriven: false });
      expect(childField(graph, parent, { seeds, edge: 'additionalKey', inData: true }, 'defaults').dataDriven).toBe(
        false,
      );
      expect(childField(graph, parent, { seeds, edge: 'additionalKey', inData: false }, 'render').chain).toBeDefined();
    });
    it('restarts the chain of a child the data drives in render, and the ref path of a key the data holds', () => {
      expect(childField(graph, parent, { seeds, edge: 'item', inData: true }, 'render')).toEqual({
        seeds,
        dataDriven: true,
      });
      expect(childField(graph, parent, { seeds, edge: 'patternKey', inData: true }, 'render')).toEqual({
        seeds: [{ node: child, refPath: [] }],
        dataDriven: true,
      });
      expect(childField(graph, parent, { seeds, edge: 'additionalKey', inData: true }, 'render').seeds).toEqual([
        { node: child, refPath: [] },
      ]);
    });
  });

  describe('settleField()', () => {
    const recursive = { seeds: [{ node: child, refPath: [pl] }], dataDriven: false };

    it('plans a field that does not collapse', () => {
      const settled = settleField(
        graph,
        { ...recursive, seeds: [{ node: child, refPath: [] }] },
        { edge: 'property', view: 'render' },
        false,
        plan,
      );
      expect(settled).toMatchObject({ collapsed: false, expanded: false, seeds: [{ node: child, refPath: [] }] });
    });
    it('reports a collapse that may not expand, with the plan of the field', () => {
      const settled = settleField(graph, recursive, { edge: 'property', view: 'render' }, false, plan);
      expect(settled).toEqual({ collapsed: true, plan: plan(recursive.seeds), reason: 'firstEntered' });
    });
    it('expands a collapse once, restarting its ref paths and its chain (I2)', () => {
      const chain = extendChain(graph, undefined, 'x');
      const settled = settleField(graph, { ...recursive, chain }, { edge: 'property', view: 'render' }, true, plan);
      expect(settled).toEqual({
        collapsed: false,
        plan: plan([{ node: child, refPath: [] }]),
        seeds: [{ node: child, refPath: [] }],
        expanded: true,
      });
    });
  });

  describe('on the RFC worked examples', () => {
    const render = (root: RJSFSchema, expanded: string[] = [], data?: unknown) =>
      createWalker(root, false, { validator: miniValidator() }).render(data, { expanded: new Set(expanded) });

    it('collapses pl under its own $ref at root_child, and an Expand click reveals one level', () => {
      expect(render(schema)).toEqual({ inputs: ['root_a'], buttons: ['root_child-button'] });
      expect(render(schema, ['root_child'])).toEqual({
        inputs: ['root_a', 'root_child_a'],
        buttons: ['root_child_child-button'],
      });
    });
    it("collapses {$ref: '#'} under a root not reached through a $ref one level later, one level per click", () => {
      const root: RJSFSchema = { type: 'object', properties: { name: { type: 'string' }, child: { $ref: '#' } } };
      expect(render(root).buttons).toEqual(['root_child_child-button']);
      expect(render(root, ['root_child_child']).buttons).toEqual(['root_child_child_child-button']);
    });
    it('expands the node shared by A/B/C at root_x_b and collapses it at root_y_a2_b', () => {
      const root: RJSFSchema = {
        definitions: {
          A: { type: 'object', properties: { a: { type: 'string' }, b: { $ref: D('B') } } },
          B: { type: 'object', properties: { c: { type: 'string' }, a2: { $ref: D('A') } } },
          C: { type: 'object', properties: { x: { $ref: D('A') }, y: { $ref: D('B') } } },
        },
        $ref: D('C'),
      };
      expect(render(root).buttons).toEqual(['root_x_b_a2-button', 'root_y_a2_b-button']);
    });
    it('renders a self-referencing option as the selector alone, and the other option once selected', () => {
      const root: RJSFSchema = {
        definitions: {
          node: { anyOf: [{ $ref: D('node') }, { type: 'object', properties: { x: { type: 'string' } } }] },
        },
        $ref: D('node'),
      };
      const walker = createWalker(root, false, { validator: miniValidator() });
      expect(walker.render(undefined, { forcedOption: 0 })).toEqual({ inputs: [], buttons: [] });
      expect(walker.render(undefined, { forcedOption: 1 })).toEqual({ inputs: ['root_x'], buttons: [] });
    });
  });
});
