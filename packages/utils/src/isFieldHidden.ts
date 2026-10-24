import getDeprecatedHandling from './getDeprecatedHandling.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

/** Tells whether a field renders hidden: through `ui:widget: 'hidden'`, or as a `deprecated` schema under
 * `deprecatedHandling: 'hide'`. `SchemaField` hides the field by it and `ObjectField` marks the property `hidden` for
 * its `ObjectFieldTemplate` by it, so the two agree.
 *
 * @param schema - The retrieved schema of the field
 * @param uiOptions - The resolved UI options of the field, including the global ones
 * @returns - True when the field renders hidden
 */
export default function isFieldHidden<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(schema: S, uiOptions: UIOptionsType<T, S, F>): boolean {
  return uiOptions.widget === 'hidden' || getDeprecatedHandling<T, S, F>(schema, uiOptions) === 'hide';
}
