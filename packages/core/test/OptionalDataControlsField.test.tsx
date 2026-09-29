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
const OBJECT_OPTIONS: RJSFSchema[] = [
  { type: 'object', properties: { a: { type: 'string' } } },
  { type: 'object', properties: { b: { type: 'string' } } },
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

  async function clickAdd(schema: RJSFSchema, withoutDefault = false) {
    const onChange = vi.fn();
    const props = getProps(schema, onChange);
    if (withoutDefault) {
      // getDefaultFormState() supplies `{}` or `[]` for these schemas itself, so the fallback is only reached when it
      // is made to return nothing
      vi.spyOn(props.registry.schemaUtils, 'getDefaultFormState').mockReturnValue(undefined);
    }
    render(<OptionalDataControlsField {...props} />);
    await user.click(screen.getByTitle(englishStringTranslator(TranslatableString.OptionalObjectAdd)));
    return onChange;
  }

  test.each([
    ['anyOf', { anyOf: ARRAY_OPTIONS }],
    ['oneOf', { oneOf: ARRAY_OPTIONS }],
  ])('adding data to an %s whose options are all arrays stores an empty array', async (_, schema) => {
    const onChange = await clickAdd(schema);
    expect(onChange).toHaveBeenCalledWith([], toFieldPath('optional'), {});
  });

  test('adding data to an anyOf whose options are all objects stores an empty object', async () => {
    const onChange = await clickAdd({ anyOf: OBJECT_OPTIONS }, true);
    expect(onChange).toHaveBeenCalledWith({}, toFieldPath('optional'), {});
  });

  test('adding data to an array stores an empty array', async () => {
    const onChange = await clickAdd({ type: 'array', items: { type: 'string' } }, true);
    expect(onChange).toHaveBeenCalledWith([], toFieldPath('optional'), {});
  });

  test('adding data to an array whose anyOf options name no type stores an empty array', async () => {
    const onChange = await clickAdd(
      { type: 'array', items: { type: 'string' }, anyOf: [{ minItems: 1 }, { maxItems: 3 }] },
      true,
    );
    expect(onChange).toHaveBeenCalledWith([], toFieldPath('optional'), {});
  });
});
