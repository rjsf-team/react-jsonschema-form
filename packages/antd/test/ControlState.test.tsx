import CoreForm from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import Form from '../src/index.ts';

describe('a read-only CheckboxWidget the form leaves enabled', () => {
  it('takes no native required, so it does not block the submit of a field its user cannot change (#5593)', () => {
    const { container } = render(
      <Form
        schema={{
          type: 'object',
          required: ['agree'],
          properties: { agree: { type: 'boolean', const: true, title: 'Agree' } },
        }}
        uiSchema={{ agree: { 'ui:readonly': true } }}
        formContext={{ readonlyAsDisabled: false }}
        initialFormData={{ agree: false }}
        validator={validator}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /Agree/ });
    expect(checkbox).toBeEnabled();
    expect(checkbox).not.toBeRequired();
    expect(checkbox).toHaveAttribute('aria-readonly', 'true');
    expect(container.querySelector('form')?.checkValidity()).toBe(true);
  });

  it('keeps native required while it is editable', () => {
    render(
      <Form
        schema={{
          type: 'object',
          required: ['agree'],
          properties: { agree: { type: 'boolean', const: true, title: 'Agree' } },
        }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('checkbox', { name: /Agree/ })).toBeRequired();
    expect(screen.getByRole('checkbox', { name: /Agree/ })).not.toHaveAttribute('aria-readonly');
  });
});

describe('ui:autofocus', () => {
  it.each<[string, RJSFSchema, UiSchema]>([
    ['text', { type: 'string' }, {}],
    ['email', { type: 'string', format: 'email' }, {}],
    ['number', { type: 'number' }, {}],
    ['textarea', { type: 'string' }, { 'ui:widget': 'textarea' }],
    ['password', { type: 'string' }, { 'ui:widget': 'password' }],
    ['date', { type: 'string', format: 'date' }, {}],
    ['date-time', { type: 'string', format: 'date-time' }, {}],
  ])('focuses a %s field marked with it (#5597)', (_, x, uiSchema) => {
    const { container } = render(
      <Form
        schema={{ type: 'object', properties: { x: { ...x, title: 'X' } } }}
        uiSchema={{ x: { ...uiSchema, 'ui:autofocus': true } }}
        validator={validator}
      />,
    );

    expect(container.querySelector('#root_x')).toHaveFocus();
  });
});

describe('a native submit', () => {
  const schema: RJSFSchema = {
    type: 'object',
    properties: {
      sel: { type: 'string', enum: ['a', 'b'] },
      multi: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['a', 'b', 'c'] } },
      range: { type: 'integer', minimum: 0, maximum: 10 },
    },
  };
  const uiSchema: UiSchema = { multi: { 'ui:widget': 'select' }, range: { 'ui:widget': 'range' } };
  const formData = { sel: 'b', multi: ['a', 'c'], range: 4 };

  function entriesOf(form: HTMLFormElement | null, name: string) {
    return form ? new FormData(form).getAll(name) : undefined;
  }

  it('gets the select, multi-select and range values core posts for them (#5597)', () => {
    const { container: core } = render(
      <CoreForm schema={schema} uiSchema={uiSchema} initialFormData={formData} validator={validator} />,
    );
    const { container: antd } = render(
      <Form schema={schema} uiSchema={uiSchema} initialFormData={formData} validator={validator} />,
    );

    for (const name of ['root_sel', 'root_multi', 'root_range']) {
      const posted = entriesOf(antd.querySelector('form'), name);
      expect(posted).not.toHaveLength(0);
      expect(posted).toEqual(entriesOf(core.querySelector('form'), name));
    }
  });

  it('gets what core posts for a select with nothing selected', () => {
    const { container: core } = render(<CoreForm schema={schema} uiSchema={uiSchema} validator={validator} />);
    const { container: antd } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    for (const name of ['root_sel', 'root_multi']) {
      expect(entriesOf(antd.querySelector('form'), name)).toEqual(entriesOf(core.querySelector('form'), name));
    }
  });

  it('gets what core posts for a select with nothing selected under ui:emptyValue', () => {
    const emptyValueUiSchema: UiSchema = { ...uiSchema, sel: { 'ui:emptyValue': 'none' } };
    const { container: core } = render(
      <CoreForm schema={schema} uiSchema={emptyValueUiSchema} validator={validator} />,
    );
    const { container: antd } = render(<Form schema={schema} uiSchema={emptyValueUiSchema} validator={validator} />);

    expect(entriesOf(antd.querySelector('form'), 'root_sel')).toEqual(
      entriesOf(core.querySelector('form'), 'root_sel'),
    );
  });

  it('gets the value the slider is drawn at for an empty range', () => {
    const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);

    expect(container.querySelector('.ant-slider-handle')).toHaveAttribute('aria-valuenow', '0');
    expect(entriesOf(container.querySelector('form'), 'root_range')).toEqual(['0']);
  });

  it('gets a value the form data holds twice once, as a native multi-select posts it', () => {
    const { container } = render(
      <Form schema={schema} uiSchema={uiSchema} initialFormData={{ multi: ['a', 'a'] }} validator={validator} />,
    );

    expect(entriesOf(container.querySelector('form'), 'root_multi')).toEqual(['0']);
  });

  it('gets nothing for a disabled select or range, as for a disabled native control', () => {
    const { container } = render(
      <Form schema={schema} uiSchema={uiSchema} initialFormData={formData} disabled validator={validator} />,
    );

    const form = container.querySelector('form');
    expect(entriesOf(form, 'root_sel')).toEqual([]);
    expect(entriesOf(form, 'root_multi')).toEqual([]);
    expect(entriesOf(form, 'root_range')).toEqual([]);
  });
});

describe('a read-only CheckboxesWidget the form leaves enabled', () => {
  it('marks each checkbox read-only (#5597)', () => {
    render(
      <Form
        schema={{
          type: 'object',
          properties: { c: { type: 'array', uniqueItems: true, items: { type: 'string', enum: ['a', 'b'] } } },
        }}
        uiSchema={{ c: { 'ui:widget': 'checkboxes', 'ui:readonly': true } }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
      />,
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    for (const checkbox of checkboxes) {
      expect(checkbox).toBeEnabled();
      expect(checkbox).toHaveAttribute('aria-readonly', 'true');
    }
  });
});

describe('a read-only RadioWidget the form leaves enabled', () => {
  it('is announced as read-only (#5597)', () => {
    render(
      <Form
        schema={{
          type: 'object',
          required: ['c'],
          properties: { c: { type: 'string', enum: ['a', 'b'], title: 'C' } },
        }}
        uiSchema={{ c: { 'ui:widget': 'radio', 'ui:readonly': true } }}
        formContext={{ readonlyAsDisabled: false }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'C' })).toHaveAttribute('aria-readonly', 'true');
  });

  it.each<[string, UiSchema]>([
    ['while it is editable', { 'ui:widget': 'radio' }],
    ['once readonlyAsDisabled disables it', { 'ui:widget': 'radio', 'ui:readonly': true }],
  ])('is not marked read-only %s', (_, uiSchema) => {
    render(
      <Form
        schema={{ type: 'object', properties: { c: { type: 'string', enum: ['a', 'b'], title: 'C' } } }}
        uiSchema={{ c: uiSchema }}
        validator={validator}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'C' })).not.toHaveAttribute('aria-readonly');
  });
});
