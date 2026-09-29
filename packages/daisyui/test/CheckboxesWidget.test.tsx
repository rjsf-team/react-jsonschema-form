import type { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { vi } from 'vitest';

import Form from '../src/index.ts';
import CheckboxesWidget from '../src/widgets/CheckboxesWidget/CheckboxesWidget.tsx';
import { makeWidgetMockProps } from './helpers/createMocks.ts';

const user = userEvent.setup();

const objectOptions = [
  { label: 'One', value: { a: 1 } },
  { label: 'Two', value: { a: 2 } },
];

const schema: RJSFSchema = {
  type: 'object',
  required: ['choices'],
  properties: {
    choices: { type: 'array', title: 'Choices', items: { type: 'string', enum: ['a', 'b', 'c'] }, uniqueItems: true },
  },
};

describe('CheckboxesWidget', () => {
  test('checks only the selected object options', () => {
    render(
      <CheckboxesWidget {...makeWidgetMockProps({ value: [{ a: 2 }], options: { enumOptions: objectOptions } })} />,
    );

    expect(screen.getByRole('checkbox', { name: 'Two' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'One' })).not.toBeChecked();
  });

  test('deselects an object option that is equal to, but not the same instance as, its constant', async () => {
    const onChange = vi.fn();
    render(
      <CheckboxesWidget
        {...makeWidgetMockProps({ value: [{ a: 1 }, { a: 2 }], onChange, options: { enumOptions: objectOptions } })}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'One' }));

    expect(onChange).toHaveBeenLastCalledWith([{ a: 2 }]);
  });

  test('selecting an object option keeps the selection in the order of the options', async () => {
    const onChange = vi.fn();
    render(
      <CheckboxesWidget
        {...makeWidgetMockProps({ value: [{ a: 2 }], onChange, options: { enumOptions: objectOptions } })}
      />,
    );

    await user.click(screen.getByRole('checkbox', { name: 'One' }));

    expect(onChange).toHaveBeenLastCalledWith([{ a: 1 }, { a: 2 }]);
  });

  // HTML5 constraint validation weighs each box on its own, so a `required` option demands *that* box — every box, for
  // a widget that puts the attribute on all of them. A radio group is the one place the attribute means "one of these",
  // because the browser reads same-named radios as a group; checkboxes share a name without sharing the requirement
  test('lets a required array be submitted with one option checked', async () => {
    const onSubmit = vi.fn();
    const onError = vi.fn();
    const { container } = render(
      <Form
        schema={schema}
        uiSchema={{ choices: { 'ui:widget': 'checkboxes' } }}
        validator={validator}
        onSubmit={onSubmit}
        onError={onError}
      />,
    );

    const boxes = container.querySelectorAll('input[type=checkbox]');
    expect(boxes).toHaveLength(3);
    boxes.forEach((box) => expect(box).not.toHaveAttribute('required'));

    await user.click(boxes[0]);
    await user.click(screen.getByRole('button', { name: 'Submit' }));

    // Constraint validation weighs each box on its own, so the attribute on every one of them asks for all of them:
    // the browser refuses a submit with one checked, and refuses it silently, with neither callback firing
    expect(onError).not.toHaveBeenCalled();
    expect(onSubmit.mock.calls[0]?.[0].formData).toEqual({ choices: ['a'] });
  });
});
