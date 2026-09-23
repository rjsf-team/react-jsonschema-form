import type { ComponentType } from 'react';
import type { FormProps } from '@rjsf/core';
import { generateWidgets } from '@rjsf/core';
import type { ErrorSchema, RegistryWidgetsType, RJSFSchema, UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import { render } from '@testing-library/react';

/** The schema each widget needs in order to be the one that renders. Keyed by the name a widget is registered
 * under, which is also what `ui:widget` resolves against, so a theme adding a widget only has to add an entry here,
 * or, from outside this repo, hand one to `hideErrorTests()` as its `fixtures` argument.
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
 * however identical it is otherwise. Every spelling React has given those ids across this package's `react >=19`
 * peer range is matched, since a missed one leaves the pair differing for every widget. Nothing else is flattened:
 * a class a CSS-in-JS theme generates is named after the rules it carries, so comparing those verbatim is what
 * catches a theme signalling invalid through a generated class alone.
 */
function normalize(markup: string) {
  // The lookbehind keeps `:r…:` from matching inside an id a theme builds with the same separator, such as chakra's
  // `select:root:control`, which would blank a chunk of both renderings and hide any real difference within it
  return markup.replace(/(?<![a-z0-9])(?::r[0-9a-z]+:|«r[0-9a-z]+»|_r_[0-9a-z]+_)/g, 'generatedId');
}

/** Runs the same form twice under `ui:hideError`, once with an error on the field and once without, and returns
 * both renderings. Anything a widget derives from `rawErrors` without pairing it with `hideError` shows up as a
 * difference between the two, whatever the theme uses to signal invalid.
 */
function renderBothWays(Form: ComponentType<FormProps>, widgetName: string, fixtures: Record<string, RJSFSchema>) {
  // `required` so that a widget deriving an error state from required-ness rather than from errors, which no amount
  // of comparing error-free renders would surface, is flagged by the `aria-invalid` assertion below
  const schema: RJSFSchema = {
    type: 'object',
    required: ['field'],
    properties: { field: fixtures[widgetName] },
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

/** Pins the `ui:hideError` contract for every widget a theme can render, rather than for the handful a fixture
 * happens to render. A widget reading `rawErrors` without `hideError` fails here even though it renders the error
 * state through a prop or class no shared assertion knows about.
 *
 * These live in their own file rather than alongside `formTests()` because every render advances React's `useId`
 * counter for the rest of the module, so running them there would renumber the ids in that suite's snapshots across
 * all nine themes every time a widget is added here.
 *
 * @param Form - The theme's `Form` component
 * @param widgets - The widgets the theme registers, merged over core's defaults to decide the cases that run
 * @param [fixtures] - Schemas for widgets this file does not know, keyed the same way, for a theme registering a
 *        widget of its own
 */
export function hideErrorTests(
  Form: ComponentType<FormProps>,
  widgets: RegistryWidgetsType,
  fixtures: Record<string, RJSFSchema> = {},
) {
  const allFixtures = { ...WIDGET_FIXTURES, ...fixtures };
  // A theme registers only the widgets it overrides and inherits the rest from core, but an inherited widget still
  // renders through the theme's own `BaseInputTemplate`, which is where most themes put their error styling. Running
  // only the theme's own keys would leave that template untested for every theme that overrides no text-like widget
  const allWidgets = { ...generateWidgets(), ...widgets };

  describe('ui:hideError keeps every available widget out of its error state', () => {
    test.each(Object.keys(allWidgets).sort())('%s', (widgetName) => {
      // A widget with no fixture is one this suite would silently skip. The lookup is by key because
      // `toHaveProperty` reads a dot in the name as a path separator, so a name that spells a path into another
      // fixture would satisfy the guard while still having no schema of its own
      expect(Object.hasOwn(allFixtures, widgetName)).toBe(true);

      const [errored, clean] = renderBothWays(Form, widgetName, allFixtures);

      expect(errored).toEqual(clean);
      // The comparison above only pins that the errors make no difference, which a widget flagging itself invalid
      // whatever its errors say would satisfy too. `aria-invalid` is the one signal every theme spells the same way
      expect(clean).not.toContain('aria-invalid="true"');
    });
  });
}
