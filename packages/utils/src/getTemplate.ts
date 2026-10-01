import type { FormContextType, TemplatesType, Registry, UIOptionsType, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Returns the template with the given `name` from either the `uiSchema` if it is defined or from the `registry`
 * otherwise. NOTE, since `ButtonTemplates` are not overridden in `uiSchema` only those in the `registry` are returned.
 *
 * @param name - The name of the template to fetch, restricted to the keys of `TemplatesType`
 * @param registry - The `Registry` from which to read the template
 * @param [uiOptions={}] - The `UIOptionsType` from which to read an alternate template
 * @returns - The template from either the `uiSchema` or `registry` for the `name`
 */
export default function getTemplate<
  Name extends keyof TemplatesType<T, S, F>,
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(name: Name, registry: Registry<T, S, F>, uiOptions: UIOptionsType<T, S, F> = {}): TemplatesType<T, S, F>[Name] {
  const { templates } = registry;
  if (name === 'ButtonTemplates') {
    return templates[name];
  }
  const customTemplates: Record<string, unknown> = templates;
  const uiOverrides: Record<string, unknown> = uiOptions;
  // Allow templates to be customized per-field by using string keys from the registry
  const key = uiOverrides[name];
  if (typeof key === 'string' && Object.hasOwn(uiOverrides, name) && Object.hasOwn(customTemplates, key)) {
    // Indexing templates or uiOptions by a generic key results in TS2590: Expression produces a union type that is too
    // complex to represent, so both are read through string-keyed views and the result is cast back to the template type
    return customTemplates[key] as TemplatesType<T, S, F>[Name];
  }
  return (uiOverrides[name] as TemplatesType<T, S, F>[Name]) || templates[name];
}
