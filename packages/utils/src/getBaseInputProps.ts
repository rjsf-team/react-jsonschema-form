import callerInputProps from './callerInputProps.ts';
import getInputProps from './getInputProps.ts';
import getNumericInputTitle from './getNumericInputTitle.ts';
import type {
  BaseInputTemplateProps,
  FormContextType,
  InputPropsType,
  Registry,
  RJSFSchema,
  StrictRJSFSchema,
} from './types.ts';

/** The props a theme's `BaseInputTemplate` puts on its input: the ones derived from the schema and options, overridden
 * by those `callerInputProps()` picks from the widget's props, and the `title` that names the derived numeric
 * `pattern`, which is left out when the widget replaces that pattern so it doesn't describe a rule no longer in force.
 * The widget's `multiple` is kept only for a file input, and set to undefined for any other so it also overrides one
 * spread from the template's other props: `ArrayField` passes it to any widget of a multi-select, and the template
 * can't tell that one from a `multiple` a widget means for an `email` input
 *
 * @param props - The props of the `BaseInputTemplate`
 * @param [plainNativeInput=true] - Whether the theme renders a plain native `<input>` for a number, which then gets a
 *        text input with a numeric `inputMode` and `pattern`
 * @returns - The input props, with the `title` to put before them so a `title` the caller sets wins
 */
export default function getBaseInputProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<
    BaseInputTemplateProps<T, S, F>,
    'schema' | 'type' | 'options' | 'accept' | 'inputMode' | 'multiple' | 'pattern'
  > & { registry: Pick<Registry, 'translateString'> },
  plainNativeInput = true,
): InputPropsType & { multiple?: boolean; title?: string } {
  const derived = getInputProps<T, S, F>(props.schema, props.type, props.options, plainNativeInput);
  const caller = callerInputProps(props);
  return {
    ...derived,
    ...caller,
    multiple: derived.type === 'file' ? props.multiple : undefined,
    title: 'pattern' in caller ? undefined : getNumericInputTitle(derived, props.registry.translateString),
  };
}
