import { createRef } from 'react';
import type { RJSFSchema } from '@rjsf/utils';
import { createSchemaUtils } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';
import { isDeepStrictEqual } from 'node:util';

import type { FormRef } from '../../src/index.ts';
import Form from '../../src/index.ts';
import { setupConsoleErrorSuppression, setupConsoleWarnSuppression } from '../testUtils.tsx';
import type { Case } from './generate.ts';
import { caseOf, shrink } from './generate.ts';

// Each seed names one generated schema and seed data. The run is a fixed range, so it fails the same way every time;
// `INVARIANT_RUNS` and `INVARIANT_SEED` widen or move it to look for new cases
const RUNS = Number(process.env.INVARIANT_RUNS ?? 300);
const FIRST_SEED = Number(process.env.INVARIANT_SEED ?? 1);
const SHRUNK_PER_INVARIANT = 3;

/** How a case breaks an invariant: the two values differ, differ only in keys held as `undefined`, or the code threw */
interface Failure {
  kind: 'differs' | 'undefinedOnly' | 'throws';
  expected?: unknown;
  actual?: unknown;
  message?: string;
}

/** A failing case, shrunk to the smallest schema and data that still fail the same way */
interface Example extends Case, Failure {
  seed: number;
}

function compare(expected: unknown, actual: unknown): Failure | undefined {
  if (isDeepStrictEqual(expected, actual)) {
    return undefined;
  }
  const kind = JSON.stringify(expected) === JSON.stringify(actual) ? 'undefinedOnly' : 'differs';
  return { kind, expected, actual };
}

function fill(schema: RJSFSchema, data: unknown, initialDefaultsGenerated = false): unknown {
  return createSchemaUtils({ validator }, schema).getDefaultFormState(schema, data, false, initialDefaultsGenerated);
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

/** Mounts a form seeded with the case and hands back how to read, edit and re-render it */
function mount({ schema, data }: Case) {
  const ref = createRef<FormRef>();
  const element = (next: RJSFSchema) => <Form schema={next} validator={validator} initialFormData={data} ref={ref} />;
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
  'utils: filling filled data again changes nothing': ({ schema, data }) => {
    const filled = fill(schema, data);
    return compare(filled, fill(schema, filled, true));
  },
  'utils: filling filled data as a first render changes nothing': ({ schema, data }) => {
    const filled = fill(schema, data);
    return compare(filled, fill(schema, filled));
  },
  'utils: sanitizing against the same schema, then filling, changes nothing': ({ schema, data }) => {
    const filled = fill(schema, data);
    const sanitized = createSchemaUtils({ validator }, schema).sanitizeDataForNewSchema(schema, schema, filled);
    return compare(filled, fill(schema, sanitized, true));
  },
  'form: mount holds what the utility fills': (testCase) =>
    withForm(testCase, (form) => compare(fill(testCase.schema, testCase.data), form.read())),
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
};

function check(name: string, testCase: Case): Failure | undefined {
  try {
    return invariants[name](testCase);
  } catch (error) {
    return { kind: 'throws', message: error instanceof Error ? error.message.slice(0, 200) : String(error) };
  }
}

/** The failing case of `seed`, shrunk while it keeps failing `name` the way `failure` does */
function shrunk(name: string, seed: number, failure: Failure): Example {
  const smallest = shrink(caseOf(seed), (candidate) => {
    // A root that is no object with properties is not a form the generator makes
    if (candidate.schema.type !== 'object' || !candidate.schema.properties) {
      return false;
    }
    const again = check(name, candidate);
    return again?.kind === failure.kind && (failure.kind !== 'throws' || again.message === failure.message);
  });
  return { seed, ...smallest, ...check(name, smallest), kind: failure.kind };
}

describe('invariants of the fill and the sanitize, over generated schemas', () => {
  setupConsoleErrorSuppression();
  setupConsoleWarnSuppression();

  it.each(Object.keys(invariants))(
    '%s',
    (name) => {
      const failing: { seed: number; failure: Failure }[] = [];
      for (let seed = FIRST_SEED; seed < FIRST_SEED + RUNS; seed += 1) {
        const failure = check(name, caseOf(seed));
        if (failure) {
          failing.push({ seed, failure });
        }
      }
      const examples = failing.slice(0, SHRUNK_PER_INVARIANT).map(({ seed, failure }) => shrunk(name, seed, failure));
      // The shrunk cases come first, so a failure shows a schema small enough to read
      expect({ examples, seeds: failing.map(({ seed }) => seed) }).toEqual({ examples: [], seeds: [] });
    },
    120_000,
  );
});
