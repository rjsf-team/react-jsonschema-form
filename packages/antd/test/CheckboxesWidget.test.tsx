import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form from '../src/index.ts';

const user = userEvent.setup();

describe('CheckboxesWidget', () => {
  it.each(['ui:disabled', 'ui:readonly'] as const)('disables every option of a %s field', (uiOption) => {
    render(
      <Form
        schema={{ type: 'array', uniqueItems: true, items: { enum: ['foo', 'bar'] } }}
        uiSchema={{ 'ui:widget': 'checkboxes', [uiOption]: true }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'foo' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'bar' })).toBeDisabled();
  });
});

describe('CheckboxesWidget focus and blur', () => {
  it.each(['indexed', 'realValue'] as const)(
    'reports the focused option value in the %s format, apart from an option sharing its String() (#5315)',
    async (optionValueFormat) => {
      const onFocus = vi.fn();
      const onBlur = vi.fn();
      render(
        <Form
          schema={{ type: 'array', uniqueItems: true, items: { enum: [1, '1'] } }}
          uiSchema={{ 'ui:widget': 'checkboxes', 'ui:options': { optionValueFormat } }}
          validator={validator}
          onFocus={onFocus}
          onBlur={onBlur}
        />,
      );

      await user.tab();
      await user.tab();
      await user.tab();

      expect(onFocus.mock.calls).toEqual([
        ['root', 1],
        ['root', '1'],
      ]);
      expect(onBlur.mock.calls).toEqual([
        ['root', 1],
        ['root', '1'],
      ]);
    },
  );
});
