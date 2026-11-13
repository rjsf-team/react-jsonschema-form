import { createRef } from 'react';
import type { DefaultFormStateBehavior, RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { isDeepStrictEqual } from 'node:util';

import type { FormRef } from '../../src/index.ts';
import Form from '../../src/index.ts';
import { setupConsoleErrorSuppression, setupConsoleWarnSuppression } from '../testUtils.tsx';
import type { Case, Difference } from './generate.ts';
import { caseOf, firstOf, secondOf, settingsOf, shrink } from './generate.ts';

// Each seed names one generated schema and seed data. The run is a fixed range, so it fails the same way every time;
// `INVARIANT_RUNS` and `INVARIANT_SEED` widen or move it to look for new cases, and `INVARIANT_ALL` shrinks the seeds of a
// known gap too, to read the case behind one
const RUNS = Number(process.env.INVARIANT_RUNS ?? 300);
const FIRST_SEED = Number(process.env.INVARIANT_SEED ?? 1);
const SHRUNK_PER_INVARIANT = 3;
// A case with two schemas takes a mount and one or two re-renders, each of them dearer than a mount, so those
// invariants run over the first two thirds of the range
const RUNS_BETWEEN = Math.ceil((RUNS * 2) / 3);

const FOLLOWS = 'form: with nothing seeded or entered, the data follows the defaults a re-render changes';
const STAYS = 'form: a seeded value no default gave stays when the defaults change';
const OWNED = 'form: through a schema change and back, every value is the seed’s or one the defaults give';
const RESTORES = 'form: with nothing seeded or entered, a schema change and back gives the data of the mount';
const REPLAYS = 'form: after edits and a change of defaults, the data is what a fresh form holding those edits fills';

/** How a case breaks an invariant: the two values differ, differ only in keys held as `undefined`, or the code threw */
interface Failure {
  kind: 'differs' | 'undefinedOnly' | 'throws';
  expected?: unknown;
  actual?: unknown;
  message?: string;
}

/** A failing case, shrunk to the smallest schemas and data that still fail the same way */
interface Example extends Failure {
  seed: number;
  schema: RJSFSchema;
  other?: RJSFSchema;
  settings?: DefaultFormStateBehavior;
  data: unknown;
}

type Path = (string | number)[];

function compare(expected: unknown, actual: unknown): Failure | undefined {
  if (isDeepStrictEqual(expected, actual)) {
    return undefined;
  }
  const kind = JSON.stringify(expected) === JSON.stringify(actual) ? 'undefinedOnly' : 'differs';
  return { kind, expected, actual };
}

type Settings = DefaultFormStateBehavior | undefined;

const schemaUtils = new Map<string, WeakMap<RJSFSchema, ReturnType<typeof createSchemaUtils>>>();

function utilsOf(schema: RJSFSchema, settings?: Settings) {
  const key = JSON.stringify(settings ?? {});
  const ofSettings = schemaUtils.get(key) ?? new WeakMap<RJSFSchema, ReturnType<typeof createSchemaUtils>>();
  schemaUtils.set(key, ofSettings);
  const utils = ofSettings.get(schema) ?? createSchemaUtils({ validator, defaultFormStateBehavior: settings }, schema);
  ofSettings.set(schema, utils);
  return utils;
}

function fill(schema: RJSFSchema, data: unknown, initialDefaultsGenerated = false, settings?: Settings): unknown {
  return utilsOf(schema, settings).getDefaultFormState(schema, data, false, initialDefaultsGenerated);
}

function withProperty(schema: RJSFSchema, key: string): RJSFSchema {
  return { ...schema, properties: { ...schema.properties, [key]: { type: 'string' } } };
}

function without(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return value;
  }
  return Object.fromEntries(Object.entries(value).filter(([other]) => other !== key));
}

function* leavesOf(value: unknown, path: Path = []): Generator<[Path, unknown]> {
  if (typeof value === 'object' && value !== null) {
    for (const [key, held] of Object.entries(value)) {
      yield* leavesOf(held, [...path, Array.isArray(value) ? Number(key) : key]);
    }
  } else if (value !== undefined) {
    yield [path, value];
  }
}

function at(value: unknown, path: Path): unknown {
  return path.reduce<unknown>(
    (held, key) =>
      typeof held === 'object' && held !== null
        ? Object.entries(held).find(([k]) => k === String(key))?.[1]
        : undefined,
    value,
  );
}

/** `value` with what it holds at `path` taken out: a key removed, an item left empty */
function withoutAt(value: unknown, path: Path): unknown {
  if (typeof value !== 'object' || value === null || path.length === 0) {
    return value;
  }
  const [key, ...rest] = path;
  if (Array.isArray(value)) {
    const emptied = rest.length === 0 ? undefined : withoutAt(value[Number(key)], rest);
    return value.map((item: unknown, index) => (index === key ? emptied : item));
  }
  const entries = Object.entries(value).filter(([other]) => rest.length > 0 || other !== key);
  return Object.fromEntries(entries.map(([other, held]) => [other, other === key ? withoutAt(held, rest) : held]));
}

/**
 * Says whether the defaults of `schema` give `data` the value it holds at a path: taken out, the fill puts it back. A
 * default of an object or array around it gives it too, and that one only fills once what it is declared on is gone,
 * so the value is taken out along with each of the values it is in. The whole data is taken out first, which answers
 * for most values with one fill
 */
function givenBy(schema: RJSFSchema, data: unknown): (path: Path) => boolean {
  const refills = new Map<string, unknown>();
  const refilled = (taken: Path) => {
    const key = taken.join('.');
    if (!refills.has(key)) {
      refills.set(key, fill(schema, taken.length === 0 ? undefined : withoutAt(data, taken)));
    }
    return refills.get(key);
  };
  return (path) => {
    const taken = [[], ...path.map((_key, depth) => path.slice(0, path.length - depth))];
    return taken.some((prefix) => isDeepStrictEqual(at(refilled(prefix), path), at(data, path)));
  };
}

function withoutAdditional(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(withoutAdditional);
  }
  if (typeof schema !== 'object' || schema === null) {
    return schema;
  }
  const kept = Object.entries(schema).filter(([key]) => key !== 'additionalProperties');
  return Object.fromEntries(kept.map(([key, held]) => [key, withoutAdditional(held)]));
}

/**
 * The data of `schema` that its named fields hold. What `additionalProperties` would let through is left out: a value
 * whose field a condition withdraws is dropped, even where the object would carry its key along
 */
function declared(schema: RJSFSchema, data: unknown): unknown {
  const named: RJSFSchema = { ...schema, ...Object(withoutAdditional(schema)) };
  delete named.additionalProperties;
  return utilsOf(named).omitExtraData(named, data);
}

function keyed(leaves: [Path, unknown][]): Record<string, unknown> {
  return Object.fromEntries(leaves.map(([path, value]) => [path.join('.'), value]));
}

/** An invariant of a case with two schemas. A schema with nothing to differ in gives two equal ones, which say nothing */
function between(holds: (first: RJSFSchema, second: RJSFSchema, data: unknown) => Failure | undefined) {
  return ({ schema, data }: Case) => {
    const [first, second] = [firstOf(schema), secondOf(schema)];
    return isDeepStrictEqual(first, second) ? undefined : holds(first, second, data);
  };
}

/** Mounts a form seeded with the case and hands back how to read, edit and re-render it */
function mount({ schema, data, settings }: Case) {
  const ref = createRef<FormRef>();
  const element = (next: RJSFSchema) => (
    <Form schema={next} validator={validator} initialFormData={data} defaultFormStateBehavior={settings} ref={ref} />
  );
  const view = render(element(schema));
  const form = () => {
    if (!ref.current) {
      throw new Error('The form did not mount');
    }
    return ref.current;
  };
  return {
    read: (): unknown => structuredClone(form().getFormData()),
    setSchema: (next: RJSFSchema) => view.rerender(element(next)),
    edit: (key: string, value: unknown) => act(() => form().setFieldValue([key], value)),
    write: (path: Path, value: unknown) => act(() => form().setFieldValue(path, value)),
    reset: () => act(() => form().reset()),
    unmount: () => view.unmount(),
  };
}

function withForm(testCase: Case, body: (form: ReturnType<typeof mount>) => Failure | undefined): Failure | undefined {
  const form = mount(testCase);
  try {
    return body(form);
  } finally {
    form.unmount();
  }
}

const invariants: Record<string, (testCase: Case) => Failure | undefined> = {
  'utils: filling filled data again changes nothing': ({ schema, data, settings }) => {
    const filled = fill(schema, data, false, settings);
    return compare(filled, fill(schema, filled, true, settings));
  },
  'utils: filling filled data as a first render changes nothing': ({ schema, data, settings }) => {
    const filled = fill(schema, data, false, settings);
    return compare(filled, fill(schema, filled, false, settings));
  },
  'form: mount holds what the utility fills': (testCase) =>
    withForm(testCase, (form) => compare(fill(testCase.schema, testCase.data, false, testCase.settings), form.read())),
  'form: a re-render with an equal schema changes nothing': (testCase) =>
    withForm(testCase, (form) => {
      const before = form.read();
      form.setSchema(structuredClone(testCase.schema));
      return compare(before, form.read());
    }),
  'form: an edit of one field changes no other': (testCase) =>
    withForm({ ...testCase, schema: withProperty(testCase.schema, 'zz') }, (form) => {
      const before = form.read();
      form.edit('zz', 'v');
      return compare(without(before, 'zz'), without(form.read(), 'zz'));
    }),
  'form: adding an optional property to the schema changes no other': (testCase) =>
    withForm(testCase, (form) => {
      const before = form.read();
      form.setSchema(withProperty(testCase.schema, 'ww'));
      return compare(without(before, 'ww'), without(form.read(), 'ww'));
    }),
  'form: reset() gives the data of the mount': (testCase) =>
    withForm(testCase, (form) => {
      const before = form.read();
      form.reset();
      return compare(before, form.read());
    }),
  // What a fresh form of the second schema holds is what the utility fills, by the invariant of the mount above
  [FOLLOWS]: between((first, second) =>
    withForm({ schema: first, data: undefined }, (form) => {
      form.setSchema(second);
      return compare(fill(second, undefined), form.read());
    }),
  ),
  // What the form holds after its mount is what the utility fills, by the invariant of the mount above. That tells the
  // cases with nothing to check before any form is mounted
  [STAYS]: between((first, second, data) => {
    const before = fill(first, data);
    const isGiven = givenBy(first, before);
    const kept = [...leavesOf(data)].filter(([path, value]) => isDeepStrictEqual(at(before, path), value));
    const given = kept.filter(([path]) => isGiven(path));
    // What a default gave follows the new one, which can withdraw the field a seeded value sits in. A fresh form of
    // the second schema, seeded with only what no default gave, says which of those values still have their field
    const fresh = declared(
      second,
      fill(
        second,
        given.reduce((seed, [path]) => withoutAt(seed, path), data),
      ),
    );
    const entered = kept.filter((leaf) => !given.includes(leaf) && isDeepStrictEqual(at(fresh, leaf[0]), leaf[1]));
    if (entered.length === 0) {
      return undefined;
    }
    return withForm({ schema: first, data }, (form) => {
      form.setSchema(second);
      const after = form.read();
      return compare(keyed(entered), keyed(entered.map(([path]) => [path, at(after, path)])));
    });
  }),
  [OWNED]: between((first, second, data) =>
    withForm({ schema: first, data }, (form) => {
      for (const schema of [second, first]) {
        form.setSchema(schema);
        const held = form.read();
        const isGiven = givenBy(schema, held);
        const strays = [...leavesOf(held)].filter(
          ([path, value]) => !isDeepStrictEqual(at(data, path), value) && !isGiven(path),
        );
        if (strays.length > 0) {
          const refilled = strays.map(([path]): [Path, unknown] => [
            path,
            at(fill(schema, withoutAt(held, path)), path),
          ]);
          return { kind: 'differs', expected: keyed(refilled), actual: keyed(strays) };
        }
      }
      return undefined;
    }),
  ),
  [RESTORES]: between((first, second) =>
    withForm({ schema: first, data: undefined }, (form) => {
      const before = form.read();
      form.setSchema(second);
      form.setSchema(first);
      return compare(before, form.read());
    }),
  ),
  [REPLAYS]: between((first, second) => replays(first, second)),
};

/** `value` holding `entered` at `path`, with an object made for each key on the way that holds none */
function withAt(value: unknown, path: Path, entered: unknown): unknown {
  if (path.length === 0) {
    return entered;
  }
  const [key, ...rest] = path;
  const held: Record<string, unknown> = typeof value === 'object' && value !== null ? { ...value } : {};
  return { ...held, [key]: withAt(held[String(key)], rest, entered) };
}

/** Another value of the type of `value` that the generator's schemas use, for a person to have entered in its place */
function another(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return !value;
  }
  if (typeof value === 'number') {
    return (value + 1) % 3;
  }
  const strings = ['a', 'b', 'c', 'x', 'y'];
  return strings[(strings.indexOf(String(value)) + 1) % strings.length];
}

/**
 * The model the origins are built to match: a form holds what a fresh one would, given only what a person entered.
 * A form of the first schema has up to two of its filled values written over, as a person would, and is rendered with
 * the second, whose defaults differ. It must then hold what the second schema fills around those edits alone. Only
 * values outside arrays are written, since a row has no place of its own in data holding nothing else, and both sides
 * are read through the fields the second schema declares, since a field it withdraws takes its value along, and leaf by
 * leaf, since an empty object or array says nothing of who filled it
 */
function replays(first: RJSFSchema, second: RJSFSchema): Failure | undefined {
  const filled = fill(first, undefined);
  // The `kind` of an option is what the form shows the option by, which no field of it lets a person write
  const leaves = [...leavesOf(filled)].filter(
    ([path, value]) => value !== null && path.every((key) => typeof key === 'string' && key !== 'kind'),
  );
  if (leaves.length === 0) {
    return undefined;
  }
  // Spread over the leaves by their number, so the case decides which are written without a source of its own
  const picked = [leaves[(leaves.length % 3) % leaves.length], leaves[(leaves.length * 7 + 1) % leaves.length]];
  const edits = picked
    .filter((leaf, index) => picked.indexOf(leaf) === index)
    .map(([path, value]): [Path, unknown] => [path, another(value)]);
  return withForm({ schema: first, data: undefined }, (form) => {
    edits.forEach(([path, value]) => form.write(path, value));
    const edited = form.read();
    // A person enters what the field takes: a value its `const` or `enum` rejects is judged by another rule
    if (!utilsOf(first).getValidator().isValid(first, edited, first)) {
      return undefined;
    }
    // An edit can close the branch a later one is in, which then is no edit of a field the form shows
    const made = edits.filter(([path, value]) => isDeepStrictEqual(at(edited, path), value));
    form.setSchema(second);
    const model = declared(
      second,
      fill(
        second,
        made.reduce<unknown>((data, [path, value]) => withAt(data, path, value), undefined),
      ),
    );
    // A filled value stays where no default gives one any more, so the form may hold more than the model: what it
    // held before the change, at a place the model fills nothing in
    const held = [...leavesOf(declared(second, form.read()))].filter(
      ([path, value]) => at(model, path) !== undefined || !isDeepStrictEqual(at(edited, path), value),
    );
    return compare(keyed([...leavesOf(model)]), keyed(held));
  });
}

/** How the second schema of an invariant's cases differs from the first, for the invariants that re-render with one */
const differences: Partial<Record<string, Difference>> = {
  [FOLLOWS]: 'changedDefaults',
  [STAYS]: 'defaults',
  [OWNED]: 'constraints',
  [RESTORES]: 'fields',
  [REPLAYS]: 'changedDefaults',
};

/** What the form is known not to do yet, by the mechanism behind it */
const GAPS = {
  optionRow:
    'An object row of a tuple, or of a list whose items offer options, that the default of its item filled in does not take a new default whole: a key the new default leaves out stays',
  additionalItemsRow:
    'A seeded tuple row beyond `items` that equals the default of `additionalItems` follows that default, which the fill never gives to a row',
};

/**
 * The seeds of the default range that fail an invariant for a known gap. A seed outside this list that fails is a
 * regression; a seed in it that passes means the gap is closed there, and the seed is to be taken off the list
 */
const KNOWN_GAPS: Partial<Record<string, { gap: keyof typeof GAPS; seeds: number[] }[]>> = {
  [FOLLOWS]: [{ gap: 'optionRow', seeds: [165] }],
  [STAYS]: [{ gap: 'additionalItemsRow', seeds: [191] }],
};

const UNDER_SETTINGS = 'under generated settings: ';

/** The case of a seed for an invariant, or, for one named as checked under settings, that case with the seed's settings */
function caseFor(name: string, seed: number): Case {
  if (name.startsWith(UNDER_SETTINGS)) {
    return { ...caseOf(seed), settings: settingsOf(seed) };
  }
  return caseOf(seed, differences[name]);
}

function check(name: string, testCase: Case): Failure | undefined {
  const invariant = invariants[name.startsWith(UNDER_SETTINGS) ? name.slice(UNDER_SETTINGS.length) : name];
  try {
    return invariant(testCase);
  } catch (error) {
    return { kind: 'throws', message: error instanceof Error ? error.message.slice(0, 200) : String(error) };
  }
}

/** The failing case of `seed`, shrunk while it keeps failing `name` the way `failure` does */
function shrunk(name: string, seed: number, failure: Failure): Example {
  const smallest = shrink(caseFor(name, seed), (candidate) => {
    // A root that is no object with properties is not a form the generator makes
    if (candidate.schema.type !== 'object' || !candidate.schema.properties) {
      return false;
    }
    const again = check(name, candidate);
    return again?.kind === failure.kind && (failure.kind !== 'throws' || again.message === failure.message);
  });
  const other = differences[name] ? { other: secondOf(smallest.schema) } : {};
  return {
    seed,
    schema: firstOf(smallest.schema),
    ...other,
    ...(smallest.settings && { settings: smallest.settings }),
    data: smallest.data,
    ...check(name, smallest),
    kind: failure.kind,
  };
}

// The invariants of one schema hold whatever the form's settings are, so each is checked again with settings drawn for
// the seed. Those of two schemas compare with a fresh fill of the second, which the settings change the meaning of
const names = [
  ...Object.keys(invariants),
  ...Object.keys(invariants)
    .filter((name) => !differences[name])
    .map((name) => `${UNDER_SETTINGS}${name}`),
];

describe('invariants of the fill and the sanitize, over generated schemas', () => {
  setupConsoleErrorSuppression();
  setupConsoleWarnSuppression();

  it.each(names)(
    '%s',
    (name) => {
      const last = FIRST_SEED + (differences[name] ? RUNS_BETWEEN : RUNS);
      const failing = new Map<number, Failure>();
      for (let seed = FIRST_SEED; seed < last; seed += 1) {
        const failure = check(name, caseFor(name, seed));
        if (failure) {
          failing.set(seed, failure);
        }
      }
      const known = (KNOWN_GAPS[name] ?? []).map(({ gap, seeds }) => ({
        gap,
        mechanism: GAPS[gap],
        seeds: seeds.filter((seed) => seed >= FIRST_SEED && seed < last),
      }));
      const listed = new Set(process.env.INVARIANT_ALL ? [] : known.flatMap(({ seeds }) => seeds));
      const unlisted = [...failing].filter(([seed]) => !listed.has(seed));
      const examples = unlisted.slice(0, SHRUNK_PER_INVARIANT).map(([seed, failure]) => shrunk(name, seed, failure));
      const closed = known
        .map((gap) => ({ ...gap, seeds: gap.seeds.filter((seed) => !failing.has(seed)) }))
        .filter(({ seeds }) => seeds.length > 0);
      // The shrunk cases come first, so a failure shows a schema small enough to read. Only a seed that is not listed
      // is shrunk: a listed one is known by its gap
      expect({ examples, seeds: unlisted.map(([seed]) => seed), closed }).toEqual({
        examples: [],
        seeds: [],
        closed: [],
      });
    },
    120_000,
  );
});
