import { altDateTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

altDateTests(Form);

describe("antd's AltDateWidget", () => {
  it.each([
    ['a number', 10, '-2.5px', '5px'],
    ['the horizontal one of a [horizontal, vertical] pair', [8, 8], '-2px', '4px'],
    ["the default for a numeric string, which antd's `Row` cannot space", '16', '-6px', '12px'],
    ['the default for a CSS length', '1rem', '-6px', '12px'],
    ['the default for a responsive gutter', { xs: 8, md: 16 }, '-6px', '12px'],
  ])("spaces the date parts by half the formContext's rowGutter: %s", (_, rowGutter, margin, gap) => {
    render(
      <Form
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date' }}
        validator={validator}
        formContext={{ rowGutter }}
      />,
    );

    // antd's `Row` turns its `[horizontal, vertical]` gutter into these
    expect(screen.getByRole('group').style).toMatchObject({ marginInline: margin, rowGap: gap });
  });
  it("spaces the date parts by no gutter for a pair with no horizontal one, as antd's `Row` reads it", () => {
    render(
      <Form
        schema={{ type: 'string', format: 'date' }}
        uiSchema={{ 'ui:widget': 'alt-date' }}
        validator={validator}
        formContext={{ rowGutter: [undefined, 16] }}
      />,
    );

    expect(screen.getByRole('group').style.rowGap).toBe('0px');
  });
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
