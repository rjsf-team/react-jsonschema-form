/** Internal only symbol used by `Form` & `ObjectField` to mark an additional property element to be removed */
export const ADDITIONAL_PROPERTY_KEY_REMOVE = Symbol('remove-this-key');

/** `ADDITIONAL_PROPERTY_KEY_REMOVE` in the type of the value it stands in for, as `ObjectField` sends it through the
 * `onChange` of the property it removes. The overload is the one trust point that the form, which alone reads it,
 * takes it for the removal rather than as a value
 */
export function additionalPropertyRemoval<T>(): T;
export function additionalPropertyRemoval(): unknown {
  return ADDITIONAL_PROPERTY_KEY_REMOVE;
}

/** Shared fallback for an absent `uiSchema`, so memo dependencies keep a stable identity across renders. Frozen
 * because every field that falls back to it shares this one object, so a write would leak into all of them.
 */
export const EMPTY_UI_SCHEMA: Readonly<Record<string, never>> = Object.freeze({});
