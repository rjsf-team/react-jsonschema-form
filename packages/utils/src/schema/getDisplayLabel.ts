import { ADDITIONAL_PROPERTY_FLAG, UI_FIELD_KEY } from '../constants.ts';
import getUiOptions from '../getUiOptions.ts';
import { DEFAULT_BOOLEAN_WIDGET, getFieldTypeForUiSchema } from '../getWidget.tsx';
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
import resolveConstantOptions from './resolveConstantOptions.ts';

/** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
 * should be displayed in a UI.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param schema - The schema for which the display label flag is desired
 * @param [uiSchema={}] - The UI schema from which to derive potentially displayable information
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @param [globalOptions={}] - The optional Global UI Schema from which to get any fallback `xxx` options
 * @returns - True if the label should be displayed or false if it should not
 * @deprecated Kept through v7 for a field rendered without a plan: a field's plan, from `resolveFieldPresentation()`,
 *   says what draws its label
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
    // The label follows the field `SchemaField` renders: a `CheckboxWidget` on a `['number', 'boolean']` is a boolean's.
    // Only the field's own `ui:widget` picks that field, so the `ui:globalOptions` one is left out
    const schemaType = getFieldTypeForUiSchema<T, S, F>(schema, uiSchema);
    const addedByAdditionalProperty = Boolean((schema as RJSFMarkedSchema)[ADDITIONAL_PROPERTY_FLAG]);
    // A schema handed in as written holds a select's constants as `$ref`s, so they are read resolved
    const isWholeValue = () =>
      isWholeValueSelect<S>(rootSchema === undefined ? schema : resolveConstantOptions<S>(schema, rootSchema));

    // An `enum` or a constant `anyOf`/`oneOf` over objects or arrays renders as one select for the whole value, which is
    // labelled like any other select rather than left to the fields of its contents
    if (schemaType === 'array') {
      displayLabel =
        addedByAdditionalProperty ||
        isWholeValue() ||
        isMultiSelect<T, S, F>(context, schema, rootSchema) ||
        isFilesArray<T, S, F>(context, schema, uiSchema, rootSchema) ||
        isCustomWidget(uiSchema);
    }

    if (schemaType === 'object') {
      displayLabel = addedByAdditionalProperty || isWholeValue();
    }
    // A boolean is drawn by a checkbox, which renders the field's label itself after its input, so the template
    // renders none. Naming that same widget by the key it is registered under changes nothing about who draws that
    // label — read from the reduced options, so naming one through `ui:options.widget` reaches the same answer as
    // naming it through `ui:widget`. The `checkbox` alias is deliberately not matched here: a theme's `FieldTemplate`
    // keys its own checkbox layout on that exact spelling, taking over the field's description along with its label.
    // Under a plan, `getPresentationDeclaration()` finds the widget by its alias, its key or the component itself, and
    // its declaration, not this name match, says who draws the field's label, except where the fallback UI asks this
    // whether its template or its value field draws it (#5581)
    if (schemaType === 'boolean' && (!uiOptions.widget || uiOptions.widget === DEFAULT_BOOLEAN_WIDGET)) {
      displayLabel = false;
    }
    if (uiSchema[UI_FIELD_KEY]) {
      displayLabel = false;
    }
  }
  return displayLabel;
}
