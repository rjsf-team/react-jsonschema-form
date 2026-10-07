import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** Public methods exposed by a Form ref.
 * With initialFormData, commands read Form's latest stored value. With formData, reads, submission and validation use
 * the last parent value React rendered, and edits build on any proposal made earlier in the same tick. Use event
 * handlers for user actions, or passive Effects for synchronization after prop changes; descendant layout Effects and
 * callback refs can still see the previous configuration.
 */
export interface FormRef<T = unknown> {
  /** Reads the latest stored value in a self-owned form, or the last rendered parent value in a controlled form.
   * Treat the result as read-only. Self-owned edits can be visible here before the inputs update.
   */
  getFormData(): EventFormData<T>;
  /** Submits current owner data through the DOM, with native constraint validation and schema validation. When
   * self-owned data is newer than the inputs, the submit waits for the commit that renders it, so the native validation
   * checks the data being submitted; when an `<Activity>` hides the form, it waits for the commit that shows it.
   * `onSubmit` or `onError` is then called from that commit, not before this returns.
   */
  submit(): void;
  /** Clears the validation errors and, for a self-owned form, resets the data to `initialFormData` and the schema's
   * defaults; a parent-owned form's data is the parent's to reset.
   */
  reset(): void;
  /** Sets the value of the field at `fieldPath`, either a dotted path or a `FieldPathList`. Use `''` or `[]` for the
   * root. Passing `undefined` clears the field.
   */
  setFieldValue(fieldPath: string | FieldPathList, newValue?: unknown): void;
  /** Validates the current value, applies omitExtraData when enabled, calls onError for invalid data, and returns
   * the result immediately. In a controlled form, wait for the accepted value to render, or use
   * validateFormWithFormData() to check a proposed value directly.
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
