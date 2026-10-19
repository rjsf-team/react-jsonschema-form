import type { ComponentType } from 'react';
import { getTestRegistry } from '@rjsf/core/testing';
import type { RJSFSchema, WidgetProps } from '@rjsf/utils';
import { render } from '@testing-library/react';

import BaseInputTemplate from '../src/BaseInputTemplate/BaseInputTemplate.tsx';
import RangeWidget from '../src/RangeWidget/RangeWidget.tsx';
import TextareaWidget from '../src/TextareaWidget/TextareaWidget.tsx';

const mockSchema: RJSFSchema = { type: 'number', minimum: 0, maximum: 10 };

function makeWidgetMockProps(props: Partial<WidgetProps> = {}): WidgetProps {
  return {
    uiSchema: {},
    schema: mockSchema,
    required: true,
    disabled: false,
    readonly: false,
    autofocus: false,
    label: '',
    onChange: () => undefined,
    onBlur: () => undefined,
    onFocus: () => undefined,
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated prop core still hands a component that doesn't read the plan
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

// Rendered without a plan, where `hideLabel` alone would let a required field with no label text draw a label holding
// only its `*`, which would name the control "star"
describe.each<[string, ComponentType<WidgetProps>, string]>([
  ['RangeWidget', RangeWidget, 'input[type="range"]'],
  ['BaseInputTemplate', BaseInputTemplate, 'input'],
  ['TextareaWidget', TextareaWidget, 'textarea'],
])('%s', (_, Widget, controlSelector) => {
  test('draws no label for a required field whose label is empty, and stays required', () => {
    const { container } = render(<Widget {...makeWidgetMockProps()} />);

    expect(container.querySelector('label')).not.toBeInTheDocument();
    // `toBeRequired()` passes over a `type="range"` input, which HTML doesn't let `required` constrain, so the attribute
    // the widget passes is checked instead
    expect(container.querySelector(controlSelector)).toHaveAttribute('required');
  });

  test('draws the label of a required field with label text', () => {
    const { container } = render(<Widget {...makeWidgetMockProps({ label: 'Volume' })} />);

    expect(container.querySelector('label')).toHaveTextContent('Volume');
  });
});
