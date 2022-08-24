import toConstant from "./toConstant";
import { RJSFSchema, EnumOptionsType } from "./types";

/** Gets the list of options from the schema. If the schema has an enum list, then those enum values are returned. The
 * labels for the options will be extracted from the non-standard, RJSF-deprecated `enumNames` if it exists, otherwise
 * the label will be the same as the `value`. If the schema has a `oneOf` or `anyOf`, then the value is the list of
 * `const` values from the schema and the label is either the `schema.title` or the value.
 *
 * @param schema - The schema from which to extract the options list
 * @returns - The list of options from the schema
 */
export default function optionsList(
  schema: RJSFSchema & { enumNames?: string[] }
): EnumOptionsType[] | undefined {
  if (schema.enumNames) {
    console.warn(
      "RJSF: The enumNames property is deprecated and may be removed in a future major release. For more info, see https://react-jsonschema-form.readthedocs.io/en/latest/usage/single/#custom-labels-for-enum-fields"
    );
  }
  if (schema.enum) {
    return schema.enum.map((value, i) => {
      const label = (schema.enumNames && schema.enumNames[i]) || String(value);
      return { label, value };
    });
  }
  const altSchemas = schema.oneOf || schema.anyOf;
  return (
    altSchemas &&
    altSchemas.map((aSchemaDef) => {
      const aSchema = aSchemaDef as RJSFSchema;
      const value = toConstant(aSchema);
      const label = aSchema.title || String(value);
      return {
        schema: aSchema,
        label,
        value,
      };
    })
  );
}
