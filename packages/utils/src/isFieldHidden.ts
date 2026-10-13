import getDeprecatedHandling from './getDeprecatedHandling.ts';
import getUiOptions from './getUiOptions.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Answers whether `SchemaField` will hide a field: its `ui:widget` is `hidden`, or the schema is deprecated and the
 * handling resolves to `hide`. The inputs are resolved the way `SchemaField` resolves them before it decides - the
 * `uiSchema` through `resolveUiSchema()`, so a `ui:definitions` entry for the schema's `$ref` applies, and the
 * schema through `retrieveSchema()`, so a `deprecated` that only an `allOf` merge or an `if`/`then` branch
 * contributes is seen - so a container asking the question for a child it is about to render gets the same answer
 * the child will give itself.
 *
 * @param schema - The schema of the child field
 * @param uiSchema - The uiSchema of the child field
 * @param registry - The form registry, read for `rootSchema`, `uiSchemaDefinitions`, `schemaUtils` and
 *          `globalUiOptions`
 * @param [formData] - The child field's current formData, for the retrieval
 * @returns - True when the child field will render hidden
 */
export default function isFieldHidden<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  registry: Pick<Registry<T, S, F>, 'rootSchema' | 'uiSchemaDefinitions' | 'schemaUtils' | 'globalUiOptions'>,
  formData?: T,
): boolean {
  const uiOptions = getUiOptions<T, S, F>(
    resolveUiSchema<T, S, F>(schema, uiSchema, registry),
    registry.globalUiOptions,
  );
  const retrievedSchema = registry.schemaUtils.retrieveSchema(schema, formData);
  return uiOptions.widget === 'hidden' || getDeprecatedHandling<T, S, F>(retrievedSchema, uiOptions) === 'hide';
}
