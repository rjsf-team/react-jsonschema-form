import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';
import type { MockInstance } from 'vitest';

/** Pins that a field's own `ui:field` naming `FallbackField` or nothing leaves the fallback UI's description where the
 * theme draws it with no `ui:field` at all, rather than moving it between the template above the type selector and the
 * value field below it (#5389).
 *
 * @param Form - The theme's `Form` component
 * @param descriptionAbove - Whether the theme draws the description above the type selector rather than below it
 */
export function fallbackDescriptionTests(Form: ComponentType<FormProps>, descriptionAbove: boolean) {
  describe("the fallback UI's description, however its ui:field is spelled (#5389)", () => {
    // A `ui:field` naming nothing warns that no such field is registered. `setupConsoleWarnSuppression()` lives in the
    // repo's `testing/` directory, which this published package can't import. Only this spy is restored, so a spy the
    // caller's file installs for every test survives these
    let warnSpy: MockInstance;
    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => {
      warnSpy.mockRestore();
    });

    test.each<[string, UiSchema]>([
      ['no ui:field', {}],
      ['a ui:field naming FallbackField', { 'ui:field': 'FallbackField' }],
      ['a ui:field naming nothing', { 'ui:field': 'Nope' }],
      ['a ui:options.field naming FallbackField', { 'ui:options': { field: 'FallbackField' } }],
      ['a ui:options.field naming nothing', { 'ui:options': { field: 'Nope' } }],
    ])(`is drawn once, ${descriptionAbove ? 'above' : 'below'} the type selector, under %s`, (_, valUiSchema) => {
      const { container } = render(
        <Form
          schema={{
            type: 'object',
            properties: { val: { type: ['string', 'number'], title: 'Val', description: 'Desc' } },
          }}
          uiSchema={{ val: valUiSchema }}
          validator={validator}
          useFallbackUiForUnsupportedType
        />,
      );

      expect(screen.getAllByText('Desc')).toHaveLength(1);
      const described = container.querySelectorAll('#root_val__description');
      expect(described).toHaveLength(1);
      expect(described[0]).toHaveTextContent('Desc');
      const typeSelector = screen.getByRole('combobox', { name: 'Type' });
      expect(described[0].compareDocumentPosition(typeSelector)).toBe(
        descriptionAbove ? Node.DOCUMENT_POSITION_FOLLOWING : Node.DOCUMENT_POSITION_PRECEDING,
      );
      // A template drawing the description below its children puts it below the selector whether the outer field or the
      // value field draws it, so the order alone can't tell which did: the outer field's copy shares its nearest
      // wrapper around the value with the selector, and the value field's would not
      const value = container.querySelector('#root_val')!;
      let owner = described[0].parentElement;
      while (owner && !owner.contains(value)) {
        owner = owner.parentElement;
      }
      expect(owner).toContainElement(typeSelector);
    });
  });
}
