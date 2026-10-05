import { ADDITIONAL_PROPERTY_FLAG, UI_FIELD_KEY } from '../constants.ts';
import getUiOptions from '../getUiOptions.ts';
import { DEFAULT_BOOLEAN_WIDGET, getFieldTypeForWidget } from '../getWidget.tsx';
import isCustomWidget from '../isCustomWidget.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import type {
  FormContextType,
  GlobalUISchemaOptions,
  RJSFMarkedSchema,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
  UiSchema,
} from '../types.ts';
import uiBooleanOption from '../uiBooleanOption.ts';
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  schema: S,
  uiSchema: UiSchema<T, S, F> = {},
  rootSchema?: S,
  globalOptions?: GlobalUISchemaOptions,
): boolean {
  const uiOptions = getUiOptions<T, S, F>(uiSchema, globalOptions);
  let displayLabel = uiBooleanOption(uiOptions.label) ?? true;
  if (displayLabel) {
    // The label follows the field `SchemaField` renders: a `CheckboxWidget` on a `['number', 'boolean']` is a boolean's
    const schemaType = getFieldTypeForWidget<S>(schema, uiOptions.widget);
    const addedByAdditionalProperty = Boolean((schema as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG]);

    // An `enum` or a constant `anyOf`/`oneOf` over objects or arrays renders as one select for the whole value, which is
    // labelled like any other select rather than left to the fields of its contents
    if (schemaType === 'array') {
      displayLabel =
        addedByAdditionalProperty ||
        isWholeValueSelect<S>(schema) ||
        isMultiSelect<T, S, F>(context, schema, rootSchema) ||
        isFilesArray<T, S, F>(context, schema, uiSchema, rootSchema) ||
        isCustomWidget(uiSchema);
    }

    if (schemaType === 'object') {
      displayLabel = addedByAdditionalProperty || isWholeValueSelect<S>(schema);
    }
    // A boolean is drawn by a checkbox, which renders the field's label itself after its input, so the template
    // renders none. Naming that same widget by the key it is registered under changes nothing about who draws that
    // label — read from the reduced options, so naming one through `ui:options.widget` reaches the same answer as
    // naming it through `ui:widget`. The `checkbox` alias is deliberately not matched here: a theme's `FieldTemplate`
    // keys its own checkbox layout on that exact spelling, taking over the field's description along with its label.
    // Matching a widget by name at all is provisional; resolving it against the registry is #5389
    if (schemaType === 'boolean' && (!uiOptions.widget || uiOptions.widget === DEFAULT_BOOLEAN_WIDGET)) {
      displayLabel = false;
    }
    if (uiSchema[UI_FIELD_KEY]) {
      displayLabel = false;
    }
  }
  return displayLabel;
}
