import { getDefaultFormState } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { userEvent } from '@testing-library/user-event';

import {
  asyncOutcome,
  outcome,
  pendingFor,
  pendingTitles,
  repeatedPasses,
  shapeTitle,
  slug,
  toBaselineText,
} from '../../../../testing/schemaGraphParity/baseline.ts';
import { PARITY_SHAPE_TIMEOUT, parityCorpus, parityFamilies } from '../../../../testing/schemaGraphParity/corpus.ts';
import type { ParityShape } from '../../../../testing/schemaGraphParity/types.ts';
import { createFormComponent } from '../testUtils.tsx';

const user = userEvent.setup();

function behaviorOf({ populate }: ParityShape) {
  return populate ? { allOf: 'populateDefaults' as const } : undefined;
}

function recordDefaults(shape: ParityShape) {
  const { schema, formData } = shape;
  const defaultFormStateBehavior = behaviorOf(shape);
  return outcome(() =>
    repeatedPasses(
      (data) =>
        getDefaultFormState({ validator, defaultFormStateBehavior }, { schema, rootSchema: schema, formData: data }),
      formData,
    ),
  );
}

function expandButtons(node: Element) {
  return [...node.querySelectorAll('button')].filter((button) => button.textContent === 'Expand Cycle');
}

function rendered(node: Element) {
  return {
    inputs: [...node.querySelectorAll('input[id], select[id], textarea[id]')].map(({ id }) => id),
    expandButtons: expandButtons(node).map(({ id }) => id),
  };
}

/** Each click renders the button the next one presses, so they run one after another */
async function clickInOrder(node: Element, ids: readonly string[]): Promise<void> {
  const [id, ...rest] = ids;
  if (id === undefined) {
    return;
  }
  const button = expandButtons(node).find((candidate) => candidate.id === id);
  if (!button) {
    throw new Error(`No Expand button #${id}`);
  }
  await user.click(button);
  await clickInOrder(node, rest);
}

async function recordRender(shape: ParityShape, interact: boolean) {
  const { node } = createFormComponent({
    schema: shape.schema,
    formData: shape.formData,
    defaultFormStateBehavior: behaviorOf(shape),
  });
  const initial = rendered(node);
  if (!interact) {
    return initial;
  }
  if (shape.selectOption !== undefined) {
    const select = node.querySelector('select[id$="anyof_select"], select[id$="oneof_select"]');
    if (!(select instanceof HTMLSelectElement)) {
      throw new Error(`${shape.name} renders no option select`);
    }
    await user.selectOptions(select, select.options[shape.selectOption]);
    return { ...initial, afterSelectingOption: { option: shape.selectOption, ...rendered(node) } };
  }
  const clicks = shape.expand ?? initial.expandButtons.slice(0, 1);
  await clickInOrder(node, clicks);
  return clicks.length > 0 ? { ...initial, afterClicking: { clicked: clicks, ...rendered(node) } } : initial;
}

describe('schema graph parity: getDefaultFormState under AJV and the rendered Form', () => {
  for (const family of parityFamilies) {
    describe(family, { timeout: PARITY_SHAPE_TIMEOUT }, () => {
      const shapes = parityCorpus[family];
      for (const title of pendingTitles(family, shapes, ['ajv8Defaults', 'render', 'interaction'])) {
        // oxlint-disable-next-line vitest/warn-todo -- v7 overflows the stack or runs out of memory here; a later stage enables it
        it.todo(title);
      }
      const running = shapes.filter(
        (shape) => !pendingFor(family, shape, 'ajv8Defaults') || !pendingFor(family, shape, 'render'),
      );
      for (const shape of running) {
        it(shapeTitle(shape), async () => {
          const interact = !pendingFor(family, shape, 'interaction');
          const record = {
            ...(pendingFor(family, shape, 'ajv8Defaults') ? {} : { getDefaultFormState: recordDefaults(shape) }),
            ...(pendingFor(family, shape, 'render')
              ? {}
              : { render: await asyncOutcome(() => recordRender(shape, interact)) }),
          };
          await expect(toBaselineText(record)).toMatchFileSnapshot(`./__baselines__/${family}/${slug(shape.name)}.txt`);
        });
      }
    });
  }
});
