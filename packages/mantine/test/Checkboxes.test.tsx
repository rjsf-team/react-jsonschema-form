import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import Templates from '../src/templates/index.ts';
import CheckboxesWidget from '../src/widgets/CheckboxesWidget.tsx';

const schema: RJSFSchema = {
  type: 'array',
  items: {
    type: 'string',
    enum: ['foo', 'bar', 'fuzz', 'qux'],
  },
  uniqueItems: true,
};
const uiSchema: UiSchema = { 'ui:widget': 'CheckboxesWidget' };

const enumOptions = ['foo', 'bar', 'fuzz', 'qux'].map((value) => ({ label: value, value }));

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    schema,
    registry: getTestRegistry(schema, {}, Templates, {}),
    label: 'Checkboxes',
    value: undefined,
    required: false,
    disabled: false,
    readonly: false,
    multiple: false,
    rawErrors: [],
    uiSchema,
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
    options: { enumOptions, ...props.options },
  } as unknown as WidgetProps;
}

function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <CheckboxesWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('Checkboxes', () => {
  test('renders with description from options', () => {
    const { getByText } = renderWidget({
      options: {
        description: 'Test description',
      },
    });
    expect(getByText('Test description')).toBeInTheDocument();
  });

  test('renders with description from schema', () => {
    const { getByText } = renderWidget({
      schema: {
        ...schema,
        description: 'Test description from schema',
      },
    });
    expect(getByText('Test description from schema')).toBeInTheDocument();
  });

  test('hides description when hideLabel is true', () => {
    const { queryByText } = renderWidget({
      hideLabel: true,
      options: {
        description: 'Test description',
      },
    });
    expect(queryByText('Test description')).not.toBeInTheDocument();
  });

  test.each([
    ['indexed', ['bar']],
    ['realValue', ['bar']],
  ] as const)('checks the selected options in the %s format', (optionValueFormat, value) => {
    renderWidget({ value: [...value], options: { optionValueFormat } });
    expect(screen.getByRole('checkbox', { name: 'bar' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'foo' })).not.toBeChecked();
  });

  test.each(['indexed', 'realValue'] as const)(
    'checks the selected object options in the %s format',
    (optionValueFormat) => {
      renderWidget({
        value: [{ a: 2 }],
        options: {
          enumOptions: [
            { label: 'One', value: { a: 1 } },
            { label: 'Two', value: { a: 2 } },
          ],
          optionValueFormat,
        },
      });
      expect(screen.getByRole('checkbox', { name: 'Two' })).toBeChecked();
      expect(screen.getByRole('checkbox', { name: 'One' })).not.toBeChecked();
    },
  );

  test.each(['indexed', 'realValue'] as const)(
    'renders with nothing checked for null form data in the %s format',
    (optionValueFormat) => {
      renderWidget({ value: null, options: { optionValueFormat } });
      expect(screen.getAllByRole('checkbox')).toHaveLength(4);
      screen.getAllByRole('checkbox').forEach((checkbox) => expect(checkbox).not.toBeChecked());
    },
  );
});
