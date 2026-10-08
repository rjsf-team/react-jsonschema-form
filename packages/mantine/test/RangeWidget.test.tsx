import type { ReactElement, ReactNode } from 'react';
import { cloneElement } from 'react';
import { MantineProvider } from '@mantine/core';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { render, screen } from '@testing-library/react';

import Templates from '../src/templates/index.ts';
import RangeWidget from '../src/widgets/RangeWidget.tsx';

const schema: RJSFSchema = { type: 'integer' };

function renderWidget(props: Partial<WidgetProps> = {}) {
  return render(
    <MantineProvider>
      <RangeWidget
        id='root'
        name='root'
        schema={schema}
        registry={getTestRegistry(schema, {}, Templates, {})}
        options={{}}
        label='Volume'
        value={3}
        required={false}
        disabled={false}
        readonly={false}
        multiple={false}
        rawErrors={[]}
        onChange={() => undefined}
        onBlur={() => undefined}
        onFocus={() => undefined}
        {...props}
      />
    </MantineProvider>,
  );
}

describe('RangeWidget', () => {
  test('marks the thumb invalid when the field has errors', () => {
    renderWidget({ rawErrors: ['An error'] });

    expect(screen.getByRole('slider')).toHaveAttribute('aria-invalid', 'true');
  });

  test('leaves the thumb unmarked when the field has no errors', () => {
    renderWidget();

    expect(screen.getByRole('slider')).not.toHaveAttribute('aria-invalid');
  });

  test.each([
    ['ui:options', { success: 'Looks good' }],
    ['ui:options.wrapperProps', { wrapperProps: { success: 'Looks good' } }],
  ])('renders a success message from the %s and describes the thumb by it', (_, options) => {
    const { container } = renderWidget({ options });

    expect(container.querySelector('[id="root-success"]')).toHaveTextContent('Looks good');
    expect(screen.getByRole('slider')).toHaveAccessibleDescription(/Looks good/);
  });

  test('passes the ref and props a single-child inputContainer, such as Tooltip, adds on to the slider', () => {
    let refTarget: unknown;
    const inputContainer = (children: ReactNode) =>
      cloneElement(children as ReactElement<Record<string, unknown>>, {
        'data-container': 'yes',
        ref: (node: unknown) => {
          refTarget = node;
        },
      });
    const { container } = renderWidget({ options: { inputContainer } });

    const sliderRoot = container.querySelector('.mantine-Slider-root');
    expect(sliderRoot).toHaveAttribute('data-container', 'yes');
    expect(refTarget).toBe(sliderRoot);
  });

  test('renders no success message while the field has errors, and describes the thumb by the errors', () => {
    const { container } = renderWidget({ options: { success: 'Looks good' }, rawErrors: ['An error'] });

    expect(container.querySelector('[id="root-success"]')).not.toBeInTheDocument();
    expect(screen.getByRole('slider')).toHaveAccessibleDescription(/An error/);
  });
});
