import isConstantSelect from '../isConstantSelect.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Checks to see if the `schema` combination represents a select
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param theSchema - The schema for which check for a select flag is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema contains a select, otherwise false
 */
export default function isSelect<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: Readonly<SchemaContext<S, F>>, theSchema: S, rootSchema: S = {} as S) {
  const schema = retrieveSchema<T, S, F>(context, theSchema, rootSchema);
  return isConstantSelect<S>(schema, true);
}
