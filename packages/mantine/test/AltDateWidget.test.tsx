import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';

import Templates from '../src/templates/index.ts';
import AltDateWidget from '../src/widgets/DateTime/AltDateWidget.tsx';

const schema: RJSFSchema = { type: 'string', format: 'date-time' };

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    schema,
    registry: getTestRegistry(schema, {}, Templates, {}),
    options: {},
    label: 'Alt Date',
    value: undefined,
    required: false,
    disabled: false,
    readonly: false,
    multiple: false,
    rawErrors: [],
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    ...props,
  } as unknown as WidgetProps;
}

function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <AltDateWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('AltDateWidget', () => {
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
        type: 'string',
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

  test('renders no description element without a description', () => {
    const { container } = renderWidget();
    expect(container.querySelector('.mantine-InputWrapper-description')).toBeNull();
  });
});
