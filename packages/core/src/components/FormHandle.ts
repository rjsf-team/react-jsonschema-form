import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

/** The imperative surface a `Form` exposes through its `ref`. It is the supported alternative to holding a ref to the
 * `Form` class instance, whose `state` and lifecycle are internals rather than API. A `Form` will be either
 * parent-owned (a `formData` prop, accepted through `onChange`) or self-owned (seeded by `initialFormData`); this
 * handle is the same for both, and it is the contract a later function-component `Form` keeps.
 *
 * Only the members listed here are supported. Everything else on the class instance may change without notice.
 */
export interface FormHandle<T = any> {
  /** Returns the form data the `Form` currently renders. It is the read path for a self-owned form, whose data is not
   * otherwise reachable between `onChange` calls (autosave, route guards, a submit button outside the form).
   *
   * It reads committed data only: an edit or `setFieldValue()` in the same tick is not visible until React commits it.
   * For a parent-owned form this is still what the form renders rather than what the parent holds — the form keeps a
   * reconciled copy, so a change the parent declined is returned until the parent re-renders it away. Strict ownership
   * removes that copy. Treat the result as read-only; mutating it mutates what the form renders.
   */
  getFormData(): T | undefined;
  /** Programmatically submits the `Form`, running validation and `onSubmit`/`onError` as a submit button would */
  submit(): void;
  /** Resets the `Form` to its default values and clears validation errors */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`. Use `''` or `[]` for the
   * root. Passing `undefined` clears the field.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: T): void;
  /** Validates the current form data, filtering extra data first when `omitExtraData` is set, and calls `onError` as a
   * submission would.
   *
   * @returns - True if the form is valid, false otherwise.
   */
  validateForm(): boolean;
  /** Validates the given `formData` without making it the form's data, calling `onError` as a submission would.
   *
   * @returns - True if the form is valid, false otherwise.
   */
  validateFormWithFormData(formData?: T): boolean;
  /** Runs the validator over `formData` against the form's schema and returns the raw errors without touching form
   * state
   */
  validate(formData: T | undefined): ValidationData<T>;
  /** Moves focus to the field the given error belongs to */
  focusOnError(error: RJSFValidationError): void;
}
