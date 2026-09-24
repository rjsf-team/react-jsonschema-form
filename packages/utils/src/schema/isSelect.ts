import isConstant from '../isConstant.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Checks to see if the `schema` combination represents a select
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param theSchema - The schema for which check for a select flag is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema contains a select, otherwise false
 */
export default function isSelect<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  context: Readonly<SchemaContext<T, S, F>>,
  theSchema: S,
  rootSchema: S = {} as S,
) {
  const schema = retrieveSchema<T, S, F>(context, theSchema, rootSchema);
  const altSchemas = schema.oneOf || schema.anyOf;
  if (Array.isArray(schema.enum)) {
    return true;
  }
  if (Array.isArray(altSchemas)) {
    return altSchemas.every((altSchema) => typeof altSchema !== 'boolean' && isConstant(altSchema));
  }
  return false;
}
