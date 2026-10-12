import type { FieldProps, RJSFSchema } from '@rjsf/utils';
import { noop, toFieldPath, TranslatableString, englishStringTranslator } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import OptionalDataControlsField from '../src/components/fields/OptionalDataControlsField.tsx';
import { getTestRegistry } from '../src/testing.ts';

const user = userEvent.setup();

const ARRAY_OPTIONS: RJSFSchema[] = [
  { type: 'array', items: { type: 'string' } },
  { type: 'array', items: { type: 'number' } },
];

describe('OptionalDataControlsField', () => {
  function getProps(schema: RJSFSchema, onChange: FieldProps['onChange']): FieldProps {
    const registry = getTestRegistry(schema);
    return {
      autofocus: false,
      disabled: false,
      errorSchema: {},
      fieldPath: toFieldPath('optional'),
      formData: undefined,
      id: 'root_optional',
      name: 'optional',
      onBlur: noop,
      onChange,
      onFocus: noop,
      readonly: false,
      registry,
      required: false,
      schema,
    };
  }

  async function clickAdd(schema: RJSFSchema, formData?: unknown) {
    const onChange = vi.fn();
    render(<OptionalDataControlsField {...getProps(schema, onChange)} formData={formData} />);
    await user.click(screen.getByTitle(englishStringTranslator(TranslatableString.OptionalObjectAdd)));
    return onChange;
  }

  test.each<[string, RJSFSchema]>([
    ['an anyOf', { anyOf: ARRAY_OPTIONS }],
    ['a oneOf', { oneOf: ARRAY_OPTIONS }],
    // The options' type is the one the controls are rendered for, so it wins over the object's own
    ['an object with an anyOf', { type: 'object', properties: { p: { type: 'string' } }, anyOf: ARRAY_OPTIONS }],
  ])('adding data to %s whose options are all arrays stores an empty array', async (_, schema) => {
    const onChange = await clickAdd(schema);
    expect(onChange).toHaveBeenCalledWith([], toFieldPath('optional'));
  });

  test.each<[string, RJSFSchema, unknown]>([
    ['object', { type: ['object', 'null'], properties: { a: { type: 'string', default: 'x' } } }, { a: 'x' }],
    ['array', { type: ['array', 'null'], items: { type: 'string' } }, []],
  ])('adding data to a nullable %s holding null stores the container', async (_, schema, expected) => {
    const onChange = await clickAdd(schema, null);
    expect(onChange).toHaveBeenCalledWith(expected, toFieldPath('optional'));
  });
});
