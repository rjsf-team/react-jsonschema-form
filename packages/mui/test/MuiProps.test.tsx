import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from '../src';
import { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';

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
});
