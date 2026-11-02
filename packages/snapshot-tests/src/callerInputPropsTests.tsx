import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

function PatternWidget(props: WidgetProps) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} pattern='[A-Z]+' accept='.png' />;
}

/** Checks that a theme's `BaseInputTemplate` puts a `pattern` and an `accept` a widget passes it on the input, over the
 * ones the schema and options derive, and drops the numeric title that names the derived pattern
 *
 * @param Form - The theme's `Form`
 */
export function callerInputPropsTests(Form: ComponentType<FormProps>) {
  test('BaseInputTemplate puts the pattern and accept a widget passes on the input', () => {
    const { container } = render(
      <Form
        schema={{ type: 'number' }}
        uiSchema={{ 'ui:widget': PatternWidget, 'ui:options': { accept: '.pdf' } }}
        validator={validator}
        initialFormData={1}
      />,
    );
    const input = container.querySelector('input#root');
    expect(input).toHaveAttribute('pattern', '[A-Z]+');
    expect(input).toHaveAttribute('accept', '.png');
    expect(input).not.toHaveAttribute('title');
  });
}
