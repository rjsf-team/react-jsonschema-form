// Imported by path rather than as `@rjsf/utils`, which isn't resolvable from here
import type { RJSFSchema } from '../../packages/utils/src/index.ts';
import type { ParityShape } from './types.ts';

const D = (name: string) => `#/definitions/${name}`;

/** Ref cycles of coprime periods meeting under one root `allOf`: a set-equality check alone lets the chain run for the
 * lcm of the periods
 */
function lcm(periods: number[]): RJSFSchema {
  const definitions: Record<string, RJSFSchema> = { Leaf: { type: 'object' } };
  periods.forEach((period, i) => {
    for (let j = 0; j < period; j++) {
      definitions[`C${i}_${j}`] = {
        type: 'object',
        properties: {
          [`n${i}`]: { type: 'string', default: 'n' },
          k: { allOf: [{ $ref: D('Leaf') }, { $ref: D(`C${i}_${(j + 1) % period}`) }] },
        },
      };
    }
  });
  return { definitions, type: 'object', allOf: periods.map((_, i) => ({ $ref: D(`C${i}_0`) })) };
}

/** Each key's dependency declares the next key's default, so every key qualifies only once the one before it has a
 * value
 */
function depChain(length: number): RJSFSchema {
  const properties: Record<string, RJSFSchema> = { k0: { type: 'string', default: 'v' } };
  const dependencies: Record<string, RJSFSchema> = {};
  for (let i = 1; i < length; i++) {
    properties[`k${i}`] = { type: 'string' };
    dependencies[`k${i - 1}`] = { properties: { [`k${i}`]: { type: 'string', default: 'v' } } };
  }
  return { type: 'object', properties, dependencies };
}

/** Nested definitions with no recursion, for the cost of a fold that re-folds children */
function deepChain(length: number): RJSFSchema {
  const definitions: Record<string, RJSFSchema> = {};
  for (let i = 0; i < length; i++) {
    definitions[`D${i}`] = {
      type: 'object',
      properties: {
        v: { type: 'string', default: 'v' },
        ...(i + 1 < length ? { next: { $ref: D(`D${i + 1}`) } } : {}),
      },
    };
  }
  return { definitions, $ref: D('D0') };
}

/** The complete definition graph K_n: every definition has a `$ref` property to every other one */
function dense(n: number): RJSFSchema {
  const definitions: Record<string, RJSFSchema> = {};
  for (let i = 0; i < n; i++) {
    const properties: Record<string, RJSFSchema> = { v: { type: 'string', default: 'v' } };
    for (let j = 0; j < n; j++) {
      if (j !== i) {
        properties[`p${j}`] = { $ref: D(`d${j}`) };
      }
    }
    definitions[`d${i}`] = { type: 'object', properties };
  }
  return { definitions, $ref: D('d0') };
}

const termination = 'RFC 4.4, termination families';

/** The adversarial families from the RFC's termination review, the dense definition graphs and the A/B/C shared node */
export const terminationShapes: readonly ParityShape[] = [
  { name: 'T lcm 2,3', source: termination, schema: lcm([2, 3]), populate: true },
  { name: 'T deepChain 8', source: termination, schema: deepChain(8) },
  { name: 'T depChain 9', source: termination, schema: depChain(9) },
  {
    name: 'T if flip',
    source: 'RFC 4.5',
    schema: {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' } },
      if: { required: ['a'] },
      then: { properties: { b: { type: 'string', default: 'b' } } },
    },
  },
  {
    name: 'T if flip rec',
    source: 'RFC 4.5',
    schema: {
      type: 'object',
      properties: { a: { type: 'string', default: 'x' } },
      if: { required: ['a'] },
      then: { properties: { child: { $ref: '#' } } },
    },
  },
  {
    name: 'T option flip',
    source: 'RFC 4.5',
    schema: {
      type: 'object',
      anyOf: [
        { properties: { a: { type: 'string', default: 'x' } }, not: { required: ['a'] } },
        { properties: { a: { const: 'x' }, b: { type: 'string', default: 'b' } }, required: ['a'] },
      ],
    },
  },
  {
    name: 'T alias pct',
    source: 'RFC 4.1, canonical locations',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: { name: { type: 'string', default: 'n' }, child: { $ref: '#/definitions/%41' } },
        },
      },
      $ref: D('A'),
    },
  },
  {
    name: 'T alias pct allOf',
    source: 'RFC 4.1, canonical locations',
    schema: {
      definitions: {
        A: {
          type: 'object',
          properties: {
            name: { type: 'string', default: 'n' },
            child: { allOf: [{ $ref: D('A') }, { $ref: '#/definitions/%41' }] },
          },
        },
      },
      $ref: D('A'),
    },
    populate: true,
  },
  { name: 'K3', source: 'RFC 8, dense definition graphs', schema: dense(3) },
  { name: 'K4', source: 'RFC 8, dense definition graphs', schema: dense(4) },
  { name: 'K5', source: 'RFC 8, dense definition graphs', schema: dense(5) },
  {
    name: 'A/B/C shared node',
    source: 'RFC 2.2',
    schema: {
      definitions: {
        A: { type: 'object', properties: { a: { type: 'string', default: 'x' }, b: { $ref: D('B') } } },
        B: { type: 'object', properties: { c: { type: 'string', default: 'y' }, a2: { $ref: D('A') } } },
        C: { type: 'object', properties: { x: { $ref: D('A') }, y: { $ref: D('B') } } },
      },
      $ref: D('C'),
    },
  },
];
