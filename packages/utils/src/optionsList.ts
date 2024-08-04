import toConstant from './toConstant';
import { RJSFSchema, EnumOptionsType, StrictRJSFSchema, FormContextType, UiSchema } from './types';
import getUiOptions from './getUiOptions';

/** Gets the list of options from the `schema`. If the schema has an enum list, then those enum values are returned. The
 * labels for the options will be extracted from the non-standard, RJSF-deprecated `enumNames` if it exists, otherwise
 * the label will be the same as the `value`. If the schema has a `oneOf` or `anyOf`, then the value is the list of
 * `const` values from the schema and the label is either the `schema.title` or the value. If a `uiSchema` is provided
 * and it has the `ui:enumNames` matched with `enum` or it has an associated `oneOf` or `anyOf` with a list of objects
 * containing `ui:title` then the UI schema values will replace the values from the schema.
 *
 * @param schema - The schema from which to extract the options list
 * @param [uiSchema] - The optional uiSchema from which to get alternate labels for the options
 * @returns - The list of options from the schema
 */
export default function optionsList<S extends StrictRJSFSchema = RJSFSchema, T = any, F extends FormContextType = any>(
  schema: S,
  uiSchema?: UiSchema<T, S, F>
): EnumOptionsType<S>[] | undefined {
  // TODO flip generics to move T first in v6
  const schemaWithEnumNames = schema as S & { enumNames?: string[] };
  if (schema.enum) {
    let enumNames: string[] | undefined;
    if (uiSchema) {
      const { enumNames: uiEnumNames } = getUiOptions<T, S, F>(uiSchema);
      enumNames = uiEnumNames;
    }
    if (!enumNames && schemaWithEnumNames.enumNames) {
      // enumNames was deprecated in v5 and is intentionally omitted from the RJSFSchema type.
      // Cast the type to include enumNames so the feature still works.
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'The "enumNames" property in the schema is deprecated and will be removed in a future major release. Use the "ui:enumNames" property in the uiSchema instead.'
        );
      }
      enumNames = schemaWithEnumNames.enumNames;
    }
    return schema.enum.map((value, i) => {
      const label = enumNames?.[i] || String(value);
      return { label, value };
    });
  }
  let altSchemas: S['anyOf'] | S['oneOf'] = undefined;
  let altUiSchemas: UiSchema<T, S, F> | undefined = undefined;
  if (schema.anyOf) {
    altSchemas = schema.anyOf;
    altUiSchemas = uiSchema?.anyOf;
  } else if (schema.oneOf) {
    altSchemas = schema.oneOf;
    altUiSchemas = uiSchema?.oneOf;
  }
  return (
    altSchemas &&
    altSchemas.map((aSchemaDef, index) => {
      const { title } = getUiOptions<T, S, F>(altUiSchemas?.[index]);
      const aSchema = aSchemaDef as S;
      const value = toConstant(aSchema);
      const label = title || aSchema.title || String(value);
      return {
        schema: aSchema,
        label,
        value,
      };
    })
  );
}
