import { createHash } from 'node:crypto';

import {
  outcome,
  pendingFor,
  pendingTitles,
  repeatedPasses,
  shapeTitle,
  slug,
  toBaselineText,
} from '../../../../testing/schemaGraphParity/baseline.ts';
import { parityCorpus, parityFamilies } from '../../../../testing/schemaGraphParity/corpus.ts';
import { pendingSurfaces } from '../../../../testing/schemaGraphParity/pending.ts';
import type { ParityShape } from '../../../../testing/schemaGraphParity/types.ts';
import type { DefaultFormStateBehavior, ValidatorType } from '../../src/index.ts';
import {
  ADDITIONAL_PROPERTY_FLAG,
  getDefaultFormState,
  GUESSED_TYPE_FLAG,
  retrieveSchema,
  RJSF_REF_CYCLE_KEY,
  RJSF_REF_KEY,
} from '../../src/index.ts';

// Every `if` and option matches, as with the other utils schema tests, so the baseline records the resolver alone;
// the core suite records the same shapes under AJV
const validator: ValidatorType = {
  validateFormData: () => ({ errors: [], errorSchema: {} }),
  isValid: () => true,
  rawValidation: () => ({}),
};

const symbolNames = new Map<symbol, string>([
  [RJSF_REF_KEY, 'RJSF_REF_KEY'],
  [RJSF_REF_CYCLE_KEY, 'RJSF_REF_CYCLE_KEY'],
  [ADDITIONAL_PROPERTY_FLAG, 'ADDITIONAL_PROPERTY_FLAG'],
  [GUESSED_TYPE_FLAG, 'GUESSED_TYPE_FLAG'],
]);

const presets: Record<string, DefaultFormStateBehavior | undefined> = {
  default: undefined,
  populateDefaults: { allOf: 'populateDefaults' },
  skipEmptyDefaults: { emptyObjectFields: 'skipEmptyDefaults' },
};

// The dense graphs resolve to megabytes, which a reviewer can't read anyway
const LARGEST_RECORDED_SCHEMA = 50_000;

function recorded(schema: unknown) {
  const text = toBaselineText(schema, symbolNames);
  if (text.length <= LARGEST_RECORDED_SCHEMA) {
    return schema;
  }
  return { length: text.length, sha256: createHash('sha256').update(text).digest('hex') };
}

function recordRetrieveSchema({ schema, formData }: ParityShape) {
  return outcome(() => {
    const once = retrieveSchema({ validator }, schema, schema, formData);
    const twice = retrieveSchema({ validator }, once, schema, formData);
    const same = toBaselineText(twice, symbolNames) === toBaselineText(once, symbolNames);
    return { once: recorded(once), onItsOutput: same ? 'same' : recorded(twice) };
  });
}

function recordDefaults({ schema, formData }: ParityShape) {
  return Object.fromEntries(
    Object.entries(presets).map(([preset, defaultFormStateBehavior]) => [
      preset,
      outcome(() =>
        repeatedPasses(
          (data) =>
            getDefaultFormState(
              { validator, defaultFormStateBehavior },
              { schema, rootSchema: schema, formData: data },
            ),
          formData,
        ),
      ),
    ]),
  );
}

/** The populate variants of a captured root record the same thing here, since every preset runs on every shape */
function distinctSchemas(shapes: readonly ParityShape[]) {
  const seen = new Set<string>();
  return shapes.filter(({ schema, formData }) => {
    const key = toBaselineText({ schema, formData });
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

describe('schema graph parity corpus', () => {
  it.each(parityFamilies)('gives every %s shape its own baseline file', (family) => {
    const slugs = parityCorpus[family].map(({ name }) => slug(name));
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('lists only pending surfaces of shapes in the corpus', () => {
    const unknown = pendingSurfaces.filter(
      ({ family, name }) => !parityCorpus[family].some((shape) => shape.name === name),
    );
    expect(unknown).toEqual([]);
  });
});

describe('schema graph parity: retrieveSchema and getDefaultFormState', () => {
  for (const family of parityFamilies) {
    describe(family, () => {
      const shapes = distinctSchemas(parityCorpus[family]);
      for (const title of pendingTitles(family, shapes, ['retrieveSchema', 'getDefaultFormState'])) {
        // oxlint-disable-next-line vitest/warn-todo -- v7 overflows the stack or runs out of memory here; a later stage enables it
        it.todo(title);
      }
      const running = shapes.filter(
        (shape) => !pendingFor(family, shape, 'retrieveSchema') || !pendingFor(family, shape, 'getDefaultFormState'),
      );
      for (const shape of running) {
        it(shapeTitle(shape), async () => {
          const record = {
            ...(pendingFor(family, shape, 'retrieveSchema') ? {} : { retrieveSchema: recordRetrieveSchema(shape) }),
            ...(pendingFor(family, shape, 'getDefaultFormState') ? {} : { getDefaultFormState: recordDefaults(shape) }),
          };
          await expect(toBaselineText(record, symbolNames)).toMatchFileSnapshot(
            `./__baselines__/${family}/${slug(shape.name)}.txt`,
          );
        });
      }
    });
  }
});
