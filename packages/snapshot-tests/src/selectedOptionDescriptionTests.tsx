import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type { FieldProps, RegistryWidgetsType, RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

const describedOptions = [
  { const: 'r', title: 'Red', description: 'Warm' },
  { const: 'b', title: 'Blue' },
];
const callerDescription = 'Pick one';
const callerLabel = 'Shade';

/** An id no element has adds no text to the accessible description, so it is looked for apart from it */
function expectNoDanglingIds(element: Element | null) {
  const ids = (element?.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
  expect(ids.filter((id) => !document.getElementById(id))).toEqual([]);
}

/** Pins that a `SelectWidget` shows its selected option's description exactly where that description is announced,
 * both under its field's plan and rendered without one, as by a custom field.
 *
 * @param Form - The theme's `Form` component
 * @param [widgets] - Widgets the form registers, such as a `SelectWidget` other than the theme's own
 */
export function selectedOptionDescriptionTests(Form: ComponentType<FormProps>, widgets?: RegistryWidgetsType) {
  describe("SelectWidget's selected option description", () => {
    test.each<[string, RJSFSchema, UiSchema, boolean]>([
      ['label shown', { title: 'Color', type: 'string', oneOf: describedOptions }, {}, true],
      [
        "the field's own ui:label false",
        { title: 'Color', type: 'string', oneOf: describedOptions },
        { 'ui:label': false },
        false,
      ],
      [
        'ui:label false on the anyOf field above',
        { title: 'Color', anyOf: [{ type: 'string', oneOf: describedOptions }, { type: 'number' }] },
        { 'ui:label': false, anyOf: [{}, {}] },
        false,
      ],
    ])(
      "shows a selected option's description exactly where it describes the select (%s)",
      (_, color, uiSchema, shown) => {
        const { container } = render(
          <Form
            schema={{ type: 'object', properties: { color } }}
            uiSchema={{ color: uiSchema }}
            initialFormData={{ color: 'r' }}
            widgets={widgets}
            validator={validator}
          />,
        );
        const select = container.querySelector('#root_color');

        expect(screen.queryAllByText('Warm')).toHaveLength(shown ? 1 : 0);
        expect(select).toHaveAccessibleDescription(shown ? 'Warm' : '');
        expectNoDanglingIds(select);
      },
    );

    // Sighted and screen reader users meet the descriptions and the help in the same order
    const ownSelect: RJSFSchema = { type: 'string', oneOf: describedOptions };
    // The option's select is described by the description and help its option selector's field draws
    const anyOfSelect: RJSFSchema = { anyOf: [{ type: 'string', oneOf: describedOptions }, { type: 'number' }] };
    const anyOfOwnDescription: RJSFSchema = {
      anyOf: [{ type: 'string', oneOf: describedOptions, description: 'Own description' }, { type: 'number' }],
    };
    // Options with a uiSchema of their own, so the field's help stays the field's
    const fieldHelp: UiSchema = { 'ui:help': 'Some help', anyOf: [{}, {}] };
    test.each([
      ['its own description', ownSelect, { description: 'Pick a plan' }, {}],
      ['its own description and help', ownSelect, { description: 'Pick a plan' }, { 'ui:help': 'Some help' }],
      ['its own help', ownSelect, {}, { 'ui:help': 'Some help' }],
      ["an anyOf field's description", anyOfSelect, { description: 'Pick a plan' }, {}],
      [
        "an anyOf field's description and help",
        anyOfSelect,
        { description: 'Pick a plan' },
        { 'ui:help': 'Some help' },
      ],
      ["an anyOf field's help", anyOfSelect, {}, { 'ui:help': 'Some help' }],
      ["an anyOf option's description", anyOfOwnDescription, {}, {}],
      ["an anyOf field's description and its option's", anyOfOwnDescription, { description: 'Pick a plan' }, {}],
      ["an anyOf field's help and its option's description", anyOfOwnDescription, {}, fieldHelp],
      [
        "an anyOf field's description and help and its option's description",
        anyOfOwnDescription,
        { description: 'Pick a plan' },
        fieldHelp,
      ],
      [
        "an anyOf field's help and its option's",
        anyOfSelect,
        {},
        { 'ui:help': 'Some help', anyOf: [{ 'ui:help': 'Own help' }, {}] },
      ],
    ] as [string, RJSFSchema, RJSFSchema, UiSchema][])(
      "lists %s and the selected option's description in the order they are drawn",
      (_, color, described, uiSchema) => {
        const { container } = render(
          <Form
            schema={{ type: 'object', properties: { color: { title: 'Color', ...described, ...color } } }}
            uiSchema={{ color: uiSchema }}
            initialFormData={{ color: 'r' }}
            widgets={widgets}
            validator={validator}
          />,
        );
        // In document order
        const drawn = screen
          .getAllByText(/^(Warm|Pick a plan|Some help|Own description|Own help)$/)
          .map(({ textContent }) => textContent);
        const announced = container.querySelector('#root_color')!.getAttribute('aria-describedby')!.split(' ');
        const announcedTexts = announced.map((id) => document.getElementById(id)?.textContent ?? '');

        expect(announcedTexts).toContain('Warm');
        expect(announcedTexts).toEqual(drawn);
      },
    );

    /** Renders the form's `SelectWidget` from a custom field, so without a plan, described by an element of its own */
    function renderWithoutPlan({
      hideLabel,
      uiSchema,
      ariaLabel,
    }: {
      hideLabel: boolean;
      uiSchema?: UiSchema;
      ariaLabel?: string;
    }) {
      function Planless({ registry }: FieldProps) {
        const { SelectWidget } = registry.widgets;
        return (
          <>
            <p id='ext'>{callerDescription}</p>
            <SelectWidget
              id='root_custom'
              name='custom'
              schema={{ type: 'string' }}
              label='Color'
              // oxlint-disable-next-line typescript/no-deprecated -- a widget rendered without a plan reads the deprecated prop
              hideLabel={hideLabel}
              uiSchema={uiSchema}
              aria-label={ariaLabel}
              aria-describedby='ext'
              options={{
                enumOptions: [
                  { label: 'Red', value: 'r', schema: { const: 'r', description: 'Warm' } },
                  { label: 'Blue', value: 'b', schema: { const: 'b' } },
                ],
              }}
              value='r'
              disabled={false}
              readonly={false}
              autofocus={false}
              onChange={() => {}}
              onBlur={() => {}}
              onFocus={() => {}}
              registry={registry}
            />
          </>
        );
      }
      const { container } = render(
        <Form
          schema={{ type: 'string' }}
          uiSchema={{ 'ui:field': Planless }}
          widgets={widgets}
          validator={validator}
        />,
      );
      return container.querySelector('#root_custom');
    }

    // Without a plan `hideLabel` and the widget's `uiSchema` decide, and the select keeps the ids its caller describes
    // it by
    test.each<[string, boolean, UiSchema, boolean]>([
      ['hidden by hideLabel', true, {}, false],
      ['hidden by its ui:label false', false, { 'ui:label': false }, false],
      ['shown', false, {}, true],
    ])(
      "shows a selected option's description exactly where it describes a select rendered without a plan, its label %s",
      (_, hideLabel, uiSchema, shown) => {
        const select = renderWithoutPlan({ hideLabel, uiSchema });

        expect(screen.queryAllByText('Warm')).toHaveLength(shown ? 1 : 0);
        expect(select).toHaveAccessibleDescription(shown ? `${callerDescription} Warm` : callerDescription);
        expectNoDanglingIds(select);
      },
    );

    // A label the widget draws can name the select over its caller's `aria-label`, so the label is hidden here
    test("names a select rendered without a plan, its label hidden, by its caller's aria-label", () => {
      expect(renderWithoutPlan({ hideLabel: true, ariaLabel: callerLabel })).toHaveAccessibleName(callerLabel);
    });
  });
}
