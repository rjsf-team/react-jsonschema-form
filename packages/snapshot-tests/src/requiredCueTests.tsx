import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

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

// Left out, the hidden input Radix's checkbox renders beside its button to take part in a native form, and anything but
// a form control, on which `required` means nothing, as on the box Mantine's `MultiSelect` draws around its input
const requiredIds = (container: HTMLElement) =>
  [
    ...container.querySelectorAll(
      ':is(input, select, textarea)[required]:not([aria-hidden="true"]), [aria-required="true"]',
    ),
  ].map((element) => element.id);

const OTHER_OPTION: RJSFSchema = { title: 'B', type: 'number' };

const colors = (extra: RJSFSchema = {}, required = ['c']): RJSFSchema => ({
  type: 'object',
  required,
  properties: {
    c: { type: 'array', title: 'Colors', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true, ...extra },
  },
});

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

    it("shows one marker where the option's `ui:required` asks for it", () => {
      const container = renderForm(withOption({ title: 'A', type: 'string' }, []), {
        pet: { oneOf: [{ 'ui:required': true }, {}] },
      });
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual(['root_pet']);
    });

    it("shows no marker where the option's `ui:required` asks for a value it has no control for", () => {
      const container = renderForm(withOption({ title: 'Anything' }, []), {
        pet: { oneOf: [{ 'ui:required': true }, {}] },
      });
      expect(countMarkers(container)).toBe(0);
    });

    it('shows no marker on a checkbox whose `false` the schema accepts', () => {
      expect(countMarkers(renderForm(withOption({ title: 'A', type: 'boolean' })))).toBe(0);
    });

    it("shows one marker on a checkbox with the option's `ui:required`, which nothing seeds a value for", () => {
      const container = renderForm(withOption({ title: 'A', type: 'boolean' }, []), {
        pet: { oneOf: [{ 'ui:required': true }, {}] },
      });
      expect(countMarkers(container)).toBe(1);
    });

    it('shows one marker on a checkbox with its own `ui:required`, which nothing seeds a value for', () => {
      const container = renderForm(
        { type: 'object', properties: { b: { type: 'boolean', title: 'B' } } },
        { b: { 'ui:required': true } },
      );
      expect(countMarkers(container)).toBe(1);
      // RJSF's own check reports it, so the browser's doesn't stop the submit first, while a screen reader is told
      expect(container.querySelector('[required]:not([aria-hidden="true"])')).toBeNull();
      expect(container.querySelector('[aria-required="true"]')).not.toBeNull();
    });

    it('marks nothing on a schema-required checkbox holding no value under a parent the data leaves out', () => {
      const { container } = render(
        <Form
          schema={{
            type: 'object',
            properties: { o: { type: 'object', required: ['b'], properties: { b: { type: 'boolean', title: 'B' } } } },
          }}
          defaultFormStateBehavior={{ emptyObjectFields: 'skipDefaults' }}
          validator={validator}
        />,
      );
      expect(screen.getByRole('checkbox', { name: 'B' })).toBeInTheDocument();
      expect(countMarkers(container)).toBe(0);
      expect(requiredIds(container)).toEqual([]);
    });

    it("shows no marker where the option's `ui:required` turns it off", () => {
      const container = renderForm(withOption({ title: 'A', type: 'string' }), {
        pet: { oneOf: [{ 'ui:required': false }, {}] },
      });
      expect(countMarkers(container)).toBe(0);
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
  // A required array left alone holds `[]`, so only `minItems` or `ui:required` demands a choice (#5744)
  describe('the required cue of a multiple select (#5744)', () => {
    it('says nothing where `required` alone leaves an empty array valid', () => {
      const { container } = render(<Form schema={colors()} validator={validator} />);
      expect(countMarkers(container)).toBe(0);
      expect(requiredIds(container)).toEqual([]);
    });

    it.each<[string, RJSFSchema, UiSchema]>([
      ['a `minItems`', colors({ minItems: 1 }), {}],
      ['`ui:required`', colors(), { c: { 'ui:required': true } }],
    ])('marks its label once and requires it with %s', (_, schema, uiSchema) => {
      const { container } = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} />);
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual(['root_c']);
    });
  });

  describe('the required cue of a group of checkboxes (#5573)', () => {
    function renderColors(schema: RJSFSchema, uiOptions: UiSchema = {}) {
      return render(
        <Form schema={schema} uiSchema={{ c: { 'ui:widget': 'checkboxes', ...uiOptions } }} validator={validator} />,
      ).container;
    }

    it('says so in the name of a group that has to have a box checked, and marks its label once', () => {
      const container = renderColors(colors({ minItems: 1 }));
      expect(screen.getByRole('group', { name: 'Colors required' })).toBeInTheDocument();
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual([]);
    });

    it('says nothing where `required` alone leaves an empty array valid', () => {
      const container = renderColors(colors());
      expect(screen.getByRole('group', { name: 'Colors' })).toBeInTheDocument();
      expect(countMarkers(container)).toBe(0);
      expect(requiredIds(container)).toEqual([]);
    });

    it('says nothing where `minItems` applies to a field that is not required', () => {
      const container = renderColors(colors({ minItems: 1 }, []));
      expect(screen.getByRole('group', { name: 'Colors' })).toBeInTheDocument();
      expect(countMarkers(container)).toBe(0);
    });

    it.each<[string, string[]]>([
      ['a field the schema leaves optional', []],
      ['a field the schema requires too', ['c']],
    ])('says so where `ui:required` asks for it, on %s', (_, required) => {
      const container = renderColors(colors({}, required), { 'ui:required': true });
      expect(screen.getByRole('group', { name: 'Colors required' })).toBeInTheDocument();
      expect(countMarkers(container)).toBe(1);
      expect(requiredIds(container)).toEqual([]);
    });

    describe('shown by an option', () => {
      const asOption = (option: RJSFSchema, required: string[]): RJSFSchema => ({
        type: 'object',
        required,
        properties: {
          c: {
            title: 'Colors',
            oneOf: [
              { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true, ...option },
              OTHER_OPTION,
            ],
          },
        },
      });
      const renderOption = (schema: RJSFSchema, uiOptions: UiSchema = {}) =>
        render(
          <Form
            schema={schema}
            uiSchema={{ c: { oneOf: [{ 'ui:widget': 'checkboxes', ...uiOptions }, {}] } }}
            validator={validator}
          />,
        ).container;

      it('shows no marker where `required` alone leaves an empty array valid', () => {
        expect(countMarkers(renderOption(asOption({}, ['c'])))).toBe(0);
      });

      it.each<[string, RJSFSchema, UiSchema]>([
        ['a `minItems` on a required field', asOption({ minItems: 1 }, ['c']), {}],
        ['`ui:required` on an optional field', asOption({}, []), { 'ui:required': true }],
      ])('shows one marker with %s', (_, schema, uiOptions) => {
        expect(countMarkers(renderOption(schema, uiOptions))).toBe(1);
      });

      it("says so where the field's own `ui:required` asks for it", () => {
        const { container } = render(
          <Form
            schema={asOption({}, [])}
            uiSchema={{ c: { 'ui:required': true, oneOf: [{ 'ui:widget': 'checkboxes' }, {}] } }}
            initialFormData={{ c: [] }}
            validator={validator}
          />,
        );
        expect(screen.getByRole('group', { name: 'Colors required' })).toBeInTheDocument();
        expect(countMarkers(container)).toBe(1);
      });

      // The `ui:required` check reads the option shown, not the options it renders in turn, so `[]` passes there
      it("says nothing on a group a nested option shows under the field's own `ui:required`", () => {
        render(
          <Form
            schema={{
              type: 'object',
              properties: {
                c: {
                  title: 'Colors',
                  oneOf: [
                    {
                      oneOf: [
                        { type: 'array', items: { type: 'string', enum: ['a', 'b'] }, uniqueItems: true },
                        { type: 'string' },
                      ],
                    },
                    OTHER_OPTION,
                  ],
                },
              },
            }}
            uiSchema={{ c: { 'ui:required': true, oneOf: [{ oneOf: [{ 'ui:widget': 'checkboxes' }, {}] }, {}] } }}
            initialFormData={{ c: [] }}
            validator={validator}
          />,
        );
        expect(screen.getByRole('group', { name: 'Colors' })).toBeInTheDocument();
      });
    });

    it('says so in the name a group takes where `ui:label: false` hides its label', () => {
      renderColors(colors({ minItems: 1 }), { 'ui:label': false });
      expect(screen.getByRole('group', { name: 'Colors required' })).toBeInTheDocument();
    });
  });
}
