import toConstant from './toConstant';
import { RJSFSchema, EnumOptionsType, StrictRJSFSchema } from './types';

/** Gets the list of options from the schema. If the schema has an enum list, then those enum values are returned. The
 * labels for the options will be extracted from the non-standard, RJSF-deprecated `enumNames` if it exists, otherwise
 * the label will be the same as the `value`. If the schema has a `oneOf` or `anyOf`, then the value is the list of
 * `const` values from the schema and the label is either the `schema.title` or the value.
 *
 * @param schema - The schema from which to extract the options list
 * @param multiple - Whether the user can select mutliple enum values. Default is false.
 * @param placeholder - The placeholder text for the enum field
 * @returns - The list of options from the schema
 */
export default function optionsList<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  multiple = false,
  placeholder = ''
): EnumOptionsType<S>[] | undefined {
  // enumNames was deprecated in v5 and is intentionally omitted from the RJSFSchema type.
  // Cast the type to include enumNames so the feature still works.
  const schemaWithEnumNames = schema as S & { enumNames?: string[] };
  if (schemaWithEnumNames.enumNames && process.env.NODE_ENV !== 'production') {
    console.warn('The enumNames property is deprecated and may be removed in a future major release.');
  }

  const altSchemas = schema.oneOf || schema.anyOf;

  let options: EnumOptionsType<S>[] | undefined = undefined;
  if (schema.enum) {
    options = schema.enum.map((value, i) => {
      const label = (schemaWithEnumNames.enumNames && schemaWithEnumNames.enumNames[i]) || String(value);
      return { label, value };
    });
  } else if (altSchemas) {
    options = altSchemas.map((aSchemaDef) => {
      const aSchema = aSchemaDef as S;
      const value = toConstant(aSchema);
      const label = aSchema.title || String(value);
      return {
        schema: aSchema,
        label,
        value,
      };
    });
  }
  if (options && !multiple && schema.default === undefined) {
    options.unshift({ value: undefined, label: placeholder });
  }

  return options;
}
