import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import CheckboxesWidget from '../src/CheckboxesWidget/index.ts';
import Form from '../src/index.ts';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

describe('CheckboxesWidget', () => {
  test('simple', () => {
    const { asFragment } = render(
      <CheckboxesWidget
        {...makeWidgetMockProps({
          options: {
            enumOptions: [{ label: 'A', value: 'a' }],
          },
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
  });
  test('inline', () => {
    const { asFragment } = render(
      <CheckboxesWidget
        {...makeWidgetMockProps({
          options: {
            enumOptions: [{ label: 'A', value: 'a' }],
            inline: true,
          },
        })}
      />,
    );
    expect(asFragment()).toMatchSnapshot();
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
