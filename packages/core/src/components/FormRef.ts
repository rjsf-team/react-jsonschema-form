import type { FieldPathList, RJSFValidationError, ValidationData } from '@rjsf/utils';

import type { EventFormData } from './IChangeEvent.ts';

/** Public methods exposed by a Form ref.
 * Commands read and write Form's latest stored value, edits made earlier in the same tick included. Use event handlers
 * for user actions, or passive Effects for synchronization after prop changes. A command issued from the setup of a
 * layout Effect or from a callback ref being attached, in the commit that renders new props, sees those props too. The
 * cleanup of a layout Effect, a ref being detached or a `componentWillUnmount` in that commit may run earlier,
 * depending on where it sits in the tree, and then sees the previous configuration.
 */
export interface FormRef<T = unknown> {
  /** Reads the latest stored value. Treat the result as read-only. An edit can be visible here before the inputs
   * update.
   */
  getFormData(): EventFormData<T>;
  /** Submits the form through its element, as a submit button does: native constraint validation checks the inputs as
   * they are rendered, then schema validation checks the stored value, and `onSubmit` or `onError` is called before
   * this returns. An edit made in the same tick is submitted, while the native validation still sees the inputs as
   * rendered before it. Does nothing when `tagName` renders something other than a `<form>`.
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
