import { UI_WIDGET_KEY } from '../constants';
import { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';

/** Checks to see if the `schema` and `uiSchema` combination represents an array of files
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which check for array of files flag is desired
 * @param [uiSchema={}] - The UI schema from which to check the widget
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema/uiSchema contains an array of files, otherwise false
 */
export default function isFilesArray<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  validator: ValidatorType<T, S, F>,
  schema: S,
  uiSchema: UiSchema<T, S, F> = {},
  rootSchema?: S
) {
  if (uiSchema[UI_WIDGET_KEY] === 'files') {
    return true;
  }
  if (schema.items) {
    const itemsSchema = retrieveSchema<T, S, F>(validator, schema.items as S, rootSchema);
    return itemsSchema.type === 'string' && itemsSchema.format === 'data-url';
  }
  return false;
}
