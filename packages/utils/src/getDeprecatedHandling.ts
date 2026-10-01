import type { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

/** Resolves how a field has to render a schema marked `deprecated`: `label` appends a marker to the label it hands
 * its `FieldTemplate`, `disable` disables the field, and `hide` tells the `FieldTemplate` the field is hidden.
 * Returns undefined for a schema that is not deprecated, so a caller can treat the three modes as the only cases.
 * Every field that builds its own `FieldTemplate` props has to resolve this the same way, including the `label`
 * default a schema that is deprecated without a `ui:deprecatedHandling` falls back to.
 *
 * @param schema - The schema of the field, whose `deprecated` keyword gates the whole resolution
 * @param uiOptions - The resolved UI options of the field, read for a `deprecatedHandling` override
 * @returns - The handling to apply, or undefined when the schema is not deprecated
 */
export default function getDeprecatedHandling<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiOptions: UIOptionsType<T, S, F>): 'hide' | 'disable' | 'label' | undefined {
  return schema.deprecated ? (uiOptions.deprecatedHandling ?? 'label') : undefined;
}
