import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import isSelect from './isSelect.ts';

/** Checks to see if the `schema` combination represents a multi-select
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which check for a multi-select flag is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema contains a multi-select, otherwise false
 */
export default function isMultiSelect<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(context: Readonly<SchemaContext<T, S, F>>, schema: S, rootSchema?: S) {
  if (!schema.uniqueItems || !schema.items || typeof schema.items === 'boolean') {
    return false;
  }
  return isSelect<T, S, F>(context, schema.items as S, rootSchema);
}
