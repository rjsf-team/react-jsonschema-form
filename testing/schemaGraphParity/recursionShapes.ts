// Imported by path rather than as `@rjsf/utils`, which isn't resolvable from here
import type { RJSFSchema } from '../../packages/utils/src/index.ts';
import type { ParityShape } from './types.ts';

const source = 'RFC 4.4, prototype shape table';

const ref: RJSFSchema = { $ref: '#/definitions/node' };
const nodeWith = (child: RJSFSchema): RJSFSchema => ({
  definitions: { node: { type: 'object', properties: { name: { type: 'string', default: 'n' }, child } } },
  $ref: '#/definitions/node',
});
const A: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' } },
  dependencies: { a: { properties: { b: { $ref: '#/definitions/B' } } } },
};
const B: RJSFSchema = {
  type: 'object',
  properties: { c: { type: 'string', default: 'y' } },
  dependencies: { c: { properties: { a2: { $ref: '#/definitions/A' } } } },
};
const pl: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' }, child: { $ref: '#/definitions/pl' } },
};
const node5493: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' } },
  dependencies: { a: { properties: { child: ref } } },
};
const deep: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' } },
  dependencies: {
    a: { properties: { obj: { properties: { inner: { default: 'i' } } }, child: { $ref: '#/definitions/deep' } } },
  },
};
const rq: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' }, child: { $ref: '#/definitions/rq' } },
  dependencies: { a: ['child'] },
};
const nd: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string' }, b: { type: 'string', default: 'y' }, child: { $ref: '#/definitions/nd' } },
  dependencies: { a: { properties: { extra: { type: 'string', default: 'e' } } } },
};
const Def: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' } },
  if: { properties: { a: { const: 'x' } } },
  then: { properties: { child: { $ref: '#/definitions/Def' } } },
};
const selfOption: RJSFSchema = {
  definitions: { node: { anyOf: [ref, { type: 'object', properties: { x: { type: 'string', default: 'x' } } }] } },
  $ref: '#/definitions/node',
};
const A2: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string', default: 'x' }, b: { $ref: '#/definitions/B2' } },
};
const B2: RJSFSchema = {
  type: 'object',
  properties: { c: { type: 'string', default: 'y' }, a2: { $ref: '#/definitions/A2' } },
};
const petDefs: Record<string, RJSFSchema> = {
  Pet: {
    type: 'object',
    properties: { petType: { type: 'string', default: 'cat' }, friend: { $ref: '#/definitions/Pet' } },
    if: { properties: { petType: { const: 'cat' } } },
    then: { $ref: '#/definitions/Cat' },
  },
  Cat: {
    allOf: [{ $ref: '#/definitions/Pet' }, { type: 'object', properties: { hunts: { type: 'string', default: 'h' } } }],
  },
};
const k: RJSFSchema = { type: 'string', default: 'a' };
const selfAllOf: RJSFSchema = { type: 'object', properties: { k }, allOf: [ref] };
const selfThen: RJSFSchema = { type: 'object', properties: { k }, if: {}, then: ref };
const selfDeps: RJSFSchema = { type: 'object', properties: { k }, dependencies: { k: ref } };
const Q: RJSFSchema = { type: 'object', properties: { name: { type: 'string', default: 'q' } } };
const tree: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: 't' },
    children: { type: 'array', items: { $ref: '#/definitions/tree' } },
  },
};
const treeMin: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: 't' },
    children: { type: 'array', minItems: 1, items: { $ref: '#/definitions/treeMin' } },
  },
};
const map: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string', default: 'm' } },
  additionalProperties: { $ref: '#/definitions/map' },
};
const allOfNode: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string', default: 'n' } },
  allOf: [{ properties: { child: ref } }],
};
const depBack: RJSFSchema = {
  type: 'object',
  properties: { k: { type: 'string', default: 'k' } },
  dependencies: { k: { $ref: '#/definitions/node', properties: { extra: { type: 'string', default: 'e' } } } },
};
const Base: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string', default: 'b' }, child: { $ref: '#/definitions/M' } },
};
const M: RJSFSchema = {
  allOf: [{ $ref: '#/definitions/Base' }],
  properties: { extra: { type: 'string', default: 'e' } },
};
const mixin: RJSFSchema = { type: 'object', properties: { created: { type: 'string', default: 'c' } } };
const Doc: RJSFSchema = {
  allOf: [{ $ref: '#/definitions/mixin' }],
  properties: {
    meta: { allOf: [{ $ref: '#/definitions/mixin' }], properties: { m: { type: 'string', default: 'm' } } },
  },
};
const wrapNode: RJSFSchema = { type: 'object', properties: { wrap: { type: 'object', properties: { child: ref } } } };
const thenNode: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string', default: 'n' } },
  if: {},
  then: { properties: { child: ref } },
};
const growing: RJSFSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: 'g' },
    child: { allOf: [ref, { properties: { extra: { type: 'string', default: 'e' } } }] },
  },
};
const S: RJSFSchema = { type: 'string', default: 'def' };
const O: RJSFSchema = {
  type: 'object',
  properties: { a: { type: 'string' }, b: { type: 'string' } },
  default: { a: 'da', b: 'db' },
  required: ['b'],
};
const map2: RJSFSchema = {
  type: 'object',
  properties: { name: { type: 'string', default: 'm' } },
  additionalProperties: { $ref: '#/definitions/map2' },
  default: { k: {} },
};

const shapes: ParityShape[] = [
  {
    name: '5500 allOf properties',
    schema: nodeWith({ type: 'object', allOf: [{ properties: { x: ref } }] }),
    populate: true,
  },
  {
    name: '5500 allOf items',
    schema: nodeWith({ type: 'array', minItems: 1, allOf: [{ items: ref }] }),
    populate: true,
  },
  { name: '5500 then properties', schema: nodeWith({ type: 'object', if: {}, then: { properties: { x: ref } } }) },
  {
    name: '5500 items then',
    schema: nodeWith({
      type: 'array',
      minItems: 1,
      items: { type: 'object', if: {}, then: { properties: { x: ref } } },
    }),
  },
  {
    name: '5500 deps ref',
    schema: nodeWith({ type: 'object', properties: { x: { type: 'string', default: 'x' } }, dependencies: { x: ref } }),
  },
  {
    name: '5500 deps properties',
    schema: nodeWith({
      type: 'object',
      properties: { x: { type: 'string', default: 'x' } },
      dependencies: { x: { properties: { y: ref } } },
    }),
  },
  { name: '5493 root', schema: { definitions: { node: node5493 }, $ref: '#/definitions/node' } },
  { name: '5493 prop', schema: { definitions: { node: node5493 }, type: 'object', properties: { p: ref } } },
  { name: '5501 allOf', schema: nodeWith({ allOf: [ref] }) },
  { name: '5501 then', schema: nodeWith({ type: 'object', if: {}, then: ref }) },
  { name: 'A<->B deps root', schema: { definitions: { A, B }, $ref: '#/definitions/A' } },
  {
    name: 'A<->B deps prop',
    schema: { definitions: { A, B }, type: 'object', properties: { p: { $ref: '#/definitions/A' } } },
  },
  {
    name: 'A<->B deps items',
    schema: {
      definitions: { A, B },
      type: 'object',
      properties: { arr: { type: 'array', minItems: 1, items: { $ref: '#/definitions/A' } } },
    },
  },
  { name: 'pl prop', schema: { definitions: { pl }, properties: { p: { $ref: '#/definitions/pl' } } } },
  {
    name: 'pl + root dep',
    schema: {
      definitions: { pl },
      type: 'object',
      properties: { z: { type: 'string', default: 'z' }, p: { $ref: '#/definitions/pl' } },
      dependencies: { z: { properties: { y: { default: 'y' } } } },
    },
  },
  {
    name: 'pl arr allOf minItems',
    schema: {
      definitions: { pl },
      type: 'object',
      properties: { arr: { type: 'array', allOf: [{ minItems: 1 }], items: { $ref: '#/definitions/pl' } } },
    },
    populate: true,
  },
  { name: 'deep root', schema: { definitions: { deep }, $ref: '#/definitions/deep' } },
  { name: 'rq root', schema: { definitions: { rq }, $ref: '#/definitions/rq' } },
  {
    name: 'nd prop + formData',
    schema: { definitions: { nd }, type: 'object', properties: { p: { $ref: '#/definitions/nd' } } },
    formData: { p: { a: 'v', child: { a: 'v', child: { a: 'v' } } } },
  },
  {
    name: 'Def + sibling deps',
    schema: {
      definitions: { Def },
      type: 'object',
      properties: {
        p: { $ref: '#/definitions/Def', dependencies: { a: { properties: { s: { default: 's' } } } } },
      },
    },
  },
  { name: 'self anyOf option', schema: selfOption },
  {
    name: '5452a',
    schema: {
      $ref: '#/definitions/x',
      definitions: {
        x: {
          type: 'object',
          properties: { y: { $ref: '#/definitions/y' } },
          patternProperties: { '^y': { title: 'Y' } },
        },
        y: {
          type: 'object',
          properties: { x: { $ref: '#/definitions/x' } },
          patternProperties: { '^x': { title: 'X' } },
        },
      },
    },
  },
  {
    name: '5452b',
    schema: {
      $ref: '#/definitions/node',
      definitions: {
        node: {
          type: 'object',
          allOf: [
            {
              properties: { child: ref, name: { type: 'string' } },
              patternProperties: { '^child': { title: 'Child' } },
            },
          ],
        },
      },
    },
  },
  {
    name: '5452c',
    schema: {
      type: 'object',
      properties: { a: { type: 'string' }, b: { type: 'string' } },
      dependencies: { a: ['b'] },
      oneOf: [{ $ref: '#' }, { properties: { c: { type: 'string' } } }],
    },
  },
  { name: 'X pl root', schema: { definitions: { pl }, $ref: '#/definitions/pl' } },
  { name: 'X A<->B props root', schema: { definitions: { A2, B2 }, $ref: '#/definitions/A2' } },
  { name: 'X Pet root', schema: { definitions: petDefs, $ref: '#/definitions/Pet' } },
  {
    name: 'X Pet prop',
    schema: { definitions: petDefs, type: 'object', properties: { p: { $ref: '#/definitions/Pet' } } },
  },
  { name: 'X self allOf root', schema: { definitions: { node: selfAllOf }, $ref: '#/definitions/node' } },
  { name: 'X self allOf prop', schema: { definitions: { node: selfAllOf }, type: 'object', properties: { p: ref } } },
  { name: 'X self then root', schema: { definitions: { node: selfThen }, $ref: '#/definitions/node' } },
  { name: 'X self then prop', schema: { definitions: { node: selfThen }, type: 'object', properties: { p: ref } } },
  { name: 'X self deps root', schema: { definitions: { node: selfDeps }, $ref: '#/definitions/node' } },
  { name: 'X self deps prop', schema: { definitions: { node: selfDeps }, type: 'object', properties: { p: ref } } },
  {
    name: 'X sibling allOf 2nd use prop',
    schema: {
      definitions: { Q },
      type: 'object',
      properties: {
        p: { $ref: '#/definitions/Q', allOf: [{ properties: { friend: { $ref: '#/definitions/Q' } } }] },
      },
    },
  },
  {
    name: 'X sibling then 2nd use root',
    schema: {
      definitions: { Q },
      $ref: '#/definitions/Q',
      if: {},
      then: { properties: { friend: { $ref: '#/definitions/Q' } } },
    },
  },
  { name: 'X items rec', schema: { definitions: { tree }, $ref: '#/definitions/tree' } },
  { name: 'X items rec minItems', schema: { definitions: { treeMin }, $ref: '#/definitions/treeMin' } },
  {
    name: 'X items rec + data',
    schema: { definitions: { tree }, $ref: '#/definitions/tree' },
    formData: { children: [{ children: [{ children: [{}] }] }] },
  },
  {
    name: 'X addlProps rec + data',
    schema: { definitions: { map }, $ref: '#/definitions/map' },
    formData: { k: { j: { i: {} } } },
  },
  {
    name: 'X allOf rec populate root',
    schema: { definitions: { node: allOfNode }, $ref: '#/definitions/node' },
    populate: true,
  },
  {
    name: 'X allOf rec populate prop',
    schema: { definitions: { node: allOfNode }, type: 'object', properties: { p: ref } },
    populate: true,
  },
  { name: 'X allOf rec skip root', schema: { definitions: { node: allOfNode }, $ref: '#/definitions/node' } },
  { name: 'X dep $ref back + props', schema: { definitions: { node: depBack }, $ref: '#/definitions/node' } },
  { name: 'X mixin back-ref', schema: { definitions: { Base, M }, $ref: '#/definitions/Base' } },
  { name: 'X shared mixin', schema: { definitions: { mixin, Doc }, $ref: '#/definitions/Doc' } },
  {
    name: 'X $ref # no root ref',
    schema: { type: 'object', properties: { name: { type: 'string', default: 'r' }, child: { $ref: '#' } } },
  },
  { name: 'X wrap nested', schema: { definitions: { node: wrapNode }, $ref: '#/definitions/node' } },
  { name: 'X then-branch cycle', schema: { definitions: { node: thenNode }, $ref: '#/definitions/node' } },
  { name: 'X growing allOf child', schema: { definitions: { node: growing }, $ref: '#/definitions/node' } },
  {
    name: 'N ref+default in allOf',
    schema: { definitions: { O }, type: 'object', allOf: [{ $ref: '#/definitions/O', default: { a: 'sa' } }] },
  },
  {
    name: 'N ref+required in allOf',
    schema: { definitions: { O }, type: 'object', allOf: [{ $ref: '#/definitions/O', required: ['a'] }] },
  },
  {
    name: 'N ref+default in then',
    schema: { definitions: { O }, type: 'object', if: {}, then: { $ref: '#/definitions/O', default: { a: 'sa' } } },
  },
  {
    name: 'N ref+required in then',
    schema: { definitions: { O }, type: 'object', if: {}, then: { $ref: '#/definitions/O', required: ['a'] } },
  },
  {
    name: 'N prop ref+default in allOf',
    schema: {
      definitions: { S },
      type: 'object',
      properties: { p: { allOf: [{ $ref: '#/definitions/S', default: 'sib' }] } },
    },
    populate: true,
  },
  {
    name: 'N prop ref+default in then',
    schema: {
      definitions: { S },
      type: 'object',
      properties: { p: { if: {}, then: { $ref: '#/definitions/S', default: 'sib' } } },
    },
  },
  {
    name: 'N prop ref+required in then',
    schema: {
      definitions: { O },
      type: 'object',
      properties: { p: { if: {}, then: { $ref: '#/definitions/O', required: ['a'] } } },
    },
  },
  {
    name: 'N then props disqualify dep',
    schema: {
      type: 'object',
      dependencies: { a: { properties: { d: { type: 'string', default: 'dd' } } } },
      if: {},
      then: { properties: { z: { type: 'string', default: 'z' } } },
    },
    formData: { a: 'v' },
  },
  {
    name: 'N then props disqualify dep (own a)',
    schema: {
      type: 'object',
      properties: { a: { type: 'string' } },
      dependencies: { a: { properties: { d: { type: 'string', default: 'dd' } } } },
      if: {},
      then: { properties: { z: { type: 'string', default: 'z' } } },
    },
    formData: { a: 'v' },
  },
  {
    name: 'N b-flip',
    schema: {
      type: 'object',
      properties: { b: { type: 'string' } },
      if: { properties: { b: { const: 'z' } }, required: ['b'] },
      then: { properties: { b: { default: 'y' } } },
      else: { properties: { b: { default: 'z' } } },
    },
  },
  {
    name: 'N a-flip',
    schema: {
      type: 'object',
      properties: { a: { type: 'string' } },
      if: { properties: { a: { const: 'x' } } },
      then: { properties: { a: { default: 'y' } } },
      else: { properties: { a: { default: 'x' } } },
    },
  },
  { name: 'N treeMin', schema: { definitions: { treeMin }, $ref: '#/definitions/treeMin' } },
  { name: 'N map default k', schema: { definitions: { map2 }, $ref: '#/definitions/map2' } },
  { name: 'N self anyOf option click', schema: selfOption, selectOption: 1 },
  { name: 'N self anyOf option data x', schema: selfOption, formData: { x: 'x' } },
];

/** The 65 recursive shapes the RFC's prototype was compared with v7 on */
export const recursionShapes: readonly ParityShape[] = shapes.map((shape) => ({ source, ...shape }));
