/** Whether `schema` carries the `marker` the schema utilities set on the schemas they build, such as the
 * `ADDITIONAL_PROPERTY_FLAG` `retrieveSchema()` sets on a property an `additionalProperties` adds. A boolean subschema,
 * which can stand wherever a schema can, carries none
 *
 * @param schema - The schema to check, which may be a boolean subschema
 * @param marker - The symbol of the marker
 * @returns - Whether the marker is set on `schema`
 */
export default function hasSchemaMarker(schema: unknown, marker: symbol): boolean {
  return typeof schema === 'object' && schema !== null && Boolean(Reflect.get(schema, marker));
}
