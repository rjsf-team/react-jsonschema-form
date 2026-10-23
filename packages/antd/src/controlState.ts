import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

/** The `formContext` option this theme reads to decide whether a read-only field is drawn disabled */
interface ReadonlyAsDisabledContext {
  /** Whether a read-only field is drawn disabled, which it is unless this is `false` */
  readonlyAsDisabled?: boolean;
}

/** The state an antd control takes from its field, worked out once for every widget and template */
export interface ControlState {
  /** `true` for a field that is disabled, or read-only under `readonlyAsDisabled`. `undefined` rather than `false`
   * otherwise, since antd reads its `DisabledContext` only when a control leaves `disabled` unset
   */
  disabled: true | undefined;
  /** For a control with no read-only state of its own, such as a checkbox or a radio: `true` for a required field that
   * isn't read-only. A read-only one the form leaves enabled takes no `required`, which would have the browser block
   * the submit of a field its user can't answer
   */
  toggleRequired: true | undefined;
  /** `true` for a read-only field the form leaves enabled, for a control whose role has no read-only state of its own
   * to announce, such as a radio group or a checkbox
   */
  ariaReadonly: true | undefined;
}

/** Works out the state an antd control takes from its field's `disabled`, `readonly` and `required` and the form's
 * `readonlyAsDisabled`, so that every widget and template agrees on it
 *
 * @param props - The field's `disabled`, `readonly`, `required` and `registry`
 * @returns - The control's `ControlState`
 */
export default function getControlState<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  disabled,
  readonly,
  required,
  registry,
}: {
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  registry: Registry<T, S, F>;
}): ControlState {
  const { readonlyAsDisabled = true }: ReadonlyAsDisabledContext = registry.formContext;
  const fieldDisabled = Boolean(disabled || (readonlyAsDisabled && readonly));
  return {
    disabled: fieldDisabled || undefined,
    toggleRequired: (required && !readonly) || undefined,
    ariaReadonly: (readonly && !fieldDisabled) || undefined,
  };
}
