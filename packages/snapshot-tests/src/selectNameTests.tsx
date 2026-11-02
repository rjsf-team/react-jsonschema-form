import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RegistryWidgetsType, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };

/** Pins that a `SelectWidget` no label names, which shows its value rather than a name, is named by its placeholder or
 * the translated prompt, and that one its label names takes no `aria-label` (#5711)
 *
 * @param Form - The theme's `Form` component
 * @param [widgets] - Widgets the form registers, such as a `SelectWidget` other than the theme's own
 */
export function selectNameTests(Form: ComponentType<FormProps>, widgets?: RegistryWidgetsType) {
  describe('SelectWidget with no label naming it', () => {
    test.each<[string, RJSFSchema, string | undefined]>([
      ['a root select', enumSchema, undefined],
      ['an array item select', { type: 'array', items: enumSchema }, undefined],
      ['a root select with a placeholder', enumSchema, 'Pick one'],
    ])('names %s by its placeholder, else the translated prompt', (_, schema, placeholder) => {
      const isArray = schema.type === 'array';
      render(
        <Form
          schema={schema}
          uiSchema={placeholder ? { 'ui:placeholder': placeholder } : {}}
          initialFormData={isArray ? ['a'] : undefined}
          widgets={widgets}
          validator={validator}
        />,
      );

      expect(document.getElementById(isArray ? 'root_0' : 'root')).toHaveAccessibleName(placeholder ?? 'Select ...');
    });

    test('gives a select its label names no aria-label', () => {
      render(<Form schema={{ ...enumSchema, title: 'Color' }} widgets={widgets} validator={validator} />);

      expect(document.getElementById('root')).toHaveAccessibleName('Color');
      expect(document.getElementById('root')).not.toHaveAttribute('aria-label');
    });
  });
}
