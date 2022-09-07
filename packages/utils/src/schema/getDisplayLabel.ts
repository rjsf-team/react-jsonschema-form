import { UI_FIELD_KEY, UI_WIDGET_KEY } from "../constants";
import getSchemaType from "../getSchemaType";
import getUiOptions from "../getUiOptions";
import isCustomWidget from "../isCustomWidget";
import { RJSFSchema, UiSchema, ValidatorType } from "../types";
import isFilesArray from "./isFilesArray";
import isMultiSelect from "./isMultiSelect";

/** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
 * should be displayed in a UI.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the display label flag is desired
 * @param [uiSchema={}] - The UI schema from which to derive potentially displayable information
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if the label should be displayed or false if it should not
 */
export default function getDisplayLabel<T = any, F = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  uiSchema: UiSchema<T, F> = {},
  rootSchema?: RJSFSchema
): boolean {
  const uiOptions = getUiOptions<T, F>(uiSchema);
  const { label = true } = uiOptions;
  let displayLabel = !!label;
  const schemaType = getSchemaType(schema);

  if (schemaType === "array") {
    displayLabel =
      isMultiSelect<T>(validator, schema, rootSchema) ||
      isFilesArray<T, F>(validator, schema, uiSchema, rootSchema) ||
      isCustomWidget(uiSchema);
  }

  if (schemaType === "object") {
    displayLabel = false;
  }
  if (schemaType === "boolean" && !uiSchema[UI_WIDGET_KEY]) {
    displayLabel = false;
  }
  if (uiSchema[UI_FIELD_KEY]) {
    displayLabel = false;
  }
  return displayLabel;
}
