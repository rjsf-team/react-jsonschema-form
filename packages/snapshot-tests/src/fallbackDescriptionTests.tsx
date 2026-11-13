import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

/** Pins that a field's own `ui:field` naming `FallbackField` or nothing leaves the fallback UI's description where the
 * theme draws it with no `ui:field` at all, rather than moving it between the template above the type selector and the
 * value field below it (#5389), and that naming a boolean's checkbox leaves its label and description where they are
 * with no `ui:widget` at all, and a radio's where a text input's are (#5581).
 *
 * @param Form - The theme's `Form` component
 * @param descriptionAbove - Whether the theme draws the description above the type selector rather than below it
 */
export function fallbackDescriptionTests(Form: ComponentType<FormProps>, descriptionAbove: boolean) {
  describe("the fallback UI's description, whatever its ui:field names (#5389)", () => {
    // A `ui:field` naming nothing warns that no such field is registered. `setupConsoleWarnSuppression()` lives in the
    // repo's `testing/` directory, which this published package can't import. `vi.spyOn()` hands back a spy the caller's
    // file already installed, and restoring that would remove it for the caller's later tests, so whatever
    // `console.warn` was is put back as it was
    let warn: typeof console.warn;
    beforeEach(() => {
      // oxlint-disable-next-line no-console
      warn = console.warn;
      // oxlint-disable-next-line no-console
      console.warn = () => undefined;
    });
    afterEach(() => {
      // oxlint-disable-next-line no-console
      console.warn = warn;
    });

    test.each<[string, UiSchema]>([
      ['no ui:field', {}],
      ['a ui:field naming FallbackField', { 'ui:field': 'FallbackField' }],
      ['a ui:field naming nothing', { 'ui:field': 'Nope' }],
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

  describe("the fallback UI's label and description of a boolean (#5581)", () => {
    function renderedLayout(valUiSchema: UiSchema, type: RJSFSchema['type'] = ['boolean', 'string']) {
      const { unmount } = render(
        <Form
          schema={{ type: 'object', properties: { val: { type, title: 'Val', description: 'Desc' } } }}
          uiSchema={{ val: valUiSchema }}
          validator={validator}
          useFallbackUiForUnsupportedType
        />,
      );
      const typeSelector = screen.getByRole('combobox', { name: 'Type' });
      // `@rjsf/mui` repeats a text input's label in its outline's notch, hidden from everyone but this query
      const isAbove = (text: string) =>
        screen
          .getByText(text, { ignore: 'script, style, fieldset[aria-hidden] span' })
          .compareDocumentPosition(typeSelector) === Node.DOCUMENT_POSITION_FOLLOWING;
      const layout = { label: isAbove('Val'), description: isAbove('Desc') };
      unmount();
      return layout;
    }

    test.each<[string, UiSchema]>([
      ["ui:widget: 'checkbox'", { 'ui:widget': 'checkbox' }],
      ["ui:widget: 'CheckboxWidget'", { 'ui:widget': 'CheckboxWidget' }],
      ["ui:options.widget: 'checkbox'", { 'ui:options': { widget: 'checkbox' } }],
    ])('are drawn once, where they are with no ui:widget, under %s', (_, valUiSchema) => {
      expect(renderedLayout(valUiSchema)).toEqual(renderedLayout({}));
    });

    test.each<[string, RJSFSchema['type']]>([
      ['boolean first', ['boolean', 'string']],
      ['string first', ['string', 'boolean']],
    ])("are drawn once, where a text input's are, for a radio on a list naming %s", (_, type) => {
      expect(renderedLayout({ 'ui:widget': 'radio' }, type)).toEqual(renderedLayout({}, ['string', 'boolean']));
    });
  });
}
