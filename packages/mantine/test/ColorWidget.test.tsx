import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, UiSchema, WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';

import Templates from '../src/templates/index.ts';
import ColorWidget from '../src/widgets/ColorWidget.tsx';

const schema: RJSFSchema = { type: 'string' };
const uiSchema: UiSchema = { 'ui:widget': 'ColorWidget' };

function makeProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    id: 'root',
    name: 'root',
    schema,
    registry: getTestRegistry(schema, {}, Templates, {}),
    options: {},
    label: 'Color',
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
  };
}

function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <ColorWidget {...makeProps(props)} />
    </MantineProvider>,
  );
}

describe('ColorWidget', () => {
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

  describe('a format from options, which cleanupOptions() strips', () => {
    function renderWithFormat(value: string, format: string) {
      const onChange = vi.fn();
      const { rerender } = renderWidget({ value, onChange });
      // `ColorInput` converts its color only when the format changes, not to the one it mounts with
      rerender(
        <MantineProvider>
          <ColorWidget {...makeProps({ value, onChange, options: { format } })} />
        </MantineProvider>,
      );
      return onChange;
    }

    test('is passed on to ColorInput, which converts the color to it', () => {
      expect(renderWithFormat('#ff0000', 'rgba')).toHaveBeenCalledWith('rgba(255, 0, 0, 1)');
    });

    test.each(['DMY', 'MDY', 'YMD'])("is ignored when it's the alt-date widgets' order %s", (format) => {
      expect(renderWithFormat('rgba(255, 0, 0, 1)', format)).not.toHaveBeenCalled();
    });

    test('is passed on when ColorInput may take it, such as a format a later Mantine release adds', () => {
      // Mantine 9.6 doesn't know `oklch`, so it converts the color to hex, its default
      expect(renderWithFormat('rgba(255, 0, 0, 1)', 'oklch')).toHaveBeenCalledWith('#ff0000');
    });
  });
});
