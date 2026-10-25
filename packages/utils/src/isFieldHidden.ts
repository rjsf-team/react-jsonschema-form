import type { FormContextType, RJSFSchema, StrictRJSFSchema, UIOptionsType } from './types.ts';

/** Tells whether a field renders hidden: through its own `ui:widget: 'hidden'`, or under a resolved `deprecatedHandling`
 * of `'hide'`. `SchemaField` hides the field by it, and `isSchemaFieldHidden()` resolves its inputs as `SchemaField`
 * does for a field that has not rendered yet
 *
 * @param ownUiOptions - The field's own UI options, without the global ones: no global `widget` hides every field
 * @param deprecatedHandling - The field's handling of a `deprecated` schema, as `getDeprecatedHandling()` resolves it
 * @returns - True when the field renders hidden
 */
export default function isFieldHidden<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(ownUiOptions: UIOptionsType<T, S, F>, deprecatedHandling: 'hide' | 'disable' | 'label' | undefined): boolean {
  return ownUiOptions.widget === 'hidden' || deprecatedHandling === 'hide';
}
