import type {
  FieldPresentation,
  FormContextType,
  GlobalUISchemaOptionsExtensions,
  ReservedUiOptionName,
  RJSFSchema,
  StrictRJSFSchema,
  ThemeGlobalUISchemaOptions,
  UiSchema,
} from '@rjsf/utils';
import { fieldLabelId, getGroupAttributes, isNamedByTemplateLabel, isObject } from '@rjsf/utils';

import type { DaisyProps } from './types/DaisyProps.ts';

/** A `UiSchema` whose `ui:options` and `ui:globalOptions` are known to carry the theme's `daisy` props, and whose
 * `ui:globalOptions` carry a user's own `UserExtensions` too.
 */
export type DaisyUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof DaisyGlobalUiOptionsKeys
  > = Record<never, never>,
> = UiSchema<T, S, F> & {
  'ui:options'?: DaisyUiOptions<T, S, F>;
  'ui:globalOptions'?: DaisyGlobalUISchemaOptions<UserExtensions>;
};

type DaisyUiOptions<T, S extends StrictRJSFSchema, F extends FormContextType> = UiSchema<T, S, F>['ui:options'] &
  DaisyGlobalUiOptionsKeys;

/** The options this theme reads from `ui:globalOptions`, beyond the ones RJSF reads */
export interface DaisyGlobalUiOptionsKeys {
  /** The DaisyUI theme, class name and style for every field's `FieldTemplate`, as in a field's `ui:options` */
  daisy?: DaisyProps;
}

/** The `ui:globalOptions` this theme reads, plus a user's own `UserExtensions` */
export type DaisyGlobalUISchemaOptions<
  UserExtensions extends GlobalUISchemaOptionsExtensions<
    UserExtensions,
    ReservedUiOptionName | keyof DaisyGlobalUiOptionsKeys
  > = Record<never, never>,
> = ThemeGlobalUISchemaOptions<DaisyGlobalUiOptionsKeys, UserExtensions>;

/** The keys of `DaisyGlobalUiOptionsKeys`, which the theme declares as its `globalUiOptionsKeys` */
export const DAISY_GLOBAL_UI_OPTIONS_KEYS = Object.keys({ daisy: true } satisfies Record<
  keyof DaisyGlobalUiOptionsKeys,
  true
>);

interface GetDaisyProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  uiSchema?: DaisyUiSchema<T, S, F>;
  /** The registry's `globalUiOptions`, whose `daisy` is used where the `uiSchema`'s `ui:options` don't set one */
  globalUiOptions?: DaisyGlobalUISchemaOptions;
}

export function getDaisy<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema, globalUiOptions }: GetDaisyProps<T, S, F>): DaisyProps {
  const options = { ...globalUiOptions, ...uiSchema?.['ui:options'] };
  const daisy: unknown = options.daisy;
  return isObject(daisy) ? daisy : {};
}

type GroupProps = { id: string } & ReturnType<typeof getGroupAttributes>['group'];

interface GetGroupProps {
  id: string;
  label?: string;
  hideLabel?: boolean;
  presentation?: FieldPresentation;
  role: GroupProps['role'];
}

/** Builds the props that name a widget rendering several controls, since no single control in a group can carry the
 * label `FieldTemplate` renders above it and a `label htmlFor` does not associate with the group's wrapper. The group
 * points at the label element rather than repeating its text, so its accessible name is whatever the label displays.
 *
 * The reference is claimed only when this widget has a label to be named by, so it is dropped for a field with no
 * label, such as a root field with no title, where the template renders no label to point at.
 *
 * A reference is all a group has, so a replacement `FieldTemplate` has to draw its label under the id the group points
 * at: under a plan, the plan's label id, which `getLabelId()` reads and which is `optionLabelId()`'s rather than
 * `fieldLabelId()`'s beneath a label drawn above with the same id; without one, `fieldLabelId()`. A custom group widget
 * takes these props, or `getGroupAndOptionProps()`', handed the field's `presentation`, rather than pointing at
 * `fieldLabelId()` itself, so it follows the plan as the built-in ones do.
 *
 * @param id - The widget's `id`, which the label's `htmlFor` targets and `fieldLabelId()` derives the label's id from
 * @param label - The field's label, empty when it has no title
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
export function getGroupAndOptionProps({ id, label, hideLabel, presentation, role }: GetGroupProps): {
  group: GroupProps;
  option: ReturnType<typeof getGroupAttributes>['option'];
} {
  // The plan already points a group declared as labelled by reference at the label that names it, and marks a
  // `radiogroup` rather than its radios invalid. Without one, `getGroupAttributes()` takes the label id it is handed as
  // given, so it is handed the template's where there is a label to point at
  const labelId =
    !presentation &&
    // oxlint-disable-next-line typescript/no-deprecated -- a group rendered without a plan tells from it whether a label names it
    isNamedByTemplateLabel({ label: label ?? '', hideLabel })
      ? fieldLabelId(id)
      : undefined;
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
