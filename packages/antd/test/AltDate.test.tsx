import { altDateTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

altDateTests(Form);

describe("antd's AltDateWidget", () => {
  it.each([
    ['alt-date', 'year'],
    ['alt-datetime', 'hour'],
  ])(
    "describes each %s part by its field's parts that render, and marks it invalid while its errors show",
    (widget, part) => {
      render(
        <Form
          schema={{ type: 'object', properties: { when: { type: 'string', title: 'When', description: 'The day' } } }}
          uiSchema={{ when: { 'ui:widget': widget } }}
          validator={validator}
          extraErrors={{ when: { __errors: ['is wrong'] } }}
        />,
      );
      const element = screen.getByRole('combobox', { name: `When, ${part}` });

      expect(element).toHaveAttribute('aria-describedby', 'root_when__error root_when__description');
      expect(element).toHaveAttribute('aria-invalid', 'true');
      expect(element).not.toHaveAttribute('aria-labelledby');
    },
  );
});
