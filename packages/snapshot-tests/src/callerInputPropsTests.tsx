import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { WidgetProps } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

function PatternWidget(props: WidgetProps) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} pattern='[A-Z]+' accept='.png' inputMode='tel' />;
}

function PatternOnlyWidget(props: WidgetProps) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} pattern='[0-9.]+' accept='.png' />;
}

function DecimalWidget(props: WidgetProps) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} inputMode='decimal' />;
}

function ChangeOverrideWidget(props: WidgetProps) {
  const { BaseInputTemplate } = props.registry.templates;
  return <BaseInputTemplate {...props} onChangeOverride={(event) => props.onChange(event.target.value)} />;
}

/** Checks that a theme's `BaseInputTemplate` puts a `pattern`, an `accept` and an `inputMode` a widget passes it on the
 * input, over the ones the schema and options derive, drops the numeric title that names the derived pattern, and
 * accepts a decimal on the input a widget's `inputMode` or `onChangeOverride` gets a `number` field, and lets a file
 * input for an array take several files while no other input takes a `multiple`
 *
 * @param Form - The theme's `Form`
 */
export function callerInputPropsTests(Form: ComponentType<FormProps>) {
  test('BaseInputTemplate puts the pattern, accept and inputMode a widget passes on the input', () => {
    const { container } = render(
      <Form
        schema={{ type: 'number' }}
        uiSchema={{
          'ui:widget': PatternWidget,
          'ui:options': { accept: '.pdf', pattern: '[a-z]+', inputMode: 'numeric' },
        }}
        validator={validator}
        initialFormData={1}
      />,
    );
    const input = container.querySelector('input#root');
    expect(input).toHaveAttribute('pattern', '[A-Z]+');
    expect(input).toHaveAttribute('accept', '.png');
    expect(input).toHaveAttribute('inputmode', 'tel');
    expect(input).not.toHaveAttribute('title');
  });

  test('BaseInputTemplate puts the pattern and accept a widget passes without an inputMode on the input', () => {
    const { container } = render(
      <Form
        schema={{ type: 'number' }}
        uiSchema={{ 'ui:widget': PatternOnlyWidget, 'ui:options': { accept: '.pdf', pattern: '[a-z]+' } }}
        validator={validator}
        initialFormData={1}
      />,
    );
    const input = container.querySelector('input#root');
    expect(input).toHaveAttribute('pattern', '[0-9.]+');
    expect(input).toHaveAttribute('accept', '.png');
  });

  test('BaseInputTemplate accepts a decimal on the input a widget passes an inputMode for a number', () => {
    const { container } = render(
      <Form schema={{ type: 'number' }} uiSchema={{ 'ui:widget': DecimalWidget }} validator={validator} />,
    );
    const input = container.querySelector<HTMLInputElement>('input#root');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    // An empty input is always valid, so a value is written for the browser to check against `step` and `pattern`;
    // through the DOM because user-event isn't among this package's peer dependencies
    if (input) {
      input.value = '1.5';
    }
    expect(input?.validity.valid).toBe(true);
  });

  test('BaseInputTemplate accepts a decimal on the input a widget passes an onChangeOverride for a number', () => {
    const { container } = render(
      <Form schema={{ type: 'number' }} uiSchema={{ 'ui:widget': ChangeOverrideWidget }} validator={validator} />,
    );
    const input = container.querySelector<HTMLInputElement>('input#root');
    expect(input).toHaveAttribute('title', 'Enter a number');
    // Written through the DOM for the reason the test above gives
    if (input) {
      input.value = '1.5';
    }
    expect(input?.validity.valid).toBe(true);
  });

  test('BaseInputTemplate lets the file input of an array take several files', () => {
    const { container } = render(
      <Form schema={{ type: 'array', items: { type: 'string', format: 'data-url' } }} validator={validator} />,
    );
    expect(container.querySelector('input[type=file]')).toHaveAttribute('multiple');
    expect(container.querySelector('[multiple]:not(input)')).toBeNull();
  });

  test('BaseInputTemplate leaves the multiple of a multi-select array off an input that is not a file input', () => {
    const { container } = render(
      <Form
        schema={{ type: 'array', uniqueItems: true, items: { type: 'string', enum: ['a', 'b'] } }}
        uiSchema={{ 'ui:widget': 'EmailWidget' }}
        validator={validator}
      />,
    );
    expect(container.querySelector('#root')).not.toHaveAttribute('multiple');
  });
}
