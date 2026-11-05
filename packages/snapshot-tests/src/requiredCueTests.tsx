import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** Counts the `*`s a form shows. MUI repeats a label with its marker in the hidden `<legend>` its outline is notched by,
 * which draws no second marker
 *
 * @param container - The element the form rendered into
 * @returns - How many `*`s it shows
 */
function countStars(container: HTMLElement) {
  const shown = container.cloneNode(true) as HTMLElement;
  shown.querySelectorAll('fieldset[aria-hidden] legend').forEach((legend) => legend.remove());
  return shown.textContent.split('*').length - 1;
}

// Left out, the hidden input Radix's checkbox renders beside its button to take part in a native form
const requiredIds = (container: HTMLElement) =>
  [...container.querySelectorAll('[required]:not([aria-hidden="true"]), [aria-required="true"]')].map(
    (element) => element.id,
  );

const OTHER_OPTION: RJSFSchema = { title: 'B', type: 'number' };

const withOption = (option: RJSFSchema, required = ['pet']): RJSFSchema => ({
  type: 'object',
  required,
  properties: { pet: { oneOf: [option, OTHER_OPTION] } },
});

/** Pins that a required field gives one required cue, on its own label, whichever option an `anyOf`/`oneOf` field shows
 * and whichever component draws that label (#5573)
 *
 * @param Form - The theme's `Form` component
 * @param [countMarkers=countStars] - Counts the required markers a form shows, for a theme that draws them through CSS
 */
export function requiredCueTests(
  Form: ComponentType<FormProps>,
  countMarkers: (container: HTMLElement) => number = countStars,
) {
  describe('the required cue of an anyOf/oneOf field (#5573)', () => {
    function renderForm(schema: RJSFSchema, uiSchema?: UiSchema, formData?: unknown) {
      return render(<Form schema={schema} uiSchema={uiSchema} initialFormData={formData} validator={validator} />)
        .container;
    }

    // The selector picks an option index rather than a value, so nothing in these is required but the option's control
    test.each<[string, RJSFSchema, string[]]>([
      ['a titled object', { title: 'A', type: 'object', properties: { x: { type: 'string' } } }, []],
      ['an untitled object', { type: 'object', properties: { x: { type: 'string' } } }, []],
      ['a titled array', { title: 'A', type: 'array', items: { type: 'string' } }, []],
      ['a null', { title: 'A', type: 'null' }, []],
      ['an untitled null', { type: 'null' }, []],
      ['a text', { title: 'A', type: 'string' }, ['root_pet']],
      ['a checkbox that has to be checked', { title: 'A', type: 'boolean', const: true }, ['root_pet']],
    ])('shows one marker with %s option selected, and requires only its control', (_, option, ids) => {
      const container = renderForm(withOption(option));
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual(ids);
    });

    it('shows one marker with the other option selected', () => {
      const container = renderForm(
        withOption({ title: 'A', type: 'object', properties: { x: { type: 'string' } } }),
        undefined,
        {
          pet: 1,
        },
      );
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual(['root_pet']);
    });

    it('shows one marker on a selector of radios, which it leaves unrequired', () => {
      const container = renderForm(withOption({ title: 'A', type: 'null' }), { pet: { 'ui:widget': 'radio' } });
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual([]);
    });

    it("leaves the marker on a required property of the option, which is another field's", () => {
      const container = renderForm(
        withOption({ title: 'A', type: 'object', required: ['x'], properties: { x: { type: 'string' } } }),
      );
      expect(countMarkers(container)).toBe(2);
      expect(requiredIds(container)).toEqual(['root_pet_x']);
    });

    it('shows one marker for an object rendered beside its options', () => {
      const container = renderForm({
        type: 'object',
        required: ['pet'],
        properties: {
          pet: {
            type: 'object',
            properties: { name: { type: 'string' } },
            oneOf: [{ title: 'A', properties: { x: { type: 'string' } } }, OTHER_OPTION],
          },
        },
      });
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual([]);
    });

    it('shows no marker where the field is not required', () => {
      const container = renderForm(withOption({ title: 'A', type: 'string' }, []));
      expect(countMarkers(container)).toBe(0);
      expect(requiredIds(container)).toEqual([]);
    });

    it('shows one marker on the value the fallback UI renders under the same id', () => {
      const { container } = render(
        <Form
          schema={{ type: 'object', required: ['pet'], properties: { pet: { title: 'P' } } }}
          initialFormData={{ pet: 'a' }}
          useFallbackUiForUnsupportedType
          validator={validator}
        />,
      );
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual(['root_pet']);
    });
  });
}
