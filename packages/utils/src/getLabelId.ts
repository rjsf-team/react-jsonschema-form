import { fieldLabelId } from './idGenerators.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the id of a field's label, for a widget or template that draws it or names a control by it: the id the field's
 * plan gives the label, whoever draws it, which is numbered with `optionLabelId()` beneath a label a field above draws
 * under `fieldLabelId(id)`, or `fieldLabelId(id)` for one rendered without a plan
 *
 * @param props - The widget's or template's `id` and `presentation`
 * @returns - The id of the field's label
 */
export default function getLabelId<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>): string {
  const { id, presentation } = props;
  return presentation ? presentation.label.id : fieldLabelId(id);
}
