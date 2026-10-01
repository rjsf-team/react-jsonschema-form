/** Reads a boolean `ui:` option, such as `ui:required`, `ui:hideError` or `ui:label`, the way JavaScript reads a
 * condition. uiSchemas are often untyped JSON, so an option typed `boolean` may hold `0`, `1`, `null` or a string at
 * runtime, and passing it through as is would, for instance, have a template rendering `label && <Label />` print a
 * stray `0`.
 *
 * @param value - The option's value, as read from the uiSchema
 * @returns - `undefined` when the option is not set, so callers can fall back with `??`, otherwise `Boolean(value)`
 */
export default function uiBooleanOption(value: unknown): boolean | undefined {
  return value === undefined ? undefined : Boolean(value);
}
