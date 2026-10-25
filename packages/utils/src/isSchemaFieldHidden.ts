import { RJSF_REF_CYCLE_KEY } from './constants.ts';
import getDeprecatedHandling from './getDeprecatedHandling.ts';
import getUiOptions from './getUiOptions.ts';
import resolveUiSchema from './resolveUiSchema.ts';
import { expandRefCycle } from './schema/retrieveSchema.ts';
import type { FormContextType, Registry, RJSFMarkedSchema, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** The last answer per registry and schema object, with the uiSchema and data it was given for */
const lastAnswers = new WeakMap<object, WeakMap<object, { uiSchema: unknown; formData: unknown; hidden: boolean }>>();

/** Tells whether the `SchemaField` rendered with `schema`, `uiSchema` and `formData` hides its field: through its own
 * `ui:widget: 'hidden'`, as its `ui:definitions` entry resolves it, or a `deprecatedHandling` of `'hide'`, read with the
 * global UI options over the retrieved schema's `deprecated`. `SchemaField` hides its field by it, and a container
 * laying out a field it has not rendered yet, such as `ObjectField` for its `ObjectFieldTemplate`, calls it with the
 * props it hands that field, so both agree. A `$ref` cycle renders an Expand button, which hides nothing, until it is
 * expanded, and then the field one level further. The answer is kept per schema object for the uiSchema, data and
 * registry it was given, so a field whose own inputs are unchanged is not resolved again
 *
 * @param schema - The field's schema, as handed to `SchemaField`
 * @param uiSchema - The field's uiSchema, as handed to `SchemaField`
 * @param formData - The field's data
 * @param registry - The registry
 * @param [expanded=false] - Whether the field is a `$ref` cycle the user has expanded
 * @returns - True when the field renders hidden
 */
export default function isSchemaFieldHidden<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  schema: S,
  uiSchema: UiSchema<T, S, F> | undefined,
  formData: T | undefined,
  registry: Registry<T, S, F>,
  expanded = false,
): boolean {
  const isRefCycle = Boolean((schema as RJSFMarkedSchema)[RJSF_REF_CYCLE_KEY]);
  if (isRefCycle && !expanded) {
    return false;
  }
  // A boolean schema a cast got here is no key a `WeakMap` takes, so it is resolved uncached
  const cacheable = typeof schema === 'object' && schema !== null;
  let answers = cacheable ? lastAnswers.get(registry) : undefined;
  const last = answers?.get(schema);
  if (last && last.uiSchema === uiSchema && last.formData === formData) {
    return last.hidden;
  }
  const { schemaUtils, globalUiOptions } = registry;
  const fieldSchema = isRefCycle ? expandRefCycle<S>(schema, schemaUtils.getRootSchema()) : schema;
  // Only the field's own options name its widget, so no global `widget` hides every field
  const ownUiOptions = getUiOptions<T, S, F>(resolveUiSchema<T, S, F>(fieldSchema, uiSchema, registry));
  const uiOptions = { ...globalUiOptions, ...ownUiOptions };
  // Only a `'hide'` handling reads the retrieved schema, so the retrieval is skipped otherwise
  const hidden =
    ownUiOptions.widget === 'hidden' ||
    (uiOptions.deprecatedHandling === 'hide' &&
      getDeprecatedHandling<T, S, F>(schemaUtils.retrieveSchema(fieldSchema, formData), uiOptions) === 'hide');
  if (cacheable) {
    if (!answers) {
      answers = new WeakMap();
      lastAnswers.set(registry, answers);
    }
    answers.set(schema, { uiSchema, formData, hidden });
  }
  return hidden;
}
