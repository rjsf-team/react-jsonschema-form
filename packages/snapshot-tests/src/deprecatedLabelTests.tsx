import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema } from '@rjsf/utils';
import { titleId } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

/** Pins the Deprecated marker on a deprecated field's label wherever a theme draws it, other than on the widgets in each
 * theme's own table: an untitled property's key, an object's and array's heading, an `anyOf`/`oneOf` field's option
 * selector and option input, and a label the template draws.
 *
 * These live in their own file rather than alongside `formTests()` because every render advances React's `useId`
 * counter for the rest of the module, so running them there would renumber the ids in that suite's snapshots in
 * core and all eight themes.
 *
 * @param Form - The theme's `Form` component
 */
export function deprecatedLabelTests(Form: ComponentType<FormProps>) {
  describe("marks a deprecated field's label", () => {
    test('names an untitled deprecated property by its key with the Deprecated marker', () => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { foo: { type: 'string', deprecated: true } } }}
          validator={validator}
        />,
      );

      expect(screen.getByRole('textbox', { name: 'foo (deprecated)' })).toHaveAttribute('id', 'root_foo');
      expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
    });

    test("draws a deprecated object's and array's heading with the Deprecated marker", () => {
      const { container } = render(
        <Form
          schema={{
            type: 'object',
            properties: {
              obj: { type: 'object', title: 'Obj', deprecated: true, properties: { a: { type: 'string' } } },
              list: { type: 'array', title: 'List', deprecated: true, items: { type: 'string' } },
            },
          }}
          validator={validator}
        />,
      );

      expect(document.getElementById(titleId('root_obj'))).toHaveTextContent(/^Obj \(deprecated\)$/);
      expect(document.getElementById(titleId('root_list'))).toHaveTextContent(/^List \(deprecated\)$/);
      expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
    });

    // The field's label names both the option selector and the untitled option's input, which takes the field's label
    // rather than drawing one of its own
    test.each(['anyOf', 'oneOf'])(
      "names a deprecated %s field's option selector with the Deprecated marker",
      (keyword) => {
        const x: RJSFSchema = { title: 'X', deprecated: true, [keyword]: [{ type: 'string' }, { type: 'number' }] };
        const { container } = render(<Form schema={{ type: 'object', properties: { x } }} validator={validator} />);

        expect(screen.getByRole('combobox', { name: 'X (deprecated)' })).toHaveAttribute(
          'id',
          `root_x__${keyword.toLowerCase()}_select`,
        );
        expect(screen.getByRole('textbox', { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
        expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
      },
    );

    test.each(['anyOf', 'oneOf'])(
      "names a deprecated %s field's option input titled as the field with the Deprecated marker",
      (keyword) => {
        const x: RJSFSchema = {
          title: 'X',
          deprecated: true,
          [keyword]: [{ type: 'string', title: 'X' }, { type: 'number' }],
        };
        const { container } = render(<Form schema={{ type: 'object', properties: { x } }} validator={validator} />);

        expect(screen.getByRole('textbox', { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
        expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
      },
    );

    test('names a deprecated field whose label the template draws with the Deprecated marker', () => {
      const { container } = render(
        <Form
          schema={{ type: 'object', properties: { x: { type: 'integer', maximum: 5, title: 'X', deprecated: true } } }}
          uiSchema={{ x: { 'ui:widget': 'RatingWidget' } }}
          validator={validator}
        />,
      );

      expect(screen.getByRole('radiogroup', { name: 'X (deprecated)' })).toHaveAttribute('id', 'root_x');
      expect(container.innerHTML).not.toContain('(deprecated) (deprecated)');
    });
  });
}
