import getSelectedOptionDescription from './getSelectedOptionDescription.ts';
import { ariaDescribedByIds, descriptionId } from './idGenerators.ts';
import type { SelectedOptionDescriptionProps } from './SelectedOptionDescription.tsx';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** The props of a `SelectWidget` from which the name and the description of the control it renders are built: the
 * `aria-label` and `aria-describedby` its caller may hand it, and the props that decide whether it shows the
 * description of its selected option
 */
export type WidgetAriaPropsInput<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = SelectedOptionDescriptionProps<T, S, F> & Pick<WidgetProps<T, S, F>, 'aria-label' | 'aria-describedby'>;

/** Return the `aria-label` and `aria-describedby` a `SelectWidget` gives the element a screen reader focuses. A widget
 * rendered inside another one, such as each select of an `AltDateWidget`, has no label of its own and an id that no
 * help or error element is rendered for, so only the caller can name it and link it to its field. The ids the caller
 * passed are followed by `descriptionId(props.id)` only while `SelectedOptionDescription` renders that element, the
 * one the widget renders itself, so the description of the selected option is still announced. Otherwise the id is
 * left out: no element has it, and it may be another field's description id, as `root_when_year__description` is for
 * both the year select of `when` and a `when_year` property.
 *
 * @param props - The widget's props, of which `id`, `aria-label`, `aria-describedby` and those
 *   `SelectedOptionDescription` reads are used
 * @returns - The `aria-label` and `aria-describedby` to spread on the focused element
 */
export default function widgetAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetAriaPropsInput<T, S, F>) {
  const { id, 'aria-label': ariaLabel, 'aria-describedby': callerDescribedBy } = props;
  if (!callerDescribedBy) {
    return { 'aria-label': ariaLabel, 'aria-describedby': ariaDescribedByIds(id) };
  }
  const showsOptionDescription = !!getSelectedOptionDescription<T, S, F>(props);
  const describedBy = showsOptionDescription ? `${callerDescribedBy} ${descriptionId(id)}` : callerDescribedBy;
  return { 'aria-label': ariaLabel, 'aria-describedby': describedBy };
}
