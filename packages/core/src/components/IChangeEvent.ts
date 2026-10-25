import type {
  ErrorSchema,
  FormContextType,
  RJSFSchema,
  RJSFValidationError,
  SchemaUtilsType,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';

/** The form data a change, a submit or `FormRef.getFormData()` hands back. No change below an object or array root
 * replaces it with `undefined` (the change writes into it, and defaults are computed from an object), so its type is
 * `T` itself; a scalar root is `undefined` whenever its field is cleared. A write at the root itself can still leave an
 * object or array root `undefined`, which this type does not reflect: `setFieldValue('', undefined)`, a root-level
 * custom field or widget calling `onChange(undefined, ROOT_FIELD_PATH)`, or a `transformChange` that returns `undefined`.
 */
export type EventFormData<T> = T extends object ? T : T | undefined;

/** A value nested like the form's data, holding `true` at each field that differs. An object holds an entry only for
 * its members that differ, and an array an entry for each item, `undefined` where the item does not differ. A field
 * that was added, removed or replaced whole holds `true` at each of its leaves, or `true` itself when it is not an
 * object or array.
 */
export type NestedBooleans<T> = T extends Date
  ? boolean
  : T extends readonly (infer Item)[]
    ? (NestedBooleans<Item> | undefined)[]
    : T extends object
      ? { [K in keyof T]?: NestedBooleans<T[K]> }
      : // Tested last: tested first, it makes TypeScript measure `FormRef<T>` as invariant in `T`, so a
        // `FormRef<MyData>` no longer fits a `FormRef<unknown>`
        unknown extends T
        ? NestedBooleanValue
        : boolean;

/** A value nested like the form's data, holding `true` at each field that was touched, as a `NestedBooleans` does at
 * each field that differs. An array or object whose own widget handles it whole, such as checkboxes for an array of
 * enum values, is one field, so it holds `true` itself, empty or not
 */
export type TouchedFields<T> = T extends Date
  ? boolean
  : T extends readonly (infer Item)[]
    ? (TouchedFields<Item> | undefined)[] | true
    : T extends object
      ? { [K in keyof T]?: TouchedFields<T[K]> } | true
      : // Tested last, as in `NestedBooleans`
        unknown extends T
        ? NestedBooleanValue
        : boolean;

/** A `NestedBooleans` or `TouchedFields` of data whose type is not known */
export type NestedBooleanValue = boolean | NestedBooleanObject | (NestedBooleanValue | undefined)[];

/** An object of `NestedBooleanValue`s */
export interface NestedBooleanObject {
  [key: string]: NestedBooleanValue | undefined;
}

/** The form's status, as every `IChangeEvent` and `FormRef.getStatus()` report it */
export interface FormStatus<T = unknown> {
  /** Whether the data differs from the baseline: the data the form was last seeded with, on mount or by
   * `FormRef.reset()`, with the schema's defaults filled in
   */
  readonly dirty: boolean;
  /** Where the data differs from the baseline */
  readonly dirtyFields: NestedBooleans<T>;
  /** Whether any field has been touched: its widget reported a blur since the form mounted or was last reset. A submit
   * touches nothing
   */
  readonly touched: boolean;
  /** Which fields have been touched, following the array items and object keys the form moved */
  readonly touchedFields: TouchedFields<T>;
  /** How many submits have been attempted, valid or not, since the form mounted or was last reset */
  readonly submitCount: number;
}

/** The event handed to `onChange` and `onSubmit`. It is declared on its own rather than as a `Pick` of `FormState`
 * because it is the public contract while `FormState` is an implementation detail: the state's layout is free to change
 * as long as `toIChangeEvent()` in `formState.ts`, the only place an event is built, still produces this shape.
 *
 * Every member is `readonly`. The event's `formData` is the form's own data, which shares its unchanged subtrees with
 * the value the change was applied to, the `formData` you passed included, so writing into the event writes into the
 * form's data and yours. Copy what you need out of the event instead.
 */
export interface IChangeEvent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> extends FormStatus<T> {
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
