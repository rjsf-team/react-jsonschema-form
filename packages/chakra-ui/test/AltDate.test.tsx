import { altDateTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import NativeSelectWidget from '../src/NativeSelectWidget/NativeSelectWidget.tsx';
import WrappedForm from './WrappedForm.tsx';

altDateTests(WrappedForm);

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

  // The shared altDateTests render chakra-ui's own SelectWidget, never the native one a form may register in its place
  it.each([
    ['alt-date', ['year', 'month', 'day']],
    ['alt-datetime', ['year', 'month', 'day', 'hour', 'minute', 'second']],
  ])(
    'names and describes each %s part drawn by NativeSelectWidget as the SelectWidget, and marks it invalid while its errors show',
    (widget, parts) => {
      render(
        <WrappedForm
          schema={{ type: 'object', properties: { when: { type: 'string', title: 'When', description: 'The day' } } }}
          uiSchema={{ when: { 'ui:widget': widget } }}
          widgets={{ SelectWidget: NativeSelectWidget }}
          validator={validator}
          extraErrors={{ when: { __errors: ['is wrong'] } }}
        />,
      );
      for (const part of parts) {
        const element = screen.getByRole('combobox', { name: `When, ${part}` });

        expect(element.tagName).toBe('SELECT');
        expect(element).toHaveAttribute('aria-describedby', 'root_when__error root_when__description');
        expect(element).toHaveAttribute('aria-invalid', 'true');
      }
    },
  );
});
