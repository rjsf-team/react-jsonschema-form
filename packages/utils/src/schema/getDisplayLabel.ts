import { ADDITIONAL_PROPERTY_FLAG, UI_FIELD_KEY, UI_WIDGET_KEY } from '../constants.ts';
import getSchemaType from '../getSchemaType.ts';
import getUiOptions from '../getUiOptions.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import isConstantOptionList from '../isConstantOptionList.ts';
import isCustomWidget from '../isCustomWidget.ts';
import type {
  FormContextType,
  GlobalUISchemaOptions,
  RJSFMarkedSchema,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  ValidatorType,
  CustomMergeAllOf,
} from '../types.ts';
import isFilesArray from './isFilesArray.ts';
import isMultiSelect from './isMultiSelect.ts';

/** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
 * should be displayed in a UI.
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which the display label flag is desired
 * @param [uiSchema={}] - The UI schema from which to derive potentially displayable information
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [globalOptions={}] - The optional Global UI Schema from which to get any fallback `xxx` options
 * @param [customMergeAllOf] - Optional function that allows for custom merging of `allOf` schemas
 * @returns - True if the label should be displayed or false if it should not
 */
export default function getDisplayLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  validator: ValidatorType<S, F>,
  schema: S,
  uiSchema: UiSchema<T, S, F> = {},
  rootSchema?: S,
  globalOptions?: GlobalUISchemaOptions,
  customMergeAllOf?: CustomMergeAllOf<S>,
): boolean {
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalOptions);
  const { label = true } = uiOptions;
  let displayLabel = Boolean(label);
  if (displayLabel) {
    const schemaType = getSchemaType<S>(schema);
    const addedByAdditionalProperty = Boolean((schema as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG]);
    // A constant `anyOf`/`oneOf` over objects or arrays renders as one select for the whole value, which is labelled
    // like any other select rather than left to the fields of its contents
    const xxxOfKey = getXxxOfKey<S>(schema);
    const isConstantSelect = xxxOfKey !== undefined && isConstantOptionList<S>(schema[xxxOfKey]);

    if (schemaType === 'array') {
      displayLabel =
        addedByAdditionalProperty ||
        isConstantSelect ||
        isMultiSelect<T, S, F>(validator, schema, rootSchema, customMergeAllOf) ||
        isFilesArray<T, S, F>(validator, schema, uiSchema, rootSchema, customMergeAllOf) ||
        isCustomWidget(uiSchema);
    }

    if (schemaType === 'object') {
      displayLabel = addedByAdditionalProperty || isConstantSelect;
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
