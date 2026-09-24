import { ADDITIONAL_PROPERTY_FLAG, UI_FIELD_KEY, UI_WIDGET_KEY } from '../constants.ts';
import getSchemaType from '../getSchemaType.ts';
import getUiOptions from '../getUiOptions.ts';
import isCustomWidget from '../isCustomWidget.ts';
import type {
  FormContextType,
  GlobalUISchemaOptions,
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
} from '../types.ts';
import isFilesArray from './isFilesArray.ts';
import isMultiSelect from './isMultiSelect.ts';

/** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
 * should be displayed in a UI.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which the display label flag is desired
 * @param [uiSchema={}] - The UI schema from which to derive potentially displayable information
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [globalOptions={}] - The optional Global UI Schema from which to get any fallback `xxx` options
 * @returns - True if the label should be displayed or false if it should not
 */
export default function getDisplayLabel<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(
  context: Readonly<SchemaContext<T, S, F>>,
  schema: S,
  uiSchema: UiSchema<T, S, F> = {},
  rootSchema?: S,
  globalOptions?: GlobalUISchemaOptions,
): boolean {
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalOptions);
  const { label = true } = uiOptions;
  let displayLabel = Boolean(label);
  if (displayLabel) {
    const schemaType = getSchemaType<S>(schema);
    const addedByAdditionalProperty = Boolean((schema as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG]);

    if (schemaType === 'array') {
      displayLabel =
        addedByAdditionalProperty ||
        isMultiSelect<T, S, F>(context, schema, rootSchema) ||
        isFilesArray<T, S, F>(context, schema, uiSchema, rootSchema) ||
        isCustomWidget(uiSchema);
    }

    if (schemaType === 'object') {
      displayLabel = addedByAdditionalProperty;
    }
    if (schemaType === 'boolean' && uiSchema && !uiSchema[UI_WIDGET_KEY]) {
      displayLabel = false;
    }
    if (uiSchema?.[UI_FIELD_KEY]) {
      displayLabel = false;
    }
  }
  return displayLabel;
}
