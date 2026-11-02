import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

function PatternWidget(props: WidgetProps) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} pattern='[A-Z]+' accept='.png' />;
}

/** Checks that a theme's `BaseInputTemplate` puts a `pattern` and an `accept` a widget passes it on the input
 *
 * @param Form - The theme's `Form`
 */
export function callerInputPropsTests(Form: ComponentType<FormProps>) {
  test('BaseInputTemplate puts the pattern and accept a widget passes on the input', () => {
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{ 'ui:widget': PatternWidget }}
        validator={validator}
        initialFormData='A'
      />,
    );
    const input = container.querySelector('input#root');
    expect(input).toHaveAttribute('pattern', '[A-Z]+');
    expect(input).toHaveAttribute('accept', '.png');
  });
}
