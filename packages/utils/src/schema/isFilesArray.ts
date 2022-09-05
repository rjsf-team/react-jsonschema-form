import { UI_WIDGET_KEY } from "../constants";
import { RJSFSchema, UiSchema, ValidatorType } from "../types";
import retrieveSchema from "./retrieveSchema";

/** Checks to see if the `schema` and `uiSchema` combination represents an array of files
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which check for array of files flag is desired
 * @param [uiSchema={}] - The UI schema from which to check the widget
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema/uiSchema contains an array of files, otherwise false
 */
export default function isFilesArray<T = any, F = any>(
  validator: ValidatorType,
  schema: RJSFSchema,
  uiSchema: UiSchema<T, F> = {},
  rootSchema?: RJSFSchema
) {
  if (uiSchema[UI_WIDGET_KEY] === "files") {
    return true;
  }
  if (schema.items) {
    const itemsSchema = retrieveSchema<T>(
      validator,
      schema.items as RJSFSchema,
      rootSchema
    );
    return itemsSchema.type === "string" && itemsSchema.format === "data-url";
  }
  return false;
}
