import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RegistryWidgetsType, RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

const enumSchema: RJSFSchema = { type: 'string', enum: ['a', 'b'] };

/** Pins that a `SelectWidget` no label names, which shows its value rather than a name, is named by its placeholder or
 * the translated prompt, that a `RadioWidget`'s `radiogroup` no label names is named by its own translated prompt, and
 * that one its label names takes no `aria-label` (#5711, #5586)
 *
 * @param Form - The theme's `Form` component
 * @param [widgets] - Widgets the form registers, such as a `SelectWidget` other than the theme's own
 */
export function controlNameTests(Form: ComponentType<FormProps>, widgets?: RegistryWidgetsType) {
  describe('RadioWidget with no label naming it', () => {
    test('names an untitled radiogroup by the translated prompt', () => {
      render(<Form schema={enumSchema} uiSchema={{ 'ui:widget': 'radio' }} widgets={widgets} validator={validator} />);

      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Choose an option');
    });

    test('gives a radiogroup its label names no aria-label', () => {
      render(
        <Form
          schema={{ ...enumSchema, title: 'Color' }}
          uiSchema={{ 'ui:widget': 'radio' }}
          widgets={widgets}
          validator={validator}
        />,
      );

      expect(screen.getByRole('radiogroup')).toHaveAccessibleName('Color');
      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
    });

    test("gives an untitled rating's stars no fallback name, since they name the choices alone", () => {
      render(
        <Form
          schema={{ type: 'integer', minimum: 1, maximum: 5 }}
          uiSchema={{ 'ui:widget': 'RatingWidget' }}
          widgets={widgets}
          validator={validator}
        />,
      );

      expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-label');
    });
  });

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
