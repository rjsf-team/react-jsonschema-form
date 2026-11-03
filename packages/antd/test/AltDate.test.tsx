import { altDateTests } from '@rjsf/snapshot-tests';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

altDateTests(Form);

describe("antd's AltDateWidget", () => {
  it.each([
    ['a number', 10, '-2.5px', '5px'],
    ['each side of a [horizontal, vertical] pair', [8, 32], '-2px', '16px'],
    ["the default for a numeric string, which antd's `Row` cannot space", '16', '-6px', '12px'],
    ['a CSS length', '1rem', 'calc(-0.25rem)', 'calc(0.5rem)'],
    ['each breakpoint of a responsive gutter, which `Row` reads at the widest here', { xs: 8, md: 16 }, '-4px', '8px'],
    ['a CSS length at a breakpoint', { md: '1rem' }, 'calc(-0.25rem)', 'calc(0.5rem)'],
    ['the default for an invalid number at a breakpoint', { md: Number.NaN }, '-6px', '12px'],
    ['a breakpoint left undefined, which `Row` passes over', { sm: 8, md: undefined }, '-2px', '4px'],
    ['each side of a pair with a CSS length and a responsive side', ['1rem', { md: 16 }], 'calc(-0.25rem)', '8px'],
    ['the default when there is none', undefined, '-6px', '12px'],
    ['no gutter for an empty string, as every other `Row` reads it', '', '', '0px'],
    ['no gutter for null, as every other `Row` reads it', null, '', '0px'],
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

    expect(screen.getByRole('group').style).toMatchObject({ marginInline: '', rowGap: '8px' });
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
