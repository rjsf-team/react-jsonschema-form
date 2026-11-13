import deepEquals from './deepEquals.ts';
import retrieveSchema from './schema/retrieveSchema.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from './types.ts';

/** Returns a guard that throws when the `schema` it is given is neither the `rootSchema` a precompiled validator was
 * compiled from nor that schema's resolution for the `formData`. A schema is compared once per object: one the guard
 * accepted before is accepted again without comparing, including when it was changed since or, for a resolution, the
 * data differs from the data it was resolved for. A form validates with the same schema object until its schema
 * changes, and passes the resolution for the data being validated, so the comparison runs once per schema rather
 * than on every validation
 *
 * @param schemaContext - The context to resolve the `rootSchema` with: the validator itself and the merge its schemas
 *        were compiled with, since only that merge builds the sub-schemas a precompiled map holds
 * @param rootSchema - The root schema the validator was compiled from
 * @returns - A function that takes the `schema` to validate with and the `formData` the schema may have been resolved
 *          for, and throws when the schema is neither the `rootSchema` nor its resolution
 */
export default function createRootSchemaGuard<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schemaContext: SchemaContext<S, F>, rootSchema: S): (schema: S, formData?: unknown) => void {
  const accepted = new WeakSet<object>();
  return (schema, formData) => {
    if (accepted.has(schema)) {
      return;
    }
    if (
      !deepEquals(schema, rootSchema) &&
      !deepEquals(schema, retrieveSchema(schemaContext, rootSchema, rootSchema, formData))
    ) {
      throw new Error(
        'The schema associated with the precompiled validator differs from the rootSchema provided for validation',
      );
    }
    accepted.add(schema);
  };
}
