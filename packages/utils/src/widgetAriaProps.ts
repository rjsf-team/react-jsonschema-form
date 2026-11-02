import getControlAriaLabel from './getControlAriaLabel.ts';
import getControlAttributes from './getControlAttributes.ts';
import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import uniqueIds from './uniqueIds.ts';

/** The props of a `SelectWidget` from which the name and the description of the control it renders are built: the
 * `aria-label` and `aria-describedby` its caller may hand it, the `label` and `placeholder` it is named by where no
 * label names it, and the props that decide whether it shows the description of its selected option
 */
export type WidgetAriaPropsInput<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SelectedOptionDescriptionProps<T, S, F> &
  Pick<WidgetProps<T, S, F>, 'aria-label' | 'aria-describedby' | 'label' | 'placeholder'>;

/** Return the `aria-label`, `aria-labelledby`, `aria-describedby` and `aria-invalid` a `SelectWidget` gives the element
 * a screen reader focuses, all of which belong on that element. A select its field's plan reaches takes the attributes
 * `getControlAttributes()` gives its control, with the ids its caller passed, then the selected option's description
 * id, added to the plan's describers, each id once, and the caller's `aria-label` over the plan's unless it is empty,
 * else, since a select shows its value rather than a name, the name `getControlAriaLabel()` gives it where no label
 * names it. A select rendered inside another widget, such as each date part of an
 * `AltDateWidget`, has an id of its own that no help or error element is rendered for, so it is given a plan of its
 * own, through which it is described by its field's parts. Without a plan, the caller's ids, even an empty
 * `aria-describedby`, replace the `ariaDescribedByIds()` a widget rendered without one falls back to, whose ids no
 * element may have.
 *
 * The selected option's description id is added only while `SelectedOptionDescription` renders it, the one element the
 * widget renders itself, so the description of the selected option is still announced. Otherwise the id is left out,
 * since no element has it.
 *
 * @param props - The widget's props, of which `id`, `presentation`, `aria-label`, `aria-describedby`, `label`,
 *   `placeholder` and those `SelectedOptionDescription` reads are used
 * @param [namedByWidget=false] - Whether the widget names the control itself, by a label it draws, as
 *   `widgetDrawsLabelText()` says for one that draws its field's label, or by an `aria-label` of its own, so it takes
 *   no fallback name
 * @returns - The `aria-label` and the attributes to spread on the focused element
 */
export default function widgetAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetAriaPropsInput<T, S, F>, namedByWidget = false): Omit<ControlAttributes, 'required'> {
  const { 'aria-label': ariaLabel, 'aria-describedby': callerDescribedBy, presentation } = props;
  const selected = getSelectedOptionDescription<T, S, F>(props);
  const addedDescribedBy = [...(callerDescribedBy?.split(' ') ?? []), ...(selected ? [selected.id] : [])];
  const attributes: Omit<ControlAttributes, 'required'> =
    callerDescribedBy !== undefined && !presentation
      ? { 'aria-describedby': uniqueIds(addedDescribedBy).join(' ') || undefined }
      : getControlAttributes<T, S, F>(props, addedDescribedBy);
  return {
    ...attributes,
    'aria-label': getControlAriaLabel<T, S, F>(props, ariaLabel || attributes['aria-label'], namedByWidget),
  };
}
