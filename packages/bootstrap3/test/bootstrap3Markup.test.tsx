import { generateTemplates as coreTemplates } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import Form, { generateTemplates } from '../src/index.ts';

const user = userEvent.setup();

/** The Bootstrap 3 classes a form carries, which `@rjsf/core`'s own tests stop asserting once core renders unstyled
 * markup
 */
describe('Bootstrap 3 markup', () => {
  it('styles a field, its label, help, errors and the error list', async () => {
    const schema: RJSFSchema = {
      type: 'object',
      required: ['name'],
      properties: { name: { type: 'string', title: 'Name' } },
    };
    const uiSchema: UiSchema = { name: { 'ui:help': 'Your name' } };
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} noHtml5Validate validator={validator} />);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    expect(container.querySelector('.form-group.has-error')).toContainElement(container.querySelector('#root_name'));
    expect(container.querySelector('label.control-label[for="root_name"]')).toHaveTextContent('Name');
    expect(container.querySelector('#root_name')).toHaveClass('form-control');
    expect(container.querySelector('.help-block')).toHaveTextContent('Your name');
    expect(container.querySelector('.error-detail.bs-callout.bs-callout-info .text-danger')).toHaveTextContent(
      "must have required property 'Name'",
    );
    expect(container.querySelector('.panel.panel-danger.errors .panel-heading .panel-title')).toHaveTextContent(
      'Errors',
    );
    expect(container.querySelector('.panel-danger .list-group .list-group-item.text-danger')).toHaveTextContent(
      "must have required property 'Name'",
    );
    expect(container.querySelector('button[type="submit"]')).toHaveClass('btn', 'btn-info');
  });

  it('styles the select, textarea, checkbox, checkboxes and radio widgets', () => {
    const schema: RJSFSchema = {
      type: 'object',
      properties: {
        color: { type: 'string', enum: ['red', 'green'] },
        notes: { type: 'string' },
        agree: { type: 'boolean' },
        toppings: { type: 'array', items: { type: 'string', enum: ['ham', 'egg'] }, uniqueItems: true },
        size: { type: 'string', enum: ['s', 'm'] },
      },
    };
    const uiSchema: UiSchema = {
      notes: { 'ui:widget': 'textarea' },
      toppings: { 'ui:widget': 'checkboxes', 'ui:options': { inline: true } },
      size: { 'ui:widget': 'radio', 'ui:options': { inline: true } },
    };
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(container.querySelector('select#root_color')).toHaveClass('form-control');
    expect(container.querySelector('textarea#root_notes')).toHaveClass('form-control');
    expect(container.querySelector('#root_agree')?.closest('.checkbox')).toBeInTheDocument();
    expect(container.querySelector('#root_toppings__0')?.closest('label')).toHaveClass('checkbox-inline');
    expect(container.querySelector('#root_size__0')?.closest('label')).toHaveClass('radio-inline');
  });

  it('styles the alt date widget as an inline list with Now and Clear buttons', () => {
    const schema: RJSFSchema = { type: 'string', format: 'date' };
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { container } = render(<Form schema={schema} uiSchema={{ 'ui:widget': 'alt-date' }} validator={validator} />);

    expect(container.querySelector('ul.list-inline li.list-inline-item select')).toHaveClass('form-control');
    expect(container.querySelector('.btn-now')).toHaveClass('btn', 'btn-info');
    expect(container.querySelector('.btn-clear')).toHaveClass('btn', 'btn-warning');
  });

  it('lays an array out on the grid with glyphicon buttons', () => {
    const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { container } = render(<Form schema={schema} initialFormData={['a', 'b']} validator={validator} />);

    expect(container.querySelector('.array-item-list')).toHaveClass('row');
    const item = container.querySelector('.rjsf-array-item')!;
    expect(item.querySelector('.col-xs-9.col-md-10.col-xl-11')).toContainElement(item.querySelector('input'));
    expect(item.querySelector('.col-xs-3.col-md-2.col-xl-1.array-item-toolbox .btn-group')).toBeInTheDocument();
    expect(item.querySelector('button.btn.btn-default .glyphicon.glyphicon-arrow-down')).toBeInTheDocument();
    expect(item.querySelector('button.btn.btn-danger .glyphicon.glyphicon-remove')).toBeInTheDocument();
    expect(
      container.querySelector(
        '.row > .col-xs-4.col-xs-offset-8.text-right > .btn.btn-info.btn-add.col-xs-12 .glyphicon-plus',
      ),
    ).toBeInTheDocument();
  });

  it("adds a Form's arrayItem and arrayItemToolbox classes beside the grid classes", () => {
    const schema: RJSFSchema = { type: 'array', items: { type: 'string' } };
    const { container } = render(
      // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
      <Form
        schema={schema}
        initialFormData={['a']}
        classMap={{ arrayItem: 'my-item', arrayItemToolbox: 'my-toolbox' }}
        validator={validator}
      />,
    );

    expect(container.querySelector('.rjsf-array-item')).toHaveClass('my-item');
    expect(container.querySelector('.array-item-toolbox')).toHaveClass('col-xs-3', 'my-toolbox');
  });

  it('lays an additional property out as a key, value and remove button row', () => {
    const schema: RJSFSchema = { type: 'object', additionalProperties: { type: 'string' } };
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const { container } = render(<Form schema={schema} initialFormData={{ extra: 'x' }} validator={validator} />);

    const row = container.querySelector('.form-group > .row');
    expect(row?.querySelector('.col-xs-5.form-additional > .form-group > label.control-label')).toHaveTextContent(
      'extra Key',
    );
    expect(row?.querySelector('.col-xs-5.form-additional input[id$="__key"]')).toHaveClass('form-control');
    expect(row?.querySelector('.form-additional.form-group.col-xs-5 #root_extra')).toHaveClass('form-control');
    expect(
      row?.querySelector('.col-xs-2 > button.btn.btn-danger.rjsf-object-property-remove.btn-block'),
    ).toBeInTheDocument();
  });

  // Core renders the same markup until it drops Bootstrap 3, so only identity shows the theme renders its own copies
  it("renders its own templates and buttons in place of core's, apart from core's SubmitButton", () => {
    // oxlint-disable-next-line typescript/no-deprecated -- the deprecated package under test
    const own = generateTemplates();
    const core = coreTemplates();

    for (const name of ['ArrayFieldItemTemplate', 'WrapIfAdditionalTemplate', 'TitleFieldTemplate'] as const) {
      expect(own[name], name).toBeDefined();
      expect(own[name], name).not.toBe(core[name]);
    }
    // Core's names, so a button the theme stops supplying fails here rather than being skipped
    for (const [name, coreButton] of Object.entries(core.ButtonTemplates)) {
      const button = own.ButtonTemplates?.[name as keyof typeof core.ButtonTemplates];
      expect(button, name).toBeDefined();
      if (name === 'SubmitButton') {
        expect(button, name).toBe(coreButton);
      } else {
        expect(button, name).not.toBe(coreButton);
      }
    }
  });
});
