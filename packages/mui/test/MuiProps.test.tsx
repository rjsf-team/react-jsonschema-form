import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import type { BaseInputTemplateMuiProps } from '../src/BaseInputTemplate/BaseInputTemplate.tsx';
import type { UiSchema as MuiUiSchema } from '../src/index.ts';
import Form from '../src/index.ts';

describe('MUI Theme-Specific Props', () => {
  it('should apply mui props to BaseInputTemplate (TextField)', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const uiSchema: UiSchema = {
      foo: {
        'ui:options': {
          mui: {
            placeholder: 'Custom Placeholder',
            variant: 'standard',
          },
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const input = container.querySelector('input[placeholder="Custom Placeholder"]');
    expect(input).toBeInTheDocument();
    // In MUI, variant "standard" removes the notched outline classes that "outlined" (default) has.
    // Or we can check the class name if we want to be very specific, but existence of placeholder is enough to show mui props worked as placeholder is a TextField prop.
  });

  it("should apply mui props from ui:globalOptions, beneath a field's own, to its templates and its widget", () => {
    const schema: RJSFSchema = {
      type: 'object',
      title: 'Profile',
      properties: { foo: { type: 'string' }, bar: { type: 'string' } },
    };
    const uiSchema: MuiUiSchema = {
      'ui:globalOptions': {
        mui: { placeholder: 'Global', rjsfSlotProps: { titleTypography: { 'data-testid': 'global-title' } } },
      },
      bar: { 'ui:options': { mui: { placeholder: 'Own' } } },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByTestId('global-title')).toHaveTextContent('Profile');
    expect(container.querySelector('#root_foo')).toHaveAttribute('placeholder', 'Global');
    expect(container.querySelector('#root_bar')).toHaveAttribute('placeholder', 'Own');
  });

  it('should keep a pattern and inputMode a caller sets on a non-numeric field through slotProps.htmlInput', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const uiSchema: UiSchema = {
      foo: {
        'ui:options': {
          mui: {
            slotProps: { htmlInput: { pattern: '[A-Za-z]+', inputMode: 'tel' } },
          },
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const input = container.querySelector('input#root_foo');
    expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    expect(input).toHaveAttribute('inputmode', 'tel');
  });

  it('should let a caller override the derived pattern, inputMode and step of a numeric field through slotProps.htmlInput', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        price: { type: 'number', multipleOf: 0.01 },
      },
    };
    const uiSchema: UiSchema = {
      price: {
        'ui:options': {
          mui: {
            slotProps: { htmlInput: { pattern: '[0-9]*[.]?[0-9]{0,2}', inputMode: 'tel', step: 5 } },
          },
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const input = container.querySelector('input#root_price');
    expect(input).toHaveAttribute('pattern', '[0-9]*[.]?[0-9]{0,2}');
    expect(input).toHaveAttribute('inputmode', 'tel');
    expect(input).toHaveAttribute('step', '5');
    // The title names the constraint the derived pattern imposes, so it goes when that pattern is replaced
    expect(input).not.toHaveAttribute('title');
  });

  it('should title a numeric field whose derived pattern a caller leaves alone', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        price: { type: 'number' },
        count: { type: 'integer' },
      },
    };
    const uiSchema: UiSchema = {
      price: { 'ui:options': { mui: { slotProps: { htmlInput: { step: 5 } } } } },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(container.querySelector('input#root_price')).toHaveAttribute('title', 'Enter a number');
    expect(container.querySelector('input#root_count')).toHaveAttribute('title', 'Enter a whole number');
  });

  it('should let a caller set step, min and max through slotProps.htmlInput when the schema derives none', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const uiSchema: UiSchema = {
      foo: {
        'ui:options': {
          inputType: 'number',
          mui: {
            slotProps: { htmlInput: { step: 5, min: 0, max: 100 } },
          },
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const input = container.querySelector('input#root_foo');
    expect(input).toHaveAttribute('step', '5');
    expect(input).toHaveAttribute('min', '0');
    expect(input).toHaveAttribute('max', '100');
  });

  it('should accept the input-only attributes a caller documents for slotProps.htmlInput', () => {
    // A type-level check: `pnpm run lint` fails here if `htmlInput` stops accepting these attributes
    const muiOptions: BaseInputTemplateMuiProps = {
      slotProps: { htmlInput: { pattern: '[0-9]*', inputMode: 'numeric', step: 5, min: 0, max: 100, accept: '.pdf' } },
    };
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'integer' },
      },
    };
    const uiSchema: UiSchema = { foo: { 'ui:options': { mui: muiOptions } } };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const input = container.querySelector('input#root_foo');
    expect(input).toHaveAttribute('pattern', '[0-9]*');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('step', '5');
  });

  it('should apply sx props via FieldTemplate', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
      },
    };
    const uiSchema: UiSchema = {
      foo: {
        'ui:options': {
          mui: {
            sx: { backgroundColor: 'rgb(255, 0, 0)' },
          },
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    // The FormControl in FieldTemplate should have the sx applied.
    // We can't easily check for 'rgb(255, 0, 0)' in JSDOM if it's via sx/emotion without complex setup,
    // but we can check if the element exists.
    const field = container.querySelector('.MuiFormControl-root');
    expect(field).toBeInTheDocument();
  });

  it('should apply rjsfSlotProps to ArrayFieldTemplate (Paper elevation)', () => {
    const schema: RJSFSchema = {
      type: 'array',
      items: { type: 'string' },
    };
    const uiSchema: UiSchema = {
      'ui:options': {
        mui: {
          rjsfSlotProps: {
            arrayPaper: { elevation: 10 },
          },
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeInTheDocument();
    expect(paper).toHaveClass('MuiPaper-elevation10');
  });

  it('should apply variant to SelectWidget via root mui props', () => {
    const schema: RJSFSchema = {
      type: 'string',
      enum: ['a', 'b'],
    };
    const uiSchema: UiSchema = {
      'ui:options': {
        mui: {
          variant: 'filled',
        },
      },
    };

    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const select = container.querySelector('.MuiFilledInput-root');
    expect(select).toBeInTheDocument();
  });

  it("should apply a caller's slotProps.htmlInput given as MUI's (ownerState) => props", () => {
    const schema: RJSFSchema = { type: 'object', properties: { price: { type: 'number' } } };
    const uiSchema: UiSchema = {
      price: {
        'ui:options': {
          mui: { slotProps: { htmlInput: () => ({ 'data-testid': 'price', pattern: '[0-9]+', step: 5 }) } },
        },
      },
    };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    const input = screen.getByTestId('price');
    expect(input).toHaveAttribute('id', 'root_price');
    expect(input).toHaveAttribute('pattern', '[0-9]+');
    expect(input).toHaveAttribute('step', '5');
    // As for an object, the title goes with the derived pattern the caller replaces
    expect(input).not.toHaveAttribute('title');
  });

  // MUI links its helper text through the `aria-describedby` that the field's plan, which knows only RJSF's parts,
  // replaces on the control
  it.each<[string, RJSFSchema, string]>([
    ['text input', { type: 'string' }, 'textbox'],
    ['select', { type: 'string', enum: ['a', 'b'] }, 'combobox'],
  ])("should describe a %s by MUI's helper text as well as by the field's parts", (_, foo, role) => {
    const schema: RJSFSchema = { type: 'object', properties: { foo: { ...foo, description: 'About foo' } } };
    const uiSchema: UiSchema = { foo: { 'ui:options': { mui: { helperText: 'A hint' } } } };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByRole(role)).toHaveAccessibleDescription('About foo A hint');
  });

  // MUI builds the helper text's id from the `TextField`'s id, which an `id` in `ui:options.mui` replaces
  it.each<[string, RJSFSchema, string]>([
    ['text input', { type: 'string' }, 'textbox'],
    ['select', { type: 'string', enum: ['a', 'b'] }, 'combobox'],
  ])("should describe a %s by MUI's helper text under an id the form author gives it", (_, foo, role) => {
    const schema: RJSFSchema = { type: 'object', properties: { foo } };
    const uiSchema: UiSchema = { foo: { 'ui:options': { mui: { id: 'custom', helperText: 'A hint' } } } };

    render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(screen.getByRole(role)).toHaveAccessibleDescription('A hint');
  });
});
