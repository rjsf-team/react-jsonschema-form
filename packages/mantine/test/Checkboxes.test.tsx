import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';

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
});
