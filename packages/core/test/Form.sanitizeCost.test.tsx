import { createRef } from 'react';
import type { FieldFill, FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import type { FormRef } from '../src/index.ts';
import Form from '../src/index.ts';
import { handleOf } from './testUtils.tsx';

const user = userEvent.setup();

// Counted, so a test can count the fills the sanitize makes to judge a field by its default, and those of the whole form
const fieldFills = vi.hoisted(() => ({ count: 0 }));
const formFills = vi.hoisted(() => ({ count: 0 }));
vi.mock(import('../../utils/src/schema/getDefaultFormState.ts'), async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: ((...args: Parameters<typeof actual.default>) => {
      if (args[1].schema === args[1].rootSchema) {
        formFills.count += 1;
      }
      return actual.default(...args);
    }) as typeof actual.default,
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
    // Under a second locally, but past 5 seconds on a loaded CI runner
  }, 30_000);

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

  it.each<{ held: string; schema: (form: RJSFSchema) => RJSFSchema }>([
    { held: 'the form', schema: (form) => form },
    {
      held: 'a definition the form refers to',
      schema: (form) => ({ $ref: '#/definitions/form', definitions: { form } }),
    },
    {
      // An `id` in data a schema holds names no resource that could rebase the `$ref`
      held: 'a definition the form refers to, beside examples holding an `id`',
      schema: (form) => ({ $ref: '#/definitions/form', definitions: { form }, examples: [{ id: 'x' }] }),
    },
  ])('fills the form a fixed number of times for a switch leaving many keys in $held', async ({ schema }) => {
    const properties: Record<string, RJSFSchema> = {};
    const left: Record<string, RJSFSchema> = {};
    const initialFormData: Record<string, string> = { kind: 's' };
    for (let index = 0; index < 50; index += 1) {
      properties[`s${index}`] = { type: 'string', default: 'd' };
      left[`a${index}`] = { type: 'string' };
      initialFormData[`a${index}`] = `v${index}`;
    }
    const form: RJSFSchema = {
      type: 'object',
      properties,
      additionalProperties: true,
      oneOf: [
        { title: 'S', properties: { kind: { const: 's' }, ...left } },
        { title: 'T', properties: { kind: { const: 't' } } },
      ],
    };
    const ref = createRef<FormRef>();
    const { container } = render(
      <Form ref={ref} schema={schema(form)} validator={validator} initialFormData={initialFormData} />,
    );
    formFills.count = 0;
    await user.selectOptions(container.querySelector('select')!, 'T');

    // Each key the switch leaves stays as an extra key, judged by one fill of the form without the object's keys, as
    // no condition reads them, rather than by one fill per key
    expect(handleOf(ref).getFormData()).toMatchObject({ ...initialFormData, kind: 't' });
    expect(formFills.count).toBeLessThanOrEqual(3);
  });
});
