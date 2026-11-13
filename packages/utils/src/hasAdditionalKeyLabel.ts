import templateDrawsLabel from './templateDrawsLabel.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WrapIfAdditionalTemplateProps } from './types.ts';

/** Whether the key input of an `additionalProperties` entry is labelled, which it is wherever the entry's value is,
 * whether the template or the value's own component draws that label, so the key lines up with it. Without a plan, as
 * for a template rendered outside `SchemaField`, it follows `displayLabel`
 *
 * @param props - The `displayLabel` and `presentation` of the `WrapIfAdditionalTemplate`
 * @returns - True when the key input is labelled
 */
export default function hasAdditionalKeyLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WrapIfAdditionalTemplateProps<T, S, F>, 'displayLabel' | 'presentation'>) {
  const { presentation } = props;
  return presentation ? presentation.label.by !== 'none' : templateDrawsLabel<T, S, F>(props);
}
