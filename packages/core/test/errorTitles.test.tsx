import type { RJSFSchema, RJSFValidationError, UiSchema } from '@rjsf/utils';
import { userEvent } from '@testing-library/user-event';

import type { NoValFormProps } from './testUtils.tsx';
import { createFormComponent, submitForm } from './testUtils.tsx';

const user = userEvent.setup();

/** The text of the label the form renders for the field with the given id, without the required marker */
function renderedLabel(node: Element, id: string): string {
  const label = node.querySelector(`label[for="${id}"]`);
  if (!label) {
    throw new Error(`No label is rendered for #${id}`);
  }
  return (label.textContent ?? '').replace(/\*$/, '');
}

/** Renders the form, submits it and returns the errors it hands `onError` */
async function submittedErrors(props: Omit<NoValFormProps, 'onError'>) {
  const onError = vi.fn<(errors: RJSFValidationError[]) => void>();
  const { node } = createFormComponent({ ...props, onError });
  await submitForm(node, user);
  expect(onError).toHaveBeenCalledTimes(1);
  return { node, errors: onError.mock.lastCall?.[0] ?? [] };
}

const field = (schema: RJSFSchema): RJSFSchema => ({ type: 'object', properties: { p: schema } });

// The expected titles aren't written by hand: each is the label the form renders for the error's field
describe('an error is titled by the label the form renders for its field', () => {
  it.each<[string, RJSFSchema, unknown, UiSchema | undefined, string, string]>([
    [
      "a field's own title beside an allOf entry's",
      field({ title: 'Field', allOf: [{ title: 'Branch', type: 'string' }] }),
      { p: 1 },
      undefined,
      '.p',
      'root_p',
    ],
    [
      "an allOf entry's title where the field has none",
      field({ allOf: [{ title: 'Branch', type: 'string' }] }),
      { p: 1 },
      undefined,
      '.p',
      'root_p',
    ],
    [
      "a then's title where the field has none",
      field({ type: 'number', if: { type: 'number' }, then: { title: 'Branch', minimum: 5 } }),
      { p: 1 },
      undefined,
      '.p',
      'root_p',
    ],
    [
      "a field's own title beside its $ref target's",
      { $defs: { D: { title: 'Definition', type: 'string' } }, ...field({ title: 'Field', $ref: '#/$defs/D' }) },
      { p: 1 },
      undefined,
      '.p',
      'root_p',
    ],
    [
      "the title a parent's then redeclares a property with",
      {
        type: 'object',
        properties: { x: { type: 'string' }, p: { title: 'Field', type: 'number' } },
        if: { required: ['x'] },
        then: { properties: { p: { title: 'Branch', minimum: 5 } } },
      },
      { x: 'on', p: 1 },
      undefined,
      '.p',
      'root_p',
    ],
    [
      "an array item's ui:title under items",
      {
        type: 'object',
        properties: {
          arr: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string', title: 'Name', minLength: 3 } } },
          },
        },
      },
      { arr: [{ name: 'x' }] },
      { arr: { items: { name: { 'ui:title': 'Item name' } } } },
      '.arr.0.name',
      'root_arr_0_name',
    ],
    [
      'a property of the oneOf option the data picks',
      field({
        type: 'object',
        oneOf: [
          { title: 'A', properties: { a: { type: 'string', title: 'Aa' } }, required: ['a'] },
          { title: 'B', properties: { b: { type: 'number', title: 'Bb', minimum: 5 } }, required: ['b'] },
        ],
      }),
      { p: { b: 1 } },
      undefined,
      '.p.b',
      'root_p_b',
    ],
    [
      "a draft-07 tuple item's $ref target title",
      {
        $schema: 'http://json-schema.org/draft-07/schema#',
        definitions: { N: { title: 'Num', type: 'number', minimum: 5 } },
        type: 'object',
        properties: { t: { type: 'array', items: [{ $ref: '#/definitions/N' }] } },
      },
      { t: [1] },
      undefined,
      '.t.0',
      'root_t_0',
    ],
    [
      "a property's own title where a then redeclares it as an untitled $ref",
      {
        $defs: {
          Short: { type: 'string', minLength: 3 },
          T: {
            type: 'object',
            properties: { k: { type: 'string' }, n: { type: 'string', title: 'N' } },
            if: { required: ['k'] },
            then: { properties: { n: { $ref: '#/$defs/Short' } } },
          },
        },
        type: 'object',
        properties: { a: { $ref: '#/$defs/T' } },
      },
      { a: { k: 'on', n: 'a' } },
      undefined,
      '.a.n',
      'root_a_n',
    ],
  ])('takes %s', async (_, schema, initialFormData, uiSchema, property, id) => {
    const submitted = await submittedErrors({ schema, initialFormData, uiSchema, noHtml5Validate: true });
    const { node } = submitted;
    const errors = submitted.errors.filter((error) => error.property === property);
    expect(errors).not.toEqual([]);
    const label = renderedLabel(node, id);
    expect(label).not.toBe('');
    expect(errors.map((error) => error.title)).toEqual(errors.map(() => label));
  });
});
