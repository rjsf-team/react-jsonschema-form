import type { RJSFSchema } from '@rjsf/utils';

/** A seeded source of choices, so a failing case is named by its seed alone */
interface Rng {
  next: () => number;
  int: (max: number) => number;
  chance: (probability: number) => boolean;
  pick: <V>(values: readonly V[]) => V;
}

const MODULUS = 2 ** 32;

function rngOf(seed: number): Rng {
  // A linear congruential generator, whose products stay within the integers a number holds exactly. The first values
  // of neighbouring seeds are close, so a few are drawn and dropped
  let state = (seed * 2654435761) % MODULUS;
  const next = () => {
    state = (state * 1664525 + 1013904223) % MODULUS;
    return state / MODULUS;
  };
  for (let warmUp = 0; warmUp < 4; warmUp += 1) {
    next();
  }
  const int = (max: number) => Math.floor(next() * max);
  return {
    next,
    int,
    chance: (probability) => next() < probability,
    pick: (values) => values[int(values.length)],
  };
}

const STRINGS = ['a', 'b', 'c'];
const NUMBERS = [0, 1, 2];
const KEYS = ['p', 'q', 'r', 's'];

interface Scope {
  allowRef: boolean;
}

function leaf(r: Rng): RJSFSchema {
  const kind = r.pick([
    'string',
    'string',
    'number',
    'integer',
    'boolean',
    'enum',
    'enum',
    'const',
    'nullable',
    'null',
  ]);
  switch (kind) {
    case 'string':
      return r.chance(0.4) ? { type: 'string', default: r.pick(STRINGS) } : { type: 'string' };
    case 'number':
    case 'integer':
      return r.chance(0.4) ? { type: kind, default: r.pick(NUMBERS) } : { type: kind };
    case 'boolean':
      return r.chance(0.4) ? { type: 'boolean', default: r.chance(0.5) } : { type: 'boolean' };
    case 'enum': {
      const values: (string | number)[] = r.chance(0.5)
        ? STRINGS.slice(0, 2 + r.int(2))
        : NUMBERS.slice(0, 2 + r.int(2));
      const schema: RJSFSchema = { type: typeof values[0] === 'string' ? 'string' : 'number', enum: values };
      if (r.chance(0.4)) {
        schema.default = r.pick(values);
      }
      return schema;
    }
    case 'const':
      return r.chance(0.5) ? { type: 'string', const: r.pick(STRINGS) } : { const: r.pick(NUMBERS) };
    case 'nullable': {
      const schema: RJSFSchema = { type: ['string', 'null'] };
      if (r.chance(0.4)) {
        schema.default = r.chance(0.5) ? null : r.pick(STRINGS);
      }
      return schema;
    }
    default:
      return { type: 'null' };
  }
}

function objectOf(r: Rng, depth: number, scope: Scope): RJSFSchema {
  const properties: Record<string, RJSFSchema> = {};
  const count = 1 + r.int(3);
  for (let index = 0; index < count; index += 1) {
    properties[KEYS[index]] = node(r, depth - 1, scope);
  }
  const schema: RJSFSchema = { type: 'object', properties };
  const required = Object.keys(properties).filter(() => r.chance(0.3));
  if (required.length > 0) {
    schema.required = required;
  }
  const additional = r.pick([undefined, undefined, undefined, true, false, { type: 'string' } as RJSFSchema]);
  if (additional !== undefined) {
    schema.additionalProperties = additional;
  }
  const extra = r.next();
  if (extra < 0.3) {
    properties.k = { type: 'string', enum: ['x', 'y'], ...(r.chance(0.5) ? { default: r.pick(['x', 'y']) } : {}) };
    const condition: RJSFSchema = {
      if: { properties: { k: { const: 'x' } }, ...(r.chance(0.5) ? { required: ['k'] } : {}) },
      then: { properties: { t: node(r, depth - 1, scope) } },
      ...(r.chance(0.5) ? { else: { properties: { e: node(r, depth - 1, scope) } } } : {}),
    };
    if (r.chance(0.3)) {
      schema.allOf = [condition];
    } else {
      Object.assign(schema, condition);
    }
  } else if (extra < 0.45) {
    properties.k = { type: 'string', enum: ['x', 'y'] };
    schema.dependencies = {
      k: {
        oneOf: [
          { properties: { k: { enum: ['x'] }, dx: node(r, depth - 1, scope) } },
          { properties: { k: { enum: ['y'] }, dy: node(r, depth - 1, scope) } },
        ],
      },
    };
  } else if (extra < 0.6) {
    schema.allOf = [{ properties: { m: node(r, depth - 1, scope) } }];
  }
  if (r.chance(0.15)) {
    const partial = sample(r, schema, {}, 0.5);
    if (partial !== undefined) {
      schema.default = partial as RJSFSchema['default'];
    }
  }
  return schema;
}

function arrayOf(r: Rng, depth: number, scope: Scope): RJSFSchema {
  const schema: RJSFSchema = { type: 'array' };
  if (r.chance(0.2)) {
    schema.items = [node(r, depth - 1, scope), node(r, depth - 1, scope)];
    if (r.chance(0.5)) {
      schema.additionalItems = r.chance(0.5) ? leaf(r) : false;
    }
  } else {
    schema.items = node(r, depth - 1, scope);
  }
  const minItems = r.pick([undefined, undefined, 0, 1, 2]);
  if (minItems !== undefined) {
    schema.minItems = minItems;
  }
  if (r.chance(0.15)) {
    const value = sample(r, schema, {}, 0.8);
    if (value !== undefined) {
      schema.default = value as RJSFSchema['default'];
    }
  }
  return schema;
}

function choiceOf(r: Rng, depth: number, scope: Scope): RJSFSchema {
  const key = r.pick(['oneOf', 'anyOf'] as const);
  const options: RJSFSchema[] = [];
  if (r.chance(0.6)) {
    const count = 2 + r.int(2);
    for (let index = 0; index < count; index += 1) {
      const option = objectOf(r, Math.max(depth - 1, 1), scope);
      option.properties = { kind: { const: `o${index}` }, ...option.properties };
      option.title = `o${index}`;
      options.push(option);
    }
  } else {
    options.push({ type: 'string' }, r.chance(0.5) ? { type: 'number' } : { type: 'null' });
    if (r.chance(0.3)) {
      options.push(objectOf(r, 1, scope));
    }
  }
  return { [key]: options };
}

function node(r: Rng, depth: number, scope: Scope): RJSFSchema {
  if (scope.allowRef && r.chance(0.1)) {
    return { $ref: '#/definitions/d0' };
  }
  if (depth <= 0) {
    return leaf(r);
  }
  const kind = r.pick(['leaf', 'leaf', 'leaf', 'object', 'object', 'object', 'array', 'array', 'choice', 'choice']);
  if (kind === 'object') {
    return objectOf(r, depth, scope);
  }
  if (kind === 'array') {
    return arrayOf(r, depth, scope);
  }
  return kind === 'choice' ? choiceOf(r, depth, scope) : leaf(r);
}

/** A root object schema drawing on the features the defaults and sanitize bugs intersect */
function schemaOf(r: Rng): RJSFSchema {
  const definition = node(r, 1, { allowRef: false });
  const schema = objectOf(r, 3, { allowRef: true });
  schema.definitions = { d0: definition };
  return schema;
}

function isSchema(value: unknown): value is RJSFSchema {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Data a user could plausibly hold for `schema`: mostly what it describes, with keys left out */
function sample(r: Rng, schema: RJSFSchema, root: RJSFSchema, keep = 0.7): unknown {
  if (typeof schema.$ref === 'string') {
    const target = root.definitions?.d0;
    return isSchema(target) ? sample(r, target, root, keep) : undefined;
  }
  if (schema.const !== undefined) {
    return schema.const;
  }
  if (Array.isArray(schema.enum)) {
    return r.pick(schema.enum);
  }
  const options = schema.oneOf ?? schema.anyOf;
  if (Array.isArray(options)) {
    const option = r.pick(options);
    return isSchema(option) ? sample(r, option, root, keep) : undefined;
  }
  const type = Array.isArray(schema.type) ? r.pick(schema.type) : schema.type;
  switch (type) {
    case 'string':
      return r.pick(STRINGS);
    case 'number':
    case 'integer':
      return r.pick(NUMBERS);
    case 'boolean':
      return r.chance(0.5);
    case 'null':
      return null;
    case 'array': {
      const length = Math.max(schema.minItems ?? 0, r.int(4));
      const items: unknown[] = [];
      for (let index = 0; index < length; index += 1) {
        const tupleItem = Array.isArray(schema.items) ? schema.items[index] : schema.items;
        const item = tupleItem ?? schema.additionalItems;
        if (!isSchema(item)) {
          break;
        }
        items.push(sample(r, item, root, keep));
      }
      return items;
    }
    case 'object': {
      const data: Record<string, unknown> = {};
      const sources: RJSFSchema[] = [schema];
      for (const branch of [schema.then, schema.else, ...(schema.allOf ?? [])]) {
        if (isSchema(branch) && r.chance(0.5)) {
          sources.push(branch);
          if (isSchema(branch.then) && r.chance(0.5)) {
            sources.push(branch.then);
          }
        }
      }
      for (const source of sources) {
        for (const [key, property] of Object.entries(source.properties ?? {})) {
          if (isSchema(property) && r.chance(schema.required?.includes(key) ? 0.9 : keep)) {
            const value = sample(r, property, root, keep);
            if (value !== undefined) {
              data[key] = value;
            }
          }
        }
      }
      if (schema.additionalProperties === true && r.chance(0.3)) {
        data.extra = r.pick(STRINGS);
      }
      return data;
    }
    default:
      return undefined;
  }
}

/** One generated case: a root schema and the data a form is seeded with */
export interface Case {
  schema: RJSFSchema;
  data: unknown;
}

export function caseOf(seed: number): Case {
  const r = rngOf(seed);
  const schema = schemaOf(r);
  const data = r.chance(0.3) ? undefined : sample(r, schema, schema);
  return { schema, data };
}

/** Every value one deletion smaller than `value`: a key or an item removed, at any depth */
function* smaller(value: unknown): Generator {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      yield value.filter((_item, at) => at !== index);
    }
    for (let index = 0; index < value.length; index += 1) {
      for (const child of smaller(value[index])) {
        yield value.map((item: unknown, at) => (at === index ? child : item));
      }
    }
  } else if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value);
    for (const [key] of entries) {
      yield Object.fromEntries(entries.filter(([other]) => other !== key));
    }
    for (const [key, held] of entries) {
      for (const child of smaller(held)) {
        yield Object.fromEntries(entries.map(([other, item]) => [other, other === key ? child : item]));
      }
    }
  }
}

/** The smallest case found by deleting from `failing` while `fails` still holds, within `budget` checks */
export function shrink(failing: Case, fails: (candidate: Case) => boolean, budget = 400): Case {
  let current = failing;
  let left = budget;
  let progressed = true;
  while (progressed && left > 0) {
    progressed = false;
    const candidates: Case[] = [];
    if (current.data !== undefined) {
      candidates.push({ schema: current.schema, data: undefined });
    }
    for (const data of smaller(current.data)) {
      candidates.push({ schema: current.schema, data });
    }
    for (const schema of smaller(current.schema)) {
      if (isSchema(schema)) {
        candidates.push({ schema, data: current.data });
      }
    }
    for (const candidate of candidates) {
      if (left <= 0) {
        break;
      }
      left -= 1;
      if (fails(candidate)) {
        current = candidate;
        progressed = true;
        break;
      }
    }
  }
  return current;
}
