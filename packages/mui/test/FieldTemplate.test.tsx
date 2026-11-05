import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getTestRegistry } from '@rjsf/core/testing';
import { toFieldPath } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

import FieldTemplate from '../src/FieldTemplate/FieldTemplate.tsx';
import Form, { generateTemplates } from '../src/index.ts';

describe('FieldTemplate rendered without a plan, as outside SchemaField', () => {
  function renderTemplate(displayLabel: boolean) {
    const registry = getTestRegistry({}, {}, generateTemplates());
    return render(
      <FieldTemplate
        id='root_foo'
        fieldPath={toFieldPath('foo')}
        label='Foo'
        keyName='foo'
        description={<span id='root_foo__description'>About foo</span>}
        rawDescription='About foo'
        // oxlint-disable-next-line typescript/no-deprecated -- a template rendered without a plan reads the deprecated prop
        displayLabel={displayLabel}
        schema={{ type: 'string' }}
        registry={registry}
        readonly={false}
        disabled={false}
        hasErrors={false}
        required={false}
        onChange={vi.fn()}
        onKeyRename={vi.fn()}
        onKeyRenameBlur={vi.fn()}
        onRemoveProperty={vi.fn()}
      >
        <input id='root_foo' />
      </FieldTemplate>,
    );
  }

  it('draws the description where displayLabel lets it draw the label', () => {
    const { container } = renderTemplate(true);
    expect(container.querySelector('#root_foo__description')).toHaveTextContent('About foo');
  });

  it('draws no description where displayLabel turns the label off', () => {
    const { container } = renderTemplate(false);
    expect(container.querySelector('#root_foo__description')).toBeNull();
  });
});

describe('FieldTemplate', () => {
  it("keeps the slot's sx and className when the root option leaves them unset", () => {
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{
          'ui:options': { mui: { rjsfSlotProps: { fieldFormControl: { sx: { mt: 4 }, className: 'slot' } } } },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.MuiFormControl-root.slot')).toBeInTheDocument();
    expect(container.querySelector('.slot')).toHaveStyle({ marginTop: '32px' });
  });

  it("joins the root option's className with the slot's", () => {
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{
          'ui:options': { mui: { className: 'root', rjsfSlotProps: { fieldFormControl: { className: 'slot' } } } },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.slot.root')).toBeInTheDocument();
  });

  it("merges the root option's sx with the slot's, the root's winning a clash", () => {
    const { container } = render(
      <Form
        schema={{ type: 'string' }}
        uiSchema={{
          'ui:options': {
            mui: { sx: { mt: 1 }, rjsfSlotProps: { fieldFormControl: { sx: { mt: 4, mb: 2 }, className: 'slot' } } },
          },
        }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.slot')).toHaveStyle({ marginTop: '8px', marginBottom: '16px' });
  });

  it("keeps the theme's default FormControl className when neither option sets one", () => {
    const theme = createTheme({ components: { MuiFormControl: { defaultProps: { className: 'themed' } } } });
    const { container } = render(
      <ThemeProvider theme={theme}>
        <Form schema={{ type: 'string' }} validator={validator} />
      </ThemeProvider>,
    );

    expect(container.querySelector('.MuiFormControl-root.themed')).toBeInTheDocument();
  });
});
