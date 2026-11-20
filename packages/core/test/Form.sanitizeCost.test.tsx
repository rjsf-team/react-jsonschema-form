import { createRef } from 'react';
import type { FieldFill, FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef } from '../src/index.ts';
import Form from '../src/index.ts';
import { handleOf } from './testUtils.tsx';

const user = userEvent.setup();

// Counted, so a test can count the fills the sanitize makes to judge a field by its default
const fieldFills = vi.hoisted(() => ({ count: 0 }));
vi.mock(import('../../utils/src/schema/getDefaultFormState.ts'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fieldFillOf: <S extends StrictRJSFSchema, F extends FormContextType>(
      context: SchemaContext<S, F>,
      schema: S,
      rootSchema: S,
      fill: FieldFill,
    ) => {
      fieldFills.count += 1;
      return actual.fieldFillOf(context, schema, rootSchema, fill);
    },
  };
});

/** An object `depth` levels deep, `width` properties at each, its string leaves declaring `leafDefault` */
function nested(depth: number, width: number, leafDefault = 'x'): RJSFSchema {
  if (depth === 0) {
    return { type: 'string', default: leafDefault };
  }
  const properties: Record<string, RJSFSchema> = {};
  for (let index = 0; index < width; index += 1) {
    properties[`p${index}`] = nested(depth - 1, width, leafDefault);
  }
  return { type: 'object', properties, default: {} };
}

describe('the fills the sanitize of a deep form makes', () => {
  it('fills a form whose fields decide nothing from data once per side on a schema change', () => {
    const schema = nested(6, 3);
    const ref = createRef<FormRef>();
    const { rerender } = render(<Form ref={ref} schema={schema} validator={validator} />);
    const before = handleOf(ref).getFormData();
    fieldFills.count = 0;
    // A schema that differs by value, as `Form` compares schemas, while every field stays as it was
    rerender(<Form ref={ref} schema={{ ...structuredClone(schema), $comment: 'changed' }} validator={validator} />);

    expect(handleOf(ref).getFormData()).toEqual(before);
    expect(fieldFills.count).toBeLessThanOrEqual(2);
  });

  it('makes no fill as the user types into a leaf of a deep form', async () => {
    const { container } = render(<Form schema={nested(6, 3)} validator={validator} />);
    const input = container.querySelector<HTMLInputElement>('input[type=text]')!;
    fieldFills.count = 0;
    await user.type(input, 'abcd');

    // The edited value and the fields holding it are the user's, so no field is judged and nothing is filled
    expect(fieldFills.count).toBe(0);
  });

  it('fills a switch between two deep options a fixed number of times, whatever their depth', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        pick: {
          oneOf: [
            { title: 'A', ...nested(4, 3, 'a') },
            { title: 'B', ...nested(4, 3, 'b') },
          ],
        },
      },
    };
    const { container } = render(<Form schema={schema} validator={validator} />);
    fieldFills.count = 0;
    await user.selectOptions(container.querySelector('select')!, 'B');

    // The options decide from data, so each is filled by itself on each side, as many times whatever their depth
    expect(fieldFills.count).toBeLessThanOrEqual(10);
  });
});
