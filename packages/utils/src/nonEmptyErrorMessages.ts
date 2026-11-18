/** Gets the error messages a `FieldErrorTemplate` draws: every message but an empty one, which would draw an empty item.
 * `''`, `null`, `undefined` and a boolean count as empty, while a numeric `0` is a message, as untyped error data, such
 * as `extraErrors` parsed from a server response, can hold either
 *
 * @param errors - The field's error messages
 * @returns - The messages to draw
 */
export default function nonEmptyErrorMessages<E>(errors: readonly E[]): E[] {
  return errors.filter((error) => error !== '' && error != null && typeof error !== 'boolean');
}
