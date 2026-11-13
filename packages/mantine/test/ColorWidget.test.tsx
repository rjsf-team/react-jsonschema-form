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
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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
      // oxlint-disable-next-line typescript/no-deprecated -- exercises the deprecated prop a component without a plan reads
      hideLabel: true,
      options: {
        description: 'Test description',
      },
    });
    expect(queryByText('Test description')).not.toBeInTheDocument();
  });

  describe('a colorFormat from options', () => {
    function renderWithOptions(value: string, options: WidgetProps['options']) {
      const onChange = vi.fn();
      const { rerender } = renderWidget({ value, onChange });
      // `ColorInput` converts its color only when the format changes, not to the one it mounts with
      rerender(
        <MantineProvider>
          <ColorWidget {...makeProps({ value, onChange, options })} />
        </MantineProvider>,
      );
      return onChange;
    }

    test('is passed on to ColorInput, which converts the color to it', () => {
      expect(renderWithOptions('#ff0000', { colorFormat: 'rgba' })).toHaveBeenCalledWith('rgba(255, 0, 0, 1)');
    });

    test('is not spread onto ColorInput as a prop of its own', () => {
      const { container } = renderWidget({ value: '#ff0000', options: { colorFormat: 'rgba' } });

      expect(container.querySelector('[colorformat]')).toBeNull();
    });

    test('is left off ColorInput when it is no format ColorInput takes', () => {
      // A format ColorInput doesn't know converts to hex, so this rgba color stays as it is only if none reached it
      expect(renderWithOptions('rgba(255, 0, 0, 1)', { colorFormat: 'RGB' })).not.toHaveBeenCalled();
    });

    test("leaves the alt-date widgets' format off ColorInput", () => {
      // A format ColorInput doesn't know converts to hex, so this rgba color stays as it is only if none reached it
      expect(renderWithOptions('rgba(255, 0, 0, 1)', { format: 'MDY' })).not.toHaveBeenCalled();
    });
  });
});
