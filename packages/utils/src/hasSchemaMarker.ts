import type {
  ADDITIONAL_PROPERTY_FLAG,
  EXTRA_KEYS_ELSEWHERE_FLAG,
  GUESSED_TYPE_FLAG,
  RJSF_REF_CYCLE_KEY,
} from './constants.ts';

/** The markers that hold a flag rather than a value */
type SchemaFlagMarker =
  | typeof ADDITIONAL_PROPERTY_FLAG
  | typeof EXTRA_KEYS_ELSEWHERE_FLAG
  | typeof GUESSED_TYPE_FLAG
  | typeof RJSF_REF_CYCLE_KEY;

/** Whether `schema` carries the flag `marker` the schema utilities set on the schemas they build, such as the
 * `ADDITIONAL_PROPERTY_FLAG` `retrieveSchema()` sets on a property an `additionalProperties` adds. A boolean subschema,
 * which can stand wherever a schema can, carries none. It takes only the markers that hold a flag, since a marker that
 * holds a value, such as `RJSF_REF_KEY`, could hold one that reads as unset
 *
 * @param schema - The schema to check, which may be a boolean subschema
 * @param marker - The symbol of the flag marker
 * @returns - Whether the flag is set on `schema`
 */
export default function hasSchemaMarker(schema: unknown, marker: SchemaFlagMarker): boolean {
  return typeof schema === 'object' && schema !== null && Boolean(Reflect.get(schema, marker));
}
