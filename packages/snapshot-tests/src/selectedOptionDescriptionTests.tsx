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

    // Without a plan only `hideLabel` decides, and the select keeps the ids its caller describes it by
    test.each([
      ['hidden', true, callerDescription],
      ['shown', false, `${callerDescription} Warm`],
    ])(
      "shows a selected option's description exactly where it describes a select rendered without a plan, its label %s",
      (_, hideLabel, description) => {
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
        const select = container.querySelector('#root_custom');

        expect(screen.queryAllByText('Warm')).toHaveLength(hideLabel ? 0 : 1);
        expect(select).toHaveAccessibleDescription(description);
        expectNoDanglingIds(select);
      },
    );
  });
}
