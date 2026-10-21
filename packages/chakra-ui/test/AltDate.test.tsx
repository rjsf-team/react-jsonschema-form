import type { FormProps } from '@rjsf/core';
import { altDateTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import NativeSelectWidget from '../src/NativeSelectWidget/NativeSelectWidget.tsx';
import WrappedForm from './WrappedForm.tsx';

altDateTests(WrappedForm);

function NativeSelectForm(props: FormProps) {
  return <WrappedForm {...props} widgets={{ SelectWidget: NativeSelectWidget, ...props.widgets }} />;
}

// The parts a form draws when it registers NativeSelectWidget in place of chakra-ui's own SelectWidget
describe('with NativeSelectWidget as the SelectWidget', () => {
  altDateTests(NativeSelectForm);

  // chakra-ui's own SelectWidget is a combobox too, so without this the suite above would pass on it
  it('draws each part as a native select', () => {
    render(
      <NativeSelectForm
        schema={{ type: 'object', properties: { when: { type: 'string', title: 'When' } } }}
        uiSchema={{ when: { 'ui:widget': 'alt-datetime' } }}
        validator={validator}
      />,
    );
    for (const part of ['year', 'month', 'day', 'hour', 'minute', 'second']) {
      expect(screen.getByRole('combobox', { name: `When, ${part}` }).tagName).toBe('SELECT');
    }
  });
});

describe("chakra-ui's AltDateWidget", () => {
  it.each([
    ['alt-date', ['year', 'month', 'day']],
    ['alt-datetime', ['year', 'month', 'day', 'hour', 'minute', 'second']],
  ])(
    "describes each %s part by its field's parts that render, and marks it invalid while its errors show",
    (widget, parts) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { when: { type: 'string', title: 'When', description: 'The day' } } }}
          uiSchema={{ when: { 'ui:widget': widget } }}
          validator={validator}
          extraErrors={{ when: { __errors: ['is wrong'] } }}
        />,
      );
      for (const part of parts) {
        const element = screen.getByRole('combobox', { name: `When, ${part}` });

        expect(element).toHaveAttribute('aria-describedby', 'root_when__error root_when__description');
        expect(element).toHaveAttribute('aria-invalid', 'true');
        // Pointed at nothing, so Ark's own label id doesn't name the part over its `aria-label`
        expect(element.getAttribute('aria-labelledby')).toBe('');
      }
    },
  );
});
