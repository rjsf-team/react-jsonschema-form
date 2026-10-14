import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** Public methods exposed by a Form ref.
 * Commands read and write Form's latest stored value, edits made earlier in the same tick included. Use event handlers
 * for user actions, or passive Effects for synchronization after prop changes. A layout Effect inside the form, a
 * widget's, runs before the form takes the props of its commit, so a command it issues sees the previous ones; one
 * outside the form sees the new props. A form that has unmounted, or that an `<Activity>` hides, which React asks to
 * be treated alike, drops changes, `reset()` and `submit()`, and its validation methods return their result without
 * calling `onError`.
 */
export interface FormRef<T = unknown> {
  /** Reads the latest stored value. Treat the result as read-only. An edit can be visible here before the inputs
   * update.
   */
  getFormData(): EventFormData<T>;
  /** Submits the form through its element, as a submit button does: native constraint validation checks the inputs and,
   * when it passes, schema validation checks the stored value and `onSubmit` or `onError` is called. An input the
   * browser rejects blocks the submit, and neither is called. When the inputs already show the stored value, both
   * happen before this returns; after an edit React has yet to show, the submit waits for the commit that renders it,
   * so the browser checks the inputs as they show the edit. Does nothing when `tagName` renders something other than
   * a `<form>`.
   */
  submit(): void;
  /** Clears the validation errors and resets the data to the props' `formData`, or else `initialFormData`, and the
   * schema's defaults, the way the initial render derives it, reporting the result through `onChange`
   */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`. Use `''` or `[]` for the
   * root. Passing `undefined` clears the field.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: unknown): void;
  /** Validates the current value, applies omitExtraData when enabled, calls onError for invalid data, and returns
   * the result immediately.
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
