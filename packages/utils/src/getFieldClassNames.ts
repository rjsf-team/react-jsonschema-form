import getSchemaType from './getSchemaType.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Builds the `classNames` string a `FieldTemplate` receives for a field: the `rjsf-field` marker every field
 * carries, the `rjsf-field-<type>` class naming the type of the field `SchemaField` renders, `rjsf-field-error` while
 * the field has errors to show, and finally whatever `ui:classNames` the field declares. Every field that renders a
 * `FieldTemplate` itself has to spell this list the same way, or a `rjsf-field*` CSS rule reaches some fields and not
 * others.
 *
 * @param schema - The schema of the field, from which the type class is derived
 * @param hasErrors - Whether the field has errors it is displaying, which adds the `rjsf-field-error` class
 * @param [uiClassNames] - The optional `ui:classNames` the field declares, appended last so it can override the rest
 * @param [fieldType] - The type of the field rendered, where a `ui:widget` or a `ui:field` makes it another type than
 *        the one `getSchemaType()` resolves `schema` to
 * @returns - The space-separated class list for the field
 */
export default function getFieldClassNames<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  hasErrors: boolean,
  uiClassNames?: string,
  fieldType: string | undefined = getSchemaType<S>(schema),
): string {
  const classNames = ['rjsf-field', `rjsf-field-${String(fieldType)}`];
  if (hasErrors) {
    classNames.push('rjsf-field-error');
  }
  if (uiClassNames) {
    classNames.push(uiClassNames);
  }
  return classNames.join(' ').trim();
}
