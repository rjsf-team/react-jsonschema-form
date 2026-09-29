import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import RadioWidget from '../src/RadioWidget/RadioWidget.tsx';

const mockSchema: RJSFSchema = { type: 'string' };

function makeWidgetMockProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    uiSchema: {},
    schema: mockSchema,
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: 'Sample Field Label',
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    multiple: false,
    rawErrors: [],
    value: undefined,
    options: {},
    id: 'test-id',
    name: 'test-name',
    placeholder: '',
    registry: getTestRegistry(mockSchema),
    ...props,
  };
}

describe('RadioWidget', () => {
  test.each(['indexed', 'realValue'] as const)('checks the selected option in the %s format', (optionValueFormat) => {
    render(
      <RadioWidget
        {...makeWidgetMockProps({
          value: 'two',
          options: { enumOptions: ['one', 'two'].map((value) => ({ label: value, value })), optionValueFormat },
        })}
      />,
    );

    expect(screen.getByRole('radio', { name: 'two' })).toBeChecked();
  });

  test.each(['indexed', 'realValue'] as const)(
    'checks the selected object option in the %s format',
    (optionValueFormat) => {
      render(
        <RadioWidget
          {...makeWidgetMockProps({
            value: { a: 2 },
            options: {
              enumOptions: [
                { label: 'One', value: { a: 1 } },
                { label: 'Two', value: { a: 2 } },
              ],
              optionValueFormat,
            },
          })}
        />,
      );

      expect(screen.getByRole('radio', { name: 'Two' })).toBeChecked();
      expect(screen.getByRole('radio', { name: 'One' })).not.toBeChecked();
    },
  );
});
