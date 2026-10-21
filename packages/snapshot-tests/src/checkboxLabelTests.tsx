import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import type {
  FieldPresentation,
  FieldTemplateProps,
  RegistryWidgetsType,
  RJSFSchema,
  UiSchema,
  WidgetProps,
} from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render, screen } from '@testing-library/react';

import type { ThemeGenerators } from './themeTests.ts';

const schema: RJSFSchema = {
  type: 'object',
  properties: { agree: { type: 'boolean', title: 'Agree', description: 'I accept the terms' } },
};

function expectOneLabelAndDescription(container: HTMLElement) {
  expect(screen.getAllByText('Agree')).toHaveLength(1);
  expect(screen.getAllByText('I accept the terms')).toHaveLength(1);
  expect(screen.getByRole('checkbox', { name: 'Agree' })).toBeInTheDocument();
  expect(container.querySelectorAll('#root_agree__description')).toHaveLength(1);
}

/** Pins that however `ui:widget` names a boolean's checkbox, one label and one description are drawn (#5389). A count
 * alone passes for a plan that ignores the widget altogether, so the field's plan is read too: every spelling that
 * reaches the registered checkbox has it draw the label itself, and the description wherever the theme's merged
 * `CheckboxWidget` declaration puts it. An unregistered wrapper has no declaration of its own and takes the theme's
 * `default`, which differs between themes, so only its count is pinned.
 *
 * @param Form - The theme's `Form` component
 * @param generators - The theme's `generateTemplates` and `generateWidgets`
 */
export function checkboxLabelTests(
  Form: ComponentType<FormProps>,
  { generateTemplates, generateWidgets }: Pick<ThemeGenerators, 'generateTemplates' | 'generateWidgets'>,
) {
  describe('a checkbox named by any spelling of ui:widget (#5389)', () => {
    const FieldTemplate = generateTemplates().FieldTemplate!;
    const { CheckboxWidget } = generateWidgets();
    const CheckboxWrapper = (props: WidgetProps) => <CheckboxWidget {...props} />;

    test.each<[string, UiSchema, RegistryWidgetsType?]>([
      ['the checkbox alias', { 'ui:widget': 'checkbox' }],
      ['the CheckboxWidget key', { 'ui:widget': 'CheckboxWidget' }],
      ['the CheckboxWidget key through ui:options.widget', { 'ui:options': { widget: 'CheckboxWidget' } }],
      ['the registered widget passed as a component', { 'ui:widget': CheckboxWidget }],
      [
        'a wrapper registered under the CheckboxWidget key',
        { 'ui:widget': 'CheckboxWidget' },
        { CheckboxWidget: CheckboxWrapper },
      ],
    ])('has the checkbox draw the label and the description once, named by %s', (_, agreeUiSchema, widgets) => {
      const plans = new Map<string, FieldPresentation | undefined>();
      const declaredDescriptions = new Map<string, string | undefined>();
      function RecordingFieldTemplate(props: FieldTemplateProps) {
        plans.set(props.id, props.presentation);
        declaredDescriptions.set(props.id, props.registry.presentation.widgets.CheckboxWidget?.description);
        return <FieldTemplate {...props} />;
      }
      const { container } = render(
        <Form
          schema={schema}
          uiSchema={{ agree: agreeUiSchema }}
          widgets={widgets}
          templates={{ FieldTemplate: RecordingFieldTemplate }}
          validator={validator}
        />,
      );

      expectOneLabelAndDescription(container);
      expect(plans.get('root_agree')?.label.by).toBe('self');
      expect(plans.get('root_agree')?.description.by).toBe(
        declaredDescriptions.get('root_agree') === 'self' ? 'self' : 'template',
      );
    });

    test('draws the label and the description once, named by an unregistered wrapper passed as a component', () => {
      const { container } = render(
        <Form schema={schema} uiSchema={{ agree: { 'ui:widget': CheckboxWrapper } }} validator={validator} />,
      );

      expectOneLabelAndDescription(container);
    });
  });
}
