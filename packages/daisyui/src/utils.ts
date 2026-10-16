import type { FieldPresentation, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { fieldLabelId, getGroupAttributes, isLabelledByTemplate, isObject } from '@rjsf/utils';

import type { DaisyProps } from './types/DaisyProps.ts';

export type DaisyUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = UiSchema<T, S, F> & {
  'ui:options'?: DaisyUiOptions<T, S, F>;
};

type DaisyUiOptions<T, S extends StrictRJSFSchema, F extends FormContextType> = UiSchema<T, S, F>['ui:options'] & {
  daisy?: DaisyProps;
};

interface GetDaisyProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  uiSchema?: DaisyUiSchema<T, S, F>;
}

export function getDaisy<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema }: GetDaisyProps<T, S, F>): DaisyProps {
  const daisy: unknown = uiSchema?.['ui:options']?.daisy;
  return isObject(daisy) ? daisy : {};
}

type GroupProps = { id: string } & ReturnType<typeof getGroupAttributes>['group'];

interface GetGroupProps {
  id: string;
  label?: string;
  name?: string;
  hideLabel?: boolean;
  presentation?: FieldPresentation;
  role: GroupProps['role'];
}

/** Whether this field has a label for a widget to reference. One predicate behind `getGroupAndOptionProps()` below and
 * the names `SelectWidget`'s and `DatePickerTrigger`'s comboboxes fall back to, so they cannot drift apart and disagree
 * about whether the element they point at exists.
 *
 * The property name is the fallback because that is the one the template's own label falls back to: `SchemaField`
 * computes it with `||`, so a field whose `title` is explicitly `''` still gets a label there, while the `label` a
 * widget is handed keeps the `''` it was given.
 *
 * It answers from what the widget was handed, which is as close as a widget can get: it cannot see the label the
 * template computed, and the two disagree in one case either way. Under `deprecatedHandling: 'label'` a field with
 * neither a title nor a property name — a root field, an array item — is given a template label that is nothing but
 * the deprecation decoration, so one is rendered where this says none is; pointing a group at it would name the group
 * `(deprecated)`, which is why the widget is left to its own name instead. In the other direction, a `oneOf` option
 * selector is handed the field's title while the label that title renders names the field's own control rather than
 * the selector, so without a plan the selector takes no name from the field's label in its place.
 *
 * That selector is also the one place a reference from `getGroupProps()` reaches nothing: `MultiSchemaField` gives it
 * an id of its own (`__anyof_select`/`__oneof_select`), so a group widget rendering it — `ui:widget: 'radio'` on a
 * non-constant `anyOf`/`oneOf` of primitives, the only shape that keeps its label — points at a label id no
 * `FieldTemplate` renders, and the group is left unnamed rather than misnamed. Naming it would mean rebuilding that
 * suffix here, which is the theme guessing at an id `@rjsf/core` owns.
 *
 * Under the field's plan the answer is the plan's: a label the template draws, here or for a field above rendering the
 * same id, is one to point at.
 *
 * @param label - The field's label, empty when it has no title
 * @param name - The field's property name, which the template's label falls back to
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param presentation - The field's plan, when its `SchemaField` built one
 * @returns - True if there is a label for `fieldLabelId()` to point at
 */
export function hasLabelToReference({
  label,
  name,
  hideLabel,
  presentation,
}: {
  label?: string;
  name?: string;
  hideLabel?: boolean;
  presentation?: FieldPresentation;
}) {
  if (presentation) {
    return isLabelledByTemplate(presentation);
  }
  return !hideLabel && !!(label || name);
}

/** Builds the props that name a widget rendering several controls, since no single control in a group can carry the
 * label `FieldTemplate` renders above it and a `label htmlFor` does not associate with the group's wrapper. The group
 * points at the label element rather than repeating its text, so its accessible name is whatever the label displays:
 * the `label` a widget is handed is computed separately from the one the template renders, and differs from it for an
 * `additionalProperties` entry, whose template label is the key, and under `deprecatedHandling: 'label'`, which
 * decorates only the template's.
 *
 * The reference is claimed only when this widget has a label to be named by, so it is dropped for a field with
 * neither a title nor a property name — a root field — where the template renders no label to point at.
 *
 * A reference is all a group has: nothing outside a `FieldTemplate` rendering `fieldLabelId()` can name it, so a
 * replacement one that renders no such label leaves these widgets unnamed. That is what the id is exported for.
 *
 * @param id - The widget's `id`, which the label's `htmlFor` targets and `fieldLabelId()` derives the label's id from
 * @param label - The field's label, empty when it has no title
 * @param name - The field's property name, which the template's label falls back to
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param presentation - The field's plan, whose `aria-labelledby` for the control the group takes when there is one
 * @param role - The group role for the controls, `radiogroup` for radios and `group` for anything else
 * @returns - The `id`, `role` and, when there is a label to point at, `aria-labelledby` props for the group's wrapper,
 *        under a plan whose label `ui:label: false` hides the `aria-label` naming it, and under a plan with errors a
 *        `radiogroup`'s `aria-invalid`
 */
export function getGroupProps(props: GetGroupProps): GroupProps {
  return getGroupAndOptionProps(props).group;
}

/** Builds the props `getGroupProps()` gives a group's wrapper together with the attributes each control in the group
 * takes, from one `getGroupAttributes()` call, for a widget that renders the controls itself
 *
 * @param props - The props `getGroupProps()` takes
 * @returns - The wrapper's props as `group`, and as `option` each control's `aria-describedby` and, for a `group` rather
 *        than a `radiogroup`, its `aria-invalid`
 */
export function getGroupAndOptionProps({ id, label, name, hideLabel, presentation, role }: GetGroupProps): {
  group: GroupProps;
  option: ReturnType<typeof getGroupAttributes>['option'];
} {
  // The plan already points a group declared as labelled by reference at the label that names it, and marks a
  // `radiogroup` rather than its radios invalid. Without one, `getGroupAttributes()` takes the label id it is handed as
  // given, so it is handed the template's where there is a label to point at
  const labelId = !presentation && hasLabelToReference({ label, name, hideLabel }) ? fieldLabelId(id) : undefined;
  const { group, option } = getGroupAttributes({ id, presentation }, role, labelId);
  return { group: { id, ...group }, option };
}

/** Builds the classes of one option of a checkboxes or radio widget: its `label`, and the `text` beside the input.
 *
 * @param disabled - Whether the option is disabled, by the field or by `ui:enumDisabled`
 * @returns - The `className` of the option's `label` element and of the text inside it
 */
export function getOptionClassNames(disabled: boolean) {
  return {
    label: `flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} gap-2`,
    text: disabled ? 'label-text opacity-50' : 'label-text',
  };
}
