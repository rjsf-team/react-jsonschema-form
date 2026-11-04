import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { act, render } from '@testing-library/react';

const schema: RJSFSchema = {
  type: 'object',
  properties: { end: { type: 'string', title: 'End date' } },
  additionalProperties: { type: 'string' },
};

function byId(container: ParentNode, id: string) {
  const element = container.querySelector<HTMLInputElement>(`[id="${id}"]`);
  if (!element) {
    throw new Error(`No element with the id ${id}`);
  }
  return element;
}

// Moved through the DOM rather than user-event, which isn't among this package's peer dependencies. Focusing the value
// input is what tabbing out of the key input does: the blur names it as where focus is heading
function renameKey(container: ParentNode, from: string, to: string, valuePart = '') {
  const keyInput = byId(container, `root_${from}__key`);
  const value = byId(container, `root_${from}${valuePart}`);
  act(() => keyInput.focus());
  keyInput.value = to;
  act(() => value.focus());
}

/** Pins that renaming an additional property's key keeps its field's instance, through later renames of other keys as
 * well, so a template that keys what it wraps a property in by the property's name, or by its id, which a rename changes,
 * would remount it and lose what its widget holds (#5595)
 *
 * @param Form - The theme's `Form` component
 */
export function renamedKeyTests(Form: ComponentType<FormProps>) {
  describe('renaming an additional property key', () => {
    test('keeps the field and sends focus on to it', () => {
      const { container } = render(<Form schema={schema} validator={validator} initialFormData={{ a: 'one' }} />);
      const value = byId(container, 'root_a');

      renameKey(container, 'a', 'b');

      expect(byId(container, 'root_b')).toBe(value);
      expect(value).toHaveFocus();
    });

    test('keeps the field when another key is renamed later', () => {
      const { container } = render(
        <Form schema={schema} validator={validator} initialFormData={{ a: 'one', c: 'two' }} />,
      );
      const value = byId(container, 'root_a');

      renameKey(container, 'a', 'b');
      renameKey(container, 'c', 'd');

      expect(byId(container, 'root_b')).toBe(value);
    });

    test.each<[string, RJSFSchema, UiSchema, unknown, string]>([
      ['array items', { type: 'array', items: { type: 'string' } }, {}, ['one'], '_0'],
      ['radio buttons', { type: 'string', enum: ['p', 'q'] }, { 'ui:widget': 'radio' }, 'p', '__0'],
      ['date parts', { type: 'string', format: 'date' }, { 'ui:widget': 'alt-date' }, '2020-05-03', '__year'],
    ])('keeps the %s of its value, whose ids come from the name', (_, value, uiSchema, data, part) => {
      const { container } = render(
        <Form
          schema={{ type: 'object', additionalProperties: value }}
          uiSchema={{ additionalProperties: uiSchema }}
          validator={validator}
          initialFormData={{ a: data }}
        />,
      );
      const control = byId(container, `root_a${part}`);

      renameKey(container, 'a', 'b', part);

      expect(byId(container, `root_b${part}`)).toBe(control);
    });

    test('sends focus on to the field of a declared property it is renamed onto', () => {
      const { container } = render(<Form schema={schema} validator={validator} initialFormData={{ a: 'one' }} />);

      renameKey(container, 'a', 'end');

      expect(byId(container, 'root_end')).toHaveFocus();
    });
  });
}
