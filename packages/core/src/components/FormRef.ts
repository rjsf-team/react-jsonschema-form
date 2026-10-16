import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** Public methods exposed by a Form ref.
 * Commands read and write Form's latest stored value, edits made earlier in the same tick included. Use event handlers
 * for user actions, or Effects for synchronization after prop changes: the form takes the props of a commit before any
 * layout Effect of that commit runs, so a command issued from one, a widget's or a sibling's, starts from them. A form
 * that has unmounted, or that an `<Activity>` hides, which React asks to
 * be treated alike, drops changes, `reset()` and `submit()`, and its validation methods return their result without
 * calling `onError`.
 */
export interface FormRef<T = unknown> {
  /** Reads the latest stored value. Treat the result as read-only. An edit can be visible here before the inputs
   * update.
   */
  getFormData(): EventFormData<T>;
  /** Submits the form through its element, before this returns: schema validation checks the stored value and
   * `onSubmit` or `onError` is called. When the inputs show the stored value, the browser's constraint validation
   * checks them first, as for a submit button, and an input it rejects blocks the submit. After an edit React has yet
   * to show, the inputs describe data the form no longer holds, so schema validation alone checks the value. An
   * element another `tagName` renders has no `requestSubmit()`, so it gets a submit event dispatched to it, which skips
   * the browser's constraint validation as well.
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
