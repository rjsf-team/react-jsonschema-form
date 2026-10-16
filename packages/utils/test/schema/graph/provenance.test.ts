import type { RJSFSchema } from '../../../src/index.ts';
import replaceEqualDeep from '../../../src/replaceEqualDeep.ts';
import parseSchemaGraph from '../../../src/schema/graph/parseSchemaGraph.ts';
import {
  childProvenance,
  extendChain,
  readProvenance,
  rootProvenance,
  stamp,
} from '../../../src/schema/graph/provenance.ts';

const root: RJSFSchema = {
  definitions: { node: { type: 'object', properties: { child: { $ref: '#/definitions/node' } } } },
  $ref: '#/definitions/node',
};
const graph = parseSchemaGraph(root);
const seeds = [{ node: graph.root, refPath: [] }];

describe('provenance', () => {
  it('interns equal provenances as one frozen object', () => {
    const first = rootProvenance(graph, seeds);
    expect(rootProvenance(graph, [{ node: graph.root, refPath: [] }])).toBe(first);
    expect(first).toEqual({
      id: expect.any(Number),
      graph,
      parent: undefined,
      seeds,
      chain: undefined,
    });
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.seeds)).toBe(true);
    expect(Object.isFrozen(first.seeds[0].refPath)).toBe(true);
  });
  it('tells provenances apart by parent, seeds, ref paths, chain and the options they are of', () => {
    const parent = rootProvenance(graph, seeds);
    const chain = extendChain(graph, undefined, '0,1');
    const child = { seeds: [{ node: 2, refPath: [1] }] };
    const optionOf = { setKey: '0', set: new Set([0]) };
    const variants = [
      childProvenance(parent, child),
      childProvenance(parent, { seeds: [{ node: 2, refPath: [1, 1] }] }),
      childProvenance(parent, { ...child, chain }),
      childProvenance(parent, { ...child, chain, optionOf }),
      rootProvenance(graph, child.seeds),
    ];
    expect(new Set(variants).size).toBe(variants.length);
    expect(childProvenance(parent, { ...child, chain, optionOf: { ...optionOf } })).toBe(variants[3]);
    expect(variants[0].parent).toBe(parent);
  });
  it('prints as its id, rather than as the graph it points into', () => {
    const provenance = rootProvenance(graph, seeds);
    expect(JSON.stringify(provenance)).toBe(`"provenance ${provenance.id}"`);
  });
  it('copies the seeds it is given', () => {
    const refPath = [1];
    const provenance = rootProvenance(graph, [{ node: 3, refPath }]);
    refPath.push(2);
    expect(provenance.seeds).toEqual([{ node: 3, refPath: [1] }]);
  });
  it('interns chains, which hold every set on them', () => {
    const first = extendChain(graph, undefined, 'a');
    const second = extendChain(graph, first, 'b');
    expect(extendChain(graph, first, 'b')).toBe(second);
    expect(second.parent).toBe(first);
    expect(second.setKey).toBe('b');
    expect([second.has('a'), second.has('b'), second.has('c'), first.has('b')]).toEqual([true, true, false, false]);
    expect(Object.isFrozen(second)).toBe(true);
  });
  it('stamps a copy, which a spread keeps and readProvenance() reads back', () => {
    const provenance = rootProvenance(graph, seeds);
    const schema: RJSFSchema = { type: 'string' };
    const stamped = stamp(schema, provenance);
    expect(stamped).not.toBe(schema);
    expect(Object.entries(stamped)).toEqual([['type', 'string']]);
    expect(readProvenance(stamped, graph)).toBe(provenance);
    expect(readProvenance({ ...stamped, title: 'copied' }, graph)).toBe(provenance);
    expect(Object.getOwnPropertySymbols(stamped)).toHaveLength(1);
  });
  it('reads nothing off an unstamped schema, a value that is not a schema, or a stamp from another root', () => {
    const otherGraph = parseSchemaGraph({ type: 'string' });
    const stamped = stamp({ type: 'string' }, rootProvenance(otherGraph, [{ node: otherGraph.root, refPath: [] }]));
    expect(readProvenance({ type: 'string' }, graph)).toBeUndefined();
    expect(readProvenance(undefined, graph)).toBeUndefined();
    expect(readProvenance(true, graph)).toBeUndefined();
    expect(readProvenance(stamped, graph)).toBeUndefined();
  });
  it('reads a stamp from a graph extending the root graph, but not the other way about', () => {
    const adopted = graph.adopt({ items: { $ref: '#/definitions/node' } });
    const provenance = rootProvenance(adopted.graph, [{ node: adopted.node, refPath: [] }]);
    const stamped = stamp({ type: 'array' }, provenance);
    expect(readProvenance(stamped, graph)).toBe(provenance);
    expect(readProvenance(stamped, adopted.graph)).toBe(provenance);
    const fromRoot = stamp({ type: 'object' }, rootProvenance(graph, seeds));
    expect(readProvenance(fromRoot, adopted.graph)).toBeUndefined();
    expect(childProvenance(rootProvenance(graph, seeds), { seeds }, adopted.graph).graph).toBe(adopted.graph);
  });
  it('keeps the identity replaceEqualDeep() keeps a schema by', () => {
    const previous = { child: stamp({ type: 'string' }, rootProvenance(graph, seeds)) };
    const next = { child: stamp({ type: 'string' }, rootProvenance(graph, [{ node: graph.root, refPath: [] }])) };
    expect(replaceEqualDeep(previous, next)).toBe(previous);
  });
});
