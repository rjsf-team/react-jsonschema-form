import { TranslatableString } from './enums.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the name a control takes where no label names it, for one that takes no name from what it displays, such as a
 * combobox trigger, whose contents are its value: the field's label, else its `placeholder`, which is all an author has
 * said about a field with no title, such as an array item, as a native input falls back to it for its name, and last the
 * translated `prompt`. A widget gives it as the control's `aria-label` where `isNamedByTemplateLabel()` says no label
 * the template draws names the control, and its caller handed it no `aria-label` of its own
 *
 * @param props - The widget's `label`, `placeholder` and `registry`
 * @param [prompt=TranslatableString.SelectPlaceholder] - The prompt a field with neither is named by
 * @returns - The name
 */
export default function getControlFallbackName<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'label' | 'placeholder' | 'registry'>,
  prompt: TranslatableString = TranslatableString.SelectPlaceholder,
): string {
  const { label, placeholder, registry } = props;
  return label || placeholder || registry.translateString(prompt);
}
