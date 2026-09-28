/** Internal only symbol used by `Form` & `ObjectField` to mark an additional property element to be removed */
export const ADDITIONAL_PROPERTY_KEY_REMOVE = Symbol('remove-this-key');

/** Shared fallback for an absent `uiSchema`, so memo dependencies keep a stable identity across renders. Frozen
 * because every field that falls back to it shares this one object, so a write would leak into all of them.
 */
export const EMPTY_UI_SCHEMA: Readonly<Record<string, never>> = Object.freeze({});
