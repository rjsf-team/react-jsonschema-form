import type { DefaultFormStateBehavior, RJSFSchema } from '@rjsf/utils';

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

// Far from any seed a run names, so the settings of a seed are not the schema of another
const SETTINGS_STREAM = 1_000_003;

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

// A case with two schemas holds them as one: the first, with marks on what the second has otherwise. A shrink that
// deletes from it deletes from both, so the second stays the first with a few differences however small they get
const SET = '~set';
const DROP = '~drop';
const ABSENT = '~absent';
const MARKS: string[] = [SET, DROP, ABSENT];

type Marked = RJSFSchema & { [SET]?: Record<string, unknown>; [DROP]?: string[]; [ABSENT]?: true };

/** How a case's second schema differs from its first */
export type Difference = 'defaults' | 'changedDefaults' | 'fields' | 'constraints';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isAbsent(value: unknown): boolean {
  return isRecord(value) && value[ABSENT] === true;
}

function first(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(first);
  }
  if (!isRecord(value)) {
    return value;
  }
  const kept = Object.entries(value).filter(([key]) => !MARKS.includes(key));
  return Object.fromEntries(kept.map(([key, held]) => [key, first(held)]));
}

function second(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(second);
  }
  if (!isRecord(value)) {
    return value;
  }
  const dropped = Array.isArray(value[DROP]) ? value[DROP] : [];
  const kept = Object.entries(value).filter(
    ([key, held]) => !MARKS.includes(key) && !dropped.includes(key) && !isAbsent(held),
  );
  return {
    ...Object.fromEntries(kept.map(([key, held]) => [key, second(held)])),
    ...(isRecord(value[SET]) ? value[SET] : {}),
  };
}

/** The schema a case's form mounts with */
export function firstOf(schema: RJSFSchema): RJSFSchema {
  const plain = first(schema);
  return isSchema(plain) ? plain : schema;
}

/** The schema a case's form is re-rendered with */
export function secondOf(schema: RJSFSchema): RJSFSchema {
  const other = second(schema);
  return isSchema(other) ? other : schema;
}

/** Marks `key` of `schema` as holding `value` in the second schema, or as left out of it where there is none */
function differ(schema: Marked, key: string, value?: unknown) {
  const set = Object.entries(schema[SET] ?? {}).filter(([other]) => other !== key);
  const dropped = (schema[DROP] ?? []).filter((other) => other !== key);
  if (value === undefined) {
    dropped.push(key);
  } else {
    set.push([key, value]);
  }
  Object.assign(schema, { [SET]: Object.fromEntries(set), [DROP]: dropped });
}

/** Marks `schema`, a property, as one the second schema does not have */
function withdraw(schema: Marked) {
  Object.assign(schema, { [ABSENT]: true });
}

const SCHEMA_KEYS = ['items', 'additionalItems', 'additionalProperties', 'then', 'else', 'allOf', 'oneOf', 'anyOf'];
const SCHEMA_MAP_KEYS = ['properties', 'definitions', 'dependencies'];

/**
 * Every schema within `schema` that describes data, and whether it is within an option of a `oneOf` or `anyOf` field.
 * An `if` only tests data, so it is left out
 */
function* nodesOf(schema: RJSFSchema, inOption = false, isDependency = false): Generator<[RJSFSchema, boolean]> {
  yield [schema, inOption];
  for (const [key, held] of Object.entries(schema)) {
    if (SCHEMA_KEYS.includes(key)) {
      const within = inOption || ((key === 'oneOf' || key === 'anyOf') && !isDependency);
      for (const child of Array.isArray(held) ? held : [held]) {
        if (isSchema(child)) {
          yield* nodesOf(child, within);
        }
      }
    } else if (SCHEMA_MAP_KEYS.includes(key) && isSchema(held)) {
      for (const child of Object.values(held)) {
        if (isSchema(child)) {
          yield* nodesOf(child, inOption, key === 'dependencies');
        }
      }
    }
  }
}

/** A `default` that `schema` allows and does not have. For an array one of another length is tried first */
function otherDefault(r: Rng, schema: RJSFSchema, root: RJSFSchema): unknown {
  const bare: RJSFSchema = { ...schema };
  delete bare.default;
  const held = JSON.stringify(schema.default);
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const value = sample(r, bare, root, schema.type === 'object' ? 0.5 : 0.8);
    const sameLength = Array.isArray(value) && Array.isArray(schema.default) && value.length === schema.default.length;
    if (value !== undefined && JSON.stringify(value) !== held && !(sameLength && attempt < 3)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Defaults changed, added and taken away, on scalars, arrays and objects alike. With `onlyChanged` a default only
 * changes from one value that is not `null` to another: a filled value follows a default the schema still declares,
 * and stays where it declares none or `null`. Nothing else differs
 */
function differInDefaults(r: Rng, schema: RJSFSchema, onlyChanged = false) {
  const root = firstOf(schema);
  const typed = [...nodesOf(schema)].flatMap(([held]) => {
    const other = secondOf(held);
    const declares = other.default !== undefined && other.default !== null;
    const takes = other.type !== undefined && other.const === undefined && (declares || !onlyChanged);
    return takes ? [{ held, other }] : [];
  });
  const giveAnother = ({ held, other }: (typeof typed)[number]) => {
    const value = otherDefault(r, other, root);
    const gives = value !== undefined && !(onlyChanged && value === null);
    if (gives) {
      differ(held, 'default', value);
    }
    return gives;
  };
  let differs = false;
  for (const node of typed) {
    const roll = r.next();
    if (node.other.default !== undefined && roll < 0.1 && !onlyChanged) {
      differ(node.held, 'default');
      differs = true;
    } else if (roll < (node.other.default === undefined ? 0.15 : 0.7)) {
      differs = giveAnother(node) || differs;
    }
  }
  const start = r.int(typed.length);
  for (let offset = 0; !differs && offset < typed.length; offset += 1) {
    differs = giveAnother(typed[(start + offset) % typed.length]);
  }
}

/**
 * Fields withdrawn without any value being made invalid: properties and branches taken out, and the `k` a condition
 * reads sent the other way, by what the `if` or the dependency asks of it or by its own `default`. A `default` is
 * changed and never added, so that coming back takes none away: what a filled value does then is its own invariant.
 * The options of a `oneOf` or `anyOf` field are left alone: the data picks its option by what the options declare,
 * and the `const` of another option replaces a value
 */
function differInFields(r: Rng, schema: RJSFSchema) {
  let differing = 0;
  const outsideOptions = [...nodesOf(schema)].flatMap(([held, inOption]) => (inOption ? [] : [held]));
  for (const held of outsideOptions) {
    if (isSchema(held.if)) {
      if (r.chance(0.5)) {
        differ(held, 'if', { ...held.if, properties: { k: { const: 'y' } } });
        differing += 1;
      }
      for (const branch of ['then', 'else'] as const) {
        if (held[branch] !== undefined && r.chance(0.15)) {
          differ(held, branch);
          differing += 1;
        }
      }
    }
    const dependency = held.dependencies?.k;
    if (isSchema(dependency) && Array.isArray(dependency.oneOf) && r.chance(0.3)) {
      for (const [index, option] of dependency.oneOf.entries()) {
        const asked = isSchema(option) ? option.properties?.k : undefined;
        if (isSchema(asked)) {
          differ(asked, 'enum', [index === 0 ? 'y' : 'x']);
          differing += 1;
        }
      }
    }
    const k = held.properties?.k;
    if (isSchema(k) && k.default !== undefined && r.chance(0.5)) {
      differ(k, 'default', k.default === 'y' ? 'x' : 'y');
      differing += 1;
    }
    for (const property of Object.values(held.properties ?? {})) {
      if (isSchema(property) && r.chance(0.2)) {
        withdraw(property);
        differing += 1;
      }
    }
  }
  const fallback = r.pick(Object.values(schema.properties ?? {}));
  if (differing === 0 && isSchema(fallback)) {
    withdraw(fallback);
  }
}

/**
 * Values made invalid: an `enum` that stops listing one and a `const` that asks for another. Only an `enum` with a
 * `default` is narrowed, and the `default` moves to a value still listed where it has to and now and then where it
 * does not. None is added or taken away, so that every value has a default to follow both ways. A schema with no such
 * `enum` and no `const` gets no difference
 */
function differInConstraints(r: Rng, schema: RJSFSchema) {
  for (const [held] of [...nodesOf(schema)]) {
    if (Array.isArray(held.enum) && held.enum.length > 1 && held.default !== undefined && r.chance(0.7)) {
      const index = r.int(held.enum.length);
      const left = held.enum.filter((_value, at) => at !== index);
      differ(held, 'enum', left);
      const others = left.filter((value) => value !== held.default);
      if (others.length > 0 && (held.default === held.enum[index] || r.chance(0.5))) {
        differ(held, 'default', r.pick(others));
      }
    } else if (held.const !== undefined && r.chance(0.3)) {
      const values: (string | number)[] = typeof held.const === 'string' ? STRINGS : NUMBERS;
      differ(held, 'const', r.pick(values.filter((value) => value !== held.const)));
    }
  }
}

const differences: Record<Difference, (r: Rng, schema: RJSFSchema) => void> = {
  defaults: differInDefaults,
  changedDefaults: (r, schema) => differInDefaults(r, schema, true),
  fields: differInFields,
  constraints: differInConstraints,
};

/**
 * One generated case: a root schema and the data a form is seeded with. The schema of a case made with a difference
 * is two, to be read with `firstOf()` and `secondOf()`
 */
export interface Case {
  schema: RJSFSchema;
  data: unknown;
  /** The form's `defaultFormStateBehavior`, for a case that is checked under settings */
  settings?: DefaultFormStateBehavior;
}

/**
 * The settings of a seed: each one left at its default half of the time. They are drawn apart from the schema and the
 * data, so a seed names the same schema and data with and without them
 */
export function settingsOf(seed: number): DefaultFormStateBehavior {
  const r = rngOf(seed + SETTINGS_STREAM);
  const drawn = <V>(values: readonly V[]): V | undefined => (r.chance(0.5) ? r.pick(values) : undefined);
  const populate = drawn(['all', 'requiredOnly', 'never'] as const);
  const mergeExtraDefaults = drawn([true, false]);
  const settings: DefaultFormStateBehavior = {
    emptyObjectFields: drawn([
      'populateAllDefaults',
      'populateRequiredDefaults',
      'skipDefaults',
      'skipEmptyDefaults',
    ] as const),
    allOf: drawn(['populateDefaults', 'skipDefaults'] as const),
    constAsDefaults: drawn(['always', 'skipOneOf', 'never'] as const),
    mergeDefaultsIntoFormData: drawn(['useFormDataIfPresent', 'useDefaultIfFormDataUndefined'] as const),
    nestedDefaultsPrecedence: drawn(['descendantWins', 'ancestorWins'] as const),
    requiredBooleanDefault: drawn(['populateFalse', 'skip'] as const),
    ...((populate !== undefined || mergeExtraDefaults !== undefined) && {
      arrayMinItems: { ...(populate && { populate }), ...(mergeExtraDefaults !== undefined && { mergeExtraDefaults }) },
    }),
  };
  // Without the keys left at their default, so a shrunk case prints only what was set
  return Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== undefined));
}

export function caseOf(seed: number, difference?: Difference): Case {
  const r = rngOf(seed);
  const schema = schemaOf(r);
  const data = r.chance(0.3) ? undefined : sample(r, schema, schema);
  if (difference) {
    differences[difference](r, schema);
  }
  return { schema, data };
}

/**
 * Every value one deletion smaller than `value`: a key or an item removed, at any depth. A key in `fixed` stays, at
 * every depth, and so does a key the second schema has otherwise, for as long as it does: without it a changed
 * `default` would shrink into an added one, which is another difference
 */
function* smaller(value: unknown, fixed: readonly string[] = []): Generator {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      yield value.filter((_item, at) => at !== index);
    }
    for (let index = 0; index < value.length; index += 1) {
      for (const child of smaller(value[index], fixed)) {
        yield value.map((item: unknown, at) => (at === index ? child : item));
      }
    }
  } else if (isRecord(value)) {
    const marked = [...Object.keys(isRecord(value[SET]) ? value[SET] : {}), ...[value[DROP]].flat()];
    const entries = Object.entries(value);
    const free = entries.filter(([key]) => !fixed.includes(key) && !marked.includes(key));
    for (const [key] of free) {
      yield Object.fromEntries(entries.filter(([other]) => other !== key));
    }
    for (const [key, held] of free) {
      for (const child of smaller(held, fixed)) {
        yield Object.fromEntries(entries.map(([other, item]) => [other, other === key ? child : item]));
      }
    }
  }
}

function candidatesOf(current: Case): Case[] {
  const candidates: Case[] = [];
  if (current.data !== undefined) {
    candidates.push({ ...current, data: undefined });
  }
  for (const data of smaller(current.data)) {
    candidates.push({ ...current, data });
  }
  for (const key of Object.keys(current.settings ?? {})) {
    const settings = Object.fromEntries(Object.entries(current.settings ?? {}).filter(([other]) => other !== key));
    candidates.push({ ...current, settings });
  }
  // A schema that loses one of these is one the generator does not make, and fails in ways the generated one does not
  for (const schema of smaller(current.schema, ['type', '$ref', 'if'])) {
    if (isSchema(schema)) {
      candidates.push({ ...current, schema });
    }
  }
  return candidates;
}

/**
 * The smallest case found by deleting from `failing` while `fails` still holds, within `budget` checks. After a
 * deletion the search goes on from where it was instead of from the start, since what could not be deleted from the
 * larger case can rarely be deleted from the smaller one; it ends when a whole round deletes nothing
 */
export function shrink(failing: Case, fails: (candidate: Case) => boolean, budget = 400): Case {
  let current = failing;
  let candidates = candidatesOf(current);
  let at = 0;
  let sinceProgress = 0;
  for (let left = budget; left > 0 && sinceProgress < candidates.length; left -= 1) {
    const candidate = candidates[at % candidates.length];
    if (fails(candidate)) {
      current = candidate;
      candidates = candidatesOf(current);
      at = candidates.length > 0 ? at % candidates.length : 0;
      sinceProgress = 0;
    } else {
      at += 1;
      sinceProgress += 1;
    }
  }
  return current;
}
