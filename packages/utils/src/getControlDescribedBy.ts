import { ariaDescribedByIds } from './idGenerators.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the `aria-describedby` a widget gives the focusable element that carries its `id`: the ids its field's plan
 * describes its control by, followed by the ids of the elements the widget renders to describe that control itself,
 * such as its examples list, each once. A widget rendered without a plan, as a `SchemaField`-less caller renders one, is
 * described by `ariaDescribedByIds()`
 *
 * @param props - The widget's `id` and `presentation`
 * @param [ownDescribedBy=[]] - The ids of the elements the widget renders to describe its control
 * @returns - The `aria-describedby`, or undefined when nothing describes the control
 */
export default function getControlDescribedBy<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>, ownDescribedBy: readonly string[] = []) {
  const { id, presentation } = props;
  if (!presentation) {
    return [ariaDescribedByIds(id), ...ownDescribedBy].join(' ');
  }
  const planned = presentation.control?.attributes['aria-describedby']?.split(' ') ?? [];
  return [...new Set([...planned, ...ownDescribedBy])].filter(Boolean).join(' ') || undefined;
}
