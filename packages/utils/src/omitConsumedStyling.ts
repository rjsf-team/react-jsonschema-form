import { UI_OPTIONS_KEY } from './constants.ts';
import isObject from './isObject.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the `uiSchema` to hand a field's children with the class names and style the field's own `FieldTemplate`
 * has already consumed removed from it, in all four spellings: `ui:classNames`, a bare `classNames`, `ui:style` and
 * the `ui:options.classNames`/`ui:options.style` equivalents. See #439: a child reading these off the `uiSchema` it
 * receives would apply the same classes and style a second time, inside the wrapper already carrying them.
 *
 * The original object is returned whenever there is nothing to strip, so a field memoizing the result keeps the
 * identity it had for the forms — the overwhelming majority — that declare no styling on the field at all.
 *
 * @param [uiSchema] - The uiSchema of the field whose `FieldTemplate` consumed the styling
 * @returns - The uiSchema for the field's children, stripped of the consumed styling
 */
export default function omitConsumedStyling<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema: UiSchema<T, S, F>): UiSchema<T, S, F>;
export default function omitConsumedStyling<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema?: UiSchema<T, S, F>): UiSchema<T, S, F> | undefined;
export default function omitConsumedStyling<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema?: UiSchema<T, S, F>): UiSchema<T, S, F> | undefined {
  if (!uiSchema) {
    return uiSchema;
  }
  // The caller's `uiSchema` has not necessarily been through `resolveUiSchema()`, so `ui:options` is not known to be
  // an object: `in` throws on anything else, and spreading a string would scatter its characters as keys
  const rawUiOptions = uiSchema[UI_OPTIONS_KEY];
  const consumedUiOptions = isObject(rawUiOptions) ? rawUiOptions : undefined;
  const consumesStyling =
    'ui:classNames' in uiSchema ||
    'classNames' in uiSchema ||
    'ui:style' in uiSchema ||
    (consumedUiOptions !== undefined && ('classNames' in consumedUiOptions || 'style' in consumedUiOptions));
  if (!consumesStyling) {
    return uiSchema;
  }
  const strippedUiSchema: UiSchema<T, S, F> = { ...uiSchema };
  delete strippedUiSchema['ui:classNames'];
  delete strippedUiSchema.classNames;
  delete strippedUiSchema['ui:style'];
  if (consumedUiOptions) {
    const { classNames: _classNames, style: _style, ...fieldUiOptions } = consumedUiOptions;
    strippedUiSchema[UI_OPTIONS_KEY] = fieldUiOptions;
  }
  return strippedUiSchema;
}
