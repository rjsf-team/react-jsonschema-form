import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import { generateWidgets } from '@rjsf/core';
import type { ErrorSchema, RegistryWidgetsType, RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** The schema each widget needs in order to be the one that renders. Keyed by the name a widget is registered
 * under, which is also what `ui:widget` resolves against, so a theme adding a widget only has to add an entry here.
 */
const WIDGET_FIXTURES: Record<string, RJSFSchema> = {
  AltDateTimeWidget: { type: 'string', format: 'date-time' },
  AltDateWidget: { type: 'string', format: 'date' },
  CheckboxWidget: { type: 'boolean' },
  CheckboxesWidget: { type: 'array', items: { type: 'string', enum: ['north', 'south'] }, uniqueItems: true },
  ColorWidget: { type: 'string', format: 'color' },
  DateTimeWidget: { type: 'string', format: 'date-time' },
  DateWidget: { type: 'string', format: 'date' },
  EmailWidget: { type: 'string', format: 'email' },
  FileWidget: { type: 'string', format: 'data-url' },
  HiddenWidget: { type: 'string' },
  NativeSelectWidget: { type: 'string', enum: ['primary', 'secondary'] },
  PasswordWidget: { type: 'string' },
  RadioWidget: { type: 'string', enum: ['gold', 'silver'] },
  RangeWidget: { type: 'number', minimum: 0, maximum: 10 },
  RatingWidget: { type: 'number', minimum: 0, maximum: 5 },
  SelectWidget: { type: 'string', enum: ['primary', 'secondary'] },
  TextareaWidget: { type: 'string' },
  TextWidget: { type: 'string' },
  TimeWidget: { type: 'string', format: 'time' },
  toggle: { type: 'boolean' },
  UpDownWidget: { type: 'number' },
  URLWidget: { type: 'string', format: 'uri' },
};

/** `useId` counts up for the lifetime of the module, so the second render of a pair names its ids differently
 * however identical it is otherwise. Nothing else is flattened: a class a CSS-in-JS theme generates is named after
 * the rules it carries, so comparing those verbatim is what catches a theme signalling invalid through a generated
 * class alone.
 */
function normalize(markup: string) {
  return markup.replace(/_r_[0-9a-z]+_/g, 'generatedId');
}

/** Runs the same form twice under `ui:hideError`, once with an error on the field and once without, and returns
 * both renderings. Anything a widget derives from `rawErrors` without pairing it with `hideError` shows up as a
 * difference between the two, whatever the theme uses to signal invalid.
 */
function renderBothWays(Form: ComponentType<FormProps>, widgetName: string) {
  // `required` so that a widget deriving an error state from required-ness rather than from errors, which no amount
  // of comparing error-free renders would surface, is flagged by the `aria-invalid` assertion below
  const schema: RJSFSchema = {
    type: 'object',
    required: ['field'],
    properties: { field: WIDGET_FIXTURES[widgetName] },
  };
  const uiSchema: UiSchema = {
    'ui:hideError': true,
    field: {
      'ui:widget': widgetName,
      // Only the alt-date widgets read this, and its default runs to the current year, which would make their
      // comparison depend on the clock. Handing it to the rest would leak it onto the DOM of any theme whose
      // widgets spread their leftover options
      ...(widgetName.startsWith('AltDate') ? { 'ui:options': { yearsRange: [2020, 2024] } } : {}),
    },
  };
  const errored = render(
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      showErrorList={false}
      extraErrors={{ field: { __errors: ['a hidden error'] } } as ErrorSchema}
    />,
  );
  const clean = render(<Form schema={schema} uiSchema={uiSchema} validator={validator} showErrorList={false} />);
  return [normalize(errored.container.innerHTML), normalize(clean.container.innerHTML)];
}

/** Every widget kind a theme styles from its errors, in one form, so that the pair of snapshots below shows what
 * each of them renders with errors and without them.
 */
const errorStateSchema: RJSFSchema = {
  type: 'object',
  properties: {
    marketType: { type: 'string', enum: ['primary', 'secondary'] },
    commissioning: { type: 'string' },
    regions: { type: 'array', items: { type: 'string', enum: ['north', 'south'] }, uniqueItems: true },
    tier: { type: 'string', enum: ['gold', 'silver'] },
    active: { type: 'boolean' },
    notes: { type: 'string' },
    quantity: { type: 'number' },
    threshold: { type: 'number', minimum: 0, maximum: 10 },
    secret: { type: 'string' },
    shade: { type: 'string', format: 'color' },
    startsOn: { type: 'string', format: 'date' },
    startsAt: { type: 'string', format: 'date-time' },
    opensAt: { type: 'string', format: 'time' },
    endsOn: { type: 'string', format: 'date' },
    attachment: { type: 'string', format: 'data-url' },
  },
};
const errorStateUiSchema: UiSchema = {
  regions: { 'ui:widget': 'checkboxes' },
  tier: { 'ui:widget': 'radio' },
  notes: { 'ui:widget': 'textarea' },
  quantity: { 'ui:widget': 'updown' },
  threshold: { 'ui:widget': 'range' },
  secret: { 'ui:widget': 'password' },
  // The default year range runs to the current year, which would rewrite these snapshots every January
  endsOn: { 'ui:widget': 'alt-date', 'ui:options': { yearsRange: [2020, 2024] } },
};
const errorStateErrors = {
  marketType: { __errors: ['must be equal to one of the allowed values'] },
  commissioning: { __errors: ['must match format "year"'] },
  regions: { __errors: ['must NOT have fewer than 1 items'] },
  tier: { __errors: ['must be equal to one of the allowed values'] },
  active: { __errors: ['must be checked'] },
  notes: { __errors: ['must NOT have more than 10 characters'] },
  quantity: { __errors: ['must be an integer'] },
  threshold: { __errors: ['must be <= 10'] },
  secret: { __errors: ['must NOT have fewer than 8 characters'] },
  shade: { __errors: ['must match format "color"'] },
  startsOn: { __errors: ['must match format "date"'] },
  startsAt: { __errors: ['must match format "date-time"'] },
  opensAt: { __errors: ['must match format "time"'] },
  endsOn: { __errors: ['must match format "date"'] },
  attachment: { __errors: ['must match format "data-url"'] },
} as ErrorSchema;

/** Pins the `ui:hideError` contract for every widget a theme can render, rather than for the handful a fixture
 * happens to render. A widget reading `rawErrors` without `hideError` fails here even though it renders the error
 * state through a prop or class no shared assertion knows about.
 *
 * These live in their own file rather than alongside `formTests()` because every render advances React's `useId`
 * counter for the rest of the module, so adding a widget here would otherwise renumber the ids in unrelated
 * snapshots across all nine themes.
 *
 * @param Form - The theme's `Form` component
 * @param widgets - The widgets the theme registers, merged over core's defaults to decide the cases that run
 */
export function hideErrorTests(Form: ComponentType<FormProps>, widgets: RegistryWidgetsType) {
  // A theme registers only the widgets it overrides and inherits the rest from core, but an inherited widget still
  // renders through the theme's own `BaseInputTemplate`, which is where most themes put their error styling. Running
  // only the theme's own keys would leave that template untested for every theme that overrides no text-like widget
  const allWidgets = { ...generateWidgets(), ...widgets };

  describe('error state', () => {
    test('errors put every widget into its error state', async () => {
      const { asFragment } = render(
        <Form
          schema={errorStateSchema}
          uiSchema={errorStateUiSchema}
          validator={validator}
          extraErrors={errorStateErrors}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    test('ui:hideError on a parent keeps its children out of the error state', async () => {
      const { asFragment } = render(
        <Form
          schema={errorStateSchema}
          uiSchema={{ ...errorStateUiSchema, 'ui:hideError': true }}
          validator={validator}
          extraErrors={errorStateErrors}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });

  describe('ui:hideError keeps every available widget out of its error state', () => {
    test.each(Object.keys(allWidgets).sort())('%s', (widgetName) => {
      // A widget with no fixture is one this suite would silently skip
      expect(WIDGET_FIXTURES).toHaveProperty(widgetName);

      const [errored, clean] = renderBothWays(Form, widgetName);

      expect(errored).toEqual(clean);
      // The comparison above only pins that the errors make no difference, which a widget flagging itself invalid
      // whatever its errors say would satisfy too. `aria-invalid` is the one signal every theme spells the same way
      expect(clean).not.toContain('aria-invalid="true"');
    });
  });
}
