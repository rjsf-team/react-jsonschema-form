import type {
  ErrorSchema,
  FormContextType,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';

/** The form data a change, a submit or `FormHandle.getFormData()` hands back. No change below an object or array root
 * replaces it with `undefined` (the change writes into it, and defaults are computed from an object), so its type is
 * `T` itself; a scalar root is `undefined` whenever its field is cleared. A write at the root itself can still leave an
 * object or array root `undefined`, which this type does not reflect: `setFieldValue('', undefined)`, or a root-level
 * custom field or widget calling `onChange(undefined, '')`.
 */
export type EventFormData<T> = T extends object ? T : T | undefined;

/** The event handed to `onChange` and `onSubmit`. It is declared on its own rather than as a `Pick` of `FormState`
 * because it is the public contract while `FormState` is an implementation detail: the state's layout is free to change
 * as long as `toIChangeEvent()` in `Form.tsx`, the only place an event is built, still produces this shape.
 *
 * Every member is `readonly`. The event's `formData` shares its unchanged subtrees with the value the change was
 * applied to, which for a parent-owned form is the parent's own object, so writing into the event writes into that
 * data. Copy what you need out of the event instead.
 */
export interface IChangeEvent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The JSON schema object for the form */
  readonly schema: S;
  /** The uiSchema for the form */
  readonly uiSchema: UiSchema<T, S, F>;
  /** The schemaUtils implementation used by the `Form`, created from the `validator` and the `schema` */
  readonly schemaUtils: SchemaUtilsType<T, S, F>;
  /** The current data for the form, computed from the `formData` prop and the changes made by the user */
  readonly formData: EventFormData<T>;
  /** The current list of errors for the form, includes `extraErrors` */
  readonly errors: RJSFValidationError[];
  /** The current errors, in `ErrorSchema` format, for the form, includes `extraErrors` */
  readonly errorSchema: ErrorSchema<T>;
  /** The status of the form when submitted */
  readonly status?: 'submitted';
}
