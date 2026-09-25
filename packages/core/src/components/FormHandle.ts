import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** The imperative surface a `Form` exposes through its `ref`. It is the supported alternative to holding a ref to the
 * `Form` class instance, whose `state` and lifecycle are internals rather than API. A `Form` will be either
 * parent-owned (a `formData` prop, accepted through `onChange`) or self-owned (seeded by `initialFormData`); this
 * handle is the same for both, and it is the contract a later function-component `Form` keeps.
 *
 * Only the members listed here are supported. Everything else on the class instance may change without notice.
 */
export interface FormHandle<T = unknown> {
  /** Returns the form data the `Form` currently renders: the `formData` prop of a parent-owned form, the committed
   * data of a self-owned one. It is the read path for a self-owned form, whose data is not otherwise reachable between
   * `onChange` calls (autosave, route guards, a submit button outside the form).
   *
   * It reads committed data only: an edit or `setFieldValue()` in the same tick is not visible until React commits it,
   * and for a parent-owned form a proposal is not visible until the parent has passed it back. Treat the result as
   * read-only: mutating it mutates what the form renders.
   */
  getFormData(): EventFormData<T>;
  /** Programmatically submits the `Form`, running validation and `onSubmit`/`onError` as a submit button would. Queued
   * behind any edit, `setFieldValue()` or reset in flight, so it submits the data they produced.
   */
  submit(): void;
  /** Clears the validation errors and, for a self-owned form, resets the data to `initialFormData` and the schema's
   * defaults; a parent-owned form's data is the parent's to reset. Queued behind any operation in flight.
   */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`. Use `''` or `[]` for the
   * root. Passing `undefined` clears the field.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: unknown): void;
  /** Validates the current form data, filtering extra data first when `omitExtraData` is set, and calls `onError` as a
   * submission would. It returns its answer at once, so it reads committed data like `getFormData()`: an edit or
   * `setFieldValue()` in the same tick is not validated until React commits it. `submit()` is queued and sees them.
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
