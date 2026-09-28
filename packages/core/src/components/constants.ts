/** Internal only symbol used by `Form` & `ObjectField` to mark an additional property element to be removed */
export const ADDITIONAL_PROPERTY_KEY_REMOVE = Symbol('remove-this-key');

/** Shared fallback for an absent `uiSchema`, so memo dependencies keep a stable identity across renders */
export const EMPTY_UI_SCHEMA: Readonly<Record<string, never>> = {};
