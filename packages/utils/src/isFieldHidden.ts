import { RJSF_REF_CYCLE_KEY } from './constants.ts';
import getDeprecatedHandling from './getDeprecatedHandling.ts';
import getUiOptions from './getUiOptions.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import type {
  FormContextType,
  Registry,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  UIOptionsType,
} from './types.ts';

/** The keywords whose resolution can merge a `deprecated` into a schema that does not carry one itself. */
const DEPRECATED_CONTRIBUTING_KEYS = ['$ref', 'allOf', 'anyOf', 'oneOf', 'if', 'then', 'else', 'dependencies'] as const;

/** The hide decision itself, on inputs the caller has already resolved. `SchemaField` and `LayoutMultiSchemaField`
 * decide through this, so the answer `isFieldHidden()` predicts for them holds by construction.
 *
 * @param uiOptions - The resolved UI options of the field
 * @param schema - The schema of the field, retrieved for its data unless it is a ref cycle
 * @returns - True when the field renders hidden
 */
export function isFieldHiddenDecision<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiOptions: UIOptionsType<T, S, F>, schema: S): boolean {
  return uiOptions.widget === 'hidden' || getDeprecatedHandling<T, S, F>(schema, uiOptions) === 'hide';
}

/** Answers whether `SchemaField` will hide a field: its `ui:widget` is `hidden`, or the schema is deprecated and the
 * handling resolves to `hide`. The inputs are resolved the way `SchemaField` resolves them before it decides - the
 * `uiSchema` through `resolveUiSchema()`, so a `ui:definitions` entry for the schema's `$ref` applies, and the
 * schema through `retrieveSchema()`, so a `deprecated` that only an `allOf` merge or an `if`/`then` branch
 * contributes is seen - so a container asking the question for a child it is about to render gets the same answer
 * the child will give itself. The retrieval runs only when the raw schema cannot answer on its own: a schema
 * flagged as a ref cycle is decided raw, the way `SchemaField` renders it, and a schema with no keyword that could
 * contribute a `deprecated` keeps its own through retrieval, so neither pays for the resolution.
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
  const isRefCycle = Boolean((schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]);
  const mayContributeDeprecated =
    typeof schema === 'object' && DEPRECATED_CONTRIBUTING_KEYS.some((key) => key in schema);
  const retrievedSchema =
    isRefCycle || !mayContributeDeprecated ? schema : registry.schemaUtils.retrieveSchema(schema, formData);
  return isFieldHiddenDecision<T, S, F>(uiOptions, retrievedSchema);
}
