import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';
import CheckboxWidget from '../src/widgets/CheckboxWidget/CheckboxWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('CheckboxWidget', () => {
  // React reads either of these as "no `checked` prop" and mounts the input uncontrolled: it then keeps whatever the
  // user clicked even though the value it was given never changed. `null` is what a `type: ['boolean', 'null']` field
  // holds, and `undefined` what any boolean the form has no data for holds
  test.each([
    ['no value at all', undefined],
    ['a null value', null],
  ])('stays in step with %s', async (_, value) => {
    const onChange = vi.fn();
    const { getByRole } = render(<CheckboxWidget {...makeWidgetMockProps({ value, onChange })} />);

    const checkbox = getByRole('checkbox');
    await user.click(checkbox);

    expect(onChange).toHaveBeenCalledWith(true);
    expect(checkbox).toHaveProperty('checked', false);
  });

  // HTML5 constraint validation fails an unchecked required box and blocks the submit before RJSF sees it, with
  // nothing on the screen to say why, so the attribute has to follow `schemaRequiresTrueValue()` rather than the
  // `required` prop a parent's `required` list sets
  describe('the required attribute', () => {
    const agree: RJSFSchema = { type: 'boolean', title: 'Agree' };

    function renderForm(fieldSchema: RJSFSchema) {
      const schema: RJSFSchema = { type: 'object', required: ['agree'], properties: { agree: fieldSchema } };
      const onSubmit = vi.fn();
      const onError = vi.fn();
      const { container } = render(
        <Form schema={schema} validator={validator} onSubmit={onSubmit} onError={onError} />,
      );
      return { container, onSubmit, onError, checkbox: container.querySelector('input[type=checkbox]')! };
    }

    test('is left off a boolean whose false is an answer the schema accepts', async () => {
      const { checkbox, onSubmit, onError } = renderForm(agree);

      expect(checkbox).not.toHaveAttribute('required');

      await user.click(screen.getByRole('button', { name: 'Submit' }));

      // A required boolean the user has not touched is `false`, which satisfies the schema, so the form's own default
      // state is submittable: the attribute would have the browser refuse it with nothing on the screen to say why
      expect(onError).not.toHaveBeenCalled();
      expect(onSubmit.mock.calls[0]?.[0].formData).toEqual({ agree: false });
    });

    test('is set on a boolean that has to be true', async () => {
      const { checkbox } = renderForm({ ...agree, const: true });

      expect(checkbox).toHaveAttribute('required');
    });
  });

  // A required boolean starts at `false`, an answer the schema accepts, and so does a type list naming `boolean` whose
  // checkbox `BooleanField` renders, so neither is marked as still to be filled in
  test('marks no required checkbox on a type list naming boolean', () => {
    render(
      <Form
        schema={{
          type: 'object',
          required: ['agree'],
          properties: { agree: { type: ['number', 'boolean'], title: 'Agree' } },
        }}
        uiSchema={{ agree: { 'ui:widget': 'checkbox' } }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Agree' })).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  // The description sits above the input rather than inside its label, and the errors below it, so nothing associates
  // either with the control unless the input points at them
  test('is described by its own description, errors and help', () => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { agree: { type: 'boolean', title: 'Agree' } } }}
        uiSchema={{ agree: { 'ui:description': 'Whether you agree' } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('input[type=checkbox]')).toHaveAccessibleDescription('Whether you agree');
  });
});
